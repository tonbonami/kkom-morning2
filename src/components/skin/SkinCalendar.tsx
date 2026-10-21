'use client';
// 제미나이 5차(gemini-3-flash CLI): 범례를 390px 한 줄로(「늦게」·「안 적음」). 값 그대로.
// 제미나이 4차(Aside 2차 반영, gemini-3-flash CLI): 「오늘」 버튼 · 범례 12px·「진할수록 심한 날」 · startDate 이전 날 흐리게·막음. 값 그대로.
// 고친 것: disabled에 '' 이 들어갈 수 있어 타입 오류 → !!startDate.
// 제미나이 시안(2026-10-21, gemini-3-flash CLI로 받음) — 7일 띠 → 주·달 달력. 값 그대로.
// Aside 2차 고침: 루트 max-w-[390px] 때문에 컴퓨터 폭에서 달력 카드만 다른 카드보다 좁음 → 뺌.
// SkinCalendar.tsx (3차 고침: 오늘 버튼 추가, 범례 개선, 시작일 이전 비활성화)

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, Check, X, Clock } from 'lucide-react';

export type MedStatus = 'taken' | 'missed' | 'late';
export interface CalDay { 
  date: string; 
  uas: number | null; 
  med: MedStatus | null; 
  hasLog: boolean; 
  photo: boolean; 
}

interface SkinCalendarProps {
  mode: 'week' | 'month';
  onMode: (m: 'week' | 'month') => void;
  week: CalDay[];
  month: { ym: string; days: CalDay[] };
  today: string;
  selected: string;
  startDate?: string;
  onSelect: (date: string) => void;
  onMonth: (delta: -1 | 1) => void;
  canNextMonth: boolean;
  loading: boolean;
  onOpenReport: () => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function SkinCalendar({
  mode,
  onMode,
  week,
  month,
  today,
  selected,
  startDate,
  onSelect,
  onMonth,
  canNextMonth,
  loading,
  onOpenReport,
}: SkinCalendarProps) {
  const [year, mth] = month.ym.split('-');
  const displayTitle = `${year}년 ${parseInt(mth)}월`;

  const renderDayCircle = (day: CalDay, isSelected: boolean, isSmall: boolean = false) => {
    const isBeforeStart = startDate && day.date < startDate;
    const isToday = day.date === today;
    const isAfterToday = day.date > today;
    const uasLevel = day.uas !== null ? Math.min(day.uas / 6, 1) : 0;
    const circleSize = isSmall ? 'w-8 h-8' : 'w-9 h-9';

    if (isBeforeStart) {
      return (
        <div className={`${circleSize} flex items-center justify-center opacity-10`}>
          <span className="text-sm text-[var(--sd-ink)]">
            {day.date.slice(-2)}
          </span>
        </div>
      );
    }

    return (
      <div 
        className={`relative ${circleSize} flex items-center justify-center rounded-full border transition-all
          ${day.hasLog ? 'border-[var(--sd-line)]' : 'border-dashed border-[var(--sd-line)]'}
          ${isToday ? 'ring-2 ring-[var(--sd-rel)] ring-offset-2 ring-offset-[var(--sd-card-solid)]' : ''}
          ${isSelected ? 'bg-[var(--sd-surface-2)] scale-110' : ''}
          ${isAfterToday ? 'opacity-30' : 'opacity-100'}
        `}
      >
        {day.hasLog && day.uas !== null && (
          <div
            className="absolute inset-1 rounded-full bg-[var(--sd-rel)]"
            style={{ opacity: 0.2 + (uasLevel * 0.8) }}
          />
        )}
        <span className={`relative text-sm z-10 ${isSelected || isToday ? 'font-bold text-[var(--sd-ink)]' : 'text-[var(--sd-ink)]'}`}>
          {day.date.slice(-2)}
        </span>
        {day.photo && (
          <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--sd-rel)] border-2 border-[var(--sd-card-solid)]" />
        )}
      </div>
    );
  };

  const renderMedIcon = (status: MedStatus | null) => {
    if (!status) return <div className="h-4" />;
    switch (status) {
      case 'taken': return <Check size={14} className="text-[var(--sd-rel)]" />;
      case 'missed': return <X size={14} className="text-[var(--sd-crit)]" />;
      case 'late': return <Clock size={14} className="text-[var(--sd-rel-soft)]" />;
    }
  };

  // 월 달력 격자 계산
  const firstDay = new Date(month.days[0].date).getDay();
  const padding = Array.from({ length: firstDay });
  const totalCells = 42; // 6주 고정
  const trailingPadding = Array.from({ length: totalCells - padding.length - month.days.length });

  return (
    <div className="flex flex-col gap-2 mb-4 w-full">
      <div className="sd-card overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 h-[52px]">
          <button 
            onClick={() => onMode(mode === 'week' ? 'month' : 'week')}
            className="flex items-center gap-1.5 h-10 px-2 -ml-2 rounded-lg active:bg-[var(--sd-surface-2)]"
          >
            <span className="text-lg font-bold text-[var(--sd-ink)]">{displayTitle}</span>
            {mode === 'week' ? <ChevronDown size={20} className="text-[var(--sd-muted)]" /> : <ChevronUp size={20} className="text-[var(--sd-muted)]" />}
          </button>
          
          <div className="flex items-center gap-2">
            {selected !== today && (
              <button 
                onClick={() => onSelect(today)}
                className="h-9 px-3 rounded-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm font-medium active:opacity-70"
              >
                오늘
              </button>
            )}
            <button 
              onClick={onOpenReport}
              className="flex items-center gap-1 h-9 px-3 rounded-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm font-medium active:opacity-70"
            >
              <FileText size={16} />
              <span>모아보기</span>
            </button>
          </div>
        </div>

        <motion.div
          animate={{ height: 'auto' }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
          className="px-2 pb-4"
        >
          {mode === 'week' ? (
            /* 주간 모드 */
            <div className="flex justify-between items-start px-1">
              {week.map((day) => {
                const dayIdx = new Date(day.date).getDay();
                const isSelected = day.date === selected;
                const isDisabled = day.date > today || (!!startDate && day.date < startDate);
                return (
                  <button
                    key={day.date}
                    disabled={isDisabled}
                    onClick={() => onSelect(day.date)}
                    className="flex flex-col items-center gap-2 py-2 min-w-[44px] rounded-xl transition-colors active:scale-95"
                  >
                    <span className={`text-[11px] ${dayIdx === 0 ? 'text-[var(--sd-crit)] opacity-70' : 'text-[var(--sd-muted)]'} ${isSelected ? 'font-bold !text-[var(--sd-ink)]' : ''}`}>
                      {WEEKDAYS[dayIdx]}
                    </span>
                    {renderDayCircle(day, isSelected)}
                    <div className="h-4 flex items-center justify-center">
                      {renderMedIcon(day.med)}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* 월간 모드 */
            <div className={`flex flex-col transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <div className="flex items-center justify-between mb-2 px-2">
                <button 
                  onClick={() => onMonth(-1)}
                  className="w-10 h-10 flex items-center justify-center rounded-full active:bg-[var(--sd-surface-2)]"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-xs text-[var(--sd-muted)]">달을 넘겨서 기록을 찾아보세요</div>
                <button 
                  onClick={() => onMonth(1)}
                  disabled={!canNextMonth}
                  className={`w-10 h-10 flex items-center justify-center rounded-full active:bg-[var(--sd-surface-2)] ${!canNextMonth ? 'opacity-20' : ''}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((w, i) => (
                  <div key={w} className={`text-center text-[11px] py-1 ${i === 0 ? 'text-[var(--sd-crit)] opacity-70' : 'text-[var(--sd-muted)]'}`}>
                    {w}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-3">
                {padding.map((_, i) => <div key={`p-${i}`} />)}
                {month.days.map((day) => {
                  const isSelected = day.date === selected;
                  const isDisabled = day.date > today || (!!startDate && day.date < startDate);
                  return (
                    <button
                      key={day.date}
                      disabled={isDisabled}
                      onClick={() => onSelect(day.date)}
                      className="flex flex-col items-center gap-1 relative py-1 active:scale-90"
                    >
                      {renderDayCircle(day, isSelected, true)}
                      <div className="absolute -bottom-2.5 h-3 flex items-center justify-center scale-75">
                        {renderMedIcon(day.med)}
                      </div>
                    </button>
                  );
                })}
                {trailingPadding.map((_, i) => <div key={`t-${i}`} />)}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 범례 */}
      <div className="px-2 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-[var(--sd-muted)] leading-tight">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--sd-rel)] opacity-80" />
          <span>진할수록 심한 날</span>
        </div>
        <div className="flex items-center gap-1">
          <Check size={12} />
          <span>약 먹음</span>
        </div>
        <div className="flex items-center gap-1 text-[var(--sd-crit)]">
          <X size={12} />
          <span>거름</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>늦게</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-[var(--sd-line)]" />
          <span>안 적음</span>
        </div>
      </div>
    </div>
  );
}
