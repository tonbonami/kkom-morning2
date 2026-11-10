// src/components/honeybrary/BookVisibilityBadge.tsx
'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { HONEY } from '@/lib/honeybraryTheme';

export interface BookVisibilityBadgeProps {
  compact?: boolean;
}

export function BookVisibilityBadge({ compact = false }: BookVisibilityBadgeProps) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium shrink-0 leading-none"
        style={{ background: 'var(--sd-surface-2)', color: HONEY.faint }}
      >
        <Lock size={11} />
        <span>혼자</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium shrink-0 leading-none"
      style={{ background: 'var(--sd-surface-2)', color: HONEY.muted }}
    >
      <Lock size={13} />
      <span>혼자 보는 책</span>
    </span>
  );
}
