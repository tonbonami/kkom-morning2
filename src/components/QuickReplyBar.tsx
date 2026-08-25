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
  // 실제로 상대에게 나간 랜덤 중계 문구 — 보낸 사람도 중앙 연출에서 본다
  const [sentPhrase, setSentPhrase] = useState<{ title: string; body: string } | null>(null);

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
    setSentPhrase(null);
    haptic(40);
    // 중앙 연출 유지 시간 — 실제 중계 문구를 읽을 수 있게 넉넉히
    setTimeout(() => { setActiveKind(null); setSentPhrase(null); }, 2400);

    try {
      const res = await fetch('/api/bump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: me, to: partner, kind: q.kind }),
      });
      const j = await res.json().catch(() => ({} as { sent?: { title: string; body: string } }));
      if (res.ok && j?.sent?.title) setSentPhrase(j.sent);
    } catch {
      // 네트워크 에러는 조용히 — 중앙 연출은 이미 떴으니 UX 안 깨짐
    }
  };

  return (
    <>
      {/* 화면 중앙 confirmation — 보낸 직후 큰 포차코가 솟아올라 유지되다 사라짐.
          (사용자 요청: 시선 이동 없이 바로 확인 + 실제로 나간 랜덤 중계 문구를 여기서 보여준다) */}
      <AnimatePresence>
        {activeKind && (() => {
          const item = QUICK.find((q) => q.kind === activeKind);
          if (!item) return null;
          return (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 60 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-8"
            >
              <div className="flex flex-col items-center gap-3 w-full">
                <img
                  src={item.image}
                  alt=""
                  width={168}
                  height={168}
                  className="drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
                />
                <motion.div
                  layout
                  className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-[22px] shadow-[0_10px_30px_rgba(15,23,42,0.18)] border border-white max-w-[300px] text-center"
                >
                  <p className="font-extrabold text-[12px] text-emerald-600 flex items-center justify-center gap-1">
                    <Check size={13} strokeWidth={3.5} />
                    {partner}한테 보냈어
                  </p>
                  {sentPhrase ? (
                    <>
                      <p className="font-bold text-[14px] text-slate-800 leading-snug break-keep mt-1">{sentPhrase.title}</p>
                      <p className="text-[12.5px] text-slate-500 break-keep mt-0.5">{sentPhrase.body}</p>
                    </>
                  ) : (
                    <p className="font-black text-[15px] text-slate-800 mt-0.5">{item.label}!</p>
                  )}
                </motion.div>
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
