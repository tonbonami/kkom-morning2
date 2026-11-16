// src/components/diary/DiaryMaterialTray.tsx
'use client';

import React from 'react';
import { DiaryMaterialVM } from '@/lib/diaryTypes';
import { Sparkles, MessageCircleHeart } from 'lucide-react';

export interface DiaryMaterialTrayProps {
  materials: DiaryMaterialVM[];
  onAdd: (m: DiaryMaterialVM) => void;
}

export function DiaryMaterialTray({ materials, onAdd }: DiaryMaterialTrayProps): React.JSX.Element | null {
  if (!materials || materials.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto py-1 px-1">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-[var(--sd-faint)] whitespace-nowrap pl-1">
          오늘의 재료
        </span>
        {materials.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onAdd(m)}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-sm text-xs text-[var(--sd-ink)] active:scale-95 whitespace-nowrap"
          >
            {m.thumbSrc ? (
              <img
                src={m.thumbSrc}
                alt=""
                className="w-5 h-5 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : m.kind === 'prompt' ? (
              <MessageCircleHeart className="w-3.5 h-3.5 text-[var(--sd-rel)]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[var(--sd-rel)]" />
            )}
            <span className="truncate max-w-[150px]">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
