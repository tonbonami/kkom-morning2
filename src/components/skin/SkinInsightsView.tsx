'use client';
// 제미나이 12차(gemini-3-flash CLI, 우댕 2026-10-24): 점수 0~6(팽진+가려움) → 하루 점수 0~10(가려움·붉어짐 중 높은 값). 7일 합 → 7일 평균. 값 그대로.

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
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
    avg7: number | null;      // 최근 7일 하루 점수 평균(0~10) — 기록 3일 미만이면 null
    avg7Prev: number | null;  // 그 전 7일 평균
    days7: number;            // 최근 7일 중 적은 날
    daysLogged: number; 
    daysTotal: number; 
    medMissedDays: number;
    afterMissedAvg: number | null; 
    afterMissedN: number;   // 약 거른 다음날 점수 평균(0~10)
    afterTakenAvg: number | null; 
    afterTakenN: number;
  };
  series: { date: string; sev: number | null; med: MedStatus | null }[];   // 하루 점수 0~10
  triggers: { name: string; days: number; avgUas: number }[];  // avgUas는 이제 0~10 평균
  areas: { name: string; days: number }[];
}) {
  const isEnoughAvg7 = summary.avg7 !== null;
  
  const getSevStatus = (val: number) => {
    if (val === 0) return { label: '없음', color: 'bg-green-500' };
    if (val <= 3) return { label: '가벼움', color: 'bg-emerald-400' };
    if (val <= 6) return { label: '중간', color: 'bg-yellow-400' };
    return { label: '심함', color: 'bg-[var(--sd-crit)]' };
  };

  const status = summary.avg7 !== null ? getSevStatus(summary.avg7) : null;

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if (dateStr === series[0]?.date || day === 1) return `${month}/${day}`;
    return `${day}`;
  };

  const menstrualNames = ['생리 중', '생리 전 1주'];
  const menstrualTriggers = triggers.filter(t => menstrualNames.includes(t.name));
  const otherTriggers = triggers.filter(t => !menstrualNames.includes(t.name));

  return (
    <div className="min-h-screen bg-[var(--sd-surface-2)] text-[var(--sd-ink)] max-w-md mx-auto flex flex-col font-sans">
      <div className="flex items-center p-4 sticky top-0 bg-[color-mix(in_srgb,var(--sd-card-solid)_90%,transparent)] backdrop-blur-md z-20 border-b border-[var(--sd-line)]">
        <button onClick={onBack} className="p-2 -ml-2 mr-2" aria-label="뒤로 가기">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">피부 기록 분석</h1>
      </div>

      <DoctorPacer src={doctorSrc} thinking={thinking} />

      <div className="p-4 space-y-4 pb-32">
        {/* 점수 요약 카드 */}
        <div className="sd-card p-6 bg-[var(--sd-card-solid)]">
          <p className="text-xs font-semibold tracking-wider text-[var(--sd-muted)] mb-3 uppercase">최근 7일 평균 · 0~10</p>
          
          {!isEnoughAvg7 ? (
            <div className="py-4 text-center text-[var(--sd-muted)] text-sm">
              기록이 3일 이상이면 보여요
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl font-bold tabular-nums tracking-tighter">
                  {summary.avg7?.toFixed(1)}
                </span>
                {status && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${status.color}`}>
                    {status.label}
                  </span>
                )}
                {summary.avg7Prev !== null && (
                  <span className={`text-xs ml-auto font-medium ${summary.avg7! > summary.avg7Prev ? 'text-[var(--sd-crit)]' : 'text-[var(--sd-rel)]'}`}>
                    {summary.avg7 === summary.avg7Prev ? '지난주와 동일' : `${summary.avg7! > summary.avg7Prev ? '▲' : '▼'} 지난주보다 ${Math.abs(summary.avg7! - summary.avg7Prev).toFixed(1)}`}
                  </span>
                )}
              </div>
              {summary.days7 < 7 && (
                <p className="text-[10px] text-[var(--sd-muted)] -mt-4 mb-5">
                  7일 중 {summary.days7}일 기록의 평균
                </p>
              )}
              
              <div className="relative h-2.5 mt-8">
                <div className="absolute inset-0 flex gap-0.5 rounded-full overflow-hidden opacity-30">
                  <div className="h-full bg-emerald-400" style={{ width: '30%' }} /> {/* 0-3 */}
                  <div className="h-full bg-yellow-400" style={{ width: '30%' }} /> {/* 3-6 */}
                  <div className="h-full bg-[var(--sd-crit)]" style={{ width: '40%' }} /> {/* 6-10 */}
                </div>
                <motion.div 
                  initial={{ left: 0 }}
                  animate={{ left: `${(summary.avg7! / 10) * 100}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-1.5 flex flex-col items-center"
                >
                  <div className="w-3 h-3 rounded-full border-2 border-[var(--sd-card-solid)] bg-[var(--sd-ink)] shadow-sm" />
                  <span className="text-[10px] font-bold mt-1">▼</span>
                </motion.div>
              </div>
              <div className="relative h-3 mt-5 text-[9px] font-bold text-[var(--sd-faint)] uppercase tracking-tighter">
                {[0, 3, 6, 10].map((v) => (
                  <span key={v} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(v / 10) * 100}%` }}>{v}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 30일 그래프 */}
        <div className="sd-card p-5 bg-[var(--sd-card-solid)]">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-semibold tracking-wider text-[var(--sd-muted)] uppercase">최근 30일 흐름</p>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-[var(--sd-ink)] opacity-20" />
                <span className="text-[10px] text-[var(--sd-muted)]">그날 점수 (0~10)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm bg-[color-mix(in_srgb,var(--sd-crit)_60%,transparent)]" />
                <span className="text-[10px] text-[var(--sd-muted)]">약 거른 날</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full border border-[var(--sd-muted)]" />
                <span className="text-[10px] text-[var(--sd-muted)]">기록 없음</span>
              </div>
            </div>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series.map((s) => ({ ...s, bar: s.sev === null ? 0.25 : Math.max(s.sev, 0.25) }))} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--sd-line)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9, fill: 'var(--sd-muted)', fontWeight: 500 }} 
                  tickFormatter={formatXAxis}
                  axisLine={false} 
                  tickLine={false}
                  minTickGap={12}
                />
                <YAxis 
                  domain={[0, 10]} 
                  ticks={[0, 5, 10]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'var(--sd-muted)' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'var(--sd-surface-2)', opacity: 0.4 }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[var(--sd-card-solid)] p-2 rounded-lg shadow-lg border border-[var(--sd-line)] text-xs">
                          <p className="font-bold mb-1">{data.date}</p>
                          <p className="text-[var(--sd-muted)]">점수: <span className="text-[var(--sd-ink)]">{data.sev ?? '안 적음'}</span></p>
                          {data.med === 'missed' && <p className="text-[var(--sd-crit)] font-bold">약 거름</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bar" radius={[2, 2, 2, 2]}>
                  {series.map((entry, index) => {
                    const isNull = entry.sev === null;
                    const isZero = entry.sev === 0;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isNull ? 'transparent' : (entry.med === 'missed' ? 'var(--sd-crit)' : 'var(--sd-ink)')} 
                        opacity={isNull ? 1 : (isZero ? 0.4 : (entry.med === 'missed' ? 0.6 : 0.2))}
                        stroke={isNull ? 'var(--sd-muted)' : 'none'}
                        strokeWidth={isNull ? 1 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 약 복용 비교 */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="sd-card p-4 bg-[var(--sd-card-solid)] flex flex-col items-center text-center">
              <p className="text-[10px] font-bold text-[var(--sd-muted)] mb-2 leading-tight">약 거른 다음날<br/>점수 평균 (0~10)</p>
              {summary.afterMissedN < 2 ? (
                <p className="text-xs font-medium text-[var(--sd-faint)] my-2">더 모이면 보여요</p>
              ) : (
                <>
                  <p className={`${summary.afterMissedN < 5 ? 'text-2xl' : 'text-3xl'} font-bold text-[var(--sd-ink)] tabular-nums`}>{summary.afterMissedAvg?.toFixed(1)}</p>
                  {summary.afterMissedN < 5 ? (
                    <p className="text-[9px] text-[var(--sd-muted)] mt-1">아직 {summary.afterMissedN}번뿐 — 더 모이면 정확해져요</p>
                  ) : (
                    <p className="text-[9px] text-[var(--sd-muted)] mt-1">{summary.afterMissedN}번 비교</p>
                  )}
                </>
              )}
            </div>
            <div className="sd-card p-4 bg-[var(--sd-card-solid)] flex flex-col items-center text-center">
              <p className="text-[10px] font-bold text-[var(--sd-muted)] mb-2 leading-tight">약 먹은 다음날<br/>점수 평균 (0~10)</p>
              {summary.afterTakenN < 2 ? (
                <p className="text-xs font-medium text-[var(--sd-faint)] my-2">더 모이면 보여요</p>
              ) : (
                <>
                  <p className={`${summary.afterTakenN < 5 ? 'text-2xl' : 'text-3xl'} font-bold text-[var(--sd-ink)] tabular-nums`}>{summary.afterTakenAvg?.toFixed(1)}</p>
                  {summary.afterTakenN < 5 ? (
                    <p className="text-[9px] text-[var(--sd-muted)] mt-1">아직 {summary.afterTakenN}번뿐 — 더 모이면 정확해져요</p>
                  ) : (
                    <p className="text-[9px] text-[var(--sd-muted)] mt-1">{summary.afterTakenN}번 비교</p>
                  )}
                </>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[var(--sd-muted)] px-1 flex items-start gap-1.5 leading-relaxed">
            <Info size={12} className="shrink-0 mt-0.5 opacity-60" />
            같이 일어난 걸 센 거예요. 원인이라는 뜻은 아니에요.
          </p>
        </div>

        {/* 트리거 요인 테이블 */}
        {(otherTriggers.length > 0 || menstrualTriggers.length > 0) && (
          <div className="sd-card overflow-hidden bg-[var(--sd-card-solid)]">
            <div className="p-5 pb-2">
              <p className="text-xs font-semibold tracking-wider text-[var(--sd-muted)] uppercase">주요 의심 요인</p>
            </div>
            
            <div className="px-5 pb-5">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-[var(--sd-muted)] border-b border-[var(--sd-line)]">
                    <th className="py-2 font-bold uppercase">요인</th>
                    <th className="py-2 font-bold uppercase text-center">적은 날</th>
                    <th className="py-2 font-bold uppercase text-right">0~10</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {otherTriggers.map((t, idx) => (
                    <tr key={t.name} className={idx === otherTriggers.length - 1 && menstrualTriggers.length === 0 ? "" : "border-b border-[var(--sd-line)]"}>
                      <td className="py-3 font-medium">{t.name}</td>
                      <td className="py-3 text-center tabular-nums text-[var(--sd-muted)]">{t.days}일</td>
                      <td className="py-3 text-right font-bold tabular-nums">{t.avgUas.toFixed(1)}</td>
                    </tr>
                  ))}
                  
                  {menstrualTriggers.length > 0 && (
                    <>
                      <tr className="bg-[var(--sd-surface-2)]">
                        <td colSpan={3} className="px-2 py-1.5 text-[10px] font-bold text-[var(--sd-muted)]">생리 주기</td>
                      </tr>
                      {menstrualTriggers.map((t, idx) => (
                        <tr key={t.name} className={idx === menstrualTriggers.length - 1 ? "" : "border-b border-[var(--sd-line)]"}>
                          <td className="py-3 font-medium pl-2">{t.name}</td>
                          <td className="py-3 text-center tabular-nums text-[var(--sd-muted)]">{t.days}일</td>
                          <td className="py-3 text-right font-bold tabular-nums">{t.avgUas.toFixed(1)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-[11px] text-[var(--sd-muted)] text-center mt-8 px-6 leading-relaxed opacity-80">
          이 화면은 기록을 정리한 것이고 진단이 아니에요.<br/>진료는 피부과·알레르기내과에서 받아주세요.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-[var(--sd-surface-2)] via-[var(--sd-surface-2)] to-transparent z-30">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onOpenChat}
          className="w-full h-14 rounded-2xl bg-[var(--sd-rel)] text-white font-bold text-lg flex justify-center items-center gap-2 shadow-xl shadow-[color-mix(in_srgb,var(--sd-rel)_20%,transparent)]"
        >
          <MessageCircle size={20} />
          Claude와 상담하기
        </motion.button>
      </div>
    </div>
  );
}
