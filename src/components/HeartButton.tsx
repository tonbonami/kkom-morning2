'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/feedback';

// 카드 코너에 들어가는 작은 하트 카운터 (탭마다 +1, 작은 ❤️가 위로 튀어오름)
// 999까지 풀 표시, 1000+은 'k+'로 압축.

interface Props {
  count?: number;
  onHeart: () => void;
  variant?: 'light' | 'dark'; // 카드 배경에 따라
  size?: 'sm' | 'md';
  className?: string;
}

function formatCount(n?: number): string {
  const c = n || 0;
  if (c >= 1000) return (c / 1000).toFixed(1) + 'k+';
  return c.toString();
}

export default function HeartButton({ count, onHeart, variant = 'light', size = 'sm', className = '' }: Props) {
  const [bursts, setBursts] = useState<{ id: number; x: number }[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic([15, 30, 15]); // 따단닥 — 하트 톡톡 느낌
    setBursts((prev) => [...prev, { id: Date.now() + Math.random(), x: (Math.random() - 0.5) * 30 }]);
    onHeart();
  };

  const iconSize = size === 'md' ? 18 : 14;
  const textCls = size === 'md' ? 'text-[14px]' : 'text-[12px]';
  const iconCls =
    variant === 'dark'
      ? 'text-red-400 fill-red-400'
      : 'text-red-500 fill-red-500';
  const textColor = variant === 'dark' ? 'text-white' : 'text-slate-600';

  return (
    <button
      onClick={handleClick}
      aria-label="하트"
      className={`relative inline-flex items-center gap-1 transition-transform active:scale-90 ${className}`}
    >
      <Heart size={iconSize} className={iconCls} />
      <span className={`font-bold tabular-nums ${textCls} ${textColor}`}>
        {formatCount(count)}
      </span>

      <AnimatePresence>
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -36, x: b.x, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            onAnimationComplete={() => setBursts((prev) => prev.filter((p) => p.id !== b.id))}
            className="absolute left-0 top-0 pointer-events-none text-base"
          >
            ❤️
          </motion.span>
        ))}
      </AnimatePresence>
    </button>
  );
}
