// src/components/diary/DiaryMonthMemoSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export interface DiaryMonthMemoSheetProps {
  open: boolean;
  dateLabel: string;
  value: string;
  onSave: (text: string) => void;
  onClose: () => void;
}

export function DiaryMonthMemoSheet({
  open,
  dateLabel,
  value,
  onSave,
  onClose,
}: DiaryMonthMemoSheetProps): React.JSX.Element | null {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (open) setText(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(text.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25">
      <div
        className="w-full max-w-md bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl p-5 flex flex-col space-y-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--sd-line)]">
          <span className="font-['Dongle'] text-2xl text-[var(--sd-ink)] font-normal">
            {dateLabel} 한 줄 메모
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              maxLength={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="7자 이내 메모"
              autoFocus
              className="w-full min-h-[44px] px-3.5 pr-12 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--sd-faint)]">
              {text.length}/7
            </span>
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-[var(--sd-ink)] text-white text-sm font-medium flex items-center justify-center gap-1 active:opacity-90"
          >
            <Check className="w-4 h-4" />
            넣기
          </button>
        </form>
      </div>
    </div>
  );
}
