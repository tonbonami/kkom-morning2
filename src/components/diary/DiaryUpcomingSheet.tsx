// src/components/diary/DiaryUpcomingSheet.tsx
'use client';

import React, { useEffect } from 'react';
import { X, Cake } from 'lucide-react';
import type { UpcomingItemVM } from '@/lib/diaryTypes';
import { EVENT_OWNER_STYLE } from './DiaryEventStyle';

export interface DiaryUpcomingSheetProps {
  open: boolean;
  items: UpcomingItemVM[];
  onOpenItem: (item: UpcomingItemVM) => void;
  onClose: () => void;
}

export function DiaryUpcomingSheet({
  open,
  items,
  onOpenItem,
  onClose,
}: DiaryUpcomingSheetProps): React.JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/25"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="p-5 pb-3 border-b border-[var(--sd-line)] flex items-center justify-between">
          <span className="font-['Dongle'] text-3xl text-[var(--sd-ink)] leading-none">
            다가와요
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-1.5">
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--sd-faint)]">
              보름 안에 다가오는 일이 없어요
            </div>
          ) : (
            items.map((item) => {
              const dotColor =
                item.kind === 'event' && item.owner
                  ? EVENT_OWNER_STYLE[item.owner].dot
                  : 'var(--sd-ink)';

              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  onClick={() => onOpenItem(item)}
                  className="w-full min-h-[44px] py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 text-left active:bg-[var(--sd-surface-2)] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {item.kind === 'event' ? (
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                    ) : (
                      <Cake className="w-4 h-4 text-[var(--sd-rel)] flex-shrink-0" />
                    )}
                    <span className="text-xs font-bold text-[var(--sd-ink)] flex-shrink-0">
                      {item.whenLabel}
                    </span>
                    <span className="text-xs text-[var(--sd-ink)] truncate">{item.title}</span>
                  </div>
                  <div className="text-[11px] text-[var(--sd-muted)] flex-shrink-0">
                    {item.dateLabel}
                    {item.timeLabel ? ` ${item.timeLabel}` : ''}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
