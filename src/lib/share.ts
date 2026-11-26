import { db } from './firebase';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  type DocumentData,
} from 'firebase/firestore';
import { fetchLinkPreview, LINK_PREVIEW_VERSION, type LinkPreview } from './linkPreview';
import { isDemo, settleDemoWrite } from './demo';

// Firestore 스키마
export interface ShareDoc {
  url: string;
  preview?: LinkPreview;
  memo?: string;
  by: '우댕' | '꼼이';
  seenBy: ('우댕' | '꼼이')[];
  createdAt?: Timestamp | null;
  hearts?: number;
  commentCount?: number;
}

// UI(ShareListV1)가 받는 형태
export interface ShareItemView {
  id: string;
  url: string;
  preview?: LinkPreview;
  memo?: string;
  by: '우댕' | '꼼이';
  seenBy: ('우댕' | '꼼이')[];
  createdAt: Date;
  hearts?: number;
  commentCount?: number;
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
    hearts: d.hearts,
    commentCount: d.commentCount,
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

// 추가 — 미리보기 같이 저장(종류·장소 정보까지, version 2). 본인은 자동으로 seenBy에 포함.
//   추가 시트가 이미 받은 미리보기를 넘기면 그걸 쓴다(같은 주소를 두 번 받지 않게 — GPT 회의 11/18).
export async function addShare(input: {
  url: string;
  memo?: string;
  by: '우댕' | '꼼이';
  preview?: LinkPreview | null;
}): Promise<string> {
  let preview: LinkPreview | undefined = input.preview ?? undefined;
  if (!preview) {
    try { preview = (await fetchLinkPreview(input.url)) ?? undefined; } catch {}
  }
  if (preview) preview = JSON.parse(JSON.stringify({ ...preview, version: LINK_PREVIEW_VERSION })) as LinkPreview;   // undefined 칸 걷기(Firestore)

  const payload: DocumentData = {
    url: input.url,
    by: input.by,
    seenBy: [input.by],
    createdAt: serverTimestamp(),
  };
  if (preview) payload.preview = preview;
  if (input.memo) payload.memo = input.memo.trim();

  const ref = doc(collection(db, 'shareList'));
  await settleDemoWrite(setDoc(ref, { ...payload, ...(isDemo() ? { createdAt: Timestamp.now() } : {}) }));
  return ref.id;
}

// 상대가 봤을 때 seenBy에 추가 (중복 OK — arrayUnion이 처리)
export async function markShareSeen(id: string, by: '우댕' | '꼼이'): Promise<void> {
  try {
    await settleDemoWrite(updateDoc(doc(db, 'shareList', id), { seenBy: arrayUnion(by) }));
  } catch (e) {
    console.warn('markShareSeen 실패:', e);
  }
}

export async function deleteShare(id: string): Promise<void> {
  await settleDemoWrite(deleteDoc(doc(db, 'shareList', id)));
}
