'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface WeatherAirProps {
  dday: number;
  temp: number | null;
  feelsLike: number | null;
  sky: '맑음' | '구름많음' | '흐림' | null;
  todayHigh: number | null;
  todayLow: number | null;
  rain: {
    type: '비' | '눈' | '비/눈' | '없음';
    typeText: string;
    emoji: string;
    probability: number | null;
    startTimeKor: string | null;
  } | null;
  air: {
    grade: '좋음' | '보통' | '나쁨' | '매우 나쁨' | '정보 없음';
    pm10: number | null;
    pm25: number | null;
    location: string;
  } | null;
  variant?: 'split' | 'air-first';
}

export default function WeatherAirHero({
  dday,
  temp,
  feelsLike,
  sky,
  todayHigh,
  todayLow,
  rain,
  air,
  variant = 'split'
}: WeatherAirProps) {
  // 1. 하늘 상태 이모지 헬퍼
  const getSkyEmoji = () => {
    switch (sky) {
      case '맑음': return '☀️';
      case '구름많음': return '⛅';
      case '흐림': return '☁️';
      default: return '🌤️';
    }
  };

  // 2. 미세먼지 등급별 색상 토큰 (Light / Dark)
  const getAirColor = (grade?: string) => {
    switch (grade) {
      case '좋음':
        return { text: 'text-[#10B981] dark:text-[#34D399]', bg: 'bg-[#10B981]/15 dark:bg-[#34D399]/15', solid: 'bg-[#10B981] dark:bg-[#34D399]', emoji: '😄' };
      case '보통':
        return { text: 'text-[#0ea5e9] dark:text-[#38bdf8]', bg: 'bg-[#0ea5e9]/15 dark:bg-[#38bdf8]/15', solid: 'bg-[#0ea5e9] dark:bg-[#38bdf8]', emoji: '🙂' };
      case '나쁨':
        return { text: 'text-[#FB923C] dark:text-[#F97316]', bg: 'bg-[#FB923C]/15 dark:bg-[#F97316]/15', solid: 'bg-[#FB923C] dark:bg-[#F97316]', emoji: '😷' };
      case '매우 나쁨':
        return { text: 'text-[#ef4444] dark:text-[#f87171]', bg: 'bg-[#ef4444]/15 dark:bg-[#f87171]/15', solid: 'bg-[#ef4444] dark:bg-[#f87171]', emoji: '👿' };
      default:
        return { text: 'text-[#64748B] dark:text-[#B4AA9A]', bg: 'bg-[#64748B]/10 dark:bg-[#B4AA9A]/10', solid: 'bg-[#64748B] dark:bg-[#B4AA9A]', emoji: '🤔' };
    }
  };

  const airGrade = air?.grade ?? '정보 없음';
  const airStyle = getAirColor(airGrade);
  const skyEmoji = getSkyEmoji();

  // 강수 예보 블록 컴포넌트
  const RainAlert = () => {
    if (!rain || rain.type === '없음') return null;
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50/80 px-3 py-2 dark:bg-blue-900/30">
        <span className="text-lg">{rain.emoji}</span>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-blue-600 dark:text-blue-300">
            {rain.startTimeKor} {rain.typeText} 시작
          </span>
          {rain.probability && (
            <span className="text-[11px] font-medium text-blue-500 dark:text-blue-400">
              강수확률 {rain.probability}%
            </span>
          )}
        </div>
      </div>
    );
  };

  // 작게 들어가는 D-day 뱃지
  const DdayBadge = ({ className = '' }) => (
    <div className={`absolute z-10 rounded-full bg-[#FB7BA8] px-2.5 py-1 text-[11px] font-bold tracking-wider text-white shadow-sm dark:bg-[#D94C7A] ${className}`}>
      D+{dday}
    </div>
  );

  // ==========================================
  // 시안 A (Split): 좌 날씨 / 우 미세먼지
  // ==========================================
  if (variant === 'split') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-4 flex w-full max-w-md flex-row gap-3 rounded-[28px] bg-[#FFFFFF] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:bg-[#332F2A]"
      >
        <DdayBadge className="-right-2 -top-2 rotate-3" />

        {/* Left: 날씨 영역 */}
        <div className="flex flex-1 flex-col border-r border-[#FBF8F2] pr-3 dark:border-[#272522]">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[28px] leading-none">{skyEmoji}</span>
            <span className="text-4xl font-black text-[#334155] tracking-tight dark:text-[#E8E2D8]">
              {temp ?? '-'}°
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#64748B] dark:text-[#B4AA9A]">
            <span>{todayLow ?? '-'}° / {todayHigh ?? '-'}°</span>
            <span className="text-[11px] font-medium opacity-80">(체감 {feelsLike ?? '-'}°)</span>
          </div>
          <RainAlert />
        </div>

        {/* Right: 미세먼지 영역 */}
        <div className={`flex flex-1 flex-col items-center justify-center rounded-2xl p-3 ${airStyle.bg}`}>
          <div className="mb-1 text-[26px] drop-shadow-sm">{airStyle.emoji}</div>
          <h3 className={`text-[20px] font-black tracking-tight ${airStyle.text}`}>
            {airGrade}
          </h3>
          <div className="mt-1.5 flex gap-2 text-[11px] font-bold opacity-80">
            <span className={airStyle.text}>미세 {air?.pm10 ?? '-'}</span>
            <span className={airStyle.text}>초미세 {air?.pm25 ?? '-'}</span>
          </div>
          <span className={`mt-1 text-[10px] font-medium opacity-60 ${airStyle.text}`}>
            {air?.location} 기준
          </span>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // 시안 B (Air-First): 상단 미세먼지 / 하단 날씨
  // ==========================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-4 flex w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-[#FFFFFF] shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:bg-[#332F2A]"
    >
      <DdayBadge className="right-4 top-4" />

      {/* Top: 미세먼지 메인 배너 */}
      <div className={`flex flex-col items-center justify-center px-5 py-6 ${airStyle.solid} text-white`}>
        <span className="mb-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
          현재 {air?.location} 공기질
        </span>
        <div className="flex items-center gap-2">
          <span className="text-4xl">{airStyle.emoji}</span>
          <h2 className="text-[32px] font-black tracking-tight drop-shadow-sm">
            {airGrade}
          </h2>
        </div>
        <div className="mt-1.5 flex gap-3 text-[12px] font-bold text-white/90">
          <span>미세 {air?.pm10 ?? '-'}</span>
          <span>초미세 {air?.pm25 ?? '-'}</span>
        </div>
      </div>

      {/* Bottom: 날씨 및 강수 영역 */}
      <div className="flex flex-col px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{skyEmoji}</span>
            <div className="flex flex-col">
              <span className="text-[26px] font-black leading-none text-[#334155] dark:text-[#E8E2D8]">
                {temp ?? '-'}°
              </span>
              <span className="mt-0.5 text-[12px] font-semibold text-[#64748B] dark:text-[#B4AA9A]">
                {todayLow ?? '-'}° / {todayHigh ?? '-'}° · 체감 {feelsLike ?? '-'}°
              </span>
            </div>
          </div>
        </div>
        <RainAlert />
      </div>
    </motion.div>
  );
}
