// 꼼이어리 휴지통 비우기 — 매일 KST 03:30. 지운 지 30일이 지난 장을 하위 문서·파일까지 지운다.
// 선점한 뒤 현재 장·남은 휴지통이 쓰는 파일을 다시 확인한다. 실패한 작업은 diaryTrashPurge에 남겨 다음 날 다시 한다.
import { NextResponse, type NextRequest } from 'next/server';
import type { DocumentSnapshot, Firestore } from 'firebase-admin/firestore';
import { adminBucket, adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET || '';
const DAY = 24 * 60 * 60 * 1000;
const KEEP_DAYS = 30; // lib/diary.ts DIARY_TRASH_DAYS와 같다
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const OWNER = /^(udaeng|kkomi)$/;

function authorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  return req.headers.get('authorization') === `Bearer ${CRON_SECRET}` || req.nextUrl.searchParams.get('key') === CRON_SECRET;
}

type Item = { path?: unknown; strokePath?: unknown };
const pathsIn = (items: unknown, prefix: string): string[] =>
  (Array.isArray(items) ? (items as Item[]) : [])
    .flatMap((i) => [i?.path, i?.strokePath])
    .filter((p): p is string => typeof p === 'string' && p.startsWith(prefix) && !p.includes('..'));

/** 휴지통 문서가 지울 수 있는 그 사람·그 날짜 폴더. 모양이 이상하면 파일을 건드리지 않는다. */
function folderOf(d: DocumentSnapshot): string | null {
  const date = d.get('date'), owner = d.get('owner');
  if (typeof date !== 'string' || !YMD.test(date) || typeof owner !== 'string' || !OWNER.test(owner)) return null;
  return `diary/${owner}/${date.slice(0, 4)}/${date.slice(5, 7)}/${date}_${owner}/`;
}

/** 지울 때 남긴 빈 판이 아직 그대로면 notes·content·표지까지 한 트랜잭션으로 치운다. 새 장으로 다시 썼으면 건드리지 않는다. */
async function cleanClearedPage(db: Firestore, job: DocumentSnapshot): Promise<boolean> {
  const date = job.get('date'), owner = job.get('owner'), clearedRevision = job.get('clearedRevision');
  if (typeof clearedRevision !== 'number') return true; // 되살리며 맞바꾼 장은 빈 판을 만든 적이 없다
  if (typeof date !== 'string' || !YMD.test(date) || typeof owner !== 'string' || !OWNER.test(owner)) return false;
  const page = db.doc(`diaryPages/${date}_${owner}`);
  const content = page.collection('content').doc('main');
  return db.runTransaction(async (tx) => {
    const cur = await tx.get(content);
    if (!cur.exists) return true;
    const items = cur.get('items');
    const empty = !String(cur.get('text') ?? '').trim() && (!Array.isArray(items) || items.length === 0);
    if (cur.get('revision') !== clearedRevision || !empty) return true; // 같은 날짜를 새로 썼거나 되살렸다
    const notes = await tx.get(page.collection('notes'));
    notes.docs.forEach((n) => tx.delete(n.ref));
    tx.delete(content);
    tx.delete(page);
    return true;
  }).catch((e) => { console.warn('[diary-trash] 빈 장·한마디 삭제 실패(다음에 다시):', job.ref.path, e); return false; });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = adminDb(), bucket = adminBucket();
  if (!db || !bucket) return NextResponse.json({ error: 'admin_not_configured' }, { status: 503 });
  const cutoff = Date.now() - KEEP_DAYS * DAY;

  // ① 기한 지난 문서를 서버 전용 작업 컬렉션으로 선점 — 이 순간부터 되살리기는 실패한다.
  const trash = await db.collection('diaryTrash').get();
  let claimed = 0;
  for (const t of trash.docs) {
    const at = t.get('deletedAt');
    if (typeof at?.toMillis !== 'function' || at.toMillis() >= cutoff) continue;
    const job = db.collection('diaryTrashPurge').doc(t.id);
    await db.runTransaction(async (tx) => {
      const cur = await tx.get(t.ref);
      if (!cur.exists) return false;
      tx.set(job, { ...cur.data(), claimedAt: new Date() });
      tx.delete(t.ref);
      return true;
    }).then((took) => { if (took) claimed++; }).catch((e) => console.warn('[diary-trash] 선점 실패:', t.ref.path, e));
  }

  // ② 현재 장과 아직 남은 휴지통이 쓰는 파일은 보존하고, ③ 파일·하위 문서까지 끝낸 작업만 지운다.
  const jobs = await db.collection('diaryTrashPurge').get();
  const left = await db.collection('diaryTrash').get();
  let done = 0, files = 0, kept = 0, failed = 0;
  for (const job of jobs.docs) {
    const folder = folderOf(job);
    let ok = !!folder;
    if (!folder) console.warn('[diary-trash] 날짜·주인 모양이 이상해 남겨 둠:', job.ref.path);
    if (folder) {
      const date = job.get('date'), owner = job.get('owner');
      const inUse = new Set<string>();
      const current = await db.doc(`diaryPages/${date}_${owner}/content/main`).get().catch(() => null);
      if (!current) ok = false;
      pathsIn(current?.get('items'), folder).forEach((p) => inUse.add(p));
      left.docs.forEach((t) => pathsIn(t.get('items'), folder).forEach((p) => inUse.add(p)));
      if (ok) {
        for (const path of new Set(pathsIn(job.get('items'), folder))) {
          if (inUse.has(path)) { kept++; continue; }
          try { await bucket.file(path).delete({ ignoreNotFound: true }); files++; }
          catch (e) { ok = false; console.warn('[diary-trash] 파일 삭제 실패(다음에 다시):', path, e); }
        }
      }
    }
    if (ok) ok = await cleanClearedPage(db, job);
    if (!ok) { failed++; continue; }
    await job.ref.delete().then(() => { done++; }).catch((e) => { failed++; console.warn('[diary-trash] 작업 문서 삭제 실패:', job.ref.path, e); });
  }

  console.log(`[diary-trash] 휴지통 ${trash.size}장 · 선점 ${claimed} · 끝냄 ${done} · 파일 ${files}개 지움 · 쓰는 중이라 남김 ${kept} · 다음에 다시 ${failed}`);
  return NextResponse.json({ total: trash.size, claimed, done, files, kept, failed });
}
