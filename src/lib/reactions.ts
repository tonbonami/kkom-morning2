// 어느 컬렉션의 어느 문서든 하트 +1과 댓글 서브컬렉션을 붙일 수 있는 일반 헬퍼.
// 사용: incrementHeartsAt('shareList', id), subscribeCommentsAt('shareList', id, cb) 등.

import { db } from './firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';

export interface ReactionComment {
  id: string;
  by: '우댕' | '꼼이';
  text: string;
  createdAt: Date;
}

export async function incrementHeartsAt(collectionName: string, docId: string): Promise<void> {
  if (!docId) return;
  try {
    await updateDoc(doc(db, collectionName, docId), { hearts: increment(1) });
  } catch (e) {
    console.warn(`하트 증가 실패 (${collectionName}/${docId}):`, e);
  }
}

export function subscribeCommentsAt(
  collectionName: string,
  docId: string,
  cb: (comments: ReactionComment[]) => void
): () => void {
  if (!docId) {
    cb([]);
    return () => {};
  }
  const q = query(
    collection(db, collectionName, docId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as { by: '우댕' | '꼼이'; text: string; createdAt?: Timestamp | null };
        return {
          id: d.id,
          by: data.by,
          text: data.text,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      });
      cb(items);
    },
    (err) => {
      console.error(`comments 구독 오류 (${collectionName}/${docId}):`, err);
      cb([]);
    }
  );
}

export async function addCommentAt(
  collectionName: string,
  docId: string,
  by: '우댕' | '꼼이',
  text: string
): Promise<void> {
  const t = text.trim();
  if (!t || !docId) return;
  await addDoc(collection(db, collectionName, docId, 'comments'), {
    by,
    text: t,
    createdAt: serverTimestamp(),
  });
  try {
    await updateDoc(doc(db, collectionName, docId), { commentCount: increment(1) });
  } catch {}
}

export async function deleteCommentAt(
  collectionName: string,
  docId: string,
  commentId: string
): Promise<void> {
  await deleteDoc(doc(db, collectionName, docId, 'comments', commentId));
  try {
    await updateDoc(doc(db, collectionName, docId), { commentCount: increment(-1) });
  } catch {}
}
