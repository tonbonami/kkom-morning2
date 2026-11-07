// src/components/letter/LetterCornerBubbles.tsx
'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { ThoughtBubble } from './ThoughtBubble';

export interface LetterCornerBubblesProps {
  kkulSrc: string;
  kkomSrc: string;
  fromName: '우댕' | '꼼이';
}

export function LetterCornerBubbles({
  kkulSrc,
  kkomSrc,
  fromName,
}: LetterCornerBubblesProps) {
  const shouldReduceMotion = useReducedMotion();
  const isKkulSender = fromName === '우댕';

  // 보낸 사람 쪽을 약 8px 더 크게 (52px vs 60px)
  const kkulSize = isKkulSender ? 60 : 52;
  const kkomSize = isKkulSender ? 52 : 60;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 select-none"
      aria-hidden="true"
    >
      {/* 꿀됑: 왼쪽 위 귀퉁이에 반쯤 걸치고, 안쪽을 향함 */}
      <div
        className="absolute"
        style={{
          top: `-${Math.round(kkulSize * 0.36)}px`,
          left: `-${Math.round(kkulSize * 0.36)}px`,
        }}
      >
        <ThoughtBubble
          src={kkulSrc}
          size={kkulSize}
          tail="down-right"
          appear={!shouldReduceMotion}
        />
      </div>

      {/* 꼼이: 오른쪽 아래 귀퉁이에 반쯤 걸치고, 안쪽을 향함 */}
      <div
        className="absolute"
        style={{
          bottom: `-${Math.round(kkomSize * 0.36)}px`,
          right: `-${Math.round(kkomSize * 0.36)}px`,
        }}
      >
        <ThoughtBubble
          src={kkomSrc}
          size={kkomSize}
          tail="up-left"
          appear={!shouldReduceMotion}
        />
      </div>
    </div>
  );
}
