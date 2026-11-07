// src/components/letter/LetterAnimSheet.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Check } from 'lucide-react';

export interface LetterAnimSheetProps {
  open: boolean;
  items: { id: string; label: string; posterUrl: string; videoUrl: string }[];
  selectedId: string | null;
  onPick: (id: string | null) => void;
  onClose: () => void;
}

export function LetterAnimSheet({
  open,
  items,
  selectedId,
  onPick,
  onClose,
}: LetterAnimSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const sheetVariants = {
    hidden: { y: prefersReducedMotion ? 0 : '100%', opacity: prefersReducedMotion ? 0 : 1 },
    visible: { y: 0, opacity: 1 },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40">
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sheetVariants}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50
                       bg-[var(--sd-card-solid)] rounded-t-[28px] shadow-[var(--sd-shadow-card)]
                       max-h-[60vh] overflow-y-auto
                       pb-[env(safe-area-inset-bottom)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--sd-line)] flex-shrink-0">
              <h2 className="text-lg font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
                움직이는 포차코 · 하나만 붙여요
              </h2>
              <motion.button
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full text-[var(--sd-muted)] min-w-[44px] min-h-[44px]"
                aria-label="닫기"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Video Grid */}
            <div className="flex-grow overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                    onClick={() => onPick(selectedId === item.id ? null : item.id)}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-lg aspect-video
                                 bg-[var(--sd-surface-2)] text-[var(--sd-cardlabel)]
                                 ${selectedId === item.id ? 'ring-2 ring-[var(--sd-rel)]' : ''} min-w-[44px] min-h-[44px]`}
                    aria-label={item.label}
                  >
                    <video
                      src={item.videoUrl}
                      poster={item.posterUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover rounded-md"
                    />
                    {selectedId === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                        <Check size={48} className="text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Instruction Text */}
            <div className="p-4 border-t border-[var(--sd-line)] flex-shrink-0">
              <p className="text-sm text-[var(--sd-muted)] text-center font-['IBM_Plex_Sans_KR']">
                편지에 붙으면 상대 화면에서 움직여요
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
