// 매 5분 cron — openAt 도래한 예약 편지 모아서 push.
// 중복 방지: 발송 후 letter doc에 notifiedAt 표시. 다음 cron부터는 이미 notifiedAt 있으면 skip.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
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

  // openAt <= now 인 예약 편지 전부 (Firestore 인덱스 자동 생성됨 — 1 필드 where는 인덱스 없이 OK)
  const now = Timestamp.now();
  const q = query(collection(db, 'letters'), where('openAt', '<=', now));
  const snap = await getDocs(q);

  const results: { id: string; ok: boolean; reason?: string; status?: number }[] = [];

  for (const d of snap.docs) {
    const data = d.data() as any;
    if (data.notifiedAt) {
      // 이미 발송함
      continue;
    }
    const to = data.to as string | undefined;
    const from = data.from as string | undefined;
    if (!to || !from) {
      await updateDoc(d.ref, { notifiedAt: serverTimestamp() });
      results.push({ id: d.id, ok: false, reason: 'missing to/from' });
      continue;
    }

    const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
    if (!subSnap.exists()) {
      // 구독 없으면 더 이상 시도 안 하게 표시
      await updateDoc(d.ref, { notifiedAt: serverTimestamp() });
      results.push({ id: d.id, ok: false, reason: 'no subscription for ' + to });
      continue;
    }
    const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

    const hasVoice = !!data.voice?.data;
    const emoji = hasVoice ? '🎙' : '💌';
    const teaser = hasVoice ? '예약 보이스 편지' : '예약 편지';
    const payload = JSON.stringify({
      title: `${emoji} ${from}의 ${teaser}가 도착했어`,
      body: '꼼모닝에서 열어봐 💚',
      url: '/letters',
    });

    try {
      await webpush.sendNotification(s as any, payload);
      await updateDoc(d.ref, { notifiedAt: serverTimestamp() });
      results.push({ id: d.id, ok: true });
    } catch (e: any) {
      const status = e?.statusCode;
      if (status === 404 || status === 410) {
        try { await deleteDoc(subSnap.ref); } catch {}
      }
      // 일시 오류일 수 있어 notifiedAt 표시는 보류 — 다음 cron에 재시도
      results.push({ id: d.id, ok: false, status, reason: 'webpush error' });
    }
  }

  return NextResponse.json({ total: snap.docs.length, sent: results.filter(r => r.ok).length, results });
}
