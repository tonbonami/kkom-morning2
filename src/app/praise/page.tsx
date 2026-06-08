'use client';

// 칭찬 다이어리 v3 — 우수♥민정 노트 영감.
// Phase 1: WebP + Firestore limit(30) + prefetch 제거 + 가벼운 motion (성능 가드)
// Phase 2: 다이어리 톤 (한 줄 = 한 칭찬, picker 18종 + 라벨 제거 + 손글씨 폰트 Gaegu, 조르기 통합, KPI 하단)
// 옛 데이터 호환: praise.ts의 normalizeStickerImage가 .png → .webp 자동 매핑, 라벨/색상 필드는 표시 안 하지만 모델에 유지.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, Send, Gift, Crown } from 'lucide-react';
import {
  PRAISE_STICKERS,
  addPraise,
  fetchPraiseTotals,
  requestPraise,
  subscribePraise,
  totalPraiseCount,
  type PraiseItemView,
  type PraiseSticker,
  type PraiseUser,
} from '@/lib/praise';
import { nameFromCode, partnerOf, vocativeOf } from '@/lib/letters';
import { cn } from '@/lib/utils';

type ViewMode = 'received' | 'sent';
type ComposerKind = 'praise' | 'request';

const QUICK_COUNTS = [1, 3, 5, 10, 20];

function getStoredUserName(raw: string): PraiseUser {
  const user = JSON.parse(raw) as {
    로그인코드?: string;
    code?: string;
    name?: string;
    이름?: string;
  };
  const code = user.로그인코드 || user.code;
  if (code) {
    const codeName = nameFromCode(code);
    if (codeName === '우댕' || codeName === '꼼이') return codeName;
  }
  const storedName = String(user.name || user.이름 || '').replace('꼼✌️', '꼼이');
  if (storedName.includes('우댕')) return '우댕';
  if (storedName.includes('꼼')) return '꼼이';
  return '꼼이';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

// Claude 참고: lazy-loading + 작은 placeholder. prefetch 폭탄 (useEffect로 18장 일괄 로드) 제거.
// 한 줄에 같은 src가 20번 깔려도 브라우저가 알아서 캐시함 → 네트워크 요청은 1번.
function StickerImage({
  src,
  emoji,
  size,
  className,
}: {
  src?: string;
  emoji?: string;
  size: number;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        className={cn('inline-flex items-center justify-center leading-none', className)}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.8) }}
        aria-hidden="true"
      >
        {emoji || '⭐'}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      width={size}
      height={size}
      className={cn('object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
}

// 한 칭찬의 스티커 행 — 개수에 따라 크기 자동 + 6개 이상은 겹쳐 찍기 (Gemini 리뷰 P1)
function StickerWrap({ src, emoji, count }: { src?: string; emoji?: string; count: number }) {
  if (count <= 0) return null;
  const size = count === 1 ? 84 : count <= 5 ? 40 : 32;
  const safeCount = Math.min(20, count);
  const overlap = count > 5; // 6개 이상이면 도장 겹쳐 찍기 모드
  return (
    <div className={cn('flex flex-wrap items-center', overlap ? 'gap-y-1' : 'gap-1.5')}>
      {Array.from({ length: safeCount }).map((_, i) => {
        // 짝/홀로 회전 갈라 — 손으로 막 찍은 듯
        const rot = overlap ? (i % 3 === 0 ? '-rotate-12' : i % 3 === 1 ? 'rotate-6' : '-rotate-3') : '';
        const yShift = overlap ? (i % 2 === 0 ? 'translate-y-0.5' : '-translate-y-0.5') : '';
        return (
          <StickerImage
            key={i}
            src={src}
            emoji={emoji}
            size={size}
            className={cn(
              'drop-shadow-sm transition-transform',
              overlap && i > 0 ? '-ml-2.5' : '',
              rot,
              yShift
            )}
          />
        );
      })}
      {count > safeCount && (
        <span className="text-xs font-bold text-slate-400 ml-1">+{count - safeCount}</span>
      )}
    </div>
  );
}

function PraiseRow({ item, me, index }: { item: PraiseItemView; me: PraiseUser; index: number }) {
  const isMine = item.from === me;
  const isRequest = item.kind === 'request';

  // 조르기 카드: 작은 노란 포스트잇 톤 (살짝 회전 + 테이프)
  if (isRequest) {
    const tilt = index % 2 === 0 ? '-rotate-1' : 'rotate-1';
    return (
      <article className={cn('relative rounded-[18px] bg-[#FFF8D9] px-4 py-3 ring-1 ring-amber-100 shadow-md', tilt)}>
        <div className="tape -top-2 left-1/2 -translate-x-1/2 w-14 -rotate-3 rounded-sm" />
        <p className="text-[11px] font-black text-amber-600">
          {formatDate(item.createdAt)} · 🥺 {item.from}가 칭찬을 졸랐어
        </p>
        <p className="font-handwriting mt-1 text-[17px] leading-snug text-slate-800">
          {item.reason}
        </p>
      </article>
    );
  }

  // 칭찬 카드: 흰 배경 80% + 노트 줄이 살짝 비침. 일부 카드에만 마스킹 테이프.
  const showTape = index % 3 === 0;
  const tapeSide = index % 2 === 0 ? 'left-4 -rotate-2' : 'right-5 rotate-2';

  return (
    <article className="relative rounded-[20px] bg-white/85 backdrop-blur-[2px] px-4 py-4 shadow-[0_3px_14px_rgba(15,23,42,0.04)] border border-white/60">
      {showTape && <div className={cn('tape -top-1.5 w-12 rounded-sm', tapeSide)} />}
      <StickerWrap src={item.stickerImage} emoji={item.stickerEmoji} count={item.stickerCount} />
      <p className="font-handwriting mt-3 text-[20px] leading-snug text-slate-800">
        {item.reason}
      </p>
      <p className="mt-2 text-[11px] font-bold text-slate-400">
        {formatDate(item.createdAt)} · {isMine ? `${vocativeOf(item.to)} 보낸 칭찬` : `${item.from}가 보낸 칭찬`}
      </p>
    </article>
  );
}

function Composer({
  me,
  partner,
  onSent,
}: {
  me: PraiseUser;
  partner: PraiseUser;
  onSent: () => void;
}) {
  const [kind, setKind] = useState<ComposerKind>('praise');
  const [reason, setReason] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<PraiseSticker>(PRAISE_STICKERS[0]);
  const [stickerCount, setStickerCount] = useState(1);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleSend = async () => {
    if (sending) return;
    const text = reason.trim();
    if (!text) {
      showToast(kind === 'praise' ? '칭찬 이유를 살짝 적어줘' : '뭘 칭찬받고 싶은지 적어줘');
      return;
    }
    setSending(true);
    try {
      if (kind === 'praise') {
        await addPraise({ from: me, reason: text, sticker: selectedSticker, stickerCount });
        showToast(`${vocativeOf(partner)} 칭찬 보냈어`);
      } else {
        await requestPraise({ from: me, reason: text });
        showToast(`${partner}한테 귀엽게 졸랐어`);
      }
      setReason('');
      setStickerCount(1);
      setOpen(false);
      onSent();
    } catch (e) {
      console.error(e);
      showToast('보내기 실패. 다시 해보자.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-[26px] bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)] border border-white/70 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 active:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <span className="font-black text-[15px]">
            {open ? '닫기' : `${vocativeOf(partner)} 한 줄 적기`}
          </span>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-slate-50">
          {/* kind 토글 */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 mt-3">
            <button
              onClick={() => setKind('praise')}
              className={cn(
                'h-10 rounded-xl text-xs font-black transition-all',
                kind === 'praise' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
              )}
            >
              💝 칭찬해주기
            </button>
            <button
              onClick={() => setKind('request')}
              className={cn(
                'h-10 rounded-xl text-xs font-black transition-all',
                kind === 'request' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400'
              )}
            >
              🥺 칭찬 조르기
            </button>
          </div>

          {/* 본문 */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              kind === 'praise'
                ? `${vocativeOf(partner)} 어떤 칭찬을 적어줄까`
                : '나 이런 일 했으니까 칭찬해주세요오...'
            }
            className={cn(
              'font-handwriting w-full min-h-[80px] resize-none rounded-2xl px-4 py-3 text-[19px] leading-snug outline-none focus:ring-2 transition',
              kind === 'praise'
                ? 'bg-slate-50 border border-slate-100 focus:ring-emerald-200'
                : 'bg-pink-50/70 border border-pink-100 focus:ring-pink-200'
            )}
            maxLength={160}
          />

          {/* 칭찬일 때만 스티커/개수 */}
          {kind === 'praise' && (
            <>
              {/* picker — 18장 한 그리드 */}
              <div className="grid grid-cols-6 gap-1.5">
                {PRAISE_STICKERS.map((s) => {
                  const selected = selectedSticker.image === s.image;
                  return (
                    <button
                      key={s.image}
                      onClick={() => setSelectedSticker(s)}
                      className={cn(
                        'aspect-square rounded-xl flex items-center justify-center transition-all',
                        selected
                          ? 'bg-emerald-50 ring-2 ring-emerald-400 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100'
                      )}
                      aria-label={s.label}
                    >
                      <StickerImage src={s.image} emoji={s.emoji} size={36} />
                    </button>
                  );
                })}
              </div>

              {/* 개수 빠른 칩 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-500">스티커 개수</span>
                  <span className="text-sm font-black text-emerald-600">{stickerCount}개</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {QUICK_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setStickerCount(n)}
                      className={cn(
                        'h-9 rounded-xl text-xs font-black transition-all',
                        stickerCount === n
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      {n === 1 ? '도장 1' : `× ${n}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 미리보기 */}
              <div className="rounded-2xl bg-[#FFFDF7] border border-amber-100 p-3 min-h-[80px] flex items-center justify-center">
                <StickerWrap src={selectedSticker.image} emoji={selectedSticker.emoji} count={stickerCount} />
              </div>
            </>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className={cn(
              'w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition',
              kind === 'praise'
                ? 'bg-slate-900 text-white'
                : 'bg-pink-500 text-white'
            )}
          >
            {kind === 'praise' ? <Send size={16} /> : <Gift size={16} />}
            {kind === 'praise' ? '칭찬 붙여주기' : '귀엽게 조르기'}
          </button>

          {toast && (
            <div className="text-center text-xs font-bold text-slate-500 pt-1">{toast}</div>
          )}
        </div>
      )}
    </section>
  );
}

export default function PraisePage() {
  const router = useRouter();
  const [me, setMe] = useState<PraiseUser | ''>('');
  const [feedItems, setFeedItems] = useState<PraiseItemView[]>([]);
  const [allItems, setAllItems] = useState<PraiseItemView[]>([]); // KPI 집계용
  const [view, setView] = useState<ViewMode>('received');

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setMe(getStoredUserName(userStr));
    // 피드: 최신 30개 실시간
    const unsub = subscribePraise(setFeedItems);
    // KPI: 1회 fetch (성능 가드 — onSnapshot은 30개만)
    fetchPraiseTotals().then(setAllItems);
    return () => unsub();
  }, [router]);

  // 칭찬 보낸 후 KPI 갱신을 위한 refresh
  const refreshTotals = () => {
    fetchPraiseTotals().then(setAllItems);
  };

  const partner = me ? (partnerOf(me) as PraiseUser) : '';
  const receivedTotal = me ? totalPraiseCount(allItems, me) : 0;
  const sentTotal = me ? totalPraiseCount(allItems.filter((x) => x.from === me)) : 0;
  const royalCount = Math.floor(receivedTotal / 100);
  const royalProgress = receivedTotal % 100;
  const nextRoyalLeft = royalProgress === 0 && receivedTotal > 0 ? 100 : 100 - royalProgress;

  const thisMonthCount = useMemo(() => {
    if (!me) return 0;
    const now = new Date();
    const yKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return allItems
      .filter((x) => x.kind === 'praise' && x.to === me)
      .filter((x) => {
        const k = `${x.createdAt.getFullYear()}-${String(x.createdAt.getMonth() + 1).padStart(2, '0')}`;
        return k === yKey;
      })
      .reduce((sum, x) => sum + x.stickerCount, 0);
  }, [allItems, me]);

  // 다이어리 피드 필터링
  const diaryItems = useMemo(() => {
    if (!me) return [];
    return feedItems.filter((x) => (view === 'received' ? x.to === me : x.from === me));
  }, [feedItems, me, view]);

  if (!me) return <div className="min-h-[100dvh] bg-[#FFFCF5] max-w-md mx-auto" />;

  return (
    <div className="min-h-[100dvh] bg-[#FFFCF5] text-slate-800 notebook-bg">
      <main className="max-w-md mx-auto px-5 pt-6 pb-safe-bottom space-y-5">
        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-white/70 flex items-center justify-center text-slate-500 active:scale-95 transition"
            aria-label="홈으로"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-handwriting text-[13px] text-emerald-500 tracking-wide">
              우댕 ♥ 꼼이 칭찬 일기
            </p>
            <h1 className="font-handwriting text-[24px] tracking-tight text-slate-800">
              칭찬 다이어리
            </h1>
          </div>
          {/* Gemini 리뷰 P1: 우측 왕관을 마이크로 KPI 배지로 교체 — 보상 루프 살림 */}
          <a
            href="#stats"
            className="h-10 px-2.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-1 text-amber-700 active:scale-95 transition"
            aria-label="통계 보기"
          >
            <Crown size={14} />
            <span className="text-[11px] font-black">{receivedTotal}</span>
          </a>
        </header>

        {/* 받은/쓴 토글 */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setView('received')}
            className={cn(
              'h-10 rounded-xl text-xs font-black transition-all',
              view === 'received' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
            )}
          >
            💌 받은 칭찬
          </button>
          <button
            onClick={() => setView('sent')}
            className={cn(
              'h-10 rounded-xl text-xs font-black transition-all',
              view === 'sent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
            )}
          >
            ✏️ 내가 쓴 칭찬
          </button>
        </div>

        {/* 작성 폼 (접힘) */}
        <Composer me={me} partner={partner as PraiseUser} onSent={refreshTotals} />

        {/* 다이어리 피드 */}
        <section className="space-y-4">
          {diaryItems.length === 0 ? (
            // Gemini 리뷰 P2: Empty State를 노란 포스트잇으로 — 글 쓰고 싶게 유도
            <div className="flex justify-center pt-4 pb-2">
              <div className="relative w-[260px] rotate-2 bg-[#FFF8D9] p-6 shadow-[0_8px_20px_rgba(180,140,0,0.12)] ring-1 ring-amber-100">
                <div className="tape -top-2 left-1/2 -translate-x-1/2 w-16 -rotate-3 rounded-sm" />
                <p className="font-handwriting text-[20px] text-amber-800 text-center leading-snug">
                  {view === 'received'
                    ? `오늘 ${partner}한테 칭찬받았으면 좋겠다 🥺`
                    : `${vocativeOf(partner as string)} 첫 칭찬을\n적어볼까 ✏️`}
                </p>
              </div>
            </div>
          ) : (
            diaryItems.map((item, idx) => <PraiseRow key={item.id} item={item} me={me} index={idx} />)
          )}
          {feedItems.length >= 30 && (
            <p className="text-center text-[11px] font-bold text-slate-400 pt-2">
              최근 30개만 표시 — 더 옛 칭찬은 통계에 합산돼 있어요
            </p>
          )}
        </section>

        {/* KPI 푸터 (강등) — 헤더 마이크로 KPI에서 스크롤 anchor */}
        <section id="stats" className="scroll-mt-4 rounded-[26px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 shadow-[0_14px_36px_rgba(16,185,129,0.18)] relative overflow-hidden">
          <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-white/12" />
          <p className="text-[11px] font-bold text-emerald-50">{me}가 받은 칭찬</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-3xl font-black leading-none">{receivedTotal}</span>
            <span className="pb-0.5 text-xs font-bold text-emerald-50">스티커</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-50">이번 달</p>
              <p className="text-base font-black">{thisMonthCount}</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-50">왕칭찬</p>
              <p className="text-base font-black">{royalCount}👑</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-50">내가 준 것</p>
              <p className="text-base font-black">{sentTotal}</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white" style={{ width: `${royalProgress}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] font-bold text-emerald-50">
            다음 왕칭찬까지 {nextRoyalLeft}개
          </p>
        </section>
      </main>
    </div>
  );
}
