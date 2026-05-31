import { db } from './firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

// presence/{name} 도큐먼트
// - lastSeenAt: 마지막 활동 시각 (서버 시각)
// - active: true 면 '지금 보고 있음', false 면 '닫음/숨김'
//
// 흐름:
// - 페이지 visible → active=true + lastSeenAt 갱신
// - visibilitychange hidden / beforeunload → active=false + lastSeenAt 갱신
// - heartbeat 2분마다 (visible일 때만) → active=true + lastSeenAt 갱신

export interface Presence {
  lastSeenAt: Date | null;
  active: boolean;
}

// '지금 함께'로 칠 시간 (heartbeat 2분 + 여유 1분)
const ACTIVE_THRESHOLD_MS = 3 * 60 * 1000;

export async function touchPresence(name: string, active: boolean): Promise<void> {
  if (!name) return;
  try {
    await setDoc(
      doc(db, 'presence', name),
      { name, lastSeenAt: serverTimestamp(), active },
      { merge: true }
    );
  } catch (e) {
    console.warn('presence touch 실패:', e);
  }
}

export function subscribePresence(
  name: string,
  cb: (p: Presence) => void
): () => void {
  if (!name) {
    cb({ lastSeenAt: null, active: false });
    return () => {};
  }
  return onSnapshot(
    doc(db, 'presence', name),
    (snap) => {
      const d = snap.data() as { lastSeenAt?: Timestamp; active?: boolean } | undefined;
      cb({
        lastSeenAt: d?.lastSeenAt?.toDate?.() ?? null,
        active: !!d?.active,
      });
    },
    () => cb({ lastSeenAt: null, active: false })
  );
}

// '지금 함께 💚' / '5분 전' 등으로 변환
// active 플래그 + 최근 활동 두 조건 모두 충족해야 '지금 함께'
export function formatPresenceRelative(p: Presence): string {
  if (!p.lastSeenAt) return '아직 한 번도';
  const now = Date.now();
  const diff = Math.max(0, now - p.lastSeenAt.getTime());

  // 시계 어긋남 보정: 클라이언트가 서버 시간보다 약간 빨라도 active 플래그 우선
  if (p.active && diff < ACTIVE_THRESHOLD_MS) return '지금 함께 💚';

  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  const week = Math.floor(day / 7);
  return `${week}주 전`;
}
