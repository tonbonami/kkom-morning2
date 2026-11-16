// src/components/diary/DiaryDayAgendaSheet.tsx
'use client';

import React, { useEffect } from 'react';
import { X, CalendarPlus, Bell, MapPin, Sparkles } from 'lucide-react';
import type { DiaryEventVM, MonthSpecialVM, Person } from '@/lib/diaryTypes';
import { EVENT_OWNER_STYLE } from './DiaryEventStyle';

export interface DiaryDayAgendaSheetProps {
  open: boolean;
  dateLabel: string;
  holiday?: string | null;
  specials: MonthSpecialVM[];
  events: DiaryEventVM[];
  me: Person;
  pages: Record<Person, { has: boolean; excerpt?: string; thumbSrc?: string }>;
  onAddEvent: () => void;
  onOpenEvent: (id: string) => void;
  onOpenPage: (owner: Person) => void;
  onClose: () => void;
}

export function DiaryDayAgendaSheet({
  open,
  dateLabel,
  holiday,
  specials,
  events,
  me,
  pages,
  onAddEvent,
  onOpenEvent,
  onOpenPage,
  onClose,
}: DiaryDayAgendaSheetProps): React.JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const partner: Person = me === '우댕' ? '꼼이' : '우댕';
  const myPage = pages[me];
  const partnerPage = pages[partner];

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
        <div className="p-5 pb-3 border-b border-[var(--sd-line)] flex items-start justify-between">
          <div>
            <span className="font-['Dongle'] text-3xl text-[var(--sd-ink)] leading-none block">
              {dateLabel}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {holiday && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-[var(--sd-crit)] bg-[color:color-mix(in_srgb,var(--sd-crit)_12%,transparent)]">
                  {holiday}
                </span>
              )}
              {specials.map((s) => (
                <span
                  key={s.id}
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-[var(--sd-rel)] bg-[var(--sd-rel-soft)]"
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--sd-faint)]">일정</h4>
            {events.length === 0 ? (
              <div className="py-5 text-center text-xs text-[var(--sd-faint)] bg-[var(--sd-surface-2)] rounded-xl">
                일정이 없는 날이에요
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => {
                  const style = EVENT_OWNER_STYLE[ev.owner];
                  const isMultiDay = ev.startDate !== ev.endDate;
                  const timeText = ev.allDay ? '하루 종일' : (ev.startTime || '시간 미지정');
                  const rangeText = isMultiDay
                    ? `${ev.startDate.slice(5).replace('-', '.')} ~ ${ev.endDate.slice(5).replace('-', '.')}`
                    : '';

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onOpenEvent(ev.id)}
                      className="w-full min-h-[44px] p-3 rounded-xl bg-[var(--sd-surface-2)] flex items-center gap-3 text-left active:opacity-85 transition-opacity"
                    >
                      <span
                        className="w-1.5 self-stretch rounded-full flex-shrink-0"
                        style={{ backgroundColor: style.dot }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--sd-ink)] truncate">
                          {ev.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--sd-muted)]">
                          <span>{rangeText ? `${rangeText} · ${timeText}` : timeText}</span>
                          {ev.location && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="w-3 h-3 text-[var(--sd-faint)] flex-shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {ev.remindDaysBefore && ev.remindDaysBefore.length > 0 && (
                        <Bell className="w-4 h-4 text-[var(--sd-faint)] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={onAddEvent}
              className="w-full min-h-[44px] rounded-xl border border-dashed border-[var(--sd-line)] text-xs text-[var(--sd-muted)] font-medium flex items-center justify-center gap-1.5 active:bg-[var(--sd-surface-2)]"
            >
              <CalendarPlus className="w-4 h-4" />
              일정 추가
            </button>
          </section>

          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--sd-faint)]">하루 장</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {myPage.has ? (
                <button
                  type="button"
                  onClick={() => onOpenPage(me)}
                  className="min-h-[110px] p-3 rounded-2xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] flex flex-col justify-between text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-[var(--sd-ink)]">내 하루 장</span>
                    <span className="text-[11px] text-[var(--sd-faint)]">열기 ›</span>
                  </div>
                  {myPage.thumbSrc ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--sd-line)] bg-white my-1">
                      <img
                        src={myPage.thumbSrc}
                        alt="내 일기"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--sd-muted)] line-clamp-2 my-1">
                      {myPage.excerpt || '기록한 이야기'}
                    </p>
                  )}
                  <span className="text-[11px] text-[var(--sd-muted)]">작성 완료</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenPage(me)}
                  className="min-h-[110px] p-3 rounded-2xl bg-[var(--sd-ink)] text-white flex flex-col items-center justify-center text-center gap-1.5 active:opacity-90 transition-opacity shadow-sm"
                >
                  <Sparkles className="w-5 h-5 text-amber-200" />
                  <span className="text-sm font-medium">한 장 꾸미기</span>
                  <span className="text-[11px] opacity-75">이 날을 남겨요</span>
                </button>
              )}

              {partnerPage.has ? (
                <button
                  type="button"
                  onClick={() => onOpenPage(partner)}
                  className="min-h-[110px] p-3 rounded-2xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] flex flex-col justify-between text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-[var(--sd-ink)]">{partner}의 장</span>
                    <span className="text-[11px] text-[var(--sd-faint)]">열기 ›</span>
                  </div>
                  {partnerPage.thumbSrc ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--sd-line)] bg-white my-1">
                      <img
                        src={partnerPage.thumbSrc}
                        alt={`${partner}의 일기`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--sd-muted)] line-clamp-2 my-1">
                      {partnerPage.excerpt || '기록한 이야기'}
                    </p>
                  )}
                  <span className="text-[11px] text-[var(--sd-rel)] font-medium">읽을 수 있어요</span>
                </button>
              ) : (
                <div className="min-h-[110px] p-3 rounded-2xl bg-[var(--sd-surface-2)] border border-dashed border-[var(--sd-line)] flex flex-col items-center justify-center text-center opacity-50 cursor-default select-none">
                  <span className="text-xs font-medium text-[var(--sd-faint)]">{partner}의 장</span>
                  <span className="text-xs text-[var(--sd-faint)] mt-1">아직 없어요</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
