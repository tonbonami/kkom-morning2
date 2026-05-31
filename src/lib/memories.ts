import { db } from './firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export type Memory = {
  id: string;
  imageUrl: string;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  createdAt?: Timestamp | null;
};

// 시드: public/memories의 사진 (Firestore가 비어있을 때 대체 표시)
export const SEED_MEMORIES: Memory[] = [
  {
    id: 'seed-2023-09-28',
    imageUrl: '/memories/230928.JPG',
    title: '우리 시작한 날',
    date: '2023-09-28',
    description: '꼼이와 우댕의 첫 날 💚',
  },
  {
    id: 'seed-2024-05-25',
    imageUrl: '/memories/240525.jpeg',
    title: '함께한 그날',
    date: '2024-05-25',
    description: '',
  },
];

// memories 컬렉션 실시간 구독. 비어있으면 시드 반환.
export function subscribeMemories(cb: (memories: Memory[]) => void): () => void {
  return onSnapshot(
    collection(db, 'memories'),
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Memory, 'id'>) }));
      docs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      cb(docs.length > 0 ? docs : SEED_MEMORIES);
    },
    (err) => {
      console.error('memories 구독 오류:', err);
      cb(SEED_MEMORIES);
    }
  );
}

export async function addMemory(m: Omit<Memory, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'memories'), { ...m, createdAt: serverTimestamp() });
}
