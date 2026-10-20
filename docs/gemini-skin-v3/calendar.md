## 만들 것: SkinCalendar.tsx — 7일 띠를 「주 ↔ 달」 달력으로 (지금 SkinWeekStrip.tsx를 대신함)

지금은 최근 7일 띠만 있어서 한 달 넘게 쌓이면 지난 날로 못 간다. 평소엔 지금처럼 7일 띠, 머리를 누르면 한 달 달력으로 펼쳐져 아무 날이나 고르게.

```ts
export type MedStatus = 'taken' | 'missed' | 'late';
export interface CalDay { date: string; uas: number | null; med: MedStatus | null; hasLog: boolean; photo: boolean } // uas 0~6
export default function SkinCalendar(props: {
  mode: 'week' | 'month';
  onMode: (m: 'week' | 'month') => void;
  week: CalDay[];                         // 7일, 과거 → 최신(오른쪽 끝이 가장 최근)
  month: { ym: string; days: CalDay[] };  // ym 'YYYY-MM', 그 달 1일~말일
  today: string;                          // 'YYYY-MM-DD' — 이후 날은 못 고름
  selected: string;
  onSelect: (date: string) => void;       // 달 모드에서 고르면 부모가 주 모드로 접어 줌
  onMonth: (delta: -1 | 1) => void;
  canNextMonth: boolean;                  // 이번 달이면 false
  loading: boolean;                       // 달 바꾸는 중
  onOpenReport: () => void;               // 「모아보기」 화면으로
})
```
- 카드 하나(sd-card). 머리 줄: 왼쪽 「2026년 10월」 + 펼침 화살표(주 모드 ▾ / 달 모드 ▴) — 머리 전체가 누르는 곳. 오른쪽 작은 버튼 「모아보기」(문서 아이콘).
- **주 모드**: 아래 지금 코드의 모양 그대로(요일 · 동그라미 날짜 · 아래 약 표시). 고쳐 줄 것: 기록 없는 날(hasLog false)은 동그라미 테두리를 **점선**, 사진 있는 날은 동그라미 오른쪽 위 작은 점.
- **달 모드**: 머리 아래 ‹ › 로 달 넘김(canNextMonth false면 › 흐리게·막음). 요일 머리 일~토(일 빨강 옅게). 6줄 격자, 칸은 주 모드와 같은 동그라미 언어(점수 진할수록 진하게·약 표시·사진 점·점선). 오늘은 테두리 강조, 고른 날은 바탕 강조, 오늘 이후는 흐리게·막음. loading이면 격자 옅게.
  펼치고 접힐 때 높이가 부드럽게(framer-motion).
- 카드 아래 범례 한 줄(작게, 줄바꿈 허용): 진할수록 점수 높음 · ✓ 약 먹음 · ✕ 거름 · 시계 늦게 · 점선 기록 없음.
- 390px에서 7칸이 카드 안에 들어가게(지금 띠는 바깥 px-2, 칸 px-1로 맞춰 둠).

### 지금 코드 (SkinWeekStrip.tsx — 이 모양을 주 모드로 이어 가)
```tsx
// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// Aside 검수 고침(2026-10-21): 390px에서 7칸이 카드 밖으로 9px 넘침 → 바깥·칸 가로 여백만 줄임.
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
