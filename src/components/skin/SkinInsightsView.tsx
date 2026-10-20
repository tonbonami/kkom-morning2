// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// SkinInsightsView.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DoctorPacer from './DoctorPacer';
import { MedStatus } from './skinUi';

export default function SkinInsightsView({
  doctorSrc,
  thinking,
  onBack,
  onOpenChat,
  summary,
  series,
  triggers,
  areas,
}: {
  doctorSrc: string;
  thinking: boolean;
  onBack: () => void;
  onOpenChat: () => void;
  summary: {
    uas7: number | null;
    uas7Prev: number | null;
    daysLogged: number; daysTotal: number;
    medMissedDays: number;
    afterMissedAvg: number | null;
    afterTakenAvg: number | null;
  };
  series: { date: string; uas: number | null; med: MedStatus | null }[];
  triggers: { name: string; days: number; avgUas: number }[];
  areas: { name: string; days: number }[];
}) {
  const isEnoughData = summary.daysLogged >= 7;

  return (
    <div className="min-h-screen bg-[var(--sd-surface-2)] text-[var(--sd-ink)] max-w-md mx-auto flex flex-col font-sans">
      <div className="flex items-center p-4 sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-[var(--sd-line)]">
        <button onClick={onBack} className="p-2 -ml-2 mr-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">피부 기록 분석</h1>
      </div>

      <DoctorPacer src={doctorSrc} thinking={thinking} />

      <div className="p-4 space-y-4 pb-24">
        {!isEnoughData && (
          <div className="sd-card p-6 text-center text-[var(--sd-muted)] text-sm">
            기록이 7일 이상 쌓이면 정확한 분석을 볼 수 있어요. (현재 {summary.daysLogged}일)
          </div>
        )}

        {/* UAS7 요약 카드 */}
        <div className="sd-card p-6 bg-white">
          <p className="text-xs font-semibold tracking-wider text-[var(--sd-muted)] mb-2 uppercase">최근 7일 UAS7</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tabular-nums tracking-tighter">
              {summary.uas7 !== null ? summary.uas7 : '-'}
            </span>
            {summary.uas7Prev !== null && summary.uas7 !== null && (
              <span className={`text-sm mb-1 font-medium ${summary.uas7 > summary.uas7Prev ? 'text-[var(--sd-crit)]' : 'text-[var(--sd-rel)]'}`}>
                {summary.uas7 > summary.uas7Prev ? '▲' : '▼'} {Math.abs(summary.uas7 - summary.uas7Prev)}
              </span>
            )}
          </div>
          <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden opacity-80">
            <div className="bg-green-400 flex-1" />
            <div className="bg-yellow-400 flex-1" />
            <div className="bg-orange-400 flex-1" />
            <div className="bg-[var(--sd-crit)] flex-1" />
          </div>
        </div>

        {/* 30일 그래프 */}
        <div className="sd-card p-5 bg-white h-64">
          <p className="text-xs font-semibold tracking-wider text-[var(--sd-muted)] mb-4 uppercase">최근 30일 흐름</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--sd-muted)' }} tickFormatter={(val) => val.slice(-2)} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--sd-surface-2)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="uas" radius={[4, 4, 0, 0]}>
                {series.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.med === 'missed' ? 'var(--sd-crit)' : 'var(--sd-ink)'} opacity={entry.med === 'missed' ? 0.7 : 0.2} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 약 복용 비교 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="sd-card p-4 bg-white text-center">
            <p className="text-[10px] font-bold text-[var(--sd-muted)] mb-1">약 거른 다음날 평균</p>
            <p className="text-2xl font-bold text-[var(--sd-crit)] tabular-nums">{summary.afterMissedAvg?.toFixed(1) || '-'}</p>
          </div>
          <div className="sd-card p-4 bg-white text-center">
            <p className="text-[10px] font-bold text-[var(--sd-muted)] mb-1">약 먹은 다음날 평균</p>
            <p className="text-2xl font-bold text-[var(--sd-ink)] tabular-nums">{summary.afterTakenAvg?.toFixed(1) || '-'}</p>
          </div>
        </div>

        {/* 트리거 */}
        {triggers.length > 0 && (
          <div className="sd-card p-5 bg-white">
            <p className="text-xs font-semibold tracking-wider text-[var(--sd-muted)] mb-3 uppercase">주요 의심 요인</p>
            <div className="space-y-3">
              {triggers.map(t => (
                <div key={t.name} className="flex justify-between items-center border-b border-[var(--sd-line)] pb-2 last:border-0 last:pb-0">
                  <span className="text-sm font-medium">{t.name}</span>
                  <div className="text-right">
                    <span className="text-xs text-[var(--sd-muted)] mr-3">{t.days}일 등장</span>
                    <span className="text-sm font-bold tabular-nums">평균 {t.avgUas.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-[var(--sd-muted)] text-center mt-8 px-4 leading-relaxed">
          이 화면은 기록을 정리한 것이고 진단이 아니에요.<br/>진료는 피부과·알레르기내과에서 받아주세요.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-[var(--sd-surface-2)] via-[var(--sd-surface-2)] to-transparent">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onOpenChat}
          className="w-full py-4 rounded-2xl bg-[var(--sd-rel)] text-white font-bold text-lg flex justify-center items-center gap-2 shadow-lg"
        >
          <MessageCircle size={20} />
          Claude와 상담하기
        </motion.button>
      </div>
    </div>
  );
}
