// 피부 일지 하루 기록 — 꼼이 세션 쿠키 필요(읽기 requireReader · 쓰기는 꼼이만 requireWriter).
//   GET ?date=YYYY-MM-DD           → { log | null }
//   GET ?from=YYYY-MM-DD&to=…      → { logs: [...] } (최대 120일)
//   PUT { date, ...바꿀 필드 }       → 합쳐서 저장, uas 다시 계산. 오늘 기록이면 날씨·습도·미세먼지를 한 번 붙인다.
import { NextRequest, NextResponse } from 'next/server';
import { requireReader, requireWriter } from '@/lib/skinAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { DATE_RE, skinLogPath, SKIN_OWNER } from '@/lib/skinTypes';
import { kstToday, writeSkinLog } from '@/lib/skinLogWrite';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const who = await requireReader();
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
  const who = await requireWriter();
  if (who instanceof NextResponse) return who;
  const body = await req.json().catch(() => null);
  const date = body?.date;
  if (typeof date !== 'string' || !DATE_RE.test(date) || date > kstToday()) {
    return NextResponse.json({ error: 'bad_date' }, { status: 400 });
  }
  const log = await writeSkinLog(adminDb()!, date, body, req.nextUrl.origin);
  return NextResponse.json({ log });
}
