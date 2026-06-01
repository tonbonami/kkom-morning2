// '또 갈래' 컬렉션 — 위시리스트에서 ✓ 체크되어 옮겨진 항목 + 직접 추가 가능
// 카테고리는 원본(food/place/watch) 그대로 표시용으로 유지

import { db } from './firebase';
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
import type { WishCategory, WishPreview } from './wishlist';

export interface AgainDoc {
  category: WishCategory;
  title: string;
  url?: string;
  preview?: WishPreview;
  location?: string;
  memo?: string;
  by: '우댕' | '꼼이';          // 처음 위시리스트에 추가한 사람 (또는 직접 추가한 사람)
  sentBy: '우댕' | '꼼이';      // 또 갈래로 옮긴 사람
  sentAt?: Timestamp | null;
  wishlistCreatedAt?: Timestamp | null;
}

export interface AgainItemView {
  id: string;
  category: WishCategory;
  title: string;
  url?: string;
  preview?: WishPreview;
  location?: string;
  memo?: string;
  by: '우댕' | '꼼이';
  sentBy: '우댕' | '꼼이';
  sentAt: Date;
  wishlistCreatedAt?: Date;
}

function toView(id: string, d: AgainDoc): AgainItemView {
  return {
    id,
    category: d.category,
    title: d.title,
    url: d.url,
    preview: d.preview,
    location: d.location,
    memo: d.memo,
    by: d.by,
    sentBy: d.sentBy,
    sentAt: d.sentAt?.toDate?.() ?? new Date(),
    wishlistCreatedAt: d.wishlistCreatedAt?.toDate?.(),
  };
}

export function subscribeAgain(cb: (items: AgainItemView[]) => void): () => void {
  return onSnapshot(
    collection(db, 'again'),
    (snap) => {
      const items = snap.docs.map((d) => toView(d.id, d.data() as AgainDoc));
      items.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
      cb(items);
    },
    (err) => {
      console.error('again 구독 오류:', err);
      cb([]);
    }
  );
}

// 또 갈래에 추가 — 위시리스트 항목 정보를 그대로 복사
export async function addAgain(input: {
  category: WishCategory;
  title: string;
  url?: string;
  preview?: WishPreview;
  location?: string;
  memo?: string;
  by: '우댕' | '꼼이';
  sentBy: '우댕' | '꼼이';
  wishlistCreatedAt?: Date | null;
}): Promise<string> {
  const payload: DocumentData = {
    category: input.category,
    title: input.title,
    by: input.by,
    sentBy: input.sentBy,
    sentAt: serverTimestamp(),
  };
  if (input.url) payload.url = input.url;
  if (input.preview) payload.preview = input.preview;
  if (input.location) payload.location = input.location;
  if (input.memo) payload.memo = input.memo;
  if (input.wishlistCreatedAt) payload.wishlistCreatedAt = Timestamp.fromDate(input.wishlistCreatedAt);

  const ref = await addDoc(collection(db, 'again'), payload);
  return ref.id;
}

export async function deleteAgain(id: string): Promise<void> {
  await deleteDoc(doc(db, 'again', id));
}
