// src/components/diary/DiarySpecialDatesSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CalendarHeart, Cake, Heart, Star } from 'lucide-react';
import {
  Person,
  SpecialDateVM,
  DiaryAssetVM,
  MonthStickerVM,
} from '@/lib/diaryTypes';
import { DiaryDecor } from './DiaryDecor';

export interface DiarySpecialDatesSheetProps {
  open: boolean;
  items: SpecialDateVM[];
  busy?: boolean;
  stickerAssets: DiaryAssetVM[];
  onAdd: (v: Omit<SpecialDateVM, 'id'>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function DiarySpecialDatesSheet({
  open,
  items,
  busy = false,
  stickerAssets,
  onAdd,
  onDelete,
  onClose,
}: DiarySpecialDatesSheetProps): React.JSX.Element | null {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<'birthday' | 'anniversary' | 'custom'>('anniversary');
  const [month, setMonth] = useState('01');
  const [day, setDay] = useState('01');
  const [startYear, setStartYear] = useState('');
  const [owner, setOwner] = useState<Person | 'together'>('together');
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

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

    let sticker: MonthStickerVM | undefined = undefined;
    if (selectedStickerId) {
      const asset = stickerAssets.find((a) => a.id === selectedStickerId);
      if (asset) {
        sticker = {
          id: `special-stk-${Date.now()}`,
          src: asset.src,
          decorId: asset.decorId,
        };
      }
    }

    onAdd({
      label: label.trim(),
      kind,
      monthDay: `${month}-${day}`,
      startYear: startYear ? parseInt(startYear, 10) : undefined,
      owner,
      sticker,
    });

    setLabel('');
    setStartYear('');
    setSelectedStickerId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25">
      <div
        className="w-full max-w-md max-h-[85vh] bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--sd-line)]">
          <div className="flex items-center gap-1.5">
            <CalendarHeart className="w-5 h-5 text-[var(--sd-rel)]" />
            <span className="font-['Dongle'] text-3xl text-[var(--sd-ink)] font-normal">
              생일과 기념일
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--sd-card-solid)] border border-[color:color-mix(in_srgb,var(--sd-line)_50%,transparent)] flex items-center justify-center shrink-0 overflow-hidden">
                    {item.sticker ? (
                      item.sticker.src ? (
                        <img
                          src={item.sticker.src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        item.sticker.decorId && (
                          <DiaryDecor decorId={item.sticker.decorId} className="w-full h-full" />
                        )
                      )
                    ) : item.kind === 'birthday' ? (
                      <Cake className="w-4 h-4 text-[var(--sd-rel)]" />
                    ) : item.kind === 'anniversary' ? (
                      <Heart className="w-4 h-4 text-[var(--sd-rel)] fill-current" />
                    ) : (
                      <Star className="w-4 h-4 text-[var(--sd-rel)]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-[var(--sd-ink)]">{item.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--sd-card-solid)] text-[var(--sd-muted)]">
                        {item.owner === 'together' ? '같이' : item.owner}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--sd-muted)] mt-0.5">
                      매년 {item.monthDay.replace('-', '월 ')}일
                      {item.startYear ? ` (${item.startYear}년부터)` : ''}
                    </p>
                  </div>
                </div>

                {deletingId === item.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDelete(item.id)}
                      className="min-h-[44px] px-3 rounded-xl bg-[var(--sd-crit)] text-white text-xs font-medium"
                    >
                      지우기
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="min-h-[44px] px-2 rounded-xl bg-[var(--sd-card-solid)] text-[var(--sd-muted)] text-xs"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingId(item.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-faint)] active:text-[var(--sd-crit)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-[var(--sd-line)] space-y-3">
            <span className="text-xs font-medium text-[var(--sd-ink)]">새 기념일 추가</span>

            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="기념일 이름 (예: 100일, 우댕 생일)"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
            />

            <div className="flex gap-2">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="flex-1 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              >
                <option value="anniversary">기념일</option>
                <option value="birthday">생일</option>
                <option value="custom">그 밖</option>
              </select>

              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value as any)}
                className="flex-1 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              >
                <option value="together">같이</option>
                <option value="우댕">우댕</option>
                <option value="꼼이">꼼이</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex-1 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                  <option key={m} value={m}>{Number(m)}월</option>
                ))}
              </select>

              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="flex-1 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                  <option key={d} value={d}>{Number(d)}일</option>
                ))}
              </select>

              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                placeholder="시작 연도"
                className="w-24 min-h-[44px] px-2 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--sd-ink)]">전용 스티커</span>
                <span className="text-[10px] text-[var(--sd-faint)]">매년 이 날 달력 칸에 붙어요</span>
              </div>
              <div className="flex gap-2 overflow-x-auto py-1">
                <button
                  type="button"
                  onClick={() => setSelectedStickerId(null)}
                  className={`w-11 h-11 rounded-xl shrink-0 border flex items-center justify-center text-xs text-[var(--sd-muted)] active:scale-95 ${
                    selectedStickerId === null
                      ? 'border-[var(--sd-rel)] bg-[var(--sd-rel-soft)] font-medium'
                      : 'border-[var(--sd-line)] bg-[var(--sd-surface-2)]'
                  }`}
                >
                  없음
                </button>
                {stickerAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedStickerId(asset.id)}
                    className={`w-11 h-11 rounded-xl shrink-0 border overflow-hidden p-1 flex items-center justify-center active:scale-95 ${
                      selectedStickerId === asset.id
                        ? 'border-[var(--sd-rel)] bg-[var(--sd-rel-soft)]'
                        : 'border-[var(--sd-line)] bg-[var(--sd-surface-2)]'
                    }`}
                  >
                    {asset.src ? (
                      <img
                        src={asset.src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      asset.decorId && (
                        <DiaryDecor decorId={asset.decorId} className="w-full h-full" />
                      )
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !label.trim()}
              className="w-full min-h-[44px] rounded-xl bg-[var(--sd-rel)] text-white text-sm font-medium flex items-center justify-center gap-1 active:opacity-90 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              추가하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
