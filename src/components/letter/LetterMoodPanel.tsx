'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LETTER_MOODS, type LetterMood } from '@/lib/letterMoods';

export interface LetterMoodPanelProps {
  value: LetterMood;
  onChange: (value: LetterMood) => void;
}

export function LetterMoodPanel({ value, onChange }: LetterMoodPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <div className="mb-3">
        <p className="text-[15px] font-semibold text-[var(--sd-ink)]">편지 분위기</p>
        <p className="mt-0.5 text-[12px] text-[var(--sd-muted)]">받는 사람에게 보여 줄 표정을 골라 줘.</p>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="편지 분위기">
        {LETTER_MOODS.map((mood) => {
          const selected = mood.id === value;
          return (
            <motion.button
              key={mood.id}
              type="button"
              role="radio"
              aria-checked={selected}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              onClick={() => onChange(mood.id)}
              className={`min-h-[42px] rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                selected
                  ? 'border-[var(--sd-rel)] bg-[var(--sd-rel-soft)] text-[var(--sd-rel)]'
                  : 'border-[var(--sd-line)] bg-[var(--sd-card-solid)] text-[var(--sd-muted)]'
              }`}
            >
              <span aria-hidden="true" className="mr-1.5">{mood.emoji}</span>
              {mood.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
