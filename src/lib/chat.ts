// 우리 둘 실시간 채팅 — Firestore 'messages' 컬렉션. 기록 영구 저장 + onSnapshot 실시간.
import { db } from './firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  from: string;      // '우댕' | '꼼이'
  text: string;
  createdAt: Date | null;
}

// 메시지 전송 — Firestore 저장(실시간) + 상대가 접속 안 했으면 푸시(잠긴 폰).
export async function sendMessage(from: string, text: string, partnerOnline: boolean): Promise<void> {
  const t = text.trim();
  if (!t) return;
  const clipped = t.slice(0, 2000);
  await addDoc(collection(db, 'messages'), { from, text: clipped, createdAt: serverTimestamp() });
  // 상대가 접속 중이면 실시간으로 바로 보임 → 배너 스팸 방지로 푸시 생략. 떨어져 있으면 푸시.
  if (!partnerOnline) {
    const to = from === '우댕' ? '꼼이' : '우댕';
    fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, text: clipped.slice(0, 140) }),
    }).catch(() => {});
  }
}

// 최근 max개 실시간 구독 (오래된→최신 순으로 콜백).
export function subscribeMessages(cb: (msgs: ChatMessage[]) => void, max = 60): () => void {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs
        .map((d) => {
          const data = d.data() as { from?: string; text?: string; createdAt?: Timestamp };
          return { id: d.id, from: data.from ?? '', text: data.text ?? '', createdAt: data.createdAt?.toDate?.() ?? null };
        })
        .reverse();
      cb(msgs);
    },
    () => cb([]),
  );
}
