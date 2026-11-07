```tsx
// src/components/letter/LetterPaperPanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LetterPaperTheme } from '@/lib/letterPapers';

export interface LetterPaperPanelProps {
  papers: LetterPaperTheme[];
  value: string; // 지금 고른 id
  onChange: (id: string) => void;
}

export function LetterPaperPanel({ papers, value, onChange }: LetterPaperPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="p-4">
      <h3 className="text-[var(--sd-ink)] text-base font-semibold mb-3 font-['IBM_Plex_Sans_KR']">
        편지지 · 받는 사람도 이 편지지로 읽어요
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {papers.map((paper) => {
          const isSelected = value === paper.id;
          return (
            <motion.button
              key={paper.id}
              type="button"
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
              onClick={() => onChange(paper.id)}
              className={`
                relative flex flex-col items-center gap-1.5 p-1.5 rounded-[12px]
                border-2 transition-all duration-150 min-h-[44px]
                ${isSelected ? 'border-[var(--sd-rel)]' : 'border-transparent'}
              `}
            >
              {/* 실제 편지지 배경과 무늬가 동일하게 반영되는 견본 */}
              <div
                className={`w-full aspect-[3/4] rounded-[8px] overflow-hidden border border-black/5 ${paper.className.replace('sd-card-paper', '').trim()}`}
                style={paper.style}
              />
              <span
                className={`
                  font-['Dongle'] text-2xl leading-none font-bold
                  ${isSelected ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-ink)]'}
                `}
              >
                {paper.name}
              </span>
              {isSelected && (
                <div className="absolute inset-0 rounded-[12px] border-2 border-[var(--sd-rel)] pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
```

```tsx
// src/components/letter/LetterPaper.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MiniPart } from '@/lib/miniEmoticons';
import { PencilLine, Check, XCircle, Smile, Keyboard } from 'lucide-react';
import type { LetterPaperTheme } from '@/lib/letterPapers';
import { paperById } from '@/lib/letterPapers';

// 우댕 2026-11-06 흰 말티푸(꼼이미니)가 또렷하게 뜨면서도 코랄 테마와 어우러지는 은은한 살구 피치 그라디언트 적용
//   ⚠️ `!` — 쓰기 화면 편지지는 `.sd-card`(background: 반투명 흰색, 층 밖 CSS)와 같이 붙어 !가 없으면 흰색이 이긴다.
// 편지지 색 — 우댕 「B로 해줘, 되돌릴 수도 있게」(2026-11-06). 되돌릴 땐 아래 값 중 하나로 이 한 줄만 바꾼다:
//   흰 아이보리(1차) '!bg-[#FCFAF7] sd-card-paper' — 꼼이미니가 묻힘
//   베이지          '!bg-[#EEE3D5] sd-card-paper' — 우댕 「베이지는 아니야」
//   A 그라디언트    '!bg-[linear-gradient(180deg,#FDF3EE_0%,#F9E0D6_100%)] sd-card-paper' — Gemini 추천, 위쪽 미니가 흐림
//   B 살구 단색(지금) — Gemini 대안
export const LETTER_PAPER_CLASS = '!bg-[#F9E0D6] sd-card-paper'; // Keep for backward compatibility

export interface LetterPaperProps {
  toName: string;
  fromName: string;
  dateText: string;
  parts: MiniPart[];
  preview?: boolean;
  emptyText?: string;
  editing?: boolean;
  editorSlot?: React.ReactNode;
  headerAction?: React.ReactNode;
  enclosures?: React.ReactNode;
  canEdit?: boolean;            // 내가 보낸 편지면 true — 「수정」 작은 단추
  onStartEdit?: () => void;
  onSaveEdit?: () => void;      // editing 일 때 「저장」
  onCancelEdit?: () => void;    // editing 일 때 「취소」
  savingEdit?: boolean;         // 저장 중이면 「저장 중…」
  miniOpen?: boolean;           // editing 중 미니 서랍이 열려 있나
  onToggleMini?: () => void;    // editing 중 「미니」 단추(쓰기 화면과 같은 모양) — 고칠 때도 글 속에 미니를 넣게
  paper?: LetterPaperTheme;     // 새 편지지 테마
}

export function LetterPaper({
  toName,
  fromName,
  dateText,
  parts,
  preview = false,
  emptyText = '아직 쓴 말이 없어요',
  editing = false,
  editorSlot,
  headerAction,
  enclosures,
  canEdit,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  savingEdit,
  miniOpen,
  onToggleMini,
  paper,
}: LetterPaperProps) {
  const prefersReducedMotion = useReducedMotion();
  const currentPaper = paper || paperById();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative w-full ${currentPaper.className}
        rounded-[28px] ${preview ? 'shadow-sm' : 'shadow-[var(--sd-shadow-card)]'}
        overflow-hidden
      `}
      style={{
        ...currentPaper.style,
        color: currentPaper.ink,
      }}
    >
      {/* Header with To. Name and Action Button */}
      <div className="flex items-center justify-between pt-6 pb-4 px-6 relative z-10">
        <h2
          className="font-['Dongle'] text-3xl font-bold whitespace-nowrap leading-none mb-1"
          style={{ color: currentPaper.ink }}
        >
          To. {toName}
        </h2>
        <div className="flex items-center gap-2">
          {headerAction}
          {canEdit && !editing && (
            <motion.button
              type="button"
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
              onClick={onStartEdit}
              className="flex items-center gap-1 text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
              style={{ color: currentPaper.muted }}
            >
              <PencilLine size={18} />
              <span>수정</span>
            </motion.button>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                onClick={onCancelEdit}
                className="flex items-center gap-1 text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
                style={{ color: currentPaper.muted }}
              >
                <XCircle size={18} />
                <span>취소</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                onClick={onSaveEdit}
                disabled={savingEdit}
                className={`flex items-center gap-1 text-white text-sm px-3 py-2 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]
                            ${savingEdit ? 'bg-[var(--sd-faint)]' : 'bg-[var(--sd-rel)]'}`}
              >
                {savingEdit ? '저장 중...' : '저장'}
                <Check size={18} />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                onClick={onToggleMini}
                className="flex items-center gap-1 text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
                style={{ color: currentPaper.muted }}
              >
                {miniOpen ? <Keyboard size={18} /> : <Smile size={18} />}
                <span>{miniOpen ? '키보드로' : '미니'}</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`px-6 text-[16px] leading-[1.8] ${preview ? 'py-2' : 'py-4'}`}>
        {editing ? (
          <div className="min-h-[100px]">{editorSlot}</div>
        ) : parts.length === 0 ? (
          <p className="text-center py-8" style={{ color: currentPaper.muted }}>
            {emptyText}
          </p>
        ) : (
          <p className="whitespace-pre-wrap">
            {parts.map((part, index) => {
              if (part.kind === 'text') {
                return (
                  <span key={index} style={{ color: currentPaper.ink }}>
                    {part.text}
                  </span>
                );
              } else {
                return (
                  <img
                    key={index}
                    src={part.src}
                    alt={part.word}
                    className="inline-block h-7 align-text-bottom mx-[1px]"
                  />
                );
              }
            })}
          </p>
        )}
      </div>

      {/* From. Name and Date Stamp */}
      <div className={`flex justify-end pr-6 pb-6 pt-4 ${preview ? 'pt-2 pb-4' : ''}`}>
        <div
          className={`
            font-['Dongle'] text-2xl shadow-sm whitespace-nowrap tabular-nums
            ${preview ? 'text-xl px-2 py-0.5' : 'px-3 py-1'}
            border rounded-lg
          `}
          style={{
            backgroundColor: currentPaper.stamp.bg,
            borderColor: currentPaper.stamp.border,
            color: currentPaper.stamp.fg,
          }}
        >
          From. {fromName} {dateText}
        </div>
      </div>

      {/* Enclosures Section */}
      {enclosures && (
        <div className="pt-4 border-t border-[var(--sd-line)]/70">
          <p className="text-center text-[var(--sd-cardlabel)] text-sm mb-3">동봉한 것</p>
          <div className="pb-6 px-6">
            {enclosures}
          </div>
        </div>
      )}
    </motion.div>
  );
}
```

```tsx
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
  Palette,
} from 'lucide-react';
import { LETTER_PAPER_CLASS } from './LetterPaper';
import type { LetterPaperTheme } from '@/lib/letterPapers';

export type LetterTool = 'voice' | 'doodle' | 'sticker' | 'schedule' | 'paper';

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
  paper: LetterPaperTheme;
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
  paper,
}: LetterComposeScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  const toolItems: { icon: React.ElementType; label: string; tool: LetterTool }[] = [
    { icon: Mic, label: '음성', tool: 'voice' },
    { icon: PenLine, label: '손글씨', tool: 'doodle' },
    { icon: Sticker, label: '스티커', tool: 'sticker' },
    { icon: Palette, label: '편지지', tool: 'paper' },
    { icon: Clock, label: '예약', tool: 'schedule' },
  ];

  return (
    <div className="sd-app flex flex-col min-h-app max-w-md mx-auto pt-[env(safe-area-inset-top)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        <motion.button
          type="button"
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
          onClick={onBack}
          aria-label="뒤로"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
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
          <div
            className={`sd-card w-full p-6 pb-4 rounded-[28px] relative ${paper.className}`}
            style={{
              ...paper.style,
              color: paper.ink,
            }}
          >
            {/* To/Date */}
            <div className="text-center mb-6">
              <p
                className="font-['Dongle'] text-3xl font-bold leading-none mb-1"
                style={{ color: paper.ink }}
              >
                To. {toName}
              </p>
              <p
                className="font-['Dongle'] text-2xl leading-none"
                style={{ color: paper.muted }}
              >
                {dateText}
              </p>
            </div>

            {/* Editor Slot */}
            <div className="flex-1 min-h-[160px] text-[16px] leading-[1.8]">
              {editor}
            </div>

            {/* From */}
            <div className="text-right mt-6 pr-4">
              <p
                className="font-['Dongle'] text-3xl font-bold leading-none"
                style={{ color: paper.ink }}
              >
                From. {fromName}
              </p>
            </div>
          </div>
        )}

        {/* Mini Emoticon / Preview Toggle */}
        <div className="flex justify-center gap-4 mt-4 mb-4">
          {!previewOpen && (
            <motion.button
              type="button"
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
              onClick={onToggleMini}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-4 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px] shadow-sm"
            >
              {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
              <span>{miniOpen ? '키보드로' : '미니'}</span>
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onTogglePreview}
            className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-4 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px] shadow-sm"
          >
            {previewOpen ? <EyeOff size={20} /> : <Eye size={20} />}
            <span>{previewOpen ? '다시 쓰기' : '편지로 보기'}</span>
          </motion.button>
        </div>
      </div>

      {/* Tool Panel */}
      {activeTool && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
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
