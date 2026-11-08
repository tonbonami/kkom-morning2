// src/components/honeybrary/HoneyConfirmSheet.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { HONEY } from '@/lib/honeybraryTheme';

export interface HoneyConfirmSheetProps {
  open: boolean;
  title: string;
  body?: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function HoneyConfirmSheet({
  open,
  title,
  body,
  confirmText,
  danger = false,
  onConfirm,
  onClose,
}: HoneyConfirmSheetProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="fixed inset-0 bg-black/[0.35]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md rounded-t-[26px] p-6 flex flex-col gap-3"
            style={{
              background: HONEY.sheet,
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)',
            }}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 360, damping: 36 }
            }
          >
            <p className="text-[17px] font-bold" style={{ color: HONEY.ink }}>
              {title}
            </p>
            {body && (
              <p className="text-[13.5px] leading-relaxed" style={{ color: HONEY.muted }}>
                {body}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white min-h-[44px]"
                style={{ background: danger ? HONEY.crit : HONEY.accent }}
              >
                {confirmText}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-3 text-[14px] font-bold min-h-[44px]"
                style={{ color: HONEY.muted }}
              >
                그만두기
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
