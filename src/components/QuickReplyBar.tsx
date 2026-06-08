'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

// Claude 참고: 'night'(잘자) 제거 + 'hug'(안아줘), 'whitening'(우댕꼼이 암호) 추가.
// 화이트닝 = 꼼이가 치아미백 약 발라서 하얘짐 → 둘만의 화이팅 구호.
type Kind = 'miss' | 'love' | 'hug' | 'kiss' | 'whitening';

const QUICK: { kind: Kind; emoji: string; label: string }[] = [
  { kind: 'miss',      emoji: '💚', label: '보고싶어' },
  { kind: 'love',      emoji: '❤️', label: '사랑해' },
  { kind: 'hug',       emoji: '🤗', label: '안아줘' },
  { kind: 'kiss',      emoji: '😘', label: '뽀뽀' },
  { kind: 'whitening', emoji: '😬', label: '화이트닝' },
];

const COOLDOWN_MS = 2500; // 클라이언트 스팸 가드

export default function QuickReplyBar({ me, partner }: { me: string; partner: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState(0);
  const [activeKind, setActiveKind] = useState<Kind | null>(null);

  const send = async (q: typeof QUICK[number]) => {
    const now = Date.now();
    if (now - lastSent < COOLDOWN_MS) {
      // 빠른 연타 무시
      return;
    }
    setLastSent(now);
    setActiveKind(q.kind);
    setToast(`${q.emoji} ${q.label} — ${partner}한테 보냈어!`);
    setTimeout(() => setToast(null), 2000);
    setTimeout(() => setActiveKind(null), 600);

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
      {/* 상단 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#10B981] text-white px-4 py-2.5 rounded-full font-bold text-[13px] shadow-[0_8px_24px_rgba(16,185,129,0.35)] z-50 flex items-center gap-2 max-w-[calc(100%-2rem)]"
          >
            <Check size={14} strokeWidth={3} />
            <span className="truncate">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-md w-full px-3 pb-safe pointer-events-none z-40">
        <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/60 px-2 py-2 mb-3 flex items-center justify-around pointer-events-auto">
          {QUICK.map((q) => {
            const isActive = activeKind === q.kind;
            return (
              <motion.button
                key={q.kind}
                whileTap={{ scale: 0.88 }}
                onClick={() => send(q)}
                animate={isActive ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-2xl active:bg-slate-50 transition-colors flex-1"
              >
                <span className="text-[24px] leading-none">{q.emoji}</span>
                <span className="text-[10px] font-bold text-slate-500 mt-1 whitespace-nowrap">{q.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}
