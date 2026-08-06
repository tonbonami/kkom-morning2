// 우리 둘 실시간 채팅 — Firestore 'messages' 컬렉션. 기록 영구 저장 + onSnapshot 실시간.
// 입력중은 RTDB(chatTyping, 휘발성), 읽음은 Firestore(chatReads), 사진은 Storage.
import { db, rtdb, storage } from './firebase';
import { collection, addDoc, doc, setDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref as dbRef, set as dbSet, onValue, onDisconnect } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface ChatMessage {
  id: string;
  from: string;      // '우댕' | '꼼이'
  text: string;
  imageUrl?: string;
  sticker?: string;  // 포차코 표정 이미지 경로 (/pochacco/face_*.png)
  createdAt: Date | null;
}

// 메시지 전송 — Firestore 저장(실시간) + 상대가 접속 안 했으면 푸시(잠긴 폰).
export async function sendMessage(
  from: string, text: string, partnerOnline: boolean, imageUrl?: string, sticker?: string,
): Promise<void> {
  const t = text.trim();
  if (!t && !imageUrl && !sticker) return;
  const clipped = t.slice(0, 2000);
  const payload: Record<string, unknown> = { from, text: clipped, createdAt: serverTimestamp() };
  if (imageUrl) payload.imageUrl = imageUrl;
  if (sticker) payload.sticker = sticker;
  await addDoc(collection(db, 'messages'), payload);
  if (!partnerOnline) {
    const to = from === '우댕' ? '꼼이' : '우댕';
    const pushText = sticker ? '이모티콘을 보냈어 🐶'
      : imageUrl ? (clipped ? clipped.slice(0, 140) : '사진을 보냈어 📷')
      : clipped.slice(0, 140);
    fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, text: pushText }),
    }).catch(() => {});
  }
}

// 사진 업로드 → 다운로드 URL. Storage chat/ 아래.
export async function uploadChatImage(file: File): Promise<string> {
  const key = `chat/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const r = sRef(storage, key);
  await uploadBytes(r, file, { contentType: file.type || 'image/jpeg' });
  return getDownloadURL(r);
}

// 입력 중 — RTDB(휘발성). onDisconnect로 앱 죽어도 자동 해제.
export function setTyping(userKey: string, typing: boolean): void {
  const r = dbRef(rtdb, `chatTyping/${userKey}`);
  if (typing) { onDisconnect(r).set(false); dbSet(r, true).catch(() => {}); }
  else { dbSet(r, false).catch(() => {}); }
}
export function subscribeTyping(partnerKey: string, cb: (typing: boolean) => void): () => void {
  const r = dbRef(rtdb, `chatTyping/${partnerKey}`);
  return onValue(r, (snap) => cb(snap.val() === true), () => cb(false));
}

// 읽음 — 내가 채팅 보는 순간 내 lastRead 갱신. 상대 lastRead로 내 메시지 '읽음' 판정.
export async function markRead(userKey: string): Promise<void> {
  await setDoc(doc(db, 'chatReads', userKey), { at: serverTimestamp() }).catch(() => {});
}
export function subscribeRead(partnerKey: string, cb: (at: Date | null) => void): () => void {
  return onSnapshot(
    doc(db, 'chatReads', partnerKey),
    (snap) => { const d = snap.data() as { at?: Timestamp } | undefined; cb(d?.at?.toDate?.() ?? null); },
    () => cb(null),
  );
}

// 최근 max개 실시간 구독 (오래된→최신 순으로 콜백).
export function subscribeMessages(cb: (msgs: ChatMessage[]) => void, max = 60): () => void {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs
        .map((d) => {
          const data = d.data() as { from?: string; text?: string; imageUrl?: string; sticker?: string; createdAt?: Timestamp };
          return { id: d.id, from: data.from ?? '', text: data.text ?? '', imageUrl: data.imageUrl, sticker: data.sticker, createdAt: data.createdAt?.toDate?.() ?? null };
        })
        .reverse();
      cb(msgs);
    },
    () => cb([]),
  );
}
