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

export type Voice = { mime: string; data: string; duration?: number };

export type Letter = {
  id: string;
  from: string;
  to: string;
  body: string;
  createdAt: Timestamp | null;
  openAt?: Timestamp | null; // 예약 도착 시각 (없으면 즉시)
  voice?: Voice | null;      // 10초 보이스 편지 (base64 — Storage 없이 Firestore 직접)
};

function ms(t?: Timestamp | null): number {
  return t?.toMillis?.() ?? 0;
}

// 예약 편지가 아직 도착 전인지 (잠김)
export function isLocked(letter: Letter): boolean {
  if (!letter.openAt) return false;
  return ms(letter.openAt) > Date.now();
}

// to == 나 이고 '이미 도착한' 최신 편지 1건을 실시간 구독.
export function subscribeLatestLetterTo(
  name: string,
  cb: (letter: Letter | null) => void
): () => void {
  const q = query(collection(db, 'letters'), where('to', '==', name));

  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Letter, 'id'>) }))
        .filter((l) => !isLocked(l)); // 예약 미도착 편지는 제외
      docs.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
      cb(docs[0] ?? null);
    },
    (err) => {
      console.error('편지 구독 오류:', err);
      cb(null);
    }
  );
}

// 보관함: 두 사람 사이 모든 편지를 최신순으로 실시간 구독 (잠긴 것도 포함, UI에서 표시)
export function subscribeAllLetters(cb: (letters: Letter[]) => void): () => void {
  return onSnapshot(
    collection(db, 'letters'),
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Letter, 'id'>) }));
      docs.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
      cb(docs);
    },
    (err) => {
      console.error('편지 목록 구독 오류:', err);
      cb([]);
    }
  );
}

// 상대에게 편지 전송 (openAt 주면 예약 편지, voice 주면 음성 편지)
export async function sendLetter(
  from: string,
  body: string,
  openAt?: Date | null,
  voice?: Voice | null
): Promise<void> {
  const data: Record<string, unknown> = {
    from,
    to: partnerOf(from),
    body: body.trim(),
    createdAt: serverTimestamp(),
  };
  if (openAt) data.openAt = Timestamp.fromDate(openAt);
  if (voice && voice.data) data.voice = voice;
  await addDoc(collection(db, 'letters'), data);
}
