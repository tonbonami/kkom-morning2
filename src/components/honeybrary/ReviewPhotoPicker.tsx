// src/components/honeybrary/ReviewPhotoPicker.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import { type PhotoVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface ReviewPhotoPickerProps {
  photos: PhotoVM[];
  max: number;
  onAdd: (files: File[]) => void;
  onRemove: (photoId: string) => void;
  disabled?: boolean;
}

export function ReviewPhotoPicker({
  photos,
  max,
  onAdd,
  onRemove,
  disabled = false,
}: ReviewPhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const canAddMore = photos.length < max && !disabled;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    const availableSlots = max - photos.length;
    const toAdd = fileList.slice(0, availableSlots);
    if (toAdd.length > 0) {
      onAdd(toAdd);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
        {canAddMore && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={disabled}
              onChange={handleFileChange}
              className="hidden"
            />
            <motion.button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              className="w-[76px] h-[76px] shrink-0 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-1 focus:outline-none"
              style={{
                borderColor: HONEY.line,
                backgroundColor: '#FFFFFF',
                color: HONEY.muted,
              }}
              aria-label="사진 추가"
            >
              <Plus size={20} strokeWidth={2} style={{ color: HONEY.accent }} />
              <span className="text-[11.5px] tabular-nums font-medium" style={{ color: HONEY.faint }}>
                {photos.length}/{max}
              </span>
            </motion.button>
          </>
        )}

        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative w-[76px] h-[76px] shrink-0 rounded-2xl overflow-hidden bg-black/[0.04]"
          >
            <img
              src={photo.thumbUrl || photo.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover select-none"
            />

            {photo.pending && (
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}

            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white focus:outline-none before:absolute before:-inset-2 before:content-['']"
                aria-label="사진 지우기"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[12px] font-medium" style={{ color: HONEY.faint }}>
        표지 · 오래 남은 문장 · 함께 읽은 자리
      </p>
    </div>
  );
}
