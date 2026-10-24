// 피부 일지 사진 — PIN 쿠키 필요(읽기 requireReader · 쓰기는 꼼이만 requireWriter). 사진은 Storage skin/kkomi/{날짜}/{id}.jpg (규칙상 클라 차단, Admin만).
//   GET    ?date=YYYY-MM-DD            → { photos: [{ id, url, t }] }  (url = 15분짜리 서명 주소)
//   POST   form-data { date, file, slot? } → { photo } (slot = 아침·점심·저녁·밤 메모 칸) — 브라우저에서 긴 변 1600px JPEG로 줄여 보낸다(최대 4MB)
//   DELETE ?date=…&id=…               → 기록에서 빼고 파일은 휴지통으로(안 지움)
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireReader, requireWriter } from '@/lib/skinAuth';
import { adminBucket, adminDb } from '@/lib/firebaseAdmin';
import { DATE_RE, MEMO_SLOTS, SKIN_OWNER, SKIN_PHOTO_TRASH, SKIN_TRASH_DIR, emptyLog, type MemoSlot, skinLogPath, type SkinLog, type SkinPhoto } from '@/lib/skinTypes';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PER_DAY = 24;   // 아침·점심·저녁·밤 칸마다 사진(2026-10-24) — 하루 합계
const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const newId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36);

async function signed(path: string): Promise<string> {
  const [url] = await adminBucket()!.file(path).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000 });
  return url;
}

export async function GET(req: NextRequest) {
  const who = await requireReader();
  if (who instanceof NextResponse) return who;
  const date = req.nextUrl.searchParams.get('date') ?? '';
  if (!DATE_RE.test(date)) return NextResponse.json({ error: 'bad_date' }, { status: 400 });
  const log = (await adminDb()!.doc(skinLogPath(date)).get()).data() as SkinLog | undefined;
  const photos = await Promise.all((log?.photos ?? []).filter((p) => p.path.startsWith(`skin/${SKIN_OWNER}/`))
    .map(async (p) => ({ id: p.id, t: p.t ?? null, slot: p.slot ?? null, url: await signed(p.path) })));
  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const who = await requireWriter();
  if (who instanceof NextResponse) return who;
  const form = await req.formData().catch(() => null);
  const date = String(form?.get('date') ?? '');
  const file = form?.get('file');
  const slotRaw = String(form?.get('slot') ?? '');
  const slot = (MEMO_SLOTS as readonly string[]).includes(slotRaw) ? (slotRaw as MemoSlot) : null;   // 아침·점심·저녁·밤 메모 칸
  if (!DATE_RE.test(date) || date > kstToday()) return NextResponse.json({ error: 'bad_date' }, { status: 400 });
  if (!(file instanceof Blob) || !file.type.startsWith('image/')) return NextResponse.json({ error: 'not_image' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_big' }, { status: 413 });

  const db = adminDb()!;
  const ref = db.doc(skinLogPath(date));
  const now = new Date().toISOString();
  const snap = await ref.get();
  const log = snap.data() as SkinLog | undefined;
  if ((log?.photos ?? []).length >= MAX_PER_DAY) return NextResponse.json({ error: 'too_many' }, { status: 429 });

  const id = newId();
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `skin/${SKIN_OWNER}/${date}/${id}.${ext}`;
  await adminBucket()!.file(path).save(Buffer.from(await file.arrayBuffer()), {
    resumable: false,
    contentType: file.type,
    metadata: { cacheControl: 'private, max-age=0' },
  });
  const photo: SkinPhoto = { id, path, t: now, slot };
  // 기록 저장(PUT)과 겹쳐도 서로 안 덮어쓰게 사진 목록은 추가(arrayUnion)로만 바꾼다
  if (snap.exists) await ref.update({ photos: FieldValue.arrayUnion(photo), updatedAt: now });
  else await ref.set({ ...emptyLog(date, now), photos: [photo] });
  return NextResponse.json({ photo: { id, t: now, slot, url: await signed(path) } });
}

export async function DELETE(req: NextRequest) {
  const who = await requireWriter();
  if (who instanceof NextResponse) return who;
  const date = req.nextUrl.searchParams.get('date') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!DATE_RE.test(date) || !id) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const ref = adminDb()!.doc(skinLogPath(date));
  const log = (await ref.get()).data() as SkinLog | undefined;
  const target = log?.photos?.find((p) => p.id === id);
  if (!log || !target) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  // 지운 사진도 파일은 휴지통(skin/_trash/kkomi/…)으로 옮기기만 한다 — 잘못 지워도 되살릴 수 있게(우댕: 기록이 절대 날아가면 안 됨)
  const removedAt = new Date().toISOString();
  if (target.path.startsWith(`skin/${SKIN_OWNER}/`)) {
    const trashPath = `${SKIN_TRASH_DIR}/${date}/${id}.jpg`;
    const moved = await adminBucket()!.file(target.path).move(trashPath).then(() => true).catch(() => false);
    await adminDb()!.doc(SKIN_PHOTO_TRASH).set({
      items: FieldValue.arrayUnion({ date, id, t: target.t ?? null, path: moved ? trashPath : target.path, from: target.path, removedAt }),
    }, { merge: true });
  }
  await ref.update({ photos: FieldValue.arrayRemove(target), updatedAt: removedAt });
  return NextResponse.json({ ok: true });
}
