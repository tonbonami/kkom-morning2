'use client';

/**
 * ⏱ TEMPORARY HINT — 꼼이가 D-day 카드를 처음 한 번 눌러보게 유도하는 작은 손가락.
 *
 * 디바이스에 첫 진입 후 24시간 동안만 표시. 이후엔 영영 안 뜸.
 * 코드 보존하지 마 — 우댕이 "이제 됐다" 하면 통째 삭제:
 *   1) 이 파일 삭제
 *   2) src/app/page.tsx 에서 DdayHintFinger import + 렌더 두 줄 삭제
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'kkom-dday-hint-first';
const TTL_MS = 24 * 60 * 60 * 1000; // 24시간

export default function DdayHintFinger() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, String(now));
        setShow(true);
        return;
      }
      const first = parseInt(stored, 10);
      if (!Number.isFinite(first)) {
        setShow(true);
        return;
      }
      setShow(now - first < TTL_MS);
    } catch {
      // localStorage 막혀있으면 그냥 안 보여줌
    }
  }, []);

  if (!show) return null;

  return (
    <motion.div
      // 카드 안쪽에서 살랑살랑 (꾹꾹 누르는 모션)
      animate={{ y: [0, 4, 0] }}
      transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut' }}
      className="absolute top-7 left-1/2 -translate-x-1/2 pointer-events-none z-10"
      aria-hidden
    >
      <svg width="18" height="28" viewBox="0 0 28 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 손바닥(둥근 위) + 검지(아래로 내려옴) */}
        <path
          d="M3 13 Q3 4 14 4 Q25 4 25 13 L25 17 Q25 20 22 20 L17 20 L17 38 Q17 42 14 42 Q11 42 11 38 L11 20 L6 20 Q3 20 3 17 Z"
          fill="#FCD9B8"
          stroke="#475569"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* 양쪽 볼 블러쉬 — 귀엽게 */}
        <circle cx="9" cy="12" r="1.5" fill="#F87171" opacity="0.55" />
        <circle cx="19" cy="12" r="1.5" fill="#F87171" opacity="0.55" />
      </svg>
    </motion.div>
  );
}
