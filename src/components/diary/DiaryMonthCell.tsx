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
  /** 칸 높이 — 넓은 화면(가로 폰·아이패드)에선 칸 폭에 맞춰 키운다(기본 74). */
  cellH?: number;
  /** 넓은 칸 — 날짜·메모·점·띠 칸을 한 단계 크게(우댕 11/18 「가로 화면에서도 꽉 차서 크게」). */
  big?: boolean;
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
  cellH = 74,
  big = false,
}: DiaryMonthCellProps): React.JSX.Element {
  const isErase = mode === 'decorate' && tool === 'erase';
  const special = cell.specials[0];

  // 크기(우댕 2026-11-18 「스티커도 너무 작고 메시지 너무 작은데....이게 보일까?」 + GPT 회의) — 칸 74 높이, 안쪽 폭 약 38.
  //   날짜 줄 20 아래 남는 높이 = 46 · 띠 한 줄 31 · 띠 두 줄 16. 그 안에서 메모(10.5px, 줄 12)와 스티커를 나눈다.
  //   스티커가 있으면 메모는 한 줄까지, 자리가 없으면 메모는 접고 날짜 줄에 「✎」(전체는 날짜를 눌러 시트에서 크게).
  //   스티커 두 개는 옆으로 겹쳐 붙인다(나란히 놓으면 폭 38에 19px밖에 안 된다).
  // 기념일 전용 스티커는 자리가 있으면(붙인 스티커 0~1개) 가운데 줄에 같은 크기로, 없으면 날짜 옆에 작게.
  // 「+N」(띠로 못 그린 일정)은 날짜 줄 오른쪽, 하루 장을 쓴 날의 점은 칸 오른쪽 아래.
  const userStickers = cell.stickers.slice(0, 2);
  const specialBig = !!special?.sticker && userStickers.length < 2;
  const shown = (specialBig ? 1 : 0) + userStickers.length;

  // 넓은 칸은 같은 계산을 칸 높이 비율(scale)로 키운다 — 기본 칸(74)에선 예전 숫자 그대로(46·26·13·40·24·30).
  const scale = Math.max(1, cellH / 74);
  const dateH = big ? 24 : 20, step = big ? 18 : 15, lineH = big ? 14 : 12;
  const avail = cellH - 8 - dateH - Math.min(2, hasSpanAbove) * step;
  const memoLines = !cell.memo ? 0 : shown === 0 ? (avail >= lineH * 2 + 2 ? 2 : avail >= lineH + 1 ? 1 : 0) : avail >= lineH + Math.round(28 * scale) ? 1 : 0;
  // 넓은 칸은 옆으로 자리가 남아서 스티커 상한을 더 올린다(남는 높이가 진짜 한도).
  const boost = big ? 1.35 : 1;
  const px = Math.round(Math.max(14 * scale, Math.min((shown >= 2 ? 24 : 30) * scale * boost, avail - memoLines * lineH - 2)));
  const hideMemo = !!cell.memo && memoLines === 0;

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
      style={{ height: cellH }}
      className={`relative w-full p-1 flex flex-col justify-between overflow-hidden border-b border-r border-[color:color-mix(in_srgb,var(--sd-line)_40%,transparent)] select-none ${
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
      <div className={`flex items-center justify-between w-full shrink-0 ${big ? 'h-6' : 'h-5'}`}>
        <div className="flex items-center gap-0.5 min-w-0">
          {cell.isToday ? (
            <span className={`rounded-full bg-[var(--sd-rel)] text-white font-bold flex items-center justify-center leading-none shrink-0 ${big ? 'w-6 h-6 text-[14px]' : 'w-5 h-5 text-[11.5px]'}`}>
              {cell.day}
            </span>
          ) : (
            <span
              className={`${big ? 'text-[15px]' : 'text-[12.5px]'} font-medium leading-none shrink-0 ${
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
                  <div className={`shrink-0 ${big ? 'w-[18px] h-[18px]' : 'w-3.5 h-3.5'}`}>{drawSticker(special.sticker)}</div>
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
                <span className={`${big ? 'text-[11px]' : 'text-[9px]'} text-[var(--sd-rel)] font-medium leading-none whitespace-nowrap`}>
                  {special.years}주년
                </span>
              )}
            </div>
          )}
        </div>

        {((cell.events && (cell.events.owners.length > 0 || cell.events.more > 0)) || hideMemo) && (
          <div
            className={`flex items-center gap-0.5 shrink-0 ml-0.5 ${
              mode === 'decorate' ? 'opacity-60' : ''
            }`}
          >
            {hideMemo && (
              <span className={`${big ? 'text-[12px]' : 'text-[10px]'} leading-none text-[var(--sd-muted)]`} aria-label="메모 있음">✎</span>
            )}
            {cell.events?.owners.slice(0, 2).map((owner, idx) => (
              <span
                key={idx}
                className={`rounded-full shrink-0 ${big ? 'w-[7px] h-[7px]' : 'w-[5px] h-[5px]'}`}
                style={{ backgroundColor: EVENT_OWNER_STYLE[owner].dot }}
              />
            ))}
            {cell.events && cell.events.more > 0 && (
              <span className={`${big ? 'text-[11px]' : 'text-[9.5px]'} font-medium leading-none text-[var(--sd-muted)]`}>
                +{cell.events.more}
              </span>
            )}
          </div>
        )}
      </div>

      {hasSpanAbove > 0 && (
        <div style={{ height: `${Math.min(2, hasSpanAbove) * step}px` }} className="shrink-0" />
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
        {userStickers.map((s, i) => (
          <div
            key={s.id}
            onClick={(e) => {
              if (isErase && onRemoveSticker) {
                e.stopPropagation();
                onRemoveSticker(s.id);
              }
            }}
            style={{ width: px, height: px, ...(shown >= 2 && (i > 0 || specialBig) ? { marginLeft: -Math.round(px * 0.42), position: 'relative' as const } : {}) }}
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
          className={`w-full shrink-0 text-center break-all ${big ? 'text-[12.5px] leading-[14px]' : 'text-[10.5px] leading-[12px]'} text-[var(--sd-ink)] opacity-80 font-normal px-0.5 ${
            memoLines >= 2 ? 'line-clamp-2' : 'line-clamp-1'
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
          {cell.mine && <span className={`${big ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full bg-[var(--sd-ink)]`} />}
          {cell.partner && <span className={`${big ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full bg-[color:color-mix(in_srgb,var(--sd-ink)_35%,transparent)]`} />}
        </div>
      )}
    </div>
  );
}
