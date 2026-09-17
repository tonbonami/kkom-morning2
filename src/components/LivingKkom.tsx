'use client';

// 살아있는 꼼이 — 홈 최상단 마스코트. ① 기분 비추기 ② 쓰다듬기(하트) ③ 선물함(두고 가기).
//   ⚠️ 절대 다그치지 않음(오늘의 조각 철학). 선물함 UI는 Gemini 디자인 스펙 이식(수정0).
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion';
import { isTogetherNow, serverNow, type Presence } from '@/lib/presence';
import { throwHeart } from '@/lib/liveHearts';
import { giveGift, subscribeGift, clearGift, giftsFor, giftById, giftImg, GIFT_STORAGES, type Gift, type GiftCat } from '@/lib/gifts';

const V = 4;
const emo = (name: string) => `/emo/sai-anim/${name}.webp?v=${V}`;
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
  const [activeStorage, setActiveStorage] = useState<GiftCat | null>(null);   // 어느 수납장(냉장고/서랍/쿠폰/보물상자)을 연 상태인지
  const [picked, setPicked] = useState<string | null>(null);
  const closeSheet = () => { setSheetOpen(false); setActiveStorage(null); setPicked(null); };
  const [flying, setFlying] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // 오버레이를 body로 portal(아래 이유). SSR 하이드레이션 후에만.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    setSheetOpen(false); setActiveStorage(null);
    setFlying(giftImg(picked));
    setTimeout(() => setFlying(null), 850);
    setToast(`${g?.label ?? '선물'} 두고 왔어 🐾${g?.msg ? ` · ${g.msg}` : ''}`);
    setTimeout(() => setToast(null), 2200);
    void giveGift(me, picked);
    if (!isTogetherNow(presence)) {
      fetch('/api/bump', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: me, to: partner, kind: 'gift', item: g?.label ?? '선물', note: g?.msg ?? '' }),
      }).catch(() => {});
    }
    setPicked(null);
  };
  const receive = () => { if (me) void clearGift(me); setIncoming(null); };

  const items = giftsFor(partner);   // 상대가 받을 수 있는 소품(공통 + 상대 최애)
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
              {justSent ? '❤️ 하트 보냈어!' : inGift ? inGift.msg : mood.caption}
            </div>
            <div className="mt-0.5 text-[11.5px] font-semibold" style={{ color: 'var(--sd-faint)' }}>
              {inGift ? `${subjName(incoming!.from)}가 두고 갔어 · 톡 눌러서 받기 💗` : '쓰다듬으면 하트가 가'}
            </div>
          </div>
        </div>

        {/* 선물함 버튼 — 글래스, 우측 상단(쓰다듬기와 안 헷갈리게) */}
        <button onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }} aria-label="선물함"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/50 shadow-[0_4px_12px_rgba(251,123,168,0.15)] backdrop-blur-md transition-transform active:scale-95">
          <span className="text-[20px]">🎁</span>
        </button>
      </div>

      {/* ⚠️ 오버레이(모달·flying·토스트)는 반드시 body로 portal한다.
          홈 전체가 <main class="relative z-10"> 안이라, 여기서 아무리 fixed z-[80]을 줘도
          그 z-10 스태킹 컨텍스트에 갇힌다. 그럼 형제인 하단 이모티콘 바(fixed z-40)가
          모달·"두고 오기" 버튼을 덮어버려서 → 버튼 클릭이 이모티콘 바로 새고 선물이 안 감.
          portal로 컨텍스트를 탈출시켜야 z-index가 전역에서 먹힌다. */}
      {mounted && createPortal(
        <>
          {/* 선물함 — 수납장 컨셉(🧊냉장고·🗄️서랍·🎟️쿠폰·👑보물상자) 리디자인. 제미나이 스펙 이식 */}
          <AnimatePresence>
            {sheetOpen && (
              <>
                <motion.div className="fixed inset-0 z-[80] bg-black/30"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSheet} />
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-[81] flex h-[74vh] flex-col overflow-hidden rounded-t-[28px] border-t border-white/60 bg-white/90 backdrop-blur-xl"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 36 }}>
                  <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full" style={{ background: 'var(--sd-faint)' }} />
                  <div className="relative flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {!activeStorage ? (
                        /* ① 수납장 고르기 */
                        <motion.div key="menu"
                          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
                          className="h-full overflow-y-auto px-5 pb-8 pt-2">
                          <div className="mb-4 text-center">
                            <div className="text-[17px] font-extrabold" style={{ color: 'var(--sd-ink)' }}>선물함 🎁</div>
                            <div className="mt-0.5 text-[12.5px]" style={{ color: 'var(--sd-muted)' }}>{subjName(partner)}에게 뭘 두고 갈까?</div>
                          </div>
                          <div className="flex flex-col gap-3">
                            {GIFT_STORAGES.map((s) => {
                              const n = items.filter((i) => i.cat === s.id).length;
                              if (!n) return null;
                              return (
                                <button key={s.id} onClick={() => setActiveStorage(s.id)}
                                  className="flex items-center gap-4 rounded-[22px] border border-black/5 bg-white px-5 py-4 text-left shadow-sm transition active:scale-[0.98]">
                                  <span className="text-[30px] leading-none">{s.icon}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[16px] font-bold" style={{ color: 'var(--sd-ink)' }}>{s.title}</span>
                                    <span className="block text-[12px]" style={{ color: 'var(--sd-muted)' }}>{n}가지</span>
                                  </span>
                                  <span className="text-[15px]" style={{ color: 'var(--sd-faint)' }}>❯</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      ) : (
                        /* ② 수납장 안(선반) + ③ 선택 */
                        <motion.div key="detail"
                          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}
                          className="relative flex h-full flex-col">
                          <div className="flex shrink-0 items-center gap-2 px-4 pb-2">
                            <button onClick={() => { setActiveStorage(null); setPicked(null); }}
                              className="grid h-9 w-9 place-items-center rounded-full bg-black/5 text-[15px] active:scale-90" style={{ color: 'var(--sd-ink)' }}>❮</button>
                            <div className="text-[16px] font-extrabold" style={{ color: 'var(--sd-ink)' }}>
                              {GIFT_STORAGES.find((s) => s.id === activeStorage)?.icon} {GIFT_STORAGES.find((s) => s.id === activeStorage)?.title}
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto px-5 pb-40 pt-4">
                            <div className="grid grid-cols-3 gap-x-3 gap-y-9">
                              {items.filter((i) => i.cat === activeStorage).map((it) => {
                                const sel = picked === it.id;
                                return (
                                  <div key={it.id} className="relative flex flex-col items-center">
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPicked(it.id)} aria-label={it.label}
                                      className={`relative grid aspect-square w-full place-items-center rounded-[20px] transition ${sel ? 'bg-[#FB7BA8]/10 ring-2 ring-[#FB7BA8]' : 'border border-black/5 bg-white shadow-sm'}`}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={giftImg(it.id)} alt="" className="h-[84%] w-[84%] object-contain" />
                                      {sel && (
                                        <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#FB7BA8] text-[13px] text-white shadow-sm">✓</span>
                                      )}
                                    </motion.button>
                                    <span className="mt-1.5 text-[11px] font-medium" style={{ color: 'var(--sd-muted)' }}>{it.label}</span>
                                    {/* 유리 선반 느낌의 얇은 가로선 */}
                                    <div className="pointer-events-none absolute -bottom-4 left-[-8%] h-px w-[116%]" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.10), transparent)' }} />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {/* 선택 시 — 짧은 말 + 두고 오기 (하단에서 스프링 팝업) */}
                          <AnimatePresence>
                            {picked && (
                              <motion.div initial={{ y: 130 }} animate={{ y: 0 }} exit={{ y: 130 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                                className="absolute inset-x-0 bottom-0 border-t border-black/5 bg-white/95 px-5 pt-4 backdrop-blur-xl"
                                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                                <div className="mb-3 text-center">
                                  <span className="inline-block rounded-full bg-[#FB7BA8]/10 px-4 py-1.5 text-[13px] font-bold" style={{ color: '#E0568F' }}>
                                    &ldquo;{giftById(picked)?.msg}&rdquo;
                                  </span>
                                </div>
                                <button onClick={doGive}
                                  className="h-14 w-full rounded-[20px] text-[16px] font-bold text-white transition active:scale-[0.98]"
                                  style={{ background: '#FB7BA8', boxShadow: '0 8px 20px rgba(251,123,168,0.3)' }}>
                                  {giftById(picked)?.label} 살짝 두고 오기
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* 보내는 순간 — 소품이 포물선 그리며 날아감 */}
          <AnimatePresence>
            {flying && (
              // eslint-disable-next-line @next/next/no-img-element
              <motion.img src={flying} alt=""
                className="pointer-events-none fixed left-1/2 top-1/2 z-[82] h-20 w-20 -translate-x-1/2 -translate-y-1/2 drop-shadow-xl"
                initial={{ y: 0, scale: 0.5, opacity: 0 }}
                animate={{ y: [0, -40, -120], scale: [0.5, 1.2, 0.8], opacity: [0, 1, 0], rotate: [0, -10, 15] }}
                exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 1] }} />
            )}
          </AnimatePresence>

          {/* 토스트 */}
          <AnimatePresence>
            {toast && (
              <motion.div className="fixed bottom-24 left-1/2 z-[82] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-bold text-white shadow-lg"
                style={{ background: 'rgba(58,45,48,0.92)' }}
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body,
      )}
    </>
  );
}
