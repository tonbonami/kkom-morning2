'use client';

// "매일매일 꼼모닝" — 오늘 우리 둘 사이에 무슨 일이 있었는지 한 줄 요약 헤더.
// Mad-libs 스타일 (Gemini 시안 P0) — 발생한 이벤트를 형광펜 칩처럼 문장 안에 박음.
// dailyStats/{YYYY-MM-DD} 문서 1회 listen → 1 read로 모든 카운트.

import { useEffect, useState } from 'react';
import { subscribeTodayStats, type DailyStats } from '@/lib/dailyStats';
import { cn } from '@/lib/utils';

type Sender = '우댕' | '꼼이';
type Tone = 'pink' | 'emerald' | 'amber' | 'rose';

interface Chip {
  emoji: string;
  text: string;
  highlight: boolean;
  tone: Tone;
}

const TONE_CLASS: Record<Tone, string> = {
  pink: 'bg-pink-100 text-pink-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
};

// Claude 참고: Gemini 룰
// - 0인 항목은 무조건 숨김
// - 우선순위: partner의 애정 표현(보고싶다/사랑해/뽀뽀) > 편지 > 칭찬 > 추억 > 위시 > 내 활동
// - 5+ (또는 종류별 임계) 시 highlight (폰트 키움)
// - 상위 4개만 (문장 길어지지 않게)
function buildChips(stats: DailyStats, me: Sender, partner: Sender): Chip[] {
  const chips: Chip[] = [];

  // partner의 애정 표현 (가장 감동적)
  const pMiss = stats.bumps.miss[partner];
  if (pMiss > 0) chips.push({
    emoji: '💚',
    text: `${pMiss}번 보고싶댔어`,
    highlight: pMiss >= 5,
    tone: 'emerald',
  });

  const pLove = stats.bumps.love[partner];
  if (pLove > 0) chips.push({
    emoji: '❤️',
    text: `${pLove}번 사랑한대`,
    highlight: pLove >= 5,
    tone: 'rose',
  });

  const pHug = stats.bumps.hug[partner];
  if (pHug > 0) chips.push({
    emoji: '🤗',
    text: `안아달랬어 ${pHug}번`,
    highlight: pHug >= 3,
    tone: 'rose',
  });

  const pKiss = stats.bumps.kiss[partner];
  if (pKiss > 0) chips.push({
    emoji: '😘',
    text: `뽀뽀 ${pKiss}번`,
    highlight: pKiss >= 3,
    tone: 'pink',
  });

  const pWhitening = stats.bumps.whitening[partner];
  if (pWhitening > 0) chips.push({
    emoji: '😬',
    text: `화이트닝 ${pWhitening}번`,
    highlight: false,
    tone: 'amber',
  });

  // 'night'(잘자)는 v3에서 QuickReplyBar에서 제거됐지만 옛 데이터 호환 위해 표시 유지
  const pNight = stats.bumps.night[partner];
  if (pNight > 0) chips.push({
    emoji: '🌙',
    text: `잘 자 ${pNight}번`,
    highlight: false,
    tone: 'pink',
  });

  // partner가 보낸 편지
  const pLetter = stats.letters[partner];
  if (pLetter > 0) chips.push({
    emoji: '💌',
    text: `편지 ${pLetter}통`,
    highlight: pLetter >= 2,
    tone: 'amber',
  });

  // partner가 준 칭찬
  const pPraise = stats.praiseStickers[partner];
  if (pPraise > 0) chips.push({
    emoji: '✨',
    text: `칭찬 ${pPraise}개`,
    highlight: pPraise >= 5,
    tone: 'emerald',
  });

  const pReq = stats.praiseRequests[partner];
  if (pReq > 0) chips.push({
    emoji: '🥺',
    text: `${partner}가 칭찬 졸랐어`,
    highlight: false,
    tone: 'pink',
  });

  // 둘이 합친 거
  const memories = stats.memories.우댕 + stats.memories.꼼이;
  if (memories > 0) chips.push({
    emoji: '📸',
    text: `추억 ${memories}장`,
    highlight: false,
    tone: 'amber',
  });

  const wishes = stats.wishItems.우댕 + stats.wishItems.꼼이;
  if (wishes > 0) chips.push({
    emoji: '🛒',
    text: `위시 ${wishes}개`,
    highlight: false,
    tone: 'emerald',
  });

  // 내가 보낸 거 (자랑) — partner 항목들로 다 채워졌으면 안 들어감
  const myMiss = stats.bumps.miss[me];
  if (myMiss > 0 && chips.length < 4) chips.push({
    emoji: '💚',
    text: `나도 ${myMiss}번 보고싶었어`,
    highlight: false,
    tone: 'emerald',
  });

  return chips.slice(0, 4);
}

export default function DailyPiecesHeader({ me }: { me: Sender }) {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const partner: Sender = me === '우댕' ? '꼼이' : '우댕';

  useEffect(() => {
    const unsub = subscribeTodayStats(setStats);
    return () => unsub();
  }, []);

  // 첫 로드 placeholder (높이 유지하지 않음 — 데이터 빨리 옴)
  if (!stats) return null;

  const chips = buildChips(stats, me, partner);
  const isEmpty = chips.length === 0;

  return (
    <section className="relative bg-[#FFFDF7] border border-amber-100/80 rounded-2xl px-4 py-4 shadow-[2px_3px_0px_rgba(0,0,0,0.04)] -rotate-[0.5deg]">
      {/* 상단 마스킹 테이프 */}
      <div className="tape absolute -top-2 left-1/2 -translate-x-1/2 w-14 rotate-2" />

      <div className="flex items-baseline justify-between mb-2">
        <span className="font-handwriting text-[20px] text-emerald-600 leading-none">
          매일매일 꼼모닝
        </span>
        <span className="text-[10px] font-bold text-slate-400">오늘</span>
      </div>

      {isEmpty ? (
        <p className="font-handwriting text-[19px] text-slate-500 leading-snug">
          아직 오늘의 조각이 모이지 않았어 — {partner === '꼼이' ? '꼼이' : '우댕이'}한테 콕 찔러볼까 👇
        </p>
      ) : (
        <p className="font-handwriting text-[19px] text-slate-800 leading-relaxed break-keep">
          <span className="text-slate-500 mr-1">오늘 {partner}이</span>
          {chips.map((chip, i) => (
            <span
              key={i}
              className={cn(
                'inline-block px-2 py-0.5 mx-0.5 my-0.5 rounded-sm shadow-sm align-baseline',
                TONE_CLASS[chip.tone],
                i % 2 === 0 ? 'rotate-1' : '-rotate-1',
                chip.highlight ? 'text-[20px] font-bold' : 'text-[17px]'
              )}
            >
              {chip.emoji} {chip.text}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
