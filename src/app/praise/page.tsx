'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Gift,
  HeartHandshake,
  Send,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  PRAISE_STICKERS,
  addPraise,
  monthlyPraiseSummary,
  requestPraise,
  subscribePraise,
  totalPraiseCount,
  type PraiseItemView,
  type PraiseSticker,
  type PraiseStickerSheet,
  type PraiseUser,
} from '@/lib/praise';
import { nameFromCode, partnerOf, vocativeOf } from '@/lib/letters';
import { cn } from '@/lib/utils';

const MAX_STICKERS_PER_PRAISE = 10;
const STICKER_SETS: Array<{ id: PraiseStickerSheet; label: string }> = [
  { id: 'classic', label: '일반' },
  { id: 'pochacco', label: '포차코' },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function getSpritePosition(index = 0): string {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return `${col * 50}% ${row * 50}%`;
}

function StickerSprite({
  sticker,
  image,
  imageIndex,
  emoji,
  className,
}: {
  sticker?: PraiseSticker;
  image?: string;
  imageIndex?: number;
  emoji?: string;
  className?: string;
}) {
  const src = sticker?.image || image;
  const index = sticker?.imageIndex ?? imageIndex ?? 0;

  if (!src) {
    return <span className={cn('leading-none', className)}>{sticker?.emoji || emoji || '⭐'}</span>;
  }

  return (
    <span
      className={cn('block bg-no-repeat bg-[length:300%_300%]', className)}
      style={{
        backgroundImage: `url("${src}")`,
        backgroundPosition: getSpritePosition(index),
      }}
      aria-hidden="true"
    />
  );
}

function StickerRow({
  count,
  sticker,
  image,
  imageIndex,
  emoji,
}: {
  count: number;
  sticker?: PraiseSticker;
  image?: string;
  imageIndex?: number;
  emoji?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <motion.span
          key={index}
          initial={{ scale: 0, rotate: -18, y: 10 }}
          animate={{ scale: 1, rotate: index % 2 === 0 ? -4 : 5, y: 0 }}
          transition={{ delay: index * 0.035, type: 'spring', stiffness: 420, damping: 18 }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 overflow-hidden"
        >
          <StickerSprite
            sticker={sticker}
            image={image}
            imageIndex={imageIndex}
            emoji={emoji}
            className="h-full w-full"
          />
        </motion.span>
      ))}
    </div>
  );
}

export default function PraisePage() {
  const router = useRouter();
  const [me, setMe] = useState<PraiseUser | ''>('');
  const [items, setItems] = useState<PraiseItemView[]>([]);
  const [stickerSet, setStickerSet] = useState<PraiseStickerSheet>('classic');
  const [selectedSticker, setSelectedSticker] = useState<PraiseSticker>(PRAISE_STICKERS[0]);
  const [stickerCount, setStickerCount] = useState(3);
  const [reason, setReason] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [stampBurst, setStampBurst] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as PraiseUser);
    const unsub = subscribePraise(setItems);
    return () => unsub();
  }, [router]);

  const partner = me ? (partnerOf(me) as PraiseUser) : '';
  const receivedTotal = useMemo(() => me ? totalPraiseCount(items, me) : 0, [items, me]);
  const sentTotal = useMemo(() => me ? totalPraiseCount(items.filter((item) => item.from === me)) : 0, [items, me]);
  const royalCount = Math.floor(receivedTotal / 100);
  const months = useMemo(() => me ? monthlyPraiseSummary(items, me) : [], [items, me]);
  const thisMonth = months[0]?.count || 0;
  const timeline = items.slice(0, 30);
  const royalProgress = receivedTotal % 100;
  const nextRoyalLeft = royalProgress === 0 ? 100 : 100 - royalProgress;
  const visibleStickers = useMemo(
    () => PRAISE_STICKERS.filter((sticker) => sticker.sheet === stickerSet),
    [stickerSet]
  );

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  };

  const handlePraise = async () => {
    if (!me || sending) return;
    const text = reason.trim();
    if (!text) {
      showToast('칭찬 이유를 살짝 적어줘');
      return;
    }
    setSending(true);
    setStampBurst(true);
    setTimeout(() => setStampBurst(false), 700);
    try {
      await addPraise({
        from: me,
        reason: text,
        sticker: selectedSticker,
        stickerCount,
      });
      setReason('');
      showToast(`${vocativeOf(partner)} 칭찬 스티커 붙였어`);
    } catch (e) {
      console.error('칭찬 저장 실패:', e);
      showToast('칭찬 저장에 실패했어. 다시 해보자.');
    } finally {
      setSending(false);
    }
  };

  const handleRequest = async () => {
    if (!me || requesting) return;
    const text = requestReason.trim();
    if (!text) {
      showToast('뭘 칭찬받고 싶은지 적어줘');
      return;
    }
    setRequesting(true);
    try {
      await requestPraise({ from: me, reason: text });
      setRequestReason('');
      showToast(`${partner}한테 귀엽게 조르고 왔어`);
    } catch (e) {
      console.error('칭찬 조르기 실패:', e);
      showToast('칭찬 조르기 실패. 조금 뒤에 다시 해줘.');
    } finally {
      setRequesting(false);
    }
  };

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <div className="min-h-screen bg-[#F7F9F9] text-slate-800">
      <main className="max-w-md mx-auto px-5 pt-6 pb-12 space-y-5">
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-white/70 flex items-center justify-center text-slate-500 active:scale-95 transition"
            aria-label="홈으로"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black tracking-[0.18em] uppercase text-emerald-500">Praise Stickers</p>
            <h1 className="text-xl font-black tracking-tight">칭찬 스티커</h1>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Award size={18} />
          </div>
        </header>

        <section className="rounded-[30px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 shadow-[0_14px_36px_rgba(16,185,129,0.24)] overflow-hidden relative">
          <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-white/12" />
          <div className="absolute right-8 bottom-4 text-6xl opacity-20">🏅</div>
          <p className="text-xs font-bold text-emerald-50">내가 받은 칭찬</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-black leading-none">{receivedTotal}</span>
            <span className="pb-1 text-sm font-bold text-emerald-50">스티커</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-50">이번 달</p>
              <p className="text-lg font-black">{thisMonth}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-50">왕 칭찬</p>
              <p className="text-lg font-black">{royalCount}개</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-50">내가 준 것</p>
              <p className="text-lg font-black">{sentTotal}</p>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${receivedTotal % 100}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-bold text-emerald-50">
            다음 왕 칭찬까지 {nextRoyalLeft}개
          </p>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.05)] border border-white/70 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-emerald-500">붙여주기</p>
              <h2 className="text-lg font-black">{partner}에게 칭찬 스티커</h2>
            </div>
            <Sparkles size={20} className="text-amber-500" />
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[22px] bg-slate-50 p-1">
            {STICKER_SETS.map((set) => (
              <button
                key={set.id}
                onClick={() => {
                  setStickerSet(set.id);
                  setSelectedSticker(PRAISE_STICKERS.find((sticker) => sticker.sheet === set.id) || PRAISE_STICKERS[0]);
                }}
                className={cn(
                  'h-10 rounded-[18px] text-xs font-black transition-all',
                  stickerSet === set.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400'
                )}
              >
                {set.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {visibleStickers.map((sticker) => {
              const selected = selectedSticker.label === sticker.label;
              return (
                <motion.button
                  key={sticker.label}
                  whileTap={{ scale: 0.9, rotate: -6 }}
                  onClick={() => setSelectedSticker(sticker)}
                  className={cn(
                    'h-[104px] rounded-[22px] border flex flex-col items-center justify-center gap-1.5 transition-all overflow-hidden',
                    selected ? `${sticker.color} border-current shadow-sm` : 'bg-slate-50 border-slate-100 text-slate-500'
                  )}
                >
                  <StickerSprite sticker={sticker} className="h-16 w-16 drop-shadow-sm" />
                  <span className="text-[9px] font-black leading-tight px-1">{sticker.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="rounded-[24px] bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500">스티커 개수</span>
              <span className="text-sm font-black text-emerald-600">{stickerCount}개</span>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: MAX_STICKERS_PER_PRAISE }).map((_, index) => {
                const value = index + 1;
                const active = value <= stickerCount;
                return (
                  <motion.button
                    key={value}
                    whileTap={{ scale: 0.75, y: 2 }}
                    onClick={() => setStickerCount(value)}
                    className={cn(
                      'aspect-square rounded-xl text-sm transition-all',
                      active ? 'bg-white shadow-sm ring-1 ring-emerald-100' : 'bg-slate-100 grayscale opacity-45'
                    )}
                    aria-label={`${value}개`}
                  >
                    <StickerSprite sticker={selectedSticker} className="h-full w-full" />
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="relative rounded-[26px] bg-[#FFFDF7] border border-amber-100 p-4 min-h-[106px] overflow-hidden">
            <AnimatePresence>
              {stampBurst && (
                <motion.div
                  initial={{ scale: 1.4, rotate: -12, opacity: 0, y: -16 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1, y: 0 }}
                  exit={{ scale: 0.7, opacity: 0, y: 18 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 16 }}
                  className="absolute right-4 top-4 h-20 w-20 rounded-full bg-white/90 shadow-lg border border-amber-100 flex items-center justify-center overflow-hidden z-10"
                >
                  <StickerSprite sticker={selectedSticker} className="h-full w-full" />
                </motion.div>
              )}
            </AnimatePresence>
            <StickerRow sticker={selectedSticker} count={stickerCount} />
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="칭찬 이유를 적어줘. 예: 오늘 바쁜데도 나 챙겨줘서 고마워"
            className="w-full min-h-[96px] resize-none rounded-[24px] bg-slate-50 border border-slate-100 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-200"
            maxLength={160}
          />
          <button
            onClick={handlePraise}
            disabled={sending}
            className="w-full h-12 rounded-[24px] bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition"
          >
            <Send size={16} />
            칭찬 붙여주기
          </button>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.05)] border border-white/70 space-y-3">
          <div className="flex items-center gap-2">
            <HeartHandshake size={18} className="text-pink-500" />
            <h2 className="text-lg font-black">칭찬 조르기</h2>
          </div>
          <textarea
            value={requestReason}
            onChange={(e) => setRequestReason(e.target.value)}
            placeholder="나 이런 일 했으니까 칭찬해주세요오..."
            className="w-full min-h-[82px] resize-none rounded-[24px] bg-pink-50/70 border border-pink-100 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-200"
            maxLength={140}
          />
          <button
            onClick={handleRequest}
            disabled={requesting}
            className="w-full h-12 rounded-[22px] bg-pink-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition"
          >
            <Gift size={16} />
            귀엽게 조르기
          </button>
        </section>

        <section className="rounded-[30px] bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.05)] border border-white/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-teal-600" />
              <h2 className="text-lg font-black">달별 칭찬장</h2>
            </div>
            <Trophy size={18} className="text-amber-500" />
          </div>
          {months.length === 0 ? (
            <p className="text-sm font-bold text-slate-400 py-6 text-center">
              아직 받은 칭찬 스티커가 없어요
            </p>
          ) : (
            <div className="space-y-2">
              {months.slice(0, 8).map((month) => (
                <div key={month.key} className="rounded-2xl bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black">{month.label}</p>
                    <p className="text-[11px] font-bold text-slate-400">
                      왕 칭찬 {month.royalCount}개
                    </p>
                  </div>
                  <p className="text-lg font-black text-emerald-600">{month.count}개</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="px-1 text-lg font-black">최근 칭찬 기록</h2>
          {timeline.length === 0 ? (
            <div className="rounded-[28px] bg-white p-8 text-center text-sm font-bold text-slate-400">
              첫 칭찬 스티커를 붙여보자
            </div>
          ) : (
            timeline.map((item) => (
              <article key={item.id} className="rounded-[28px] bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)] border border-white/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black text-slate-400">
                      {formatDate(item.createdAt)} · {item.from} → {item.to}
                    </p>
                    <p className="mt-1 text-sm font-bold leading-relaxed">
                      {item.kind === 'request' ? '🥺 ' : ''}{item.reason}
                    </p>
                  </div>
                  {item.kind === 'request' ? (
                    <span className="shrink-0 rounded-full bg-pink-100 px-3 py-1 text-[10px] font-black text-pink-600">
                      칭찬해주세요
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">
                      {item.stickerEmoji} {item.stickerCount}
                    </span>
                  )}
                </div>
                {item.kind === 'praise' && (
                  <div className="mt-3">
                    <StickerRow
                      emoji={item.stickerEmoji}
                      image={item.stickerImage}
                      imageIndex={item.stickerImageIndex}
                      count={Math.min(10, item.stickerCount)}
                    />
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full font-bold text-[13px] shadow-[0_10px_28px_rgba(15,23,42,0.25)] z-50 max-w-[calc(100%-2rem)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
