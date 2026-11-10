// src/components/honeybrary/VisibilityChangeSheet.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Visibility } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneySheet } from './HoneySheet';

export interface VisibilityChangeSheetProps {
  open: boolean;
  current: Visibility;
  partnerName: string;
  checking?: boolean;
  blockedReason?: string | null;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function VisibilityChangeSheet({
  open,
  current,
  partnerName,
  checking = false,
  blockedReason,
  busy = false,
  onConfirm,
  onClose,
}: VisibilityChangeSheetProps) {
  const shouldReduceMotion = useReducedMotion();

  const title = blockedReason
    ? '바꿀 수 없어요'
    : current === 'shared'
      ? '혼자 보는 책으로 바꿀까요?'
      : '같이 보는 책으로 바꿀까요?';

  return (
    <HoneySheet open={open} title={title} onClose={onClose}>
      <div className="flex flex-col gap-5 pt-1">
        {checking ? (
          <p className="text-[14.5px] py-4 text-center" style={{ color: HONEY.muted }}>
            확인하는 중…
          </p>
        ) : blockedReason ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] leading-relaxed" style={{ color: HONEY.ink }}>
              {blockedReason}
            </p>
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="w-full h-[48px] rounded-[16px] text-[14.5px] font-bold flex items-center justify-center transition-opacity"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            >
              알겠어요
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] leading-relaxed" style={{ color: HONEY.muted }}>
              {current === 'shared'
                ? `이제 ${partnerName} 화면에서는 이 책이 보이지 않아요.`
                : `그동안 남긴 진행과 기록·감상이 ${partnerName}에게 함께 보여요.`}
            </p>

            <div className="flex items-center gap-2.5 mt-2">
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={busy}
                className="flex-1 h-[48px] rounded-[16px] text-[14.5px] font-bold flex items-center justify-center min-h-[44px] disabled:opacity-50"
                style={{
                  background: HONEY.card,
                  color: HONEY.muted,
                  border: `1px solid ${HONEY.line}`,
                }}
              >
                그만두기
              </motion.button>
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="flex-1 h-[48px] rounded-[16px] text-[14.5px] font-bold text-white flex items-center justify-center min-h-[44px] disabled:opacity-50"
                style={{ background: HONEY.accent, color: HONEY.accentInk }}
              >
                {busy ? '바꾸는 중…' : '바꾸기'}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </HoneySheet>
  );
}
