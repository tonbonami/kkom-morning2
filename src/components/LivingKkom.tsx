'use client';

// 살아있는 꼼이 — 홈 최상단 마스코트. ① 기분 비추기 ② 쓰다듬기(하트) ③ 선물함(두고 가기).
//   ⚠️ 절대 다그치지 않음(오늘의 조각 철학). 선물함 UI는 사이담의 위 탭 + 바둑판 시안을 이식.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion';
import { isTogetherNow, serverNow, type Presence } from '@/lib/presence';
import { throwHeart } from '@/lib/liveHearts';
import { giveGifts, giftSummary, subscribeGifts, clearGifts, giftsFor, giftById, giftImg, GIFT_STORAGES, MAX_GIFTS, giftPicksFor, type Gift, type GiftCat } from '@/lib/gifts';

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

  // ── 선물(두고 가기) — 최대 3개까지 쌓임(오래된→최신). 캡션 메시지는 '가장 최근' 것만. ──
  const [incoming, setIncoming] = useState<Gift[]>([]);
  useEffect(() => (me ? subscribeGifts(me, setIncoming) : undefined), [me]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<GiftCat | 'picks'>('picks');
  // 고른 소품 — 최대 3개, 같은 걸 여러 번 담을 수 있다(인형 3개). 칸을 오가도 유지된다.
  const [picks, setPicks] = useState<string[]>([]);
  const [fullHint, setFullHint] = useState(false);
  const addPick = (id: string) => {
    if (picks.length >= MAX_GIFTS) { setFullHint(true); setTimeout(() => setFullHint(false), 1500); return; }
    setPicks((p) => [...p, id]);
  };
  const removePickAt = (i: number) => setPicks((p) => p.filter((_, k) => k !== i));
  const closeSheet = () => { setSheetOpen(false); setTab('picks'); setPicks([]); };
  const [flying, setFlying] = useState<string[]>([]);
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

  // 선물 주기 — 고른 것 전부(최대 3) 한 번에. 날아가는 모션 + 토스트 + 상대 홈에 얹기 + (상대 오프라인이면) 알림 1번.
  const doGive = () => {
    if (!picks.length || !me) return;
    const summary = giftSummary(picks);
    const lastMsg = giftById(picks[picks.length - 1])?.msg ?? '';   // 받는 쪽 캡션도 '가장 최근(마지막)' 것
    setSheetOpen(false); setTab('picks');
    setFlying(picks.map(giftImg));
    setTimeout(() => setFlying([]), 1000);
    setToast(`${summary} 두고 왔어 🐾${lastMsg ? ` · ${lastMsg}` : ''}`);
    setTimeout(() => setToast(null), 2200);
    void giveGifts(me, picks);
    if (!isTogetherNow(presence)) {
      fetch('/api/bump', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: me, to: partner, kind: 'gift', item: summary, note: lastMsg }),
      }).catch(() => {});
    }
    setPicks([]);
  };
  const receive = () => { if (me) void clearGifts(me); setIncoming([]); };

  const items = giftsFor(partner);   // 상대가 받을 수 있는 소품(공통 + 상대 최애)
  const tabs: { id: GiftCat | 'picks'; title: string }[] = [
    { id: 'picks', title: '추천' },
    ...GIFT_STORAGES.filter((storage) => items.some((item) => item.cat === storage.id)),
  ];
  const shown = tab === 'picks'
    ? giftPicksFor(partner).map((id) => items.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => !!item)
    : items.filter((item) => item.cat === tab);
  const latest = incoming.length ? incoming[incoming.length - 1] : null;   // 가장 최근 선물
  const inGift = latest ? giftById(latest.item) : null;   // 캡션(메시지)은 이 최근 것만

  return (
    <>
      <div className="relative flex flex-col rounded-[22px] px-5 py-4 select-none [-webkit-touch-callout:none]"
        style={{ background: 'linear-gradient(135deg, #FFF6F0 0%, #FCEEF3 100%)', boxShadow: '0 6px 18px -12px rgba(180,100,120,0.28)' }}>
        {/* 쓰다듬기 영역 — 마스코트 + 문구 (윗줄) */}
        <div className="flex items-center gap-4 touch-none"
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
          </div>
          <div className="pointer-events-none min-w-0">
            <div className="text-[11px] font-extrabold tracking-[0.5px]" style={{ color: '#D98BA8' }}>꼼이Now</div>
            <div className="mt-1 text-[16px] font-bold leading-snug" style={{ color: 'var(--sd-ink)' }}>
              {justSent ? '❤️ 하트 보냈어!' : inGift ? inGift.msg : mood.caption}
            </div>
            {!inGift && (
              <div className="mt-0.5 text-[11.5px] font-semibold" style={{ color: 'var(--sd-faint)' }}>
                쓰다듬으면 하트가 가
              </div>
            )}
          </div>
        </div>

        {/* 받은 소품 — 마스코트/문구 '아래 별도 줄'에 크게 쫙 (우댕 피드백: 발치에 겹쳐 쌓으니 다 가려 안 보임).
            선물 있을 때만 이 줄이 생겨 카드가 커진다. 톡 누르면 전부 받기. */}
        <AnimatePresence>
          {incoming.length > 0 && latest && (
            <motion.button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); receive(); }}
              aria-label={`선물 ${incoming.length}개 받기`}
              className="pointer-events-auto flex items-center gap-3 self-stretch overflow-hidden rounded-2xl bg-white/55 px-3 py-2 active:scale-[0.985] transition"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
              <div className="flex shrink-0 items-end">
                {incoming.slice(-3).map((gift, idx) => (
                  <motion.img key={gift.nonce ?? idx} src={giftImg(gift.item)} alt=""
                    className="h-[58px] w-[58px] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)]"
                    style={{ marginLeft: idx === 0 ? 0 : -6 }}
                    initial={{ scale: 0, y: -10, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 22, delay: idx * 0.06 }} />
                ))}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[13px] font-extrabold" style={{ color: '#c94c7a' }}>{subjName(latest.from)}가 {incoming.length}개 뒀어 🎁</div>
                <div className="text-[11.5px] font-semibold" style={{ color: 'var(--sd-faint)' }}>톡 눌러서 받기 💗</div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

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
          {/* 선물함 — 위 칸 탭 + 소품 바둑판 + 바구니(사이담 2026-11-22 개편). */}
          <AnimatePresence>
            {sheetOpen && (
              <>
                <motion.div className="fixed inset-0 z-[80] bg-black/30"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSheet} />
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-[81] mx-auto flex h-[74vh] max-w-[480px] flex-col overflow-hidden rounded-t-[28px] border-t border-white/60 bg-white/90 backdrop-blur-xl"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 36 }}>
                  <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full" style={{ background: 'var(--sd-faint)' }} />
                  <div className="relative flex-1 overflow-hidden">
                    {/* 칸 6개를 두 단계로 열지 않고, 위 가로 탭과 아래 3열 바둑판으로 한 화면에 보인다. */}
                    <div className="flex h-full flex-col">
                      <div className="shrink-0 px-5 pt-2 text-center">
                        <div className="text-[17px] font-extrabold" style={{ color: 'var(--sd-ink)' }}>선물함 🎁</div>
                        <div className="mt-0.5 text-[12.5px]" style={{ color: 'var(--sd-muted)' }}>
                          {subjName(partner)}에게 뭘 두고 갈까? 한 번에 {MAX_GIFTS}개까지 · 같은 것도 여러 개
                        </div>
                      </div>
                      <div className="mt-3 flex shrink-0 gap-2 overflow-x-auto px-5 pb-1" role="tablist" style={{ scrollbarWidth: 'none' }}>
                        {tabs.map((item) => {
                          const selected = item.id === tab;
                          return (
                            <button key={item.id} role="tab" aria-selected={selected} onClick={() => setTab(item.id)}
                              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13.5px] font-bold transition active:scale-95 ${selected ? 'border-[#2E1D26] bg-[#2E1D26] text-white' : 'border-black/5 bg-white text-[#6E5457]'}`}>
                              {item.title}
                            </button>
                          );
                        })}
                      </div>
                      <div className={`flex-1 overflow-y-auto px-5 pt-5 ${picks.length ? 'pb-56' : 'pb-10'}`}>
                        <div className="grid grid-cols-3 gap-x-3 gap-y-9">
                          {shown.map((item) => {
                            const count = picks.filter((pick) => pick === item.id).length;
                            return (
                              <div key={item.id} className="relative flex flex-col items-center">
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => addPick(item.id)}
                                  aria-label={count ? `${item.label} ${count}개 담음 — 하나 더 담기` : `${item.label} 담기`}
                                  className={`relative grid aspect-square w-full place-items-center rounded-[20px] transition ${count ? 'bg-[#FB7BA8]/10 ring-2 ring-[#FB7BA8]' : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]'}`}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={giftImg(item.id)} alt="" className="h-[84%] w-[84%] object-contain" draggable={false} />
                                  {count > 0 && (
                                    <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-[#FB7BA8] px-1 text-[13px] font-extrabold text-white shadow-sm">{count}</span>
                                  )}
                                </motion.button>
                                <span className="mt-1.5 text-center text-[11px] font-medium leading-tight" style={{ color: 'var(--sd-muted)' }}>{item.label}</span>
                                <div className="pointer-events-none absolute -bottom-4 left-[-8%] h-px w-[116%]"
                                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.10), transparent)', opacity: 0.45 }} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 바구니 — 담은 것(최대 3칸, 같은 것 여러 번 가능) + 두고 오기. 수납장 목록·선반 어디서든 보인다.
                        칸을 누르면 하나씩 빠진다. */}
                    <AnimatePresence>
                      {picks.length > 0 && (
                        <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                          className="absolute inset-x-0 bottom-0 z-10 border-t border-black/5 bg-white/95 px-5 pt-3 backdrop-blur-xl"
                          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                          <div className="mb-2 flex items-center justify-center gap-2.5">
                            {Array.from({ length: MAX_GIFTS }, (_, i) => {
                              const id = picks[i];
                              return id ? (
                                <motion.button key={`${i}-${id}`} onClick={() => removePickAt(i)} aria-label={`${giftById(id)?.label ?? '선물'} 빼기`}
                                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.9 }}
                                  className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[#FB7BA8]/10 ring-1 ring-[#FB7BA8]/40">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={giftImg(id)} alt="" className="h-[82%] w-[82%] object-contain" />
                                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-bold shadow-sm" style={{ color: '#E0568F' }}>×</span>
                                </motion.button>
                              ) : (
                                <div key={`empty-${i}`} className="h-14 w-14 rounded-2xl border-2 border-dashed border-black/10" />
                              );
                            })}
                          </div>
                          <div className="mb-3 text-center text-[12.5px] font-bold" style={{ color: fullHint ? '#E0568F' : 'var(--sd-muted)' }}>
                            {fullHint ? `한 번에 ${MAX_GIFTS}개까지 담을 수 있어` : `“${giftById(picks[picks.length - 1])?.msg ?? ''}”`}
                          </div>
                          <button onClick={doGive}
                            className="h-14 w-full rounded-[20px] text-[16px] font-bold text-white transition active:scale-[0.98]"
                            style={{ background: '#FB7BA8', boxShadow: '0 8px 20px rgba(251,123,168,0.3)' }}>
                            {giftSummary(picks)} 살짝 두고 오기
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* 보내는 순간 — 고른 소품들이 살짝 시차를 두고 포물선 그리며 날아감 */}
          <AnimatePresence>
            {flying.map((src, i) => {
              const dx = (i - (flying.length - 1) / 2) * 64;
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <motion.img key={`fly-${i}`} src={src} alt=""
                  className="pointer-events-none fixed left-1/2 top-1/2 z-[82] -ml-10 -mt-10 h-20 w-20 drop-shadow-xl"
                  initial={{ x: dx, y: 0, scale: 0.5, opacity: 0 }}
                  animate={{ x: dx, y: [0, -40, -120], scale: [0.5, 1.2, 0.8], opacity: [0, 1, 0], rotate: [0, -10, 15] }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 1], delay: i * 0.08 }} />
              );
            })}
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
