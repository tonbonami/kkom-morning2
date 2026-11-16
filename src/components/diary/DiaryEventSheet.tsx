// src/components/diary/DiaryEventSheet.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  // 확인 줄이 아래 「저장」 단추 뒤로 반쯤 가려져 뜬다 → 뜨면 보이는 데까지 올린다
  const confirmRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (confirmDelete) confirmRef.current?.scrollIntoView({ block: 'nearest' }); }, [confirmDelete]);

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
            <div ref={confirmRef} className="pt-3 pb-2 border-t border-[var(--sd-line)]">
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
