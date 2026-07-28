// 우리 낙서장 — 커플 공유 실시간 필기 보드.
// 획(stroke)은 정규화 좌표(0~1)로 저장 → 아이패드/폰 화면 달라도 위치 동일.
// 1단계: 완성된 획을 Firestore로 공유(onSnapshot). 2단계에서 그리는 중 획은 RTDB로 생중계 예정.

import { db, storage } from './firebase';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy,
  writeBatch, getDocs, setDoc, updateDoc, deleteField, serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export const DEFAULT_BOARD = 'main'; // 우댕♥꼼이 단일 보드 (MVP)

export interface StrokePoint { x: number; y: number; p: number }
export interface BoardStroke {
  id: string;                 // Firestore 문서 id (지우개 히트 판정·삭제에 사용)
  color: string;
  size: number;
  points: StrokePoint[];
  by: '우댕' | '꼼이';
}

export interface BoardMeta {
  passageUrl?: string;        // 배경 지문 이미지 (선택)
}

function strokesCol(boardId: string) {
  return collection(db, 'canvasBoards', boardId, 'strokes');
}

// ── 완성된 획 구독 (양쪽이 서로의 획을 봄) ──
export function subscribeStrokes(boardId: string, cb: (strokes: BoardStroke[]) => void): () => void {
  return onSnapshot(
    query(strokesCol(boardId), orderBy('t')),
    (snap) => {
      const strokes = snap.docs.map((d) => {
        const x = d.data() as DocumentData;
        return {
          id: d.id,
          color: x.color || '#334155',
          size: x.size || 6,
          points: Array.isArray(x.points) ? x.points : [],
          by: x.by,
        } as BoardStroke;
      });
      cb(strokes);
    },
    (err) => { console.error('낙서장 구독 오류:', err); cb([]); }
  );
}

export async function addStroke(
  boardId: string,
  stroke: { color: string; size: number; points: StrokePoint[] },
  by: '우댕' | '꼼이',
): Promise<void> {
  if (!stroke.points || stroke.points.length < 2) return;
  await addDoc(strokesCol(boardId), {
    color: stroke.color,
    size: stroke.size,
    points: stroke.points,
    by,
    t: Date.now(),               // 정렬용 (serverTimestamp는 pending 시 null이라 클라 ms 병행)
    createdAt: serverTimestamp(),
  });
}

export async function eraseStrokes(boardId: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  // 최대 500개씩 배치 삭제
  for (let i = 0; i < ids.length; i += 450) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + 450)) batch.delete(doc(db, 'canvasBoards', boardId, 'strokes', id));
    await batch.commit();
  }
}

export async function clearBoard(boardId: string): Promise<void> {
  const snap = await getDocs(strokesCol(boardId));
  const ids = snap.docs.map((d) => d.id);
  await eraseStrokes(boardId, ids);
}

// ── 보드 메타 (배경 지문) ──
export function subscribeBoardMeta(boardId: string, cb: (meta: BoardMeta) => void): () => void {
  return onSnapshot(
    doc(db, 'canvasBoards', boardId),
    (snap) => cb((snap.data() as BoardMeta) || {}),
    (err) => { console.error('보드 메타 구독 오류:', err); cb({}); }
  );
}

export async function uploadPassageImage(file: File, by: string): Promise<string> {
  const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg';
  const safeBy = by.replace(/[^\w가-힣]/g, '_') || 'anon';
  const path = `canvas/passage_${Date.now()}_${safeBy}.${ext}`;
  const sref = storageRef(storage, path);
  await uploadBytes(sref, file, { contentType: file.type || 'image/jpeg' });
  return getDownloadURL(sref);
}

export async function setPassage(boardId: string, passageUrl: string): Promise<void> {
  await setDoc(doc(db, 'canvasBoards', boardId), { passageUrl }, { merge: true });
}

export async function clearPassage(boardId: string): Promise<void> {
  await updateDoc(doc(db, 'canvasBoards', boardId), { passageUrl: deleteField() });
}
