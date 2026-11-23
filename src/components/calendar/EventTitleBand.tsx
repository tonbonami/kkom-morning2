'use client';

import React from 'react';
import type { EventOwner } from '@/lib/calendar';

// 꼼캘과 꼼이어리에서 함께 쓰는 일정 주인 색.
// Tailwind 팔레트 기준: 꼼이 rose-400/100/700, 우댕 blue-400/100/700, 함께 purple-500/100/800.
export const EVENT_OWNER_STYLE: Record<
  EventOwner,
  { label: string; dot: string; band: string; text: string }
> = {
  kkomi: { label: '꼼이', dot: '#FB7185', band: '#FFE4E6', text: '#BE123C' },
  udaeng: { label: '우댕', dot: '#60A5FA', band: '#DBEAFE', text: '#1D4ED8' },
  together: { label: '함께', dot: '#A855F7', band: '#F3E8FF', text: '#6B21A8' },
};

export interface EventTitleBandProps extends React.HTMLAttributes<HTMLDivElement> {
  owner: EventOwner;
  title: string;
  showTitle?: boolean;
  roundLeft?: boolean;
  roundRight?: boolean;
  textClassName?: string;
}

/** 왼쪽 3px 주인색 막대 + 옅은 바탕 + 한 줄 제목으로 된 공용 일정 띠. */
export function EventTitleBand({
  owner,
  title,
  showTitle = true,
  roundLeft = false,
  roundRight = true,
  textClassName = '',
  className = '',
  style,
  children,
  ...props
}: EventTitleBandProps): React.JSX.Element {
  const ownerStyle = EVENT_OWNER_STYLE[owner];

  return (
    <div
      {...props}
      style={{
        backgroundColor: ownerStyle.band,
        borderLeftColor: ownerStyle.dot,
        ...style,
      }}
      className={`min-w-0 overflow-hidden border-l-[3px] flex items-center ${
        roundLeft ? 'rounded-l-sm' : 'rounded-l-none'
      } ${roundRight ? 'rounded-r-sm' : 'rounded-r-none'} ${className}`}
    >
      {children}
      {showTitle && (
        <span
          style={{ color: ownerStyle.text }}
          className={`relative z-10 min-w-0 truncate whitespace-nowrap leading-none ${textClassName}`}
        >
          {title}
        </span>
      )}
    </div>
  );
}
