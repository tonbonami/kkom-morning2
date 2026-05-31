import { db } from './firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

// 내가 지금 접속해있다고 'presence/{이름}' 도큐먼트에 표시.
// 5분 heartbeat + 페이지 visible 될 때마다 호출하면 충분.
export async function touchPresence(name: string): Promise<void> {
  if (!name) return;
  try {
    await setDoc(
      doc(db, 'presence', name),
      { name, lastSeenAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    // 네트워크 오류 등은 조용히 — UI에 굳이 노출 안 함
    console.warn('presence touch 실패:', e);
  }
}

// 상대의 마지막 접속 시각 구독.
export function subscribePresence(
  name: string,
  cb: (lastSeenAt: Date | null) => void
): () => void {
  if (!name) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'presence', name),
    (snap) => {
      const data = snap.data() as { lastSeenAt?: Timestamp } | undefined;
      cb(data?.lastSeenAt?.toDate?.() ?? null);
    },
    () => cb(null)
  );
}

// "지금 함께", "3분 전", "1시간 전", "어제", "3일 전" 같은 한국어 상대 시간.
export function formatPresenceRelative(d: Date | null): string {
  if (!d) return '아직 한 번도';
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 2) return '지금 함께 💚';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 86_400_000 / 1) || Math.floor(hour / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  const week = Math.floor(day / 7);
  return `${week}주 전`;
}
