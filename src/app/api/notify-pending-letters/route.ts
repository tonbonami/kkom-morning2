// 예약편지 봉인 해제 + 도착 알림. 핵심 로직은 lib/promoteLetters 로 공유한다.
//   - 이 라우트가 예약편지 배송의 '주 경로'다. vercel.json 에 */5 크론으로 등록(Pro 팀이라 sub-daily OK).
//     → 예약편지가 openAt ±5분 안에 도착.
//   - 백스톱: 같은 승격 로직을 '매일 도는 크론 4개'(air/air-commute/letters-batch/calendar-reminders)도
//     호출한다. 이 */5 크론이 어떤 이유로든 또 빠져도 예약편지가 영영 안 가는 일은 없게(하루 4윈도우).
//   - 멱등(notifiedAt 도장): 주·백스톱이 겹쳐도 중복 푸시 없음. key= 로 수동 트리거/디버그도 가능.
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
