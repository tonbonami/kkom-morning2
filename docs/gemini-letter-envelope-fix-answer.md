```tsx
// src/components/letter/ThoughtBubble.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ThoughtBubbleProps {
  src: string;                 // 캐릭터 그림(글씨 없는 상반신, 투명 배경)
  size: number;                // 풍선 지름 px (64~80)
  tail: 'down-right' | 'up-left' | 'down-left' | 'up-right';   // 꼬리 동그라미 2개가 향하는 쪽
  appear?: boolean;            // true 면 한 번 살짝 떠오르며 나타남(2~3px), false 면 정지
}

const TAIL_STYLES: Record<ThoughtBubbleProps['tail'], { dot1: string; dot2: string }> = {
  'down-right': {
    dot1: 'bottom-[4%] -right-[4%]',
    dot2: '-bottom-[12%] -right-[14%]',
  },
  'up-left': {
    dot1: 'top-[4%] -left-[4%]',
    dot2: '-top-[12%] -left-[14%]',
  },
  'down-left': {
    dot1: 'bottom-[4%] -left-[4%]',
    dot2: '-bottom-[12%] -left-[14%]',
  },
  'up-right': {
    dot1: 'top-[4%] -right-[4%]',
    dot2: '-top-[12%] -right-[14%]',
  },
};

export function ThoughtBubble({ src, size, tail, appear = false }: ThoughtBubbleProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = appear && !prefersReduced;

  const dot1Size = Math.max(7, Math.round(size * 0.13));
  const dot2Size = Math.max(5, Math.round(size * 0.08));

  return (
    <motion.div
      aria-hidden="true"
      initial={shouldAnimate ? { opacity: 0, y: 3 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{ width: size, height: size }}
      className="relative select-none pointer-events-none will-change-transform"
    >
      <span
        style={{ width: dot1Size, height: dot1Size }}
        className={`absolute rounded-full bg-white/[0.92] border border-[var(--sd-line)] shadow-sm ${TAIL_STYLES[tail].dot1}`}
      />
      <span
        style={{ width: dot2Size, height: dot2Size }}
        className={`absolute rounded-full bg-white/[0.92] border border-[var(--sd-line)] shadow-sm ${TAIL_STYLES[tail].dot2}`}
      />

      <div className="w-full h-full rounded-full bg-white/[0.92] border border-[var(--sd-line)] shadow-sm overflow-hidden flex items-center justify-center p-1.5">
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    </motion.div>
  );
}
```

```tsx
// src/components/letter/EnvelopeReveal.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Heart } from 'lucide-react';
import type { EnvelopePalette } from '@/lib/letterEnvelopes';
import { ThoughtBubble } from './ThoughtBubble';

type Person = '우댕' | '꼼이';
export type OpeningPhase = 'closed' | 'opening' | 'opened';

export interface EnvelopeRevealProps {
  phase: OpeningPhase;          // closed: 닫힌 봉투 → opening: 여는 순서 재생 → opened: 아무것도 안 그림(null)
  fromName: Person;
  toName: Person;
  palette: EnvelopePalette;
  kkulSrc: string;              // 꿀됑 그림 — 왼쪽 위
  kkomSrc: string;              // 꼼이 그림 — 오른쪽 아래
  reducedMotion: boolean;
  durationMs?: number;          // 여는 순서 전체 길이, 기본 700
  bubbles?: 'opening' | 'none'; // opening: 봉투와 같이 떴다가 같이 사라짐(기본). none: 안 그림
  onSkip: () => void;           // 오른쪽 위 「바로 열기」
  onComplete: () => void;       // 여는 순서가 끝나면 한 번
}

export function EnvelopeReveal({
  phase,
  fromName,
  palette,
  kkulSrc,
  kkomSrc,
  reducedMotion,
  durationMs = 700,
  bubbles = 'opening',
  onSkip,
  onComplete,
}: EnvelopeRevealProps) {
  const prefersReduced = reducedMotion || Boolean(useReducedMotion());

  useEffect(() => {
    if (phase !== 'opening') return;

    if (prefersReduced) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [phase, prefersReduced, durationMs, onComplete]);

  if (phase === 'opened' || (phase === 'opening' && prefersReduced)) {
    return null;
  }

  const durationSec = durationMs / 1000;
  const isOpening = phase === 'opening';

  const kkulSize = fromName === '우댕' ? 76 : 68;
  const kkomSize = fromName === '꼼이' ? 76 : 68;

  return (
    <div className="relative w-full max-w-md mx-auto pt-28 pb-8 px-4 select-none flex flex-col items-center justify-start">
      {/* 오른쪽 위 건너뛰기 단추 */}
      <div className="absolute top-3 right-4 z-50">
        <motion.button
          type="button"
          onClick={onSkip}
          whileTap={{ scale: 0.94 }}
          className="min-h-[44px] min-w-[44px] px-3.5 py-2 inline-flex items-center gap-1 rounded-full text-[13px] font-medium text-[var(--sd-muted)] bg-white/90 border border-[var(--sd-line)] shadow-sm"
        >
          <span>바로 열기</span>
          <ChevronRight size={15} className="text-[var(--sd-faint)]" />
        </motion.button>
      </div>

      {/* 봉투 및 캐릭터 배치 영역 */}
      <div className="relative w-full max-w-[330px] h-[196px]">
        {/* 생각풍선: 꿀됑 (왼쪽 위) */}
        {bubbles === 'opening' && (
          <motion.div
            className="absolute -top-7 -left-3 z-40 will-change-transform"
            animate={
              isOpening
                ? {
                    opacity: [1, 1, 0, 0],
                    scale: [1, 1, 0.9, 0.9],
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.61, 0.95, 1],
              ease: 'easeOut',
            }}
          >
            <ThoughtBubble
              src={kkulSrc}
              size={kkulSize}
              tail="down-right"
              appear={false}
            />
          </motion.div>
        )}

        {/* 생각풍선: 꼼이 (오른쪽 아래) */}
        {bubbles === 'opening' && (
          <motion.div
            className="absolute -bottom-6 -right-3 z-40 will-change-transform"
            animate={
              isOpening
                ? {
                    opacity: [1, 1, 0, 0],
                    scale: [1, 1, 0.9, 0.9],
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.61, 0.95, 1],
              ease: 'easeOut',
            }}
          >
            <ThoughtBubble
              src={kkomSrc}
              size={kkomSize}
              tail="up-left"
              appear={false}
            />
          </motion.div>
        )}

        {/* 3D 봉투 컨테이너: 단일 계층에서 z-index 관리 */}
        <div
          style={{ perspective: 1000 }}
          className="relative w-full h-full"
        >
          {/* 1. 봉투 뒷판 (안감) */}
          <motion.div
            style={{ backgroundColor: palette.lining }}
            animate={
              isOpening
                ? { opacity: [1, 1, 0, 0], y: [0, 0, 20, 20] }
                : { opacity: 1, y: 0 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.61, 0.95, 1],
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-2xl shadow-[var(--sd-shadow-card)] z-0 will-change-transform"
          />

          {/* 2. 내용 없는 종이 (닫혔을 땐 z-10, 덮개 젖혀진 뒤 z-35로 앞판·덮개 위로 부상 및 펼쳐짐) */}
          <motion.div
            style={{ backgroundColor: palette.paperPreview }}
            animate={
              isOpening
                ? {
                    y: [0, 0, -108, -136],
                    scale: [1, 1, 1.02, 1.08],
                    zIndex: [10, 10, 35, 35],
                  }
                : { y: 0, scale: 1, zIndex: 10 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.31, 0.73, 1],
              ease: ['easeInOut', 'easeOut', 'easeInOut'],
            }}
            className="absolute inset-x-3.5 bottom-2 top-2 rounded-[28px] shadow-sm will-change-transform"
          />

          {/* 3. 봉투 앞판 포켓 (z-20) */}
          <motion.div
            style={{
              backgroundColor: palette.body,
              clipPath: 'polygon(0 0, 50% 48%, 100% 0, 100% 100%, 0 100%)',
            }}
            animate={
              isOpening
                ? { opacity: [1, 1, 0, 0], y: [0, 0, 20, 20] }
                : { opacity: 1, y: 0 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.61, 0.95, 1],
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-b-2xl z-20 flex flex-col justify-end p-3.5 will-change-transform pointer-events-none"
          >
            <span
              style={{
                color: palette.labelInk,
                fontFamily: '"Dongle", sans-serif',
              }}
              className="text-2xl leading-none font-bold tracking-wide select-none self-end mr-1"
            >
              From. {fromName}
            </span>
          </motion.div>

          {/* 4. 3D 덮개 (초기 z-30 → 젖혀진 후 z-5로 이동) */}
          <motion.div
            style={{
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
            }}
            animate={
              isOpening
                ? {
                    rotateX: [0, 0, -188, -180, -180],
                    opacity: [1, 1, 1, 0, 0],
                    y: [0, 0, 0, 20, 20],
                    zIndex: [30, 30, 5, 5, 5],
                  }
                : { rotateX: 0, opacity: 1, y: 0, zIndex: 30 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.14, 0.38, 0.42, 1],
              ease: 'easeInOut',
            }}
            className="absolute top-0 left-0 right-0 h-[50%] will-change-transform"
          >
            {/* 덮개 앞면 (닫혔을 때) */}
            <div
              style={{
                backgroundColor: palette.flap,
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                backfaceVisibility: 'hidden',
              }}
              className="absolute inset-0"
            >
              <div
                style={{ backgroundColor: palette.seal }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full shadow-sm flex items-center justify-center pointer-events-none"
              >
                <Heart
                  size={15}
                  style={{
                    fill: palette.sealInk,
                    color: palette.sealInk,
                  }}
                  strokeWidth={1}
                />
              </div>
            </div>

            {/* 덮개 뒷면 (젖혀졌을 때 안감 면) */}
            <div
              style={{
                backgroundColor: palette.lining,
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                transform: 'rotateX(180deg)',
                backfaceVisibility: 'hidden',
              }}
              className="absolute inset-0"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
```

봉투 부품들을 단일 3D 컨테이너로 펼쳐 겹침 순서(뒷판 < 종이 < 앞판 < 덮개)를 바로잡고, 상단 여백(`pt-28`) 확보와 `rounded-[28px]` 편지지 크기 안착으로 화면 전환이 매끄럽게 이어집니다.
풍선 배경도 Tailwind 3.4에서 동작하는 `bg-white/[0.92]`로 고쳤습니다.