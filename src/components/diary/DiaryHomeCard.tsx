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
  /** 아래 줄 오른쪽 「지난 일기」 — 모아보기(11/18) */
  onOpenArchive?: () => void;
}

export function DiaryHomeCard({
  dateLabel,
  excerpt,
  thumbSrc,
  partnerWroteToday = false,
  nextEvent,
  onOpen,
  onOpenMonth,
  onOpenArchive,
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

      <div className="w-full flex items-stretch border-t border-[var(--sd-line)]">
      <button
        type="button"
        onClick={onOpenMonth}
        className="flex-1 min-w-0 min-h-[44px] px-4 py-2 flex items-center justify-between text-left active:bg-[var(--sd-surface-2)] transition-colors"
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
      {onOpenArchive && (
        <button
          type="button"
          onClick={onOpenArchive}
          className="shrink-0 min-h-[44px] px-3 border-l border-[var(--sd-line)] text-xs font-medium text-[var(--sd-muted)] active:bg-[var(--sd-surface-2)]"
        >
          지난 일기
        </button>
      )}
      </div>
    </div>
  );
}
