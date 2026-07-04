// 라이브 하트 — 둘 다 접속 중일 때 실시간 하트 폭탄 (푸시 아님, Firestore onSnapshot).
// liveHearts/{받는사람} 단일 doc을 계속 덮어씀. 받는 쪽 화면이 nonce 변화를 감지해 하트를 터뜨림.
// 조용함(알림 소리 X), 1초 내 도착, 무료.

import { db } from './firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { partnerOf } from './letters';

export interface LiveHeartPing {
  from: string;
  nonce: string;   // 매 탭마다 바뀜 — 같은 값 무시로 중복 트리거 방지
  at: Date | null;
}

// 하트 던지기 — 상대 doc을 덮어씀. 연타하면 nonce가 매번 새로.
export async function throwHeart(from: string): Promise<void> {
  if (!from) return;
  const to = partnerOf(from);
  // Math.random은 워크플로 밖 일반 앱 코드라 사용 가능. nonce는 시각+난수로 충분히 유니크.
  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await setDoc(doc(db, 'liveHearts', to), { from, nonce, at: serverTimestamp() });
  } catch (e) {
    console.warn('하트 던지기 실패:', e);
  }
}

// 내가 받는 하트 구독 — nonce가 바뀔 때마다 cb 호출 (첫 스냅샷은 무시하도록 호출처에서 처리).
export function subscribeLiveHearts(me: string, cb: (ping: LiveHeartPing) => void): () => void {
  if (!me) return () => {};
  return onSnapshot(
    doc(db, 'liveHearts', me),
    (snap) => {
      const d = snap.data() as { from?: string; nonce?: string; at?: Timestamp } | undefined;
      if (!d?.nonce) return;
      cb({ from: d.from ?? '', nonce: d.nonce, at: d.at?.toDate?.() ?? null });
    },
    (err) => console.error('liveHearts 구독 오류:', err)
  );
}
