// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// ⚠️ 시안엔 섹션 1·2·4·6·11만 있음(증상 시각·흔적·먹은 것·생활·생리·새 제품은 빠짐) → 제미나이에 추가 요청 중.
// SkinDayForm.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkinDraft, AREAS, TRIGGERS, SkinMed } from './skinUi';
import { ChevronDown, ChevronUp, Plus, AlertCircle, Check } from 'lucide-react';

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

  const toggleSection = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const uasScore = (value.wheals ?? 0) + (value.itch ?? 0);
  const isUasEmpty = value.wheals === null && value.itch === null;

  return (
    <div className="pb-32 space-y-4">
      {/* 1. 오늘 점수 (UAS) */}
      <div className="sd-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[var(--sd-ink)]">오늘 점수</h2>
          <span className="text-xl font-bold text-[var(--sd-rel)]">
            {isUasEmpty ? '-' : `UAS ${uasScore} / 6`}
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
              <input
                type="text"
                placeholder="약 이름 (예: 항히스타민제)"
                value={med.name}
                onChange={(e) => {
                  const newMeds = [...value.meds];
                  newMeds[idx].name = e.target.value;
                  onChange({ meds: newMeds });
                }}
                className="bg-transparent border-none text-sm outline-none text-[var(--sd-ink)] w-full font-medium"
              />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="time"
                  value={med.time || ''}
                  onChange={(e) => {
                    const newMeds = [...value.meds];
                    newMeds[idx].time = e.target.value;
                    onChange({ meds: newMeds });
                  }}
                  className="bg-white rounded-lg px-2 py-1 text-sm border border-[var(--sd-line)] text-[var(--sd-ink)]"
                />
                <div className="flex flex-1 gap-1">
                  {(['taken', 'late', 'missed'] as const).map((status) => (
                    <motion.button
                      key={status}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const newMeds = [...value.meds];
                        newMeds[idx].status = status;
                        onChange({ meds: newMeds });
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

      {/* 4. 붓기 (Angioedema) - 위험 요소라 3번 위로 배치해 강조 */}
      <CollapsibleSection
        title="붓기 (입술·눈·목)"
        isExpanded={expanded['angioedema']}
        onToggle={() => toggleSection('angioedema')}
        summary={value.angioedema?.present ? `있음 (${value.angioedema.areas.join(', ')})` : (value.angioedema?.present === false ? '없음' : '기록 안함')}
      >
        <div className="flex gap-2 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ angioedema: { present: false, areas: [] } })}
            className={`flex-1 py-2 text-sm rounded-xl border ${value.angioedema?.present === false ? 'bg-[var(--sd-rel)] text-white' : 'bg-white'}`}
          >
            없음
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ angioedema: { present: true, areas: value.angioedema?.areas || [] } })}
            className={`flex-1 py-2 text-sm rounded-xl border ${value.angioedema?.present === true ? 'bg-[var(--sd-crit)] text-white' : 'bg-white'}`}
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
          <div className="mt-3 p-3 bg-[var(--sd-crit)] bg-opacity-10 rounded-xl flex items-center gap-2 text-[var(--sd-crit)] text-sm font-bold">
            <AlertCircle size={18} />
            목·혀가 붓거나 숨이 차면 지금 바로 119
          </div>
        )}
      </CollapsibleSection>

      {/* 6. 의심 가는 것 */}
      <CollapsibleSection
        title="의심 가는 것 (트리거)"
        isExpanded={expanded['triggers']}
        onToggle={() => toggleSection('triggers')}
        summary={value.triggers.length > 0 ? `${value.triggers.length}개 선택됨` : undefined}
      >
        <div className="flex flex-wrap gap-2">
          {TRIGGERS.map((trigger) => (
            <motion.button
              key={trigger}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const curr = value.triggers;
                const next = curr.includes(trigger) ? curr.filter(t => t !== trigger) : [...curr, trigger];
                onChange({ triggers: next });
              }}
              className={`px-3 py-1.5 text-sm rounded-full border ${
                value.triggers.includes(trigger) ? 'bg-[var(--sd-rel)] text-white border-[var(--sd-rel)]' : 'bg-white text-[var(--sd-ink)] border-[var(--sd-line)]'
              }`}
            >
              {trigger}
            </motion.button>
          ))}
        </div>
      </CollapsibleSection>

      {/* 11. 메모 */}
      <div className="sd-card p-5">
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
