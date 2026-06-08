'use client';

// 위시리스트/또갈래 사진 갤러리 — 여러 장 사진 풀스크린 보기 + 좌우 스와이프.
// 단순 단일 컴포넌트, 외부 lib 없음 (Framer Motion swipe만).

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  open: boolean;
  photos: string[];
  startIndex?: number;
  title?: string;
  onClose: () => void;
}

export default function PhotoGalleryModal({ open, photos, startIndex = 0, title, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(Math.max(0, Math.min(startIndex, photos.length - 1)));
  }, [open, startIndex, photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(photos.length - 1, i + 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, photos.length, onClose]);

  if (!open) return null;

  const total = photos.length;
  const safeIdx = Math.max(0, Math.min(index, total - 1));
  const current = photos[safeIdx];

  const handleSwipe = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 && safeIdx < total - 1) setIndex(safeIdx + 1);
    else if (info.offset.x > 60 && safeIdx > 0) setIndex(safeIdx - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90 flex flex-col"
        onClick={onClose}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-12 pb-3 text-white">
          <div className="flex-1 min-w-0">
            {title && <p className="text-sm font-bold truncate">{title}</p>}
            <p className="text-[11px] font-bold text-white/60">{safeIdx + 1} / {total}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="h-10 w-10 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 사진 */}
        <div className="flex-1 flex items-center justify-center px-4 relative" onClick={(e) => e.stopPropagation()}>
          <motion.img
            key={current}
            src={current}
            alt=""
            draggable={false}
            drag={total > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={handleSwipe}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="max-h-full max-w-full object-contain select-none"
          />

          {/* 좌우 화살표 (사진 2장 이상일 때) */}
          {total > 1 && safeIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIndex(safeIdx - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center text-white"
              aria-label="이전"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {total > 1 && safeIdx < total - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIndex(safeIdx + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center text-white"
              aria-label="다음"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* 하단 dot 또는 썸네일 row (사진 2장 이상) */}
        {total > 1 && (
          <div className="px-4 pb-8 pt-3 flex gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            {photos.map((p, i) => (
              <button
                key={p}
                onClick={() => setIndex(i)}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden ring-2 transition ${
                  i === safeIdx ? 'ring-white' : 'ring-white/20 opacity-60'
                }`}
              >
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
