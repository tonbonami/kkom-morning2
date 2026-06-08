// 즉시 편지가 전송된 직후 sendLetter()가 호출하는 경량 POST.
// body { to, from, hasBody, hasVoice, hasEmoticons, emoticonIds, isScheduled, letterId? }
// 예약 편지(isScheduled=true)는 도착 시각이 되면 cron이 보냄.
// KST 22:00 ~ 06:59 (방해 금지 시간)이면 즉시 push 안 보내고 letter doc에
// pendingNotify=true 표시 → 다음 날 07:05 KST notify-letters-batch가 정리해서 발송.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { buildEmoticonNotificationTitle, subjectName } from '@/lib/emoticons';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

function kstHour(): number {
  // 서버 시간(UTC) + 9h → KST 시
  return new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();
}

export async function POST(req: NextRequest) {
  let body: {
    to?: string;
    from?: string;
    hasBody?: boolean;
    hasVoice?: boolean;
    hasEmoticons?: boolean;
    emoticonIds?: string[];
    isScheduled?: boolean;
    letterId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { to, from, hasBody, hasVoice, hasEmoticons, emoticonIds, isScheduled, letterId } = body;
  if (!to || !from) {
    return NextResponse.json({ error: 'to/from required' }, { status: 400 });
  }
  if (isScheduled) {
    return NextResponse.json({ skipped: 'scheduled — cron will notify on arrival' });
  }

  // 방해 금지: KST 22:00 ~ 06:59 → 즉시 push 안 함, 다음 날 07:05 배치 cron이 정리.
  const h = kstHour();
  const isQuiet = h >= 22 || h < 7;
  if (isQuiet) {
    if (letterId) {
      try {
        await updateDoc(doc(db, 'letters', letterId), { pendingNotify: true });
      } catch (e) {
        console.warn('pendingNotify 표시 실패:', e);
      }
    }
    return NextResponse.json({ deferred: true, kstHour: h, reason: 'quiet hours 22-07' });
  }

  const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
  if (!subSnap.exists()) {
    return NextResponse.json({ skipped: 'no subscription for ' + to });
  }
  const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

  const emoji = hasVoice ? '🎙' : '💌';
  const teaser =
    hasBody && hasVoice && hasEmoticons ? '글 + 보이스 + 이모티콘'
      : hasBody && hasVoice ? '글 + 보이스'
      : hasVoice && hasEmoticons ? '보이스와 이모티콘'
      : hasVoice ? '보이스 편지'
      : '편지';
  const title = hasEmoticons && !hasVoice
    ? buildEmoticonNotificationTitle(from, hasBody ? '편지 있음' : '', emoticonIds)
    : `${emoji} ${subjectName(from)} ${teaser} 보냈어`;
  const payload = JSON.stringify({
    title,
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
