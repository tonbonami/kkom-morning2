// 하트 푸시 — 워치/폰에서 하트 보내면 상대 잠금 기기에도 알림.
// 라이브 하트(둘 다 접속 시 실시간 폭탄)와 별개. 연타 스팸 방지로 서버 쿨다운.
import { NextRequest, NextResponse } from 'next/server';
import { sendApns, keyForName } from '@/lib/apns';

const RTDB =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app';
const COOLDOWN_MS = 20_000; // 하트 연타해도 20초에 알림 1번만

export async function POST(req: NextRequest) {
  let body: { from?: string; to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { from, to } = body;
  if (!from || !to) return NextResponse.json({ error: 'from/to required' }, { status: 400 });

  const toKey = keyForName(to);
  const metaUrl = `${RTDB}/pushMeta/${toKey}/lastHeart.json`;

  // 쿨다운 체크 (연타 스팸 방지)
  try {
    const r = await fetch(metaUrl, { cache: 'no-store' });
    const last = (await r.json()) as number | null;
    const now = Date.now();
    if (last && now - last < COOLDOWN_MS) {
      return NextResponse.json({ ok: true, throttled: true });
    }
    await fetch(metaUrl, { method: 'PUT', body: JSON.stringify(now) });
  } catch {
    // 쿨다운 조회 실패해도 발송은 시도
  }

  // title=보낸이 이름(커뮤니케이션 알림이면 iOS가 이름 강조) / sender로 아바타, category로 답장 액션
  const apnsOk = await sendApns(toKey, from, '하트 보냈어 💕',
    { category: 'KKOM_MSG', sender: from, sound: 'heartbeat.caf' }).catch(() => false);
  return NextResponse.json({ ok: true, apns: apnsOk });
}
