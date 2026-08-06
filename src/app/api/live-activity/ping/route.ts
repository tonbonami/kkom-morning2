// "나 지금 접속 중" 알림 — 내가 활성일 때 클라가 호출.
// 상대(activity 주인)의 저장된 base를 읽어 프레즌스만 true/now로 패치 → liveactivity 푸시.
// → 상대 잠금화면/다이나믹아일랜드에 "나 접속 💚"가 앱 닫혀 있어도 실시간으로 뜸.
import { NextRequest, NextResponse } from 'next/server';
import { sendLiveActivity, keyForName } from '@/lib/apns';

const RTDB =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app';
const COOLDOWN_MS = 25_000; // 상대에게 25초당 1번만 (스팸·쓰로틀 방지)

export async function POST(req: NextRequest) {
  let body: { from?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const from = body.from;
  if (from !== '우댕' && from !== '꼼이') {
    return NextResponse.json({ error: 'from required' }, { status: 400 });
  }
  const partnerName = from === '우댕' ? '꼼이' : '우댕';
  const partnerKey = keyForName(partnerName); // activity 주인 = 상대

  // 상대 activity의 base(=나를 describe) 읽기
  let base: Record<string, unknown> | null = null;
  try {
    const r = await fetch(`${RTDB}/liveActivityState/${partnerKey}.json`, { cache: 'no-store' });
    base = (await r.json()) as Record<string, unknown> | null;
  } catch {
    // ignore
  }
  if (!base) return NextResponse.json({ ok: true, skipped: 'no base state' });

  // 쿨다운
  const metaUrl = `${RTDB}/pushMeta/${partnerKey}/lastLA.json`;
  const now = Date.now();
  try {
    const r = await fetch(metaUrl, { cache: 'no-store' });
    const last = (await r.json()) as number | null;
    if (last && now - last < COOLDOWN_MS) return NextResponse.json({ ok: true, throttled: true });
    await fetch(metaUrl, { method: 'PUT', body: JSON.stringify(now) });
  } catch {
    // 쿨다운 실패해도 발송 시도
  }

  // 제미나이 ContentState 형태 — 내가 접속했으니 online/agoText만 갱신(나머지는 base 유지).
  const patched = { ...base, online: true, agoText: '지금 함께' };
  const ok = await sendLiveActivity(partnerKey, patched, { staleInSec: 150 }).catch(() => false);
  return NextResponse.json({ ok: true, apns: ok });
}
