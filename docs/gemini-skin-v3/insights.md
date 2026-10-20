## 고칠 것: SkinInsightsView.tsx 2판 — 분석 화면

아래 지금 코드(네가 만든 1판)를 고쳐서 **파일 전체**로 다시 줘. 검수자가 「숫자가 무슨 뜻인지 모르겠다」고 짚은 곳만 고치고 나머지 모양은 그대로.
`bg-white` 는 `bg-[var(--sd-card-solid)]` 로, 머리 `bg-white/90` 는 `bg-[color-mix(in_srgb,var(--sd-card-solid)_90%,transparent)]` 로 바꿔 줘(다크 모드).
DoctorPacer 는 그대로 쓴다(아래 참고용).
 (분석 화면) — 숫자가 무슨 뜻인지 모르겠다는 지적
props에 두 개를 더해 줘: `summary.afterMissedN: number`, `summary.afterTakenN: number` (각 평균을 낸 날 수). 나머지 props는 그대로.
1) 「최근 7일 점수 합 · 0~42」 카드: 지금 4색 막대엔 **현재 위치가 없다.** 0~42 눈금에 맞춰 5구간(0 증상 없음 · 1~6 잘 조절됨 · 7~15 가벼움 · 16~27 중간 · 28~42 심함)으로 나누고, 지금 값 위치에 작은 표시(▼나 점) + 그 구간 이름을 숫자 옆에 칩으로. 값이 null이면 「기록 4일 이상이면 보여요」.
2) 30일 그래프: 범례가 없다. ① 막대 = 그날 점수(0~6), 빨강 = 약 거른 날 — 범례 한 줄 ② y축 0·3·6 얇은 눈금 ③ 날짜 라벨에 **월 표시**(월이 바뀌는 날과 첫 날은 「10/25」, 나머지는 「27」) ④ **기록 없는 날(uas null)과 0점을 구분** — 기록 없는 날은 바닥에 작은 빈 점, 0점은 바닥에 얇은 막대.
3) 「약 거른 다음날 / 먹은 다음날 점수 평균 (0~6)」: 큰 빨간 숫자가 겁준다는 지적. 숫자는 차분한 색(ink)으로, 아래 작게 「n번 비교」(afterMissedN/afterTakenN), 카드 아래 한 줄 「같이 일어난 걸 센 거예요. 원인이라는 뜻은 아니에요.」 n이 2 미만이면 숫자 대신 「더 모이면 보여요」.
4) 「주요 의심 요인」 표: 머리 줄(요인 · 적은 날 · 그날 평균 0~6) 추가. 이름이 「생리 중」「생리 전 1주」인 줄은 아래에 얇은 구분선 두고 「생리 주기」 소제목으로 따로 묶기. 정렬은 내가 넘긴 순서 그대로.


### 지금 코드 SkinInsightsView.tsx
```tsx
// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// Aside 검수 고침(2026-10-21): 낯선 말만 풀어 씀 — UAS7 → 「최근 7일 점수 합 · 0~42」, ▼n → 「지난주보다 n」, 평균에 (0~6), 「등장」→「적음」.
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
          <p className="text-xs font-semibold tracking-wider text-[var(--sd-muted)] mb-2 uppercase">최근 7일 점수 합 · 0~42</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tabular-nums tracking-tighter">
              {summary.uas7 !== null ? summary.uas7 : '-'}
            </span>
            {summary.uas7Prev !== null && summary.uas7 !== null && (
              <span className={`text-sm mb-1 font-medium ${summary.uas7 > summary.uas7Prev ? 'text-[var(--sd-crit)]' : 'text-[var(--sd-rel)]'}`}>
                {summary.uas7 === summary.uas7Prev ? '지난주와 같아요' : `${summary.uas7 > summary.uas7Prev ? '▲' : '▼'} 지난주보다 ${Math.abs(summary.uas7 - summary.uas7Prev)}`}
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
            <p className="text-[10px] font-bold text-[var(--sd-muted)] mb-1">약 거른 다음날 점수 평균 (0~6)</p>
            <p className="text-2xl font-bold text-[var(--sd-crit)] tabular-nums">{summary.afterMissedAvg?.toFixed(1) || '-'}</p>
          </div>
          <div className="sd-card p-4 bg-white text-center">
            <p className="text-[10px] font-bold text-[var(--sd-muted)] mb-1">약 먹은 다음날 점수 평균 (0~6)</p>
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
                    <span className="text-xs text-[var(--sd-muted)] mr-3">{t.days}일 적음</span>
                    <span className="text-sm font-bold tabular-nums">그날 평균 {t.avgUas.toFixed(1)}</span>
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

```

### 참고: DoctorPacer.tsx (고치지 말 것)
```tsx
// 제미나이 시안(2026-10-21, 우댕 전달) — 모양은 값 그대로.
// 고친 것: 이동 거리. 시안은 '0%' ↔ 'calc(100vw - 96px)'처럼 단위가 달라 오른쪽으로 갈 때 순간이동했다 →
//   띠의 실제 너비를 재서 숫자(px)로 움직인다(가운데 정지도 같은 기준).
// DoctorPacer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function DoctorPacer({
  src,
  thinking = false,
}: {
  src: string;
  thinking?: boolean;
}) {
  const bandRef = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  useEffect(() => {
    const el = bandRef.current;
    if (!el) return;
    const measure = () => setTravel(Math.max(0, el.clientWidth - 96));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={bandRef} className="relative w-full h-[120px] overflow-hidden border-b border-[var(--sd-line)] bg-white/50">
      <motion.div
        className="absolute bottom-2"
        initial={{ x: 0 }}
        animate={
          thinking
            ? { x: travel / 2, scaleX: 1, y: 0 } // 고민 중일 때 가운데 정지
            : {
                x: [0, travel, travel, 0, 0],
                scaleX: [1, 1, -1, -1, 1],
                y: [0, -4, 0, -4, 0] // 걷는 듯한 통통 애니메이션
              }
        }
        transition={
          thinking
            ? { duration: 0.5 }
            : {
                duration: 10,
                ease: "linear",
                repeat: Infinity,
                times: [0, 0.45, 0.5, 0.95, 1],
              }
        }
      >
        <div className="relative">
          <img src={src} alt="의사 꿀됑" className="w-[96px] h-auto object-contain drop-shadow-md" />
          {thinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 right-0 bg-white rounded-2xl rounded-br-none px-3 py-1.5 shadow-sm border border-[var(--sd-line)] text-[var(--sd-ink)] text-xs font-bold"
            >
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>.</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

```
