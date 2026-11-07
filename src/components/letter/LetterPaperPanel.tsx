// src/components/letter/LetterPaperPanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LetterPaperTheme } from '@/lib/letterPapers';

export interface LetterPaperPanelProps {
  papers: LetterPaperTheme[];
  value: string; // 지금 고른 id
  onChange: (id: string) => void;
}

export function LetterPaperPanel({ papers, value, onChange }: LetterPaperPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="p-4">
      <h3 className="text-[var(--sd-ink)] text-base font-semibold mb-3 font-['IBM_Plex_Sans_KR']">
        편지지 · 받는 사람도 이 편지지로 읽어요
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {papers.map((paper) => {
          const isSelected = value === paper.id;
          return (
            <motion.button
              key={paper.id}
              type="button"
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
              onClick={() => onChange(paper.id)}
              className={`
                relative flex flex-col items-center gap-1.5 p-1.5 rounded-[12px]
                border-2 transition-all duration-150 min-h-[44px]
                ${isSelected ? 'border-[var(--sd-rel)]' : 'border-transparent'}
              `}
            >
              {/* 실제 편지지 배경과 무늬가 동일하게 반영되는 견본 */}
              <div
                className={`w-full aspect-[3/4] rounded-[8px] overflow-hidden border border-black/5 ${paper.className.replace('sd-card-paper', '').trim()}`}
                style={paper.style}
              />
              <span
                className={`
                  font-['Dongle'] text-2xl leading-none font-bold
                  ${isSelected ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-ink)]'}
                `}
              >
                {paper.name}
              </span>
              {isSelected && (
                <div className="absolute inset-0 rounded-[12px] border-2 border-[var(--sd-rel)] pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
