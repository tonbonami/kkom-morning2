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
  // 스티커 크기(우댕 2026-11-17 「스티커 키워줘」) — 16px 고정이던 것을 칸에 맞춰 키운다. 칸 안쪽이 39x58px 라서
  //   한 개 26 · 긴 메모(두 줄)와 같이 22 · 기간 띠 밑 20 · 두 개 19.
  // 기념일 전용 스티커는 자리가 있으면(붙인 스티커 0~1개) 가운데 줄에 같은 크기로, 없으면 날짜 옆에 작게.
  const userStickers = cell.stickers.slice(0, 2);
  const specialBig = !!special?.sticker && userStickers.length < 2;
  const shown = (specialBig ? 1 : 0) + userStickers.length;
  const px = shown >= 2 ? 19 : hasSpanAbove > 0 ? 20 : cell.memo && cell.memo.length > 4 ? 22 : 26;
  const drawSticker = (st: { src?: string; decorId?: string }) =>
    st.src ? (
      <img src={st.src} alt="" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-contain" />
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
      } ${cell.inMonth && mode === 'decorate' ? 'cursor-pointer active:bg-[color:color-mix(in_srgb,var(--sd-surface-2)_50%,transparent)]' : ''}`}
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
                specialBig ? null : <div className="w-3.5 h-3.5">{drawSticker(special.sticker)}</div>
              ) : special.kind === 'birthday' ? (
                <Cake className="w-2.5 h-2.5 text-[var(--sd-rel)]" />
              ) : special.kind === 'anniversary' ? (
                special.years ? null : <Heart className="w-2.5 h-2.5 text-[var(--sd-rel)] fill-current" />
              ) : (
                <Star className="w-2.5 h-2.5 text-[var(--sd-rel)]" />
              )}
              {special.years && (
                <span className="text-[9px] text-[var(--sd-rel)] font-medium leading-none whitespace-nowrap">
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

      {/* 하루 장을 쓴 날의 점 — 메모 줄에 같이 있으면 메모가 두세 글자에서 잘려서(칸 폭 47px) 오른쪽 위로 뺐다 */}
      {(cell.mine || cell.partner) && (
        <div className={`absolute right-[3px] flex items-center gap-0.5 ${special?.years ? 'top-[21px]' : 'top-[10px]'}`}>
          {cell.mine && <span className="w-1 h-1 rounded-full bg-[var(--sd-ink)]" />}
          {cell.partner && <span className="w-1 h-1 rounded-full bg-[var(--sd-line)]" />}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center gap-px" style={shown ? { minHeight: px } : undefined}>
        {specialBig && special?.sticker && (
          <div className="flex items-center justify-center shrink-0" style={{ width: px, height: px }}>
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

      {/* 한 줄 메모(7자) — 칸 폭에 네 글자쯤 들어가서 두 줄까지 보여 준다. 기간 띠 + 스티커가 같이 있는 칸만 한 줄. */}
      {cell.memo && (
        <div
          onClick={(e) => {
            if (isErase && onRemoveMemo) {
              e.stopPropagation();
              onRemoveMemo();
            }
          }}
          className={`w-full text-center break-all text-[9px] leading-[10px] text-[var(--sd-muted)] font-normal ${
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
    </div>
  );
}
