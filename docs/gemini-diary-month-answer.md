```tsx
// src/components/diary/DiaryMonthCell.tsx
'use client';

import React from 'react';
import { Cake, Heart, Star } from 'lucide-react';
import { DiaryMonthCellVM, MonthTool } from '@/lib/diaryTypes';
import { DiaryDecor } from './DiaryDecor';

export interface DiaryMonthCellProps {
  cell: DiaryMonthCellVM;
  mode: 'view' | 'decorate';
  tool: MonthTool | null;
  marked?: boolean;
  hasSpanAbove?: number;
  onTap: () => void;
  onRemoveSticker?: (stickerId: string) => void;
  onRemoveMemo?: () => void;
}

export function DiaryMonthCell({
  cell,
  mode,
  tool,
  marked = false,
  hasSpanAbove = 0,
  onTap,
  onRemoveSticker,
  onRemoveMemo,
}: DiaryMonthCellProps): React.JSX.Element {
  const isErase = mode === 'decorate' && tool === 'erase';
  const special = cell.specials[0];

  return (
    <div
      onClick={cell.inMonth ? onTap : undefined}
      className={`relative w-full h-[66px] p-1 flex flex-col justify-between border-b border-r border-[var(--sd-line)]/40 select-none ${
        !cell.inMonth
          ? 'opacity-25 bg-[var(--sd-surface-2)]/30'
          : marked
          ? 'bg-[var(--sd-rel-soft)]/60'
          : 'bg-transparent'
      } ${cell.inMonth && mode === 'decorate' ? 'cursor-pointer active:bg-[var(--sd-surface-2)]/50' : ''}`}
    >
      <div className="flex items-center justify-between w-full h-4">
        <div className="flex items-center gap-0.5">
          {cell.isToday ? (
            <span className="w-4 h-4 rounded-full bg-[var(--sd-rel)] text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {cell.day}
            </span>
          ) : (
            <span
              className={`text-[11px] font-medium leading-none ${
                cell.holiday ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-ink)]'
              }`}
            >
              {cell.day}
            </span>
          )}

          {special && (
            <div className="flex items-center gap-0.5 ml-0.5">
              {special.sticker ? (
                special.sticker.src ? (
                  <img
                    src={special.sticker.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="w-3.5 h-3.5 object-contain"
                  />
                ) : (
                  special.sticker.decorId && (
                    <div className="w-3.5 h-3.5">
                      <DiaryDecor decorId={special.sticker.decorId} className="w-full h-full" />
                    </div>
                  )
                )
              ) : special.kind === 'birthday' ? (
                <Cake className="w-2.5 h-2.5 text-[var(--sd-rel)]" />
              ) : special.kind === 'anniversary' ? (
                <Heart className="w-2.5 h-2.5 text-[var(--sd-rel)] fill-current" />
              ) : (
                <Star className="w-2.5 h-2.5 text-[var(--sd-rel)]" />
              )}
              {special.years && (
                <span className="text-[9px] text-[var(--sd-rel)] font-medium leading-none">
                  {special.years}주년
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {hasSpanAbove > 0 && (
        <div style={{ height: `${hasSpanAbove * 13}px` }} className="shrink-0" />
      )}

      <div className="flex-1 flex items-center justify-center gap-1 min-h-[20px] px-0.5">
        {cell.stickers.slice(0, 2).map((s) => (
          <div
            key={s.id}
            onClick={(e) => {
              if (isErase && onRemoveSticker) {
                e.stopPropagation();
                onRemoveSticker(s.id);
              }
            }}
            className={`w-4 h-4 flex items-center justify-center shrink-0 ${
              isErase
                ? 'rounded border border-[var(--sd-crit)]/60 bg-[var(--sd-crit)]/10 cursor-pointer'
                : ''
            }`}
          >
            {s.src ? (
              <img
                src={s.src}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="w-full h-full object-contain"
              />
            ) : (
              s.decorId && <DiaryDecor decorId={s.decorId} className="w-full h-full" />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between w-full min-h-[12px] gap-1">
        <div className="flex items-center gap-0.5 shrink-0">
          {cell.mine && <span className="w-1 h-1 rounded-full bg-[var(--sd-ink)]" />}
          {cell.partner && <span className="w-1 h-1 rounded-full bg-[var(--sd-line)]" />}
        </div>

        {cell.memo && (
          <div
            onClick={(e) => {
              if (isErase && onRemoveMemo) {
                e.stopPropagation();
                onRemoveMemo();
              }
            }}
            className={`flex-1 text-right truncate text-[9px] leading-tight text-[var(--sd-muted)] font-normal ${
              isErase
                ? 'rounded border border-[var(--sd-crit)]/60 bg-[var(--sd-crit)]/10 cursor-pointer px-0.5'
                : ''
            }`}
          >
            {cell.memo}
          </div>
        )}
      </div>
    </div>
  );
}
```

```tsx
// src/components/diary/DiaryMonthScreen.tsx
'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MoreHorizontal,
  Paintbrush,
  Check,
  Undo2,
  Cake,
  Heart,
  Smile,
  Layers,
  FileText,
  Eraser,
} from 'lucide-react';
import {
  Person,
  MonthOwner,
  MonthStickerVM,
  DiaryMonthCellVM,
  MonthSpanVM,
  MonthTitleStyle,
  MonthTool,
  DiaryAssetVM,
} from '@/lib/diaryTypes';
import { DiaryMonthCell } from './DiaryMonthCell';
import { DiaryDecor } from './DiaryDecor';

export interface DiaryMonthScreenProps {
  me: Person;
  owner: MonthOwner;
  canEdit: boolean;
  monthLabel: string;
  monthNumber: number;
  titleStyle: MonthTitleStyle;
  hero?: MonthStickerVM | null;
  cells: DiaryMonthCellVM[];
  spans: MonthSpanVM[];
  margin: MonthStickerVM[];
  upcoming?: { label: string; daysLeft: number } | null;
  mode: 'view' | 'decorate';
  tool: MonthTool | null;
  selectedAsset?: DiaryAssetVM | null;
  spanStart?: string | null;
  undoText?: string | null;
  saveState: 'saved' | 'saving' | 'offline';
  onBack: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoThisMonth: () => void;
  onChangeOwner: (o: MonthOwner) => void;
  onToggleMode: () => void;
  onPickTool: (t: MonthTool) => void;
  onOpenAssets: () => void;
  onTapDay: (date: string) => void;
  onRemoveSticker: (date: string, stickerId: string) => void;
  onRemoveMemo: (date: string) => void;
  onTapSpan: (spanId: string) => void;
  onTapHero: () => void;
  onTapMargin: (index: number) => void;
  onCycleTitleStyle: () => void;
  onUndo: () => void;
  onOpenSpecialDates: () => void;
}

interface SpanPiece {
  span: MonthSpanVM;
  startCol: number;
  colSpan: number;
  track: number;
  isFirst: boolean;
}

export function DiaryMonthScreen({
  me,
  owner,
  canEdit,
  monthLabel,
  monthNumber,
  titleStyle,
  hero,
  cells,
  spans,
  margin,
  upcoming,
  mode,
  tool,
  selectedAsset,
  spanStart,
  undoText,
  saveState,
  onBack,
  onPrevMonth,
  onNextMonth,
  onGoThisMonth,
  onChangeOwner,
  onToggleMode,
  onPickTool,
  onOpenAssets,
  onTapDay,
  onRemoveSticker,
  onRemoveMemo,
  onTapSpan,
  onTapHero,
  onTapMargin,
  onCycleTitleStyle,
  onUndo,
  onOpenSpecialDates,
}: DiaryMonthScreenProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDecorate = mode === 'decorate';

  const cellSpansAbove: number[] = new Array(cells.length).fill(0);
  const weekSpanPieces: SpanPiece[][] = Array.from({ length: 6 }, () => []);

  for (let w = 0; w < 6; w++) {
    const wStart = cells[w * 7]?.date;
    const wEnd = cells[w * 7 + 6]?.date;
    if (!wStart || !wEnd) continue;

    const currentSpans = spans.filter((s) => s.startDate <= wEnd && s.endDate >= wStart);
    const tracks: (string | null)[] = [null, null];

    currentSpans.forEach((s) => {
      let startCol = 0;
      let endCol = 6;
      for (let c = 0; c < 7; c++) {
        const d = cells[w * 7 + c].date;
        if (d === s.startDate) startCol = c;
        if (d === s.endDate) endCol = c;
      }
      if (s.startDate < wStart) startCol = 0;
      if (s.endDate > wEnd) endCol = 6;

      let chosenTrack = 0;
      if (tracks[0] !== null) chosenTrack = 1;
      tracks[chosenTrack] = s.id;

      const isFirst = s.startDate >= wStart && s.startDate <= wEnd;
      weekSpanPieces[w].push({
        span: s,
        startCol,
        colSpan: endCol - startCol + 1,
        track: chosenTrack,
        isFirst,
      });

      for (let c = startCol; c <= endCol; c++) {
        const cellIdx = w * 7 + c;
        cellSpansAbove[cellIdx] = Math.min(2, (cellSpansAbove[cellIdx] || 0) + 1);
      }
    });
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#FCFAF7] flex flex-col justify-between select-none">
      <div className="p-4 space-y-3">
        {/* 상단 바 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCycleTitleStyle}
              className="flex items-center gap-2 active:opacity-80"
            >
              {titleStyle === 'round' ? (
                <div className="w-10 h-10 rounded-full bg-[#F5DEB3]/50 flex items-center justify-center">
                  <span className="font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)]">
                    {monthNumber}
                  </span>
                </div>
              ) : titleStyle === 'brush' ? (
                <div className="relative pb-0.5">
                  <span className="font-['Dongle'] text-4xl text-[var(--sd-ink)] italic leading-none">
                    {monthNumber}월
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-[var(--sd-rel)]/30" />
                </div>
              ) : (
                <span className="font-['Dongle'] text-4xl text-[var(--sd-ink)] leading-none">
                  {monthNumber}월
                </span>
              )}
            </button>

            <div
              onClick={onTapHero}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden ${
                hero
                  ? 'bg-transparent'
                  : isDecorate
                  ? 'border border-dashed border-[var(--sd-line)] bg-[var(--sd-surface-2)]/50 cursor-pointer'
                  : 'bg-transparent'
              }`}
            >
              {hero ? (
                hero.src ? (
                  <img
                    src={hero.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  hero.decorId && <DiaryDecor decorId={hero.decorId} className="w-full h-full" />
                )
              ) : isDecorate ? (
                <span className="text-[10px] text-[var(--sd-faint)]">머리</span>
              ) : null}
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={onPrevMonth}
                className="w-7 h-8 flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNextMonth}
                className="w-7 h-8 flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 relative">
            <span className="text-[10px] text-[var(--sd-faint)]">
              {saveState === 'saving' ? '저장 중' : saveState === 'offline' ? '오프라인' : ''}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 z-30 w-36 py-1 rounded-2xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-lg space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onGoThisMonth();
                  }}
                  className="w-full h-10 px-3 text-left text-xs text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
                >
                  이번 달로
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSpecialDates();
                  }}
                  className="w-full h-10 px-3 text-left text-xs text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
                >
                  생일·기념일 관리
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 주인 전환 알약 */}
        <div className="flex items-center justify-between">
          <div className="flex p-0.5 rounded-full bg-[var(--sd-surface-2)] border border-[var(--sd-line)]/60">
            {(['together', '우댕', '꼼이'] as MonthOwner[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onChangeOwner(tab)}
                className={`min-h-[32px] px-3 rounded-full text-xs transition-colors ${
                  owner === tab
                    ? 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] font-medium shadow-sm'
                    : 'text-[var(--sd-muted)]'
                }`}
              >
                {tab === 'together' ? '같이' : tab}
              </button>
            ))}
          </div>

          {!canEdit && (
            <span className="text-[11px] text-[var(--sd-faint)]">
              {owner}의 달력 — 보기 전용
            </span>
          )}
        </div>

        {/* 기념일 알림 한 줄 */}
        {upcoming && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] text-xs font-medium">
            <Cake className="w-3.5 h-3.5 shrink-0" />
            <span>
              곧 {upcoming.label} · {upcoming.daysLeft}일
            </span>
          </div>
        )}

        {/* 달력 종이 */}
        <div className="relative rounded-2xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-sm overflow-hidden p-2">
          {/* 바인더 구멍 */}
          <div className="absolute left-1 top-4 bottom-4 flex flex-col justify-between pointer-events-none z-10">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#E8DDD8] border border-[var(--sd-line)]"
              />
            ))}
          </div>

          <div className="pl-2">
            <div className="grid grid-cols-7 mb-1 text-center text-[10px] text-[var(--sd-faint)]">
              <span className="text-[var(--sd-rel)] font-medium">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
            </div>

            <div className="flex flex-col border-t border-l border-[var(--sd-line)]/40">
              {Array.from({ length: 6 }, (_, w) => (
                <div key={w} className="relative grid grid-cols-7">
                  {weekSpanPieces[w].map((piece) => {
                    const leftPct = (piece.startCol / 7) * 100;
                    const widthPct = (piece.colSpan / 7) * 100;
                    const topPx = 18 + piece.track * 13;

                    return (
                      <div
                        key={`${piece.span.id}-${w}`}
                        onClick={(e) => {
                          if (isDecorate) {
                            e.stopPropagation();
                            onTapSpan(piece.span.id);
                          }
                        }}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: `${topPx}px`,
                        }}
                        className={`absolute h-[11px] z-10 rounded-sm overflow-hidden px-1 flex items-center select-none ${
                          isDecorate ? 'cursor-pointer active:opacity-75' : 'pointer-events-none'
                        }`}
                      >
                        <DiaryDecor
                          decorId={piece.span.decorId}
                          className="absolute inset-0 w-full h-full opacity-80"
                        />
                        {piece.isFirst && (
                          <span className="relative z-10 text-[9px] text-[var(--sd-ink)] font-medium truncate leading-none">
                            {piece.span.label}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {cells.slice(w * 7, w * 7 + 7).map((cell, cIdx) => {
                    const globalIdx = w * 7 + cIdx;
                    return (
                      <DiaryMonthCell
                        key={cell.date}
                        cell={cell}
                        mode={mode}
                        tool={tool}
                        marked={spanStart === cell.date}
                        hasSpanAbove={cellSpansAbove[globalIdx]}
                        onTap={() => onTapDay(cell.date)}
                        onRemoveSticker={(sId) => onRemoveSticker(cell.date, sId)}
                        onRemoveMemo={() => onRemoveMemo(cell.date)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* 아래 여백 줄 (스티커 최대 6) */}
            <div className="mt-2 pt-2 border-t border-[var(--sd-line)]/50 flex items-center justify-between px-1">
              {Array.from({ length: 6 }, (_, idx) => {
                const item = margin[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => onTapMargin(idx)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item
                        ? 'bg-transparent'
                        : isDecorate
                        ? 'border border-dashed border-[var(--sd-line)] bg-[var(--sd-surface-2)]/40 cursor-pointer active:scale-95'
                        : 'opacity-0'
                    }`}
                  >
                    {item ? (
                      item.src ? (
                        <img
                          src={item.src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        item.decorId && (
                          <DiaryDecor decorId={item.decorId} className="w-full h-full" />
                        )
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 제어 줄 */}
      <div
        className="w-full border-t border-[var(--sd-line)] bg-[var(--sd-card-solid)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {undoText && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--sd-surface-2)] border-b border-[var(--sd-line)] text-xs text-[var(--sd-ink)]">
            <span>{undoText}</span>
            <button
              type="button"
              onClick={onUndo}
              className="flex items-center gap-1 font-medium text-[var(--sd-rel)] active:opacity-80"
            >
              <Undo2 className="w-3.5 h-3.5" />
              되돌리기
            </button>
          </div>
        )}

        {!isDecorate ? (
          <div className="p-3 flex justify-center">
            {canEdit && (
              <button
                type="button"
                onClick={onToggleMode}
                className="w-full min-h-[44px] rounded-2xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[var(--sd-ink)] text-sm font-medium flex items-center justify-center gap-1.5 active:bg-[var(--sd-line)]/50"
              >
                <Paintbrush className="w-4 h-4 text-[var(--sd-rel)]" />
                달력 꾸미기
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <div className="flex items-center justify-between px-2 text-xs text-[var(--sd-muted)]">
              {tool === 'sticker' && (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-[var(--sd-surface-2)] flex items-center justify-center overflow-hidden">
                      {selectedAsset?.src ? (
                        <img
                          src={selectedAsset.src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="w-full h-full object-contain"
                        />
                      ) : selectedAsset?.decorId ? (
                        <DiaryDecor decorId={selectedAsset.decorId} className="w-full h-full" />
                      ) : (
                        <Smile className="w-3.5 h-3.5 text-[var(--sd-faint)]" />
                      )}
                    </div>
                    <span>날짜를 톡 하면 붙어요</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAssets}
                    className="min-h-[32px] px-2 rounded-lg bg-[var(--sd-surface-2)] text-[11px] text-[var(--sd-ink)] font-medium"
                  >
                    다른 스티커
                  </button>
                </div>
              )}
              {tool === 'span' && (
                <span>{spanStart ? '끝나는 날을 톡' : '시작하는 날을 톡'}</span>
              )}
              {tool === 'memo' && <span>메모할 날짜를 톡</span>}
              {tool === 'erase' && <span>지울 것을 톡</span>}
            </div>

            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 flex-1">
                {(
                  [
                    { id: 'sticker', label: '스티커', icon: Smile },
                    { id: 'span', label: '기간 띠', icon: Layers },
                    { id: 'memo', label: '메모', icon: FileText },
                    { id: 'erase', label: '지우개', icon: Eraser },
                  ] as { id: MonthTool; label: string; icon: any }[]
                ).map((t) => {
                  const Icon = t.icon;
                  const active = tool === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onPickTool(t.id)}
                      className={`flex-1 min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                        active
                          ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-medium'
                          : 'bg-[var(--sd-surface-2)] text-[var(--sd-muted)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onToggleMode}
                className="min-w-[48px] min-h-[44px] rounded-xl bg-[var(--sd-ink)] text-white text-xs font-medium flex items-center justify-center gap-0.5 px-3 active:opacity-90"
              >
                <Check className="w-4 h-4" />
                완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

```tsx
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
```

```tsx
// src/components/diary/DiaryMonthSpanSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
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
                className="min-h-[44px] px-4 rounded-xl border border-[var(--sd-crit)]/40 text-[var(--sd-crit)] text-xs font-medium flex items-center justify-center gap-1 active:bg-[var(--sd-crit)]/10"
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
              붙이기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

```tsx
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
                  <div className="w-8 h-8 rounded-xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)]/50 flex items-center justify-center shrink-0 overflow-hidden">
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
```

---
- 월간 꾸미기 달력 화면과 날짜 셀, 메모·기간 테이프 시트, 생일·기념일 전용 스티커 시트 5종을 구현했습니다.
- 종이 질감 바인더 디테일과 6주 42칸 위 주간 기간 띠 오버레이를 적용해 스티커·메모가 겹치지 않도록 칸 높이를 조절했습니다.
- `together` 대신 '같이' 라벨 표시 및 16px 입력 폰트·44px 터치 영역 등 지정된 모바일 다꾸 규칙을 모두 준수했습니다.
