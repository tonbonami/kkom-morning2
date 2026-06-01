import { db } from './firebase';
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, Timestamp,
  type DocumentData,
} from 'firebase/firestore';

export type Memory = {
  id: string;
  imageUrl: string;   // public 경로(/memories/...) 또는 data:image/jpeg;base64,... (업로드한 사진)
  title: string;
  date: string;       // YYYY-MM-DD
  description: string;
  by?: string;        // 올린 사람 (꼼이 / 우댕)
  createdAt?: Timestamp | null;
};

// 시드: public/memories 의 사진 (Firestore가 비어있을 때만 보임)
export const SEED_MEMORIES: Memory[] = [
  {
    id: 'seed-2023-09-28',
    imageUrl: '/memories/230928.JPG',
    title: '우리 시작한 날',
    date: '2023-09-28',
    description: '꼼이와 우댕의 첫 날 💚',
  },
  {
    id: 'seed-2024-05-25',
    imageUrl: '/memories/240525.jpeg',
    title: '함께한 그날',
    date: '2024-05-25',
    description: '',
  },
];

// 실시간 구독 — 업로드 시각(createdAt) 내림차순. 새로 올린 사진이 항상 맨 위.
// createdAt 없으면 date 필드를 폴백으로 사용.
export function subscribeMemories(cb: (memories: Memory[]) => void): () => void {
  return onSnapshot(
    collection(db, 'memories'),
    (snap) => {
      const docs = snap.docs.map((d) => ({ ...(d.data() as Omit<Memory, 'id'>), id: d.id }));
      docs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? new Date(a.date || 0).getTime();
        const bTime = b.createdAt?.toMillis?.() ?? new Date(b.date || 0).getTime();
        return bTime - aTime;
      });
      cb(docs.length > 0 ? docs : SEED_MEMORIES);
    },
    (err) => {
      console.error('memories 구독 오류:', err);
      cb(SEED_MEMORIES);
    }
  );
}

// 새 추억 추가 (imageUrl = data: URL 또는 외부 URL).
// 호출 측에서 id/createdAt를 같이 보내도 안전하게 무시하고 Firestore에 깨끗하게 저장.
export async function addMemory(m: Omit<Memory, 'id' | 'createdAt'> & { id?: string; createdAt?: unknown }): Promise<string> {
  const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...clean } = m;
  const ref = await addDoc(collection(db, 'memories'), {
    ...clean,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 추억 삭제 (id가 'seed-'로 시작하면 시드라 삭제 불가)
export async function deleteMemory(id: string): Promise<void> {
  if (id.startsWith('seed-')) {
    throw new Error('시드 사진은 삭제할 수 없어요 (코드에 들어있음).');
  }
  await deleteDoc(doc(db, 'memories', id));
}

// 추억 부분 수정 (title/date/description/by). id·createdAt·imageUrl은 보호.
export async function updateMemory(
  id: string,
  patch: Partial<Pick<Memory, 'title' | 'date' | 'description' | 'by'>>
): Promise<void> {
  if (id.startsWith('seed-')) {
    throw new Error('시드 사진은 수정할 수 없어요.');
  }
  const clean: DocumentData = {};
  if (patch.title !== undefined) clean.title = patch.title;
  if (patch.date !== undefined) clean.date = patch.date;
  if (patch.description !== undefined) clean.description = patch.description;
  if (patch.by !== undefined) clean.by = patch.by;
  if (Object.keys(clean).length === 0) return;
  await updateDoc(doc(db, 'memories', id), clean);
}

/**
 * 브라우저에서 사진 파일을 압축해 data URL(base64)로 변환.
 * Firestore 1MB 도큐먼트 제한 안에 들어오게 (~200-400KB 목표).
 *
 * @param file 사진 파일 (이미지)
 * @param maxDim 긴 변 최대 픽셀 (기본 1280)
 * @param quality JPEG 품질 (기본 0.78)
 * @returns data:image/jpeg;base64,... 문자열
 */
export async function compressImage(file: File, maxDim = 1280, quality = 0.78): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 가능해요.');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('이미지를 읽지 못했어요.'));
      i.src = url;
    });

    let { width, height } = img;
    if (width > height && width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 컨텍스트 실패');
    ctx.drawImage(img, 0, 0, width, height);

    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    // 도큐먼트 한계 안전: 800KB 넘으면 다시 더 압축
    if (dataUrl.length > 800 * 1024) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    }
    if (dataUrl.length > 900 * 1024) {
      // 그래도 크면 한 번 더 줄여 다시 시도
      const c2 = document.createElement('canvas');
      const r = 1000 / Math.max(width, height);
      c2.width = Math.round(width * r);
      c2.height = Math.round(height * r);
      c2.getContext('2d')!.drawImage(img, 0, 0, c2.width, c2.height);
      dataUrl = c2.toDataURL('image/jpeg', 0.7);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}
