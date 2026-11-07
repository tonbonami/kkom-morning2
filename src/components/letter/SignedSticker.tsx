// src/components/letter/SignedSticker.tsx
'use client';

import React from 'react';

// 글씨체는 우댕이 고른 것 — src/lib/letterSign.ts 한 곳에서(Gemini 시안은 여기 상수로 적어 뒀던 것을 가져오기로만 바꿈).
import { SIGN_FONT } from '@/lib/letterSign';


export interface SignedStickerProps {
  src: string;
  alt: string;
  sign?: string;
  size: number;
  tilt?: number; // Default -7
}

export function SignedSticker({ src, alt, sign, size, tilt = -7 }: SignedStickerProps) {
  const fontSize = Math.max(14, size * 0.22 * SIGN_FONT.scale);
  const signStyle: React.CSSProperties = {
    fontFamily: SIGN_FONT.family,
    fontWeight: SIGN_FONT.weight,
    fontSize: `${fontSize}px`,
    transform: `rotate(${tilt}deg)`,
    textShadow: '0 0 4px #FFFFFF, 0 0 4px #FFFFFF', // Thin white outline shadow
  };

  return (
    <div
      className="relative flex items-center justify-center overflow-visible" // Allow sign to overflow
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        className="object-contain w-full h-full"
      />
      {sign && (
        <span
          className="absolute right-[5%] bottom-[5%] text-[var(--sd-rel)] z-10 whitespace-nowrap tabular-nums"
          style={signStyle}
        >
          {sign}
        </span>
      )}
    </div>
  );
}
