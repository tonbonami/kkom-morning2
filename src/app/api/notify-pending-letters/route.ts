// 예약편지 봉인 해제 + 도착 알림. 핵심 로직은 lib/promoteLetters 로 공유한다.
//   - Vercel Hobby가 sub-daily 크론을 막아 이 라우트는 vercel.json 크론에서 빠졌다. 대신 승격 로직을
//     '이미 매일 도는 크론 4개'(notify-air/-air-commute/-letters-batch/-calendar-reminders)가 얹어 호출한다.
//   - 이 엔드포인트 자체는 수동 트리거/디버그용으로 남긴다(추후 Pro 전환 시 5분 크론으로 재등록 가능).
import { NextRequest, NextResponse } from 'next/server';
import { promotePendingLetters } from '@/lib/promoteLetters';

const CRON_SECRET = process.env.CRON_SECRET || '';

function authorized(req: NextRequest): boolean {
  const h = req.headers.get('authorization') || '';
  if (h === `Bearer ${CRON_SECRET}`) return true;
  const key = new URL(req.url).searchParams.get('key');
  if (key && CRON_SECRET && key === CRON_SECRET) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const res = await promotePendingLetters();
  return NextResponse.json(res);
}
