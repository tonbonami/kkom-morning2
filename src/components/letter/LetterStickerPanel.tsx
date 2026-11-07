// src/components/letter/LetterStickerPanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

// Assuming SignedSticker is in the same directory
import { SignedSticker } from './SignedSticker';

export interface LetterStickerPanelProps {
  emoticons: { id: string; label: string; imageUrl: string }[];
  max: number;
  onAddEmoticon: () => void;
  onRemoveEmoticon: (index: number) => void;
  animated: { label: string; posterUrl: string; videoUrl: string } | null;
  onPickAnimated: () => void;
  onRemoveAnimated: () => void;
  sign?: string; // 내 사인(Kkomi/Kkuldang)
}

export function LetterStickerPanel({
  emoticons,
  max,
  onAddEmoticon,
  onRemoveEmoticon,
  animated,
  onPickAnimated,
  onRemoveAnimated,
  sign,
}: LetterStickerPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      <h3 className="text-lg font-semibold mb-3">큰 이모티콘 · 사인해서 붙여요</h3>

      {/* Static Emoticons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {emoticons.map((emo, index) => (
          <div key={emo.id} className="relative">
            <SignedSticker
              src={emo.imageUrl}
              alt={emo.label}
              size={64} // Matches existing w-16 h-16 (64px)
              sign={sign}
              tilt={-7} // Explicitly set for consistency
            />
            <motion.button
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
              onClick={() => onRemoveEmoticon(index)}
              className="absolute -top-2 -right-2 bg-[var(--sd-muted)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-w-[24px] min-h-[24px]"
              aria-label={`${emo.label} 이모티콘 제거`}
            >
              <X size={16} />
            </motion.button>
          </div>
        ))}
        {emoticons.length < max && (
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onAddEmoticon}
            className="w-16 h-16 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-muted)] flex flex-col items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="큰 이모티콘 추가"
          >
            <Plus size={24} />
            <span className="text-xs mt-1">이모티콘</span>
          </motion.button>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-3">움직이는 포차코</h3>

      {/* Animated Pochacco */}
      <div className="flex gap-2">
        {animated ? (
          <div className="relative">
            <video
              src={animated.videoUrl}
              poster={animated.posterUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-24 h-24 rounded-lg object-cover"
            />
            <motion.button
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
              onClick={onRemoveAnimated}
              className="absolute -top-2 -right-2 bg-[var(--sd-muted)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-w-[24px] min-h-[24px]"
              aria-label="움직이는 포차코 제거"
            >
              <X size={16} />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onPickAnimated}
            className="w-24 h-24 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-muted)] flex flex-col items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="움직이는 포차코 추가"
          >
            <Plus size={24} />
            <span className="text-xs mt-1">움직이는 포차코</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
