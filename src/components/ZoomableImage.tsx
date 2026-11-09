'use client';

// 사진 크게 보기 안에서 손가락으로 확대 — 두 손가락 벌리기 · 두 번 톡 · 확대한 채로 끌어서 보기.
// 우댕 2026-11-09 「사진 받고나서 클릭하면 확대해서 보기가 안되네... 구현해봐.」
//
// ⚠️ 왜 직접 만드나: 아이폰 앱(Capacitor 웹뷰)은 **화면 확대가 기본으로 꺼져 있다**(@capacitor/ios zoomingEnabled=false).
//    그래서 사진을 전체 화면으로 열어도 두 손가락으로 벌려지지 않았다. 앱 설정으로 켜면 앱 화면 전체가 확대돼 버려서(입력칸·카드까지)
//    사진 칸 안에서만 확대를 직접 처리한다. 사파리에서도 같은 손짓이 된다(touch-action:none).
// ⚠️ 성능(우댕 제1 조건 「버벅이게 금지」): 손가락이 움직일 때 React 상태를 바꾸지 않고, 그림의 transform 만 rAF 로 바꾼다.
import { useCallback, useEffect, useRef } from 'react';

export interface ZoomableImageProps {
  src: string;
  alt?: string;
  /** 그림 크기 클래스 — 보통 'max-w-full max-h-full object-contain' */
  imgClassName?: string;
  /** 확대 상태가 바뀔 때(1배 ↔ 확대) — 부모가 넘기기·닫기 손짓을 막는 데 쓴다 */
  onZoomChange?: (zoomed: boolean) => void;
  /** 1배일 때 옆으로 밀면 — 여러 장 넘기기 */
  onSwipe?: (dir: 'next' | 'prev') => void;
  /** 사진 밖 빈 곳을 톡(1배일 때) — 보통 닫기 */
  onBackgroundTap?: () => void;
}

const MAX = 4;          // 최대 4배
const DOUBLE = 2.5;     // 두 번 톡 → 2.5배
const TAP_MOVE = 10;    // 이보다 덜 움직이면 「톡」
const DOUBLE_MS = 280;  // 두 번 톡 사이 시간
const SWIPE = 60;       // 이만큼 밀면 넘김

type Pt = { x: number; y: number };

export default function ZoomableImage({ src, alt = '', imgClassName = 'max-w-full max-h-full object-contain', onZoomChange, onSwipe, onBackgroundTap }: ZoomableImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const view = useRef({ s: 1, x: 0, y: 0 });                 // 지금 배율·이동
  const pts = useRef(new Map<number, Pt>());                 // 화면에 닿은 손가락들
  const g = useRef({ kind: 'none' as 'none' | 'pinch' | 'pan' | 'swipe', s0: 1, x0: 0, y0: 0, d0: 1, m0: { x: 0, y: 0 } as Pt, p0: { x: 0, y: 0 } as Pt, moved: 0, onImg: false });
  const lastTap = useRef({ t: 0, x: 0, y: 0 });
  const raf = useRef(0);
  const zoomed = useRef(false);

  const paint = useCallback((animate = false) => {
    const img = imgRef.current;
    if (!img) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const { s, x, y } = view.current;
      img.style.transition = animate ? 'transform 220ms cubic-bezier(.2,.8,.2,1)' : 'none';
      img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    });
  }, []);

  /** 그림이 놓인 자리(변형 전) — 가운데 점과 크기 */
  const box = () => {
    const w = wrapRef.current, img = imgRef.current;
    if (!w || !img) return null;
    const r = w.getBoundingClientRect();
    return { cx: r.left + img.offsetLeft + img.offsetWidth / 2, cy: r.top + img.offsetTop + img.offsetHeight / 2, w: img.offsetWidth, h: img.offsetHeight, W: r.width, H: r.height };
  };

  /** 그림 가장자리가 화면 안쪽으로 들어오지 않게 이동을 묶는다 */
  const clamp = (s: number, x: number, y: number) => {
    const b = box();
    if (!b) return { s, x, y };
    const mx = Math.max(0, (b.w * s - b.W) / 2), my = Math.max(0, (b.h * s - b.H) / 2);
    return { s, x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  };

  const setZoomed = (z: boolean) => {
    if (zoomed.current === z) return;
    zoomed.current = z;
    onZoomChange?.(z);
  };

  const reset = (animate: boolean) => { view.current = { s: 1, x: 0, y: 0 }; paint(animate); setZoomed(false); };

  // 사진이 바뀌면 1배로
  useEffect(() => { view.current = { s: 1, x: 0, y: 0 }; paint(false); setZoomed(false); }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const mid = () => { const a = [...pts.current.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
  const dist = () => { const a = [...pts.current.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };

  const onDown = (e: React.PointerEvent) => {
    try { wrapRef.current?.setPointerCapture?.(e.pointerId); } catch { /* 이미 끝난 손가락이면 못 잡는다 — 그래도 계속 */ }
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const v = view.current;
    if (pts.current.size === 2) {
      g.current = { ...g.current, kind: 'pinch', s0: v.s, x0: v.x, y0: v.y, d0: dist(), m0: mid(), moved: TAP_MOVE + 1 };
    } else if (pts.current.size === 1) {
      g.current = { kind: v.s > 1.01 ? 'pan' : 'swipe', s0: v.s, x0: v.x, y0: v.y, d0: 1, m0: { x: 0, y: 0 }, p0: { x: e.clientX, y: e.clientY }, moved: 0, onImg: e.target === imgRef.current };
    }
  };

  const onMove = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const st = g.current;
    if (st.kind === 'pinch' && pts.current.size >= 2) {
      const b = box(); if (!b) return;
      const m = mid();
      const s = Math.min(MAX * 1.15, Math.max(0.85, st.s0 * (dist() / st.d0)));
      // 처음 두 손가락 가운데에 있던 그림 위 점이 지금 가운데에 그대로 있게
      const qx = (st.m0.x - b.cx - st.x0) / st.s0, qy = (st.m0.y - b.cy - st.y0) / st.s0;
      view.current = { s, x: m.x - b.cx - s * qx, y: m.y - b.cy - s * qy };
      paint();
      return;
    }
    const dx = e.clientX - st.p0.x, dy = e.clientY - st.p0.y;
    st.moved = Math.max(st.moved, Math.hypot(dx, dy));
    if (st.kind === 'pan') {
      view.current = clamp(st.s0, st.x0 + dx, st.y0 + dy);
      paint();
    } else if (st.kind === 'swipe' && onSwipe && Math.abs(dx) > Math.abs(dy)) {
      view.current = { s: 1, x: dx * 0.6, y: 0 };            // 손가락을 따라 살짝(놓으면 넘기거나 제자리)
      paint();
    }
  };

  const onUp = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.delete(e.pointerId);
    const st = g.current;

    if (st.kind === 'pinch') {
      if (pts.current.size === 1) {                          // 한 손가락만 남으면 그대로 끌기로 이어 간다
        const [p] = [...pts.current.values()];
        if (view.current.s <= 1.02) reset(true);
        else { view.current = clamp(Math.min(MAX, view.current.s), view.current.x, view.current.y); paint(true); setZoomed(true); }
        const v = view.current;
        g.current = { ...st, kind: v.s > 1.01 ? 'pan' : 'none', s0: v.s, x0: v.x, y0: v.y, p0: p };
        return;
      }
      const v = view.current;
      if (v.s <= 1.02) reset(true);
      else { view.current = clamp(Math.min(MAX, v.s), v.x, v.y); paint(true); setZoomed(true); }
      g.current.kind = 'none';
      return;
    }
    if (pts.current.size > 0) return;
    g.current.kind = 'none';

    if (st.kind === 'swipe' && onSwipe && st.moved > TAP_MOVE) {
      const dx = e.clientX - st.p0.x, dy = e.clientY - st.p0.y;
      if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) { reset(false); onSwipe(dx < 0 ? 'next' : 'prev'); return; }
      reset(true);
      return;
    }
    if (st.moved > TAP_MOVE) return;

    // 톡 — 그림 위 두 번이면 확대/되돌리기, 1배에서 빈 곳 한 번이면 닫기
    const now = Date.now(), lt = lastTap.current;
    const isDouble = st.onImg && now - lt.t < DOUBLE_MS && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30;
    if (isDouble) {
      lastTap.current = { t: 0, x: 0, y: 0 };
      if (view.current.s > 1.01) { reset(true); return; }
      const b = box(); if (!b) return;
      const px = e.clientX - b.cx, py = e.clientY - b.cy;   // 톡한 곳을 중심으로
      view.current = clamp(DOUBLE, px * (1 - DOUBLE), py * (1 - DOUBLE));
      paint(true); setZoomed(true);
      return;
    }
    lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    if (!st.onImg && view.current.s <= 1.01) onBackgroundTap?.();
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
      style={{ touchAction: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onClick={(e) => e.stopPropagation()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt={alt} draggable={false} decoding="async"
        className={`${imgClassName} select-none`} style={{ transformOrigin: 'center center', willChange: 'transform' }} />
    </div>
  );
}
