'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { haptic } from '@/lib/feedback';

// Claude 참고: 'night'(잘자) 제거 + 'hug'(안아줘), 'whitening'(우댕꼼이 암호) 추가.
// 화이트닝 = 꼼이가 치아미백 약 발라서 하얘짐 → 둘만의 화이팅 구호.
// emoji → 포차코 일러스트 5종으로 교체 (public/quickbar/{kind}.webp, 평균 3.5KB).
type Kind = 'miss' | 'love' | 'hug' | 'kiss' | 'whitening';

const QUICK: { kind: Kind; image: string; emoji: string; label: string }[] = [
  { kind: 'miss',      image: '/quickbar/miss.webp',      emoji: '💚', label: '보고싶어' },
  { kind: 'love',      image: '/quickbar/love.webp',      emoji: '❤️', label: '사랑해' },
  { kind: 'hug',       image: '/quickbar/hug.webp',       emoji: '🤗', label: '안아줘' },
  { kind: 'kiss',      image: '/quickbar/kiss.webp',      emoji: '😘', label: '뽀뽀' },
  { kind: 'whitening', image: '/quickbar/whitening.webp', emoji: '😬', label: '화이트닝' },
];

const COOLDOWN_MS = 2500; // 클라이언트 스팸 가드

export default function QuickReplyBar({ me, partner }: { me: string; partner: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState(0);
  const [activeKind, setActiveKind] = useState<Kind | null>(null);

  // 키보드 올라오면 hide — iOS Safari PWA fixed bottom이 키보드 영역 위로 떠오르거나 화면 중간에 박히는 버그 회피.
  // visualViewport API로 viewport 높이 변화 감지 (키보드 = viewport 줄어듦).
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const check = () => {
      const diff = window.innerHeight - vv.height;
      setKeyboardOpen(diff > 150); // 150px 이상 줄어들면 키보드 떴다고 판단
    };
    vv.addEventListener('resize', check);
    vv.addEventListener('scroll', check);
    check();
    return () => {
      vv.removeEventListener('resize', check);
      vv.removeEventListener('scroll', check);
    };
  }, []);

  const send = async (q: typeof QUICK[number]) => {
    const now = Date.now();
    if (now - lastSent < COOLDOWN_MS) {
      // 빠른 연타 무시
      return;
    }
    setLastSent(now);
    setActiveKind(q.kind);
    haptic(40);
    setToast(`${partner}한테 보냈어`);
    setTimeout(() => setToast(null), 1800);
    // 중앙 confirmation 애니메이션 시간(0.95s)에 맞춰 늘림
    setTimeout(() => setActiveKind(null), 950);

    try {
      await fetch('/api/bump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: me, to: partner, kind: q.kind }),
      });
    } catch {
      // 네트워크 에러는 조용히 — UX 망치지 않기
    }
  };

  return (
    <>
      {/* 화면 중앙 confirmation — 보낸 직후 큰 포차코 떠올라 사라짐 (사용자 요청: 시선 이동 없이 바로 확인) */}
      <AnimatePresence>
        {activeKind && (() => {
          const item = QUICK.find((q) => q.kind === activeKind);
          if (!item) return null;
          return (
            <motion.div
              initial={{ scale: 0.4, opacity: 0, y: 80 }}
              animate={{ scale: [0.4, 1.15, 1, 1], opacity: [0, 1, 1, 0], y: [80, 0, -10, -40] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.95, times: [0, 0.25, 0.7, 1], ease: 'easeOut' }}
              className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
            >
              <div className="flex flex-col items-center gap-3">
                <img
                  src={item.image}
                  alt=""
                  width={168}
                  height={168}
                  className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
                />
                <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-[0_10px_30px_rgba(15,23,42,0.18)] border border-white">
                  <p className="font-black text-[16px] text-slate-800 flex items-center gap-1.5">
                    <Check size={15} strokeWidth={3.5} className="text-emerald-500" />
                    {item.label} 보냈어!
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 상단 보조 토스트 — partner 이름 함께 (작게 유지) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#10B981] text-white px-4 py-2 rounded-full font-bold text-[12px] shadow-[0_8px_24px_rgba(16,185,129,0.35)] z-50 flex items-center gap-2 max-w-[calc(100%-2rem)]"
          >
            <Check size={12} strokeWidth={3} />
            <span className="truncate">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 고정 바 — transform 제거 (iOS PWA fixed positioning 충돌 회피),
          키보드 올라오면 hide (중간에 박히는 버그 회피) */}
      <div
        className={`fixed bottom-0 left-0 right-0 mx-auto max-w-md px-3 pb-safe pointer-events-none z-40 transition-transform duration-200 ${
          keyboardOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/60 px-1 py-1.5 mb-3 flex items-center justify-around pointer-events-auto">
          {QUICK.map((q) => {
            const isActive = activeKind === q.kind;
            return (
              <motion.button
                key={q.kind}
                whileTap={{ scale: 0.88 }}
                onClick={() => send(q)}
                animate={isActive ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-0 px-0.5 py-1 rounded-2xl active:bg-slate-50 transition-colors flex-1"
              >
                <img
                  src={q.image}
                  alt={q.label}
                  width={52}
                  height={52}
                  loading="lazy"
                  decoding="async"
                  className={q.kind === 'love' ? 'drop-shadow-sm pochacco-dance-heart' : 'drop-shadow-sm'}
                />
                <span className="text-[9px] font-black text-slate-600 whitespace-nowrap leading-none">{q.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}
