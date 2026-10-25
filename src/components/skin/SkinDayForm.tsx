'use client';
// 제미나이 12차(gemini-3-flash CLI, 우댕 2026-10-24): 팽진 뺌 · 가려움·붉어짐 1~10 슬라이드(itch10·redness) · 메모 카드 → memoArea(아침·점심·저녁·밤). 값 그대로.
// 제미나이 9차(2026-10-24, 우댕): 팽진 삭제, 가려움·붉어짐 1~10 슬라이더 도입, 하단 메모 props 대체.
// 제미나이 8차(gemini-3-flash CLI): 약 윗줄에 「용량」 칸(med.dose) — 상담 정리에서 2알→3알로 고친 걸 폼에서도 보고 고치게. 값 그대로.
// Aside 4차: 「아직 저장 전이에요」 앞에도 ✓가 붙어 저장된 것처럼 보임 → 「…저장됨」일 때만 ✓.
// Aside 3차 고침: 저장 막대에 z가 없어 폼 아래로 옮긴 「힘든 날 알리기」 스위치가 막대 위에 그려져 눌림 → z-30 · via-…/90(변수 색엔 안 먹어 투명) → via-… · 「저장 전/저장됨」 줄이 생길 때 막대가 커져 약 버튼을 가림 → 줄 높이 늘 확보 · 지난날 「오늘은 증상 없음」 → 「그날은」.
// 고친 것: 약 시각 칸 78px에 「오후 10:00」이 잘림 → 104px(크롬은 시계 아이콘 자리까지), 용량 칸 64→52px(390px 한 줄 유지).
// 제미나이 5차(gemini-3-flash CLI): 약 한 줄을 두 줄로(이름·시각 / 먹음·늦게·거름) + 점수 카드 여백 — 아이폰 첫 화면에서 약 버튼이 저장 막대에 가리던 것. 값 그대로.
// 고친 것: 약 이름 자리표시가 「약 이름」으로 줄어 있어 원래 「약 이름 (예: 항히스타민제)」로.
// 제미나이 4차(Aside 2차 반영, gemini-3-flash CLI): 「오늘은 증상 없음」 선택 표시 · 스트레스 11칸 한 줄 · 약 버튼 42px. 값 그대로.
// 제미나이 시안 3판(2026-10-21, gemini-3-flash CLI로 받음) — 적힌 칸만 자동 펼침 + 모두 펼치기/접기, 점수·약 첫 화면, 잠 칩, 스트레스 「안 적음」. 값 그대로.
// (GPT 상담: 사람마다 다르게 — 꼼이는 적힌 칸만 펼침, 우댕 폰은 이 폼 대신 읽기 카드 SkinDayReport)
// Aside 2차 고침: 지난 날을 열어도 제목이 「오늘 점수」 → isToday(이미 받는 prop)로 「그날 점수」.
// 고쳐진 점: 「오늘은 증상 없음」 강조 표시, 스트레스 11칸 그리드(390px 대응), 약 버튼 높이 40px 이상 및 줄 바꿈.
// 고칠 것: SkinDayForm.tsx — 약 줄에 「용량」 칸 추가 (med.dose)

import React, { useState, useEffect } from 'react';
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
  memoArea,
}: {
  value: SkinDraft;
  onChange: (patch: Partial<SkinDraft>) => void;
  onSave: () => void;
  saving: boolean;
  savedAt: string | null;
  isToday: boolean;
  memoArea?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [customTrigger, setCustomTrigger] = useState('');
  const [newProduct, setNewProduct] = useState('');

  const sectionKeys = ['episodes', 'angioedema', 'trace', 'triggers', 'foods', 'life', 'period', 'newProducts'];

  // 날짜 바뀔 때 적힌 것 있는 칸만 펼치기
  useEffect(() => {
    const hasData = (key: string) => {
      if (key === 'episodes') return value.episodes.length > 0;
      if (key === 'angioedema') return value.angioedema !== null;
      if (key === 'trace') return value.trace !== null;
      if (key === 'triggers') return value.triggers.length > 0;
      if (key === 'foods') return value.foods.length > 0;
      if (key === 'life') return value.sleepH !== null || value.waterMl !== null || value.stress !== null || value.wakeItch !== null;
      if (key === 'period') return value.period !== null;
      if (key === 'newProducts') return value.newProducts.length > 0;
      return false;
    };

    const next: Record<string, boolean> = {};
    sectionKeys.forEach(k => { next[k] = hasData(k); });
    setExpanded(next);
  }, [value.date]);

  const toggleSection = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  
  const someCollapsed = sectionKeys.some(k => !expanded[k]);
  const toggleAll = () => {
    const target = someCollapsed;
    const next: Record<string, boolean> = {};
    sectionKeys.forEach(k => { next[k] = target; });
    setExpanded(next);
  };

  // 점수: 가려움/붉어짐 중 높은 값
  const maxScore = Math.max(value.itch10 ?? -1, value.redness ?? -1);
  const scoreDisplay = maxScore === -1 ? '-' : maxScore === 0 ? '없음' : `${maxScore} / 10`;

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
    <div className="pb-32 space-y-3">
      {/* 1. 오늘 점수 (슬라이더 구조) */}
      <div className="sd-card px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-[var(--sd-ink)]">{isToday ? '오늘 점수' : '그날 점수'}</h2>
          <span className="text-lg font-bold text-[var(--sd-rel)]">
            {scoreDisplay}
          </span>
        </div>

        <div className="space-y-5">
          <Slider10 
            label="가려움" 
            value={value.itch10} 
            onChange={(n) => onChange({ itch10: n })} 
          />
          <Slider10 
            label="붉어짐" 
            value={value.redness} 
            onChange={(n) => onChange({ redness: n })} 
            gradient 
          />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange({ itch10: 0, redness: 0 })}
            className={`w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
              value.itch10 === 0 && value.redness === 0
                ? 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)]'
                : 'bg-[var(--sd-surface-2)] text-[var(--sd-ink)]'
            }`}
          >
            {value.itch10 === 0 && value.redness === 0 && <Check size={14} />}
            {isToday ? '오늘은 증상 없음' : '그날은 증상 없음'}
          </motion.button>
        </div>
      </div>

      {/* 2. 약 */}
      <div className="sd-card p-4">
        <h2 className="text-base font-bold text-[var(--sd-ink)] mb-3">약</h2>
        <div className="space-y-2">
          {value.meds.map((med, idx) => (
            <div key={idx} className="flex flex-col gap-2.5 p-3 bg-[var(--sd-surface-2)] rounded-xl border border-[var(--sd-line)]">
              <div className="flex items-center gap-2">
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
                <input
                  type="text"
                  placeholder="1알"
                  value={med.dose || ''}
                  onChange={(e) => {
                    const next = value.meds.map((m, i) => i === idx ? { ...m, dose: e.target.value || null } : m);
                    onChange({ meds: next });
                  }}
                  className="bg-[var(--sd-card-solid)] rounded-lg px-2 py-1 text-[11px] border border-[var(--sd-line)] text-[var(--sd-ink)] w-[52px] shrink-0 text-center"
                />
                <input
                  type="time"
                  value={med.time || ''}
                  onChange={(e) => {
                    const next = value.meds.map((m, i) => i === idx ? { ...m, time: e.target.value } : m);
                    onChange({ meds: next });
                  }}
                  className="bg-[var(--sd-card-solid)] rounded-lg px-2 py-1 text-[11px] border border-[var(--sd-line)] text-[var(--sd-ink)] w-[104px] shrink-0"
                />
                <button
                  onClick={() => onChange({ meds: value.meds.filter((_, i) => i !== idx) })}
                  className="p-1 text-[var(--sd-muted)] hover:text-[var(--sd-crit)]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex gap-1.5">
                {(['taken', 'late', 'missed'] as const).map((status) => (
                  <motion.button
                    key={status}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const next = value.meds.map((m, i) => i === idx ? { ...m, status } : m);
                      onChange({ meds: next });
                    }}
                    className={`flex-1 h-[40px] text-[13px] rounded-xl border font-medium transition-colors ${
                      med.status === status
                        ? status === 'missed' ? 'bg-[var(--sd-crit)] text-[var(--sd-card-solid)] border-[var(--sd-crit)]' : 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)]'
                        : 'bg-[var(--sd-card-solid)] text-[var(--sd-muted)] border-[var(--sd-line)]'
                    }`}
                  >
                    {status === 'taken' ? '먹음' : status === 'late' ? '늦게' : '거름'}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange({ meds: [...value.meds, { name: '', dose: null, time: null, status: null }] })}
            className="flex items-center justify-center w-full py-2.5 rounded-xl border border-dashed border-[var(--sd-line)] text-[var(--sd-muted)] text-xs"
          >
            <Plus size={14} className="mr-1" /> 약 추가
          </motion.button>
        </div>
      </div>

      {/* 펼침/접힘 제어 버튼 */}
      <div className="flex justify-end px-1">
        <button onClick={toggleAll} className="text-xs text-[var(--sd-muted)] px-2 py-1">
          {someCollapsed ? '모두 펼치기' : '모두 접기'}
        </button>
      </div>

      {/* 3. 두드러기 올라온 시각·부위 */}
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
                  className="bg-[var(--sd-card-solid)] rounded-lg px-2 py-1.5 text-sm border border-[var(--sd-line)] text-[var(--sd-ink)] flex-1"
                />
                <div className="flex items-center gap-1 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-lg px-2 py-1.5 flex-1">
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
                        ep.areas.includes(area) ? 'bg-[var(--sd-ink)] text-[var(--sd-card-solid)] border-[var(--sd-ink)]' : 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] border-[var(--sd-line)]'
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
            className={`flex-1 py-2 text-sm rounded-xl border ${value.angioedema?.present === false ? 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)]' : 'bg-[var(--sd-card-solid)] border-[var(--sd-line)]'}`}
          >
            없음
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ angioedema: { present: true, areas: value.angioedema?.areas || [] } })}
            className={`flex-1 py-2 text-sm rounded-xl border ${value.angioedema?.present === true ? 'bg-[var(--sd-crit)] text-[var(--sd-card-solid)] border-[var(--sd-crit)]' : 'bg-[var(--sd-card-solid)] border-[var(--sd-line)]'}`}
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
                  value.angioedema?.areas.includes(area) ? 'bg-[var(--sd-ink)] text-[var(--sd-card-solid)]' : 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)]'
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
                  ? 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)]'
                  : 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] border-[var(--sd-line)]'
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>
      </CollapsibleSection>

      {/* 6. 의심 가는 것 */}
      <CollapsibleSection
        title="의심 가는 것"
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
                value.triggers.includes(trigger) ? 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)]' : 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] border-[var(--sd-line)]'
              }`}
            >
              {trigger}
            </motion.button>
          ))}
          {value.triggers.filter(t => !TRIGGERS.includes(t)).map((custom) => (
            <motion.button
              key={custom}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange({ triggers: value.triggers.filter(t => t !== custom) })}
              className="px-3 py-1.5 text-sm rounded-full border bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)] flex items-center gap-1"
            >
              {custom}
            </motion.button>
          ))}
        </div>

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
            className="px-4 py-2 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-xl text-sm font-medium disabled:opacity-50"
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
                className="bg-[var(--sd-card-solid)] rounded-lg px-2 py-2 text-sm border border-[var(--sd-line)] text-[var(--sd-ink)] w-24"
              />
              <input
                type="text"
                placeholder="음식 내용"
                value={food.text}
                onChange={(e) => {
                  const next = value.foods.map((f, i) => i === idx ? { ...f, text: e.target.value } : f);
                  onChange({ foods: next });
                }}
                className="flex-1 bg-[var(--sd-surface-2)] border border border-[var(--sd-line)] rounded-lg px-3 py-2 text-sm outline-none text-[var(--sd-ink)]"
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
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--sd-ink)]">잠 (시간)</span>
              <span className="font-bold text-[var(--sd-rel)]">{value.sleepH !== null ? `${value.sleepH}시간` : '안 적음'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[4, 5, 6, 7, 8, 9].map(h => (
                <button
                  key={h}
                  onClick={() => onChange({ sleepH: h })}
                  className={`flex-1 py-2 text-xs rounded-lg border ${value.sleepH === h ? 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)]' : 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] border-[var(--sd-line)]'}`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange({ sleepH: Math.max(0, (value.sleepH || 0) - 0.5) })}
                className="w-10 h-10 flex items-center justify-center bg-[var(--sd-surface-2)] rounded-full text-[var(--sd-ink)] text-xl font-bold"
              >-</motion.button>
              <span className="text-sm text-[var(--sd-muted)]">0.5 단위 조정</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange({ sleepH: (value.sleepH || 0) + 0.5 })}
                className="w-10 h-10 flex items-center justify-center bg-[var(--sd-surface-2)] rounded-full text-[var(--sd-ink)] text-xl font-bold"
              >+</motion.button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--sd-ink)]">가려워서 깼어요</span>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange({ wakeItch: true })}
                className={`px-4 py-1.5 text-sm rounded-lg border ${value.wakeItch === true ? 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)]' : 'bg-[var(--sd-card-solid)] border-[var(--sd-line)]'}`}
              >
                예
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange({ wakeItch: false })}
                className={`px-4 py-1.5 text-sm rounded-lg border ${value.wakeItch === false ? 'bg-[var(--sd-ink)] text-[var(--sd-card-solid)] border-[var(--sd-ink)]' : 'bg-[var(--sd-card-solid)] border-[var(--sd-line)]'}`}
              >
                아니오
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--sd-ink)]">마신 물 (ml)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value.waterMl !== null ? value.waterMl : ''}
                onChange={(e) => onChange({ waterMl: e.target.value ? Number(e.target.value) : null })}
                className="w-20 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-lg px-2 py-1.5 text-sm text-center outline-none"
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

          <div>
            <div className="flex justify-between text-sm font-medium text-[var(--sd-ink)] mb-3">
              <span>스트레스</span>
              <span className="text-[var(--sd-rel)] font-bold">{value.stress !== null ? value.stress : '안 적음'}</span>
            </div>
            <div className="grid grid-cols-11 gap-1 mb-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                <button
                  key={s}
                  onClick={() => onChange({ stress: s })}
                  className={`aspect-square text-[10px] rounded-full border flex items-center justify-center transition-colors ${value.stress === s ? 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)]' : 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] border-[var(--sd-line)]'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[var(--sd-muted)] px-1">
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
              className={`flex-1 py-2 text-sm rounded-xl border ${value.period === true ? 'bg-[var(--sd-rel)] text-[var(--sd-card-solid)] border-[var(--sd-rel)]' : 'bg-[var(--sd-card-solid)] border-[var(--sd-line)]'}`}
            >
              생리 중
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ period: false, cycleDay: null })}
              className={`flex-1 py-2 text-sm rounded-xl border ${value.period === false ? 'bg-[var(--sd-ink)] text-[var(--sd-card-solid)] border-[var(--sd-ink)]' : 'bg-[var(--sd-card-solid)] border-[var(--sd-line)]'}`}
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
                    className="w-16 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-lg px-2 py-1.5 text-sm text-center outline-none"
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
            className="px-4 py-2 bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-xl text-sm font-medium disabled:opacity-50"
          >
            추가
          </motion.button>
        </div>
      </CollapsibleSection>

      {/* 11. 메모 Area (props로 대체됨) */}
      {memoArea}

      {/* 하단 고정 저장 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto p-4 bg-gradient-to-t from-[var(--sd-surface-2)] via-[var(--sd-surface-2)] to-transparent pb-8 pointer-events-none">
        <div className="pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-[var(--sd-ink)] text-[var(--sd-card-solid)] font-bold text-lg flex justify-center items-center gap-2 shadow-lg"
          >
            {saving ? '저장 중...' : '저장'}
          </motion.button>
          <p className="text-center text-[10px] text-[var(--sd-muted)] mt-2 h-4 flex items-center justify-center gap-1">
            {savedAt && <>{savedAt.includes('저장됨') && <Check size={10} />} {savedAt}</>}
          </p>
        </div>
      </div>
    </div>
  );
}

// 화면이 방금 스크롤됐는지 — 관성 스크롤을 멈추려고 톡 친 손가락이 막대 값을 바꾸지 않게(스크롤 상자 것도 capture로 받는다)
let lastScrollAt = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => { lastScrollAt = Date.now(); }, { capture: true, passive: true });
}
const SLIDER_SLOP = 8;   // px — 이만큼 움직이기 전엔 「톡」인지 「끌기」인지 「스크롤」인지 모른다

function Slider10({ 
  label, 
  value, 
  onChange, 
  gradient 
}: { 
  label: string; 
  value: number | null; 
  onChange: (val: number) => void; 
  gradient?: boolean;
}) {
  // 배선(2026-10-25, 우댕 「값 고른 뒤 다른 걸 만져도 막대가 지 맘대로 움직여」):
  //   전엔 막대가 touch-action:none 이라 화면을 스크롤하려고 막대 위에 손가락을 대고 밀면 그게 끌기로 먹혀 값이 바뀌었다.
  //   이제 세로 스크롤은 화면에 넘기고(pan-y), 가로로 분명히 밀 때만 끌기, 제자리 톡이면 그 자리 값. 스크롤 직후의 톡은 무시.
  const g = React.useRef<{ id: number; x: number; y: number; drag: boolean } | null>(null);
  const setAt = (el: HTMLElement, clientX: number) => {
    const rect = el.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.round(p * 9) + 1; // 1 to 10
    if (v !== value) onChange(v);
  };
  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') {   // 컴퓨터 마우스는 스크롤과 안 헷갈리니 바로
      e.currentTarget.setPointerCapture(e.pointerId);
      g.current = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: true };
      setAt(e.currentTarget, e.clientX);
      return;
    }
    g.current = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: false };
  };
  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (!s || s.id !== e.pointerId) return;
    if (!s.drag) {
      const dx = Math.abs(e.clientX - s.x), dy = Math.abs(e.clientY - s.y);
      if (dy > SLIDER_SLOP && dy >= dx) { g.current = null; return; }   // 세로 = 화면 스크롤
      if (dx <= SLIDER_SLOP) return;
      s.drag = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 이미 놓친 손가락 */ }
    }
    setAt(e.currentTarget, e.clientX);
  };
  const handleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    g.current = null;
    if (!s || s.id !== e.pointerId) return;
    if (!s.drag && Date.now() - lastScrollAt < 400) return;   // 스크롤 멈추려고 친 톡
    setAt(e.currentTarget, e.clientX);
  };
  const handleCancel = () => { g.current = null; };   // 화면이 스크롤을 가져감
  const handleKey = (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    onChange(Math.max(1, Math.min(10, (value || (d > 0 ? 0 : 2)) + d)));
  };

  const hasValue = value !== null;
  const isZero = value === 0;
  const displayVal = hasValue && value > 0 ? ((value - 1) / 9) * 100 : 0;
  const knobLeft = hasValue ? `calc(${displayVal}% - 12px)` : '-12px';

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[var(--sd-muted)] font-medium">{label}</span>
        <span className="text-sm font-bold text-[var(--sd-rel)]">
          {value === null ? '안 적음' : value === 0 ? '없음' : `${value} / 10`}
        </span>
      </div>
      <div 
        className="relative h-10 flex items-center touch-pan-y cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--sd-rel)] rounded-full"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleCancel}
        onKeyDown={handleKey}
        role="slider" tabIndex={0} aria-label={label} aria-valuemin={1} aria-valuemax={10}
        aria-valuenow={value ?? undefined} aria-valuetext={value === null ? '안 적음' : value === 0 ? '없음' : `${value} / 10`}
      >
        <div className="absolute w-full h-2 bg-[var(--sd-surface-2)] rounded-full overflow-hidden pointer-events-none">
          {hasValue && !isZero && (
            <div 
              className={`h-full rounded-full ${gradient ? 'bg-gradient-to-r from-[var(--sd-rel)] to-[var(--sd-crit)]' : 'bg-[var(--sd-rel)]'}`}
              style={{ width: `max(12px, ${displayVal}%)` }}
            />
          )}
        </div>
        {/* 손잡이: 튕기는 스프링 대신 짧게 따라오기(값이 「지 맘대로 움직이는」 것처럼 보이지 않게) */}
        <motion.div 
          className={`absolute w-6 h-6 bg-[var(--sd-card-solid)] border-2 rounded-full shadow-md pointer-events-none ${hasValue ? 'border-[var(--sd-rel)]' : 'border-[var(--sd-line)] opacity-20'}`}
          initial={false}
          animate={{ left: knobLeft }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between px-0.5 -mt-1">
        <span className="text-[10px] text-[var(--sd-faint)]">1</span>
        <span className="text-[10px] text-[var(--sd-faint)]">10</span>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title, isExpanded, onToggle, summary, children
}: {
  title: string; isExpanded?: boolean; onToggle: () => void; summary?: string; children: React.ReactNode
}) {
  return (
    <div className="sd-card sd-card--quiet overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex justify-between items-center text-left">
        <div>
          <h3 className="text-sm font-bold text-[var(--sd-ink)]">{title}</h3>
          {!isExpanded && summary && <p className="text-xs text-[var(--sd-rel)] mt-1">{summary}</p>}
        </div>
        {isExpanded ? <ChevronUp size={18} color="var(--sd-muted)" /> : <ChevronDown size={18} color="var(--sd-muted)" />}
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 pt-0"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
