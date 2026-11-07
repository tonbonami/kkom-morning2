// src/components/letter/LetterEmoticonSheet.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

// Assuming SignedSticker is in the same directory as per project structure
import { SignedSticker } from './SignedSticker';

export interface LetterEmoticonSheetItem { id: string; label: string; thumbUrl: string }
export interface LetterEmoticonSheetSet { id: string; title: string; thumbUrl: string; animated?: boolean; items: LetterEmoticonSheetItem[] }
export interface LetterEmoticonSheetProps {
  open: boolean;
  sets: LetterEmoticonSheetSet[];
  activeSetId: string;
  onSetChange: (id: string) => void;
  selected: LetterEmoticonSheetItem[];
  max: number;
  onAdd: (id: string) => void;
  onRemove: (index: number) => void;
  onClose: () => void;
  sign: string; // My sign (Kkomi/Kkuldang)
}

export function LetterEmoticonSheet({
  open,
  sets,
  activeSetId,
  onSetChange,
  selected,
  max,
  onAdd,
  onRemove,
  onClose,
  sign,
}: LetterEmoticonSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const sheetVariants = {
    hidden: { y: prefersReducedMotion ? 0 : '100%', opacity: prefersReducedMotion ? 0 : 1 },
    visible: { y: 0, opacity: 1 },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const activeSet = sets.find(set => set.id === activeSetId);
  const isMaxSelected = selected.length >= max;

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
                큰 이모티콘 · 사인해서 붙여요
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

            {/* Selected Items */}
            <div className="p-4 border-b border-[var(--sd-line)] flex-shrink-0">
              <p className="text-sm text-[var(--sd-muted)] mb-2 font-['IBM_Plex_Sans_KR']">
                담은 것 ({selected.length} / {max})
              </p>
              <div className="flex flex-wrap gap-2 min-h-[50px] items-center">
                {selected.length > 0 ? (
                  selected.map((item, index) => (
                    <motion.button
                      key={`${item.id}-${index}`}
                      whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                      onClick={() => onRemove(index)}
                      className="relative w-12 h-12 rounded-lg object-contain bg-[var(--sd-surface-2)] flex items-center justify-center min-w-[44px] min-h-[44px]"
                      aria-label={`${item.label} 빼기`}
                    >
                      <img src={item.thumbUrl} alt={item.label} className="w-10 h-10 object-contain" />
                      <X size={16} className="absolute -top-1 -right-1 text-[var(--sd-muted)] bg-white rounded-full" />
                    </motion.button>
                  ))
                ) : (
                  <p className="text-[var(--sd-muted)] font-['IBM_Plex_Sans_KR']">누르면 여기 담겨요</p>
                )}
              </div>
            </div>

            {/* Pack Tabs */}
            <div className="px-4 py-3 border-b border-[var(--sd-line)] overflow-x-auto whitespace-nowrap scrollbar-hide flex-shrink-0">
              {sets.map((set) => (
                <motion.button
                  key={set.id}
                  whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                  onClick={() => onSetChange(set.id)}
                  className={`inline-flex flex-col items-center p-2 mx-1 rounded-lg min-w-[60px] min-h-[60px]
                              ${activeSetId === set.id ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)]' : 'text-[var(--sd-muted)]'}`}
                  aria-label={`${set.title} 팩 선택`}
                >
                  <img src={set.thumbUrl} alt={set.title} className="w-8 h-8 object-contain rounded-md" />
                  <span className="text-xs mt-1 font-['IBM_Plex_Sans_KR']">{set.title}</span>
                </motion.button>
              ))}
            </div>

            {/* Emoticon Grid */}
            <div className="flex-grow overflow-y-auto p-4 relative">
              {activeSet ? (
                <div className={`grid grid-cols-4 gap-3 ${isMaxSelected ? 'opacity-40 pointer-events-none' : ''}`}>
                  {activeSet.items.map((item) => (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                      onClick={() => onAdd(item.id)}
                      className="flex flex-col items-center justify-center p-2 rounded-lg aspect-square
                                 text-[var(--sd-cardlabel)] hover:bg-[var(--sd-surface-2)] min-h-[44px] min-w-[44px]"
                      aria-label={item.label}
                    >
                      {/* 썸네일엔 사인 없이 — 우댕 「썸네일 사인은 빼줘」(2026-11-07). 사인은 담은 뒤 편지·스티커 칸에서만 */}
                      <SignedSticker src={item.thumbUrl} alt={item.label} size={64} tilt={-7} />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--sd-muted)] text-center font-['IBM_Plex_Sans_KR']">팩을 선택해 주세요.</p>
              )}

              {isMaxSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg p-4 text-center">
                  <p className="text-[var(--sd-ink)] font-semibold font-['IBM_Plex_Sans_KR']">
                    3개 다 담았어요. 빼면 더 담을 수 있어요.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
