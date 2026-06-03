'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, CloudSun, Cloud, CloudRain, CloudSnow, Droplets, Umbrella, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';

export interface WeatherCardProps {
  location?: string;
  current: {
    temp: number | null;
    sky: '1' | '3' | '4' | null;
    pty: '0' | '1' | '2' | '3' | null;
    humidity: number | null;
  };
  today: {
    high: number | null;
    low: number | null;
    sky: '1' | '3' | '4' | null;
    pty: '0' | '1' | '2' | '3' | null;
    precipProb: number | null;
  };
  tomorrow: {
    high: number | null;
    low: number | null;
    sky: '1' | '3' | '4' | null;
    pty: '0' | '1' | '2' | '3' | null;
    precipProb: number | null;
  };
}

export default function TodayTomorrowWeather({ location, current, today, tomorrow }: WeatherCardProps) {
  // 날씨 상태에 따른 아이콘 반환 헬퍼
  const getWeatherIcon = (sky: string | null, pty: string | null, className: string = '', isLarge: boolean = false) => {
    if (pty === '1' || pty === '2') {
      return <CloudRain className={`${className} text-[#3B82F6]`} strokeWidth={isLarge ? 1.5 : 2} />;
    }
    if (pty === '3') {
      return <CloudSnow className={`${className} text-slate-300`} strokeWidth={isLarge ? 1.5 : 2} />;
    }
    if (sky === '1') {
      return <Sun className={`${className} text-[#10B981]`} strokeWidth={isLarge ? 1.5 : 2} />;
    }
    if (sky === '3') {
      return <CloudSun className={`${className} text-[#99E6D9]`} strokeWidth={isLarge ? 1.5 : 2} />;
    }
    return <Cloud className={`${className} text-slate-300`} strokeWidth={isLarge ? 1.5 : 2} />;
  };

  // 비 아이콘 애니메이션
  const floatAnimation = {
    y: [-1, 1, -1],
    transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' }
  };

  const isCurrentMissing = current.temp === null;

  // 강수 확률 관련 스타일 결정
  const todayRainHigh = (today.precipProb || 0) >= 50;
  const tomorrowRainProb = tomorrow.precipProb || 0;
  const isTomorrowRainHigh = tomorrowRainProb >= 50;
  const isTomorrowRainMed = tomorrowRainProb >= 30 && tomorrowRainProb < 50;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col select-none">
      {/* 상단부: 현재 + 오늘 */}
      <div className="p-7 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-start">
              {isCurrentMissing ? (
                <span className="text-6xl font-extrabold text-slate-300 tracking-tighter">—</span>
              ) : (
                <>
                  <span className="text-6xl font-extrabold text-slate-800 tracking-tighter">{current.temp}</span>
                  <span className="text-3xl font-bold text-slate-400 mt-2 ml-1">°</span>
                </>
              )}
            </div>
            <div className="mt-2 flex items-center text-[14px] font-bold text-slate-400">
              {isCurrentMissing ? (
                '곧 연결돼요'
              ) : (
                <>지금 {location && <span className="mx-1.5">·</span>} {location}</>
              )}
            </div>
          </div>

          {/* 현재 날씨 아이콘 */}
          <div className="w-20 h-20 flex items-center justify-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
            {getWeatherIcon(current.sky, current.pty, 'w-20 h-20', true)}
          </div>
        </div>

        {/* 오늘 요약 */}
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] font-bold">
          <div className="flex items-center text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full">
            <span className="text-slate-400 mr-1.5 font-medium">최고</span> {today.high ?? '—'}°
            <span className="mx-2 text-slate-200">|</span>
            <span className="text-slate-400 mr-1.5 font-medium">최저</span> {today.low ?? '—'}°
          </div>

          <motion.div
            animate={todayRainHigh ? floatAnimation : {}}
            className={`flex items-center px-3 py-1.5 rounded-full ${
              todayRainHigh ? 'bg-blue-50 text-[#3B82F6]' : 'bg-slate-50 text-slate-500'
            }`}
          >
            <Droplets className="w-4 h-4 mr-1.5" />
            <span className={!todayRainHigh ? 'text-slate-400 font-medium mr-1' : 'mr-1'}>비</span>
            {today.precipProb ?? '—'}%
          </motion.div>

          {current.humidity !== null && (
            <div className="flex items-center text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
              <span className="text-slate-400 font-medium mr-1.5">습도</span> {current.humidity}%
            </div>
          )}
        </div>
      </div>

      {/* 하단부: 내일 — 우측 끝에 작은 ChevronRight로 '탭하면 더 보기' 힌트 */}
      <div className="bg-slate-50/50 border-t border-slate-100 px-7 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
        <ChevronRight size={18} className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-300" />
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-black text-slate-700">내일</span>
          <div className="w-6 h-6 flex items-center justify-center drop-shadow-sm">
            {getWeatherIcon(tomorrow.sky, tomorrow.pty, 'w-5 h-5')}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3 text-[14px] font-bold pr-5">
          <div className="flex items-center text-slate-600">
            <ArrowUp className="w-3.5 h-3.5 text-red-400 mr-0.5" /> {tomorrow.high ?? '—'}°
            <span className="w-3" />
            <ArrowDown className="w-3.5 h-3.5 text-blue-400 mr-0.5" /> {tomorrow.low ?? '—'}°
          </div>

          <span className="text-slate-200">·</span>

          <motion.div
            animate={isTomorrowRainHigh ? floatAnimation : {}}
            className={`flex items-center ${isTomorrowRainHigh ? 'text-[#3B82F6]' : 'text-slate-500'}`}
          >
            <Droplets className="w-3.5 h-3.5 mr-1" />
            {tomorrow.precipProb ?? '—'}%

            {isTomorrowRainHigh && (
              <span className="ml-2 flex items-center text-[12px] bg-blue-100/50 px-2 py-0.5 rounded-md text-[#3B82F6]">
                <Umbrella className="w-3 h-3 mr-1" /> 우산 챙겨!
              </span>
            )}
            {isTomorrowRainMed && (
              <span className="ml-2 text-[13px] font-medium text-slate-400">
                비 올 수도
              </span>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
