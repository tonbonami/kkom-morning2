```ts
// src/lib/letterEnvelopes.ts

export type EnvelopePalette = {
  body: string; flap: string; lining: string;   // 봉투 몸통·덮개·안쪽 안감
  paperPreview: string;                          // 올라오는 내용 없는 종이 색(= 편지지 바탕과 같게)
  seal: string; sealInk: string;                 // 밀랍 도장(글자 없이 하트 압인)
  labelInk: string;                              // 봉투 앞 「From. 우댕」 글자색
};

export const ENVELOPE_BY_PAPER: Record<string, EnvelopePalette> = {
  // 살구 #F9E0D6
  peach: {
    body: '#F2D3C7',
    flap: '#E6C2B4',
    lining: '#FAF0EB',
    paperPreview: '#F9E0D6',
    seal: '#C55A4F',
    sealInk: '#7D2E24',
    labelInk: '#5C3E3A',
  },
  // 로즈 #F3D5DB
  rose: {
    body: '#ECC4CD',
    flap: '#DFB4BE',
    lining: '#FAF0F2',
    paperPreview: '#F3D5DB',
    seal: '#B85165',
    sealInk: '#782637',
    labelInk: '#57333B',
  },
  // 세이지 #D5E3D8
  sage: {
    body: '#C6D8CA',
    flap: '#B9CCBE',
    lining: '#EDF4EE',
    paperPreview: '#D5E3D8',
    seal: '#5B7966',
    sealInk: '#334D3D',
    labelInk: '#37453C',
  },
  // 코튼줄 #F6E6CA
  ruled: {
    body: '#EAD9BC',
    flap: '#DECBAA',
    lining: '#FAF5ED',
    paperPreview: '#F6E6CA',
    seal: '#A46944',
    sealInk: '#653B20',
    labelInk: '#4D3E33',
  },
  // 은하늘 #D5E2EC
  sky: {
    body: '#C4D5E2',
    flap: '#B6C8D6',
    lining: '#EEF4F8',
    paperPreview: '#D5E2EC',
    seal: '#516E87',
    sealInk: '#2C4254',
    labelInk: '#34404C',
  },
  // 꿀빛 #F8E7BE
  honey: {
    body: '#EEDAA8',
    flap: '#E1CC95',
    lining: '#FBF4E4',
    paperPreview: '#F8E7BE',
    seal: '#C47731',
    sealInk: '#7C4212',
    labelInk: '#52402A',
  },
};

export function envelopeFor(paperId?: string | null): EnvelopePalette {
  if (paperId && paperId in ENVELOPE_BY_PAPER) {
    return ENVELOPE_BY_PAPER[paperId];
  }
  return ENVELOPE_BY_PAPER.peach;
}
```

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
      {/* 꼬리 방울 1 */}
      <span
        style={{ width: dot1Size, height: dot1Size }}
        className={`absolute rounded-full bg-white/92 border border-[var(--sd-line)] shadow-sm ${TAIL_STYLES[tail].dot1}`}
      />
      {/* 꼬리 방울 2 */}
      <span
        style={{ width: dot2Size, height: dot2Size }}
        className={`absolute rounded-full bg-white/92 border border-[var(--sd-line)] shadow-sm ${TAIL_STYLES[tail].dot2}`}
      />

      {/* 메인 생각풍선 원형 */}
      <div className="w-full h-full rounded-full bg-white/92 border border-[var(--sd-line)] shadow-sm overflow-hidden flex items-center justify-center p-1.5">
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
    <div className="relative w-full max-w-md mx-auto pt-14 pb-8 px-4 select-none flex flex-col items-center justify-center">
      {/* 오른쪽 위 건너뛰기 단추 */}
      <div className="absolute top-2 right-4 z-30">
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
      <div className="relative w-full max-w-[330px] aspect-[1.5/1]">
        {/* 생각풍선: 꿀됑 (왼쪽 위) */}
        {bubbles === 'opening' && (
          <motion.div
            className="absolute -top-7 -left-3 z-20 will-change-transform"
            animate={
              isOpening
                ? {
                    opacity: [1, 1, 0],
                    scale: [1, 1, 0.9],
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.61, 0.95],
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
            className="absolute -bottom-7 -right-3 z-20 will-change-transform"
            animate={
              isOpening
                ? {
                    opacity: [1, 1, 0],
                    scale: [1, 1, 0.9],
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.61, 0.95],
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

        {/* 봉투 본체 및 내용 없는 종이 (3D 공간) */}
        <div
          style={{ perspective: 1000 }}
          className="relative w-full h-full"
        >
          {/* 올라오는 내용 없는 종이 */}
          <motion.div
            style={{
              backgroundColor: palette.paperPreview,
            }}
            animate={
              isOpening
                ? {
                    y: [0, 0, -118, -130],
                    scale: [1, 1, 1.02, 1.05],
                  }
                : { y: 0, scale: 1 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.31, 0.73, 1],
              ease: ['easeInOut', 'easeOut', 'easeInOut'],
            }}
            className="absolute inset-x-3.5 bottom-2 top-3 rounded-xl shadow-sm z-10 will-change-transform"
          />

          {/* 봉투 껍데기 래퍼: 종이가 올라온 뒤 아래로 빠지며 사라짐 */}
          <motion.div
            animate={
              isOpening
                ? {
                    opacity: [1, 1, 0],
                    y: [0, 0, 16],
                  }
                : { opacity: 1, y: 0 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.61, 1],
              ease: 'easeInOut',
            }}
            className="relative w-full h-full rounded-2xl overflow-visible will-change-transform"
          >
            {/* 봉투 뒷판 안감 */}
            <div
              style={{ backgroundColor: palette.lining }}
              className="absolute inset-0 rounded-2xl shadow-[var(--sd-shadow-card)]"
            />

            {/* 봉투 앞판 포켓 (V자 컷아웃 정적 클립패스) */}
            <div
              style={{
                backgroundColor: palette.body,
                clipPath: 'polygon(0 0, 50% 48%, 100% 0, 100% 100%, 0 100%)',
              }}
              className="absolute inset-0 rounded-b-2xl z-20 flex flex-col justify-end p-3.5"
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
            </div>

            {/* 3D 덮개 (상단 기준 회전) */}
            <motion.div
              style={{
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
              }}
              animate={
                isOpening
                  ? {
                      rotateX: [0, 0, -184, -180, -180],
                    }
                  : { rotateX: 0 }
              }
              transition={{
                duration: durationSec,
                times: [0, 0.14, 0.37, 0.41, 1],
                ease: 'easeInOut',
              }}
              className="absolute top-0 left-0 right-0 h-[52%] z-30 will-change-transform"
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
                {/* 밀랍 도장 (하트 압인) */}
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

              {/* 덮개 뒷면 (젖혀졌을 때 보이는 안감 면) */}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
```

6종 편지지와 어울리는 차분한 봉투 팔레트와 정밀한 생각풍선 컴포넌트를 설계했습니다.
성능 규칙에 맞춰 GPU 가속 속성(`transform`, `opacity`)만으로 버벅임 없는 3D 덮개 젖힘 및 종이 펼침 시퀀스를 구현했습니다.
`reducedMotion` 활성화 시 지연 없이 즉시 완료 처리되며 터치 영역 44px의 바로 열기 단추를 함께 배치했습니다.