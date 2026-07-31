'use client';

// 우리 낙서장 — 커플 공유 실시간 필기 보드 (아이패드+애플펜슬 최적, 폰도 OK).
// 배경에 영어 지문 이미지를 깔 수 있고(투명도 조절), 그 위에 둘이 자유롭게 필기.
// 1단계: 완성된 획을 Firestore로 공유. 그리는 중 획 생중계(RTDB)는 2단계.

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pen, Eraser, Undo2, Trash2, ImagePlus, ImageOff, Loader2, ChevronLeft, ChevronRight, FilePlus } from 'lucide-react';
import InkCanvas from '@/components/ink/InkCanvas';
import StaticInkCanvas from '@/components/ink/StaticInkCanvas';
import {
  subscribeStrokes, subscribeBoardMeta, addStroke, eraseStrokes, clearBoard,
  uploadPassageImage, setPassage, clearPassage,
  publishLive, subscribeLive, armLiveDisconnect, liveKey,
  ensureBook, subscribeCurrentPage, subscribePages, createPage, setCurrentPage, deletePage,
  subscribeReactions, toggleLike, addComment, deleteComment,
  DEFAULT_BOOK, type BoardStroke, type LiveStroke, type CanvasPage, type Reactions,
} from '@/lib/canvasBoard';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { nameFromCode, partnerOf } from '@/lib/letters';
import { feedback } from '@/lib/feedback';

// 색 팔레트 — 꼼이(로즈)·우댕(블루) 기본 + 먹색·형광
const COLORS = [
  { key: 'kkomi', label: '꼼이', hex: '#f43f5e' },
  { key: 'udaeng', label: '우댕', hex: '#3b82f6' },
  { key: 'ink', label: '먹', hex: '#334155' },
  { key: 'hl', label: '형광', hex: '#fACC15' },
];
const SIZES = [
  { key: 's', label: '얇게', size: 4 },
  { key: 'm', label: '보통', size: 7 },
  { key: 'l', label: '굵게', size: 13 },
];
const BOARD_RATIO = 3 / 4; // 세로 교재 비율 (w:h = 3:4)
const EMPTY_STROKES: never[] = []; // StaticInkCanvas는 라이브 획만 그림 (베이크는 InkCanvas 담당)

export default function CanvasPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [strokes, setStrokes] = useState<BoardStroke[]>([]);
  const [passageUrl, setPassageUrl] = useState<string | undefined>();
  // 공유 노트북 — 현재 페이지(=boardId)는 둘이 공유, 페이지 목록은 넘겨보기용
  const [pageId, setPageId] = useState<string | null>(null);
  const [pages, setPages] = useState<CanvasPage[]>([]);
  const pageIdRef = useRef<string | null>(null); // 핸들러가 최신 페이지에 쓰도록
  const [reactions, setReactions] = useState<Reactions>({ likedBy: [], comments: [] });
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#334155');
  const [size, setSize] = useState(7);
  const [opacity, setOpacity] = useState(0.5); // 지문 투명도 (개인 뷰 설정)
  const [uploading, setUploading] = useState(false);
  // 필기감 설정 (ClassNote 이식) — 왼손잡이면 팜가드 반대라 오른손 기본이 끊김↑
  const [handedness, setHandedness] = useState<'right' | 'left'>('right');
  const [palm, setPalm] = useState<'off' | 'normal' | 'strong'>('normal');

  // 보드 실측 크기 (3:4 유지, 화면에 맞춤)
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [board, setBoard] = useState({ w: 0, h: 0 });

  // 상대가 그리는 중인 획 (RTDB 생중계)
  const [partnerLive, setPartnerLive] = useState<LiveStroke | null>(null);
  const myLiveRef = useRef<LiveStroke | null>(null);
  const graceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    const name = nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이';
    setMe(name);
    setColor(name === '꼼이' ? '#f43f5e' : '#3b82f6'); // 내 색을 기본으로
    const savedOp = localStorage.getItem('kkom-canvas-opacity');
    if (savedOp) setOpacity(Number(savedOp));
    const h = localStorage.getItem('kkom-canvas-hand'); if (h === 'left' || h === 'right') setHandedness(h);
    const pm = localStorage.getItem('kkom-canvas-palm'); if (pm === 'off' || pm === 'normal' || pm === 'strong') setPalm(pm);

    // 공유 노트북 — 책 초기화 후 현재 페이지(공유 포인터) + 페이지 목록 구독
    ensureBook(DEFAULT_BOOK).catch(console.error);
    const unsubP = subscribeCurrentPage(DEFAULT_BOOK, setPageId);
    const unsubList = subscribePages(DEFAULT_BOOK, setPages);
    return () => { unsubP(); unsubList(); };
  }, [router]);

  // 현재 페이지가 바뀔 때마다 그 페이지의 획/지문/생중계 재구독 (새 페이지·넘겨보기 공유)
  useEffect(() => {
    if (!pageId || !me) return;
    pageIdRef.current = pageId;
    // 페이지 전환 순간 이전 페이지 잔상 제거
    setStrokes([]); setPassageUrl(undefined); setPartnerLive(null);
    if (graceRef.current) clearTimeout(graceRef.current);

    const unsubS = subscribeStrokes(pageId, setStrokes);
    const unsubM = subscribeBoardMeta(pageId, (m) => setPassageUrl(m.passageUrl));
    const unsubR = subscribeReactions(pageId, setReactions);
    const myKey = liveKey(me);
    const partnerKey = liveKey(partnerOf(me) as '우댕' | '꼼이');
    armLiveDisconnect(pageId, myKey);
    const unsubL = subscribeLive(pageId, partnerKey, (stroke) => {
      if (graceRef.current) clearTimeout(graceRef.current);
      if (stroke && stroke.points?.length) {
        setPartnerLive(stroke);
      } else {
        // 상대가 획을 끝냄 → Firestore 확정 획 도착까지 잠깐 유지(깜빡임 방지)
        graceRef.current = setTimeout(() => setPartnerLive(null), 450);
      }
    });
    return () => { unsubS(); unsubM(); unsubR(); unsubL(); if (graceRef.current) clearTimeout(graceRef.current); };
  }, [pageId, me]);

  // ⚠️ 필기감 핵심 — 이 화면에서만 핀치줌/더블탭줌 잠금 (사파리가 필기를 줌으로 오해해 획 끊는 것 차단).
  //    ClassNote가 index.html에 넣은 viewport 잠금을, 여기선 이 페이지 진입/이탈 때만 적용.
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const prev = meta?.getAttribute('content') ?? null;
    meta?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
    return () => { if (meta && prev) meta.setAttribute('content', prev); };
  }, []);

  // 컨테이너에 맞춰 3:4 보드 크기 산출
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      let w = Math.min(availW, availH * BOARD_RATIO);
      let h = w / BOARD_RATIO;
      setBoard({ w: Math.round(w), h: Math.round(h) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [me]);

  const setOpacityPersist = (v: number) => {
    setOpacity(v);
    try { localStorage.setItem('kkom-canvas-opacity', String(v)); } catch {}
  };

  const handleAddStroke = (s: { color: string; size: number; points: { x: number; y: number; p: number }[] }) => {
    const b = pageIdRef.current; if (!me || !b) return;
    addStroke(b, { color: s.color, size: s.size, points: s.points }, me).catch(console.error);
  };
  const handleErase = (ids: string[]) => {
    const b = pageIdRef.current; if (!b) return;
    eraseStrokes(b, ids).catch(console.error);
  };

  // 그리는 중 획 생중계 — InkCanvas가 준 델타 점을 누적해 RTDB에 전체 획을 쏨 (50ms 쓰로틀됨)
  const handleLiveStroke = (partial: LiveStroke | null) => {
    const b = pageIdRef.current; if (!me || !b) return;
    const myKey = liveKey(me);
    if (!partial) { myLiveRef.current = null; publishLive(b, myKey, null); return; }
    const cur = myLiveRef.current;
    if (!cur || cur.id !== partial.id) {
      myLiveRef.current = { id: partial.id, color: partial.color, size: partial.size, points: [...partial.points] };
    } else {
      cur.points.push(...partial.points);
    }
    publishLive(b, myKey, myLiveRef.current);
  };

  const undoMine = () => {
    // 내가 그린 마지막 획 지우기
    const b = pageIdRef.current; if (!b) return;
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].by === me) { eraseStrokes(b, [strokes[i].id]).catch(console.error); return; }
    }
    feedback('되돌릴 내 획이 없어', 'info');
  };
  const clearAll = () => {
    const b = pageIdRef.current; if (!b) return;
    if (!confirm('이 페이지를 전부 지울까? (둘 다에게서 사라져)')) return;
    clearBoard(b).then(() => feedback('🧹 이 페이지 비웠어')).catch(() => feedback('지우기 실패', 'error'));
  };

  // 페이지 넘기기 / 새 페이지 (공유 — 상대도 같이 이동)
  const pageIdx = pages.findIndex((p) => p.id === pageId);
  const goPrev = () => { if (pageIdx > 0) setCurrentPage(DEFAULT_BOOK, pages[pageIdx - 1].id).catch(console.error); };
  const goNext = () => { if (pageIdx >= 0 && pageIdx < pages.length - 1) setCurrentPage(DEFAULT_BOOK, pages[pageIdx + 1].id).catch(console.error); };
  const addPage = () => { createPage(DEFAULT_BOOK).then(() => feedback('📄 새 페이지 폈어')).catch(() => feedback('새 페이지 실패', 'error')); };
  const deletePageHandler = () => {
    const b = pageIdRef.current;
    if (!b || pages.length <= 1) return;
    if (!confirm('이 페이지와 낙서를 삭제할까? 되돌릴 수 없어.')) return;
    const remaining = pages.filter((p) => p.id !== b);
    const newIdx = Math.min(Math.max(0, pageIdx - 1), remaining.length - 1);
    deletePage(DEFAULT_BOOK, b, remaining[newIdx].id)
      .then(() => feedback('🗑 페이지 삭제했어'))
      .catch(() => feedback('삭제 실패', 'error'));
  };

  const pickPassage = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const f = input.files?.[0];
    input.value = '';
    const b = pageIdRef.current;
    if (!f || !f.type.startsWith('image/') || !me || !b) return;
    setUploading(true);
    try {
      const url = await uploadPassageImage(f, me);
      await setPassage(b, url);
      feedback('📄 지문 깔았어');
    } catch (err) {
      console.error(err);
      feedback('지문 올리기 실패', 'error');
    } finally {
      setUploading(false);
    }
  };
  const removePassage = () => {
    const b = pageIdRef.current; if (!b) return;
    if (!confirm('배경 지문을 뺄까?')) return;
    clearPassage(b).catch(console.error);
  };

  // Firestore 획 → InkCanvas가 이해하는 형태 (id 유지 → 지우개 히트/삭제 정확)
  const inkStrokes = useMemo(
    () => strokes.map((s) => ({ id: s.id, tool: 'pen', color: s.color, size: s.size, points: s.points })),
    [strokes],
  );

  if (!me) return <div className="min-h-screen bg-[#FFFCF5] max-w-md mx-auto" />;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FFFCF5] text-slate-800 overscroll-none">
      {/* 상단 바 */}
      <header
        className="shrink-0 flex items-center gap-2 px-3 border-b border-slate-200/70 bg-white/90 backdrop-blur"
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top))', paddingBottom: 8 }}
      >
        <button onClick={() => router.push('/')} className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 active:scale-95" aria-label="홈으로"><ArrowLeft size={17} /></button>
        {/* 페이지 넘기기 (공유 — 상대도 같이 이동) */}
        <div className="flex items-center shrink-0">
          <button onClick={goPrev} disabled={pageIdx <= 0} className="h-9 w-7 rounded-lg flex items-center justify-center text-slate-500 disabled:opacity-25 active:scale-95" aria-label="이전 페이지"><ChevronLeft size={18} /></button>
          <span className="text-[13px] font-black text-slate-600 tabular-nums min-w-[32px] text-center">{(pageIdx < 0 ? 0 : pageIdx) + 1}/{pages.length || 1}</span>
          <button onClick={goNext} disabled={pageIdx < 0 || pageIdx >= pages.length - 1} className="h-9 w-7 rounded-lg flex items-center justify-center text-slate-500 disabled:opacity-25 active:scale-95" aria-label="다음 페이지"><ChevronRight size={18} /></button>
        </div>
        {/* 새 페이지 */}
        <button onClick={addPage} className="h-9 shrink-0 px-2.5 rounded-xl bg-slate-800 text-white flex items-center gap-1 text-[12px] font-bold active:scale-95" aria-label="새 페이지"><FilePlus size={14} />새 페이지</button>
        {pages.length > 1 && (
          <button onClick={deletePageHandler} className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 active:text-rose-500 active:scale-95" aria-label="페이지 삭제"><Trash2 size={15} /></button>
        )}
        <div className="flex-1" />
        <button onClick={undoMine} className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 active:scale-95" aria-label="되돌리기"><Undo2 size={17} /></button>
        <button onClick={clearAll} className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 active:text-rose-500 active:scale-95" aria-label="전체 지우기"><Trash2 size={16} /></button>
      </header>

      {/* 도구 바 */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-slate-200/70 bg-white/70 overflow-x-auto no-scrollbar">
        {/* 색 */}
        {COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => { setColor(c.hex); setTool('pen'); }}
            className={`shrink-0 w-8 h-8 rounded-full border-2 transition ${tool === 'pen' && color === c.hex ? 'border-slate-700 scale-110' : 'border-white'} shadow-sm`}
            style={{ background: c.hex }}
            aria-label={c.label}
          />
        ))}
        <span className="shrink-0 w-px h-6 bg-slate-200 mx-1" />
        {/* 굵기 */}
        {SIZES.map((s) => (
          <button
            key={s.key}
            onClick={() => { setSize(s.size); setTool('pen'); }}
            className={`shrink-0 h-8 px-1 flex items-center justify-center rounded-lg border ${tool === 'pen' && size === s.size ? 'border-slate-700 bg-slate-50' : 'border-slate-200'}`}
            aria-label={s.label}
          >
            <span className="rounded-full bg-slate-700" style={{ width: s.size + 2, height: s.size + 2 }} />
          </button>
        ))}
        <span className="shrink-0 w-px h-6 bg-slate-200 mx-1" />
        {/* 펜/지우개 */}
        <button onClick={() => setTool('pen')} className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border ${tool === 'pen' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-500'}`} aria-label="펜"><Pen size={16} /></button>
        <button onClick={() => setTool('eraser')} className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border ${tool === 'eraser' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-500'}`} aria-label="지우개"><Eraser size={16} /></button>
        <span className="shrink-0 w-px h-6 bg-slate-200 mx-1" />
        {/* 필기감 — 손잡이 / 팜 민감도 (왼손잡이·손가락 낙서 대응) */}
        <button
          onClick={() => { const n = handedness === 'right' ? 'left' : 'right'; setHandedness(n); try { localStorage.setItem('kkom-canvas-hand', n); } catch {} }}
          className="shrink-0 h-8 px-2 rounded-lg border border-slate-200 text-slate-500 text-[12px] font-bold active:scale-95"
        >{handedness === 'right' ? '✋오른손' : '🤚왼손'}</button>
        <button
          onClick={() => { const order: ('normal' | 'strong' | 'off')[] = ['normal', 'strong', 'off']; const n = order[(order.indexOf(palm) + 1) % 3]; setPalm(n); try { localStorage.setItem('kkom-canvas-palm', n); } catch {} }}
          className={`shrink-0 h-8 px-2 rounded-lg border text-[12px] font-bold active:scale-95 ${palm === 'off' ? 'border-slate-200 text-slate-400' : 'border-slate-700 text-slate-700'}`}
        >{palm === 'off' ? '손가락OK' : palm === 'strong' ? '팜 강함' : '팜 보통'}</button>
        <span className="shrink-0 w-px h-6 bg-slate-200 mx-1" />
        {/* 지문 배경 */}
        <label className="shrink-0 h-8 px-2.5 rounded-lg border border-slate-200 text-slate-500 flex items-center gap-1.5 text-[12px] font-bold active:scale-95 cursor-pointer">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={15} />} 지문
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={pickPassage} />
        </label>
        {passageUrl && (
          <button onClick={removePassage} className="shrink-0 h-8 w-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center active:scale-95" aria-label="지문 빼기"><ImageOff size={15} /></button>
        )}
      </div>

      {/* 지문 투명도 (지문 있을 때만) */}
      {passageUrl && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-b border-slate-200/70 bg-white/50">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">지문 투명도</span>
          <input
            type="range" min={0} max={1} step={0.05} value={opacity}
            onChange={(e) => setOpacityPersist(Number(e.target.value))}
            className="flex-1 accent-purple-500"
          />
          <span className="text-[11px] font-black text-slate-500 w-9 text-right tabular-nums">{Math.round(opacity * 100)}%</span>
        </div>
      )}

      {/* 보드 */}
      <div ref={wrapRef} className="flex-1 min-h-0 flex items-center justify-center p-3 bg-[#FBF8F0]">
        {board.w > 0 && (
          <div
            className="relative bg-white shadow-[0_6px_30px_rgba(0,0,0,0.08)] rounded-lg overflow-hidden select-none"
            style={{ width: board.w, height: board.h, WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
          >
            {/* 배경 지문 — CSS background-image (img 태그 X). iOS 이미지 콜아웃/선택 회피 */}
            {passageUrl && (
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none select-none"
                style={{
                  opacity,
                  backgroundImage: `url(${passageUrl})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
            <InkCanvas
              width={board.w}
              height={board.h}
              strokes={inkStrokes}
              tool={tool}
              color={color}
              size={size}
              handedness={handedness}
              palmSensitivity={palm}
              onAddStroke={handleAddStroke}
              onEraseStrokes={handleErase}
              onLiveStroke={handleLiveStroke}
            />
            {/* 상대가 그리는 중인 획 — 위에 겹쳐 생중계 (입력은 통과) */}
            {partnerLive && (
              <StaticInkCanvas
                width={board.w}
                height={board.h}
                strokes={EMPTY_STROKES}
                liveStroke={partnerLive}
                fadingStrokes={EMPTY_STROKES}
              />
            )}
          </div>
        )}
      </div>

      {/* 하트 + 댓글 (현재 페이지) */}
      <div className="shrink-0 border-t border-slate-200/70 bg-white/85 backdrop-blur" style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-4 px-4 py-2">
          <button
            onClick={() => { const b = pageIdRef.current; if (b && me) toggleLike(b, me as '우댕' | '꼼이', !reactions.likedBy.includes(me as '우댕' | '꼼이')).catch(() => {}); }}
            className="flex items-center gap-1.5 active:scale-90 transition-transform" aria-label="하트"
          >
            <Heart size={22} className={reactions.likedBy.includes(me as '우댕' | '꼼이') ? 'text-rose-500 fill-rose-500' : 'text-slate-300'} />
            {reactions.likedBy.length > 0 && <span className="text-sm font-black text-slate-600 tabular-nums">{reactions.likedBy.length}</span>}
          </button>
          <button onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1.5 text-slate-400 active:scale-90 transition-transform" aria-label="댓글">
            <MessageCircle size={20} className={showComments ? 'text-purple-500' : ''} />
            {reactions.comments.length > 0 && <span className="text-sm font-bold text-slate-500 tabular-nums">{reactions.comments.length}</span>}
          </button>
          <div className="flex-1" />
          {reactions.likedBy.length === 2 && <span className="text-xs font-black text-rose-400">둘 다 하트 💕</span>}
        </div>
        {showComments && (
          <div className="px-4 pb-2">
            <div className="max-h-36 overflow-y-auto flex flex-col gap-1 mb-1.5">
              {reactions.comments.length === 0 && <p className="text-xs text-slate-400 py-2 text-center">첫 댓글을 남겨봐 💬</p>}
              {reactions.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-1.5">
                  <span className={`text-[11px] font-black shrink-0 mt-0.5 ${c.by === '꼼이' ? 'text-rose-500' : 'text-blue-500'}`}>{c.by}</span>
                  <span className="text-[13px] text-slate-700 flex-1 break-words">{c.text}</span>
                  {c.by === me && (
                    <button onClick={() => { const b = pageIdRef.current; if (b) deleteComment(b, c.id).catch(() => {}); }} className="text-slate-300 text-xs shrink-0 active:text-rose-400" aria-label="댓글 삭제">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { const b = pageIdRef.current; if (e.key === 'Enter' && commentText.trim() && b && me) { addComment(b, me as '우댕' | '꼼이', commentText); setCommentText(''); } }}
                placeholder="댓글 달기…" maxLength={500}
                className="flex-1 text-[13px] bg-slate-100 rounded-full px-3.5 py-1.5 outline-none focus:bg-slate-200/70"
              />
              <button onClick={() => { const b = pageIdRef.current; if (commentText.trim() && b && me) { addComment(b, me as '우댕' | '꼼이', commentText); setCommentText(''); } }} className="text-purple-500 active:scale-90 shrink-0" aria-label="댓글 전송"><Send size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
