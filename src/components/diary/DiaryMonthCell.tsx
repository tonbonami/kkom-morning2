// src/components/diary/DiaryMonthCell.tsx
'use client';

import React from 'react';
import { Cake, Heart, Star } from 'lucide-react';
import { DiaryMonthCellVM, MonthTool } from '@/lib/diaryTypes';
import { DiaryDecor } from './DiaryDecor';
import { EVENT_OWNER_STYLE } from './DiaryEventStyle';

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

  // 스티커 크기(우댕 2026-11-17 「스티커 키워줘」) — 16px 고정이던 것을 칸에 맞춰 키운다. 칸 안쪽이 39x58px 라서
  //   한 개 26 · 긴 메모(두 줄)와 같이 22 · 띠 한 줄 밑 20 · 두 개 19 · 띠 두 줄 밑 16(이때 메모는 숨김).
  // 기념일 전용 스티커는 자리가 있으면(붙인 스티커 0~1개) 가운데 줄에 같은 크기로, 없으면 날짜 옆에 작게.
  // 일정 점·「+N」은 날짜 줄 오른쪽, 하루 장을 쓴 날의 점은 칸 오른쪽 아래(둘이 헷갈리지 않게 떨어뜨림).
  const userStickers = cell.stickers.slice(0, 2);
  const specialBig = !!special?.sticker && userStickers.length < 2;
  const shown = (specialBig ? 1 : 0) + userStickers.length;

  const px =
    hasSpanAbove === 2
      ? 16
      : shown >= 2
      ? 19
      : hasSpanAbove > 0
      ? 20
      : cell.memo && cell.memo.length > 4
      ? 22
      : 26;

  const hideMemo = hasSpanAbove === 2 && shown > 0;

  const drawSticker = (st: { src?: string; decorId?: string }) =>
    st.src ? (
      <img
        src={st.src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="w-full h-full object-contain"
      />
    ) : st.decorId ? (
      <DiaryDecor decorId={st.decorId} className="w-full h-full" />
    ) : null;

  return (
    <div
      onClick={cell.inMonth ? onTap : undefined}
      className={`relative w-full h-[66px] p-1 flex flex-col justify-between border-b border-r border-[color:color-mix(in_srgb,var(--sd-line)_40%,transparent)] select-none ${
        !cell.inMonth
          ? 'opacity-25 bg-[color:color-mix(in_srgb,var(--sd-surface-2)_30%,transparent)]'
          : marked
          ? 'bg-[color:color-mix(in_srgb,var(--sd-rel-soft)_60%,transparent)]'
          : 'bg-transparent'
      } ${
        cell.inMonth && mode === 'decorate'
          ? 'cursor-pointer active:bg-[color:color-mix(in_srgb,var(--sd-surface-2)_50%,transparent)]'
          : ''
      }`}
    >
      <div className="flex items-center justify-between w-full h-4">
        <div className="flex items-center gap-0.5 min-w-0">
          {cell.isToday ? (
            <span className="w-4 h-4 rounded-full bg-[var(--sd-rel)] text-white text-[10px] font-bold flex items-center justify-center leading-none shrink-0">
              {cell.day}
            </span>
          ) : (
            <span
              className={`text-[11px] font-medium leading-none shrink-0 ${
                cell.holiday ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-ink)]'
              }`}
            >
              {cell.day}
            </span>
          )}

          {special && (
            <div className="flex items-center gap-0.5 ml-0.5 truncate">
              {special.sticker ? (
                specialBig ? null : (
                  <div className="w-3.5 h-3.5 shrink-0">{drawSticker(special.sticker)}</div>
                )
              ) : special.kind === 'birthday' ? (
                <Cake className="w-2.5 h-2.5 text-[var(--sd-rel)] shrink-0" />
              ) : special.kind === 'anniversary' ? (
                special.years ? null : (
                  <Heart className="w-2.5 h-2.5 text-[var(--sd-rel)] fill-current shrink-0" />
                )
              ) : (
                <Star className="w-2.5 h-2.5 text-[var(--sd-rel)] shrink-0" />
              )}
              {special.years && (
                <span className="text-[9px] text-[var(--sd-rel)] font-medium leading-none whitespace-nowrap">
                  {special.years}주년
                </span>
              )}
            </div>
          )}
        </div>

        {cell.events && (cell.events.owners.length > 0 || cell.events.more > 0) && (
          <div
            className={`flex items-center gap-0.5 shrink-0 ml-1 ${
              mode === 'decorate' ? 'opacity-40' : ''
            }`}
          >
            {cell.events.owners.slice(0, 2).map((owner, idx) => (
              <span
                key={idx}
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{ backgroundColor: EVENT_OWNER_STYLE[owner].dot }}
              />
            ))}
            {cell.events.more > 0 && (
              <span className="text-[8px] font-medium leading-none text-[var(--sd-muted)]">
                +{cell.events.more}
              </span>
            )}
          </div>
        )}
      </div>

      {hasSpanAbove > 0 && (
        <div style={{ height: `${hasSpanAbove * 13}px` }} className="shrink-0" />
      )}

      <div
        className="flex-1 flex items-center justify-center gap-px"
        style={shown ? { minHeight: px } : undefined}
      >
        {specialBig && special?.sticker && (
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: px, height: px }}
          >
            {drawSticker(special.sticker)}
          </div>
        )}
        {userStickers.map((s) => (
          <div
            key={s.id}
            onClick={(e) => {
              if (isErase && onRemoveSticker) {
                e.stopPropagation();
                onRemoveSticker(s.id);
              }
            }}
            style={{ width: px, height: px }}
            className={`flex items-center justify-center shrink-0 ${
              isErase
                ? 'rounded border border-[color:color-mix(in_srgb,var(--sd-crit)_60%,transparent)] bg-[color:color-mix(in_srgb,var(--sd-crit)_10%,transparent)] cursor-pointer'
                : ''
            }`}
          >
            {drawSticker(s)}
          </div>
        ))}
      </div>

      {cell.memo && !hideMemo && (
        <div
          onClick={(e) => {
            if (isErase && onRemoveMemo) {
              e.stopPropagation();
              onRemoveMemo();
            }
          }}
          className={`w-full text-center break-all text-[9px] leading-[10px] text-[var(--sd-muted)] font-normal px-1.5 ${
            hasSpanAbove > 0 && cell.stickers.length > 0 ? 'line-clamp-1' : 'line-clamp-2'
          } ${
            isErase
              ? 'rounded border border-[color:color-mix(in_srgb,var(--sd-crit)_60%,transparent)] bg-[color:color-mix(in_srgb,var(--sd-crit)_10%,transparent)] cursor-pointer'
              : ''
          }`}
        >
          {cell.memo}
        </div>
      )}

      {(cell.mine || cell.partner) && (
        <div className="absolute right-1 bottom-1 flex items-center gap-0.5 pointer-events-none z-10">
          {cell.mine && <span className="w-1 h-1 rounded-full bg-[var(--sd-ink)]" />}
          {cell.partner && <span className="w-1 h-1 rounded-full bg-[var(--sd-line)]" />}
        </div>
      )}
    </div>
  );
}
