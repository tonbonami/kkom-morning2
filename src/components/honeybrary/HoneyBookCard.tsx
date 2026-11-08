// src/components/honeybrary/HoneyBookCard.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PEOPLE, type BookVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneyBookCover } from './HoneyBookCover';
import { ReaderProgressLine } from './ReaderProgressLine';

export interface HoneyBookCardProps {
  book: BookVM;
  compact?: boolean;
  onClick: () => void;
}

export function HoneyBookCard({
  book,
  compact = false,
  onClick,
}: HoneyBookCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 py-2 px-1 text-left w-full min-h-[44px] active:opacity-75 transition-opacity"
      >
        <HoneyBookCover title={book.title} src={book.coverThumb} width={26} rounded={5} />
        <span
          className="text-[13.5px] truncate font-medium flex-1"
          style={{ color: HONEY.muted }}
        >
          {book.title}
        </span>
      </button>
    );
  }

  return (
    <motion.button
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      onClick={onClick}
      className="flex gap-4 p-3.5 rounded-[20px] text-left w-full min-h-[44px]"
      style={{
        background: HONEY.card,
        boxShadow: HONEY.shadowCard,
      }}
    >
      <HoneyBookCover title={book.title} src={book.coverThumb} width={58} />
      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
        <p
          className="text-[15px] font-bold leading-snug line-clamp-2"
          style={{ color: HONEY.ink }}
        >
          {book.title}
        </p>
        <div className="flex flex-col gap-1">
          {PEOPLE.map((p) => {
            const r = book.readers[p];
            if (!r) return null;
            return <ReaderProgressLine key={p} name={p} reading={r} compact />;
          })}
        </div>
      </div>
    </motion.button>
  );
}
