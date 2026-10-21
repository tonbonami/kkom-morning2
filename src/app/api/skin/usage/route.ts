// 꼼이 Claude 상담 사용량(우댕 2026-10-21: "비용 때문에") — 오늘·이번 달·지금까지 횟수와 대략 비용(원).
// 읽기만(requireReader). 비용은 토큰 수로 어림한 값이고 정확한 청구는 Anthropic 콘솔 기준.
import { NextResponse } from 'next/server';
import { requireReader } from '@/lib/skinAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { sumUsage, type ChatUsageDay } from '@/lib/skinBackup';
import { SKIN_OWNER } from '@/lib/skinTypes';

export const dynamic = 'force-dynamic';

const USD_KRW = Number(process.env.USD_KRW) || 1400;
const DAILY_LIMIT = 60; // /api/skin/chat 과 같게
const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

export async function GET() {
  const who = await requireReader();
  if (who instanceof NextResponse) return who;
  const qs = await adminDb()!.collection(`skin/${SKIN_OWNER}/chatUsage`).get();
  const days = Object.fromEntries(qs.docs.map((d) => [d.id, d.data() as ChatUsageDay]));
  const today = kstToday();
  const pick = (f: (date: string) => boolean) => {
    const s = sumUsage(Object.entries(days).filter(([d]) => f(d)).map(([, u]) => u));
    return { count: s.count, won: Math.round(s.cost * USD_KRW) };
  };
  return NextResponse.json({
    today: pick((d) => d === today),
    month: pick((d) => d.startsWith(today.slice(0, 7))),
    total: pick(() => true),
    limit: DAILY_LIMIT,
  });
}
