```typescript
// src/lib/letterPapers.ts

export interface LetterPaperTheme {
  id: string; // 저장되는 값 — 영어 소문자, 한 번 정하면 안 바꾼다(예: 'peach')
  name: string; // 고르는 칸에 보이는 짧은 한국어 이름
  className: string; // 편지지 바탕(무늬 포함). 예: '!bg-[#F9E0D6] sd-card-paper'
  ink: string; // 본문·To/From 글자색 (CSS 색 값)
  muted: string; // 날짜·흐린 글자색
  stamp: { bg: string; fg: string; border: string }; // From 날짜 도장 색
}

export const DEFAULT_PAPER_ID = 'peach';

export const LETTER_PAPERS: LetterPaperTheme[] = [
  {
    id: 'peach',
    name: '살구',
    className: '!bg-[#F9E0D6] sd-card-paper',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
  {
    id: 'honeyjar',
    name: '꿀단지',
    className:
      '!bg-[#FEEFC4] sd-card-paper [background-image:radial-gradient(#FDE7BD_1px,transparent_1px),radial-gradient(#FDE7BD_1px,transparent_1px)] [background-size:16px_16px] [background-position:0_0,8px_8px]',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
  {
    id: 'pawprint',
    name: '꼼이발자국',
    className:
      '!bg-[#FDEBF0] sd-card-paper [background-image:radial-gradient(#FBCDD8_1px,transparent_1px),radial-gradient(#FBCDD8_1px,transparent_1px)] [background-size:20px_20px] [background-position:0_0,10px_10px]',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
  {
    id: 'nightsky',
    name: '별밤',
    className:
      '!bg-[#2E3A52] sd-card-paper [background-image:radial-gradient(#E8F0FF_0.5px,transparent_0.5px),radial-gradient(#E8F0FF_0.5px,transparent_0.5px)] [background-size:24px_24px] [background-position:0_0,12px_12px]',
    ink: '#E8F0FF', // Lighter ink for dark background
    muted: '#AAB8D0', // Lighter muted for dark background
    stamp: { bg: '#4A5B7F', fg: '#E8F0FF', border: '#AAB8D0' }, // Adjusted stamp colors
  },
  {
    id: 'rulednote',
    name: '줄노트',
    className:
      '!bg-[#F8FDFE] sd-card-paper [background-image:repeating-linear-gradient(to_bottom,transparent_0px,transparent_28px,#E6F2F5_28px,#E6F2F5_29px)]',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
  {
    id: 'checker',
    name: '체크',
    className:
      '!bg-[#FDF7F5] sd-card-paper [background-image:linear-gradient(45deg,#F7EBE8_25%,transparent_25%,transparent_75%,#F7EBE8_75%,#F7EBE8),linear-gradient(-45deg,#F7EBE8_25%,transparent_25%,transparent_75%,#F7EBE8_75%,#F7EBE8)] [background-size:20px_20px]',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
];

export function paperById(id?: string | null): LetterPaperTheme {
  return LETTER_PAPERS.find((paper) => paper.id === id) || LETTER_PAPERS[0];
}
```
```typescript
// src/components/letter/LetterPaperPanel.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LetterPaperTheme } from '@/lib/letterPapers';

export interface LetterPaperPanelProps {
  papers: LetterPaperTheme[];
  value: string; // 지금 고른 id
  onChange: (id: string) => void;
}

export function LetterPaperPanel({ papers, value, onChange }: LetterPaperPanelProps) {
  return (
    <div className="p-4">
      <h3 className="text-[var(--sd-ink)] text-base font-semibold mb-3">
        편지지 · 받는 사람도 이 편지지로 읽어요
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {papers.map((paper) => (
          <motion.button
            key={paper.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(paper.id)}
            className={`
              relative flex flex-col items-center gap-2 p-1.5 rounded-[12px]
              border-2 transition-all duration-150
              ${value === paper.id ? 'border-[var(--sd-rel)]' : 'border-transparent'}
            `}
          >
            <div
              className={`
                w-full aspect-[3/4] rounded-[8px] overflow-hidden
                ${paper.className.replace('sd-card-paper', '')}
              `}
            >
              {/* 실제 편지지 무늬가 보이는 작은 견본 */}
            </div>
            <span
              className={`
                font-['Dongle'] text-lg font-bold
                ${value === paper.id ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-ink)]'}
              `}
            >
              {paper.name}
            </span>
            {value === paper.id && (
              <div className="absolute inset-0 rounded-[12px] border-2 border-[var(--sd-rel)] pointer-events-none" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```
Next, I will provide the modified code for `src/components/letter/LetterPaper.tsx`.
I will need to import `LetterPaperTheme` and `paperById` from `src/lib/letterPapers.ts`.```typescript
// src/components/letter/LetterPaper.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
  paper?: LetterPaperTheme; // 새 편지지 테마
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
  paper, // Destructure new prop
}: LetterPaperProps) {
  const currentPaper = paper || paperById(); // Use provided paper or default

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative w-full ${currentPaper.className} text-[${currentPaper.ink}]
        rounded-[28px] ${preview ? 'shadow-sm' : 'shadow-[var(--sd-shadow-card)]'}
        overflow-hidden
      `}
    >
      {/* Header with To. Name and Action Button */}
      <div className="flex items-center justify-between pt-6 pb-4 px-6 relative z-10">
        <h2 className="font-['Dongle'] text-2xl font-bold whitespace-nowrap leading-none mb-1" style={{ color: currentPaper.ink }}>
          To. {toName}
        </h2>
        <div className="flex items-center gap-2">
          {headerAction}
          {canEdit && !editing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStartEdit}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
              style={{ color: currentPaper.muted }} // Apply muted color
            >
              <PencilLine size={20} />
              <span>수정</span>
            </motion.button>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCancelEdit}
                className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
                style={{ color: currentPaper.muted }} // Apply muted color
              >
                <XCircle size={20} />
                <span>취소</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onSaveEdit}
                disabled={savingEdit}
                className={`flex items-center gap-1 text-white text-sm px-3 py-2 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]
                            ${savingEdit ? 'bg-[var(--sd-faint)]' : 'bg-[var(--sd-rel)]'}`}
              >
                {savingEdit ? '저장 중...' : '저장'}
                <Check size={20} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onToggleMini}
                className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
                style={{ color: currentPaper.muted }} // Apply muted color
              >
                {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
                <span>{miniOpen ? '키보드로' : '미니'}</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`px-6 text-[16px] leading-[1.8] ${preview ? 'py-2' : 'py-4'}`}>
        {editing ? (
          <div className="min-h-[100px]">{editorSlot}</div> // Placeholder for editor slot
        ) : parts.length === 0 ? (
          <p className="text-center py-8" style={{ color: currentPaper.muted }}>
            {emptyText}
          </p>
        ) : (
          <p className="whitespace-pre-wrap">
            {parts.map((part, index) => {
              if (part.kind === 'text') {
                return <span key={index} style={{ color: currentPaper.ink }}>{part.text}</span>;
              } else {
                return (
                  <img
                    key={index}
                    src={part.src}
                    alt={part.word}
                    className="inline-block h-7 align-text-bottom mx-[1px]" // 28px height
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
            font-['Dongle'] text-lg shadow-sm whitespace-nowrap tabular-nums
            ${preview ? 'text-base px-2 py-0.5' : ''}
            bg-[${currentPaper.stamp.bg}] border border-[${currentPaper.stamp.border}] text-[${currentPaper.stamp.fg}] px-3 py-1 rounded-lg
          `}
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
Finally, I will provide the modified code for `src/components/letter/LetterComposeScreen.tsx`.
I will add `'paper'` to `LetterTool`, include `paper: LetterPaperTheme` in props, add a "편지지" button with a `Palette` icon, and update the text colors and background class in the writing area.```typescript
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
  Palette, // Added for paper selection
} from 'lucide-react';
import { LETTER_PAPER_CLASS } from './LetterPaper'; // Keep for backward compatibility if needed, but we'll use paper.className
import type { LetterPaperTheme } from '@/lib/letterPapers';

export type LetterTool = 'voice' | 'doodle' | 'sticker' | 'schedule' | 'paper'; // Added 'paper'

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
  paper: LetterPaperTheme; // Added paper prop
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
  paper, // Destructure new prop
}: LetterComposeScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  const toolItems: { icon: React.ElementType; label: string; tool: LetterTool }[] = [
    { icon: Mic, label: '음성', tool: 'voice' },
    { icon: PenLine, label: '손글씨', tool: 'doodle' },
    { icon: Sticker, label: '스티커', tool: 'sticker' },
    { icon: Palette, label: '편지지', tool: 'paper' }, // Added '편지지' tool
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
          <div className={`sd-card w-full p-6 pb-2 rounded-[28px] relative ${paper.className}`}>
            {/* To/Date */}
            <div className="text-center mb-6">
              <p className="font-['Dongle'] text-2xl font-bold leading-none mb-1" style={{ color: paper.ink }}>
                To. {toName}
              </p>
              <p className="font-['Dongle'] text-lg leading-none" style={{ color: paper.muted }}>
                {dateText}
              </p>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[160px]">
              {editor}
            </div>

            {/* From */}
            <div className="text-right mt-6 pr-[24px]">
              <p className="font-['Dongle'] text-2xl font-bold" style={{ color: paper.ink }}>
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
              style={{ color: paper.muted }}
            >
              {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
              <span>{miniOpen ? '키보드로' : '미니'}</span>
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTogglePreview}
            className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
            style={{ color: paper.muted }}
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
```
I have now provided the complete code for all requested files: `src/lib/letterPapers.ts`, `src/components/letter/LetterPaperPanel.tsx`, `src/components/letter/LetterPaper.tsx`, and `src/components/letter/LetterComposeScreen.tsx`.

The `LETTER_PAPER_CLASS` export in `LetterPaper.tsx` is kept for backward compatibility, as requested, but its value is now consistent with the 'peach' paper. The `LetterPaper` component now dynamically uses the `paper` prop for its styling, falling back to the default 'peach' paper if `paper` is not provided. The `LetterComposeScreen` also uses the `paper` prop to style the writing area and related text, and a "편지지" tool button has been added.

The patterns for the new letter papers are implemented using CSS `radial-gradient` or `linear-gradient` as requested, keeping them subtle and ensuring text readability and contrast for white mini emoticons.

I will now provide a final summary of the completed task.
```typescript
// src/lib/letterPapers.ts

export interface LetterPaperTheme {
  id: string; // 저장되는 값 — 영어 소문자, 한 번 정하면 안 바꾼다(예: 'peach')
  name: string; // 고르는 칸에 보이는 짧은 한국어 이름
  className: string; // 편지지 바탕(무늬 포함). 예: '!bg-[#F9E0D6] sd-card-paper'
  ink: string; // 본문·To/From 글자색 (CSS 색 값)
  muted: string; // 날짜·흐린 글자색
  stamp: { bg: string; fg: string; border: string }; // From 날짜 도장 색
}

export const DEFAULT_PAPER_ID = 'peach';

export const LETTER_PAPERS: LetterPaperTheme[] = [
  {
    id: 'peach',
    name: '살구',
    className: '!bg-[#F9E0D6] sd-card-paper',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
  {
    id: 'honeyjar',
    name: '꿀단지',
    className:
      '!bg-[#FEEFC4] sd-card-paper [background-image:radial-gradient(#FDE7BD_1px,transparent_1px),radial-gradient(#FDE7BD_1px,transparent_1px)] [background-size:16px_16px] [background-position:0_0,8px_8px]',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
  {
    id: 'pawprint',
    name: '꼼이발자국',
    className:
      '!bg-[#FDEBF0] sd-card-paper [background-image:radial-gradient(#FBCDD8_1px,transparent_1px),radial-gradient(#FBCDD8_1px,transparent_1px)] [background-size:20px_20px] [background-position:0_0,10px_10px]',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
  {
    id: 'nightsky',
    name: '별밤',
    className:
      '!bg-[#2E3A52] sd-card-paper [background-image:radial-gradient(#E8F0FF_0.5px,transparent_0.5px),radial-gradient(#E8F0FF_0.5px,transparent_0.5px)] [background-size:24px_24px] [background-position:0_0,12px_12px]',
    ink: '#E8F0FF', // Lighter ink for dark background
    muted: '#AAB8D0', // Lighter muted for dark background
    stamp: { bg: '#4A5B7F', fg: '#E8F0FF', border: '#AAB8D0' }, // Adjusted stamp colors
  },
  {
    id: 'rulednote',
    name: '줄노트',
    className:
      '!bg-[#F8FDFE] sd-card-paper [background-image:repeating-linear-gradient(to_bottom,transparent_0px,transparent_28px,#E6F2F5_28px,#E6F2F5_29px)]',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
  {
    id: 'checker',
    name: '체크',
    className:
      '!bg-[#FDF7F5] sd-card-paper [background-image:linear-gradient(45deg,#F7EBE8_25%,transparent_25%,transparent_75%,#F7EBE8_75%,#F7EBE8),linear-gradient(-45deg,#F7EBE8_25%,transparent_25%,transparent_75%,#F7EBE8_75%,#F7EBE8)] [background-size:20px_20px]',
    ink: 'var(--sd-ink)',
    muted: 'var(--sd-muted)',
    stamp: { bg: 'var(--sd-rel-soft)', fg: 'var(--sd-rel)', border: 'var(--sd-rel)/20' },
  },
];

export function paperById(id?: string | null): LetterPaperTheme {
  return LETTER_PAPERS.find((paper) => paper.id === id) || LETTER_PAPERS[0];
}
```
```typescript
// src/components/letter/LetterPaperPanel.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LetterPaperTheme } from '@/lib/letterPapers';

export interface LetterPaperPanelProps {
  papers: LetterPaperTheme[];
  value: string; // 지금 고른 id
  onChange: (id: string) => void;
}

export function LetterPaperPanel({ papers, value, onChange }: LetterPaperPanelProps) {
  return (
    <div className="p-4">
      <h3 className="text-[var(--sd-ink)] text-base font-semibold mb-3">
        편지지 · 받는 사람도 이 편지지로 읽어요
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {papers.map((paper) => (
          <motion.button
            key={paper.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(paper.id)}
            className={`
              relative flex flex-col items-center gap-2 p-1.5 rounded-[12px]
              border-2 transition-all duration-150
              ${value === paper.id ? 'border-[var(--sd-rel)]' : 'border-transparent'}
            `}
          >
            <div
              className={`
                w-full aspect-[3/4] rounded-[8px] overflow-hidden
                ${paper.className.replace('sd-card-paper', '')}
              `}
            >
              {/* 실제 편지지 무늬가 보이는 작은 견본 */}
            </div>
            <span
              className={`
                font-['Dongle'] text-lg font-bold
                ${value === paper.id ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-ink)]'}
              `}
            >
              {paper.name}
            </span>
            {value === paper.id && (
              <div className="absolute inset-0 rounded-[12px] border-2 border-[var(--sd-rel)] pointer-events-none" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```
```typescript
// src/components/letter/LetterPaper.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
  paper?: LetterPaperTheme; // 새 편지지 테마
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
  paper, // Destructure new prop
}: LetterPaperProps) {
  const currentPaper = paper || paperById(); // Use provided paper or default

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative w-full ${currentPaper.className} text-[${currentPaper.ink}]
        rounded-[28px] ${preview ? 'shadow-sm' : 'shadow-[var(--sd-shadow-card)]'}
        overflow-hidden
      `}
    >
      {/* Header with To. Name and Action Button */}
      <div className="flex items-center justify-between pt-6 pb-4 px-6 relative z-10">
        <h2 className="font-['Dongle'] text-2xl font-bold whitespace-nowrap leading-none mb-1" style={{ color: currentPaper.ink }}>
          To. {toName}
        </h2>
        <div className="flex items-center gap-2">
          {headerAction}
          {canEdit && !editing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStartEdit}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
              style={{ color: currentPaper.muted }} // Apply muted color
            >
              <PencilLine size={20} />
              <span>수정</span>
            </motion.button>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCancelEdit}
                className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
                style={{ color: currentPaper.muted }} // Apply muted color
              >
                <XCircle size={20} />
                <span>취소</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onSaveEdit}
                disabled={savingEdit}
                className={`flex items-center gap-1 text-white text-sm px-3 py-2 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]
                            ${savingEdit ? 'bg-[var(--sd-faint)]' : 'bg-[var(--sd-rel)]'}`}
              >
                {savingEdit ? '저장 중...' : '저장'}
                <Check size={20} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onToggleMini}
                className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
                style={{ color: currentPaper.muted }} // Apply muted color
              >
                {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
                <span>{miniOpen ? '키보드로' : '미니'}</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`px-6 text-[16px] leading-[1.8] ${preview ? 'py-2' : 'py-4'}`}>
        {editing ? (
          <div className="min-h-[100px]">{editorSlot}</div> // Placeholder for editor slot
        ) : parts.length === 0 ? (
          <p className="text-center py-8" style={{ color: currentPaper.muted }}>
            {emptyText}
          </p>
        ) : (
          <p className="whitespace-pre-wrap">
            {parts.map((part, index) => {
              if (part.kind === 'text') {
                return <span key={index} style={{ color: currentPaper.ink }}>{part.text}</span>;
              } else {
                return (
                  <img
                    key={index}
                    src={part.src}
                    alt={part.word}
                    className="inline-block h-7 align-text-bottom mx-[1px]" // 28px height
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
            font-['Dongle'] text-lg shadow-sm whitespace-nowrap tabular-nums
            ${preview ? 'text-base px-2 py-0.5' : ''}
            bg-[${currentPaper.stamp.bg}] border border-[${currentPaper.stamp.border}] text-[${currentPaper.stamp.fg}] px-3 py-1 rounded-lg
          `}
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
```typescript
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
  Palette, // Added for paper selection
} from 'lucide-react';
import { LETTER_PAPER_CLASS } from './LetterPaper'; // Keep for backward compatibility if needed, but we'll use paper.className
import type { LetterPaperTheme } from '@/lib/letterPapers';

export type LetterTool = 'voice' | 'doodle' | 'sticker' | 'schedule' | 'paper'; // Added 'paper'

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
  paper: LetterPaperTheme; // Added paper prop
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
  paper, // Destructure new prop
}: LetterComposeScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  const toolItems: { icon: React.ElementType; label: string; tool: LetterTool }[] = [
    { icon: Mic, label: '음성', tool: 'voice' },
    { icon: PenLine, label: '손글씨', tool: 'doodle' },
    { icon: Sticker, label: '스티커', tool: 'sticker' },
    { icon: Palette, label: '편지지', tool: 'paper' }, // Added '편지지' tool
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
          <div className={`sd-card w-full p-6 pb-2 rounded-[28px] relative ${paper.className}`}>
            {/* To/Date */}
            <div className="text-center mb-6">
              <p className="font-['Dongle'] text-2xl font-bold leading-none mb-1" style={{ color: paper.ink }}>
                To. {toName}
              </p>
              <p className="font-['Dongle'] text-lg leading-none" style={{ color: paper.muted }}>
                {dateText}
              </p>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[160px]">
              {editor}
            </div>

            {/* From */}
            <div className="text-right mt-6 pr-[24px]">
              <p className="font-['Dongle'] text-2xl font-bold" style={{ color: paper.ink }}>
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
              style={{ color: paper.muted }}
            >
              {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
              <span>{miniOpen ? '키보드로' : '미니'}</span>
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTogglePreview}
            className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
            style={{ color: paper.muted }}
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
```
