// 우리 둘 실시간 채팅 — Firestore 'messages' 컬렉션. 기록 영구 저장 + onSnapshot 실시간.
// 입력중은 RTDB(chatTyping, 휘발성), 읽음은 Firestore(chatReads), 사진은 Storage.
import { db, rtdb, storage } from './firebase';
import {
  collection, addDoc, doc, setDoc, getDoc, getDocs, updateDoc, deleteField,
  query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { ref as dbRef, set as dbSet, onValue, onDisconnect } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface ReplyRef { id: string; from: string; text: string }

export interface ChatMessage {
  id: string;
  from: string;      // '우댕' | '꼼이'
  text: string;
  imageUrl?: string;
  sticker?: string;  // 포차코 표정 이미지 경로 (/pochacco/face_*.png)
  audioUrl?: string; // 음성 메시지
  audioDur?: number; // 음성 길이(초)
  videoUrl?: string; // 동영상 메시지
  videoDur?: number; // 동영상 길이(초)
  replyTo?: ReplyRef; // 답장 대상
  reactions?: Record<string, string>; // userKey('udaeng'|'kkomi') → 이모지
  deleted?: boolean;
  starred?: boolean;  // 추억 보관함(별표)
  capsule?: boolean;  // 타임캡슐 (createdAt = 미래 도착 시각)
  createdAt: Date | null;
}

// 메시지 전송 — Firestore 저장(실시간) + 상대가 접속 안 했으면 푸시(잠긴 폰).
export async function sendMessage(
  from: string, text: string, partnerOnline: boolean,
  imageUrl?: string, sticker?: string, replyTo?: ReplyRef,
  audio?: { url: string; dur: number },
  video?: { url: string; dur?: number },
): Promise<void> {
  const t = text.trim();
  if (!t && !imageUrl && !sticker && !audio && !video) return;
  const clipped = t.slice(0, 2000);
  const payload: Record<string, unknown> = { from, text: clipped, createdAt: serverTimestamp() };
  if (imageUrl) payload.imageUrl = imageUrl;
  if (sticker) payload.sticker = sticker;
  if (audio) { payload.audioUrl = audio.url; payload.audioDur = audio.dur; }
  if (video) { payload.videoUrl = video.url; if (video.dur != null) payload.videoDur = video.dur; }
  if (replyTo) payload.replyTo = { id: replyTo.id, from: replyTo.from, text: replyTo.text.slice(0, 80) };
  await addDoc(collection(db, 'messages'), payload);
  if (!partnerOnline) {
    const to = from === '우댕' ? '꼼이' : '우댕';
    const plain = clipped.replace(/\[\[e:[a-z]+\]\]/g, '🐶').slice(0, 140); // 미니 이모티콘 토큰 → 🐶
    const pushText = video ? '동영상을 보냈어 🎬'
      : audio ? '음성 메시지를 보냈어 🎤'
      : sticker ? '이모티콘을 보냈어 🐶'
      : imageUrl ? (plain || '사진을 보냈어 📷')
      : plain;
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

// 동영상 업로드 → 다운로드 URL. Storage chat-video/ 아래. (사진과 동일 방식, 파일만 큼)
export async function uploadChatVideo(file: File): Promise<string> {
  const key = `chat-video/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`;
  const r = sRef(storage, key);
  await uploadBytes(r, file, { contentType: file.type || 'video/mp4' });
  return getDownloadURL(r);
}

// 타임캡슐 — 미래 도착 시각을 createdAt으로 저장. 도착 전엔 클라가 (내 것 빼고) 숨김.
export async function sendCapsule(from: string, text: string, deliverAt: Date): Promise<void> {
  const t = text.trim();
  if (!t) return;
  await addDoc(collection(db, 'messages'), {
    from, text: t.slice(0, 2000), capsule: true, createdAt: Timestamp.fromDate(deliverAt),
  });
}

// 음성 업로드 → 다운로드 URL. Storage chat-audio/ 아래.
export async function uploadChatAudio(blob: Blob): Promise<string> {
  const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('webm') ? 'webm' : 'dat';
  const key = `chat-audio/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const r = sRef(storage, key);
  await uploadBytes(r, blob, { contentType: blob.type || 'audio/webm' });
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

// 메시지 반응(이모지) — 유저당 1개, 같은 이모지 다시 누르면 취소.
export async function toggleReaction(messageId: string, userKey: string, emoji: string): Promise<void> {
  const ref = doc(db, 'messages', messageId);
  const snap = await getDoc(ref);
  const cur = ((snap.data()?.reactions ?? {}) as Record<string, string>)[userKey];
  await updateDoc(ref, { [`reactions.${userKey}`]: cur === emoji ? deleteField() : emoji });
}

// 메시지 삭제 — 양쪽에서 '삭제된 메시지'로 표시(soft delete).
export async function deleteMessage(messageId: string): Promise<void> {
  await updateDoc(doc(db, 'messages', messageId), {
    deleted: true, text: '', imageUrl: deleteField(), sticker: deleteField(), videoUrl: deleteField(),
  });
}

// 별표(추억 보관함) 토글 — 둘 중 누구나 별표 가능(공유).
export async function toggleStar(messageId: string): Promise<void> {
  const ref = doc(db, 'messages', messageId);
  const snap = await getDoc(ref);
  const cur = snap.data()?.starred === true;
  await updateDoc(ref, { starred: !cur });
}

// 추억 보관함용 — 최근 max개 한 번 조회(별표/사진 필터는 호출처에서, 오래된→최신).
export async function fetchRecentMessages(max = 300): Promise<ChatMessage[]> {
  const snap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown> & { createdAt?: Timestamp };
      return {
        id: d.id, from: (data.from as string) ?? '', text: (data.text as string) ?? '',
        imageUrl: data.imageUrl as string | undefined, sticker: data.sticker as string | undefined,
        audioUrl: data.audioUrl as string | undefined, audioDur: data.audioDur as number | undefined,
        videoUrl: data.videoUrl as string | undefined, videoDur: data.videoDur as number | undefined,
        replyTo: data.replyTo as ReplyRef | undefined, reactions: data.reactions as Record<string, string> | undefined,
        deleted: data.deleted as boolean | undefined, starred: data.starred as boolean | undefined,
        capsule: data.capsule as boolean | undefined,
        createdAt: data.createdAt?.toDate?.() ?? null,
      } as ChatMessage;
    })
    .reverse();
}

// 최근 max개 실시간 구독 (오래된→최신 순으로 콜백).
export function subscribeMessages(cb: (msgs: ChatMessage[]) => void, max = 60): () => void {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs
        .map((d) => {
          const data = d.data() as {
            from?: string; text?: string; imageUrl?: string; sticker?: string;
            audioUrl?: string; audioDur?: number; videoUrl?: string; videoDur?: number;
            replyTo?: ReplyRef; reactions?: Record<string, string>; deleted?: boolean; starred?: boolean; capsule?: boolean; createdAt?: Timestamp;
          };
          return {
            id: d.id, from: data.from ?? '', text: data.text ?? '',
            imageUrl: data.imageUrl, sticker: data.sticker,
            audioUrl: data.audioUrl, audioDur: data.audioDur,
            videoUrl: data.videoUrl, videoDur: data.videoDur, replyTo: data.replyTo,
            reactions: data.reactions, deleted: data.deleted, starred: data.starred, capsule: data.capsule,
            createdAt: data.createdAt?.toDate?.() ?? null,
          };
        })
        .reverse();
      cb(msgs);
    },
    () => cb([]),
  );
}
