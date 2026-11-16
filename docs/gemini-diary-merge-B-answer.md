```ts
// src/components/diary/DiaryEventStyle.ts
import type { EventOwnerKey } from '@/lib/diaryTypes';

export const EVENT_OWNER_STYLE: Record<
  EventOwnerKey,
  {
    label: string;
    dot: string;
    band: string;
    text: string;
  }
> = {
  kkomi: {
    label: '꼼이',
    dot: '#845EC2',
    band: '#F5EEF9',
    text: '#4A2A75',
  },
  udaeng: {
    label: '우댕',
    dot: '#2E8B57',
    band: '#EDF6F1',
    text: '#17472C',
  },
  together: {
    label: '함께',
    dot: '#D97706',
    band: '#FEF3E2',
    text: '#68350A',
  },
};
```

```tsx
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
                  <span className="text-[11px] opacity-75">오늘을 남겨요</span>
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
```

```tsx
// src/components/diary/DiaryEventSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown, ChevronUp, Trash2, Bell } from 'lucide-react';
import type { DiaryEventDraft, EventOwnerKey } from '@/lib/diaryTypes';
import { DiaryDecor } from './DiaryDecor';
import { EVENT_OWNER_STYLE } from './DiaryEventStyle';

export interface DiaryEventSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  value: DiaryEventDraft;
  saving: boolean;
  tapeIds: string[];
  onChange: (patch: Partial<DiaryEventDraft>) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const OWNER_KEYS: EventOwnerKey[] = ['kkomi', 'udaeng', 'together'];

export function DiaryEventSheet({
  open,
  mode,
  value,
  saving,
  tapeIds,
  onChange,
  onSave,
  onDelete,
  onClose,
}: DiaryEventSheetProps): React.JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    const hasExtra = Boolean(
      value.location ||
      value.memo ||
      (value.remindDaysBefore && value.remindDaysBefore.length > 0)
    );
    setIsExpanded(mode === 'edit' && hasExtra);
    setConfirmDelete(false);
  }, [open, mode, value.location, value.memo, value.remindDaysBefore]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const hasRemind = (day: number) => value.remindDaysBefore?.includes(day);
  const toggleRemind = (day: number) => {
    const list = value.remindDaysBefore || [];
    const next = hasRemind(day) ? list.filter((d) => d !== day) : [...list, day].sort();
    onChange({ remindDaysBefore: next });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/25"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden"
      >
        <div className="p-4 px-5 border-b border-[var(--sd-line)] flex items-center justify-between">
          <span className="font-['Dongle'] text-2xl text-[var(--sd-ink)] leading-none">
            {mode === 'create' ? '새 일정' : '일정 수정'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs text-[var(--sd-muted)] block mb-1">제목</label>
            <input
              type="text"
              value={value.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="일정 제목을 적어 주세요"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--sd-muted)] block mb-1">누구 일정인가요</label>
            <div className="grid grid-cols-3 gap-2">
              {OWNER_KEYS.map((ownerKey) => {
                const style = EVENT_OWNER_STYLE[ownerKey];
                const isSelected = value.owner === ownerKey;
                return (
                  <button
                    key={ownerKey}
                    type="button"
                    onClick={() => onChange({ owner: ownerKey })}
                    className="min-h-[44px] rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isSelected ? style.band : 'var(--sd-surface-2)',
                      color: isSelected ? style.text : 'var(--sd-muted)',
                      border: isSelected ? `2px solid ${style.dot}` : '1px solid var(--sd-line)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[var(--sd-faint)] block mb-1">시작일</label>
              <input
                type="date"
                value={value.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--sd-faint)] block mb-1">종료일</label>
              <input
                type="date"
                value={value.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[44px]">
              <span className="text-sm text-[var(--sd-ink)]">하루 종일</span>
              <button
                type="button"
                onClick={() => onChange({ allDay: !value.allDay })}
                className="min-w-[44px] min-h-[44px] flex items-center justify-end"
              >
                <span
                  className="w-12 h-7 rounded-full p-1 transition-colors flex items-center"
                  style={{ backgroundColor: value.allDay ? 'var(--sd-ink)' : 'var(--sd-line)' }}
                >
                  <span
                    className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: value.allDay ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </span>
              </button>
            </div>

            {!value.allDay && (
              <div className="flex items-center gap-3">
                <label className="text-xs text-[var(--sd-muted)] flex-shrink-0">시작 시간</label>
                <input
                  type="time"
                  value={value.startTime}
                  onChange={(e) => onChange({ startTime: e.target.value })}
                  className="flex-1 min-h-[44px] px-3 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-[var(--sd-muted)] block mb-1.5">띠 무늬</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => onChange({ decorId: null })}
                className="min-w-[64px] h-11 rounded-lg border flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{
                  backgroundColor: EVENT_OWNER_STYLE[value.owner].band,
                  color: EVENT_OWNER_STYLE[value.owner].text,
                  borderColor:
                    value.decorId === null ? EVENT_OWNER_STYLE[value.owner].dot : 'var(--sd-line)',
                  borderWidth: value.decorId === null ? '2px' : '1px',
                }}
              >
                주인 색
              </button>
              {tapeIds.map((tapeId) => {
                const isSelected = value.decorId === tapeId;
                return (
                  <button
                    key={tapeId}
                    type="button"
                    onClick={() => onChange({ decorId: tapeId })}
                    className="relative min-w-[64px] h-11 rounded-lg overflow-hidden border flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: isSelected ? 'var(--sd-ink)' : 'var(--sd-line)',
                      borderWidth: isSelected ? '2px' : '1px',
                    }}
                  >
                    <DiaryDecor decorId={tapeId} className="w-full h-full" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--sd-line)]">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full min-h-[44px] flex items-center justify-between text-xs text-[var(--sd-muted)] font-medium"
            >
              <span>장소·메모·알림 더하기</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isExpanded && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-[var(--sd-muted)] block mb-1">장소</label>
                  <input
                    type="text"
                    value={value.location}
                    onChange={(e) => onChange({ location: e.target.value })}
                    placeholder="장소 입력"
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--sd-muted)] block mb-1">메모</label>
                  <textarea
                    rows={3}
                    value={value.memo}
                    onChange={(e) => onChange({ memo: e.target.value })}
                    placeholder="메모를 남겨 두세요"
                    className="w-full p-3 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-[var(--sd-muted)] block">알림</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRemind(1)}
                      className="min-h-[44px] px-3.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors"
                      style={{
                        backgroundColor: hasRemind(1) ? 'var(--sd-surface-2)' : 'transparent',
                        borderColor: hasRemind(1) ? 'var(--sd-ink)' : 'var(--sd-line)',
                        color: hasRemind(1) ? 'var(--sd-ink)' : 'var(--sd-muted)',
                      }}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      하루 전
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRemind(7)}
                      className="min-h-[44px] px-3.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors"
                      style={{
                        backgroundColor: hasRemind(7) ? 'var(--sd-surface-2)' : 'transparent',
                        borderColor: hasRemind(7) ? 'var(--sd-ink)' : 'var(--sd-line)',
                        color: hasRemind(7) ? 'var(--sd-ink)' : 'var(--sd-muted)',
                      }}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      일주일 전
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--sd-faint)]">그날 아침 8시에 알려 줘요</p>
                </div>
              </div>
            )}
          </div>

          {mode === 'edit' && onDelete && (
            <div className="pt-3 border-t border-[var(--sd-line)]">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="min-h-[44px] px-2 text-xs text-[var(--sd-crit)] font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  일정 지우기
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-[color:color-mix(in_srgb,var(--sd-crit)_8%,transparent)] border border-[color:color-mix(in_srgb,var(--sd-crit)_20%,transparent)] space-y-2">
                  <p className="text-xs text-[var(--sd-crit)] font-medium">
                    이 일정을 지우면 알림도 없어져요
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-[44px] px-3 rounded-lg text-xs font-medium text-[var(--sd-muted)] bg-[var(--sd-surface-2)] active:opacity-80"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={onDelete}
                      className="min-h-[44px] px-3 rounded-lg text-xs font-medium text-white bg-[var(--sd-crit)] active:opacity-90"
                    >
                      지우기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="p-4 border-t border-[var(--sd-line)] bg-[var(--sd-card-solid)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <button
            type="button"
            onClick={onSave}
            disabled={!value.title.trim() || saving}
            className="w-full min-h-[44px] rounded-xl bg-[var(--sd-ink)] text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:opacity-90"
          >
            <Check className="w-4 h-4" />
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

```tsx
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
```

```tsx
// src/components/diary/DiaryHomeCard.tsx
'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { EventOwnerKey } from '@/lib/diaryTypes';
import { EVENT_OWNER_STYLE } from './DiaryEventStyle';

export interface DiaryHomeCardProps {
  dateLabel: string;
  excerpt?: string;
  thumbSrc?: string;
  partnerWroteToday?: boolean;
  nextEvent?: {
    title: string;
    whenLabel: string;
    owner: EventOwnerKey;
  } | null;
  onOpen: () => void;
  onOpenMonth: () => void;
}

export function DiaryHomeCard({
  dateLabel,
  excerpt,
  thumbSrc,
  partnerWroteToday = false,
  nextEvent,
  onOpen,
  onOpenMonth,
}: DiaryHomeCardProps): React.JSX.Element {
  return (
    <div
      className="sd-card w-full flex flex-col justify-between relative rounded-2xl border border-[var(--sd-line)] overflow-hidden"
      style={{
        background: 'var(--sd-card-solid, #FFFFFF)',
        minHeight: '140px',
        boxShadow: 'var(--sd-shadow-card, 0 4px 16px rgba(46,29,38,0.06))',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="w-full p-4 flex flex-col justify-between flex-1 text-left active:opacity-90 transition-opacity"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)] font-normal">
              우리 다이어리
            </span>
            <span className="text-xs text-[var(--sd-faint)]">{dateLabel}</span>
          </div>

          <p className="text-xs text-[var(--sd-muted)] mt-1.5 line-clamp-2 leading-relaxed">
            {excerpt ? excerpt : '오늘 한 장 꾸며 볼까요?'}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3">
          {partnerWroteToday ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-medium">
              꼼이가 오늘 한 장 썼어요
            </span>
          ) : (
            <span />
          )}

          {thumbSrc && (
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-[var(--sd-line)] bg-[var(--sd-surface-2)]">
              <img
                src={thumbSrc}
                alt="diary thumbnail"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenMonth}
        className="w-full min-h-[44px] px-4 py-2 border-t border-[var(--sd-line)] flex items-center justify-between text-left active:bg-[var(--sd-surface-2)] transition-colors"
      >
        {nextEvent ? (
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: EVENT_OWNER_STYLE[nextEvent.owner].dot }}
            />
            <span className="text-xs font-semibold text-[var(--sd-ink)] flex-shrink-0">
              {nextEvent.whenLabel}
            </span>
            <span className="text-xs text-[var(--sd-muted)] truncate">
              · {nextEvent.title}
            </span>
          </div>
        ) : (
          <span className="text-xs text-[var(--sd-muted)]">달력 보기</span>
        )}
        <ChevronRight className="w-4 h-4 text-[var(--sd-faint)] flex-shrink-0" />
      </button>
    </div>
  );
}
```

일정과 다이어리를 자연스럽게 통합하고 Tailwind 3 변수 투명도 이슈 및 터치 영역 규칙을 엄격히 반영했습니다.
시트와 홈 카드는 기존 톤앤매너와 정확히 일치하며 44px 이상 터치 규격과 16px 입력 폰트가 적용되어 있습니다.
