// src/components/honeybrary/HoneySheet.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { HONEY } from '@/lib/honeybraryTheme';

export interface HoneySheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tall?: boolean;
}

export function HoneySheet({
  open,
  title,
  onClose,
  children,
  footer,
  tall = false,
}: HoneySheetProps) {
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
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="fixed inset-0 bg-black/[0.35]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full max-w-md mx-auto rounded-t-[28px] overflow-hidden flex flex-col ${
              tall ? 'max-h-[92vh] h-[92vh]' : 'max-h-[88vh]'
            }`}
            style={{ background: HONEY.sheet }}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 360, damping: 36 }
            }
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
              <h2 className="text-[17px] font-bold min-w-0 truncate" style={{ color: HONEY.ink }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="닫기"
                className="p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                style={{ color: HONEY.faint }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {children}
            </div>
            {footer && (
              <div
                className="shrink-0 px-6 pt-2"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}
              >
                {footer}
              </div>
            )}
            {!footer && (
              <div style={{ height: 'env(safe-area-inset-bottom)' }} className="shrink-0" />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
