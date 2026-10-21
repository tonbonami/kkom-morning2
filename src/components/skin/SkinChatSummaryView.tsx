'use client';
// 제미나이 7차(gemini-3-flash CLI, 의견 받고 시안): 「오늘 상담 정리」 — 핵심·꼼이가 말한 것·걱정·해 보기로 한 것 + 일지 반영 후보(켜기·고치기·날짜·일지와 다를 때 바꾸기/메모로만) + 다음 상담에도 기억할 것. 값 그대로.
// 배선 하나: readOnlyNote(반영한 뒤 다시 볼 때 아래 한 줄 문구).

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ChevronLeft, 
  AlertCircle, 
  Calendar, 
  RotateCcw, 
  Edit2, 
  Plus, 
  Minus, 
  X, 
  Clock, 
  MessageSquareQuote,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

export type EditValue =
  | { kind: 'number'; value: number | null; unit: string; min: number; max: number; step: number }
  | { kind: 'bool'; value: boolean | null }
  | { kind: 'text'; value: string; options: string[] }
  | { kind: 'list'; value: string[] }
  | { kind: 'med'; value: { name: string; dose: string | null; time: string | null; status: 'taken' | 'missed' | 'late' | null } }
  | { kind: 'episode'; value: { start: string | null; durMin: number | null; areas: string[] }; areaOptions: string[] }
  | { kind: 'food'; value: { t: string | null; text: string } }
  | { kind: 'angio'; value: { present: boolean; areas: string[] }; areaOptions: string[] };

export interface SummaryItem {
  id: string;
  fieldLabel: string;
  label: string;
  evidence: string;
  certain: boolean;
  date: string | null;
  current: string | null;
  on: boolean;
  mode: 'replace' | 'note';
  edit: EditValue;
}

export interface MemoryRow { id: string; kindLabel: string; text: string; on: boolean }

interface Props {
  dateLabel: string;
  phase: 'loading' | 'ready' | 'error' | 'applying' | 'done';
  errorText?: string;
  readOnly: boolean;
  summary: { key: string[]; facts: string[]; worries: string[]; plans: string[]; claudeNotes: string[] } | null;
  items: SummaryItem[];
  memory: MemoryRow[];
  dateChoices: { value: string; label: string }[];
  onBack: () => void;
  onRegenerate: () => void;
  onToggleItem: (id: string) => void;
  onModeItem: (id: string, mode: 'replace' | 'note') => void;
  onDateItem: (id: string, date: string) => void;
  onEditItem: (id: string, value: EditValue['value']) => void;
  onToggleMemory: (id: string) => void;
  onEditMemory: (id: string, text: string) => void;
  onApply: () => void;
  onLater: () => void;
  onOpenJournal: () => void;
  readOnlyNote?: string;
}

export default function SkinChatSummaryView({
  dateLabel,
  phase,
  errorText,
  readOnly,
  summary,
  items,
  memory,
  dateChoices,
  onBack,
  onRegenerate,
  onToggleItem,
  onModeItem,
  onDateItem,
  onEditItem,
  onToggleMemory,
  onEditMemory,
  onApply,
  onLater,
  onOpenJournal,
  readOnlyNote
}: Props) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);

  const activeItems = items.filter(it => it.on);
  const activeMemories = memory.filter(it => it.on);
  const applyCount = activeItems.length + activeMemories.length;
  const hasIncompleteDate = activeItems.some(it => it.date === null);

  if (phase === 'loading') {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--sd-surface-2)] p-4 pt-12 space-y-4">
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-[var(--sd-rel)]" />
          </motion.div>
          <p className="text-[var(--sd-ink)] font-medium text-center">
            Claude가 오늘 상담을<br />정리하고 있어요...
          </p>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="sd-card h-32 animate-pulse opacity-50" />
        ))}
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--sd-surface-2)] p-6 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--sd-crit)] mb-4" />
        <p className="text-[var(--sd-ink)] font-semibold mb-2">정리 중에 문제가 생겼어요</p>
        <p className="text-[var(--sd-muted)] text-sm mb-6">{errorText || '잠시 후 다시 시도해 주세요.'}</p>
        <button 
          onClick={onRegenerate}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--sd-rel)] text-white rounded-full font-medium"
        >
          <RotateCcw size={18} />
          다시 시도하기
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--sd-surface-2)] p-6 text-center">
        <div className="w-16 h-16 bg-[var(--sd-rel-soft)] rounded-full flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-[var(--sd-rel)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--sd-ink)] mb-2">일지에 반영했어요</h2>
        <p className="text-[var(--sd-muted)] mb-8">상담에서 찾은 기록들이<br />일지에 안전하게 담겼습니다.</p>
        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={onOpenJournal}
            className="w-full h-14 bg-[var(--sd-rel)] text-white rounded-2xl font-bold text-lg"
          >
            일지에서 보기
          </button>
          <button 
            onClick={onBack}
            className="w-full h-14 bg-[var(--sd-card-solid)] text-[var(--sd-ink)] rounded-2xl font-semibold border border-[var(--sd-line)]"
          >
            상담으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--sd-surface-2)] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--sd-surface-2)]/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-[var(--sd-line)]">
        <button onClick={onBack} className="p-2 -ml-2"><ChevronLeft size={24} className="text-[var(--sd-ink)]" /></button>
        <div className="flex flex-col items-center">
          <span className="text-[var(--sd-ink)] font-bold text-lg">오늘 상담 정리</span>
          <span className="text-[var(--sd-faint)] text-xs">{dateLabel}</span>
        </div>
        {!readOnly ? (
          <button onClick={onRegenerate} className="p-2 -mr-2"><RotateCcw size={20} className="text-[var(--sd-muted)]" /></button>
        ) : <div className="w-10" />}
      </header>

      <main className="p-4 space-y-6">
        {/* Claude's Text Summary */}
        {summary && (
          <section className="space-y-4">
            <div className="sd-card p-5 space-y-4">
              <div>
                <h3 className="text-[var(--sd-rel)] font-bold text-sm mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} /> 핵심 요약
                </h3>
                <ul className="space-y-1.5">
                  {summary.key.map((s, i) => (
                    <li key={i} className="text-[var(--sd-ink)] text-[15px] leading-relaxed flex gap-2">
                      <span className="text-[var(--sd-rel)] opacity-50">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              
              {summary.facts.length > 0 && (
                <div className="pt-4 border-t border-[var(--sd-line)]">
                  <h4 className="text-[var(--sd-muted)] text-xs font-bold mb-1.5">꼼이가 말한 것</h4>
                  <ul className="space-y-1">
                    {summary.facts.map((s, i) => (
                      <li key={i} className="text-[var(--sd-ink)] text-sm flex gap-2">
                        <span className="text-[var(--sd-line)]">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.worries.length > 0 && (
                <div className="pt-4 border-t border-[var(--sd-line)]">
                  <h4 className="text-[var(--sd-muted)] text-xs font-bold mb-1.5">걱정과 질문</h4>
                  <ul className="space-y-1">
                    {summary.worries.map((s, i) => (
                      <li key={i} className="text-[var(--sd-ink)] text-sm flex gap-2">
                        <span className="text-[var(--sd-line)]">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.plans.length > 0 && (
                <div className="pt-4 border-t border-[var(--sd-line)]">
                  <h4 className="text-[var(--sd-muted)] text-xs font-bold mb-1.5">해 보기로 한 것 · 확인할 일</h4>
                  <ul className="space-y-1">
                    {summary.plans.map((s, i) => (
                      <li key={i} className="text-[var(--sd-ink)] text-sm flex gap-2">
                        <span className="text-[var(--sd-line)]">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {summary.claudeNotes.length > 0 && (
              <div className="sd-card sd-card--quiet p-4 bg-[color-mix(in_srgb,var(--sd-rel)_5%,transparent)]">
                <h4 className="text-[var(--sd-muted)] text-xs font-bold mb-2">Claude가 설명·제안한 것 (참고)</h4>
                <ul className="space-y-2">
                  {summary.claudeNotes.map((note, i) => (
                    <li key={i} className="text-[var(--sd-ink)] text-sm leading-snug flex gap-2">
                      <Info size={14} className="mt-0.5 shrink-0 text-[var(--sd-rel)]" /> {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Journal Candidates */}
        <section className="space-y-3">
          <div className="flex items-end justify-between px-1">
            <h3 className="text-[var(--sd-ink)] font-bold text-lg">일지에 반영할까요?</h3>
            <span className="text-[var(--sd-muted)] text-xs">꼼이가 말한 사실들</span>
          </div>
          
          {items.length === 0 ? (
            <div className="sd-card p-8 text-center text-[var(--sd-muted)] text-sm">
              일지에 넣을 새 사실은 없었어요.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <JournalItemCard 
                  key={item.id} 
                  item={item} 
                  readOnly={readOnly}
                  isEditing={editingItemId === item.id}
                  dateChoices={dateChoices}
                  onToggle={() => onToggleItem(item.id)}
                  onEditClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                  onModeChange={(mode) => onModeItem(item.id, mode)}
                  onDateChange={(date) => onDateItem(item.id, date)}
                  onValueUpdate={(val) => onEditItem(item.id, val)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Memory Candidates */}
        {memory.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-col px-1">
              <h3 className="text-[var(--sd-ink)] font-bold text-lg">다음 상담에도 기억할 것</h3>
              <p className="text-[var(--sd-muted)] text-xs">켠 것만 Claude가 다음 상담부터 기억해요</p>
            </div>
            <div className="sd-card overflow-hidden">
              {memory.map((row, idx) => (
                <div key={row.id} className={`p-4 flex flex-col gap-2 ${idx !== 0 ? 'border-t border-[var(--sd-line)]' : ''}`}>
                  <div className="flex items-start gap-3">
                    {!readOnly && (
                      <input 
                        type="checkbox" 
                        checked={row.on} 
                        onChange={() => onToggleMemory(row.id)}
                        className="mt-1 w-5 h-5 rounded-md border-[var(--sd-line)] text-[var(--sd-rel)] focus:ring-[var(--sd-rel)]"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[var(--sd-rel)] text-[10px] font-bold px-1.5 py-0.5 bg-[var(--sd-rel-soft)] rounded uppercase tracking-wider">
                          {row.kindLabel}
                        </span>
                        {!readOnly && (
                          <button 
                            onClick={() => setEditingMemoryId(editingMemoryId === row.id ? null : row.id)}
                            className="p-1 text-[var(--sd-muted)]"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                      {editingMemoryId === row.id ? (
                        <textarea
                          autoFocus
                          value={row.text}
                          onChange={(e) => onEditMemory(row.id, e.target.value)}
                          onBlur={() => setEditingMemoryId(null)}
                          className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)] focus:outline-none focus:border-[var(--sd-rel)]"
                          rows={2}
                        />
                      ) : (
                        <p className="text-[var(--sd-ink)] text-sm leading-relaxed">{row.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-[var(--sd-surface-2)] via-[var(--sd-surface-2)] to-transparent">
        <div className="max-w-[390px] mx-auto space-y-3">
          {readOnly ? (
            <div className="sd-card p-4 text-center">
              <p className="text-[var(--sd-muted)] text-sm">{readOnlyNote ?? '꼼이가 확인하면 일지에 들어갑니다.'}</p>
            </div>
          ) : (
            <>
              {hasIncompleteDate && (
                <div className="flex items-center justify-center gap-1.5 text-[var(--sd-crit)] text-xs font-medium animate-bounce">
                  <AlertCircle size={14} />
                  <span>날짜를 선택하지 않은 항목이 있어요</span>
                </div>
              )}
              <button
                disabled={applyCount === 0 || phase === 'applying'}
                onClick={onApply}
                className="w-full h-14 bg-[var(--sd-rel)] disabled:bg-[var(--sd-line)] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[var(--sd-rel)]/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                {phase === 'applying' ? (
                  <span className="animate-pulse">반영하는 중...</span>
                ) : (
                  <>
                    선택한 내용을 일지에 반영 <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-black">{applyCount}</span>
                  </>
                )}
              </button>
              <button 
                onClick={onLater}
                className="w-full text-[var(--sd-muted)] text-sm font-medium py-2"
              >
                나중에 하기
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function JournalItemCard({ 
  item, 
  readOnly, 
  isEditing, 
  dateChoices,
  onToggle, 
  onEditClick,
  onModeChange,
  onDateChange,
  onValueUpdate
}: { 
  item: SummaryItem; 
  readOnly: boolean;
  isEditing: boolean;
  dateChoices: { value: string; label: string }[];
  onToggle: () => void;
  onEditClick: () => void;
  onModeChange: (mode: 'replace' | 'note') => void;
  onDateChange: (date: string) => void;
  onValueUpdate: (val: EditValue['value']) => void;
}) {
  const needsDate = item.on && item.date === null;

  return (
    <div className={`sd-card transition-all duration-300 ${item.on ? 'opacity-100' : 'opacity-60 bg-[var(--sd-surface-2)] border-dashed'} ${needsDate ? 'border-[var(--sd-crit)] ring-1 ring-[var(--sd-crit)]' : ''}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {!readOnly && (
            <input 
              type="checkbox" 
              checked={item.on} 
              onChange={onToggle}
              className="mt-1 w-5 h-5 rounded-md border-[var(--sd-line)] text-[var(--sd-rel)] focus:ring-[var(--sd-rel)]"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[var(--sd-muted)] text-[11px] font-bold">{item.fieldLabel}</span>
              <div className="flex items-center gap-2">
                {!item.certain && (
                  <span className="text-[var(--sd-crit)] text-[10px] font-bold px-1 py-0.5 bg-[color-mix(in_srgb,var(--sd-crit)_10%,transparent)] rounded">짐작됨</span>
                )}
                {!readOnly && (
                  <button onClick={onEditClick} className={`p-1 ${isEditing ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-muted)]'}`}>
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[var(--sd-ink)] font-bold text-[15px]">{item.label}</p>
          </div>
        </div>

        {/* Evidence Quote */}
        <div className="pl-8">
          <div className="bg-[var(--sd-surface-2)]/50 p-2 rounded-lg flex gap-2">
            <MessageSquareQuote size={14} className="shrink-0 text-[var(--sd-faint)] mt-0.5" />
            <p className="text-[var(--sd-muted)] text-[13px] leading-tight italic">"{item.evidence}"</p>
          </div>
        </div>

        {/* Editing Area */}
        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[var(--sd-line)] pt-3"
            >
              <ValueEditor edit={item.edit} onUpdate={onValueUpdate} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date Selection */}
        {item.on && (
          <div className="pl-8 space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-[var(--sd-muted)] text-[11px] font-bold">
              <Calendar size={12} /> 날짜
            </div>
            <div className="flex flex-wrap gap-2">
              {dateChoices.map(choice => (
                <button
                  key={choice.value}
                  onClick={() => onDateChange(choice.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${item.date === choice.value ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-surface-2)] text-[var(--sd-ink)] border border-[var(--sd-line)]'}`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conflict Resolution */}
        {item.on && item.current && (
          <div className="pl-8 pt-1">
            <div className="bg-[color-mix(in_srgb,var(--sd-crit)_5%,transparent)] border border-[color-mix(in_srgb,var(--sd-crit)_15%,transparent)] rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[var(--sd-crit)] text-[11px] font-bold uppercase">
                <Info size={12} /> 일지와 다름
              </div>
              <p className="text-[var(--sd-ink)] text-[13px]">현재 일지: <span className="font-bold underline decoration-[var(--sd-crit)]">{item.current}</span></p>
              <div className="flex gap-2">
                <button 
                  onClick={() => onModeChange('replace')}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${item.mode === 'replace' ? 'bg-[var(--sd-crit)] text-white' : 'bg-[var(--sd-card-solid)] text-[var(--sd-crit)] border border-[var(--sd-crit)]'}`}
                >
                  바꾸기
                </button>
                <button 
                  onClick={() => onModeChange('note')}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${item.mode === 'note' ? 'bg-[var(--sd-muted)] text-white' : 'bg-[var(--sd-card-solid)] text-[var(--sd-muted)] border border-[var(--sd-line)]'}`}
                >
                  메모로만
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ValueEditor({ edit, onUpdate }: { edit: EditValue; onUpdate: (val: EditValue['value']) => void }) {
  const { kind, value } = edit;

  if (kind === 'number') {
    const val = value as number || 0;
    return (
      <div className="flex items-center justify-center gap-4 py-2">
        <button 
          onClick={() => onUpdate(Math.max(edit.min, val - edit.step))}
          className="w-10 h-10 rounded-full border border-[var(--sd-line)] flex items-center justify-center text-[var(--sd-ink)]"
        >
          <Minus size={20} />
        </button>
        <div className="text-center min-w-[80px]">
          <span className="text-2xl font-bold text-[var(--sd-ink)]">{val}</span>
          <span className="text-[var(--sd-muted)] ml-1">{edit.unit}</span>
        </div>
        <button 
          onClick={() => onUpdate(Math.min(edit.max, val + edit.step))}
          className="w-10 h-10 rounded-full border border-[var(--sd-line)] flex items-center justify-center text-[var(--sd-ink)]"
        >
          <Plus size={20} />
        </button>
      </div>
    );
  }

  if (kind === 'bool') {
    return (
      <div className="flex gap-2 py-1">
        {[true, false].map((b) => (
          <button
            key={String(b)}
            onClick={() => onUpdate(b)}
            className={`flex-1 h-10 rounded-xl font-bold text-sm ${value === b ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-surface-2)] text-[var(--sd-ink)]'}`}
          >
            {b ? '예' : '아니오'}
          </button>
        ))}
      </div>
    );
  }

  if (kind === 'text') {
    return (
      <div className="space-y-3 py-1">
        <div className="flex flex-wrap gap-2">
          {edit.options.map(opt => (
            <button
              key={opt}
              onClick={() => onUpdate(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${value === opt ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-surface-2)] text-[var(--sd-ink)] border border-[var(--sd-line)]'}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <input 
          type="text"
          value={value as string || ''}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="직접 입력..."
          className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-3 rounded-xl border border-[var(--sd-line)] focus:outline-none focus:border-[var(--sd-rel)]"
        />
      </div>
    );
  }

  if (kind === 'list') {
    const list = value as string[] || [];
    return (
      <div className="space-y-3 py-1">
        <div className="flex flex-wrap gap-1.5">
          {list.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] text-xs font-bold rounded-lg">
              {item}
              <button onClick={() => onUpdate(list.filter((_, idx) => idx !== i))}><X size={14} /></button>
            </span>
          ))}
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          const input = (e.target as any).txt;
          if (input.value.trim()) {
            onUpdate([...list, input.value.trim()]);
            input.value = '';
          }
        }} className="relative">
          <input 
            name="txt"
            type="text"
            placeholder="추가..."
            className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-3 pr-10 rounded-xl border border-[var(--sd-line)] focus:outline-none focus:border-[var(--sd-rel)]"
          />
          <button type="submit" className="absolute right-3 top-3 text-[var(--sd-rel)]"><Plus size={20} /></button>
        </form>
      </div>
    );
  }

  if (kind === 'med') {
    const v = value as { name: string; dose: string | null; time: string | null; status: 'taken' | 'missed' | 'late' | null };
    return (
      <div className="space-y-3 py-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--sd-muted)] uppercase pl-1">이름</label>
            <input 
              value={v.name} 
              onChange={e => onUpdate({...v, name: e.target.value})}
              className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--sd-muted)] uppercase pl-1">용량</label>
            <input 
              value={v.dose || ''} 
              onChange={e => onUpdate({...v, dose: e.target.value})}
              className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--sd-muted)] uppercase pl-1">시각</label>
            <input 
              type="time"
              value={v.time || ''} 
              onChange={e => onUpdate({...v, time: e.target.value})}
              className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--sd-muted)] uppercase pl-1">상태</label>
            <select 
              value={v.status || ''} 
              onChange={e => onUpdate({...v, status: (e.target.value as any) || null})}
              className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)] appearance-none"
            >
              <option value="taken">먹음</option>
              <option value="late">늦게 먹음</option>
              <option value="missed">거름</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'episode') {
    const v = value as { start: string | null; durMin: number | null; areas: string[] };
    return (
      <div className="space-y-3 py-1">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-[var(--sd-muted)] uppercase pl-1">시작 시각</label>
            <div className="relative">
              <input type="time" value={v.start || ''} onChange={e => onUpdate({...v, start: e.target.value})} className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)]" />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-[var(--sd-muted)] uppercase pl-1">지속(분)</label>
            <input type="number" value={v.durMin || ''} onChange={e => onUpdate({...v, durMin: parseInt(e.target.value) || null})} className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)]" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[var(--sd-muted)] uppercase pl-1">발생 부위</label>
          <div className="flex flex-wrap gap-1.5">
            {edit.areaOptions.map(area => (
              <button
                key={area}
                onClick={() => {
                  const next = v.areas.includes(area) ? v.areas.filter(a => a !== area) : [...v.areas, area];
                  onUpdate({...v, areas: next});
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${v.areas.includes(area) ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-surface-2)] text-[var(--sd-muted)] border border-[var(--sd-line)]'}`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'food') {
    const v = value as { t: string | null; text: string };
    return (
      <div className="space-y-2 py-1">
        <div className="flex gap-2">
          <div className="w-24 shrink-0">
            <input type="time" value={v.t || ''} onChange={e => onUpdate({...v, t: e.target.value})} className="w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)]" />
          </div>
          <input 
            value={v.text} 
            onChange={e => onUpdate({...v, text: e.target.value})} 
            placeholder="어떤 음식을 먹었나요?"
            className="flex-1 bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-sm p-2 rounded-lg border border-[var(--sd-line)]"
          />
        </div>
      </div>
    );
  }

  if (kind === 'angio') {
    const v = value as { present: boolean; areas: string[] };
    return (
      <div className="space-y-3 py-1">
        <div className="flex gap-2">
          {[true, false].map(b => (
            <button
              key={String(b)}
              onClick={() => onUpdate({...v, present: b})}
              className={`flex-1 h-9 rounded-lg font-bold text-xs ${v.present === b ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-surface-2)] text-[var(--sd-ink)]'}`}
            >
              {b ? '붓기 있음' : '아니오'}
            </button>
          ))}
        </div>
        {v.present && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--sd-muted)] uppercase pl-1">부은 부위</label>
            <div className="flex flex-wrap gap-1.5">
              {edit.areaOptions.map(area => (
                <button
                  key={area}
                  onClick={() => {
                    const next = v.areas.includes(area) ? v.areas.filter(a => a !== area) : [...v.areas, area];
                    onUpdate({...v, areas: next});
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${v.areas.includes(area) ? 'bg-[var(--sd-rel)] text-white' : 'bg-[var(--sd-surface-2)] text-[var(--sd-muted)] border border-[var(--sd-line)]'}`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
