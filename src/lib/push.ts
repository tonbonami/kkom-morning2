// 웹푸시 구독 — 브라우저에서 권한 받고 Firestore에 구독 객체 저장.
// 서버는 매일 아침 이 구독들을 읽어 web-push로 발송함.

import { db } from './firebase';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushState = 'unsupported' | 'denied' | 'off' | 'on' | 'unknown';

// 현재 브라우저의 구독 상태 (UI 표시용)
export async function getPushState(name: string): Promise<PushState> {
  if (typeof window === 'undefined') return 'unknown';
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return 'off';
    // Firestore에도 동일한 endpoint 저장되어 있는지 확인
    const snap = await getDoc(doc(db, 'pushSubscriptions', name));
    if (!snap.exists()) return 'off';
    return 'on';
  } catch {
    return 'unknown';
  }
}

// 구독 시작 — 권한 요청 → SW 구독 → Firestore에 저장
export async function enablePush(name: string): Promise<{ ok: boolean; error?: string }> {
  if (!VAPID_PUBLIC) return { ok: false, error: 'VAPID 키 미설정' };
  if (typeof window === 'undefined') return { ok: false, error: '브라우저 환경 아님' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, error: '이 브라우저는 푸시 미지원' };
  }

  // 권한
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, error: '알림 권한이 거부됐어요' };

  try {
    const reg = await navigator.serviceWorker.ready;
    // 이미 구독돼있으면 새로 만들지 않고 재사용
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }

    // Firestore에 저장 (사람 1명 = 1 구독)
    const json = sub.toJSON();
    await setDoc(doc(db, 'pushSubscriptions', name), {
      name,
      endpoint: json.endpoint,
      keys: json.keys,
      ua: navigator.userAgent.slice(0, 200),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    console.error('푸시 구독 실패:', e);
    return { ok: false, error: '구독 등록 실패' };
  }
}

// 구독 해제 (브라우저 + Firestore 둘 다)
export async function disablePush(name: string): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch {}
  try {
    await deleteDoc(doc(db, 'pushSubscriptions', name));
  } catch {}
}
