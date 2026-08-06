'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChatEffect { id: string; emojis: string[] }

// 메시지 효과 — 특정 키워드(사랑해/축하/ㅋㅋㅋ/눈/뽀뽀) 오면 이모지가 화면 가득 떠오름.
export default function ChatEffectLayer({ effect }: { effect: ChatEffect | null }) {
  const particles = useMemo(() => {
    if (!effect) return [];
    return Array.from({ length: 20 }, (_, i) => ({
      key: `${effect.id}-${i}`,
      emoji: effect.emojis[i % effect.emojis.length],
      x: 4 + ((i * 37) % 92),                 // 의사 랜덤 가로 분포
      delay: ((i * 53) % 60) / 100,
      dur: 1.7 + ((i * 29) % 100) / 100,
      size: 22 + ((i * 13) % 26),
      drift: (((i * 47) % 100) - 50) * 1.6,
      rot: (((i * 31) % 100) - 50) * 1.2,
    }));
  }, [effect]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[68] overflow-hidden">
      <AnimatePresence>
        {effect && particles.map((p) => (
          <motion.span
            key={p.key}
            className="absolute"
            style={{ left: `${p.x}%`, bottom: -48, fontSize: p.size }}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -560, x: p.drift, opacity: [0, 1, 1, 0], scale: 1, rotate: p.rot }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
