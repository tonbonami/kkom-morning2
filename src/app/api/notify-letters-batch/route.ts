// 매일 07:05 KST cron — 방해 금지 시간(22-07)에 deferred된 편지들 정리해서 발송.
// pendingNotify=true인 편지를 수신자별 그룹화 → 한 통씩 '자는 사이 OO이 N통 보냈어' push.
// 발송 후 pendingNotify 플래그 클리어.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, deleteField,
} from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
const CRON_SECRET = process.env.CRON_SECRET || '';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

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

  // pendingNotify=true 인 편지 전부
  const q = query(collection(db, 'letters'), where('pendingNotify', '==', true));
  const snap = await getDocs(q);

  if (snap.empty) {
    return NextResponse.json({ sent: 0, reason: 'no pending letters' });
  }

  // 수신자별 그룹
  const byRecipient: Record<string, { from: string; hasVoice: boolean; docRef: any }[]> = {};
  for (const d of snap.docs) {
    const data = d.data() as any;
    const to = data.to as string;
    if (!to) continue;
    (byRecipient[to] ??= []).push({
      from: data.from,
      hasVoice: !!data.voice?.data,
      docRef: d.ref,
    });
  }

  const results: { to: string; count: number; ok: boolean; status?: number; err?: string }[] = [];

  await Promise.all(
    Object.entries(byRecipient).map(async ([to, letters]) => {
      const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
      if (!subSnap.exists()) {
        // 구독 없음 → 그냥 플래그만 클리어 (재시도 막음)
        await Promise.all(letters.map(l => updateDoc(l.docRef, { pendingNotify: deleteField() })));
        results.push({ to, count: letters.length, ok: false, err: 'no subscription' });
        return;
      }
      const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

      // 보낸 사람별 집계 — 단순화: 첫 번째 sender 이름 + 나머지 +
      const senders = Array.from(new Set(letters.map(l => l.from)));
      const senderText = senders.length === 1 ? senders[0] : senders.join('·');
      const hasVoice = letters.some(l => l.hasVoice);
      const emoji = hasVoice ? '🎙' : '💌';

      const title = letters.length === 1
        ? `${emoji} ${senderText}이(가) 편지 보냈어`
        : `${emoji} 자는 사이 ${senderText}이(가) ${letters.length}통 보냈어`;
      const body = '꼼모닝에서 열어봐 💚';

      const payload = JSON.stringify({ title, body, url: '/letters' });

      try {
        await webpush.sendNotification(s as any, payload);
        // 플래그 클리어
        await Promise.all(letters.map(l => updateDoc(l.docRef, { pendingNotify: deleteField() })));
        results.push({ to, count: letters.length, ok: true });
      } catch (e: any) {
        const status = e?.statusCode;
        if (status === 404 || status === 410) {
          try { await deleteDoc(subSnap.ref); } catch {}
        }
        // 일시 오류면 플래그 유지 — 다음 cron(내일 아침)에 재시도
        results.push({ to, count: letters.length, ok: false, status, err: String(e?.body || e) });
      }
    })
  );

  return NextResponse.json({ sent: results.filter(r => r.ok).length, total: snap.size, results });
}
