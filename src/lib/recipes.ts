// 우리의 레시피 — Firestore 'recipes' 컬렉션.
// WishlistV1 패턴 그대로, 카테고리 없음. 유튜브 링크 + 사진 + 설명 + 좋아요 + 댓글.

import { db, storage } from './firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { partnerOf } from './letters';

export interface RecipeDoc {
  title: string;
  description?: string;
  youtubeUrl?: string;
  photoUrls?: string[];
  by: '우댕' | '꼼이';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  hearts?: number;
  commentCount?: number;
}

export interface RecipeItemView {
  id: string;
  title: string;
  description?: string;
  youtubeUrl?: string;
  photoUrls?: string[];
  by: '우댕' | '꼼이';
  createdAt: Date;
  updatedAt?: Date | null;
  hearts?: number;
  commentCount?: number;
}

function toView(id: string, d: RecipeDoc): RecipeItemView {
  return {
    id,
    title: d.title,
    description: d.description,
    youtubeUrl: d.youtubeUrl,
    photoUrls: Array.isArray(d.photoUrls) ? d.photoUrls.filter((u) => typeof u === 'string') : [],
    by: d.by,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
    updatedAt: d.updatedAt?.toDate?.() ?? null,
    hearts: d.hearts,
    commentCount: d.commentCount,
  };
}

export function subscribeRecipes(cb: (items: RecipeItemView[]) => void): () => void {
  return onSnapshot(
    collection(db, 'recipes'),
    (snap) => {
      const items = snap.docs.map((d) => toView(d.id, d.data() as RecipeDoc));
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      cb(items);
    },
    (err) => {
      console.error('recipes 구독 오류:', err);
      cb([]);
    }
  );
}

export async function addRecipe(input: {
  title: string;
  description?: string;
  youtubeUrl?: string;
  by: '우댕' | '꼼이';
}): Promise<string> {
  const payload: DocumentData = {
    title: input.title.trim(),
    by: input.by,
    createdAt: serverTimestamp(),
  };
  if (input.description?.trim()) payload.description = input.description.trim();
  if (input.youtubeUrl?.trim()) payload.youtubeUrl = input.youtubeUrl.trim();

  const ref = await addDoc(collection(db, 'recipes'), payload);
  // 새 레시피 푸시 — 만든 사람의 partner에게
  const to = partnerOf(input.by) as '우댕' | '꼼이';
  fetch('/api/notify-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: input.by, to, title: input.title.trim() }),
  }).catch(() => {});
  return ref.id;
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(doc(db, 'recipes', id));
}

export async function addRecipePhoto(id: string, file: File, by: '우댕' | '꼼이'): Promise<string> {
  const ext = file.type.includes('png') ? 'png'
    : file.type.includes('webp') ? 'webp'
      : 'jpg';
  const safeName = by.replace(/[^\w가-힣]/g, '_') || 'anon';
  const path = `recipes/${id}/${Date.now()}_${safeName}.${ext}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type || 'image/jpeg' });
  const url = await getDownloadURL(ref);
  await updateDoc(doc(db, 'recipes', id), {
    photoUrls: arrayUnion(url),
    updatedAt: serverTimestamp(),
  });
  return url;
}
