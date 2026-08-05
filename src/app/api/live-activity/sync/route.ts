// 내 Live Activity의 base content-state 저장 — 상대가 ping할 때 이 base를 프레즌스만 패치해 씀.
// state 키 = iOS ContentState(Codable) 프로퍼티명과 일치(partnerName/partnerActive/…/airGrade/airLoc/partnerMood).
import { NextRequest, NextResponse } from 'next/server';

const RTDB =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app';
const KEYS = ['udaeng', 'kkomi'];

export async function POST(req: NextRequest) {
  let body: { userKey?: string; state?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { userKey, state } = body;
  if (!userKey || !KEYS.includes(userKey) || !state) {
    return NextResponse.json({ error: 'userKey/state required' }, { status: 400 });
  }
  try {
    await fetch(`${RTDB}/liveActivityState/${userKey}.json`, { method: 'PUT', body: JSON.stringify(state) });
  } catch {
    // 저장 실패해도 치명적 아님
  }
  return NextResponse.json({ ok: true });
}
