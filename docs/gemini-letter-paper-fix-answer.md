```tsx
// src/lib/letterPapers.ts
import type React from 'react';

export interface LetterPaperTheme {
  id: string; // 저장되는 값 — 영어 소문자, 한 번 정하면 안 바꾼다(예: 'peach')
  name: string; // 고르는 칸에 보이는 짧은 한국어 이름
  className: string; // 호환용 클래스
  style: React.CSSProperties; // .sd-card 의 background 단축 속성을 확실히 이기는 인라인 배경 및 무늬
  ink: string; // 본문·To/From 글자색 (CSS 색 값)
  muted: string; // 날짜·흐린 글자색
  stamp: { bg: string; fg: string; border: string }; // From 날짜 도장 색 (실제 CSS 색 값)
}

export const DEFAULT_PAPER_ID = 'peach';

export const LETTER_PAPERS: LetterPaperTheme[] = [
  {
    id: 'peach',
    name: '살구',
    className: '!bg-[#F9E0D6] sd-card-paper',
    style: {
      backgroundColor: '#F9E0D6',
    },
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: {
      bg: 'var(--sd-rel-soft)',
      fg: 'var(--sd-rel)',
      border: 'rgba(228, 104, 94, 0.2)',
    },
  },
  {
    id: 'honeyjar',
    name: '꿀단지',
    className: '!bg-[#FCE7A6] sd-card-paper',
    style: {
      backgroundColor: '#FCE7A6',
      backgroundImage:
        'radial-gradient(circle, rgba(210, 135, 15, 0.18) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(210, 135, 15, 0.18) 1.5px, transparent 1.5px)',
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px',
    },
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: {
      bg: 'var(--sd-rel-soft)',
      fg: 'var(--sd-rel)',
      border: 'rgba(228, 104, 94, 0.2)',
    },
  },
  {
    id: 'pawprint',
    name: '꼼이발자국',
    className: '!bg-[#FAD5DF] sd-card-paper',
    style: {
      backgroundColor: '#FAD5DF',
      backgroundImage:
        'radial-gradient(circle 4.5px at 16px 19px, rgba(215, 80, 120, 0.22) 99%, transparent 100%), ' +
        'radial-gradient(circle 2px at 11px 12px, rgba(215, 80, 120, 0.22) 99%, transparent 100%), ' +
        'radial-gradient(circle 2.2px at 16px 9px, rgba(215, 80, 120, 0.22) 99%, transparent 100%), ' +
        'radial-gradient(circle 2px at 21px 12px, rgba(215, 80, 120, 0.22) 99%, transparent 100%)',
      backgroundSize: '32px 32px',
    },
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: {
      bg: 'var(--sd-rel-soft)',
      fg: 'var(--sd-rel)',
      border: 'rgba(228, 104, 94, 0.2)',
    },
  },
  {
    id: 'clearsky',
    name: '맑은하늘',
    className: '!bg-[#D4E7F7] sd-card-paper',
    style: {
      backgroundColor: '#D4E7F7',
      backgroundImage:
        'radial-gradient(circle, rgba(70, 130, 200, 0.18) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(70, 130, 200, 0.18) 1.5px, transparent 1.5px)',
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px',
    },
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: {
      bg: 'var(--sd-rel-soft)',
      fg: 'var(--sd-rel)',
      border: 'rgba(228, 104, 94, 0.2)',
    },
  },
  {
    id: 'rulednote',
    name: '줄노트',
    className: '!bg-[#DCEEE2] sd-card-paper',
    style: {
      backgroundColor: '#DCEEE2',
      backgroundImage:
        'repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(70, 130, 95, 0.18) 27px, rgba(70, 130, 95, 0.18) 28px)',
    },
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: {
      bg: 'var(--sd-rel-soft)',
      fg: 'var(--sd-rel)',
      border: 'rgba(228, 104, 94, 0.2)',
    },
  },
  {
    id: 'checker',
    name: '체크',
    className: '!bg-[#F9DDD1] sd-card-paper',
    style: {
      backgroundColor: '#F9DDD1',
      backgroundImage:
        'linear-gradient(90deg, rgba(215, 110, 90, 0.12) 50%, transparent 50%), linear-gradient(rgba(215, 110, 90, 0.12) 50%, transparent 50%)',
      backgroundSize: '24px 24px',
    },
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: {
      bg: 'var(--sd-rel-soft)',
      fg: 'var(--sd-rel)',
      border: 'rgba(228, 104, 94, 0.2)',
    },
  },
];

export function paperById(id?: string | null): LetterPaperTheme {
  return LETTER_PAPERS.find((paper) => paper.id === id) || LETTER_PAPERS[0];
}
```

```tsx
// src/components/letter/LetterPaperPanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LetterPaperTheme } from '@/lib/letterPapers';
import { Check } from 'lucide-react';

export interface LetterPaperPanelProps {
  papers: LetterPaperTheme[];
  value: string; // 지금 고른 id
  onChange: (id: string) => void;
}

export function LetterPaperPanel({ papers, value, onChange }: LetterPaperPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[var(--sd-ink)]
