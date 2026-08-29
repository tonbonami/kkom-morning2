'use client';

// 범프 독 — 사이담 BumpDock 구조 그대로(흰 종이 카드 + 라인 아이콘 + 스탬프 + 영수증).
// 꼼모닝 것만 유지: 5종(보고싶어/사랑해/안아줘/뽀뽀/화이트닝), fetch(from/to/kind), 키보드 올라오면 숨김.
// 설계(사이담): ①독은 손그림·푸시는 이모지 ②기록 안 남김, 보낸 직후 '무엇이 갔는지' 영수증
//   ③누를 때 가운데 큰 그림/반짝이 없음 — 버튼 자리에서 로더→체크 스탬프만.
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoaderCircle, Check } from 'lucide-react';
import { haptic } from '@/lib/feedback';

type Kind = 'miss' | 'love' | 'hug' | 'kiss' | 'whitening';
interface Item { kind: Kind; image: string; label: string }

// 포차코 손그림(ChatGPT 생성, public/quickbar). 흰 독 위에서 깨끗하게 읽히도록 가공(트림·정사각·헤이즈 정리).
const ITEMS: Item[] = [
  { kind: 'miss',      image: '/quickbar/miss.png',      label: '보고싶어' },
  { kind: 'love',      image: '/quickbar/love.png',      label: '사랑해' },
  { kind: 'hug',       image: '/quickbar/hug.png',       label: '안아줘' },
  { kind: 'kiss',      image: '/quickbar/kiss.png',      label: '뽀뽀' },
  { kind: 'whitening', image: '/quickbar/whitening.png', label: '화이트닝' },
];

interface Receipt { title: string; body: string }

export default function QuickReplyBar({ me, partner }: { me: string; partner: string }) {
  const [sending, setSending] = useState<Kind | null>(null);
  const [stamped, setStamped] = useState<Kind | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ 연타 시 앞 타이머가 새 영수증을 지운다 — 하나만 살려두고 갈아끼운다(사이담).
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armDismiss = (clear: (v: null) => void, ms: number) => {
    if (dismissRef.current) clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => clear(null), ms);
  };
  useEffect(() => () => { if (dismissRef.current) clearTimeout(dismissRef.current); }, []);

  // 키보드 올라오면 hide — iOS PWA fixed bottom이 키보드 위로 떠오르는 버그 회피(꼼모닝 전용).
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const check = () => setKeyboardOpen(window.innerHeight - vv.height > 150);
    vv.addEventListener('resize', check);
    vv.addEventListener('scroll', check);
    check();
    return () => { vv.removeEventListener('resize', check); vv.removeEventListener('scroll', check); };
  }, []);

  const send = async (it: Item) => {
    if (sending) return;                       // 연타로 두 번 가지 않게
    setSending(it.kind);
    setError(null);
    haptic(40);
    try {
      const res = await fetch('/api/bump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: me, to: partner, kind: it.kind }),
      });
      const j = await res.json().catch(() => ({} as { sent?: Receipt }));
      if (!res.ok) throw new Error();
      // '보냈어'까지만 — 서버 성공이 잠금화면 표시까지 보장하진 않는다.
      setStamped(it.kind);
      setReceipt(j?.sent ?? null);
      setTimeout(() => setStamped(null), 700);
      // 영수증의 랜덤 중계 문구가 이 기능의 핵심 — 두 줄 읽을 시간을 준다.
      armDismiss(setReceipt, 5200);
    } catch {
      setError('못 보냈어요. 한 번 더 눌러주세요.');
      armDismiss(setError, 3400);
    } finally {
      setSending(null);
    }
  };

  return (
    <>
      {/* 보낸 확인 — 리액션 독 '바로 위'에 종이 영수증 한 장. 실제로 나간 랜덤 문구가 3줄로. */}
      <AnimatePresence>
        {(receipt || error) && (
          <motion.div
            onClick={() => { if (dismissRef.current) clearTimeout(dismissRef.current); setReceipt(null); setError(null); }}
            role="button"
            aria-label="확인 닫기"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed left-4 right-4 z-50 mx-auto max-w-md px-4 py-3 cursor-pointer"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom) + 88px)',
              background: 'var(--sd-card-solid)',
              borderRadius: '18px 16px 20px 15px', // 살짝 비대칭인 종이 모서리
              boxShadow: '0 12px 30px -12px rgba(70,55,60,.4)',
            }}
          >
            {error ? (
              <p className="text-[13px] font-bold" style={{ color: 'var(--sd-crit)' }}>{error}</p>
            ) : (
              <>
                <p className="text-[11.5px] font-extrabold flex items-center gap-1 mb-1" style={{ color: 'var(--sd-rel)' }}>
                  <Check size={12} strokeWidth={3.5} /> {partner}한테 보냈어
                </p>
                <p className="text-[13.5px] font-bold leading-snug break-keep" style={{ color: 'var(--sd-ink)' }}>{receipt?.title}</p>
                <p className="text-[12.5px] mt-0.5 break-keep" style={{ color: 'var(--sd-muted)' }}>{receipt?.body}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 고정 독 — 흰 종이 카드 하나에 라인 아이콘 5개. 관계색은 눌렸을 때만 물든다. */}
      <div
        className={`fixed left-4 right-4 z-40 mx-auto max-w-md transition-transform duration-200 ${
          keyboardOpen ? 'translate-y-[135%] opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
      >
        {/* 마스킹테이프는 흔적일 뿐 — 작게 하나만 */}
        <span className="sd-tape absolute -top-[6px] left-1/2 -translate-x-1/2 w-[30px] h-[13px] rounded-[2px] -rotate-[4deg]" />
        <div
          className="grid gap-0.5 px-2 py-2"
          style={{
            gridTemplateColumns: `repeat(${ITEMS.length}, 1fr)`,
            background: 'var(--sd-card-solid)',
            borderRadius: '18px 16px 20px 15px',
            boxShadow: '0 1px 2px rgba(70,55,60,.05), 0 14px 32px -14px rgba(70,55,60,.38)',
          }}
        >
          {ITEMS.map((it) => {
            const busy = sending === it.kind;
            const done = stamped === it.kind;
            return (
              <button
                key={it.kind}
                onClick={() => send(it)}
                disabled={!!sending}
                aria-label={`${partner}한테 ${it.label} 보내기`}
                className="h-[66px] rounded-[15px] grid place-items-center transition-transform active:scale-[.92] disabled:opacity-45"
                style={done ? { background: 'var(--sd-rel-soft)', color: 'var(--sd-rel)' } : { color: 'var(--sd-ink)' }}
              >
                {busy ? (
                  <LoaderCircle size={20} className="animate-spin" style={{ color: 'var(--sd-faint)' }} />
                ) : done ? (
                  <Check size={24} strokeWidth={2.6} />
                ) : (
                  <span className="flex flex-col items-center gap-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image} alt={it.label} width={42} height={42}
                      className="h-[42px] w-[42px] object-contain" loading="lazy" decoding="async" draggable={false} />
                    <span className="text-[10px] font-bold leading-none truncate max-w-full" style={{ color: 'var(--sd-muted)' }}>
                      {it.label}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
