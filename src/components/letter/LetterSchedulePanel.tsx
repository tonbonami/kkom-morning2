// src/components/letter/LetterSchedulePanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';

export interface LetterSchedulePanelProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  toName: string;
}

export function LetterSchedulePanel({
  enabled,
  onEnabledChange,
  value,
  onChange,
  toName,
}: LetterSchedulePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">예약 편지</span>
        {/* Toggle Switch */}
        <motion.button
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out
                      ${enabled ? 'bg-[var(--sd-rel)]' : 'bg-[var(--sd-muted)]'}`}
          role="switch"
          aria-checked={enabled}
        >
          <motion.span
            animate={{ x: enabled ? '100%' : '0%' }}
            transition={{ type: 'spring', stiffness: 700, damping: 50, duration: prefersReducedMotion ? 0 : 0.2 }}
            className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-md"
          />
        </motion.button>
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="overflow-hidden"
        >
          <div className="mb-4">
            <label htmlFor="schedule-datetime" className="sr-only">예약 날짜 및 시간</label>
            <input
              id="schedule-datetime"
              type="datetime-local"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-3 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-lg
                         focus:outline-none focus:ring-2 focus:ring-[var(--sd-rel)] appearance-none"
              style={{ minHeight: '44px' }} // Ensure sufficient touch target
            />
          </div>
          <p className="flex items-center gap-2 text-[var(--sd-muted)] text-sm">
            <Lock size={16} />
            <span>이 시각에 {toName}에게 도착해요. 그 전엔 잠겨 있어요.</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
