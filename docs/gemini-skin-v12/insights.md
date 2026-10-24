## 고칠 것: SkinInsightsView.tsx — 점수 기준이 0~6(팽진+가려움)에서 0~10으로 (우댕 2026-10-24)
팽진을 없애고 가려움·붉어짐을 0~10으로 적는다. 하루 대표 점수 = 둘 중 높은 값(0~10). props를 이렇게 바꿔 줘:
```ts
summary: {
  avg7: number | null;      // 최근 7일 하루 점수 평균(0~10, 소수 한 자리) — 기록 3일 미만이면 null
  avg7Prev: number | null;  // 그 전 7일 평균
  days7: number;            // 최근 7일 중 적은 날
  daysLogged: number; daysTotal: number; medMissedDays: number;
  afterMissedAvg: number | null; afterMissedN: number;   // 약 거른 다음날 점수 평균(0~10)
  afterTakenAvg: number | null; afterTakenN: number;
};
series: { date: string; sev: number | null; med: MedStatus | null }[];   // 하루 점수 0~10
triggers: { name: string; days: number; avgUas: number }[];  // avgUas는 이제 0~10 평균(이름만 그대로)
```
1. 맨 위 카드: 「최근 7일 점수 합 · 0~42」 → **「최근 7일 평균 · 0~10」**. 큰 숫자 avg7(소수 한 자리), 구간 칩: 0 「없음」 · 0.1~3 「가벼움」 · 3.1~6 「중간」 · 6.1~10 「심함」. 막대 구간도 이 네 칸, 눈금 0·3·6·10을 구간 경계 자리에(지금처럼 absolute left %). 위치 표시는 avg7/10. 지난주 비교 「▲/▼ 지난주보다 n」(소수 한 자리). days7 < 7이면 아래 작게 「7일 중 n일 기록의 평균」. avg7 null이면 「기록이 3일 이상이면 보여요」.
2. 30일 그래프: 세로 0~10(눈금 0·5·10), 막대 = sev. 기록 없는 날 빈 동그라미·0점 얇은 막대 구분은 그대로(값 키만 sev로). 범례 「그날 점수 (0~10)」.
3. 약 비교 카드 「(0~6)」 → 「(0~10)」, 의심 요인 표 머리 「그날 평균 0~6」 → 「0~10」.
4. 그 밖은 그대로.

### ⚠️ 이건 「고치기」다
지금 코드를 한 줄씩 그대로 옮겨 적고, 위에 적힌 곳만 바꿔라. 문구·기능·props·맨 위 머리 주석을 빼거나 바꾸지 마라. 설명 글은 코드 블록 밖에 쓰지 말고, 답은 ```tsx 블록 하나만.

### 지금 코드 SkinInsightsView.tsx
```tsx
'use client';
// 제미나이 4차(Aside 2차 반영, gemini-3-flash CLI): 「7일 중 n일 기록 · 빈 날은 평균으로 채운 값」 · 기록 없는 날 빈 동그라미 · 표본 2~4번이면 「아직 n번뿐」. 값 그대로.
// 제미나이 시안 2판(2026-10-21, gemini-3-flash CLI로 받음) — 검수 반영(구간 표시·범례·n번 비교·요인 표 머리). 값 그대로.
// 고친 것(버그만): ① 30일 기록 수로 7일 합을 보여 줄지 정해서 7일 합이 없을 때 빈 숫자·NaN 위치 → uas7이 있을 때만
//   ② 기록 없는 날·0점 막대 높이(시안이 계산만 하고 안 씀) → 막대 값으로 씀.
//   ⑤ 범례에 동그라미가 두 번(그림 + 글자 「○」) → 글자에서 뺌. (Aside 3차)
//   ③ 눈금 0·6·15·27·42가 같은 간격이라 11점 점이 「6」 위에 있는 것처럼 보임 → 구간 경계 자리에 ④ 날짜 라벨이 틱 번호로 앞날을 찾아 「10/110/3…」로 붙음 → 날짜로 판단(1일·첫날만 월), 간격 넓힘. (Aside 2차)
// SkinInsightsView.tsx

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
    uas7: number | null;
    uas7Prev: number | null;
    daysLogged: number;
    daysTotal: number;
    medMissedDays: number;
    afterMissedAvg: number | null;
    afterMissedN: number;
    afterTakenAvg: number | null;
    afterTakenN: number;
    uas7Days: number;
  };
  series: { date: string; uas: number | null; med: MedStatus | null }[];
  triggers: { name: string; days: number; avgUas: number }[];
  areas: { name: string; days: number }[];
}) {
  const isEnoughUas7 = summary.uas7 !== null; // 4일 이상이면 UAS7 표시 (보통 임상 지침)
  
  const getUas7Status = (val: number) => {
    if (val === 0) return { label: '증상 없음', color: 'bg-green-500' };
    if (val <= 6) return { label: '잘 조절됨', color: 'bg-emerald-400' };
    if (val <= 15) return { label: '가벼움', color: 'bg-yellow-400' };
    if (val <= 27) return { label: '중간', color: 'bg-orange-400' };
    return { label: '심함', color: 'bg-[var(--sd-crit)]' };
  };

  const status = summary.uas7 !== null ? getUas7Status(summary.uas7) : null;

  // 그래프 X축 포맷: 월이 바뀌거나 첫 날이면 MM/DD, 아니면 DD
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if (dateStr === series[0]?.date || day === 1) return `${month}/${day}`;
    return `${day}`;
  };

  // 트리거 그룹화 (생리 주기 관련)
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
        {/* UAS7 요약 카드 */}
        <div className="sd-card p-6 bg-[var(--sd-card-solid)]">
          <p className="text-xs font-semibold tracking-wider text-[var(--sd-muted)] mb-3 uppercase">최근 7일 점수 합 · 0~42</p>
          
          {!isEnoughUas7 ? (
            <div className="py-4 text-center text-[var(--sd-muted)] text-sm">
              기록이 4일 이상이면 보여요
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl font-bold tabular-nums tracking-tighter">
                  {summary.uas7}
                </span>
                {status && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${status.color}`}>
                    {status.label}
                  </span>
                )}
                {summary.uas7Prev !== null && (
                  <span className={`text-xs ml-auto font-medium ${summary.uas7! > summary.uas7Prev ? 'text-[var(--sd-crit)]' : 'text-[var(--sd-rel)]'}`}>
                    {summary.uas7 === summary.uas7Prev ? '지난주와 동일' : `${summary.uas7! > summary.uas7Prev ? '▲' : '▼'} 지난주보다 ${Math.abs(summary.uas7! - summary.uas7Prev)}`}
                  </span>
                )}
              </div>
              {summary.uas7Days < 7 && (
                <p className="text-[10px] text-[var(--sd-muted)] -mt-4 mb-5">
                  7일 중 {summary.uas7Days}일 기록 · 빈 날은 평균으로 채운 값
                </p>
              )}
              
              <div className="relative h-2.5 mt-8">
                {/* 배경 구간 막대 */}
                <div className="absolute inset-0 flex gap-0.5 rounded-full overflow-hidden opacity-30">
                  <div className="h-full bg-emerald-400" style={{ width: '14.3%' }} /> {/* 1-6 */}
                  <div className="h-full bg-yellow-400" style={{ width: '21.4%' }} /> {/* 7-15 */}
                  <div className="h-full bg-orange-400" style={{ width: '28.6%' }} /> {/* 16-27 */}
                  <div className="h-full bg-[var(--sd-crit)]" style={{ width: '35.7%' }} /> {/* 28-42 */}
                </div>
                {/* 현재 위치 표시기 */}
                <motion.div 
                  initial={{ left: 0 }}
                  animate={{ left: `${(summary.uas7! / 42) * 100}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-1.5 flex flex-col items-center"
                >
                  <div className="w-3 h-3 rounded-full border-2 border-[var(--sd-card-solid)] bg-[var(--sd-ink)] shadow-sm" />
                  <span className="text-[10px] font-bold mt-1">▼</span>
                </motion.div>
              </div>
              <div className="relative h-3 mt-5 text-[9px] font-bold text-[var(--sd-faint)] uppercase tracking-tighter">
                {[0, 6, 15, 27, 42].map((v) => (
                  <span key={v} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(v / 42) * 100}%` }}>{v}</span>
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
                <span className="text-[10px] text-[var(--sd-muted)]">그날 점수 (0~6)</span>
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
              <BarChart data={series.map((s) => ({ ...s, bar: s.uas === null ? 0.15 : Math.max(s.uas, 0.15) }))} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
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
                  domain={[0, 6]} 
                  ticks={[0, 3, 6]} 
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
                          <p className="text-[var(--sd-muted)]">점수: <span className="text-[var(--sd-ink)]">{data.uas ?? '안 적음'}</span></p>
                          {data.med === 'missed' && <p className="text-[var(--sd-crit)] font-bold">약 거름</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bar" radius={[2, 2, 2, 2]}>
                  {series.map((entry, index) => {
                    // 기록 없는 날(null)은 빈 동그라미, 0점은 얇고 진한 막대
                    const isNull = entry.uas === null;
                    const isZero = entry.uas === 0;
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
              <p className="text-[10px] font-bold text-[var(--sd-muted)] mb-2 leading-tight">약 거른 다음날<br/>점수 평균 (0~6)</p>
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
              <p className="text-[10px] font-bold text-[var(--sd-muted)] mb-2 leading-tight">약 먹은 다음날<br/>점수 평균 (0~6)</p>
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
                    <th className="py-2 font-bold uppercase text-right">평균 (0~6)</th>
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

      {/* 하단 플로팅 버튼 */}
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

```
