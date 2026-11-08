// src/components/honeybrary/ReadingProgressPanel.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { STATUS_LABEL, type Person, type ReadingVM, type ReadStatus } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { ReaderProgressLine } from '@/components/honeybrary/ReaderProgressLine';

export interface ReadingProgressPanelProps {
  readers: Partial<Record<Person, ReadingVM>>;
  me: Person;
  onSave: (r: ReadingVM) => void;
  onJoin: () => void;
}

export function ReadingProgressPanel({
  readers,
  me,
  onSave,
  onJoin,
}: ReadingProgressPanelProps) {
  const [editing, setEditing] = useState(false);
  const myReading = readers[me];
  const partner: Person = me === '우댕' ? '꼼이' : '우댕';
  const partnerReading = readers[partner];

  return (
    <div
      className="rounded-[20px] p-4 flex flex-col gap-2.5"
      style={{
        background: HONEY.card,
        border: `1px solid ${HONEY.line}`,
        boxShadow: HONEY.shadowCard,
      }}
    >
      <div className="flex items-center gap-2">
        {myReading ? (
          <>
            <div className="flex-1 min-w-0">
              <ReaderProgressLine name={me} reading={myReading} />
            </div>
            {!editing && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditing(true)}
                className="shrink-0 text-[12px] font-bold px-2.5 py-1 rounded-full min-h-[30px]"
                style={{ background: 'var(--sd-surface-2)', color: HONEY.muted }}
              >
                고치기
              </motion.button>
            )}
          </>
        ) : (
          <div className="w-full flex items-center justify-between py-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[12.5px] font-bold shrink-0" style={{ color: HONEY.muted }}>
                {me}
              </span>
              <span className="text-[11px] shrink-0" style={{ color: HONEY.line }}>
                ·
              </span>
              <span className="text-[12.5px] shrink-0" style={{ color: HONEY.faint }}>
                아직 안 읽음
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onJoin}
              className="shrink-0 text-[12px] font-bold px-3 py-1 rounded-full text-white min-h-[30px]"
              style={{ background: HONEY.accent }}
            >
              나도 읽기
            </motion.button>
          </div>
        )}
      </div>

      {myReading && editing && (
        <ProgressEditor
          initial={myReading}
          onCancel={() => setEditing(false)}
          onSave={(r) => {
            setEditing(false);
            onSave(r);
          }}
        />
      )}

      {partnerReading && (
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex-1 min-w-0">
            <ReaderProgressLine name={partner} reading={partnerReading} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: ReadingVM;
  onSave: (r: ReadingVM) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<ReadStatus>(initial.status);
  const [current, setCurrent] = useState(initial.current ? String(initial.current) : '');
  const [total, setTotal] = useState(initial.total ? String(initial.total) : '');

  const parseNum = (s: string) => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const c = parseNum(current);
  const t = parseNum(total);
  const tooFar = Boolean(c && t && c > t);

  const fieldStyle = {
    background: 'var(--sd-surface-2)',
    border: `1px solid ${HONEY.line}`,
    color: HONEY.ink,
  };

  return (
    <div
      className="flex flex-col gap-3 pt-2.5 border-t"
      style={{ borderColor: HONEY.line }}
    >
      <div className="grid grid-cols-3 gap-1.5">
        {(['reading', 'done', 'shelved'] as const).map((s) => {
          const isSelected = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={isSelected}
              className="py-2 rounded-xl text-[13px] font-bold min-h-[40px]"
              style={
                isSelected
                  ? { background: HONEY.accent, color: '#ffffff' }
                  : { ...fieldStyle, color: HONEY.muted }
              }
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>

      {status === 'reading' && (
        <div className="flex items-center gap-2">
          <input
            id="prog-current-input"
            inputMode="numeric"
            value={current}
            placeholder="지금 쪽"
            onChange={(e) => setCurrent(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="w-full rounded-xl px-3 py-2 text-[16px] outline-none tabular-nums"
            style={fieldStyle}
          />
          <span style={{ color: HONEY.faint }}>/</span>
          <input
            id="prog-total-input"
            inputMode="numeric"
            value={total}
            placeholder="전체 쪽"
            onChange={(e) => setTotal(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="w-full rounded-xl px-3 py-2 text-[16px] outline-none tabular-nums"
            style={fieldStyle}
          />
        </div>
      )}

      {tooFar && (
        <p className="text-[12px]" style={{ color: HONEY.crit }}>
          지금 쪽이 전체 쪽보다 커요.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-[14px] font-bold min-h-[44px]"
          style={{ color: HONEY.muted }}
        >
          그만두기
        </button>
        <button
          type="button"
          disabled={tooFar}
          onClick={() =>
            onSave({
              status,
              current: status === 'reading' ? c : undefined,
              total: status === 'reading' ? t : undefined,
            })
          }
          className="flex-1 py-2 rounded-xl text-[14px] font-bold text-white disabled:opacity-40 min-h-[44px]"
          style={{ background: HONEY.accent }}
        >
          저장
        </button>
      </div>

      <p className="text-[11.5px]" style={{ color: HONEY.faint }}>
        쪽수는 비워 둬도 돼요. 바꿔도 상대에게 알림은 안 가요.
      </p>
    </div>
  );
}
