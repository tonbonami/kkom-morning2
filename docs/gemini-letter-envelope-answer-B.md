```tsx
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
```

```tsx
// src/components/letter/UnopenedLetterCard.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Heart } from 'lucide-react';
import type { EnvelopePalette } from '@/lib/letterEnvelopes';

export interface UnopenedLetterCardProps {
  fromName: '우댕' | '꼼이';
  dateText: string;
  palette: EnvelopePalette;
  onOpen: () => void;
}

export function UnopenedLetterCard({
  fromName,
  dateText,
  palette,
  onOpen,
}: UnopenedLetterCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      className="w-full text-left rounded-[28px] p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4 transition-transform border border-[var(--sd-line)] shadow-[var(--sd-shadow-card)] min-h-[76px] cursor-pointer"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.78)',
      }}
      aria-label={`${fromName}에게서 온 편지 열기`}
    >
      {/* CSS 미니 봉투 도형 (내용 스포일러 없음) */}
      <div
        className="relative w-12 h-[34px] rounded-[7px] shrink-0 overflow-hidden shadow-sm"
        style={{
          backgroundColor: palette.body,
          boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
        aria-hidden="true"
      >
        {/* 접힌 덮개 (삼각형) */}
        <div
          className="absolute top-0 inset-x-0 h-[21px]"
          style={{
            backgroundColor: palette.flap,
            clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
          }}
        />

        {/* 덮개 끝 밀랍 하트 도장 */}
        <div
          className="absolute top-[13px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
          style={{ backgroundColor: palette.seal }}
        >
          <Heart
            className="w-2 h-2"
            style={{ color: palette.sealInk, fill: palette.sealInk }}
            strokeWidth={2.5}
          />
        </div>
      </div>

      {/* 안내 글 & 날짜 */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[16px] font-semibold text-[var(--sd-ink)] leading-snug truncate">
          {fromName}에게서 편지가 왔어요
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[12px] font-medium text-[var(--sd-rel)]">
            봉투를 열어 봐
          </span>
          <span className="text-[11px] text-[var(--sd-line)]">·</span>
          <span className="text-[12px] tabular-nums text-[var(--sd-cardlabel)] truncate">
            {dateText}
          </span>
        </div>
      </div>

      {/* 진입 화살표 아이콘 */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--sd-surface-2)] text-[var(--sd-faint)]"
        aria-hidden="true"
      >
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.button>
  );
}
```

- `LetterCornerBubbles`는 `pointer-events-none`과 52~60px의 알맞은 크기로 편지 본문 터치와 가독성을 해치지 않게 배치했습니다.
- `UnopenedLetterCard`는 정지 CSS 도형 미니 봉투와 44px 이상의 터치 타겟을 갖추어 내용 노출 없이 정갈하게 동작합니다.
- 모든 애니메이션은 GPU 가속 속성(`transform`, `opacity`)만 사용하며 `useReducedMotion`을 철저히 준수합니다.
