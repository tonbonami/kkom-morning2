// 우리의 시집 — Firestore 'poems' 컬렉션.
// 시 한 편 = 사진(선택) + 텍스트(선택, 둘 중 최소 1개) + 제목 + 작성자.
// 하트 + 댓글은 reactions.ts 재활용.

import { db, storage } from './firebase';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { partnerOf } from './letters';

export interface PoemDoc {
  title: string;
  body?: string;        // 타이핑 또는 OCR로 채운 시 본문 (옵션)
  photoUrl?: string;    // 시를 찍은 사진 URL (옵션)
  artUrl?: string;      // 시화(詩畵) — 시와 어울리는 그림. 정사각형으로 상단에 노출 (옵션)
  by: '우댕' | '꼼이';
  createdAt?: Timestamp | null;   // 시를 '쓴' 날 (과거 시 백필 시 실제 작성일)
  postedAt?: Timestamp | null;    // 시집에 '올린' 시각 — NEW 판정은 이걸로
  updatedAt?: Timestamp | null;
  hearts?: number;
  commentCount?: number;
}

export interface PoemItemView {
  id: string;
  title: string;
  body?: string;
  photoUrl?: string;
  artUrl?: string;
  by: '우댕' | '꼼이';
  createdAt: Date;
  postedAt?: Date | null;
  updatedAt?: Date | null;
  hearts?: number;
  commentCount?: number;
}

function toView(id: string, d: PoemDoc): PoemItemView {
  return {
    id,
    title: d.title,
    body: d.body,
    photoUrl: d.photoUrl,
    artUrl: d.artUrl,
    by: d.by,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
    postedAt: d.postedAt?.toDate?.() ?? null,
    updatedAt: d.updatedAt?.toDate?.() ?? null,
    hearts: d.hearts,
    commentCount: d.commentCount,
  };
}

// 이미지 1장 Storage 업로드 → 다운로드 URL. (시 사진 / 시화 공용)
async function uploadImage(file: File, kind: 'photo' | 'art', by: string): Promise<string> {
  const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
  const safeBy = by.replace(/[^\w가-힣]/g, '_') || 'anon';
  const path = `poems/${kind}_${Date.now()}_${safeBy}.${ext}`;
  const sref = storageRef(storage, path);
  await uploadBytes(sref, file, { contentType: file.type || 'image/jpeg' });
  return getDownloadURL(sref);
}

export function subscribePoems(cb: (items: PoemItemView[]) => void): () => void {
  return onSnapshot(
    collection(db, 'poems'),
    (snap) => {
      const items = snap.docs.map((d) => toView(d.id, d.data() as PoemDoc));
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      cb(items);
    },
    (err) => {
      console.error('poems 구독 오류:', err);
      cb([]);
    }
  );
}

// 사진/시화 업로드 + Firestore 시 doc 생성. 둘 다 옵션 — 텍스트만으로도 가능.
export async function addPoem(input: {
  title: string;
  body?: string;
  photoFile?: File | null;
  artFile?: File | null;
  by: '우댕' | '꼼이';
}): Promise<string> {
  const [photoUrl, artUrl] = await Promise.all([
    input.photoFile ? uploadImage(input.photoFile, 'photo', input.by) : undefined,
    input.artFile ? uploadImage(input.artFile, 'art', input.by) : undefined,
  ]);

  const payload: DocumentData = {
    title: input.title.trim(),
    by: input.by,
    createdAt: serverTimestamp(),
    postedAt: serverTimestamp(),
  };
  if (input.body?.trim()) payload.body = input.body.trim();
  if (photoUrl) payload.photoUrl = photoUrl;
  if (artUrl) payload.artUrl = artUrl;

  const ref = await addDoc(collection(db, 'poems'), payload);

  // 새 시 푸시 — 만든 사람의 partner에게
  const to = partnerOf(input.by) as '우댕' | '꼼이';
  fetch('/api/notify-poem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: input.by, to, title: input.title.trim() }),
  }).catch(() => {});

  return ref.id;
}

export async function deletePoem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'poems', id));
}

// 이미 올라간 시에 시화만 따로 붙이기/바꾸기 (둘 다 가능 — 상대 시에 그림 선물 OK)
export async function setPoemArt(id: string, file: File, by: '우댕' | '꼼이'): Promise<string> {
  const artUrl = await uploadImage(file, 'art', by);
  await updateDoc(doc(db, 'poems', id), { artUrl, updatedAt: serverTimestamp() });
  return artUrl;
}

export async function removePoemArt(id: string): Promise<void> {
  await updateDoc(doc(db, 'poems', id), { artUrl: deleteField(), updatedAt: serverTimestamp() });
}

// ── '새 시' 안읽음 판정 ──────────────────────────────────────────
// createdAt은 '쓴 날'(과거 시 백필 가능)이라 NEW 판정엔 postedAt(올린 시각)을 우선 씀.
// 24h 창 대신 '볼 때까지 유지' 방식 — 상대가 늦게 열어도 배지가 안 사라짐.
// 작성자 구분은 안 함: 상대 시를 대신 옮겨 적어 올리는 경우가 있어서(손글씨 시 대필),
// '시집에 새로 올라온 편수' 자체를 알리는 게 맞음. 내가 올린 직후엔 markPoemsSeen으로 즉시 정리.
const POEMS_SEEN_KEY = 'kkom-poems-lastseen';
const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 아무리 안 봐도 2주 지나면 NEW 해제

export function poemPostedTime(p: PoemItemView): number {
  return (p.postedAt ?? p.createdAt).getTime();
}

export function readPoemsLastSeen(): number {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(POEMS_SEEN_KEY) || 0);
}

export function markPoemsSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(POEMS_SEEN_KEY, String(Date.now()));
}

export function isNewPoem(p: PoemItemView, lastSeen: number): boolean {
  const t = poemPostedTime(p);
  return t > lastSeen && Date.now() - t < NEW_WINDOW_MS;
}

export function countNewPoems(items: PoemItemView[], lastSeen: number): number {
  return items.filter((p) => isNewPoem(p, lastSeen)).length;
}
