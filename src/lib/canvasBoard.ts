// 우리 낙서장 — 커플 공유 실시간 필기 보드.
// 획(stroke)은 정규화 좌표(0~1)로 저장 → 아이패드/폰/웹 화면 달라도 위치 동일.
// ★ 웹·네이티브 통일: 확정 획·페이지·지문·라이브 전부 RTDB 한 창고에서 주고받음.
//   구조:
//     canvas/book/currentPage          = 현재 페이지 id (둘이 공유)
//     canvas/book/pages/{pageId}       = { t }  (페이지 목록·정렬)
//     canvas/{pageId}/strokes/{user}/{id} = { color, size, points:[{x,y,p}], by, t }  (확정 획)
//     canvas/{pageId}/meta             = { passageUrl }  (배경 지문)
//     canvas/{pageId}/live/{user}      = 그리는 중 획 (생중계)
//   ({user} = 'udaeng' | 'kkomi'. 내 subtree에 쓰고, 전체를 구독해 둘 다 렌더.)

import { storage, rtdb } from './firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  ref as dbRef, set as dbSet, push as dbPush, remove as dbRemove,
  update as dbUpdate, get as dbGet, onValue, onDisconnect,
} from 'firebase/database';

export const DEFAULT_BOARD = 'main'; // 첫 페이지 id (기존 낙서 승계)
export const DEFAULT_BOOK = 'main';  // 책은 전역 canvas/book 하나 (인자는 시그니처 호환용)

export interface StrokePoint { x: number; y: number; p: number }
export interface BoardStroke {
  id: string;                 // "{user}/{pushId}" 복합 id (지우개 히트·삭제 경로에 사용)
  color: string;
  size: number;
  points: StrokePoint[];
  by: '우댕' | '꼼이';
}

export interface BoardMeta {
  passageUrl?: string;        // 배경 지문 이미지 (선택)
}

export interface CanvasPage { id: string; t: number }

export function liveKey(name: '우댕' | '꼼이'): 'udaeng' | 'kkomi' {
  return name === '우댕' ? 'udaeng' : 'kkomi';
}

// ── 확정 획 ──
function strokesRef(boardId: string) { return dbRef(rtdb, `canvas/${boardId}/strokes`); }

// 완성된 획 구독 (양쪽 것 모두 — user별 subtree를 평탄화). t로 정렬.
export function subscribeStrokes(boardId: string, cb: (strokes: BoardStroke[]) => void): () => void {
  return onValue(
    strokesRef(boardId),
    (snap) => {
      const val = snap.val() as Record<string, Record<string, Record<string, unknown>>> | null;
      const out: (BoardStroke & { t: number })[] = [];
      if (val) {
        for (const [user, byId] of Object.entries(val)) {
          if (!byId) continue;
          for (const [sid, s] of Object.entries(byId)) {
            const st = s as { color?: string; size?: number; points?: StrokePoint[]; by?: '우댕' | '꼼이'; t?: number };
            if (!st || !Array.isArray(st.points) || st.points.length < 2) continue;
            out.push({
              id: `${user}/${sid}`,
              color: st.color || '#334155',
              size: st.size || 6,
              points: st.points,
              by: st.by || (user === 'udaeng' ? '우댕' : '꼼이'),
              t: st.t ?? 0,
            });
          }
        }
      }
      out.sort((a, b) => a.t - b.t);
      cb(out.map(({ t: _t, ...s }) => s));
    },
    (err) => { console.error('낙서장 구독 오류:', err); cb([]); },
  );
}

export async function addStroke(
  boardId: string,
  stroke: { color: string; size: number; points: StrokePoint[] },
  by: '우댕' | '꼼이',
): Promise<void> {
  if (!stroke.points || stroke.points.length < 2) return;
  const user = liveKey(by);
  const r = dbPush(dbRef(rtdb, `canvas/${boardId}/strokes/${user}`));
  await dbSet(r, { color: stroke.color, size: stroke.size, points: stroke.points, by, t: Date.now() });
}

// ids = "{user}/{pushId}" 복합 id. 멀티패스 업데이트로 한 번에 삭제.
export async function eraseStrokes(boardId: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const updates: Record<string, null> = {};
  for (const id of ids) updates[`canvas/${boardId}/strokes/${id}`] = null;
  await dbUpdate(dbRef(rtdb), updates);
}

export async function clearBoard(boardId: string): Promise<void> {
  await dbRemove(strokesRef(boardId));
}

// ── 보드 메타 (배경 지문) ──
function metaRef(boardId: string) { return dbRef(rtdb, `canvas/${boardId}/meta`); }

export function subscribeBoardMeta(boardId: string, cb: (meta: BoardMeta) => void): () => void {
  return onValue(
    metaRef(boardId),
    (snap) => cb((snap.val() as BoardMeta) || {}),
    (err) => { console.error('보드 메타 구독 오류:', err); cb({}); },
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
  await dbUpdate(metaRef(boardId), { passageUrl });
}

export async function clearPassage(boardId: string): Promise<void> {
  await dbRemove(dbRef(rtdb, `canvas/${boardId}/meta/passageUrl`));
}

// ── 여러 장 노트북 (전역 공유 책: canvas/book) ──
// 첫 진입 시 currentPage 없으면 초기화 — 'main'을 1페이지로.
export async function ensureBook(_bookId: string): Promise<void> {
  const snap = await dbGet(dbRef(rtdb, 'canvas/book/currentPage'));
  if (snap.exists() && snap.val()) return;
  await dbUpdate(dbRef(rtdb, 'canvas/book'), { currentPage: 'main', 'pages/main': { t: 0 } });
}

export function subscribeCurrentPage(_bookId: string, cb: (pageId: string | null) => void): () => void {
  return onValue(
    dbRef(rtdb, 'canvas/book/currentPage'),
    (snap) => cb((snap.val() as string) || null),
    () => cb(null),
  );
}

export function subscribePages(_bookId: string, cb: (pages: CanvasPage[]) => void): () => void {
  return onValue(
    dbRef(rtdb, 'canvas/book/pages'),
    (snap) => {
      const val = snap.val() as Record<string, { t?: number }> | null;
      const pages = val
        ? Object.entries(val).map(([id, v]) => ({ id, t: v?.t ?? 0 })).sort((a, b) => a.t - b.t)
        : [];
      cb(pages);
    },
    () => cb([]),
  );
}

// 새 빈 페이지 만들고 현재 페이지를 그리로 이동(둘 다 넘어감)
export async function createPage(_bookId: string): Promise<string> {
  const id = `p_${Date.now()}`;
  await dbUpdate(dbRef(rtdb, 'canvas/book'), { [`pages/${id}`]: { t: Date.now() }, currentPage: id });
  return id;
}

// 현재 페이지 이동(넘겨보기 — 공유라 상대도 같이 넘어감)
export async function setCurrentPage(_bookId: string, pageId: string): Promise<void> {
  await dbSet(dbRef(rtdb, 'canvas/book/currentPage'), pageId);
}

// 페이지 삭제 — 페이지 항목 + 그 페이지 데이터(획·지문·라이브) 제거, currentPage를 newCurrent로 이동.
export async function deletePage(_bookId: string, pageId: string, newCurrent: string): Promise<void> {
  await dbUpdate(dbRef(rtdb), {
    [`canvas/book/pages/${pageId}`]: null,
    'canvas/book/currentPage': newCurrent,
    [`canvas/${pageId}`]: null,   // 획·지문·라이브·리액션 통째로
  });
}

// ── 페이지 하트 + 댓글 (canvas/{page}/react) ──
export interface CanvasComment { id: string; by: '우댕' | '꼼이'; text: string; t: number }
export interface Reactions { likedBy: ('우댕' | '꼼이')[]; comments: CanvasComment[] }

export function subscribeReactions(boardId: string, cb: (r: Reactions) => void): () => void {
  return onValue(
    dbRef(rtdb, `canvas/${boardId}/react`),
    (snap) => {
      const v = (snap.val() as { likes?: Record<string, boolean>; comments?: Record<string, { by: '우댕' | '꼼이'; text: string; t?: number }> }) || {};
      const likedBy: ('우댕' | '꼼이')[] = [];
      if (v.likes?.udaeng) likedBy.push('우댕');
      if (v.likes?.kkomi) likedBy.push('꼼이');
      const comments = Object.entries(v.comments || {})
        .map(([id, c]) => ({ id, by: c.by, text: c.text, t: c.t ?? 0 }))
        .sort((a, b) => a.t - b.t);
      cb({ likedBy, comments });
    },
    () => cb({ likedBy: [], comments: [] }),
  );
}
export async function toggleLike(boardId: string, by: '우댕' | '꼼이', on: boolean): Promise<void> {
  await dbSet(dbRef(rtdb, `canvas/${boardId}/react/likes/${liveKey(by)}`), on ? true : null);
}
export async function addComment(boardId: string, by: '우댕' | '꼼이', text: string): Promise<void> {
  const t = text.trim();
  if (!t) return;
  const r = dbPush(dbRef(rtdb, `canvas/${boardId}/react/comments`));
  await dbSet(r, { by, text: t.slice(0, 500), t: Date.now() });
}
export async function deleteComment(boardId: string, id: string): Promise<void> {
  await dbRemove(dbRef(rtdb, `canvas/${boardId}/react/comments/${id}`));
}

// ── 그리는 중 획 실시간 생중계 (RTDB) ──
export interface LiveStroke { id: string; color: string; size: number; points: StrokePoint[] }

function liveRef(boardId: string, userKey: string) {
  return dbRef(rtdb, `canvas/${boardId}/live/${userKey}`);
}

export function publishLive(boardId: string, userKey: string, stroke: LiveStroke | null): void {
  dbSet(liveRef(boardId, userKey), stroke ?? null).catch(() => {});
}

export function armLiveDisconnect(boardId: string, userKey: string): void {
  onDisconnect(liveRef(boardId, userKey)).remove().catch(() => {});
}

export function subscribeLive(
  boardId: string, userKey: string, cb: (stroke: LiveStroke | null) => void,
): () => void {
  return onValue(liveRef(boardId, userKey), (snap) => cb(snap.val() as LiveStroke | null));
}
