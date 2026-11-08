// src/components/honeybrary/HoneyRating.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';
import { type Rating } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface HoneyRatingProps {
  value?: Rating;
  onChange?: (v?: Rating) => void; /* 없으면 보기 전용 */
  size?: number; /* 별 한 개 px, 기본 32 */
}

const RATING_LABELS: Record<Rating, string> = {
  1: '조금 아쉬웠어요',
  2: '무난하게 읽었어요',
  3: '재미있게 읽었어요',
  4: '마음에 깊이 남았어요',
  5: '오래오래 남을 것 같아요',
};

export function HoneyRating({
  value,
  onChange,
  size = 32,
}: HoneyRatingProps) {
  const isInteractive = typeof onChange === 'function';
  const shouldReduceMotion = useReducedMotion();

  const handleStarClick = (starIndex: Rating) => {
    if (!isInteractive) return;
    if (value === starIndex) {
      onChange(undefined);
    } else {
      onChange(starIndex);
    }
  };

  if (!isInteractive) {
    if (!value) return null;
    return (
      <div className="inline-flex items-center gap-1" aria-label={`독서 별점 ${value}점`}>
        {([1, 2, 3, 4, 5] as Rating[]).map((star) => {
          const isFilled = star <= value;
          return (
            <Star
              key={star}
              size={size}
              style={{
                color: isFilled ? HONEY.star : HONEY.starEmpty,
                fill: isFilled ? HONEY.star : HONEY.starEmpty,
              }}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="이번 독서 경험">
        {([1, 2, 3, 4, 5] as Rating[]).map((star) => {
          const isFilled = value !== undefined && star <= value;
          return (
            <motion.button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star}점: ${RATING_LABELS[star]}`}
              onClick={() => handleStarClick(star)}
              whileTap={shouldReduceMotion ? undefined : { scale: 1.2 }}
              className="min-w-[44px] min-h-[44px] p-1.5 flex items-center justify-center rounded-full focus:outline-none"
            >
              <Star
                size={size}
                style={{
                  color: isFilled ? HONEY.star : HONEY.starEmpty,
                  fill: isFilled ? HONEY.star : HONEY.starEmpty,
                }}
                strokeWidth={1.5}
              />
            </motion.button>
          );
        })}
      </div>
      <p className="text-[13px] font-medium" style={{ color: HONEY.muted }}>
        {value ? RATING_LABELS[value] : '별은 안 줘도 괜찮아요'}
      </p>
    </div>
  );
}
