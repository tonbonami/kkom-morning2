'use client';
// 제미나이 시안(2026-10-21, gemini-3-flash CLI로 받음) — 모아보기 화면. 값 그대로.
// 고친 것(버그만): ① 하루 카드에 없는 prop canEdit을 넘겨 빌드 깨짐 → 뺌 ② 최신→과거 순인데 월요일에서 새 주를 시작해 주가 하루씩 어긋남
//   → 일요일(그 주의 가장 최근 날)에서 시작 ③ 주 머리 날짜가 「최신 ~ 과거」로 거꾸로·기록한 날까지만 → 「과거 ~ 최신」 그 주 전체.
//   ④ 기록 없는 하루가 「2026-10-21」 날것으로 찍힘 → 「10/21」(여러 날 묶음과 같게) ⑤ 「사진 n장 보기」를 눌러도 아무 일이 없던 것 → 시안 설명대로 그날 기록 화면으로(onOpenDay).
// SkinReportView.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Info } from 'lucide-react';
import SkinDayReport, { ReportDay, MedStatus } from './SkinDayReport';

export type ReportRange = '2w' | 'month' | 'prevMonth' | '3m' | 'all';

interface Props {
  onBack: () => void;
  range: ReportRange;
  onRange: (r: ReportRange) => void;
  rangeLabel: string;
  days: ReportDay[];
  summary: {
    daysLogged: number;
    daysTotal: number;
    avgUas: number | null;
    hardDays: number;
    medMissedDays: number;
    angioedemaDays: number;
    topTriggers: { name: string; days: number }[];
  };
  loading: boolean;
  onOpenDay: (date: string) => void;
  canEdit: boolean;
}

export default function SkinReportView({ 
  onBack, range, onRange, rangeLabel, days, summary, loading, onOpenDay, canEdit 
}: Props) {
  
  const ranges: { key: ReportRange; label: string }[] = [
    { key: '2w', label: '최근 2주' },
    { key: 'month', label: '이번 달' },
    { key: 'prevMonth', label: '지난달' },
    { key: '3m', label: '3개월' },
    { key: 'all', label: '전체' },
  ];

  // 주 단위 그룹화 로직
  const groupDaysByWeek = (data: ReportDay[]) => {
    const groups: { start: string; end: string; items: (ReportDay | { type: 'empty-range'; start: string; end: string })[]; loggedCount: number; uasSum: number }[] = [];
    
    let currentWeek: typeof groups[0] | null = null;
    let emptySequence: { start: string; end: string } | null = null;

    data.forEach((day, idx) => {
      const d = new Date(day.date);
      const dayOfWeek = d.getDay(); // 0(일)~6(토)
      
      // 주차 기준 (월요일 시작)
      const isStartOfWeek = currentWeek === null || dayOfWeek === 0;

      if (isStartOfWeek) {
        if (currentWeek) groups.push(currentWeek);
        currentWeek = { start: day.date, end: day.date, items: [], loggedCount: 0, uasSum: 0 };
      }

      currentWeek!.end = day.date;
      if (day.logged) {
        if (emptySequence) {
          currentWeek!.items.push({ type: 'empty-range', ...emptySequence });
          emptySequence = null;
        }
        currentWeek!.items.push(day);
        currentWeek!.loggedCount += 1;
        currentWeek!.uasSum += (day.uas || 0);
        currentWeek!.end = day.date; // 내림차순이므로 실제로는 여기가 주의 끝(과거)
      } else {
        if (!emptySequence) {
          emptySequence = { start: day.date, end: day.date };
        } else {
          emptySequence.end = day.date;
        }
        // 마지막 요소면 닫기
        if (idx === data.length - 1 || (idx + 1 < data.length && new Date(data[idx+1].date).getDay() === 0)) {
          currentWeek!.items.push({ type: 'empty-range', ...emptySequence });
          emptySequence = null;
        }
      }
    });

    if (currentWeek) groups.push(currentWeek);
    return groups;
  };

  const weekGroups = groupDaysByWeek(days);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--sd-surface-2)]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--sd-surface-2)] border-b border-[var(--sd-line)]">
        <div className="flex items-center h-[56px] px-4">
          <button onClick={onBack} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <ChevronLeft size={24} className="text-[var(--sd-ink)]" />
          </button>
          <h1 className="text-[18px] font-bold text-[var(--sd-ink)]">모아보기</h1>
        </div>
        
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => onRange(r.key)}
                className={`shrink-0 px-4 h-[36px] rounded-full text-[13px] font-medium transition-colors ${
                  range === r.key 
                    ? 'bg-[var(--sd-rel)] text-white' 
                    : 'bg-[var(--sd-card-solid)] text-[var(--sd-muted)] border border-[var(--sd-line)]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-[var(--sd-faint)] mt-2">{rangeLabel}</p>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* 요약 카드 */}
        <section className="sd-card p-5">
          {summary.daysLogged === 0 ? (
            <p className="text-center py-4 text-[var(--sd-muted)]">이 기간엔 기록이 없어요</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--sd-muted)]">기록한 날</span>
                  <span className="text-[16px] font-bold">{summary.daysLogged} / {summary.daysTotal}일</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--sd-muted)]">평균 점수</span>
                  <span className="text-[16px] font-bold text-[var(--sd-rel)]">{summary.avgUas?.toFixed(1) || '0'} / 6</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--sd-muted)]">힘든 날 (4점↑)</span>
                  <span className={`text-[16px] font-bold ${summary.hardDays > 0 ? 'text-[var(--sd-crit)]' : ''}`}>{summary.hardDays}일</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--sd-muted)]">약 거른 날</span>
                  <span className={`text-[16px] font-bold ${summary.medMissedDays > 0 ? 'text-[var(--sd-crit)]' : ''}`}>{summary.medMissedDays}일</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--sd-muted)]">붓기 발생</span>
                  <span className={`text-[16px] font-bold ${summary.angioedemaDays > 0 ? 'text-[var(--sd-crit)]' : ''}`}>{summary.angioedemaDays}일</span>
                </div>
              </div>
              
              {summary.topTriggers.length > 0 && (
                <div className="pt-3 border-t border-[var(--sd-line)]">
                  <span className="text-[11px] text-[var(--sd-muted)] block mb-2">자주 적은 의심 요인</span>
                  <div className="flex flex-wrap gap-2">
                    {summary.topTriggers.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-[var(--sd-surface-2)] text-[12px]">
                        {t.name} <span className="text-[var(--sd-rel)] font-bold">{t.days}일</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 목록 */}
        <div className="space-y-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="sd-card h-40 animate-pulse bg-[var(--sd-line)]/20" />
            ))
          ) : (
            weekGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <div className="flex items-end justify-between px-1">
                  <h2 className="text-[14px] font-bold text-[var(--sd-ink)]">
                    {group.end.split('-').slice(1).join('/')} ~ {group.start.split('-').slice(1).join('/')}
                  </h2>
                  <div className="text-[11px] text-[var(--sd-muted)]">
                    기록 {group.loggedCount}일 · 점수 합 {group.uasSum}
                  </div>
                </div>
                
                <div className="space-y-0">
                  {group.items.map((item, iIdx) => {
                    if ('type' in item && item.type === 'empty-range') {
                      const isSameDay = item.start === item.end;
                      return (
                        <div key={iIdx} className="py-3 px-4 text-[13px] text-[var(--sd-faint)] border-b border-[var(--sd-line)] flex justify-between items-center">
                          <span>{isSameDay ? item.start.split('-').slice(1).join('/') : `${item.end.split('-').slice(1).join('/')} ~ ${item.start.split('-').slice(1).join('/')}`}</span>
                          <span>기록 없음</span>
                        </div>
                      );
                    }
                    return (
                      <SkinDayReport 
                        key={(item as ReportDay).date} 
                        day={item as ReportDay} 
                        onEdit={canEdit ? () => onOpenDay((item as ReportDay).date) : undefined}
                        onOpenPhotos={() => onOpenDay((item as ReportDay).date)}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 p-4 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)]">
          <Info size={16} className="text-[var(--sd-faint)] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[var(--sd-muted)] leading-relaxed">
            이 화면은 입력한 기록을 모아 정리한 것이며 의학적 진단이 아닙니다. 정확한 상태 확인은 반드시 전문의와 상담하세요.
          </p>
        </div>
      </main>
    </div>
  );
}
