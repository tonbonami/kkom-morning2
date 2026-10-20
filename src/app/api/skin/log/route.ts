// 피부 일지 하루 기록 — 꼼이 세션 쿠키 필요(requireOwner).
//   GET ?date=YYYY-MM-DD           → { log | null }
//   GET ?from=YYYY-MM-DD&to=…      → { logs: [...] } (최대 120일)
//   PUT { date, ...바꿀 필드 }       → 합쳐서 저장, uas 다시 계산. 오늘 기록이면 날씨·습도·미세먼지를 한 번 붙인다.
import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/skinAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { DATE_RE, emptyLog, sanitizeLogPatch, skinLogPath, uasOf, SKIN_OWNER, type SkinEnv, type SkinLog } from '@/lib/skinTypes';

export const dynamic = 'force-dynamic';

const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const finite = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// 기존 /api/weather(기상청, 기온·습도)·/api/air(에어코리아, PM)를 그대로 불러 쓴다.
async function envSnapshot(origin: string): Promise<SkinEnv | null> {
  const [w, a] = await Promise.all([
    fetch(`${origin}/api/weather`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    fetch(`${origin}/api/air`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
  ]);
  const env: SkinEnv = {
    temp: finite(w?.current?.temp), humidity: finite(w?.current?.humidity),
    pm10: finite(a?.pm10), pm25: finite(a?.pm25), station: a?.location ?? null,
    at: new Date().toISOString(),
  };
  return env.temp == null && env.humidity == null && env.pm10 == null && env.pm25 == null ? null : env;
}

export async function GET(req: NextRequest) {
  const who = await requireOwner();
  if (who instanceof NextResponse) return who;
  const db = adminDb()!;
  const p = req.nextUrl.searchParams;
  const date = p.get('date');
  if (date) {
    if (!DATE_RE.test(date)) return NextResponse.json({ error: 'bad_date' }, { status: 400 });
    const snap = await db.doc(skinLogPath(date)).get();
    return NextResponse.json({ log: snap.exists ? snap.data() : null });
  }
  const from = p.get('from'), to = p.get('to') || kstToday();
  if (!from || !DATE_RE.test(from) || !DATE_RE.test(to) || from > to) return NextResponse.json({ error: 'bad_range' }, { status: 400 });
  if ((Date.parse(to) - Date.parse(from)) / 86400000 > 120) return NextResponse.json({ error: 'range_too_long' }, { status: 400 });
  const qs = await db.collection(`skin/${SKIN_OWNER}/logs`).where('date', '>=', from).where('date', '<=', to).orderBy('date').get();
  return NextResponse.json({ logs: qs.docs.map((d) => d.data()) });
}

export async function PUT(req: NextRequest) {
  const who = await requireOwner();
  if (who instanceof NextResponse) return who;
  const body = await req.json().catch(() => null);
  const date = body?.date;
  if (typeof date !== 'string' || !DATE_RE.test(date) || date > kstToday()) {
    return NextResponse.json({ error: 'bad_date' }, { status: 400 });
  }
  const db = adminDb()!;
  const ref = db.doc(skinLogPath(date));
  const now = new Date().toISOString();
  const prev = (await ref.get()).data() as SkinLog | undefined;
  const log: SkinLog = { ...(prev ?? emptyLog(date, now)), ...sanitizeLogPatch(body), date, updatedAt: now };
  log.uas = uasOf(log.wheals, log.itch);
  if (date === kstToday() && !log.env) log.env = await envSnapshot(req.nextUrl.origin);
  // 사진 목록은 /api/skin/photo 만 바꾼다(겹쳐 저장돼도 사진이 지워지지 않게 photos는 빼고 merge)
  const { photos, ...rest } = log;
  await ref.set(rest, { merge: true });
  return NextResponse.json({ log: { ...rest, photos: photos ?? [] } });
}
