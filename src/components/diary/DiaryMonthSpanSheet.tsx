// src/components/diary/DiaryMonthSpanSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, CalendarPlus } from 'lucide-react';
import { DiaryDecor } from './DiaryDecor';

export interface DiaryMonthSpanSheetProps {
  open: boolean;
  rangeLabel: string;
  value: { label: string; decorId: string };
  tapeIds: string[];
  canDelete?: boolean;
  onSave: (v: { label: string; decorId: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
  /** 이 띠를 진짜 일정으로(알림·다가오는 일정에 나오게). 우댕 2026-11-18 「장식띠로 꾸며서 일정 적은것은 일정으로 기억 못하는거야?」 */
  onMakeEvent?: (v: { label: string; decorId: string }) => void;
}

export function DiaryMonthSpanSheet({
  open,
  rangeLabel,
  value,
  tapeIds,
  canDelete = false,
  onSave,
  onDelete,
  onClose,
  onMakeEvent,
}: DiaryMonthSpanSheetProps): React.JSX.Element | null {
  const [label, setLabel] = useState(value.label);
  const [decorId, setDecorId] = useState(value.decorId || tapeIds[0] || 'tape-honey');

  useEffect(() => {
    if (open) {
      setLabel(value.label);
      setDecorId(value.decorId || tapeIds[0] || 'tape-honey');
    }
  }, [open, value, tapeIds]);

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
    if (!label.trim()) return;
    onSave({ label: label.trim(), decorId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25">
      <div
        className="w-full max-w-md bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl p-5 flex flex-col space-y-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--sd-line)]">
          <div className="flex flex-col">
            <span className="font-['Dongle'] text-2xl text-[var(--sd-ink)] font-normal leading-tight">
              기간 테이프 붙이기
            </span>
            <span className="text-xs text-[var(--sd-muted)]">{rangeLabel}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-[var(--sd-ink)]">테이프 이름</span>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="최대 6자 (예: 제주 여행)"
                autoFocus
                className="w-full min-h-[44px] px-3.5 pr-12 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--sd-faint)]">
                {label.length}/6
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[var(--sd-ink)]">테이프 무늬</span>
            <div className="flex gap-2 overflow-x-auto py-1">
              {tapeIds.map((tid) => (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setDecorId(tid)}
                  className={`w-16 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-transform active:scale-95 ${
                    decorId === tid
                      ? 'border-[var(--sd-rel)] scale-105'
                      : 'border-[var(--sd-line)]'
                  }`}
                >
                  <DiaryDecor decorId={tid} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="min-h-[44px] px-4 rounded-xl border border-[color:color-mix(in_srgb,var(--sd-crit)_40%,transparent)] text-[var(--sd-crit)] text-xs font-medium flex items-center justify-center gap-1 active:bg-[color:color-mix(in_srgb,var(--sd-crit)_10%,transparent)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                띠 떼기
              </button>
            )}
            <button
              type="submit"
              disabled={!label.trim()}
              className="flex-1 min-h-[44px] rounded-xl bg-[var(--sd-ink)] text-white text-sm font-medium flex items-center justify-center gap-1 active:opacity-90 disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              {canDelete ? '장식으로 두기' : '장식으로 붙이기'}
            </button>
          </div>

          {onMakeEvent && (
            <button
              type="button"
              onClick={() => onMakeEvent({ label: label.trim(), decorId })}
              className="w-full min-h-[44px] rounded-xl border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-sm font-medium text-[var(--sd-ink)] flex flex-col items-center justify-center py-1.5 active:opacity-80"
            >
              <span className="flex items-center gap-1">
                <CalendarPlus className="w-4 h-4" />
                {canDelete ? '일정으로 바꾸기' : '일정으로 넣기'}
              </span>
              <span className="text-[11px] font-normal text-[var(--sd-muted)]">일정이 되면 알림·다가오는 일정에도 나와요</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
