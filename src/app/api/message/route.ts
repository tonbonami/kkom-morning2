// 채팅 메시지 푸시 — 상대가 접속 안 했을 때 잠긴 폰/백그라운드에 알림.
// ②의 커뮤니케이션 알림(상대 아바타 + 이름) + KKOM_MSG 빠른답장 재활용. 웹푸시도 병행.
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { sendApns, keyForName } from '@/lib/apns';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

export async function POST(req: NextRequest) {
  let body: { from?: string; to?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { from, to, text } = body;
  if (!from || !to || !text) {
    return NextResponse.json({ error: 'from/to/text required' }, { status: 400 });
  }

  // 커뮤니케이션 알림(아바타+이름) + 답장 액션(KKOM_MSG)
  const apnsOk = await sendApns(keyForName(to), from, text, { category: 'KKOM_MSG', sender: from }).catch(() => false);

  const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
  if (!subSnap.exists()) {
    return NextResponse.json({ ok: true, apns: apnsOk, pushSkipped: 'no web subscription' });
  }
  const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const payload = JSON.stringify({ title: from, body: text, url: '/' });
  try {
    await webpush.sendNotification(s as unknown as webpush.PushSubscription, payload);
    return NextResponse.json({ ok: true, apns: apnsOk });
  } catch (e: unknown) {
    const status = (e as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) {
      try { await deleteDoc(subSnap.ref); } catch {}
    }
    return NextResponse.json({ ok: true, apns: apnsOk, pushError: status });
  }
}
