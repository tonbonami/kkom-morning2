// src/components/honeybrary/HoneyPhotoViewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { PhotoVM } from '@/lib/honeybraryTypes';
import ZoomableImage from '@/components/ZoomableImage';

export interface HoneyPhotoViewerProps {
  open: boolean;
  photos: PhotoVM[];
  initialIndex: number;
  onClose: () => void;
}

export function HoneyPhotoViewer({
  open,
  photos,
  initialIndex,
  onClose,
}: HoneyPhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      setIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)));
    }
  }, [open, initialIndex, photos.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(photos.length - 1, i + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, photos.length, onClose]);

  if (!open || photos.length === 0) return null;

  const currentPhoto = photos[index];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center z-20"
          style={{ top: 'max(16px, env(safe-area-inset-top))' }}
        >
          <X size={26} />
        </button>

        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
          {/* 넘기기·확대는 ZoomableImage 한 곳에서(1배일 때 옆으로 밀면 넘김, 두 손가락·두 번 톡이면 확대) —
              예전 framer drag 넘기기는 두 손가락 확대와 손짓이 겹쳐서 뺐다. */}
          <motion.div
            key={index}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="w-full h-full p-4"
          >
            {currentPhoto && (
              <ZoomableImage
                src={currentPhoto.url}
                onBackgroundTap={onClose}
                onSwipe={photos.length > 1 ? (dir) => setIndex((i) => (dir === 'next' ? Math.min(photos.length - 1, i + 1) : Math.max(0, i - 1))) : undefined}
              />
            )}
          </motion.div>
        </div>

        {photos.length > 1 && (
          <div
            className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none z-10"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {photos.map((p, i) => (
              <span
                key={p.id || i}
                className={`h-1.5 rounded-full ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
