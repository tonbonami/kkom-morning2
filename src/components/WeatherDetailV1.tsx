'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Sun, CloudSun, Cloud, CloudRain, CloudSnow,
  Droplets, RefreshCw, ArrowUp, ArrowDown
} from 'lucide-react';

// -----------------------------------------------------------------
// Types
// -----------------------------------------------------------------
export interface CurrentBlock {
  temp: number | null;
  sky: '1' | '3' | '4' | null;
  pty: '0' | '1' | '2' | '3' | null;
  humidity: number | null;
}

export interface DayBlock {
  high: number | null;
  low: number | null;
  sky: '1' | '3' | '4' | null;
  pty: '0' | '1' | '2' | '3' | null;
  precipProb: number | null;
}

export interface HourlyPoint {
  time: string; // 'HH:mm' or ISO
  temp: number | null;
  sky: '1' | '3' | '4' | null;
  pty: '0' | '1' | '2' | '3' | null;
  precipProb: number | null;
}

export interface Props {
  location: string;
  current: CurrentBlock;
  today: DayBlock;
  tomorrow: DayBlock;
  dayAfter?: DayBlock;
  hourly: HourlyPoint[];
  pochaccoSrc: string;
  pochaccoMessage: string;
  onBack: () => void;
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------
const getWeatherIcon = (sky: string | null, pty: string | null, className: string = '', strokeWidth: number = 2) => {
  if (pty === '1' || pty === '2') {
    return <CloudRain className={`${className} text-[#3B82F6]`} strokeWidth={strokeWidth} />;
  }
  if (pty === '3') {
    return <CloudSnow className={`${className} text-slate-300`} strokeWidth={strokeWidth} />;
  }
  if (sky === '1') {
    return <Sun className={`${className} text-[#10B981]`} strokeWidth={strokeWidth} />;
  }
  if (sky === '3') {
    return <CloudSun className={`${className} text-[#99E6D9]`} strokeWidth={strokeWidth} />;
  }
  return <Cloud className={`${className} text-slate-300`} strokeWidth={strokeWidth} />;
};

const formatTime = (timeStr: string, index: number) => {
  if (index === 0) return '지금';

  // ISO string parse
  const date = new Date(timeStr);
  if (!isNaN(date.getTime())) {
    const h = date.getHours();
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시`;
  }

  // HH:mm string parse
  if (timeStr.includes(':')) {
    const h = parseInt(timeStr.split(':')[0], 10);
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시`;
  }

  return timeStr;
};

// Rain float animation
const floatAnimation = {
  y: [-1.5, 1.5, -1.5],
  transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' }
};

// -----------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------
export default function WeatherDetailV1({
  location, current, today, tomorrow, dayAfter, hourly,
  pochaccoSrc, pochaccoMessage, onBack
}: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800); // mock refresh
  };

  const isRainingNow = current.pty === '1' || current.pty === '2';

  return (
    <div className={`min-h-screen max-w-md mx-auto relative font-sans pb-12 transition-colors duration-500 ${isRainingNow ? 'bg-slate-50' : 'bg-[#F7F9F9]'}`}>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-inherit/90 backdrop-blur-md pt-safe">
        <div className="flex items-center justify-between px-5 py-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2 -ml-2 text-slate-800">
            <ChevronLeft size={28} />
          </motion.button>
          <h1 className="text-[17px] font-extrabold text-slate-800 tracking-tight">
            {location} 날씨
          </h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600"
          >
            <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.8, ease: "linear" }}>
              <RefreshCw size={20} strokeWidth={2.5} />
            </motion.div>
          </motion.button>
        </div>
      </header>

      <main className="flex flex-col">

        {/* Hero: Pochacco & Speech Bubble */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-end gap-3 px-6 mt-2 mb-6"
        >
          {/* Mascot Placeholder / Image */}
          <div className="w-28 h-28 shrink-0 relative drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)]">
            <img
              src={pochaccoSrc}
              alt="Mascot"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback style if image fails to load during dev
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.classList.add('bg-white', 'rounded-full', 'flex', 'items-center', 'justify-center');
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-3xl">🐶</span>';
              }}
            />
          </div>

          {/* Speech Bubble */}
          <div className="flex-1 bg-white p-4 rounded-[24px] rounded-bl-none shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative mb-3">
            <p className="text-[14.5px] font-bold text-slate-700 leading-snug break-keep">
              {pochaccoMessage}
            </p>
          </div>
        </motion.div>

        {/* Current Weather Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4 }}
          className="mx-5 bg-white rounded-[32px] p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex justify-between items-center"
        >
          <div>
            <div className="flex items-start">
              {current.temp !== null ? (
                <>
                  <span className="text-[64px] font-black tracking-tighter text-slate-800 leading-none">{current.temp}</span>
                  <span className="text-3xl font-bold text-slate-300 mt-2 ml-1">°</span>
                </>
              ) : (
                <span className="text-[64px] font-black tracking-tighter text-slate-300 leading-none">—</span>
              )}
            </div>
            {current.humidity !== null && (
              <div className="flex items-center gap-1.5 mt-3 text-[14px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full inline-flex">
                <Droplets size={14} className="text-slate-300" /> 습도 {current.humidity}%
              </div>
            )}
          </div>

          <div className="w-24 h-24 flex items-center justify-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
            <motion.div animate={isRainingNow ? floatAnimation : {}}>
              {getWeatherIcon(current.sky, current.pty, 'w-24 h-24', 1.5)}
            </motion.div>
          </div>
        </motion.div>

        {/* Hourly Forecast (Next 24h) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-8"
        >
          <div className="px-6 flex items-center justify-between mb-3.5">
            <h3 className="text-[15px] font-extrabold text-slate-800">시간대별 날씨</h3>
          </div>

          <div className="flex overflow-x-auto no-scrollbar px-5 pb-5 pt-1 gap-3">
            {hourly.map((point, idx) => {
              const isRainy = (point.precipProb ?? 0) >= 40 || point.pty === '1' || point.pty === '2';
              return (
                <div key={idx} className="shrink-0 flex flex-col items-center bg-white rounded-[24px] w-[72px] py-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-50">
                  <span className={`text-[13px] font-bold mb-3 ${idx === 0 ? 'text-[#10B981]' : 'text-slate-500'}`}>
                    {formatTime(point.time, idx)}
                  </span>

                  <div className="h-8 flex items-center justify-center mb-3">
                    <motion.div animate={isRainy ? floatAnimation : {}}>
                      {getWeatherIcon(point.sky, point.pty, 'w-7 h-7')}
                    </motion.div>
                  </div>

                  <span className="text-[15px] font-black text-slate-700">
                    {point.temp ?? '—'}°
                  </span>

                  {/* Precip Probability */}
                  <div className="h-4 mt-1.5 flex items-center justify-center">
                    {(point.precipProb ?? 0) > 0 ? (
                      <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isRainy ? 'text-[#3B82F6]' : 'text-slate-400'}`}>
                        <Droplets size={10} fill="currentColor" className={isRainy ? "opacity-100" : "opacity-0"} />
                        {point.precipProb}%
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Daily Forecast (Row of 3 cards) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-4 px-5"
        >
          <h3 className="px-1 text-[15px] font-extrabold text-slate-800 mb-3.5">주간 요약</h3>

          <div className="grid grid-cols-3 gap-3">
            <DailyCard title="오늘" data={today} isToday />
            <DailyCard title="내일" data={tomorrow} />
            {dayAfter && <DailyCard title="모레" data={dayAfter} />}
          </div>
        </motion.div>

      </main>
    </div>
  );
}

// -----------------------------------------------------------------
// Sub-Component: Daily Card
// -----------------------------------------------------------------
function DailyCard({ title, data, isToday = false }: { title: string, data: DayBlock, isToday?: boolean }) {
  const isRainy = (data.precipProb ?? 0) >= 50;

  return (
    <div className={`bg-white rounded-[28px] p-4 flex flex-col items-center text-center shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-slate-50 relative overflow-hidden`}>
      {isToday && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]/20" />
      )}

      <span className={`text-[13px] font-extrabold mb-3 ${isToday ? 'text-[#10B981]' : 'text-slate-600'}`}>
        {title}
      </span>

      <div className="h-10 flex items-center justify-center drop-shadow-sm mb-3">
        <motion.div animate={isRainy ? floatAnimation : {}}>
          {getWeatherIcon(data.sky, data.pty, 'w-9 h-9')}
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[14px] font-bold w-full">
        <span className="text-slate-700 flex items-center">
          {data.high ?? '—'}°
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400 flex items-center">
          {data.low ?? '—'}°
        </span>
      </div>

      <div className={`mt-3 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 w-fit mx-auto ${
        isRainy ? 'bg-blue-50 text-[#3B82F6]' : 'bg-slate-50 text-slate-400'
      }`}>
        <Droplets size={10} strokeWidth={2.5} />
        {data.precipProb ?? 0}%
      </div>
    </div>
  );
}
