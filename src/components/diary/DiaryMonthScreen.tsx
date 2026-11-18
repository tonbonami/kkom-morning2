// src/components/diary/DiaryMonthScreen.tsx
'use client';

import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MoreHorizontal,
  Paintbrush,
  Check,
  Undo2,
  Cake,
  Smile,
  Layers,
  FileText,
  Eraser,
  CalendarPlus,
} from 'lucide-react';
import {
  Person,
  MonthOwner,
  MonthStickerVM,
  DiaryMonthCellVM,
  MonthBandSegVM,
  MonthTitleStyle,
  MonthTool,
  DiaryAssetVM,
  UpcomingItemVM,
} from '@/lib/diaryTypes';
import { DiaryMonthCell } from './DiaryMonthCell';
import { DiaryDecor } from './DiaryDecor';
import { EVENT_OWNER_STYLE } from './DiaryEventStyle';

export interface DiaryMonthScreenProps {
  me: Person;
  owner: MonthOwner;
  canEdit: boolean;
  monthLabel: string;
  /** 올해가 아닌 달이면 「2025년」 — 제목 아래 작게(Aside 검수 11/18: 연도가 어디에도 안 보여 작년인지 모름) */
  yearNote?: string;
  monthNumber: number;
  titleStyle: MonthTitleStyle;
  hero?: MonthStickerVM | null;
  cells: DiaryMonthCellVM[];
  bands: MonthBandSegVM[];
  margin: MonthStickerVM[];
  upcoming?: UpcomingItemVM | null;
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
  onTapBand: (id: string, kind: 'event' | 'decor') => void;
  onTapHero: () => void;
  onTapMargin: (index: number) => void;
  onCycleTitleStyle: () => void;
  onUndo: () => void;
  onOpenSpecialDates: () => void;
  onOpenUpcoming: () => void;
  onAddEvent: () => void;
  /** 이번 달을 보고 있나 — 아니면 머리줄 오른쪽에 「오늘」 단추 */
  isCurrentMonth?: boolean;
}

export function DiaryMonthScreen({
  me,
  owner,
  canEdit,
  monthLabel,
  yearNote,
  monthNumber,
  titleStyle,
  hero,
  cells,
  bands,
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
  onTapBand,
  onTapHero,
  onTapMargin,
  onCycleTitleStyle,
  onUndo,
  onOpenSpecialDates,
  onOpenUpcoming,
  onAddEvent,
  isCurrentMonth = true,
}: DiaryMonthScreenProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  // 달력을 좌우로 밀어 달 넘기기(화살표와 같이 둔다 — 밀기만 있으면 모르고 지나간다). 세로 스크롤과 헷갈리지 않게 가로로 확실히 민 것만.
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const onGridTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, t: Date.now() } : null;
  };
  const onGridTouchEnd = (e: React.TouchEvent) => {
    const s = swipeRef.current; swipeRef.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - s.t > 700) return;
    if (dx > 0) onPrevMonth(); else onNextMonth();
  };
  const isDecorate = mode === 'decorate';

  const cellSpansAbove: number[] = new Array(cells.length).fill(0);
  bands.forEach((b) => {
    for (let c = b.col; c < b.col + b.span && c < 7; c++) {
      const idx = b.week * 7 + c;
      if (idx < cellSpansAbove.length) {
        cellSpansAbove[idx] = Math.max(cellSpansAbove[idx], b.row + 1);
      }
    }
  });

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#FCFAF7] flex flex-col justify-between select-none">
      <div className="p-4 space-y-3">
        {/* 머리줄 — 우댕 2026-11-18 「대칭이 안맞아서 안예쁜데 화살표 잘 안눌리고. 지난달 가기가 불편해」 + GPT 회의:
            [뒤로 | 오늘 자리] [‹ 제목 ›] [저장 표시 | 메뉴] — 양옆 칸 폭을 같게 해서 제목이 정확히 가운데. 화살표 44×44.
            「머리 스티커」 칸은 여기서 뺐다(붙여 둔 것은 달력 아래 여백 줄 맨 앞에 보인다). */}
        <div className="grid grid-cols-[92px_1fr_92px] items-center">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              aria-label="뒤로"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="지난달"
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-[var(--sd-muted)] active:bg-[var(--sd-surface-2)] active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={isDecorate ? onCycleTitleStyle : undefined}
              className={`flex flex-col items-center justify-center min-w-[64px] ${isDecorate ? 'active:opacity-80' : 'cursor-default'}`}
            >
              {yearNote && <span className="text-[11px] leading-none text-[var(--sd-muted)] mb-0.5">{yearNote}</span>}
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
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="다음 달"
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-[var(--sd-muted)] active:bg-[var(--sd-surface-2)] active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-0.5 relative">
            {!isCurrentMonth ? (
              <button
                type="button"
                onClick={onGoThisMonth}
                className="min-h-[32px] px-2.5 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] text-[11px] font-medium text-[var(--sd-ink)] active:scale-95"
              >
                오늘
              </button>
            ) : (
              <span className="text-[10px] text-[var(--sd-faint)] whitespace-nowrap">
                {saveState === 'saving' ? '저장 중' : saveState === 'offline' ? '오프라인' : ''}
              </span>
            )}
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

        {upcoming && (
          <button
            type="button"
            onClick={onOpenUpcoming}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--sd-surface-2)] border border-[color:color-mix(in_srgb,var(--sd-line)_60%,transparent)] text-xs text-[var(--sd-ink)] active:opacity-80"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {upcoming.kind === 'event' ? (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: upcoming.owner
                      ? EVENT_OWNER_STYLE[upcoming.owner].dot
                      : 'var(--sd-rel)',
                  }}
                />
              ) : (
                <Cake className="w-3.5 h-3.5 text-[var(--sd-rel)] shrink-0" />
              )}
              <span className="font-semibold shrink-0">{upcoming.whenLabel}</span>
              <span className="text-[var(--sd-muted)] shrink-0">·</span>
              <span className="truncate font-medium">{upcoming.title}</span>
              {upcoming.timeLabel && (
                <span className="text-[var(--sd-faint)] font-normal shrink-0">
                  {upcoming.timeLabel}
                </span>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--sd-muted)] shrink-0 ml-1" />
          </button>
        )}

        <div
          className="relative rounded-2xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-sm overflow-hidden p-2"
          onTouchStart={onGridTouchStart}
          onTouchEnd={onGridTouchEnd}
          onTouchCancel={() => { swipeRef.current = null; }}
        >
          <div className="absolute left-1 top-4 bottom-4 flex flex-col justify-between pointer-events-none z-10">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#E8DDD8] border border-[var(--sd-line)]"
              />
            ))}
          </div>

          <div className="pl-2">
            <div className="grid grid-cols-7 mb-1 text-center text-[11px] text-[var(--sd-faint)]">
              <span className="text-[var(--sd-rel)] font-medium">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
            </div>

            <div className="flex flex-col border-t border-l border-[color:color-mix(in_srgb,var(--sd-line)_40%,transparent)]">
              {Array.from({ length: 6 }, (_, w) => {
                const weekBands = bands.filter((b) => b.week === w);

                return (
                  <div key={w} className="relative grid grid-cols-7">
                    {weekBands.map((b) => {
                      const leftCalc = `calc(${(b.col / 7) * 100}% + 2px)`;
                      const widthCalc = `calc(${(b.span / 7) * 100}% - 4px)`;
                      const topPx = 23 + b.row * 15;   // DiaryMonthCell 의 날짜 줄(20) 밑, 줄마다 15(띠 14 + 틈 1)
                      const isEvent = b.kind === 'event';
                      const ownerStyle = isEvent
                        ? EVENT_OWNER_STYLE[b.owner || 'together']
                        : null;

                      const cornerClasses = `${
                        b.continuesLeft || b.kind === 'event' ? 'rounded-l-none' : 'rounded-l-sm'
                      } ${b.continuesRight ? 'rounded-r-none' : 'rounded-r-sm'}`;

                      return (
                        <div
                          key={b.key}
                          onClick={(e) => {
                            if (!isDecorate && isEvent) {
                              e.stopPropagation();
                              onTapBand(b.id, 'event');
                            } else if (isDecorate && !isEvent) {
                              e.stopPropagation();
                              onTapBand(b.id, 'decor');
                            }
                          }}
                          style={{
                            left: leftCalc,
                            width: widthCalc,
                            top: `${topPx}px`,
                            backgroundColor: ownerStyle ? ownerStyle.band : undefined,
                            borderLeftColor: ownerStyle ? ownerStyle.dot : undefined,
                          }}
                          className={`absolute h-[14px] overflow-hidden ${b.span === 1 ? 'px-[3px]' : 'px-1'} flex items-center select-none ${cornerClasses} ${
                            isEvent
                              ? `border-l-[2.5px] ${
                                  isDecorate
                                    ? 'opacity-40 pointer-events-none'
                                    : 'cursor-pointer active:opacity-80 z-20'
                                }`
                              : isDecorate
                              ? 'cursor-pointer active:opacity-75 z-20'
                              : 'pointer-events-none'
                          }`}
                        >
                          {isEvent ? (
                            <>
                              {b.decorId && (
                                <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
                                  <DiaryDecor decorId={b.decorId} />
                                </div>
                              )}
                              {b.showLabel && b.label && (
                                <span
                                  style={{ color: ownerStyle?.text }}
                                  className="relative z-10 text-[9.5px] font-medium truncate leading-none"
                                >
                                  {b.label}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 opacity-80 pointer-events-none">
                                <DiaryDecor decorId={b.decorId ?? 'tape-honey'} />
                              </div>
                              {b.showLabel && b.label && (
                                <span className="relative z-10 text-[9.5px] text-[var(--sd-ink)] font-medium truncate leading-none">
                                  {b.label}
                                </span>
                              )}
                            </>
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
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-[color:color-mix(in_srgb,var(--sd-line)_50%,transparent)] flex items-center justify-between px-1">
              {/* 예전 「머리 스티커」(달 이름 옆) — 머리줄에서 뺐으니 붙여 둔 것만 여기 맨 앞에. 새로 붙이는 자리는 이제 없다. */}
              {hero && (
                <div
                  onClick={isDecorate ? onTapHero : undefined}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDecorate ? 'cursor-pointer active:scale-95' : ''}`}
                >
                  {hero.src ? (
                    <img src={hero.src} alt="" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-contain" />
                  ) : (
                    hero.decorId && <DiaryDecor decorId={hero.decorId} className="w-full h-full" />
                  )}
                </div>
              )}
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
          <div className="p-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onAddEvent}
              className="flex-1 min-h-[44px] rounded-2xl bg-[var(--sd-ink)] text-white text-sm font-medium flex items-center justify-center gap-1.5 active:opacity-90"
            >
              <CalendarPlus className="w-4 h-4 text-white" />
              일정 추가
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={onToggleMode}
                className="flex-1 min-h-[44px] rounded-2xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[var(--sd-ink)] text-sm font-medium flex items-center justify-center gap-1.5 active:bg-[color:color-mix(in_srgb,var(--sd-line)_50%,transparent)]"
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
                <span>
                  꾸미기용 띠예요 · 알림이 필요하면 일정으로 · {spanStart ? '끝나는 날을 톡' : '시작하는 날을 톡'}
                </span>
              )}
              {tool === 'memo' && <span>메모할 날짜를 톡</span>}
              {tool === 'erase' && <span>스티커·메모·장식 띠를 톡 (일정은 안 지워져요)</span>}
            </div>

            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 flex-1">
                {(
                  [
                    { id: 'sticker', label: '스티커', icon: Smile },
                    { id: 'span', label: '장식 띠', icon: Layers },
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
