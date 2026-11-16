// src/components/diary/DiaryHomeCard.tsx
'use client';

import React from 'react';

export interface DiaryHomeCardProps {
  dateLabel: string;
  excerpt?: string;
  thumbSrc?: string;
  partnerWroteToday?: boolean;
  onOpen: () => void;
}

export function DiaryHomeCard({
  dateLabel,
  excerpt,
  thumbSrc,
  partnerWroteToday = false,
  onOpen,
}: DiaryHomeCardProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="sd-card w-full h-full px-4 py-4 flex flex-col justify-between relative text-left active:scale-[.98] transition-transform rounded-2xl border border-[var(--sd-line)]"
      style={{
        background: 'var(--sd-card-solid, #FFFFFF)',
        minHeight: '140px',
        boxShadow: 'var(--sd-shadow-card, 0 4px 16px rgba(46,29,38,0.06))',
      }}
    >
      {/* 상단: 다이어리 라벨과 날짜 */}
      <div>
        <div className="flex items-center justify-between">
          <span className="font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)] font-normal">
            다이어리
          </span>
          <span className="text-xs text-[var(--sd-faint)]">{dateLabel}</span>
        </div>

        {/* 일기 미리보기 또는 작성 유도 문구 */}
        <p className="text-xs text-[var(--sd-muted)] mt-2 line-clamp-2 leading-relaxed">
          {excerpt ? excerpt : '오늘 한 장 꾸며 볼까요?'}
        </p>
      </div>

      {/* 하단: 상대방 작성 알림 & 썸네일 */}
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
            />
          </div>
        )}
      </div>
    </button>
  );
}
