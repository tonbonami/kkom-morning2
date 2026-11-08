// src/components/honeybrary/HoneyBookCover.tsx
'use client';

import React from 'react';

export interface HoneyBookCoverProps {
  title: string;
  src?: string;
  width: number;
  rounded?: number;
  className?: string;
}

const CLOTH_PALETTE: [string, string][] = [
  ['#B0894C', '#997339'],
  ['#8A624A', '#744F39'],
  ['#5F7057', '#4E5D46'],
  ['#546B7C', '#425665'],
  ['#A35D52', '#8B4A40'],
  ['#7A5265', '#653F52'],
];

function clothHueOf(title: string): [string, string] {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) >>> 0;
  }
  return CLOTH_PALETTE[h % CLOTH_PALETTE.length];
}

export function HoneyBookCover({
  title,
  src,
  width,
  rounded = 10,
  className = '',
}: HoneyBookCoverProps) {
  const height = Math.round(width * 1.5);
  const boxStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: rounded,
  };

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`object-cover shrink-0 select-none ${className}`}
        style={{
          ...boxStyle,
          boxShadow: '0 4px 12px -4px rgba(70,40,50,.2)',
        }}
      />
    );
  }

  const [a, b] = clothHueOf(title);

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center text-center overflow-hidden select-none ${className}`}
      style={{
        ...boxStyle,
        background: `linear-gradient(165deg, ${a}, ${b})`,
        boxShadow: 'inset 4px 0 6px -2px rgba(0,0,0,0.32), 0 4px 12px -4px rgba(70,40,50,.2)',
        padding: Math.max(6, Math.round(width * 0.1)),
      }}
      aria-hidden
    >
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: Math.max(3, Math.round(width * 0.05)),
          background: 'linear-gradient(to right, rgba(0,0,0,0.22), transparent)',
        }}
      />
      <span
        className="font-medium leading-snug text-white break-keep line-clamp-4"
        style={{
          fontSize: Math.max(10, Math.min(17, Math.round(width * 0.13))),
          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}
      >
        {title}
      </span>
    </div>
  );
}
