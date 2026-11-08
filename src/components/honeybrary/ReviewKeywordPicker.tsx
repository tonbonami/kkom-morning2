// src/components/honeybrary/ReviewKeywordPicker.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HONEY } from '@/lib/honeybraryTheme';

export interface ReviewKeywordPickerProps {
  items: string[];
  selected: string[];
  max: number;
  onChange: (selected: string[]) => void;
}

export function ReviewKeywordPicker({
  items,
  selected,
  max,
  onChange,
}: ReviewKeywordPickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const isMaxReached = selected.length >= max;

  const handleToggle = (keyword: string) => {
    if (selected.includes(keyword)) {
      onChange(selected.filter((k) => k !== keyword));
    } else {
      if (isMaxReached) return;
      onChange([...selected, keyword]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item);
          const isDisabled = !isSelected && isMaxReached;

          return (
            <motion.button
              key={item}
              type="button"
              onClick={() => handleToggle(item)}
              disabled={isDisabled}
              whileTap={shouldReduceMotion || isDisabled ? undefined : { scale: 0.96 }}
              className="min-h-[40px] px-3.5 py-2 rounded-full text-[13.5px] font-medium border flex items-center justify-center select-none transition-opacity"
              style={{
                backgroundColor: isSelected ? HONEY.accentSoft : '#FFFFFF',
                color: isSelected ? HONEY.accentSoftInk : HONEY.ink,
                borderColor: isSelected ? HONEY.accentSoftInk : HONEY.line,
                opacity: isDisabled ? 0.36 : 1,
              }}
              aria-pressed={isSelected}
            >
              {item}
            </motion.button>
          );
        })}
      </div>
      {isMaxReached && (
        <p className="text-[12px] text-right font-medium" style={{ color: HONEY.accentSoftInk }}>
          {max}개까지 고를 수 있어요
        </p>
      )}
    </div>
  );
}
