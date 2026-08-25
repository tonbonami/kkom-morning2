'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Eraser, Check, Play, Pause, RotateCw, X } from 'lucide-react';
import { getStroke } from 'perfect-freehand';
// 낙서장(캔버스) 엔진 이식 — 속도기반 의사필압 + perfect-freehand 채움
import { freehandOptions, outlineToPath, smoothVelocity, pseudoPressure } from './ink/brush';

// -----------------------------------------------------------------------------
// Types & Data Model
// -----------------------------------------------------------------------------
export interface Stroke {
  points: Array<[number, number, number]>; // [x, y, timestamp_ms]
  color: string;
}

export interface DoodleData {
  strokes: Stroke[];
  width: number;
  height: number;
  duration: number;
}

export interface Props {
  mode: 'compose' | 'play';
  // Compose props
  initialData?: DoodleData;
  onChange?: (data: DoodleData | null) => void;
  onCancel?: () => void;
  onDone?: () => void; // 완료 눌렀을 때 (부모가 패드를 접는 등 피드백 처리)
  // Play props
  data?: DoodleData;
  autoPlay?: boolean;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const CANVAS_W = 320;
const CANVAS_H = 200;
const PEN_COLOR = '#334155';
const PEN_WIDTH = 2.5;
const PF_SIZE = 5.5; // perfect-freehand 브러시 굵기 (낙서장 엔진과 동일 계열)
const BG_COLOR = '#FFFCF7';

// DoodlePad 점([x,y,t] 픽셀) → perfect-freehand 채움 Path2D. 속도로 의사필압을 계산해
// 빠르면 얇게·천천히면 두껍게 (낙서장 엔진 이식). 저장 포맷([x,y,t])은 그대로 유지.
function pointsToPath(points: Array<[number, number, number]>, size: number = PF_SIZE): Path2D {
  if (points.length === 0) return new Path2D();
  let v = 0;
  const pts = points.map((pt, i) => {
    if (i > 0) {
      const [px, py, pt0] = points[i - 1];
      v = smoothVelocity(v, pt[0] - px, pt[1] - py, pt[2] - pt0);
    }
    return { x: pt[0], y: pt[1], pressure: pseudoPressure(v) };
  });
  return outlineToPath(getStroke(pts, freehandOptions(size)));
}

// -----------------------------------------------------------------------------
// Helper: Convert points to smooth SVG Path
// -----------------------------------------------------------------------------
function getSmoothSvgPath(points: [number, number, number][]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]} L ${points[0][0]} ${points[0][1]}`;

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cx = (points[i][0] + points[i + 1][0]) / 2;
    const cy = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q ${points[i][0]} ${points[i][1]} ${cx} ${cy}`;
  }
  d += ` L ${points[points.length - 1][0]} ${points[points.length - 1][1]}`;
  return d;
}

// -----------------------------------------------------------------------------
// Main Wrapper Component
// -----------------------------------------------------------------------------
export default function DoodlePad(props: Props) {
  if (props.mode === 'compose') {
    return <ComposePad {...props} />;
  }
  if (props.mode === 'play' && props.data) {
    return <PlayPad {...props} data={props.data} />;
  }
  return null;
}

// -----------------------------------------------------------------------------
// 1. Compose Mode (HTML5 Canvas for real-time drawing perf)
// -----------------------------------------------------------------------------
function ComposePad({ initialData, onChange, onCancel, onDone }: Omit<Props, 'mode' | 'data' | 'autoPlay'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use refs for real-time drawing to avoid React re-render lag
  const strokesRef = useRef<Stroke[]>(initialData?.strokes || []);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  const [hasContent, setHasContent] = useState(strokesRef.current.length > 0);
  const [isActivelyDrawing, setIsActivelyDrawing] = useState(false); // For visual elevation
  const [isDonePulsing, setIsDonePulsing] = useState(false);

  // Initialize startTime if we have initial data
  useEffect(() => {
    if (initialData && initialData.duration > 0 && !startTimeRef.current) {
      startTimeRef.current = Date.now() - initialData.duration;
    }
  }, [initialData]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // perfect-freehand 채움 — 속도기반 굵기(빠르면 얇게)로 낙서장과 동일한 획 느낌
    const renderStroke = (stroke: Stroke) => {
      if (stroke.points.length === 0) return;
      ctx.fillStyle = stroke.color;
      ctx.fill(pointsToPath(stroke.points));
    };

    strokesRef.current.forEach(renderStroke);
    if (currentStrokeRef.current) {
      renderStroke(currentStrokeRef.current);
    }
  }, []);

  // Initial draw
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    ];
  };

  const notifyChange = () => {
    if (strokesRef.current.length === 0) {
      onChange?.(null);
      setHasContent(false);
      return;
    }
    const lastStroke = strokesRef.current[strokesRef.current.length - 1];
    const dur = lastStroke.points.length > 0 ? lastStroke.points[lastStroke.points.length - 1][2] : 0;

    onChange?.({
      strokes: [...strokesRef.current], // shallow copy to trigger updates if needed
      width: CANVAS_W,
      height: CANVAS_H,
      duration: dur,
    });
    setHasContent(true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // iPadOS Scribble이 Pencil 감지 시 주변 textarea를 자동으로 인식 대상으로 삼음 →
    // 현재 포커스된 input/textarea를 블러해 Scribble target 제거 (편지 본문 입력창 보호)
    const ae = document.activeElement as HTMLElement | null;
    if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) ae.blur();

    // 이미 그리는 중에 두 번째 손가락/팜이 들어오면 무시 (multi-touch 보호)
    if (isDrawingRef.current) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    setIsActivelyDrawing(true);
    setHasContent(true);

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    const t = Date.now() - startTimeRef.current;
    const pos = getPos(e);

    currentStrokeRef.current = {
      points: [[pos[0], pos[1], t]],
      color: PEN_COLOR
    };
    drawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current || !startTimeRef.current) return;
    const t = Date.now() - startTimeRef.current;
    const pos = getPos(e);
    currentStrokeRef.current.points.push([pos[0], pos[1], t]);
    drawCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    isDrawingRef.current = false;
    setIsActivelyDrawing(false);

    if (currentStrokeRef.current) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
    }
    drawCanvas();
    notifyChange();
  };

  const handleUndo = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    if (strokesRef.current.length === 0) {
      startTimeRef.current = null; // Reset time if fully cleared
    }
    drawCanvas();
    notifyChange();
  };

  const handleClear = () => {
    if (!confirm('그린 내용을 모두 지울까요?')) return;
    strokesRef.current = [];
    startTimeRef.current = null;
    drawCanvas();
    notifyChange();
  };

  const handleDone = () => {
    if (strokesRef.current.length === 0) return;
    notifyChange();                 // 최신 획까지 확실히 동기화
    setIsDonePulsing(true);
    // 짧은 확인 펄스 후 부모에 완료 통지 → 부모가 패드를 접어 '첨부됨' 상태로 (명확한 피드백)
    setTimeout(() => { setIsDonePulsing(false); onDone?.(); }, 300);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      <motion.div
        ref={containerRef}
        animate={{
          boxShadow: isActivelyDrawing
            ? '0 12px 32px rgba(0,0,0,0.08)'
            : '0 4px 20px rgba(0,0,0,0.04)',
          scale: isDonePulsing ? [1, 1.02, 1] : 1
        }}
        transition={{ duration: 0.2 }}
        className="w-full aspect-[1.6] relative rounded-[28px] overflow-hidden select-none touch-none bg-[#FFFCF7] border border-slate-100"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full cursor-crosshair block touch-none"
          // iOS Safari long-press callout(복사/선택) + 텍스트 선택 + 탭 하이라이트 차단
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerOut={handlePointerUp}
        />

        {/* Placeholder */}
        <AnimatePresence>
          {!hasContent && !isActivelyDrawing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span className="text-[14px] font-bold text-slate-300">
                이곳에 손글씨를 남겨주세요 ✏️
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Controls */}
      <div className="w-full flex items-center justify-between mt-5 px-2">
        <div className="flex gap-2">
          {onCancel && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-sm">
              <X size={18} />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleUndo}
            disabled={!hasContent}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-slate-600 disabled:opacity-40 disabled:shadow-none"
          >
            <RotateCcw size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleClear}
            disabled={!hasContent}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-slate-600 disabled:opacity-40 disabled:shadow-none"
          >
            <Eraser size={18} />
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: hasContent ? 0.95 : 1 }}
          onClick={handleDone}
          disabled={!hasContent}
          className="px-6 py-3 rounded-full font-bold text-[14px] flex items-center gap-1.5 transition-colors shadow-sm disabled:shadow-none disabled:bg-slate-100 disabled:text-slate-300 bg-[#10B981] text-white"
        >
          <Check size={16} strokeWidth={2.5} /> 완료
        </motion.button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Play Mode (SVG for smooth path playback)
// -----------------------------------------------------------------------------
function PlayPad({ data, autoPlay = false }: { data: DoodleData; autoPlay?: boolean }) {
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const reqRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  const duration = data.duration || 1;

  // Animation Loop
  const animatePlayback = useCallback((now: number) => {
    if (lastTimeRef.current !== undefined) {
      const delta = now - lastTimeRef.current;
      setTime(prev => {
        const nextTime = prev + delta;
        if (nextTime >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return nextTime;
      });
    }
    lastTimeRef.current = now;
    reqRef.current = requestAnimationFrame(animatePlayback);
  }, [duration]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      reqRef.current = requestAnimationFrame(animatePlayback);
    } else {
      lastTimeRef.current = undefined;
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, animatePlayback]);

  const togglePlay = () => {
    if (time >= duration) setTime(0); // Restart if finished
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    setTime(0);
    setIsPlaying(true);
  };

  const playCanvasRef = useRef<HTMLCanvasElement>(null);
  const wpx = data.width || CANVAS_W;
  const hpx = data.height || CANVAS_H;

  // time이 바뀔 때마다 지금까지의 획 + 펜촉을 perfect-freehand로 캔버스에 다시 그린다 (낙서장 엔진)
  useEffect(() => {
    const canvas = playCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, wpx, hpx);

    let tip: [number, number] | null = null;
    for (const stroke of data.strokes) {
      const pts = stroke.points;
      if (pts.length === 0) continue;
      let drawingNow = false;
      if (time >= pts[0][2] && time <= pts[pts.length - 1][2]) {
        drawingNow = true;
        for (let i = 0; i < pts.length - 1; i++) {
          if (time >= pts[i][2] && time <= pts[i + 1][2]) {
            const prog = pts[i + 1][2] === pts[i][2] ? 1 : (time - pts[i][2]) / (pts[i + 1][2] - pts[i][2]);
            tip = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * prog, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * prog];
            break;
          }
        }
      }
      const visible: Array<[number, number, number]> = pts.filter((p) => p[2] <= time);
      if (drawingNow && tip && visible.length > 0) visible.push([tip[0], tip[1], time]);
      if (visible.length === 0) continue;
      ctx.fillStyle = stroke.color;
      ctx.fill(pointsToPath(visible));
    }

    if (tip) {
      ctx.beginPath();
      ctx.fillStyle = '#10B981';
      ctx.arc(tip[0], tip[1], 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [time, data, wpx, hpx]);

  const formatTime = (ms: number) => (ms / 1000).toFixed(1);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      <div className="w-full aspect-[1.6] relative rounded-[28px] overflow-hidden bg-[#FFFCF7] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">

        <canvas
          ref={playCanvasRef}
          width={wpx}
          height={hpx}
          className="w-full h-full block"
        />

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm text-slate-700"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </motion.button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 tabular-nums bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full">
              {formatTime(time)}s / {formatTime(duration)}s
            </span>

            <AnimatePresence>
              {time >= duration && !isPlaying && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={restart}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#10B981] shadow-[0_4px_12px_rgba(16,185,129,0.3)] text-white"
                >
                  <RotateCw size={16} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
