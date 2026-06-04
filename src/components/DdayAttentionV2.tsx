'use client';

/**
 * ⏱ TEMPORARY HINT — D-day 카드 어텐션. 24h 후 자동 안 뜸.
 * 코드는 영구 보존하지 마 — 우댕이 "이제 됐다" 하면 통째 삭제:
 *   1) 이 파일 삭제
 *   2) src/app/page.tsx 에서 DdayAttentionV2 import + 렌더 두 줄 삭제
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'kkom-dday-hint-first';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function DdayAttentionV2() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      if (!stored) {
        // 처음 본 경우 — 타임스탬프 기록 + 표시
        localStorage.setItem(STORAGE_KEY, String(now));
        setShow(true);
        return;
      }
      const timestamp = parseInt(stored, 10);
      if (!isNaN(timestamp) && now - timestamp < TTL_MS) {
        // 첫 진입 후 24시간 이내 — 계속 표시
        setShow(true);
      } else {
        // 24시간 지났음 — 영구 숨김
        setShow(false);
      }
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  // 싱크를 맞춘 애니메이션 (나타나서 잠시 머물다 사라지고, 1.5초 쉬기 반복)
  const animationProps = {
    animate: {
      opacity: [0, 1, 1, 0],
      y: [4, 0, 0, 4],
    },
    transition: {
      duration: 2.5,
      repeat: Infinity,
      repeatDelay: 1.5,
      times: [0, 0.15, 0.85, 1],
      ease: "easeInOut"
    }
  };

  const borderAnimationProps = {
    animate: {
      opacity: [0, 1, 1, 0],
      scale: [0.95, 1, 1, 0.95],
    },
    transition: {
      duration: 2.5,
      repeat: Infinity,
      repeatDelay: 1.5,
      times: [0, 0.15, 0.85, 1],
      ease: "easeInOut"
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none rounded-[inherit] z-20">
      {/* 1. 부드럽게 감싸는 에메랄드/핑크 테두리 펄스 */}
      <motion.div
        className="absolute inset-0 rounded-[inherit] border-[2px] border-[#FCA5A5]/60 shadow-[inset_0_0_12px_rgba(252,165,165,0.2)]"
        {...borderAnimationProps}
      />

      {/* 2. 우측 상단 귀여운 탭 유도 뱃지 (손가락 대신 하트와 텍스트) */}
      <motion.div
        className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-rose-50"
        {...animationProps}
      >
        <div className="relative flex items-center justify-center">
          <Heart size={12} className="text-[#FCA5A5] fill-[#FCA5A5]" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1.5 -right-1.5 text-[#FCD34D]"
          >
            <Sparkles size={10} fill="currentColor" />
          </motion.div>
        </div>
        <span className="text-[10px] font-black text-[#FCA5A5] tracking-wide mt-0.5 pr-0.5">
          Tap!
        </span>
      </motion.div>

      {/* 3. 중앙에서 은은하게 퍼지는 리플 효과 (선택적 시각 힌트) */}
      <motion.div
        className="absolute m-auto inset-0 w-12 h-12 rounded-full border-[1.5px] border-[#99E6D9]/50"
        animate={{
          scale: [0.5, 1.8],
          opacity: [0, 0.8, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: "easeOut",
        }}
      />
    </div>
  );
}
