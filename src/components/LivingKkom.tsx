'use client';

// 살아있는 꼼이 — 홈 최상단 마스코트. ① 기분 비추기 ② 쓰다듬기(하트) ③ 선물함(두고 가기).
//   ⚠️ 절대 다그치지 않음(오늘의 조각 철학). 선물함 UI는 Gemini 디자인 스펙 이식(수정0).
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion';
import { isTogetherNow, serverNow, type Presence } from '@/lib/presence';
import { throwHeart } from '@/lib/liveHearts';
import { giveGift, subscribeGift, clearGift, giftsFor, giftById, giftImg, type Gift, type GiftItem } from '@/lib/gifts';

const V = 4;
const emo = (name: string) => `/emo/sai-anim/${name}.webp?v=${V}`;
const CARE = new Set(['blanket', 'flower', 'cocoa', 'giftbox', 'umbrella']);
const subjName = (n: string) => (n === '우댕' ? '우댕이' : '꼼이');

type Mood = { name: string; caption: string };

// ⚠️ 장면 카드(sunrise·peek·bed…)는 마스코트로 안 씀 — 투명 캐릭터만.
function moodFor(p: Presence, partner: string): Mood {
  if (isTogetherNow(p)) return { name: 'hug', caption: '지금 둘 다 여기 있어 💚' };
  const hour = new Date(serverNow() + 9 * 3600_000).getUTCHours();
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
  void tick;
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

  // ── 선물(두고 가기) ──
  const [incoming, setIncoming] = useState<Gift | null>(null);
  useEffect(() => (me ? subscribeGift(me, setIncoming) : undefined), [me]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [flying, setFlying] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
  // 하트 전송(800ms) + 상대가 앱 안 보면 쓰담 알림(pet 범프, 세션당 60초 1회).
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
  const tap = () => {
    bounce.start({ scale: [1, 1.34, 0.9, 1.12, 1], y: [0, -18, 4, -7, 0], rotate: [0, -9, 7, -3, 0] },
      { duration: 0.62, ease: [0.34, 1.4, 0.5, 1] });
    spawnHearts(3); flashSent(); sendHeart();
  };
  const strokePulse = () => {
    bounce.start({ scale: [1, 1.16, 0.97, 1], y: [0, -8, 0] }, { duration: 0.34, ease: 'easeOut' });
    spawnHearts(1); flashSent(); sendHeart();
  };
  const onDown = (e: React.PointerEvent) => {
    down.current = true; stroked.current = false; moved.current = 0;
    lastPt.current = { x: e.clientX, y: e.clientY };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const onMove = (e: React.PointerEvent) => {
    if (!down.current) return;
    const dx = e.clientX - lastPt.current.x, dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };
    const d = Math.hypot(dx, dy);
    moved.current += d;
    const now = Date.now();
    if (d > 3 && now - lastPulse.current > 160) { lastPulse.current = now; stroked.current = true; strokePulse(); }
  };
  const onUp = (e: React.PointerEvent) => {
    if (down.current && !stroked.current && moved.current < 8) tap();
    down.current = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  // 선물 주기 — 날아가는 모션 + 토스트 + 상대 홈에 얹기 + (상대 오프라인이면) 알림.
  const doGive = () => {
    if (!picked || !me) return;
    const g = giftById(picked);
    setSheetOpen(false);
    setFlying(giftImg(picked));
    setTimeout(() => setFlying(null), 850);
    setToast(`${subjName(partner)}에게 ${g?.label ?? '선물'} 두고 왔어 🐾`);
    setTimeout(() => setToast(null), 2200);
    void giveGift(me, picked);
    if (!isTogetherNow(presence)) {
      fetch('/api/bump', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: me, to: partner, kind: 'gift', item: g?.label ?? '선물' }),
      }).catch(() => {});
    }
    setPicked(null);
  };
  const receive = () => { if (me) void clearGift(me); setIncoming(null); };

  const items = giftsFor(partner);
  const care = items.filter((i) => CARE.has(i.id));
  const foods = items.filter((i) => !CARE.has(i.id));
  const inGift = incoming ? giftById(incoming.item) : null;

  return (
    <>
      <div className="relative flex h-full items-center gap-4 rounded-[22px] px-5 py-4 select-none [-webkit-touch-callout:none]"
        style={{ background: 'linear-gradient(135deg, #FFF6F0 0%, #FCEEF3 100%)', boxShadow: '0 6px 18px -12px rgba(180,100,120,0.28)' }}>
        {/* 쓰다듬기 영역 — 마스코트 + 문구 */}
        <div className="flex flex-1 items-center gap-4 touch-none"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="pointer-events-none relative shrink-0">
            <motion.div
              animate={reduce ? undefined : { y: [0, -4, 0] }}
              transition={reduce ? undefined : { repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}>
              <motion.div animate={bounce} className="h-[92px] w-[92px]">
                <AnimatePresence mode="wait">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <motion.img key={mood.name} src={emo(mood.name)} alt="꼼이"
                    className="h-[92px] w-[92px] object-contain drop-shadow-sm"
                    initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.82 }} transition={{ duration: 0.28 }} />
                </AnimatePresence>
              </motion.div>
            </motion.div>
            <AnimatePresence>
              {floats.map((h) => (
                <motion.span key={h.id} className="pointer-events-none absolute left-[34px] top-2 text-[24px]"
                  initial={{ y: 6, x: h.x, opacity: 0, scale: 0.4 }}
                  animate={{ y: -54, x: h.x, opacity: [0, 1, 1, 0], scale: 1.2 }}
                  exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }}>❤️</motion.span>
              ))}
            </AnimatePresence>
            {/* 받은 소품 — 마스코트에 얹힘. 톡 누르면 고마워하고 사라짐 */}
            <AnimatePresence>
              {inGift && (
                <motion.button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); receive(); }}
                  className="pointer-events-auto absolute -bottom-1 -right-3 z-10"
                  aria-label={`${inGift.label} 받기`}
                  initial={{ scale: 0, y: 8, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, y: -18 }} whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={giftImg(incoming!.item)} alt={inGift.label} className="h-11 w-11 object-contain drop-shadow-md" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="pointer-events-none min-w-0">
            <div className="text-[11px] font-extrabold tracking-[0.5px]" style={{ color: '#D98BA8' }}>꼼이Now</div>
            <div className="mt-1 text-[16px] font-bold leading-snug" style={{ color: 'var(--sd-ink)' }}>
              {justSent ? '❤️ 하트 보냈어!' : inGift ? `${subjName(incoming!.from)}가 ${inGift.label} 두고 갔어` : mood.caption}
            </div>
            <div className="mt-0.5 text-[11.5px] font-semibold" style={{ color: 'var(--sd-faint)' }}>
              {inGift ? '톡 눌러서 받기 💗' : '쓰다듬으면 하트가 가'}
            </div>
          </div>
        </div>

        {/* 선물함 버튼 — 글래스, 우측 상단(쓰다듬기와 안 헷갈리게) */}
        <button onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }} aria-label="선물함"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/50 shadow-[0_4px_12px_rgba(251,123,168,0.15)] backdrop-blur-md transition-transform active:scale-95">
          <span className="text-[20px]">🎁</span>
        </button>
      </div>

      {/* 선물함 모달 — 바텀시트(글래스) */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div className="fixed inset-0 z-[55] bg-black/30"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheetOpen(false)} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[56] rounded-t-[28px] border-t border-white/60 bg-white/80 px-4 pt-3 backdrop-blur-xl"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 36 }}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full" style={{ background: 'var(--sd-faint)' }} />
              <div className="text-center text-[16px] font-extrabold" style={{ color: 'var(--sd-ink)' }}>선물함 🎁</div>
              <div className="mb-1 text-center text-[12px]" style={{ color: 'var(--sd-muted)' }}>{subjName(partner)}에게 하나 두고 오기</div>
              <div className="max-h-[52vh] overflow-y-auto pb-1">
                <GiftGroup title={`${subjName(partner)}가 좋아하는 것`} items={foods} picked={picked} onPick={setPicked} />
                <GiftGroup title="보살핌" items={care} picked={picked} onPick={setPicked} />
              </div>
              <button onClick={doGive} disabled={!picked}
                className="mt-3 h-14 w-full rounded-[20px] text-[16px] font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#FB7BA8', boxShadow: '0 8px 20px rgba(251,123,168,0.3)' }}>
                {picked ? `${giftById(picked)?.label} 두고 오기` : '하나 골라줘'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 보내는 순간 — 소품이 포물선 그리며 날아감 */}
      <AnimatePresence>
        {flying && (
          // eslint-disable-next-line @next/next/no-img-element
          <motion.img src={flying} alt=""
            className="pointer-events-none fixed left-1/2 top-1/2 z-[60] h-20 w-20 -translate-x-1/2 -translate-y-1/2 drop-shadow-xl"
            initial={{ y: 0, scale: 0.5, opacity: 0 }}
            animate={{ y: [0, -40, -120], scale: [0.5, 1.2, 0.8], opacity: [0, 1, 0], rotate: [0, -10, 15] }}
            exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 1] }} />
        )}
      </AnimatePresence>

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-bold text-white shadow-lg"
            style={{ background: 'rgba(58,45,48,0.92)' }}
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// 선물함 그룹 — 3열 라이트박스 셀. 선택 시 로즈 필.
function GiftGroup({ title, items, picked, onPick }: {
  title: string; items: GiftItem[]; picked: string | null; onPick: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <>
      <div className="mb-2 mt-3 px-1 text-[13px] font-semibold" style={{ color: 'var(--sd-muted)' }}>{title}</div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((it) => {
          const sel = picked === it.id;
          return (
            <button key={it.id} onClick={() => onPick(it.id)}
              className={`flex aspect-square flex-col items-center justify-center rounded-[20px] border transition active:scale-95 ${sel ? 'border-[#FB7BA8]/40' : 'border-transparent'}`}
              style={{ background: sel ? 'rgba(251,123,168,0.12)' : 'var(--sd-card)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={giftImg(it.id)} alt={it.label} className="h-[46px] w-[46px] object-contain" />
              <span className="mt-1 text-[11px] font-medium" style={{ color: 'var(--sd-ink)' }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
