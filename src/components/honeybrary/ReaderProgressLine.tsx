// src/components/honeybrary/ReaderProgressLine.tsx
'use client';

import React from 'react';
import { progressView, type ReadingVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface ReaderProgressLineProps {
  name: string;
  reading: ReadingVM;
  compact?: boolean;
}

export function ReaderProgressLine({
  name,
  reading,
  compact = false,
}: ReaderProgressLineProps) {
  const v = progressView(reading);

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className={`${compact ? 'text-[11.5px]' : 'text-[12.5px]'} font-bold shrink-0`}
        style={{ color: HONEY.muted }}
      >
        {name}
      </span>
      <span className="text-[11px] shrink-0" style={{ color: HONEY.line }}>
        ·
      </span>
      <span
        className={`${compact ? 'text-[11.5px]' : 'text-[12.5px]'} tabular-nums shrink-0`}
        style={{ color: HONEY.faint }}
      >
        {v.label}
      </span>
      {v.kind === 'bar' && (
        <span
          className="flex-1 min-w-[36px] h-[5px] rounded-full overflow-hidden"
          style={{ background: HONEY.barTrack }}
          role="progressbar"
          aria-valuenow={v.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} ${v.label}`}
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.max(3, v.pct)}%`, background: HONEY.bar }}
          />
        </span>
      )}
    </div>
  );
}
