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
