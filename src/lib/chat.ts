// 우리 둘 실시간 채팅 — Firestore 'messages' 컬렉션. 기록 영구 저장 + onSnapshot 실시간.
// 입력중은 RTDB(chatTyping, 휘발성), 읽음은 Firestore(chatReads), 사진은 Storage.
import { db, rtdb, storage } from './firebase';
import {
  collection, addDoc, doc, setDoc, getDoc, getDocs, updateDoc, deleteField,
  query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { ref as dbRef, set as dbSet, onValue, onDisconnect } from 'firebase/database';
import { firstUrl, youTubeId } from './links';
import { isPractice, practiceBlocked } from './practice';
import { ref as sRef, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export interface ReplyRef { id: string; from: string; text: string }

export interface ChatMessage {
  id: string;
  from: string;      // '우댕' | '꼼이'
  text: string;
  imageUrl?: string;
  /** 여러 장 묶어 보낸 사진(2장 이상일 때만). **imageUrl 은 늘 첫 장**이다 — 이 칸을 모르는
   *  옛 화면·홈 미리보기·알림·워치가 첫 장이라도 보여 주게 한다. */
  imageUrls?: string[];
  /** 묶음 사진마다 작은 판(512px). 말풍선 격자에 건다 — 1280px 를 열 장 걸면 무겁다. 한 장짜리·옛 메시지엔 없다. */
  imageThumbs?: string[];
  sticker?: string;  // 포차코 표정 이미지 경로 (/pochacco/face_*.png)
  audioUrl?: string; // 음성 메시지
  audioDur?: number; // 음성 길이(초)
  videoUrl?: string; // 동영상 메시지
  videoDur?: number; // 동영상 길이(초)
  replyTo?: ReplyRef; // 답장 대상
  reactions?: Record<string, string>; // userKey('udaeng'|'kkomi') → 이모지
  deleted?: boolean;
  editedAt?: Date | null;  // 수정 시각(있으면 '수정됨' 표시)
  starred?: boolean;  // 추억 보관함(별표)
  capsule?: boolean;  // 타임캡슐 (createdAt = 미래 도착 시각)
  kind?: 'calendar';  // 꼼모닝이 넣는 안내 카드(from '꼼모닝') — 달력 하루 전 알림 등. 가운데 작은 카드로 그린다
  createdAt: Date | null;
}

// 메시지 전송 — Firestore 저장(실시간) + 상대가 접속 안 했으면 푸시(잠긴 폰).
export async function sendMessage(
  from: string, text: string, partnerOnline: boolean,
  imageUrl?: string, sticker?: string, replyTo?: ReplyRef,
  audio?: { url: string; dur: number },
  video?: { url: string; dur?: number },
): Promise<void> {
  if (isPractice()) { practiceBlocked(sticker ? (text.trim() ? `이모티콘 + 「${text.trim().slice(0, 20)}」` : '이모티콘') : imageUrl ? '사진' : audio ? '음성' : video ? '동영상' : `「${text.trim().slice(0, 20)}」`); return; }
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
  // 잠금화면 알림 — 항상 서버로 보내고, 서버가 받는 사람의 '최신 presence'로 판단한다
  //   (진짜 앱 보고 있으면 스킵 / 아니면 무조건 푸시).
  // ⚠️ 예전엔 여기(클라)서 partnerOnline이면 아예 안 보냈다. presence가 '지금 함께'로 오탐되면
  //    꼼이 톡이 우댕 잠금화면에 통째로 안 뜨던 원인. 이제 클라 판단에 안 맡기고 서버가 authoritative하게 결정.
  void partnerOnline;
  const to = from === '우댕' ? '꼼이' : '우댕';
  // 링크는 잠금화면에도 주소 대신 종류 라벨로.
  const linkUrl = firstUrl(clipped);
  const withLinkLabel = linkUrl
    ? (() => {
        const tag = youTubeId(linkUrl) ? '▶️ 유튜브 영상' : '🔗 링크';
        const rest = clipped.replace(/https?:\/\/[^\s<]+/gi, '').trim();
        return (rest ? `${rest} ${tag}` : tag);
      })()
    : clipped;
  const plain = withLinkLabel.replace(/\[\[e:[a-z]+\]\]/g, '🐶').slice(0, 140); // 미니 이모티콘 토큰 → 🐶
  const pushText = video ? '동영상을 보냈어 🎬'
    : audio ? '음성 메시지를 보냈어 🎤'
    : sticker ? (plain ? `${plain} 🐶` : '이모티콘을 보냈어 🐶')
    : imageUrl ? (plain || '사진을 보냈어 📷')
    : plain;
  fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, text: pushText }),
  }).catch(() => {});
}

// 사진 업로드 → 다운로드 URL. Storage chat/ 아래.
export async function uploadChatImage(file: File): Promise<string> {
  if (isPractice()) return URL.createObjectURL(file);
  const key = `chat/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const r = sRef(storage, key);
  await uploadBytes(r, file, { contentType: file.type || 'image/jpeg' });
  return getDownloadURL(r);
}

// ── 사진 여러 장 묶어 보내기(사이담 a9daf51 이식, 우댕 2026-11-15) ──────────────────
/** 한 번에 보낼 수 있는 사진 수. 카카오톡처럼 묶음 말풍선 하나로 간다. */
export const MAX_CHAT_PHOTOS = 10;

async function resizeImage(file: File, maxSide: number, quality: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('이미지를 읽지 못했어요.'));
      i.src = url;
    });
    let w = img.naturalWidth, h = img.naturalHeight;
    const long = Math.max(w, h);
    if (long > maxSide) { const r = maxSide / long; w = Math.round(w * r); h = Math.round(h * r); }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', quality));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 묶음 사진 하나를 큰 판(1280px)·작은 판(512px) 두 벌로 올린다. Storage chat/ 아래(규칙은 skin/ 만 막는다).
 *  ⚠️ 열 장을 원본으로 올리면 한 장 4MB × 10 — 약한 망에서 한참 걸리고 내려받는 쪽도 무겁다. */
export async function uploadChatImagePair(file: File): Promise<{ url: string; thumbUrl: string }> {
  if (isPractice()) { const u = URL.createObjectURL(file); return { url: u, thumbUrl: u }; }
  const [full, thumb] = await Promise.all([resizeImage(file, 1280, 0.82), resizeImage(file, 512, 0.7)]);
  const base = `chat/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const put = async (blob: Blob, key: string) => {
    const r = sRef(storage, key);
    await uploadBytes(r, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(r);
  };
  const [url, thumbUrl] = await Promise.all([put(full, `${base}.jpg`), put(thumb, `${base}_t.jpg`)]);
  return { url, thumbUrl };
}

/**
 * 고른 사진들을 세 장씩 나눠 올린다(열 장을 한꺼번에 올리면 약한 망에서 전부 같이 느려진다).
 * ⚠️ 한 장이라도 실패하면 **아무것도 안 보낸다**(반쪽 묶음 금지) — 먼저 올라간 것도 지우고 던진다.
 */
export async function uploadPhotoBatch(files: File[]): Promise<{ url: string; thumbUrl: string }[]> {
  const imgs = files.filter((f) => f.type.startsWith('image/')).slice(0, MAX_CHAT_PHOTOS);
  const out: { url: string; thumbUrl: string }[] = [];
  let failed: unknown = null;
  for (let i = 0; i < imgs.length && !failed; i += 3) {
    const part = await Promise.allSettled(imgs.slice(i, i + 3).map((f) => uploadChatImagePair(f)));
    for (const r of part) {
      if (r.status === 'fulfilled') out.push(r.value);
      else failed = r.reason ?? new Error('upload');
    }
  }
  if (failed) {
    if (!isPractice()) {
      await Promise.all(out.flatMap((x) => [x.url, x.thumbUrl]).filter((u) => u.includes('firebasestorage'))
        .map((u) => deleteObject(sRef(storage, u)).catch(() => {})));
    }
    throw failed;
  }
  return out;
}

/**
 * 사진 여러 장을 **메시지 하나 + 알림 하나**로 보낸다.
 * ⚠️ 한 장에 메시지 하나씩 보내면 상대 폰이 **열 번 운다**(/api/message 는 묶지 않는다).
 * ⚠️ imageUrl 에 **첫 장**을 넣는다 — imageUrls 를 모르는 옛 화면·홈 미리보기·워치가 첫 장이라도 보이게.
 */
export async function sendPhotos(
  from: string, imgs: { url: string; thumbUrl: string }[], replyTo?: ReplyRef,
): Promise<void> {
  const list = imgs.filter((x) => x.url).slice(0, MAX_CHAT_PHOTOS);
  if (!list.length) return;
  if (isPractice()) { practiceBlocked(`사진 ${list.length}장`); return; }
  const payload: Record<string, unknown> = {
    from, text: '', createdAt: serverTimestamp(),
    imageUrl: list[0].url,
    imageThumbs: list.map((x) => x.thumbUrl || x.url),
  };
  if (list.length > 1) payload.imageUrls = list.map((x) => x.url);
  if (replyTo) payload.replyTo = { id: replyTo.id, from: replyTo.from, text: replyTo.text.slice(0, 80) };
  await addDoc(collection(db, 'messages'), payload);
  const to = from === '우댕' ? '꼼이' : '우댕';
  fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, text: list.length > 1 ? `사진 ${list.length}장을 보냈어 📷` : '사진을 보냈어 📷' }),
  }).catch(() => {});
}

/** 이 메시지의 사진 전부(큰 판). 한 장짜리·옛 메시지도 같은 모양으로. */
export function photosOf(m: Pick<ChatMessage, 'imageUrl' | 'imageUrls'>): string[] {
  if (m.imageUrls?.length) return m.imageUrls;
  return m.imageUrl ? [m.imageUrl] : [];
}

/** 메시지를 지울 때 함께 지울 Storage 파일 주소 — 사진(묶음·작은 판 포함)·영상·음성. 겹치는 주소는 한 번만. */
export function chatFileUrls(d: Record<string, unknown> | undefined): string[] {
  if (!d) return [];
  const out = new Set<string>();
  const add = (v: unknown) => { if (typeof v === 'string' && v.includes('firebasestorage')) out.add(v); };
  add(d.imageUrl); add(d.videoUrl); add(d.audioUrl);
  for (const k of ['imageUrls', 'imageThumbs']) {
    const arr = d[k];
    if (Array.isArray(arr)) arr.forEach(add);
  }
  return [...out];
}

// 동영상 업로드 → 다운로드 URL. Storage chat-video/ 아래. 파일이 커서 진행률 콜백 지원(resumable).
export async function uploadChatVideo(file: File, onProgress?: (pct: number) => void): Promise<string> {
  if (isPractice()) return URL.createObjectURL(file);
  const key = `chat-video/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`;
  const r = sRef(storage, key);
  const meta = { contentType: file.type || 'video/mp4' };
  if (!onProgress) { await uploadBytes(r, file, meta); return getDownloadURL(r); }
  const task = uploadBytesResumable(r, file, meta);
  await new Promise<void>((resolve, reject) => {
    task.on('state_changed',
      (snap) => onProgress(snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0),
      reject,
      () => resolve(),
    );
  });
  return getDownloadURL(r);
}

// 타임캡슐 — 미래 도착 시각을 createdAt으로 저장. 도착 전엔 클라가 (내 것 빼고) 숨김.
export async function sendCapsule(from: string, text: string, deliverAt: Date): Promise<void> {
  if (isPractice()) { practiceBlocked('타임캡슐'); return; }
  const t = text.trim();
  if (!t) return;
  await addDoc(collection(db, 'messages'), {
    from, text: t.slice(0, 2000), capsule: true, createdAt: Timestamp.fromDate(deliverAt),
  });
}

// 음성 업로드 → 다운로드 URL. Storage chat-audio/ 아래.
export async function uploadChatAudio(blob: Blob): Promise<string> {
  if (isPractice()) return URL.createObjectURL(blob);
  const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('webm') ? 'webm' : 'dat';
  const key = `chat-audio/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const r = sRef(storage, key);
  await uploadBytes(r, blob, { contentType: blob.type || 'audio/webm' });
  return getDownloadURL(r);
}

// 입력 중 — RTDB(휘발성). onDisconnect로 앱 죽어도 자동 해제.
export function setTyping(userKey: string, typing: boolean): void {
  if (isPractice()) return;
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
  if (isPractice()) return;
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
  if (isPractice()) { practiceBlocked(`반응 ${emoji}`); return; }
  const ref = doc(db, 'messages', messageId);
  const snap = await getDoc(ref);
  const cur = ((snap.data()?.reactions ?? {}) as Record<string, string>)[userKey];
  await updateDoc(ref, { [`reactions.${userKey}`]: cur === emoji ? deleteField() : emoji });
}

// 메시지 삭제 — 양쪽에서 '삭제된 메시지'로 표시(soft delete).
// 메시지 삭제 — 필드만 비우지 않고 Storage 파일(사진·영상·음성)도 함께 지운다.
//   예전엔 필드만 deleteField 해서 파일이 Storage에 남고, 저장해 둔 다운로드 URL로 계속 열렸다(고아).
//   'firebasestorage' URL만 지운다 — 스티커(로컬 경로)·레거시 base64 음성은 건드리지 않는다.
//   ref(storage, downloadUrl)은 Firebase 다운로드 URL을 그대로 받아 레퍼런스를 만든다.
export async function deleteMessage(messageId: string): Promise<void> {
  if (isPractice()) { practiceBlocked('삭제'); return; }
  const ref = doc(db, 'messages', messageId);
  try {
    const snap = await getDoc(ref);
    // ⚠️ 묶음 사진(imageUrls)·작은 판(imageThumbs)까지 지운다 — 안 하면 2번째 이후 사진이 고아로 남아 주소로 계속 열린다.
    await Promise.all(chatFileUrls(snap.data()).map((url) =>
      deleteObject(sRef(storage, url)).catch(() => { /* 이미 없거나 접근불가 — 문서 삭제는 계속 */ })));
  } catch { /* 문서 조회 실패해도 아래 필드 비우기는 진행 */ }
  await updateDoc(ref, {
    deleted: true, text: '',
    imageUrl: deleteField(), imageUrls: deleteField(), imageThumbs: deleteField(),
    sticker: deleteField(), videoUrl: deleteField(),
    audioUrl: deleteField(), audioDur: deleteField(),
  });
}

// 메시지 수정 — 내 텍스트 메시지 본문만. editedAt 기록 → 말풍선에 '수정됨' 표시.
//   상대 글은 고칠 수 없다(남의 이름으로 안 한 말이 남으니까 — UI에서도 내 것만 수정 버튼).
export async function editMessage(messageId: string, text: string): Promise<void> {
  if (isPractice()) { practiceBlocked('수정'); return; }
  const t = text.trim();
  if (!t) return;
  await updateDoc(doc(db, 'messages', messageId), { text: t, editedAt: serverTimestamp() });
}

// 별표(추억 보관함) 토글 — 둘 중 누구나 별표 가능(공유).
export async function toggleStar(messageId: string): Promise<void> {
  if (isPractice()) { practiceBlocked('별표'); return; }
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
        imageUrls: Array.isArray(data.imageUrls) ? (data.imageUrls as string[]) : undefined,
        imageThumbs: Array.isArray(data.imageThumbs) ? (data.imageThumbs as string[]) : undefined,
        audioUrl: data.audioUrl as string | undefined, audioDur: data.audioDur as number | undefined,
        videoUrl: data.videoUrl as string | undefined, videoDur: data.videoDur as number | undefined,
        replyTo: data.replyTo as ReplyRef | undefined, reactions: data.reactions as Record<string, string> | undefined,
        deleted: data.deleted as boolean | undefined, starred: data.starred as boolean | undefined,
        capsule: data.capsule as boolean | undefined, kind: data.kind as 'calendar' | undefined,
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
            from?: string; text?: string; imageUrl?: string; imageUrls?: string[]; imageThumbs?: string[]; sticker?: string;
            audioUrl?: string; audioDur?: number; videoUrl?: string; videoDur?: number;
            replyTo?: ReplyRef; reactions?: Record<string, string>; deleted?: boolean; starred?: boolean; capsule?: boolean; kind?: 'calendar'; createdAt?: Timestamp; editedAt?: Timestamp;
          };
          return {
            id: d.id, from: data.from ?? '', text: data.text ?? '',
            imageUrl: data.imageUrl, sticker: data.sticker,
            imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : undefined,
            imageThumbs: Array.isArray(data.imageThumbs) ? data.imageThumbs : undefined,
            audioUrl: data.audioUrl, audioDur: data.audioDur,
            videoUrl: data.videoUrl, videoDur: data.videoDur, replyTo: data.replyTo,
            reactions: data.reactions, deleted: data.deleted, starred: data.starred, capsule: data.capsule, kind: data.kind,
            createdAt: data.createdAt?.toDate?.() ?? null,
            editedAt: data.editedAt?.toDate?.() ?? null,
          };
        })
        .reverse();
      cb(msgs);
    },
    () => cb([]),
  );
}
