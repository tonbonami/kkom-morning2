import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// 2인 앱: 로그인 코드 → 이름 (정체성의 단일 출처)
export const CODE_TO_NAME: Record<string, string> = {
  '0319': '우댕',
  '0928': '꼼이',
};
export const COUPLE = ['우댕', '꼼이'] as const;

export function nameFromCode(code?: string | null): string {
  return (code && CODE_TO_NAME[code]) || '꼼이';
}

export function partnerOf(name: string): string {
  return COUPLE.find((u) => u !== name) ?? COUPLE[0];
}

export type Letter = {
  id: string;
  from: string;
  to: string;
  body: string;
  createdAt: Timestamp | null;
};

// to == 나 인 편지를 실시간 구독, 최신 1건을 콜백. 해제 함수 반환.
// (단일 필드 equality만 써서 복합 색인 불필요 — 클라이언트에서 정렬)
export function subscribeLatestLetterTo(
  name: string,
  cb: (letter: Letter | null) => void
): () => void {
  const q = query(collection(db, 'letters'), where('to', '==', name));

  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Letter, 'id'>) }));
      docs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      cb(docs[0] ?? null);
    },
    (err) => {
      console.error('편지 구독 오류:', err);
      cb(null);
    }
  );
}

// 상대에게 편지 전송
export async function sendLetter(from: string, body: string): Promise<void> {
  await addDoc(collection(db, 'letters'), {
    from,
    to: partnerOf(from),
    body: body.trim(),
    createdAt: serverTimestamp(),
  });
}
