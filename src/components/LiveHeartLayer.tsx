'use client';

// 라이브 하트 — 둘 다 접속 중일 때 화면 중앙에 큰 두근두근 하트.
// 탭하면 양방향 하트 폭탄 (인스타 라이브식). 내가 탭 → 내 화면 + 상대 화면 둘 다 터짐.

import { useEffect, useRef, useState } from 'react';
import { throwHeart, subscribeLiveHearts } from '@/lib/liveHearts';
import { haptic } from '@/lib/feedback';

interface Particle {
  id: number;
  x: number;      // 좌우 흩날림 (-50 ~ 50 vw 비율은 px로)
  drift: number;  // 상승 중 좌우 흔들림
  scale: number;
  rot: number;
  dur: number;    // 상승 시간
  hue: number;    // 색조 (핑크~빨강 범위)
}

let pidSeq = 0;

export default function LiveHeartLayer({ me, partnerActive }: { me: string; partnerActive: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [burst, setBurst] = useState(false); // 중앙 하트 눌렀을 때 살짝 커지는 반응
  const seenNonce = useRef<string | null>(null);

  // 폭탄 — n개의 하트를 바닥 중앙에서 위로 흩뿌림
  const bomb = (n: number) => {
    const next: Particle[] = [];
    for (let i = 0; i < n; i++) {
      next.push({
        id: ++pidSeq,
        x: (Math.random() - 0.5) * 160,
        drift: (Math.random() - 0.5) * 120,
        scale: 0.7 + Math.random() * 1.1,
        rot: (Math.random() - 0.5) * 80,
        dur: 1.6 + Math.random() * 1.2,
        hue: Math.random() * 40 - 10, // -10~30 (핑크~빨강)
      });
    }
    setParticles((prev) => {
      const merged = [...prev, ...next];
      // 성능 상한 — 너무 많으면 오래된 것 버림
      return merged.length > 80 ? merged.slice(merged.length - 80) : merged;
    });
  };

  const removeParticle = (id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  // 내가 하트 탭 — 던지기 + 내 화면 폭탄 + 햅틱
  const handleTap = () => {
    haptic([12, 20, 12]);
    setBurst(true);
    setTimeout(() => setBurst(false), 200);
    bomb(6);
    throwHeart(me);
  };

  // 상대가 던진 하트 수신 — 내 화면에서도 폭탄 (양방향)
  useEffect(() => {
    if (!me) return;
    const unsub = subscribeLiveHearts(me, (ping) => {
      // 첫 스냅샷(기존 doc)은 무시 — 마운트 시점 이후의 새 nonce만 폭탄
      if (seenNonce.current === null) { seenNonce.current = ping.nonce; return; }
      if (ping.nonce === seenNonce.current) return;
      seenNonce.current = ping.nonce;
      haptic(15);
      bomb(8);
    });
    return () => unsub();
  }, [me]);

  // 둘 다 접속 중일 때만 표시
  if (!partnerActive) {
    // 접속 끊겨도 날아가던 하트는 마저 보여주기 위해 particles만 렌더
    return (
      <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden>
        {particles.map((p) => (
          <HeartParticle key={p.id} p={p} onDone={() => removeParticle(p.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden>
      {/* 하트 폭탄 파티클 */}
      {particles.map((p) => (
        <HeartParticle key={p.id} p={p} onDone={() => removeParticle(p.id)} />
      ))}

      {/* 중앙 큰 두근두근 하트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <button
          onClick={handleTap}
          className="pointer-events-auto active:scale-95 transition-transform"
          aria-label="하트 보내기"
          style={{ filter: 'drop-shadow(0 12px 28px rgba(244,63,94,0.35))' }}
        >
          <svg
            width="150" height="150" viewBox="0 0 24 24"
            className={burst ? 'live-heart live-heart-burst' : 'live-heart'}
          >
            <defs>
              <linearGradient id="lh-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="55%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#E11D48" />
              </linearGradient>
            </defs>
            <path
              fill="url(#lh-grad)"
              d="M12 21s-6.7-4.35-9.33-8.02C1.1 10.7 1.5 7.6 3.9 6.1c1.9-1.2 4.3-.7 5.6.9L12 9.9l2.5-2.9c1.3-1.6 3.7-2.1 5.6-.9 2.4 1.5 2.8 4.6 1.23 6.88C18.7 16.65 12 21 12 21z"
            />
          </svg>
        </button>
        <p className="mt-1 text-[13px] font-black text-rose-500/90 bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none shadow-sm">
          지금 함께야 💕 톡 해봐
        </p>
      </div>
    </div>
  );
}

function HeartParticle({ p, onDone }: { p: Particle; onDone: () => void }) {
  return (
    <span
      onAnimationEnd={onDone}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '18%',
        fontSize: `${28 * p.scale}px`,
        // CSS 변수로 각 파티클 랜덤값 전달
        ['--x' as any]: `${p.x}px`,
        ['--drift' as any]: `${p.drift}px`,
        ['--rot' as any]: `${p.rot}deg`,
        animation: `heart-rise ${p.dur}s cubic-bezier(.35,.7,.5,1) forwards`,
        filter: `hue-rotate(${p.hue}deg) drop-shadow(0 3px 6px rgba(244,63,94,0.25))`,
        willChange: 'transform, opacity',
        pointerEvents: 'none',
      }}
    >
      ❤️
    </span>
  );
}
