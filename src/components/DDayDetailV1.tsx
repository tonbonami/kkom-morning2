'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, animate } from 'framer-motion';
import {
  ArrowLeft, Heart, Sparkles, Calendar, Gift,
  PartyPopper, Check, Clock
} from 'lucide-react';

export interface Props {
  firstMet: Date;
  marriedAt?: Date;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------
const getMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const diffDays = (d1: Date, d2: Date) => {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

const addDays = (d: Date, days: number) => {
  const res = new Date(d.getTime());
  res.setDate(res.getDate() + days);
  return res;
};

const formatKORDate = (d: Date) => {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

// ---------------------------------------------------------------------------
// Animated Counter Component
// ---------------------------------------------------------------------------
function AnimatedCounter({ value }: { value: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, value, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = Math.floor(v).toLocaleString('en-US');
        }
      });
      return () => controls.stop();
    }
  }, [value]);

  return <span ref={nodeRef}>{value.toLocaleString('en-US')}</span>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function DDayDetailV1({ firstMet, marriedAt, onBack }: Props) {
  // Hydration-safe Date
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  if (!today) {
    return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;
  }

  // --- Calculations ---
  // Base Days
  const daysTogether = diffDays(firstMet, today) + 1; // 1일차부터 시작

  const marriedInfo = marriedAt ? {
    isPast: getMidnight(marriedAt) <= getMidnight(today),
    days: diffDays(marriedAt, today) + 1,
    remains: diffDays(today, marriedAt)
  } : null;

  // Milestones
  const milestoneList = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 3000, 4000, 5000, 10000];
  const allMilestones = milestoneList.map(m => {
    const date = addDays(firstMet, m - 1);
    const remains = diffDays(today, date);
    return {
      days: m,
      date,
      isPast: remains < 0,
      remains
    };
  });

  const nextMilestone = allMilestones.find(m => !m.isPast && m.remains >= 0);

  // Filter for timeline: 2 past, next 1, 3 future
  const pastMilestones = allMilestones.filter(m => m.isPast).slice(-2);
  const futureMilestones = allMilestones.filter(m => !m.isPast).slice(0, 4);
  const displayMilestones = [...pastMilestones, ...futureMilestones];

  // Anniversaries
  const getNextAnniv = (baseDate: Date, name: string, icon: React.ReactNode) => {
    let next = new Date(today.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    if (getMidnight(next) < getMidnight(today)) {
      next.setFullYear(today.getFullYear() + 1);
    }
    const remains = diffDays(today, next);
    const years = next.getFullYear() - baseDate.getFullYear();
    return { name, date: next, remains, years, icon };
  };

  const anniversaries = [
    getNextAnniv(firstMet, '처음 만난 날', <Heart size={20} className="text-[#FCA5A5]" fill="currentColor" />)
  ];
  if (marriedAt) {
    anniversaries.push(getNextAnniv(marriedAt, '결혼기념일', <Gift size={20} className="text-[#10B981]" />));
  }
  anniversaries.sort((a, b) => a.remains - b.remains);

  // --- Animation Variants ---
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };
  const staggerItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto relative font-sans text-slate-900 pb-24 overflow-hidden selection:bg-[#FCA5A5]/30">

      {/* Background Soft Glow */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#FCA5A5]/10 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-20 pt-safe flex items-center justify-between px-5 py-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 -ml-2 text-slate-700 bg-white/50 backdrop-blur-md rounded-full shadow-sm"
        >
          <ArrowLeft size={24} />
        </motion.button>
      </header>

      <main className="px-5 mt-2 relative z-10 flex flex-col">

        {/* 1. Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center flex flex-col items-center mb-5 border border-white"
        >
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
            <Heart size={24} className="text-[#FCA5A5]" fill="currentColor" />
          </div>

          <h2 className="text-[15px] font-bold text-slate-400 mb-1">우리가 함께한 지</h2>
          <div className="text-[52px] font-black text-slate-800 tracking-tight leading-none mb-4">
            D+<AnimatedCounter value={daysTogether} />
          </div>

          <p className="text-[14px] font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-full inline-flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            {formatKORDate(firstMet)}
          </p>

          {marriedInfo && (
            <div className="mt-4 pt-4 border-t border-slate-100 w-full">
              <p className="text-[13px] font-bold text-slate-500 flex items-center justify-center gap-1.5">
                <Sparkles size={14} className="text-[#FCD34D]" />
                {marriedInfo.isPast
                  ? `결혼한 지 D+${marriedInfo.days}`
                  : `결혼까지 D-${marriedInfo.remains}`
                }
                <span className="text-slate-300 mx-1">|</span>
                <span className="font-medium">{formatKORDate(marriedAt!)}</span>
              </p>
            </div>
          )}
        </motion.section>

        {/* Nearest Milestone Highlight Banner */}
        {nextMilestone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10 relative"
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1], boxShadow: ["0 4px 20px rgba(252,211,77,0.1)", "0 4px 20px rgba(252,211,77,0.4)", "0 4px 20px rgba(252,211,77,0.1)"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-[24px] p-5 border border-yellow-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <PartyPopper size={20} className="text-[#FCD34D]" />
                </div>
                <div>
                  <h3 className="text-[13px] font-extrabold text-amber-700/60 mb-0.5">다가오는 기념일</h3>
                  <p className="text-[16px] font-black text-amber-900">{nextMilestone.days}일까지 D-{nextMilestone.remains}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 2. Milestone Timeline */}
        <section className="mb-10">
          <h3 className="text-[17px] font-extrabold text-slate-800 mb-6 px-1">우리의 발자취</h3>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="pl-2"
          >
            {displayMilestones.map((m, i) => {
              const isLast = i === displayMilestones.length - 1;
              const isNext = nextMilestone?.days === m.days;

              return (
                <motion.div key={m.days} variants={staggerItem} className="flex gap-4 relative min-h-[64px]">
                  {/* Track & Dot Column */}
                  <div className="flex flex-col items-center shrink-0 w-6">
                    {/* Dot */}
                    <div className="relative mt-1">
                      {isNext ? (
                        <div className="w-4 h-4 rounded-full bg-[#FCD34D] ring-4 ring-yellow-100 shadow-sm z-10 relative flex items-center justify-center">
                           <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      ) : m.isPast ? (
                        <div className="w-[18px] h-[18px] rounded-full bg-[#10B981] flex items-center justify-center ring-4 ring-[#F7F9F9] shadow-sm z-10 relative">
                          <Check size={12} strokeWidth={3} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-[10px] h-[10px] rounded-full bg-slate-200 ring-4 ring-[#F7F9F9] z-10 relative mt-1" />
                      )}
                    </div>
                    {/* Line */}
                    {!isLast && (
                      <div className={`w-[2px] flex-1 my-1 rounded-full ${
                        m.isPast && !displayMilestones[i+1].isPast && !isNext
                          ? 'bg-gradient-to-b from-[#10B981]/40 to-slate-200'
                          : m.isPast
                            ? 'bg-[#10B981]/40'
                            : 'bg-slate-200'
                      }`} />
                    )}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 pb-7 -mt-0.5">
                    <div className="flex items-end gap-2 mb-1">
                      <span className={`text-[16px] font-black ${isNext ? 'text-amber-600' : m.isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                        {m.days}일
                      </span>
                      {isNext && (
                        <span className="text-[12px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md mb-0.5">
                          D-{m.remains}
                        </span>
                      )}
                    </div>
                    <p className={`text-[13px] font-medium flex items-center gap-1.5 ${isNext ? 'text-amber-700/60' : m.isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatKORDate(m.date)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* 3. Upcoming Anniversaries */}
        <section>
          <h3 className="text-[17px] font-extrabold text-slate-800 mb-4 px-1">매년 돌아오는 날</h3>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {anniversaries.map((a, i) => {
              const isClose = a.remains <= 7;

              return (
                <motion.div
                  key={a.name}
                  variants={staggerItem}
                  className={`bg-white rounded-[24px] p-5 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.03)] border transition-colors ${
                    isClose ? 'border-[#FCA5A5]/30 bg-rose-50/10' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${
                      isClose ? 'bg-rose-50' : 'bg-[#F7F9F9]'
                    }`}>
                      {a.icon}
                    </div>
                    <div>
                      <h4 className="text-[15px] font-black text-slate-800 mb-0.5">{a.years}주년 {a.name}</h4>
                      <p className="text-[13px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {formatKORDate(a.date)}
                      </p>
                    </div>
                  </div>
                  <div className={`text-[16px] font-black bg-white px-3 py-1.5 rounded-full shadow-sm border ${
                    isClose ? 'text-[#FCA5A5] border-[#FCA5A5]/20' : 'text-slate-600 border-slate-100'
                  }`}>
                    {a.remains === 0 ? '오늘!' : `D-${a.remains}`}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

      </main>
    </div>
  );
}
