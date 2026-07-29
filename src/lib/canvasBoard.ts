// 우리 낙서장 — 커플 공유 실시간 필기 보드.
// 획(stroke)은 정규화 좌표(0~1)로 저장 → 아이패드/폰 화면 달라도 위치 동일.
// 1단계: 완성된 획을 Firestore로 공유(onSnapshot). 2단계에서 그리는 중 획은 RTDB로 생중계 예정.

import { db, storage, rtdb } from './firebase';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy,
  writeBatch, getDocs, getDoc, setDoc, updateDoc, deleteField, serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set as dbSet, onValue, onDisconnect } from 'firebase/database';

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

// ── 여러 장 노트북 (공유 스케치북) ──
// 책 문서: canvasBooks/{bookId} { currentPage }  — 둘이 같은 페이지를 봄(공유 포인터)
// 페이지: canvasBooks/{bookId}/pages/{pageId} { t }  — t로 정렬(생성순)
// 각 페이지의 획/지문/라이브는 기존 모델 그대로 재사용 (pageId 가 곧 boardId)
export const DEFAULT_BOOK = 'main';

export interface CanvasPage { id: string; t: number }

function bookDoc(bookId: string) { return doc(db, 'canvasBooks', bookId); }
function pagesCol(bookId: string) { return collection(db, 'canvasBooks', bookId, 'pages'); }

// 첫 진입 시 책이 없으면 초기화 — 기존 'main' 보드를 1페이지로 승계(옛 낙서 보존)
export async function ensureBook(bookId: string): Promise<void> {
  const snap = await getDoc(bookDoc(bookId));
  if (snap.exists() && (snap.data() as DocumentData).currentPage) return;
  await setDoc(doc(db, 'canvasBooks', bookId, 'pages', 'main'), { t: 0 }, { merge: true });
  await setDoc(bookDoc(bookId), { currentPage: 'main' }, { merge: true });
}

// 현재 페이지(공유 포인터) 구독
export function subscribeCurrentPage(bookId: string, cb: (pageId: string | null) => void): () => void {
  return onSnapshot(
    bookDoc(bookId),
    (snap) => cb(((snap.data() as DocumentData)?.currentPage as string) ?? null),
    () => cb(null),
  );
}

// 페이지 목록(생성순) 구독
export function subscribePages(bookId: string, cb: (pages: CanvasPage[]) => void): () => void {
  return onSnapshot(
    query(pagesCol(bookId), orderBy('t')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, t: (d.data() as DocumentData).t ?? 0 }))),
    () => cb([]),
  );
}

// 새 빈 페이지 만들고 현재 페이지를 그리로 이동(둘 다 넘어감)
export async function createPage(bookId: string): Promise<string> {
  const ref = await addDoc(pagesCol(bookId), { t: Date.now() });
  await setDoc(bookDoc(bookId), { currentPage: ref.id }, { merge: true });
  return ref.id;
}

// 현재 페이지 이동(넘겨보기 — 공유라 상대도 같이 넘어감)
export async function setCurrentPage(bookId: string, pageId: string): Promise<void> {
  await setDoc(bookDoc(bookId), { currentPage: pageId }, { merge: true });
}

// ── 2단계: 그리는 중 획 실시간 생중계 (RTDB — 초고빈도, 완성되면 Firestore로 확정) ──
export interface LiveStroke { id: string; color: string; size: number; points: StrokePoint[] }

export function liveKey(name: '우댕' | '꼼이'): 'udaeng' | 'kkomi' {
  return name === '우댕' ? 'udaeng' : 'kkomi';
}

function liveRef(boardId: string, userKey: string) {
  return dbRef(rtdb, `canvas/${boardId}/live/${userKey}`);
}

// 내 그리는 중 획을 갱신(또는 null로 지움). InkCanvas가 50ms로 쓰로틀하므로 그대로 흘려보냄.
export function publishLive(boardId: string, userKey: string, stroke: LiveStroke | null): void {
  dbSet(liveRef(boardId, userKey), stroke ?? null).catch(() => {});
}

// 내 라이브 노드에 onDisconnect 자동삭제 걸기 (그리다 끊겨도 유령 획 안 남게)
export function armLiveDisconnect(boardId: string, userKey: string): void {
  onDisconnect(liveRef(boardId, userKey)).remove().catch(() => {});
}

// 상대의 그리는 중 획 구독
export function subscribeLive(
  boardId: string, userKey: string, cb: (stroke: LiveStroke | null) => void,
): () => void {
  return onValue(liveRef(boardId, userKey), (snap) => cb(snap.val() as LiveStroke | null));
}
