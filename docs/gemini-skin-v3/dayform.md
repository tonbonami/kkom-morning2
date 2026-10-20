## 고칠 것: SkinDayForm.tsx 3판 — 하루 기록 폼 (꼼이만 씀)

아래 지금 코드(네가 만든 2판)를 고쳐서 **파일 전체**로 다시 줘. 고칠 곳 말고는 모양·문구 그대로.
(우댕 폰은 이제 이 폼 대신 읽기용 카드를 따로 보여 주니, 이 폼은 꼼이가 적는 데만 집중하면 된다.)

### A. 칸 펼침 — 매번 하나하나 여는 게 불편하다는 의견
- 날을 바꿀 때마다(value.date가 바뀔 때) **적힌 게 있는 칸은 펼친 채, 빈 칸은 접힌 채** 시작한다. 그 뒤 꼼이가 누른 펼침/접힘은 그날 안에서 유지.
  (적힌 것 판단: 두드러기 episodes 1개 이상 / 붓기 angioedema 있음 / 흔적 trace / 의심 triggers / 먹은 것 foods / 생활 sleepH·waterMl·stress·wakeItch 중 하나 / 생리 period / 새 제품 newProducts)
- 접이식 칸 묶음 바로 위 오른쪽에 작은 글자 버튼 하나: 「모두 펼치기」 ↔ 「모두 접기」(하나라도 접혀 있으면 「모두 펼치기」).
- 접힌 칸의 요약 줄은 지금처럼. 빈 칸 요약은 비워 두고(「없음」이라 쓰지 말 것).

### B. 지난 검수에서 짚은 것
 (하루 기록) — 매일 30초 안에 끝내기
1) **첫 화면에 점수와 약이 같이**: 390×844 기준 스크롤 없이 「팽진·가려움」과 「약(먹음/늦게/거름)」이 한 화면에 보이게. 오늘 점수 카드 안 여백·버튼 높이를 줄이거나 두 카드를 하나로 합쳐도 좋아.
2) 오른쪽 위 점수 표시는 「3 / 6」(지금처럼 UAS라는 말 없이).
3) 생활 칸:
   - **잠**: −/+ 0.5씩 14번 눌러야 7시간이 됨 → 시간 칩(4 · 5 · 6 · 7 · 8 · 9) 한 줄 + 옆에 −/+ 0.5 미세 조정. 안 적었으면 비어 보이게.
   - **스트레스**: 안 적었는데 슬라이더가 가운데(5)에 있어서 적은 것처럼 보임 → 안 적었을 땐 「안 적음」으로 비어 보이게(예: 0~10 숫자 칩 한 줄, 또는 슬라이더 손잡이를 처음 누르기 전엔 숨김).
4) 「의심 가는 것 (트리거)」 제목에서 외래어 빼고 「의심 가는 것」.
5) 나머지 칸·요약·저장 막대는 그대로.


### 공통 타입 skinUi.ts (그대로, 고치지 말 것)
```tsts
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

### 지금 코드 SkinDayForm.tsx
```tsx
// 제미나이 시안 2판(2026-10-21, 우댕 전달, 빠진 6칸 채움) — 값 그대로.
// Aside 검수 고침(2026-10-21): 목·혀 경고 글자 안 보임(같은 색) → color-mix 배경 · 「UAS n / 6」 → 「n / 6」 · 붓기 요약 빈 괄호 「있음 ()」.
// 고친 것 딱 하나: 요약 문구 템플릿 안의 `\${` 두 곳(복사 중 생긴 역슬래시) → `${` (안 고치면 화면에 코드 글자가 찍힘).
// 문구 하나: 「증상이 올라온 때」 → 「두드러기 올라온 시각·부위」(우댕: 무슨 뜻인지 모르겠다).
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
