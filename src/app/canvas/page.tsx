'use client';

// 우리 낙서장 — 커플 공유 실시간 필기 보드 (아이패드+애플펜슬 최적, 폰도 OK).
// 배경에 영어 지문 이미지를 깔 수 있고(투명도 조절), 그 위에 둘이 자유롭게 필기.
// 1단계: 완성된 획을 Firestore로 공유. 그리는 중 획 생중계(RTDB)는 2단계.

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pen, Eraser, Undo2, Trash2, ImagePlus, ImageOff, Loader2 } from 'lucide-react';
import InkCanvas from '@/components/ink/InkCanvas';
import {
  subscribeStrokes, subscribeBoardMeta, addStroke, eraseStrokes, clearBoard,
  uploadPassageImage, setPassage, clearPassage,
  DEFAULT_BOARD, type BoardStroke,
} from '@/lib/canvasBoard';
import { nameFromCode } from '@/lib/letters';
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

export default function CanvasPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [strokes, setStrokes] = useState<BoardStroke[]>([]);
  const [passageUrl, setPassageUrl] = useState<string | undefined>();

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#334155');
  const [size, setSize] = useState(7);
  const [opacity, setOpacity] = useState(0.5); // 지문 투명도 (개인 뷰 설정)
  const [uploading, setUploading] = useState(false);

  // 보드 실측 크기 (3:4 유지, 화면에 맞춤)
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [board, setBoard] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    const name = nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이';
    setMe(name);
    setColor(name === '꼼이' ? '#f43f5e' : '#3b82f6'); // 내 색을 기본으로
    const savedOp = localStorage.getItem('kkom-canvas-opacity');
    if (savedOp) setOpacity(Number(savedOp));
    const unsubS = subscribeStrokes(DEFAULT_BOARD, setStrokes);
    const unsubM = subscribeBoardMeta(DEFAULT_BOARD, (m) => setPassageUrl(m.passageUrl));
    return () => { unsubS(); unsubM(); };
  }, [router]);

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
    if (!me) return;
    addStroke(DEFAULT_BOARD, { color: s.color, size: s.size, points: s.points }, me).catch(console.error);
  };
  const handleErase = (ids: string[]) => {
    eraseStrokes(DEFAULT_BOARD, ids).catch(console.error);
  };

  const undoMine = () => {
    // 내가 그린 마지막 획 지우기
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].by === me) { eraseStrokes(DEFAULT_BOARD, [strokes[i].id]).catch(console.error); return; }
    }
    feedback('되돌릴 내 획이 없어', 'info');
  };
  const clearAll = () => {
    if (!confirm('낙서장을 전부 지울까? (둘 다에게서 사라져)')) return;
    clearBoard(DEFAULT_BOARD).then(() => feedback('🧹 낙서장 비웠어')).catch(() => feedback('지우기 실패', 'error'));
  };

  const pickPassage = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const f = input.files?.[0];
    input.value = '';
    if (!f || !f.type.startsWith('image/') || !me) return;
    setUploading(true);
    try {
      const url = await uploadPassageImage(f, me);
      await setPassage(DEFAULT_BOARD, url);
      feedback('📄 지문 깔았어');
    } catch (err) {
      console.error(err);
      feedback('지문 올리기 실패', 'error');
    } finally {
      setUploading(false);
    }
  };
  const removePassage = () => {
    if (!confirm('배경 지문을 뺄까?')) return;
    clearPassage(DEFAULT_BOARD).catch(console.error);
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
        <button onClick={() => router.push('/')} className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 active:scale-95" aria-label="홈으로"><ArrowLeft size={17} /></button>
        <h1 className="font-handwriting text-[24px] text-slate-800 leading-none">우리 낙서장</h1>
        <div className="flex-1" />
        <button onClick={undoMine} className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 active:scale-95" aria-label="되돌리기"><Undo2 size={17} /></button>
        <button onClick={clearAll} className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 active:text-rose-500 active:scale-95" aria-label="전체 지우기"><Trash2 size={16} /></button>
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
            className="relative bg-white shadow-[0_6px_30px_rgba(0,0,0,0.08)] rounded-lg overflow-hidden"
            style={{ width: board.w, height: board.h }}
          >
            {passageUrl && (
              <img
                src={passageUrl}
                alt="배경 지문"
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                style={{ opacity }}
              />
            )}
            <InkCanvas
              width={board.w}
              height={board.h}
              strokes={inkStrokes}
              tool={tool}
              color={color}
              size={size}
              palmSensitivity="normal"
              onAddStroke={handleAddStroke}
              onEraseStrokes={handleErase}
            />
          </div>
        )}
      </div>
    </div>
  );
}
