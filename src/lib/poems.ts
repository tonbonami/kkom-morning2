// 우리의 시집 — Firestore 'poems' 컬렉션.
// 시 한 편 = 사진(선택) + 텍스트(선택, 둘 중 최소 1개) + 제목 + 작성자.
// 하트 + 댓글은 reactions.ts 재활용.

import { db, storage } from './firebase';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
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
  by: '우댕' | '꼼이';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  hearts?: number;
  commentCount?: number;
}

export interface PoemItemView {
  id: string;
  title: string;
  body?: string;
  photoUrl?: string;
  by: '우댕' | '꼼이';
  createdAt: Date;
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
    by: d.by,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
    updatedAt: d.updatedAt?.toDate?.() ?? null,
    hearts: d.hearts,
    commentCount: d.commentCount,
  };
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

// 사진 1장 업로드 + Firestore 시 doc 생성. 사진은 옵션 — 텍스트만으로도 가능.
export async function addPoem(input: {
  title: string;
  body?: string;
  photoFile?: File | null;
  by: '우댕' | '꼼이';
}): Promise<string> {
  let photoUrl: string | undefined;
  if (input.photoFile) {
    const ext = input.photoFile.type.includes('png') ? 'png'
      : input.photoFile.type.includes('webp') ? 'webp' : 'jpg';
    const safeBy = input.by.replace(/[^\w가-힣]/g, '_') || 'anon';
    const path = `poems/${Date.now()}_${safeBy}.${ext}`;
    const sref = storageRef(storage, path);
    await uploadBytes(sref, input.photoFile, { contentType: input.photoFile.type || 'image/jpeg' });
    photoUrl = await getDownloadURL(sref);
  }

  const payload: DocumentData = {
    title: input.title.trim(),
    by: input.by,
    createdAt: serverTimestamp(),
  };
  if (input.body?.trim()) payload.body = input.body.trim();
  if (photoUrl) payload.photoUrl = photoUrl;

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
