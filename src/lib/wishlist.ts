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

export type WishCategory = 'food' | 'place' | 'watch';

export interface WishPreview {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

// Firestore 스키마 (저장 형태)
export interface WishDoc {
  category: WishCategory;
  title: string;
  url?: string;
  preview?: WishPreview;
  location?: string;
  memo?: string;
  photoUrls?: string[];
  by: '우댕' | '꼼이';
  done: boolean;
  doneAt?: Timestamp | null;
  doneBy?: '우댕' | '꼼이' | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null; // 사진 추가 등 변경 시각 — NEW 배지 판단용
  hearts?: number;
  commentCount?: number;
}

// UI(WishlistV1)가 받는 형태 — Date 객체
export interface WishItemView {
  id: string;
  category: WishCategory;
  title: string;
  url?: string;
  preview?: WishPreview;
  location?: string;
  memo?: string;
  photoUrls?: string[];
  by: '우댕' | '꼼이';
  done: boolean;
  doneAt?: Date | null;
  doneBy?: '우댕' | '꼼이' | null;
  createdAt: Date;
  updatedAt?: Date | null;
  hearts?: number;
  commentCount?: number;
}

function toView(id: string, d: WishDoc): WishItemView {
  return {
    id,
    category: d.category,
    title: d.title,
    url: d.url,
    preview: d.preview,
    location: d.location,
    memo: d.memo,
    photoUrls: Array.isArray(d.photoUrls) ? d.photoUrls.filter((url) => typeof url === 'string') : [],
    by: d.by,
    done: !!d.done,
    doneAt: d.doneAt?.toDate?.() ?? null,
    doneBy: d.doneBy ?? null,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
    updatedAt: d.updatedAt?.toDate?.() ?? null,
    hearts: d.hearts,
    commentCount: d.commentCount,
  };
}

// 전체 위시 실시간 구독 (최신 생성 순)
export function subscribeWishlist(cb: (items: WishItemView[]) => void): () => void {
  return onSnapshot(
    collection(db, 'wishlist'),
    (snap) => {
      const items = snap.docs.map((d) => toView(d.id, d.data() as WishDoc));
      // createdAt desc (toView에서 Date 변환됨)
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      cb(items);
    },
    (err) => {
      console.error('wishlist 구독 오류:', err);
      cb([]);
    }
  );
}

// 추가 — URL 있으면 OG 프리뷰까지 같이 저장
export async function addWish(input: {
  category: WishCategory;
  title: string;
  url?: string;
  location?: string;
  memo?: string;
  by: '우댕' | '꼼이';
}): Promise<string> {
  // URL 주어지면 OG 미리보기 fetch
  let preview: WishPreview | undefined;
  if (input.url) {
    try {
      const r = await fetch(`/api/og-preview?url=${encodeURIComponent(input.url)}`);
      const data = await r.json();
      if (data && !data.error) {
        // undefined 필드는 Firestore에 저장 안 되므로 깔끔히 정리
        const built: WishPreview = {};
        if (data.title) built.title = data.title;
        if (data.description) built.description = data.description;
        if (data.image) built.image = data.image;
        if (data.siteName) built.siteName = data.siteName;
        if (Object.keys(built).length > 0) preview = built;
      }
    } catch {
      // 프리뷰 실패해도 본문 저장은 진행
    }
  }

  const payload: DocumentData = {
    category: input.category,
    title: input.title.trim(),
    by: input.by,
    done: false,
    createdAt: serverTimestamp(),
  };
  if (input.url) payload.url = input.url;
  if (preview) payload.preview = preview;
  if (input.location) payload.location = input.location.trim();
  if (input.memo) payload.memo = input.memo.trim();

  const ref = await addDoc(collection(db, 'wishlist'), payload);
  // 매일매일 꼼모닝 헤더 카운트
  import('./dailyStats').then(({ incrementWish }) => incrementWish(input.by)).catch(() => {});
  return ref.id;
}

export async function toggleWishDone(id: string, done: boolean, by: '우댕' | '꼼이'): Promise<void> {
  await updateDoc(doc(db, 'wishlist', id), {
    done,
    doneAt: done ? serverTimestamp() : null,
    doneBy: done ? by : null,
  });
}

export async function deleteWish(id: string): Promise<void> {
  await deleteDoc(doc(db, 'wishlist', id));
}

export async function addWishPhoto(id: string, file: File, by: '우댕' | '꼼이'): Promise<string> {
  const ext = file.type.includes('png') ? 'png'
    : file.type.includes('webp') ? 'webp'
      : 'jpg';
  const safeName = by.replace(/[^\w가-힣]/g, '_') || 'anon';
  const path = `wishlist/${id}/${Date.now()}_${safeName}.${ext}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type || 'image/jpeg' });
  const url = await getDownloadURL(ref);
  await updateDoc(doc(db, 'wishlist', id), {
    photoUrls: arrayUnion(url),
    updatedAt: serverTimestamp(),
  });
  return url;
}

// 클라이언트에서 OG 미리보기 직접 호출용 (WishlistV1의 fetchPreview prop)
export async function fetchOgPreview(url: string): Promise<WishPreview | null> {
  try {
    const r = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
    const data = await r.json();
    if (!data || data.error) return null;
    const out: WishPreview = {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.image && { image: data.image }),
      ...(data.siteName && { siteName: data.siteName }),
    };
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
