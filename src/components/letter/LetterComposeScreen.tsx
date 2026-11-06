// src/components/letter/LetterComposeScreen.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Mic,
  PenLine,
  Sticker,
  Clock,
  Smile,
  Keyboard,
  Eye,
  EyeOff,
} from 'lucide-react';
import { LETTER_PAPER_CLASS } from './LetterPaper';

export type LetterTool = 'voice' | 'doodle' | 'sticker' | 'schedule';

export interface LetterComposeScreenProps {
  toName: string;
  fromName: string;
  dateText: string;
  editor: React.ReactNode;
  miniOpen: boolean;
  onToggleMini: () => void;
  previewOpen: boolean;
  onTogglePreview: () => void;
  preview: React.ReactNode;
  activeTool: LetterTool | null;
  onToolChange: (t: LetterTool | null) => void;
  toolBadges: Partial<Record<LetterTool, string>>;
  toolPanel: React.ReactNode;
  miniSheet: React.ReactNode;
  error?: string;
  canSend: boolean;
  sending: boolean;
  scheduled: boolean;
  onSend: () => void;
  onBack: () => void;
}

export function LetterComposeScreen({
  toName,
  fromName,
  dateText,
  editor,
  miniOpen,
  onToggleMini,
  previewOpen,
  onTogglePreview,
  preview,
  activeTool,
  onToolChange,
  toolBadges,
  toolPanel,
  miniSheet,
  error,
  canSend,
  sending,
  scheduled,
  onSend,
  onBack,
}: LetterComposeScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  const toolItems: { icon: React.ElementType; label: string; tool: LetterTool }[] = [
    { icon: Mic, label: '음성', tool: 'voice' },
    { icon: PenLine, label: '손글씨', tool: 'doodle' },
    { icon: Sticker, label: '스티커', tool: 'sticker' },
    { icon: Clock, label: '예약', tool: 'schedule' },
  ];

  return (
    <div className="sd-app flex flex-col min-h-app max-w-md mx-auto pt-[env(safe-area-inset-top)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          aria-label="뒤로"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-[var(--sd-ink)]" />
        </motion.button>
        <h1 className="text-xl font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">편지 쓰기</h1>
        <div className="w-[44px]" /> {/* Spacer */}
      </div>

      {/* Letter Paper Section */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center">
        {previewOpen ? (
          <div className="w-full">
            {preview}
          </div>
        ) : (
          <div className={`sd-card w-full p-6 pb-2 rounded-[28px] relative ${LETTER_PAPER_CLASS}`}>
            {/* To/Date */}
            <div className="text-center mb-6">
              <p className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)] leading-none mb-1">
                To. {toName}
              </p>
              <p className="font-['Dongle'] text-lg text-[var(--sd-muted)] leading-none">
                {dateText}
              </p>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[160px]">
              {editor}
            </div>

            {/* From */}
            <div className="text-right mt-6 pr-[24px]">
              <p className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)]">
                From. {fromName}
              </p>
            </div>
          </div>
        )}

        {/* Mini Emoticon / Preview Toggle */}
        <div className="flex justify-center gap-4 mt-4 mb-4">
          {!previewOpen && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleMini}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
            >
              {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
              <span>{miniOpen ? '키보드로' : '미니'}</span>
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTogglePreview}
            className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
          >
            {previewOpen ? <EyeOff size={20} /> : <Eye size={20} />}
            <span>{previewOpen ? '다시 쓰기' : '편지로 보기'}</span>
          </motion.button>
        </div>
      </div>

      {/* Tool Panel */}
      {activeTool && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="bg-[var(--sd-surface-2)] p-4 border-t border-[var(--sd-line)] overflow-hidden"
        >
          {toolPanel}
        </motion.div>
      )}

      {/* Bottom Toolbar: Tool Strip and Send Button */}
      <div className="relative z-40 bg-transparent pb-[env(safe-area-inset-bottom)]">
        {/* Tool Strip */}
        <div className="flex justify-around p-3 bg-[var(--sd-surface-2)] border-t border-[var(--sd-line)]">
          {toolItems.map((item) => {
            const isActive = activeTool === item.tool;
            const badgeText = toolBadges[item.tool];
            const IconComponent = item.icon;
            return (
              <motion.button
                key={item.tool}
                whileTap={{ scale: 0.95 }}
                onClick={() => onToolChange(isActive ? null : item.tool)}
                className={`relative flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-['IBM_Plex_Sans_KR']
                            ${isActive ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-muted)]'} min-h-[44px] min-w-[44px]`}
              >
                <IconComponent size={24} />
                <span>{item.label}</span>
                {badgeText && (
                  <span className="absolute -top-1 -right-1 bg-[var(--sd-rel)] text-white text-[10px] rounded-full px-1 py-[1px] leading-none">
                    {badgeText}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Send Button */}
        <div className="p-4">
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          <motion.button
            whileTap={{ scale: canSend && !sending ? 0.98 : 1 }}
            onClick={onSend}
            disabled={!canSend || sending}
            className={`w-full py-4 rounded-full text-white text-lg font-['IBM_Plex_Sans_KR'] font-semibold
                        ${canSend && !sending ? 'bg-[var(--sd-rel)] shadow-[var(--sd-rel-shadow)]' : 'bg-[var(--sd-faint)]'}
                        ${sending ? 'cursor-not-allowed' : ''} min-h-[44px]`}
          >
            {sending ? '보내는 중...' : scheduled ? '예약 편지 보내기' : '편지 보내기'}
          </motion.button>
        </div>
      </div>

      {/* Mini Emoticon Sheet */}
      {miniSheet}
    </div>
  );
}
