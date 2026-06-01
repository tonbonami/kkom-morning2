// 즉시 편지가 전송된 직후 sendLetter()가 호출하는 경량 POST.
// body { to, from, hasBody, hasVoice, isScheduled }
// 예약 편지(isScheduled=true)는 도착 시각이 되면 notify-pending-letters cron이 보냄.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

export async function POST(req: NextRequest) {
  let body: { to?: string; from?: string; hasBody?: boolean; hasVoice?: boolean; isScheduled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { to, from, hasBody, hasVoice, isScheduled } = body;
  if (!to || !from) {
    return NextResponse.json({ error: 'to/from required' }, { status: 400 });
  }
  if (isScheduled) {
    return NextResponse.json({ skipped: 'scheduled — cron will notify on arrival' });
  }

  const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
  if (!subSnap.exists()) {
    return NextResponse.json({ skipped: 'no subscription for ' + to });
  }
  const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

  const emoji = hasVoice ? '🎙' : '💌';
  const teaser = hasBody && hasVoice ? '글 + 보이스' : hasVoice ? '보이스 편지' : '편지';
  const payload = JSON.stringify({
    title: `${emoji} ${from}이(가) ${teaser} 보냈어`,
    body: '꼼모닝에서 열어봐 💚',
    url: '/',
  });

  try {
    await webpush.sendNotification(s as any, payload);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.statusCode;
    if (status === 404 || status === 410) {
      // 만료된 구독 → 정리
      try { await deleteDoc(subSnap.ref); } catch {}
    }
    return NextResponse.json({ ok: false, status, err: String(e?.body || e) }, { status: 200 });
  }
}
