import { db } from './firebase';
import { doc, setDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

export const MOOD_OPTIONS = ['😄', '🙂', '😐', '😢', '😡', '😴', '🥰', '🤒'];

function todayKst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export type MoodMap = Record<string, { emoji: string; note: string }>;

// 오늘 내 기분 저장 (사람+날짜당 1개)
export async function setMyMood(name: string, emoji: string, note = ''): Promise<void> {
  const day = todayKst();
  await setDoc(doc(db, 'moods', `${name}_${day}`), {
    name,
    day,
    emoji,
    note: note.trim(),
    updatedAt: serverTimestamp(),
  });
}

// 오늘 두 사람의 기분을 실시간 구독
export function subscribeTodayMoods(cb: (moods: MoodMap) => void): () => void {
  const day = todayKst();
  const q = query(collection(db, 'moods'), where('day', '==', day));
  return onSnapshot(
    q,
    (snap) => {
      const m: MoodMap = {};
      snap.forEach((d) => {
        const x = d.data() as { name: string; emoji: string; note?: string };
        m[x.name] = { emoji: x.emoji, note: x.note || '' };
      });
      cb(m);
    },
    () => cb({})
  );
}
