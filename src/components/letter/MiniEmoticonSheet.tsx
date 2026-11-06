// src/components/letter/MiniEmoticonSheet.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Keyboard, Smile } from 'lucide-react';

export interface MiniEmoticonSheetProps {
  open: boolean;
  items: { word: string; src: string }[];
  onPick: (word: string) => void;
  onClose: () => void;
}

export function MiniEmoticonSheet({ open, items, onPick, onClose }: MiniEmoticonSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { y: prefersReducedMotion ? 0 : '100%', opacity: prefersReducedMotion ? 0 : 1 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="fixed bottom-0 left-0 right-0 z-50
                     bg-[var(--sd-card-solid)] rounded-t-[28px] shadow-[var(--sd-shadow-card)]
                     max-h-[calc(40vh+env(safe-area-inset-bottom))] overflow-y-auto
                     pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--sd-line)]">
            <h2 className="text-lg font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
              미니 이모티콘 · 글 속에 쏙
            </h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full min-h-[44px]"
            >
              <Keyboard size={20} />
              <span>키보드로</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-5 gap-2 p-4">
            {items.map((item) => (
              <motion.button
                key={item.word}
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                onClick={() => onPick(item.word)}
                className="flex flex-col items-center p-2 rounded-lg aspect-square justify-center
                           text-[var(--sd-cardlabel)] text-lg font-['Dongle'] font-bold hover:bg-[var(--sd-surface-2)] min-h-[44px] min-w-[44px]"
              >
                <img src={item.src} alt={item.word} className="w-10 h-10 object-contain mb-1" />
                {item.word}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
