// src/components/letter/UnopenedLetterCard.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Heart } from 'lucide-react';
import type { EnvelopePalette } from '@/lib/letterEnvelopes';

export interface UnopenedLetterCardProps {
  fromName: '우댕' | '꼼이';
  dateText: string;
  palette: EnvelopePalette;
  onOpen: () => void;
}

export function UnopenedLetterCard({
  fromName,
  dateText,
  palette,
  onOpen,
}: UnopenedLetterCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      className="w-full text-left rounded-[28px] p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4 transition-transform border border-[var(--sd-line)] shadow-[var(--sd-shadow-card)] min-h-[76px] cursor-pointer"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.78)',
      }}
      aria-label={`${fromName}에게서 온 편지 열기`}
    >
      {/* CSS 미니 봉투 도형 (내용 스포일러 없음) */}
      <div
        className="relative w-12 h-[34px] rounded-[7px] shrink-0 overflow-hidden shadow-sm"
        style={{
          backgroundColor: palette.body,
          boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
        aria-hidden="true"
      >
        {/* 접힌 덮개 (삼각형) */}
        <div
          className="absolute top-0 inset-x-0 h-[21px]"
          style={{
            backgroundColor: palette.flap,
            clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
          }}
        />

        {/* 덮개 끝 밀랍 하트 도장 */}
        <div
          className="absolute top-[13px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
          style={{ backgroundColor: palette.seal }}
        >
          <Heart
            className="w-2 h-2"
            style={{ color: palette.sealInk, fill: palette.sealInk }}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* 안내 글 & 날짜 */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[16px] font-semibold text-[var(--sd-ink)] leading-snug truncate">
          {fromName}에게서 편지가 왔어요
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[12px] font-medium text-[var(--sd-rel)]">
            봉투를 열어 봐
          </span>
          <span className="text-[11px] text-[var(--sd-line)]">·</span>
          <span className="text-[12px] tabular-nums text-[var(--sd-cardlabel)] truncate">
            {dateText}
          </span>
        </div>
      </div>

      {/* 진입 화살표 아이콘 */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--sd-surface-2)] text-[var(--sd-faint)]"
        aria-hidden="true"
      >
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.button>
  );
}
