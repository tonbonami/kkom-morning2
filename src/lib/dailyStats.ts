// "매일매일 꼼모닝" — Single Daily Document Pattern (Gemini 제안 P0)
// dailyStats/{YYYY-MM-DD} 문서 1개에 오늘의 모든 카운트를 누적.
// 진입 시 1 read로 헤더에 필요한 모든 데이터를 가져옴.
// 각 도메인(letters/praise/bump/memory/wish)에서 doc 추가 시 여기 helper로 increment.

import { db } from './firebase';
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  increment as fbIncrement,
} from 'firebase/firestore';

export type Sender = '우댕' | '꼼이';
export type BumpKind = 'miss' | 'love' | 'kiss' | 'night';

type Pair = { 우댕: number; 꼼이: number };

export interface DailyStats {
  letters: Pair;          // 누가 보낸 편지 (받은 사람 = 반대편)
  praiseStickers: Pair;   // 누가 보낸 칭찬 스티커 합계
  praiseRequests: Pair;   // 누가 졸랐는지
  memories: Pair;         // 누가 올린 추억 사진
  wishItems: Pair;        // 누가 추가한 위시
  bumps: Record<BumpKind, Pair>; // miss/love/kiss/night × from
}

// Claude 참고: KST 자정 기준 오늘 날짜 — 한국 사용자라 항상 Asia/Seoul 기준.
export function todayKey(d: Date = new Date()): string {
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60_000;
  const kst = new Date(utcMs + 9 * 60 * 60_000);
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, '0')}-${String(kst.getDate()).padStart(2, '0')}`;
}

const ZERO_PAIR: Pair = { 우댕: 0, 꼼이: 0 };

export function emptyStats(): DailyStats {
  return {
    letters: { ...ZERO_PAIR },
    praiseStickers: { ...ZERO_PAIR },
    praiseRequests: { ...ZERO_PAIR },
    memories: { ...ZERO_PAIR },
    wishItems: { ...ZERO_PAIR },
    bumps: {
      miss: { ...ZERO_PAIR },
      love: { ...ZERO_PAIR },
      kiss: { ...ZERO_PAIR },
      night: { ...ZERO_PAIR },
    },
  };
}

// path 배열 → nested object increment 변환 (setDoc with merge로 안전 update)
// e.g. ['letters', '우댕'] → { letters: { 우댕: increment(1) } }
async function bumpPath(path: string[], by: number = 1): Promise<void> {
  if (by === 0) return;
  const key = todayKey();
  const ref = doc(db, 'dailyStats', key);
  const update = path.reduceRight<any>((acc, k) => ({ [k]: acc }), fbIncrement(by));
  try {
    await setDoc(ref, update, { merge: true });
  } catch (e) {
    // dailyStats 실패가 본 기능 망치지 않게 조용히 로그만
    console.warn('[dailyStats] bump 실패:', path.join('.'), e);
  }
}

// 도메인별 헬퍼 — 호출처에서 의미 명확하게.
export const incrementLetter = (sender: Sender) => bumpPath(['letters', sender]);
export const incrementPraiseStickers = (sender: Sender, count: number) =>
  bumpPath(['praiseStickers', sender], count);
export const incrementPraiseRequest = (sender: Sender) => bumpPath(['praiseRequests', sender]);
export const incrementMemory = (sender: Sender) => bumpPath(['memories', sender]);
export const incrementWish = (sender: Sender) => bumpPath(['wishItems', sender]);
export const incrementBump = (sender: Sender, kind: BumpKind) =>
  bumpPath(['bumps', kind, sender]);

// 안전 머지 — Firestore 응답에 일부 필드 없어도 zero로 채움.
function normalizeStats(data: any): DailyStats {
  const empty = emptyStats();
  return {
    letters: { ...empty.letters, ...(data?.letters || {}) },
    praiseStickers: { ...empty.praiseStickers, ...(data?.praiseStickers || {}) },
    praiseRequests: { ...empty.praiseRequests, ...(data?.praiseRequests || {}) },
    memories: { ...empty.memories, ...(data?.memories || {}) },
    wishItems: { ...empty.wishItems, ...(data?.wishItems || {}) },
    bumps: {
      miss: { ...ZERO_PAIR, ...(data?.bumps?.miss || {}) },
      love: { ...ZERO_PAIR, ...(data?.bumps?.love || {}) },
      kiss: { ...ZERO_PAIR, ...(data?.bumps?.kiss || {}) },
      night: { ...ZERO_PAIR, ...(data?.bumps?.night || {}) },
    },
  };
}

// 헤더에서 실시간 구독 — 1 문서만 listen이라 비용 적음.
// 우댕/꼼이 둘 다 같은 doc을 보면 *서로의 행동이 실시간으로 헤더에 반영*됨 (감정 온도계).
export function subscribeTodayStats(cb: (s: DailyStats) => void): () => void {
  const ref = doc(db, 'dailyStats', todayKey());
  return onSnapshot(
    ref,
    (snap) => cb(snap.exists() ? normalizeStats(snap.data()) : emptyStats()),
    (err) => {
      console.error('dailyStats 구독 오류:', err);
      cb(emptyStats());
    }
  );
}

// 1회 fetch (필요 시)
export async function fetchTodayStats(): Promise<DailyStats> {
  const ref = doc(db, 'dailyStats', todayKey());
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? normalizeStats(snap.data()) : emptyStats();
  } catch (e) {
    console.error('dailyStats fetch 실패:', e);
    return emptyStats();
  }
}
