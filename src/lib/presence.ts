import { db } from './firebase';
import { doc, setDoc, getDocFromServer, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

// presence/{name} 도큐먼트
// - lastSeenAt: 마지막 활동 시각 (서버 시각)
// - active: true 면 '지금 보고 있음', false 면 '닫음/숨김'

export interface Presence {
  lastSeenAt: Date | null;
  active: boolean;
}

const ACTIVE_THRESHOLD_MS = 90 * 1000;

// ── 시계 오차 보정 ──
// 문제: lastSeenAt는 서버 시각인데 Date.now()는 기기 시각 → 기기 시계가 어긋나면
//       '지금 함께 / N분 전'이 전부 틀림(예: 기기가 5분 느리면 항상 '1분 전').
// 해결: 내 presence를 쓴 뒤 서버에서 그 시각을 다시 읽어 (서버-기기) 오차를 재고,
//       모든 상대 시간 계산에 serverNow()를 쓴다.
let clockOffsetMs = 0;
let lastCalibratedAt = 0;

export function serverNow(): number { return Date.now() + clockOffsetMs; }

async function calibrateClock(ref: ReturnType<typeof doc>): Promise<void> {
  if (Date.now() - lastCalibratedAt < 3 * 60_000) return; // 3분마다만 (읽기 절약)
  try {
    const snap = await getDocFromServer(ref);
    const t = (snap.data() as { lastSeenAt?: Timestamp } | undefined)?.lastSeenAt?.toDate?.();
    if (t) { clockOffsetMs = t.getTime() - Date.now(); lastCalibratedAt = Date.now(); }
  } catch { /* 오프라인 등 — 다음 기회에 */ }
}

export async function touchPresence(name: string, active: boolean): Promise<void> {
  if (!name) return;
  const ref = doc(db, 'presence', name);
  try {
    await setDoc(ref, { name, lastSeenAt: serverTimestamp(), active }, { merge: true });
    void calibrateClock(ref); // 대기 안 함(쓰기 지연 방지)
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

// '지금 함께'로 칠 수 있는가 — active 플래그 + 최근 활동(90초 이내, 시계보정) 둘 다.
export function isTogetherNow(p: Presence): boolean {
  if (!p.active || !p.lastSeenAt) return false;
  return Math.max(0, serverNow() - p.lastSeenAt.getTime()) < ACTIVE_THRESHOLD_MS;
}

// '지금 함께 💚' / '5분 전' 등으로 변환 (serverNow로 시계 오차 보정)
export function formatPresenceRelative(p: Presence): string {
  if (!p.lastSeenAt) return '아직 한 번도';
  if (isTogetherNow(p)) return '지금 함께 💚';

  const diff = Math.max(0, serverNow() - p.lastSeenAt.getTime());
  const min = Math.max(1, Math.floor(diff / 60_000));
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  const week = Math.floor(day / 7);
  return `${week}주 전`;
}
