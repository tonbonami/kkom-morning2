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
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-[color:color-mix(in_srgb,var(--sd-rel)_30%,transparent)]" />
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
                  ? 'border border-dashed border-[var(--sd-line)] bg-[color:color-mix(in_srgb,var(--sd-surface-2)_50%,transparent)] cursor-pointer'
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
          <div className="flex p-0.5 rounded-full bg-[var(--sd-surface-2)] border border-[color:color-mix(in_srgb,var(--sd-line)_60%,transparent)]">
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
              {upcoming.daysLeft === 0 ? `오늘은 ${upcoming.label}` : `곧 ${upcoming.label} · ${upcoming.daysLeft}일`}
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

            <div className="flex flex-col border-t border-l border-[color:color-mix(in_srgb,var(--sd-line)_40%,transparent)]">
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
                        {/* DiaryDecor 뿌리가 relative 라 absolute 를 직접 주면 안 먹는다(띠가 줄어들고 이름이 밖으로 밀림) → 감싸서 깐다 */}
                        <div className="absolute inset-0 opacity-80">
                          <DiaryDecor decorId={piece.span.decorId} />
                        </div>
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
            <div className="mt-2 pt-2 border-t border-[color:color-mix(in_srgb,var(--sd-line)_50%,transparent)] flex items-center justify-between px-1">
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
                        ? 'border border-dashed border-[var(--sd-line)] bg-[color:color-mix(in_srgb,var(--sd-surface-2)_40%,transparent)] cursor-pointer active:scale-95'
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
                className="w-full min-h-[44px] rounded-2xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[var(--sd-ink)] text-sm font-medium flex items-center justify-center gap-1.5 active:bg-[color:color-mix(in_srgb,var(--sd-line)_50%,transparent)]"
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
