// 예약편지 봉인 해제 + 도착 알림 — 여러 크론이 공유 호출한다.
//
// ⚠️ 배경(왜 이렇게 됐나): 예약편지 전용 크론(notify-pending-letters)은 원래 '5분마다'였는데
//    Vercel Hobby가 sub-daily 크론을 막아 vercel.json 에서 빠졌고(커밋 b2f6074), 대체가 안 들어가
//    예약편지가 봉인(sealed)된 채 영영 도착 안 하는 사고가 났다(꼼이 생일편지). 재발 방지로
//    이 승격 로직을 '이미 매일 도는 크론 4개'에 얹어 하루 4윈도우(아침 3·저녁 1)로 커버한다.
//    → Hobby 무료 유지 + 예약편지는 몇 시간 내 반드시 도착.
//
// ⚠️ 알림 채널: 우댕·꼼이 둘 다 웹푸시 구독이 없고 '네이티브 APNs'만 쓴다. 그래서 편지 알림은
//    APNs 를 우선으로 쏘고(sendApns), 웹푸시는 구독이 있을 때만 병행한다. (예전 편지 라우트는
//    웹푸시만 써서 편지 도착 핑이 폰에 아예 안 떴다.)
//
// ⚠️ 중복 방지: 승격이 끝나면(vault→letters) notifiedAt 을 '무조건' 찍는다. 하루 4번 도는 구조라
//    푸시 결과와 무관하게 도장을 안 찍으면 같은 편지가 최대 4번 재푸시될 수 있다. 편지 본문은
//    승격 시점에 이미 편지함에 떠서(멱등) 알림은 best-effort 로 둔다.
import webpush from 'web-push';
import { db } from './firebase';
import { buildEmoticonNotificationTitle } from './emoticons';
import { sendApns, keyForName } from './apns';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';

let vapidReady = false;
function ensureVapid(): void {
  if (vapidReady) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
  if (pub && priv) {
    try { webpush.setVapidDetails(subj, pub, priv); vapidReady = true; } catch { /* noop */ }
  }
}

export type PromoteResult = { id: string; ok: boolean; channels?: string[]; reason?: string };

// openAt 도래 + 아직 안 보낸 예약편지를 봉인 해제하고 도착 알림을 쏜다. 멱등.
export async function promotePendingLetters(): Promise<{ total: number; sent: number; results: PromoteResult[] }> {
  const now = Timestamp.now();
  const snap = await getDocs(query(collection(db, 'letters'), where('openAt', '<=', now)));
  const results: PromoteResult[] = [];

  for (const d of snap.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = d.data() as any;
    if (data.notifiedAt) continue; // 이미 처리됨
    const to = data.to as string | undefined;
    const from = data.from as string | undefined;
    if (!to || !from) {
      await updateDoc(d.ref, { notifiedAt: serverTimestamp() });
      results.push({ id: d.id, ok: false, reason: 'missing to/from' });
      continue;
    }

    // ── 봉인 해제 (letterVault → letters). 멱등: vault 가 이미 없으면 letters 내용으로 진행.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let content: any = data;
    try {
      const vaultRef = doc(db, 'letterVault', d.id);
      const vaultSnap = await getDoc(vaultRef);
      if (vaultSnap.exists()) {
        const v = vaultSnap.data();
        await updateDoc(d.ref, { ...v, sealed: false });
        await deleteDoc(vaultRef);
        content = { ...data, ...v };
      }
    } catch {
      // 승격 실패 → notifiedAt 안 찍고 다음 크론이 재시도
      results.push({ id: d.id, ok: false, reason: 'promote failed' });
      continue;
    }

    // ── 알림 문구
    const hasVoice = !!content.voice?.data;
    const emoticonIds: string[] = Array.isArray(content.emoticonIds)
      ? content.emoticonIds.filter((x: unknown) => typeof x === 'string') : [];
    const hasEmoticons = emoticonIds.length > 0;
    const emoji = hasVoice ? '🎙' : '💌';
    const teaser = hasVoice && hasEmoticons ? '예약 보이스 편지와 이모티콘'
      : hasVoice ? '예약 보이스 편지' : '예약 편지';
    const title = hasEmoticons && !hasVoice
      ? buildEmoticonNotificationTitle(from, content.body || '', emoticonIds)
      : `${emoji} ${from}의 ${teaser}가 도착했어`;
    const bodyText = '꼼모닝에서 열어봐 💚';

    const channels: string[] = [];
    // 1) 네이티브 APNs 우선 (둘 다 APNs만 씀). sender→NSE 아바타.
    try {
      if (await sendApns(keyForName(to), title, bodyText, { sender: from, threadId: 'letters' })) channels.push('apns');
    } catch { /* noop */ }
    // 2) 웹푸시는 구독 있을 때만 병행
    try {
      ensureVapid();
      const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
      if (subSnap.exists() && vapidReady) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = subSnap.data() as any;
        try {
          await webpush.sendNotification(s, JSON.stringify({ title, body: bodyText, url: '/letters' }));
          channels.push('web');
        } catch (e) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const st = (e as any)?.statusCode;
          if (st === 404 || st === 410) { try { await deleteDoc(subSnap.ref); } catch { /* noop */ } }
        }
      }
    } catch { /* noop */ }

    // 승격까지 됐으면 무조건 도장 → 4윈도우 중복 푸시 방지.
    await updateDoc(d.ref, { notifiedAt: serverTimestamp() });
    results.push({ id: d.id, ok: channels.length > 0, channels });
  }

  return { total: snap.docs.length, sent: results.filter((r) => r.ok).length, results };
}
