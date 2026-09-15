'use client';

// 살아있는 꼼이 — 홈 최상단 마스코트. 새 그림 없이 '지금 있는 움짤'을 기분으로 재활용.
//   ⚠️ 절대 다그치지 않음(오늘의 조각 철학): 스트릭·"N일째 조용" 없음. 지금 느낌만 존재로.
//   '살아있음'이 느껴지게 — ① 늘 미세하게 통통(idle) ② 탭하면 통 튀고 하트가 뿅 + 상대에게
//   라이브 하트 전송(쓰다듬기=애정) ③ 기분 바뀔 때 크로스페이드로 눈에 보이게.
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion';
import { isTogetherNow, serverNow, type Presence } from '@/lib/presence';
import { throwHeart } from '@/lib/liveHearts';

const V = 4;   // sai-anim 캐시 버전(EMO_V와 맞춤)
const emo = (name: string) => `/emo/sai-anim/${name}.webp?v=${V}`;

type Mood = { name: string; caption: string };

// ⚠️ 장면 카드(sunrise·peek·bed·rain·missyou = 배경 통째로 그려진 것)는 마스코트로 쓰지 않는다.
//    마스코트는 늘 '투명 캐릭터 꼼이'라야 한 인물로 읽힌다.
// 우선순위: 함께 > 아침 > 밤 > 방금 다녀감 > 각자의 시간. (전부 투명 캐릭터)
function moodFor(p: Presence, partner: string): Mood {
  if (isTogetherNow(p)) return { name: 'hug', caption: '지금 둘 다 여기 있어 💚' };
  const hour = new Date(serverNow() + 9 * 3600_000).getUTCHours();   // KST 시각
  if (hour >= 5 && hour < 10) return { name: 'yay', caption: '좋은 아침이야 ☀️' };
  if (hour >= 22 || hour < 5) return { name: 'night', caption: '고요한 밤이네' };
  const subj = partner === '우댕' ? '우댕이가' : '꼼이가';
  const lastMin = p.lastSeenAt ? (serverNow() - p.lastSeenAt.getTime()) / 60_000 : Infinity;
  if (lastMin < 120) return { name: 'doki', caption: `${subj} 방금 다녀갔어` };
  return { name: 'shy', caption: '지금은 각자의 시간' };
}

export default function LivingKkom({ presence, partner, me, tick }: {
  presence: Presence; partner: string; me: string; tick?: number;
}) {
  void tick;   // 부모 presenceTick(매분) → 재렌더로 기분 갱신
  const reduce = useReducedMotion();
  const mood = moodFor(presence, partner);
  const bounce = useAnimationControls();
  const [floats, setFloats] = useState<{ id: number; x: number }[]>([]);
  const [justSent, setJustSent] = useState(false);
  const seq = useRef(0);
  const sentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastSend = useRef(0);
  const lastPush = useRef(0);
  const lastPulse = useRef(0);
  const stroked = useRef(false);
  const down = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });
  const moved = useRef(0);

  const spawnHearts = (n: number) => {
    const arr = Array.from({ length: n }, (_, i) => ({ id: ++seq.current, x: [-18, 3, 21][i % 3] }));
    const ids = new Set(arr.map((a) => a.id));
    setFloats((f) => [...f, ...arr]);
    setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), 1250);
  };
  const flashSent = () => {
    setJustSent(true);
    if (sentTimer.current) clearTimeout(sentTimer.current);
    sentTimer.current = setTimeout(() => setJustSent(false), 1400);
  };
  // 하트 전송 — 쓰다듬는 동안 도배되지 않게 최소 간격(800ms).
  //   + 상대가 앱을 '지금 보고 있지 않으면'(라이브 하트가 안 닿음) 쓰담 알림(pet 범프)을 푸시.
  //     쓰담 세션당 1회만(60초 스로틀) — 100번 쓰다듬어도 알림은 한 번. 보고 있으면 안 보냄(하트로 충분).
  const sendHeart = () => {
    const now = Date.now();
    if (me && now - lastSend.current > 800) {
      lastSend.current = now;
      throwHeart(me).catch(() => {});
      try { (navigator as unknown as { vibrate?: (n: number) => void }).vibrate?.(14); } catch { /* noop */ }
    }
    if (me && !isTogetherNow(presence) && now - lastPush.current > 60_000) {
      lastPush.current = now;
      fetch('/api/bump', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: me, to: partner, kind: 'pet' }),
      }).catch(() => {});
    }
  };
  // 톡 — 크게 통통(점프+스쿼시+살짝 넘어감) + 하트 3개.
  const tap = () => {
    bounce.start({ scale: [1, 1.34, 0.9, 1.12, 1], y: [0, -18, 4, -7, 0], rotate: [0, -9, 7, -3, 0] },
      { duration: 0.62, ease: [0.34, 1.4, 0.5, 1] });
    spawnHearts(3); flashSent(); sendHeart();
  };
  // 쓰다듬기 한 번 — 작게 통 + 하트 1개(가로로 문지르면 빠르게 반복).
  const strokePulse = () => {
    bounce.start({ scale: [1, 1.16, 0.97, 1], y: [0, -8, 0] }, { duration: 0.34, ease: 'easeOut' });
    spawnHearts(1); flashSent(); sendHeart();
  };

  const onDown = (e: React.PointerEvent) => {
    down.current = true; stroked.current = false; moved.current = 0;
    lastPt.current = { x: e.clientX, y: e.clientY };
    // 포인터 캡처 — 손가락이 카드 밖(강아지 옆·위아래)으로 넘어가도 계속 쓰다듬기로 인식.
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!down.current) return;
    const dx = e.clientX - lastPt.current.x, dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };
    const d = Math.hypot(dx, dy);
    moved.current += d;
    // 방향 무관 — 문지르든 스와이프든, 3px+ 움직일 때마다 160ms 스로틀로 하트.
    const now = Date.now();
    if (d > 3 && now - lastPulse.current > 160) {
      lastPulse.current = now; stroked.current = true; strokePulse();
    }
  };
  const onUp = (e: React.PointerEvent) => {
    if (down.current && !stroked.current && moved.current < 8) tap();   // 움직임 거의 없으면 = 탭(크게)
    down.current = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  return (
    <motion.button onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      aria-label="꼼이 쓰다듬기"
      className="relative flex h-full w-full touch-none items-center gap-4 rounded-[22px] px-5 py-4 text-left outline-none select-none [-webkit-touch-callout:none]"
      style={{ background: 'linear-gradient(135deg, #FFF6F0 0%, #FCEEF3 100%)', boxShadow: '0 6px 18px -12px rgba(180,100,120,0.28)' }}>
      {/* ⚠️ 내부 요소는 pointer-events-none — iOS에서 <img>가 탭을 먹어 버튼 onClick이 안 불리는 것 방지 */}
      <div className="pointer-events-none relative shrink-0">
        {/* idle 통통 */}
        <motion.div
          animate={reduce ? undefined : { y: [0, -4, 0] }}
          transition={reduce ? undefined : { repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}>
          {/* 탭 바운스 */}
          <motion.div animate={bounce} className="h-[92px] w-[92px]">
            {/* 기분 전환 크로스페이드 */}
            <AnimatePresence mode="wait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img key={mood.name} src={emo(mood.name)} alt="꼼이"
                className="h-[92px] w-[92px] object-contain drop-shadow-sm"
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.82 }}
                transition={{ duration: 0.28 }} />
            </AnimatePresence>
          </motion.div>
        </motion.div>
        {/* 쓰다듬을 때 떠오르는 하트 */}
        <AnimatePresence>
          {floats.map((h) => (
            <motion.span key={h.id} className="pointer-events-none absolute left-[34px] top-2 text-[24px]"
              initial={{ y: 6, x: h.x, opacity: 0, scale: 0.4 }}
              animate={{ y: -54, x: h.x, opacity: [0, 1, 1, 0], scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}>❤️</motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none min-w-0">
        <div className="text-[10.5px] font-bold uppercase tracking-[2px]" style={{ color: '#D98BA8' }}>살아있는 꼼이</div>
        <div className="mt-1 text-[16px] font-bold leading-snug" style={{ color: 'var(--sd-ink)' }}>
          {justSent ? '❤️ 하트 보냈어!' : mood.caption}
        </div>
        <div className="mt-0.5 text-[11.5px] font-semibold" style={{ color: 'var(--sd-faint)' }}>쓰다듬으면 하트가 가</div>
      </div>
    </motion.button>
  );
}
