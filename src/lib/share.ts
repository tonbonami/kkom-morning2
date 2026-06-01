import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  type DocumentData,
} from 'firebase/firestore';
import { fetchOgPreview, type WishPreview } from './wishlist';

// Firestore 스키마
export interface ShareDoc {
  url: string;
  preview?: WishPreview;
  memo?: string;
  by: '우댕' | '꼼이';
  seenBy: ('우댕' | '꼼이')[];
  createdAt?: Timestamp | null;
}

// UI(ShareListV1)가 받는 형태
export interface ShareItemView {
  id: string;
  url: string;
  preview?: WishPreview;
  memo?: string;
  by: '우댕' | '꼼이';
  seenBy: ('우댕' | '꼼이')[];
  createdAt: Date;
}

function toView(id: string, d: ShareDoc): ShareItemView {
  return {
    id,
    url: d.url,
    preview: d.preview,
    memo: d.memo,
    by: d.by,
    seenBy: Array.isArray(d.seenBy) ? d.seenBy : [],
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  };
}

// 실시간 구독 (최신 생성 순)
export function subscribeShareList(cb: (items: ShareItemView[]) => void): () => void {
  return onSnapshot(
    collection(db, 'shareList'),
    (snap) => {
      const items = snap.docs.map((d) => toView(d.id, d.data() as ShareDoc));
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      cb(items);
    },
    (err) => {
      console.error('shareList 구독 오류:', err);
      cb([]);
    }
  );
}

// 추가 — URL OG 미리보기 같이 저장. 본인은 자동으로 seenBy에 포함.
export async function addShare(input: {
  url: string;
  memo?: string;
  by: '우댕' | '꼼이';
}): Promise<string> {
  let preview: WishPreview | undefined;
  try {
    const og = await fetchOgPreview(input.url);
    if (og) preview = og;
  } catch {}

  const payload: DocumentData = {
    url: input.url,
    by: input.by,
    seenBy: [input.by],
    createdAt: serverTimestamp(),
  };
  if (preview) payload.preview = preview;
  if (input.memo) payload.memo = input.memo.trim();

  const ref = await addDoc(collection(db, 'shareList'), payload);
  return ref.id;
}

// 상대가 봤을 때 seenBy에 추가 (중복 OK — arrayUnion이 처리)
export async function markShareSeen(id: string, by: '우댕' | '꼼이'): Promise<void> {
  try {
    await updateDoc(doc(db, 'shareList', id), { seenBy: arrayUnion(by) });
  } catch (e) {
    console.warn('markShareSeen 실패:', e);
  }
}

export async function deleteShare(id: string): Promise<void> {
  await deleteDoc(doc(db, 'shareList', id));
}
