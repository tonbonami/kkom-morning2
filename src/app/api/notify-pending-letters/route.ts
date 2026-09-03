// 매 5분 cron — openAt 도래한 예약 편지 모아서 push.
// 중복 방지: 발송 후 letter doc에 notifiedAt 표시. 다음 cron부터는 이미 notifiedAt 있으면 skip.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { buildEmoticonNotificationTitle } from '@/lib/emoticons';
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

    // ⚠️ 봉인 해제 — 예약편지 본문은 letterVault 에 있다(받는 사람 앱은 안 읽음).
    //    도착 시각이 됐으니 letters 로 옮기고 sealed 를 푼다. 이제야 받는 앱이 본문을 받는다.
    //    멱등: vault 가 이미 없으면(재시도/레거시) 그냥 letters 의 내용으로 진행한다.
    //    푸시 실패로 다음 cron 이 다시 돌아도 승격은 한 번만 일어난다(vault 삭제됨).
    let content: any = data;
    try {
      const vaultRef = doc(db, 'letterVault', d.id);
      const vaultSnap = await getDoc(vaultRef);
      if (vaultSnap.exists()) {
        const v = vaultSnap.data() as any;
        await updateDoc(d.ref, { ...v, sealed: false });
        await deleteDoc(vaultRef);
        content = { ...data, ...v };
      }
    } catch (e) {
      // 승격 실패 시 teaser 는 봉투(data)로 만들고 notifiedAt 은 안 찍어 다음 cron 이 재시도.
      console.warn('편지 봉인 해제 실패:', d.id, e);
    }

    const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
    if (!subSnap.exists()) {
      // 구독 없으면 더 이상 시도 안 하게 표시
      await updateDoc(d.ref, { notifiedAt: serverTimestamp() });
      results.push({ id: d.id, ok: false, reason: 'no subscription for ' + to });
      continue;
    }
    const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

    const hasVoice = !!content.voice?.data;
    const emoticonIds = Array.isArray(content.emoticonIds) ? content.emoticonIds.filter((id: unknown) => typeof id === 'string') : [];
    const hasEmoticons = emoticonIds.length > 0;
    const emoji = hasVoice ? '🎙' : '💌';
    const teaser =
      hasVoice && hasEmoticons ? '예약 보이스 편지와 이모티콘'
        : hasVoice ? '예약 보이스 편지'
        : '예약 편지';
    const payload = JSON.stringify({
      title: hasEmoticons && !hasVoice
        ? buildEmoticonNotificationTitle(from, content.body || '', emoticonIds)
        : `${emoji} ${from}의 ${teaser}가 도착했어`,
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
