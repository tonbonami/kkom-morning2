'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { throwHeart, subscribeLiveHearts } from '@/lib/liveHearts';
import { haptic } from '@/lib/feedback';

interface LiveHeartLayerProps {
  me: string;
  partnerActive: boolean;
}

type Ping = {
  from: string;
  nonce: string;
  at: Date | null;
  emoji: string;
};

type Particle = {
  id: string;
  emoji: string;
  startX: number;
  endX: number;
  scale: number;
  duration: number;
  rotation: number;
};

const EMOJI_MIX = ['❤️', '💕', '✨', '💗', '💖'];

export default function LiveHeartLayer({ me, partnerActive }: LiveHeartLayerProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const seenNonce = useRef<string | null>(null);

  // 하트 폭탄 생성 함수
  const triggerParticles = useCallback(() => {
    const count = Math.floor(Math.random() * 4) + 4; // 4~7개 생성
    const newParticles: Particle[] = Array.from({ length: count }).map(() => ({
      id: Math.random().toString(36).substring(2, 9),
      emoji: EMOJI_MIX[Math.floor(Math.random() * EMOJI_MIX.length)],
      startX: 30 + Math.random() * 40, // 화면 가로 30% ~ 70% 사이에서 출발
      endX: 10 + Math.random() * 80,   // 화면 가로 10% ~ 90% 사이로 퍼지며 상승
      scale: 0.8 + Math.random() * 0.8, // 0.8 ~ 1.6 크기
      duration: 2.5 + Math.random() * 1.5, // 2.5초 ~ 4초 체공
      rotation: (Math.random() - 0.5) * 60, // -30도 ~ 30도 회전
    }));

    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  // 구독 및 수신 처리
  useEffect(() => {
    let isFirst = true;

    const unsub = subscribeLiveHearts(me, (ping: Ping) => {
      // 1. 마운트 직후 첫 스냅샷(기존 doc)은 무시
      if (isFirst) {
        isFirst = false;
        seenNonce.current = ping.nonce;
        return;
      }

      // 2. 새로운 nonce가 올 때만 폭탄 + 진동
      if (ping.nonce && ping.nonce !== seenNonce.current) {
        seenNonce.current = ping.nonce;
        triggerParticles();
        haptic([12, 20, 12]); // 두근거리는 리듬
      }
    });

    return () => unsub();
  }, [me, triggerParticles]);

  // 중앙 하트 탭 핸들러
  const handleTap = useCallback(() => {
    haptic(15);
    triggerParticles();
    throwHeart(me);
  }, [me, triggerParticles]);

  // 파티클 애니메이션 종료 시 제거
  const removeParticle = useCallback((id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* 1. 파티클(하트 폭탄) 레이어 - partnerActive=false 여도 유지됨 */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              y: '50vh',
              x: `${p.startX}vw`,
              scale: p.scale * 0.2,
              opacity: 0,
              rotate: 0
            }}
            animate={{
              y: '-60vh',
              x: `${p.endX}vw`,
              scale: p.scale,
              opacity: [0, 1, 1, 0],
              rotate: p.rotation
            }}
            transition={{
              duration: p.duration,
              ease: [0.25, 1, 0.5, 1] // 부드러운 감속 이징
            }}
            onAnimationComplete={() => removeParticle(p.id)}
            className="absolute text-4xl select-none"
            style={{ textShadow: '0 4px 12px rgba(244, 63, 94, 0.4)' }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 2. 중앙 왕하트 레이어 - partnerActive=true 일 때만 표시 */}
      <AnimatePresence>
        {partnerActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative flex flex-col items-center justify-center pointer-events-auto"
          >
            {/* 글래스모피즘 상태 배지 */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-16 px-4 py-2 rounded-full shadow-lg border border-white/40 bg-white/30 backdrop-blur-md flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-sm font-bold text-rose-600 tracking-tight">
                지금 함께야 💕 톡 해봐
              </span>
            </motion.div>

            {/* 빛 번짐 배경 (Glow) */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-40 h-40 bg-rose-400/40 rounded-full blur-2xl"
            />

            {/* 인터랙티브 중앙 하트 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleTap}
              className="relative z-10 w-32 h-32 flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 rounded-full drop-shadow-[0_12px_24px_rgba(225,29,72,0.4)]"
            >
              {/* 맥동하는 심장 애니메이션 */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full h-full relative flex items-center justify-center"
              >
                {/* 커스텀 그라데이션 SVG 하트 */}
                <svg viewBox="0 0 24 24" className="w-28 h-28 drop-shadow-md">
                  <defs>
                    <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FB7185" />
                      <stop offset="50%" stopColor="#F43F5E" />
                      <stop offset="100%" stopColor="#E11D48" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#heartGradient)"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>

                {/* 반짝이 장식 (Sparkles) */}
                <motion.div
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8], rotate: [0, 45, 90] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="absolute top-2 right-2 text-yellow-300 text-xl pointer-events-none"
                >
                  ✨
                </motion.div>
                <motion.div
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 0.8], rotate: [90, 45, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                  className="absolute bottom-4 left-4 text-white/80 text-sm pointer-events-none"
                >
                  ✨
                </motion.div>
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
