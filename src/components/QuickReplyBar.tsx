'use client';

import { useEffect, useRef, useState } from 'react';
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

// 탭 시 포차코 주위로 톡톡 터지는 반짝이 — 얼굴을 덮지 않게 둘레에만. 원 4 + 별(✦) 2.
// (GPT 디자인 스펙 통합, 수정0)
const SPARKLES: { x: number; y: number; size: number; delay: number; star?: boolean }[] = [
  { x: -19, y: -14, size: 4, delay: 0.0 },
  { x: 1, y: -22, size: 3, delay: 0.03, star: true },
  { x: 20, y: -11, size: 5, delay: 0.06 },
  { x: -23, y: 6, size: 3, delay: 0.04 },
  { x: 19, y: 12, size: 4, delay: 0.08, star: true },
  { x: 3, y: 20, size: 3, delay: 0.1 },
];

function Sparkles({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show &&
        SPARKLES.map((s, i) => (
          <motion.span
            key={i}
            className={`pointer-events-none absolute left-1/2 top-[26px] leading-none ${s.star ? 'text-[#EFCF77]' : 'rounded-full bg-[#FFE59A]'}`}
            style={s.star ? { fontSize: s.size + 6 } : { width: s.size, height: s.size }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{ x: s.x, y: s.y, scale: [0, 1.25, 0.8], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, delay: s.delay, ease: 'easeOut' }}
          >
            {s.star ? '✦' : null}
          </motion.span>
        ))}
    </AnimatePresence>
  );
}

export default function QuickReplyBar({ me, partner }: { me: string; partner: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState(0);
  const [activeKind, setActiveKind] = useState<Kind | null>(null);
  // 실제로 상대에게 나간 랜덤 중계 문구 — 보낸 사람도 독 위 영수증에서 본다
  const [sentPhrase, setSentPhrase] = useState<{ title: string; body: string } | null>(null);
  // 타이머 두 개를 ref로 붙든다 — 연타 시 앞 타이머가 새로 뜬 영수증/팝을 지우면 안 됨(사이담 ④).
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (dismissRef.current) clearTimeout(dismissRef.current);
    if (popRef.current) clearTimeout(popRef.current);
  }, []);
  const dismissReceipt = () => {
    if (dismissRef.current) clearTimeout(dismissRef.current);
    setSentPhrase(null);
  };

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
    // 독 버튼 팝/반짝이는 짧게만 — 연타 시 앞 타이머로 덮어쓰기.
    if (popRef.current) clearTimeout(popRef.current);
    popRef.current = setTimeout(() => setActiveKind(null), 1100);

    try {
      const res = await fetch('/api/bump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: me, to: partner, kind: q.kind }),
      });
      const j = await res.json().catch(() => ({} as { sent?: { title: string; body: string } }));
      if (res.ok && j?.sent?.title) {
        setSentPhrase(j.sent);
        // 영수증 유지 — 두 줄 한글을 읽을 시간. 연타 시 ref로 교체(앞 타이머가 새 영수증 못 지움).
        if (dismissRef.current) clearTimeout(dismissRef.current);
        dismissRef.current = setTimeout(() => setSentPhrase(null), 4500);
      }
    } catch {
      // 네트워크 에러는 조용히 — 독 버튼 팝은 이미 떴으니 UX 안 깨짐
    }
  };

  return (
    <>
      {/* 보낼 때 '가운데 크게' 포차코 축하 컷 — 글자 없이 그림만(텍스트는 아래 영수증이 전담).
          예전 2단계 혼란은 가운데에 문구까지 넣어서였음 → 이번엔 순수 비주얼. 팡 뜨고 ~1.1초 후 사라짐. */}
      <AnimatePresence>
        {activeKind && (() => {
          const item = QUICK.find((q) => q.kind === activeKind);
          if (!item) return null;
          return (
            <motion.div
              key={activeKind}
              initial={{ scale: 0.4, opacity: 0, y: 44 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotate: [0, -5, 4, 0] }}
              exit={{ scale: 0.85, opacity: 0, y: -16 }}
              transition={{
                scale: { type: 'spring', stiffness: 340, damping: 17 },
                y: { type: 'spring', stiffness: 340, damping: 17 },
                opacity: { duration: 0.15 },
                rotate: { duration: 0.7, ease: 'easeInOut' },
              }}
              className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" width={180} height={180}
                className="drop-shadow-[0_18px_36px_rgba(0,0,0,0.20)]" />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 보낸 확인 — 사이담식. 리액션 독 '바로 위'에 영수증 한 장. 실제로 나간 랜덤 중계 문구가 도착하면 3줄로 뜬다. */}
      <AnimatePresence>
        {sentPhrase && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed left-4 right-4 mx-auto max-w-md z-50 pointer-events-none bottom-[calc(104px+env(safe-area-inset-bottom))]"
          >
            <div
              onClick={dismissReceipt}
              role="button"
              aria-label="확인 닫기"
              className="pointer-events-auto cursor-pointer bg-white/[0.97] backdrop-blur-md rounded-[18px] px-4 py-3 shadow-[0_12px_32px_-10px_rgba(91,68,42,0.35)] border border-[#F0E4D5]"
            >
              <p className="font-extrabold text-[11.5px] text-emerald-600 flex items-center gap-1 mb-1">
                <Check size={12} strokeWidth={3.5} /> {partner}한테 보냈어
              </p>
              <p className="font-bold text-[14px] text-slate-800 leading-snug break-keep">{sentPhrase.title}</p>
              <p className="text-[12.5px] text-slate-500 break-keep mt-0.5">{sentPhrase.body}</p>
            </div>
          </motion.div>
        )}
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

      {/* 하단 고정 독 — "포차코 선반" (GPT 디자인 스펙 통합, 수정0).
          개별 버튼을 캡슐에 가두지 않고 크림색 선반 하나에 포차코 5마리를 진열.
          글래스/큰그림자 금지 — 포차코보다 독이 먼저 보이면 안 됨. 키보드 올라오면 hide. */}
      <div
        className={`fixed left-4 right-4 mx-auto max-w-md bottom-[calc(10px+env(safe-area-inset-bottom))] pointer-events-none z-40 transition-transform duration-200 ${
          keyboardOpen ? 'translate-y-[135%] opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="grid grid-cols-5 h-[84px] items-center rounded-[22px] border border-[#F0E4D5] bg-[#FFF9EF] px-2 py-2 shadow-[0_3px_12px_rgba(91,68,42,0.08),0_1px_2px_rgba(91,68,42,0.05)] pointer-events-auto">
          {QUICK.map((q) => {
            const isActive = activeKind === q.kind;
            return (
              <motion.button
                key={q.kind}
                whileTap={{ scale: 0.94 }}
                onClick={() => send(q)}
                aria-label={`${partner}한테 ${q.label} 보내기`}
                className="relative flex min-w-0 flex-col items-center justify-center rounded-[16px] py-1 select-none"
              >
                {/* 눌린 크림 얼룩 — 캡슐 아님, 포근한 얼룩이 잠깐 */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      className="absolute inset-[3px] -z-10 rounded-[15px] bg-[#FFF1DD]"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.9, 1, 1] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.42 }}
                    />
                  )}
                </AnimatePresence>
                <Sparkles show={isActive} />
                <motion.img
                  src={q.image}
                  alt={q.label}
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="h-[48px] w-[48px] object-contain drop-shadow-[0_2px_3px_rgba(120,95,60,0.22)]"
                  animate={isActive ? { scale: [1, 0.95, 1.08, 1], y: [0, 1, -3, 0] } : {}}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                />
                <span className="mt-[2px] whitespace-nowrap text-[11px] font-medium leading-none text-[#625950]">
                  {q.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}
