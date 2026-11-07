// src/components/letter/ThoughtBubble.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ThoughtBubbleProps {
  src: string;                 // 캐릭터 그림(글씨 없는 상반신, 투명 배경)
  size: number;                // 풍선 지름 px (64~80)
  tail: 'down-right' | 'up-left' | 'down-left' | 'up-right';   // 꼬리 동그라미 2개가 향하는 쪽
  appear?: boolean;            // true 면 한 번 살짝 떠오르며 나타남(2~3px), false 면 정지
}

const TAIL_STYLES: Record<ThoughtBubbleProps['tail'], { dot1: string; dot2: string }> = {
  'down-right': {
    dot1: 'bottom-[4%] -right-[4%]',
    dot2: '-bottom-[12%] -right-[14%]',
  },
  'up-left': {
    dot1: 'top-[4%] -left-[4%]',
    dot2: '-top-[12%] -left-[14%]',
  },
  'down-left': {
    dot1: 'bottom-[4%] -left-[4%]',
    dot2: '-bottom-[12%] -left-[14%]',
  },
  'up-right': {
    dot1: 'top-[4%] -right-[4%]',
    dot2: '-top-[12%] -right-[14%]',
  },
};

export function ThoughtBubble({ src, size, tail, appear = false }: ThoughtBubbleProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = appear && !prefersReduced;

  const dot1Size = Math.max(7, Math.round(size * 0.13));
  const dot2Size = Math.max(5, Math.round(size * 0.08));

  return (
    <motion.div
      aria-hidden="true"
      initial={shouldAnimate ? { opacity: 0, y: 3 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{ width: size, height: size }}
      className="relative select-none pointer-events-none will-change-transform"
    >
      <span
        style={{ width: dot1Size, height: dot1Size }}
        className={`absolute rounded-full bg-white/[0.92] border border-[var(--sd-line)] shadow-sm ${TAIL_STYLES[tail].dot1}`}
      />
      <span
        style={{ width: dot2Size, height: dot2Size }}
        className={`absolute rounded-full bg-white/[0.92] border border-[var(--sd-line)] shadow-sm ${TAIL_STYLES[tail].dot2}`}
      />

      <div className="w-full h-full rounded-full bg-white/[0.92] border border-[var(--sd-line)] shadow-sm overflow-hidden flex items-center justify-center p-1.5">
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    </motion.div>
  );
}
