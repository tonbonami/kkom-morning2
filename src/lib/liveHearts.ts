// 라이브 하트 — 둘 다 접속 중일 때 실시간 하트 폭탄 (푸시 아님, Firestore onSnapshot).
// liveHearts/{받는사람} 단일 doc을 계속 덮어씀. 받는 쪽 화면이 nonce 변화를 감지해 하트를 터뜨림.
// 조용함(알림 소리 X), 1초 내 도착, 무료.

import { db } from './firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { partnerOf } from './letters';
import { recordSerendipity } from './serendipity';

// ── 우연 '같은 걸 동시에' 감지 ──
// 내가 던진 시각 ↔ 상대가 던진 시각이 15초 이내면 = 서로 모르고 동시에 하트를 던진 것.
const SYNC_WINDOW_MS = 15_000;
let lastThrowMs = 0;
let lastRecvMs = 0;
let lastRecvNonce = '';
function maybeSyncAction(emoji: string): void {
  if (lastThrowMs && lastRecvMs && Math.abs(lastThrowMs - lastRecvMs) <= SYNC_WINDOW_MS) {
    void recordSerendipity('sync-action', { gapSec: Math.abs(lastThrowMs - lastRecvMs) / 1000, detail: emoji });
    lastThrowMs = 0; lastRecvMs = 0;   // 한 번 잡으면 리셋(연타 중복 방지)
  }
}

export interface LiveHeartPing {
  from: string;
  nonce: string;   // 매 탭마다 바뀜 — 같은 값 무시로 중복 트리거 방지
  at: Date | null;
  emoji: string;   // 날린 이모지 (기본 ❤️) — 워치 스티커 날리기와 공용
}

// 하트/스티커 던지기 — 상대 doc을 덮어씀. 연타하면 nonce가 매번 새로.
export async function throwHeart(from: string, emoji: string = '❤️'): Promise<void> {
  if (!from) return;
  const to = partnerOf(from);
  // Math.random은 워크플로 밖 일반 앱 코드라 사용 가능. nonce는 시각+난수로 충분히 유니크.
  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await setDoc(doc(db, 'liveHearts', to), { from, nonce, at: serverTimestamp(), emoji });
    lastThrowMs = Date.now();
    maybeSyncAction(emoji);   // 상대가 방금(15초 내) 던졌으면 '같은 걸 동시에' 우연
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
      const d = snap.data() as { from?: string; nonce?: string; at?: Timestamp; emoji?: string } | undefined;
      if (!d?.nonce) return;
      // 우연 감지 — 새 nonce + 방금(20초 내) 도착한 하트만 '상대가 방금 던짐'으로 침(첫 스냅샷/과거 하트 제외)
      const atMs = d.at?.toDate?.().getTime() ?? 0;
      if (d.nonce !== lastRecvNonce && atMs && Date.now() - atMs < 20_000) {
        lastRecvNonce = d.nonce; lastRecvMs = Date.now();
        maybeSyncAction(d.emoji || '❤️');
      } else if (d.nonce !== lastRecvNonce) {
        lastRecvNonce = d.nonce;   // 오래된 하트는 감지 안 하되 nonce는 갱신
      }
      cb({ from: d.from ?? '', nonce: d.nonce, at: d.at?.toDate?.() ?? null, emoji: d.emoji || '❤️' });
    },
    (err) => console.error('liveHearts 구독 오류:', err)
  );
}
