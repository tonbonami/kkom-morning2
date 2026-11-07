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
  phase: OpeningPhase;          // closed: 닫힌 봉투, opening: 열기 순서 재생, opened: 미표시(null)
  fromName: Person;
  toName: Person;
  palette: EnvelopePalette;
  kkulSrc: string;              // 꿀됑 캐릭터 그림 (왼쪽 위)
  kkomSrc: string;              // 꼼이 캐릭터 그림 (오른쪽 아래)
  reducedMotion: boolean;
  durationMs?: number;          // 전체 연출 시간 (기본 700ms)
  bubbles?: 'opening' | 'none'; // 말풍선 표시 여부
  onSkip: () => void;           // 바로 열기
  onComplete: () => void;       // 연출 종료 콜백
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
    <div className="relative w-full max-w-md mx-auto pt-32 pb-8 px-4 select-none flex flex-col items-center justify-start">
      {/* 4. 오른쪽 위 단추: 종이가 솟아오를 때 부드럽게 페이드아웃 */}
      <motion.div
        className="absolute top-3 right-4 z-50 pointer-events-auto"
        animate={isOpening ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
        transition={{
          duration: durationSec,
          times: [0, 0.2, 0.42, 1],
          ease: 'easeOut',
        }}
      >
        <motion.button
          type="button"
          onClick={onSkip}
          whileTap={{ scale: 0.94 }}
          className="min-h-[44px] min-w-[44px] px-3.5 py-2 inline-flex items-center gap-1 rounded-full text-[13px] font-medium text-[var(--sd-muted)] bg-white/90 border border-[var(--sd-line)] shadow-sm"
        >
          <span>바로 열기</span>
          <ChevronRight size={15} className="text-[var(--sd-faint)]" />
        </motion.button>
      </motion.div>

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

        {/* 3. 생각풍선: 꼼이 (꼬리를 down-left로 변경해 우측 글씨 침범을 없애고 아래 여백으로 안전하게 배치) */}
        {bubbles === 'opening' && (
          <motion.div
            className="absolute -bottom-10 -right-6 z-40 will-change-transform"
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
              tail="down-left"
              appear={false}
            />
          </motion.div>
        )}

        {/* 3D 봉투 컨테이너 */}
        <div
          style={{ perspective: 1000 }}
          className="relative w-full h-full"
        >
          {/* 봉투 뒷판 안감 (z-0) */}
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

          {/* 1. 내용 없는 종이 (z-10 고정: 앞판 z-20 뒤에서 위로 솟아오름) */}
          <motion.div
            style={{ backgroundColor: palette.paperPreview }}
            animate={
              isOpening
                ? {
                    y: [0, 0, -108, -136],
                    scale: [1, 1, 1.02, 1.08],
                  }
                : { y: 0, scale: 1 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.31, 0.73, 1],
              ease: ['easeInOut', 'easeOut', 'easeInOut'],
            }}
            className="absolute inset-x-3.5 bottom-2 top-2 rounded-[28px] shadow-sm z-10 will-change-transform"
          />

          {/* 봉투 앞판 포켓 (z-20 고정: 종이를 가리며 봉투 하강 시 함께 사라짐) */}
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
              className="text-2xl leading-none font-bold tracking-wide select-none self-end mr-8"
            >
              From. {fromName}
            </span>
          </motion.div>

          {/* 1, 2. 3D 덮개 (초기 z-30 → 90도 젖혀지는 순간 z-0으로 즉시 전환) */}
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
                    zIndex: [30, 30, 0, 0],
                  }
                : { rotateX: 0, opacity: 1, y: 0, zIndex: 30 }
            }
            transition={{
              duration: durationSec,
              times: [0, 0.14, 0.38, 0.42, 1],
              ease: 'easeInOut',
              zIndex: {
                duration: durationSec,
                times: [0, 0.25, 0.26, 1],
                ease: 'linear',
              },
            }}
            className="absolute top-0 left-0 right-0 h-[50%] will-change-transform"
          >
            {/* 덮개 앞면 (닫혔을 때) */}
            <div
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute inset-0"
            >
              {/* 세모 덮개 바탕 */}
              <div
                style={{
                  backgroundColor: palette.flap,
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                }}
                className="absolute inset-0"
              />
              {/* 2. 밀랍 도장: 세모 clipPath 밖 형제로 분리해 원형 온전히 노출 */}
              <div
                style={{ backgroundColor: palette.seal }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full shadow-sm flex items-center justify-center pointer-events-none z-10"
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

            {/* 덮개 뒷면 (젖혀졌을 때 안감) */}
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
