# 제미나이에게 — 피부 일지 Aside 검수 반영 (분석·7일 띠·하루 기록)

> 우댕: 아래 Run 명령으로 클립보드에 넣고 제미나이(새 대화 OK)에 ⌘V.
> `awk '/^## 보낼 글/{f=1;next} f' docs/gemini-skin-review-fixes.md | pbcopy`
> 버그(119 띠 글자, 날 바꾸면 사라짐, 잘림 등)는 꼼모닝 세션이 이미 고쳤다(5121bea). 여기는 모양을 바꿔야 하는 것만.

## 보낼 글

커플 앱(Next.js 15 + React + Tailwind 3 + framer-motion + lucide-react + recharts, 휴대폰 세로 390px)의 「꼼이 피부 일지」 컴포넌트 3개를 손봐 줘. 아래가 지금 코드야(네가 예전에 만든 것). 검수자가 실제로 써 보고 짚은 문제들이라 **문제난 곳만** 고치고 나머지 모양은 그대로 둬. 세 파일 모두 **파일 전체**로 다시 줘.

색은 지금처럼 CSS 변수(var(--sd-…))로만. ⚠️ `bg-[var(--x)] bg-opacity-10`은 CSS 변수 색에 안 먹어서 글자가 배경에 묻혔었어 — 옅은 배경은 `bg-[color-mix(in_srgb,var(--sd-crit)_12%,transparent)]`처럼 써 줘. `bg-white` 같은 고정색 대신 `var(--sd-card-solid)`.

## 1. SkinInsightsView.tsx (분석 화면) — 숫자가 무슨 뜻인지 모르겠다는 지적
props에 두 개를 더해 줘: `summary.afterMissedN: number`, `summary.afterTakenN: number` (각 평균을 낸 날 수). 나머지 props는 그대로.
1) 「최근 7일 점수 합 · 0~42」 카드: 지금 4색 막대엔 **현재 위치가 없다.** 0~42 눈금에 맞춰 5구간(0 증상 없음 · 1~6 잘 조절됨 · 7~15 가벼움 · 16~27 중간 · 28~42 심함)으로 나누고, 지금 값 위치에 작은 표시(▼나 점) + 그 구간 이름을 숫자 옆에 칩으로. 값이 null이면 「기록 4일 이상이면 보여요」.
2) 30일 그래프: 범례가 없다. ① 막대 = 그날 점수(0~6), 빨강 = 약 거른 날 — 범례 한 줄 ② y축 0·3·6 얇은 눈금 ③ 날짜 라벨에 **월 표시**(월이 바뀌는 날과 첫 날은 「10/25」, 나머지는 「27」) ④ **기록 없는 날(uas null)과 0점을 구분** — 기록 없는 날은 바닥에 작은 빈 점, 0점은 바닥에 얇은 막대.
3) 「약 거른 다음날 / 먹은 다음날 점수 평균 (0~6)」: 큰 빨간 숫자가 겁준다는 지적. 숫자는 차분한 색(ink)으로, 아래 작게 「n번 비교」(afterMissedN/afterTakenN), 카드 아래 한 줄 「같이 일어난 걸 센 거예요. 원인이라는 뜻은 아니에요.」 n이 2 미만이면 숫자 대신 「더 모이면 보여요」.
4) 「주요 의심 요인」 표: 머리 줄(요인 · 적은 날 · 그날 평균 0~6) 추가. 이름이 「생리 중」「생리 전 1주」인 줄은 아래에 얇은 구분선 두고 「생리 주기」 소제목으로 따로 묶기. 정렬은 내가 넘긴 순서 그대로.

## 2. SkinWeekStrip.tsx (7일 띠)
- 카드 아래에 범례 한 줄(작게): 진할수록 점수 높음 · ✓ 약 먹음 · ✕ 거름 · 시계 늦게.
- 기록 없는 날(hasLog false)은 동그라미 테두리를 점선으로.
- 390px에서 7칸이 카드 안에 들어가게(지금 여백 px-2·칸 px-1로 줄여 둠 — 유지).

## 3. SkinDayForm.tsx (하루 기록) — 매일 30초 안에 끝내기
1) **첫 화면에 점수와 약이 같이**: 390×844 기준 스크롤 없이 「팽진·가려움」과 「약(먹음/늦게/거름)」이 한 화면에 보이게. 오늘 점수 카드 안 여백·버튼 높이를 줄이거나 두 카드를 하나로 합쳐도 좋아.
2) 오른쪽 위 점수 표시는 「3 / 6」(지금처럼 UAS라는 말 없이).
3) 생활 칸:
   - **잠**: −/+ 0.5씩 14번 눌러야 7시간이 됨 → 시간 칩(4 · 5 · 6 · 7 · 8 · 9) 한 줄 + 옆에 −/+ 0.5 미세 조정. 안 적었으면 비어 보이게.
   - **스트레스**: 안 적었는데 슬라이더가 가운데(5)에 있어서 적은 것처럼 보임 → 안 적었을 땐 「안 적음」으로 비어 보이게(예: 0~10 숫자 칩 한 줄, 또는 슬라이더 손잡이를 처음 누르기 전엔 숨김).
4) 「의심 가는 것 (트리거)」 제목에서 외래어 빼고 「의심 가는 것」.
5) 나머지 칸·요약·저장 막대는 그대로.

### 공통 타입 skinUi.ts (그대로)
```ts
// skinUi.ts
export type MedStatus = 'taken' | 'missed' | 'late';

export interface SkinMed {
  name: string;
  dose?: string | null;
  time?: string | null;
  status: MedStatus | null;
}

export interface SkinEpisode {
  start?: string | null;
  durMin?: number | null;
  areas: string[];
  over24h?: boolean | null;
  bruiseLike?: boolean | null;
}

export interface SkinFood {
  t?: string | null;
  text: string;
}

export interface SkinDraft {
  date: string; // 'YYYY-MM-DD'
  wheals: number | null; // 0~3
  itch: number | null; // 0~3
  meds: SkinMed[];
  episodes: SkinEpisode[];
  angioedema: { present: boolean; areas: string[] } | null;
  trace: string | null;
  triggers: string[];
  foods: SkinFood[];
  sleepH: number | null;
  wakeItch: boolean | null;
  waterMl: number | null;
  stress: number | null; // 0~10
  period: boolean | null;
  cycleDay: number | null;
  newProducts: string[];
  note: string;
}

export const AREAS = ['손·손바닥', '팔', '발·발바닥', '다리·허벅지', '몸통', '목', '얼굴', '두피', '엉덩이'];
export const TRIGGERS = ['약 거름', '운동·걷기', '더위·열감', '샤워 후', '땀', '스트레스', '잠 부족', '술', '매운 음식', '밀가루·면', '유제품', '해산물', '견과', '생리 주기', '새 제품', '추위', '압박(옷·가방끈)', '공복', '모르겠음'];
```

### 지금 SkinWeekStrip.tsx
```tsx
// SkinWeekStrip.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { MedStatus } from './skinUi';
import { Check, X, Clock } from 'lucide-react';

export default function SkinWeekStrip({
  days,
  selected,
  onSelect,
}: {
  days: { date: string; label: string; uas: number | null; med: MedStatus | null; hasLog: boolean }[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="flex justify-between items-center px-2 py-3 sd-card mb-4">
      {days.map((day) => {
        const isSelected = day.date === selected;
        const uasLevel = day.uas !== null ? Math.min(day.uas / 6, 1) : 0;

        return (
          <motion.button
            key={day.date}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(day.date)}
            className={`flex flex-col items-center px-1 py-2 rounded-xl transition-colors ${
              isSelected ? 'bg-[var(--sd-surface-2)]' : ''
            }`}
          >
            <span className={`text-[11px] mb-1 ${isSelected ? 'font-bold' : 'text-[var(--sd-muted)]'}`}>
              {day.label}
            </span>
            <div className="relative w-8 h-8 flex items-center justify-center rounded-full border border-[var(--sd-line)] mb-1">
              {day.hasLog ? (
                <div
                  className="absolute inset-1 rounded-full bg-[var(--sd-rel)]"
                  style={{ opacity: day.uas !== null ? 0.2 + (uasLevel * 0.8) : 0 }}
                />
              ) : null}
              <span className={`relative text-sm z-10 ${isSelected ? 'font-bold' : ''}`}>
                {day.date.slice(-2)}
              </span>
            </div>
            <div className="h-3 flex items-center justify-center">
              {day.med === 'taken' && <Check size={12} color="var(--sd-rel)" />}
              {day.med === 'missed' && <X size={12} color="var(--sd-crit)" />}
              {day.med === 'late' && <Clock size={12} color="var(--sd-rel-soft)" />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
```

### 지금 SkinInsightsView.tsx
```tsx
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

### 지금 SkinDayForm.tsx
```tsx
// SkinDayForm.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkinDraft, AREAS, TRIGGERS, SkinMed, SkinEpisode, SkinFood } from './skinUi';
import { ChevronDown, ChevronUp, Plus, AlertCircle, Check, Trash2 } from 'lucide-react';

export default function SkinDayForm({
  value,
  onChange,
  onSave,
  saving,
  savedAt,
  isToday,
}: {
  value: SkinDraft;
  onChange: (patch: Partial<SkinDraft>) => void;
  onSave: () => void;
  saving: boolean;
  savedAt: string | null;
  isToday: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // 직접 입력칸용 로컬 상태
  const [customTrigger, setCustomTrigger] = useState('');
  const [newProduct, setNewProduct] = useState('');

  const toggleSection = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // --- 요약 문구 생성기 ---
  const uasScore = (value.wheals ?? 0) + (value.itch ?? 0);
  const isUasEmpty = value.wheals === null && value.itch === null;

  const episodeSummary = value.episodes.length > 0
    ? `${value.episodes.length}번 · ${
        value.episodes[0].areas.length > 0
          ? (value.episodes[0].areas.length > 1 ? `${value.episodes[0].areas[0]} 외 ${value.episodes[0].areas.length - 1}곳` : value.episodes[0].areas[0])
          : '부위 미지정'
      }${value.episodes[0].durMin ? ` · ${value.episodes[0].durMin}분` : ''}`
    : undefined;

  const foodSummary = value.foods.length > 0 ? `${value.foods.length}개 기록됨` : undefined;

  const lifeSummaryParts = [];
  if (value.sleepH !== null) lifeSummaryParts.push(`잠 ${value.sleepH}시간`);
  if (value.waterMl !== null) lifeSummaryParts.push(`물 ${value.waterMl}ml`);
  if (value.stress !== null) lifeSummaryParts.push(`스트레스 ${value.stress}`);
  if (value.wakeItch !== null) lifeSummaryParts.push(value.wakeItch ? '가려워 깸' : '안 깸');
  const lifeSummary = lifeSummaryParts.length > 0 ? lifeSummaryParts.join(' · ') : undefined;

  const periodSummary = value.period !== null
    ? (value.period ? `생리 중${value.cycleDay ? ` (${value.cycleDay}일째)` : ''}` : '아님')
    : undefined;

  const newProductsSummary = value.newProducts.length > 0 ? `${value.newProducts.length}개 기록됨` : undefined;

  return (
    <div className="pb-32 space-y-4">
      {/* 1. 오늘 점수 (UAS) */}
      <div className="sd-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[var(--sd-ink)]">오늘 점수</h2>
          <span className="text-xl font-bold text-[var(--sd-rel)]">
            {isUasEmpty ? '-' : `${uasScore} / 6`}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--sd-muted)] mb-2">팽진 (부푼 자국)</p>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((score) => (
                <motion.button
                  key={`wheal-${score}`}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onChange({ wheals: score })}
                  className={`flex-1 py-2 text-sm rounded-xl border ${
                    value.wheals === score
                      ? 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]'
                      : 'bg-white text-[var(--sd-ink)] border-[var(--sd-line)]'
                  }`}
                >
                  {score === 0 ? '없음' : score === 1 ? '약간' : score === 2 ? '보통' : '심함'}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--sd-muted)] mb-2">가려움</p>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((score) => (
                <motion.button
                  key={`itch-${score}`}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onChange({ itch: score })}
                  className={`flex-1 py-2 text-sm rounded-xl border ${
                    value.itch === score
                      ? 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]'
                      : 'bg-white text-[var(--sd-ink)] border-[var(--sd-line)]'
                  }`}
                >
                  {score === 0 ? '없음' : score === 1 ? '약간' : score === 2 ? '보통' : '심함'}
                </motion.button>
              ))}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange({ wheals: 0, itch: 0 })}
            className="w-full py-3 mt-2 rounded-xl bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm font-medium"
          >
            오늘은 증상 없음
          </motion.button>
        </div>
      </div>

      {/* 2. 약 */}
      <div className="sd-card p-5">
        <h2 className="text-lg font-bold text-[var(--sd-ink)] mb-4">약</h2>
        <div className="space-y-3">
          {value.meds.map((med, idx) => (
            <div key={idx} className="flex flex-col gap-2 p-3 bg-[var(--sd-surface-2)] rounded-xl border border-[var(--sd-line)]">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="약 이름 (예: 항히스타민제)"
                  value={med.name}
                  onChange={(e) => {
                    const next = value.meds.map((m, i) => i === idx ? { ...m, name: e.target.value } : m);
                    onChange({ meds: next });
                  }}
                  className="bg-transparent border-none text-sm outline-none text-[var(--sd-ink)] flex-1 font-medium min-w-0"
                />
                <button
                  onClick={() => onChange({ meds: value.meds.filter((_, i) => i !== idx) })}
                  className="p-1 text-[var(--sd-muted)] hover:text-[var(--sd-crit)]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="time"
                  value={med.time || ''}
                  onChange={(e) => {
                    const next = value.meds.map((m, i) => i === idx ? { ...m, time: e.target.value } : m);
                    onChange({ meds: next });
                  }}
                  className="bg-white rounded-lg px-2 py-1 text-sm border border-[var(--sd-line)] text-[var(--sd-ink)]"
                />
                <div className="flex flex-1 gap-1">
                  {(['taken', 'late', 'missed'] as const).map((status) => (
                    <motion.button
                      key={status}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const next = value.meds.map((m, i) => i === idx ? { ...m, status } : m);
                        onChange({ meds: next });
                      }}
                      className={`flex-1 py-1 text-xs rounded-lg border ${
                        med.status === status
                          ? status === 'missed' ? 'bg-[var(--sd-crit)] text-white border-[var(--sd-crit)]' : 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]'
                          : 'bg-white text-[var(--sd-muted)] border-[var(--sd-line)]'
                      }`}
                    >
                      {status === 'taken' ? '먹음' : status === 'late' ? '늦게' : '거름'}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange({ meds: [...value.meds, { name: '', status: null }] })}
            className="flex items-center justify-center w-full py-3 rounded-xl border border-dashed border-[var(--sd-line)] text-[var(--sd-muted)] text-sm"
          >
            <Plus size={16} className="mr-1" /> 약 추가
          </motion.button>
        </div>
      </div>

      {/* 3. 증상이 올라온 때 */}
      <CollapsibleSection
        title="두드러기 올라온 시각·부위"
        isExpanded={expanded['episodes']}
        onToggle={() => toggleSection('episodes')}
        summary={episodeSummary}
      >
        <div className="space-y-4">
          {value.episodes.map((ep, idx) => (
            <div key={idx} className="p-4 bg-[var(--sd-surface-2)] rounded-xl border border-[var(--sd-line)] relative">
              <button
                onClick={() => onChange({ episodes: value.episodes.filter((_, i) => i !== idx) })}
                className="absolute top-3 right-3 text-[var(--sd-muted)] hover:text-[var(--sd-crit)]"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex gap-2 items-center mb-4 pr-6">
                <input
                  type="time"
                  value={ep.start || ''}
                  onChange={(e) => {
                    const next = value.episodes.map((item, i) => i === idx ? { ...item, start: e.target.value } : item);
                    onChange({ episodes: next });
                  }}
                  className="bg-white rounded-lg px-2 py-1.5 text-sm border border-[var(--sd-line)] text-[var(--sd-ink)] flex-1"
                />
                <div className="flex items-center gap-1 bg-white border border-[var(--sd-line)] rounded-lg px-2 py-1.5 flex-1">
                  <input
                    type="number"
                    placeholder="지속"
                    value={ep.durMin || ''}
                    onChange={(e) => {
                      const next = value.episodes.map((item, i) => i === idx ? { ...item, durMin: e.target.value ? Number(e.target.value) : null } : item);
                      onChange({ episodes: next });
                    }}
                    className="w-full bg-transparent outline-none text-sm text-[var(--sd-ink)] text-right"
                  />
                  <span className="text-sm text-[var(--sd-muted)]">분</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-[var(--sd-muted)] mb-2 font-medium">부위</p>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map(area => (
                    <motion.button
                      key={area}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const next = value.episodes.map((item, i) => {
                          if (i !== idx) return item;
                          const nextAreas = item.areas.includes(area) ? item.areas.filter(a => a !== area) : [...item.areas, area];
                          return { ...item, areas: nextAreas };
                        });
                        onChange({ episodes: next });
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full border ${
                        ep.areas.includes(area) ? 'bg-[var(--sd-ink)] text-white border-[var(--sd-ink)]' : 'bg-white text-[var(--sd-ink)] border-[var(--sd-line)]'
                      }`}
                    >
                      {area}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!ep.over24h}
                    onChange={(e) => {
                      const next = value.episodes.map((item, i) => i === idx ? { ...item, over24h: e.target.checked } : item);
                      onChange({ episodes: next });
                    }}
                    className="w-4 h-4 accent-[var(--sd-rel)]"
                  />
                  <span className="text-sm text-[var(--sd-ink)]">한 자국이 24시간 넘게 갔어요</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!ep.bruiseLike}
                    onChange={(e) => {
                      const next = value.episodes.map((item, i) => i === idx ? { ...item, bruiseLike: e.target.checked } : item);
                      onChange({ episodes: next });
                    }}
                    className="w-4 h-4 accent-[var(--sd-rel)]"
                  />
                  <span className="text-sm text-[var(--sd-ink)]">멍처럼 남았어요</span>
                </label>
              </div>
            </div>
          ))}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange({ episodes: [...value.episodes, { start: null, durMin: null, areas: [], over24h: false, bruiseLike: false }] })}
            className="flex items-center justify-center w-full py-3 rounded-xl border border-dashed border-[var(--sd-line)] text-[var(--sd-muted)] text-sm"
          >
            <Plus size={16} className="mr-1" /> 증상 추가
          </motion.button>
        </div>
      </CollapsibleSection>

      {/* 4. 붓기 (Angioedema) */}
      <CollapsibleSection
        title="붓기 (입술·눈·목)"
        isExpanded={expanded['angioedema']}
        onToggle={() => toggleSection('angioedema')}
        summary={value.angioedema?.present ? `있음${value.angioedema.areas.length ? ` (${value.angioedema.areas.join(', ')})` : ''}` : (value.angioedema?.present === false ? '없음' : undefined)}
      >
        <div className="flex gap-2 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ angioedema: { present: false, areas: [] } })}
            className={`flex-1 py-2 text-sm rounded-xl border ${value.angioedema?.present === false ? 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]' : 'bg-white border-[var(--sd-line)]'}`}
          >
            없음
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ angioedema: { present: true, areas: value.angioedema?.areas || [] } })}
            className={`flex-1 py-2 text-sm rounded-xl border ${value.angioedema?.present === true ? 'bg-[var(--sd-crit)] text-white border-[var(--sd-crit)]' : 'bg-white border-[var(--sd-line)]'}`}
          >
            있음
          </motion.button>
        </div>
        {value.angioedema?.present && (
          <div className="flex flex-wrap gap-2 mt-2">
            {['입술', '눈', '목·혀'].map((area) => (
              <motion.button
                key={area}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const curr = value.angioedema?.areas || [];
                  const next = curr.includes(area) ? curr.filter(a => a !== area) : [...curr, area];
                  onChange({ angioedema: { present: true, areas: next } });
                }}
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  value.angioedema?.areas.includes(area) ? 'bg-[var(--sd-ink)] text-white' : 'bg-white text-[var(--sd-ink)]'
                }`}
              >
                {area}
              </motion.button>
            ))}
          </div>
        )}
        {value.angioedema?.areas.includes('목·혀') && (
          <div className="mt-3 p-3 bg-[color-mix(in_srgb,var(--sd-crit)_12%,transparent)] rounded-xl flex items-center gap-2 text-[var(--sd-crit)] text-sm font-bold">
            <AlertCircle size={18} />
            목·혀가 붓거나 숨이 차면 지금 바로 119
          </div>
        )}
      </CollapsibleSection>

      {/* 5. 흔적 */}
      <CollapsibleSection
        title="흔적"
        isExpanded={expanded['trace']}
        onToggle={() => toggleSection('trace')}
        summary={value.trace || undefined}
      >
        <div className="flex gap-2">
          {['흔적 없음', '색소 남음', '긁은 상처'].map((t) => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange({ trace: value.trace === t ? null : t })}
              className={`flex-1 py-2 text-sm rounded-xl border ${
                value.trace === t
                  ? 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]'
                  : 'bg-white text-[var(--sd-ink)] border-[var(--sd-line)]'
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>
      </CollapsibleSection>

      {/* 6. 의심 가는 것 */}
      <CollapsibleSection
        title="의심 가는 것 (트리거)"
        isExpanded={expanded['triggers']}
        onToggle={() => toggleSection('triggers')}
        summary={value.triggers.length > 0 ? `${value.triggers.length}개 선택됨` : undefined}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {TRIGGERS.map((trigger) => (
            <motion.button
              key={trigger}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const next = value.triggers.includes(trigger)
                  ? value.triggers.filter(t => t !== trigger)
                  : [...value.triggers, trigger];
                onChange({ triggers: next });
              }}
              className={`px-3 py-1.5 text-sm rounded-full border ${
                value.triggers.includes(trigger) ? 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]' : 'bg-white text-[var(--sd-ink)] border-[var(--sd-line)]'
              }`}
            >
              {trigger}
            </motion.button>
          ))}
          {/* 목록 밖 추가된 칩 */}
          {value.triggers.filter(t => !TRIGGERS.includes(t)).map((custom) => (
            <motion.button
              key={custom}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange({ triggers: value.triggers.filter(t => t !== custom) })}
              className="px-3 py-1.5 text-sm rounded-full border bg-[var(--sd-rel)] text-white border-[var(--sd-rel)] flex items-center gap-1"
            >
              {custom}
            </motion.button>
          ))}
        </div>

        {/* 직접 쓰기 입력칸 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTrigger}
            onChange={(e) => setCustomTrigger(e.target.value)}
            placeholder="목록에 없는 것 직접 쓰기"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customTrigger.trim()) {
                e.preventDefault();
                if (!value.triggers.includes(customTrigger.trim())) {
                  onChange({ triggers: [...value.triggers, customTrigger.trim()] });
                }
                setCustomTrigger('');
              }
            }}
            className="flex-1 bg-[var(--sd-surface-2)] border border-[var(--sd-line)] rounded-xl px-3 py-2 text-sm text-[var(--sd-ink)] outline-none"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (customTrigger.trim() && !value.triggers.includes(customTrigger.trim())) {
                onChange({ triggers: [...value.triggers, customTrigger.trim()] });
              }
              setCustomTrigger('');
            }}
            disabled={!customTrigger.trim()}
            className="px-4 py-2 bg-white border border-[var(--sd-line)] rounded-xl text-sm font-medium disabled:opacity-50"
          >
            추가
          </motion.button>
        </div>
      </CollapsibleSection>

      {/* 7. 먹은 것 */}
      <CollapsibleSection
        title="먹은 것"
        isExpanded={expanded['foods']}
        onToggle={() => toggleSection('foods')}
        summary={foodSummary}
      >
        <div className="space-y-3">
          {value.foods.map((food, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="time"
                value={food.t || ''}
                onChange={(e) => {
                  const next = value.foods.map((f, i) => i === idx ? { ...f, t: e.target.value } : f);
                  onChange({ foods: next });
                }}
                className="bg-white rounded-lg px-2 py-2 text-sm border border-[var(--sd-line)] text-[var(--sd-ink)] w-24"
              />
              <input
                type="text"
                placeholder="음식 내용"
                value={food.text}
                onChange={(e) => {
                  const next = value.foods.map((f, i) => i === idx ? { ...f, text: e.target.value } : f);
                  onChange({ foods: next });
                }}
                className="flex-1 bg-[var(--sd-surface-2)] border border-[var(--sd-line)] rounded-lg px-3 py-2 text-sm outline-none text-[var(--sd-ink)]"
              />
              <button
                onClick={() => onChange({ foods: value.foods.filter((_, i) => i !== idx) })}
                className="p-2 text-[var(--sd-muted)] hover:text-[var(--sd-crit)]"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange({ foods: [...value.foods, { t: null, text: '' }] })}
            className="flex items-center justify-center w-full py-3 rounded-xl border border-dashed border-[var(--sd-line)] text-[var(--sd-muted)] text-sm"
          >
            <Plus size={16} className="mr-1" /> 식사/간식 추가
          </motion.button>
        </div>
      </CollapsibleSection>

      {/* 8. 생활 */}
      <CollapsibleSection
        title="생활 (수면·물·스트레스)"
        isExpanded={expanded['life']}
        onToggle={() => toggleSection('life')}
        summary={lifeSummary}
      >
        <div className="space-y-5">
          {/* 잠 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--sd-ink)]">잠 (시간)</span>
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange({ sleepH: Math.max(0, (value.sleepH || 0) - 0.5) })}
                className="w-8 h-8 flex items-center justify-center bg-[var(--sd-surface-2)] rounded-full text-[var(--sd-ink)] font-bold"
              >-</motion.button>
              <span className="w-10 text-center font-bold text-lg tabular-nums">{value.sleepH !== null ? value.sleepH : '-'}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange({ sleepH: (value.sleepH || 0) + 0.5 })}
                className="w-8 h-8 flex items-center justify-center bg-[var(--sd-surface-2)] rounded-full text-[var(--sd-ink)] font-bold"
              >+</motion.button>
            </div>
          </div>

          {/* 가려워서 깼어요 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--sd-ink)]">가려워서 깼어요</span>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange({ wakeItch: true })}
                className={`px-4 py-1.5 text-sm rounded-lg border ${value.wakeItch === true ? 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]' : 'bg-white border-[var(--sd-line)]'}`}
              >
                예
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange({ wakeItch: false })}
                className={`px-4 py-1.5 text-sm rounded-lg border ${value.wakeItch === false ? 'bg-[var(--sd-ink)] text-white border-[var(--sd-ink)]' : 'bg-white border-[var(--sd-line)]'}`}
              >
                아니오
              </motion.button>
            </div>
          </div>

          {/* 물 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--sd-ink)]">마신 물 (ml)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value.waterMl !== null ? value.waterMl : ''}
                onChange={(e) => onChange({ waterMl: e.target.value ? Number(e.target.value) : null })}
                className="w-20 bg-white border border-[var(--sd-line)] rounded-lg px-2 py-1.5 text-sm text-center outline-none"
                placeholder="0"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange({ waterMl: (value.waterMl || 0) + 250 })}
                className="px-3 py-1.5 text-xs bg-[var(--sd-surface-2)] rounded-lg font-medium"
              >
                +250
              </motion.button>
            </div>
          </div>

          {/* 스트레스 */}
          <div>
            <div className="flex justify-between text-sm font-medium text-[var(--sd-ink)] mb-2">
              <span>스트레스</span>
              <span className="text-[var(--sd-rel)] font-bold">{value.stress !== null ? value.stress : '-'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={value.stress !== null ? value.stress : 5}
              onChange={(e) => onChange({ stress: Number(e.target.value) })}
              className="w-full accent-[var(--sd-rel)]"
            />
            <div className="flex justify-between text-xs text-[var(--sd-muted)] mt-1">
              <span>0 (평온)</span>
              <span>10 (최고)</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 9. 생리 */}
      <CollapsibleSection
        title="생리"
        isExpanded={expanded['period']}
        onToggle={() => toggleSection('period')}
        summary={periodSummary}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ period: true })}
              className={`flex-1 py-2 text-sm rounded-xl border ${value.period === true ? 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]' : 'bg-white border-[var(--sd-line)]'}`}
            >
              생리 중
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ period: false, cycleDay: null })}
              className={`flex-1 py-2 text-sm rounded-xl border ${value.period === false ? 'bg-[var(--sd-ink)] text-white border-[var(--sd-ink)]' : 'bg-white border-[var(--sd-line)]'}`}
            >
              아님
            </motion.button>
          </div>

          <AnimatePresence>
            {value.period && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 bg-[var(--sd-surface-2)] p-3 rounded-xl"
              >
                <span className="text-sm font-medium">주기</span>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={value.cycleDay || ''}
                    onChange={(e) => onChange({ cycleDay: e.target.value ? Number(e.target.value) : null })}
                    className="w-16 bg-white border border-[var(--sd-line)] rounded-lg px-2 py-1.5 text-sm text-center outline-none"
                    placeholder="1"
                  />
                  <span className="text-sm">일째</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CollapsibleSection>

      {/* 10. 새로 쓴 제품 */}
      <CollapsibleSection
        title="새로 쓴 제품"
        isExpanded={expanded['newProducts']}
        onToggle={() => toggleSection('newProducts')}
        summary={newProductsSummary}
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {value.newProducts.map((prod) => (
            <motion.button
              key={prod}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange({ newProducts: value.newProducts.filter(p => p !== prod) })}
              className="px-3 py-1.5 text-sm rounded-full border bg-[var(--sd-surface-2)] border-[var(--sd-line)] flex items-center gap-1 text-[var(--sd-ink)]"
            >
              {prod}
            </motion.button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            placeholder="화장품, 세제, 영양제 등"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newProduct.trim()) {
                e.preventDefault();
                if (!value.newProducts.includes(newProduct.trim())) {
                  onChange({ newProducts: [...value.newProducts, newProduct.trim()] });
                }
                setNewProduct('');
              }
            }}
            className="flex-1 bg-[var(--sd-surface-2)] border border-[var(--sd-line)] rounded-xl px-3 py-2 text-sm text-[var(--sd-ink)] outline-none"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (newProduct.trim() && !value.newProducts.includes(newProduct.trim())) {
                onChange({ newProducts: [...value.newProducts, newProduct.trim()] });
              }
              setNewProduct('');
            }}
            disabled={!newProduct.trim()}
            className="px-4 py-2 bg-white border border-[var(--sd-line)] rounded-xl text-sm font-medium disabled:opacity-50"
          >
            추가
          </motion.button>
        </div>
      </CollapsibleSection>

      {/* 11. 메모 */}
      <div className="sd-card p-5 mb-6">
        <h2 className="text-lg font-bold text-[var(--sd-ink)] mb-4">메모</h2>
        <textarea
          value={value.note}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder="특이사항이나 하고 싶은 말을 적어주세요."
          className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] p-3 rounded-xl min-h-[100px] outline-none border border-[var(--sd-line)] resize-none text-sm"
        />
      </div>

      {/* 하단 고정 저장 바 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-white via-white/90 to-transparent pb-8">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-[var(--sd-ink)] text-white font-bold text-lg flex justify-center items-center gap-2 shadow-lg"
        >
          {saving ? '저장 중...' : '저장'}
        </motion.button>
        {savedAt && (
          <p className="text-center text-xs text-[var(--sd-muted)] mt-2 flex items-center justify-center gap-1">
            <Check size={12} /> {savedAt}
          </p>
        )}
      </div>
    </div>
  );
}

// 접이식 섹션 헬퍼 컴포넌트
function CollapsibleSection({
  title, isExpanded, onToggle, summary, children
}: {
  title: string; isExpanded?: boolean; onToggle: () => void; summary?: string; children: React.ReactNode
}) {
  return (
    <div className="sd-card sd-card--quiet overflow-hidden">
      <button onClick={onToggle} className="w-full p-5 flex justify-between items-center text-left">
        <div>
          <h3 className="font-bold text-[var(--sd-ink)]">{title}</h3>
          {!isExpanded && summary && <p className="text-sm text-[var(--sd-rel)] mt-1">{summary}</p>}
        </div>
        {isExpanded ? <ChevronUp size={20} color="var(--sd-muted)" /> : <ChevronDown size={20} color="var(--sd-muted)" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 pt-0"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```
