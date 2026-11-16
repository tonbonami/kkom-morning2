// src/components/diary/DiaryMonthSheet.tsx
'use client';

import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Cake, Heart, Sparkles } from 'lucide-react';
import { DiaryMonthDayVM } from '@/lib/diaryTypes';

export interface DiaryMonthSheetProps {
  open: boolean;
  monthLabel: string;
  days: DiaryMonthDayVM[];
  selectedDate: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPickDate: (date: string) => void;
  onClose: () => void;
}

export function DiaryMonthSheet({
  open,
  monthLabel,
  days,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onPickDate,
  onClose,
}: DiaryMonthSheetProps): React.JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const currentSpecial = days.find((d) => d.date === selectedDate)?.special;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25">
      <div
        className="w-full max-w-md bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl p-5 flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--sd-line)]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-['Dongle'] text-3xl text-[var(--sd-ink)] font-normal">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 요일 줄 */}
        <div className="grid grid-cols-7 gap-1 py-2 text-center text-xs text-[var(--sd-faint)]">
          <span>일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span>토</span>
        </div>

        {/* 42칸 달력 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const isSelected = d.date === selectedDate;

            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  onPickDate(d.date);
                  onClose();
                }}
                className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl p-1 relative active:scale-95 ${
                  isSelected
                    ? 'bg-[var(--sd-surface-2)] border border-[var(--sd-line)]'
                    : ''
                }`}
              >
                {/* 기념일 마크 */}
                {d.special && (
                  <span className="absolute top-1 text-[var(--sd-rel)]">
                    {d.special.includes('생일') ? (
                      <Cake className="w-2.5 h-2.5" />
                    ) : (
                      <Heart className="w-2.5 h-2.5 fill-current" />
                    )}
                  </span>
                )}

                {/* 날짜 숫자 */}
                <span
                  className={`text-xs ${
                    !d.inMonth
                      ? 'text-[var(--sd-faint)] opacity-40'
                      : d.holiday
                      ? 'text-[var(--sd-rel)] font-medium'
                      : d.isToday
                      ? 'text-[var(--sd-ink)] font-bold underline'
                      : 'text-[var(--sd-ink)]'
                  }`}
                >
                  {d.day}
                </span>

                {/* 작성 여부 점 (내 장: 진한 점 / 상대 장: 옅은 점) */}
                <div className="flex gap-0.5 mt-0.5 h-1">
                  {d.mine && <span className="w-1 h-1 rounded-full bg-[var(--sd-ink)]" />}
                  {d.partner && <span className="w-1 h-1 rounded-full bg-[var(--sd-line)]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택된 날의 기념일 정보 한 줄 */}
        {currentSpecial && (
          <div className="mt-3 py-2 px-3 rounded-xl bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] text-xs flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentSpecial}</span>
          </div>
        )}
      </div>
    </div>
  );
}
