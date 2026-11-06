```tsx
// src/components/letter/LetterPaper.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { MiniPart } from '@/lib/miniEmoticons';
import { PencilLine, Check, XCircle, Smile, Keyboard } from 'lucide-react'; // Added for edit buttons

export const LETTER_PAPER_CLASS = 'bg-[#FCFAF7] sd-card-paper'; // Custom class for warm ivory paper

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
}: LetterPaperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative w-full ${LETTER_PAPER_CLASS} text-[var(--sd-ink)]
        rounded-[28px] ${preview ? 'shadow-sm' : 'shadow-[var(--sd-shadow-card)]'}
        overflow-hidden
      `}
    >
      {/* Header with To. Name and Action Button */}
      <div className="flex items-center justify-between pt-6 pb-4 px-6 relative z-10">
        <h2 className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)] whitespace-nowrap leading-none mb-1">
          To. {toName}
        </h2>
        <div className="flex items-center gap-2">
          {headerAction}
          {canEdit && !editing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStartEdit}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
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
          <p className="text-[var(--sd-muted)] text-center py-8">
            {emptyText}
          </p>
        ) : (
          <p className="whitespace-pre-wrap">
            {parts.map((part, index) => {
              if (part.kind === 'text') {
                return <span key={index}>{part.text}</span>;
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
            font-['Dongle'] text-lg text-[var(--sd-rel)] bg-[var(--sd-rel-soft)]
            px-3 py-1 rounded-lg shadow-sm whitespace-nowrap tabular-nums
            ${preview ? 'text-base px-2 py-0.5' : ''}
          `}
        >
          From. {fromName} {dateText}
        </div>
      </div>

      {/* Enclosures Section */}
      {enclosures && (
        <div className="pt-4 border-t border-[var(--sd-line)]">
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
// src/components/letter/LetterEditor.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import type { MiniPart } from '@/lib/miniEmoticons';

export interface LetterEditorProps {
  value: string;
  onChange: (v: string) => void;
  parts: MiniPart[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  placeholder: string;
  minRows?: number;
  autoFocus?: boolean;
  onFocus?: () => void;
}

export function LetterEditor({
  value,
  onChange,
  parts,
  textareaRef,
  placeholder,
  minRows = 7,
  autoFocus,
  onFocus,
}: LetterEditorProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync scroll positions
  useEffect(() => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    if (textarea && overlay) {
      const handleScroll = () => {
        overlay.scrollTop = textarea.scrollTop;
      };
      textarea.addEventListener('scroll', handleScroll);
      return () => {
        textarea.removeEventListener('scroll', handleScroll);
      };
    }
    return undefined;
  }, [textareaRef]);

  return (
    <div
      className="relative grid grid-cols-1 grid-rows-1 font-['IBM_Plex_Sans_KR'] text-[var(--sd-ink)] text-[16px] leading-[1.8]"
      style={{ minHeight: `${minRows * 1.8 * 16}px` }}
    >
      {/* Overlay for styling mini emoticons */}
      <div
        ref={overlayRef}
        className="[grid-area:1/1] whitespace-pre-wrap break-words pointer-events-none overflow-hidden text-transparent
                   min-h-full py-0" // Removed px-[24px], added py-0
        aria-hidden="true"
        style={{ minHeight: '100%' }}
      >
        {parts.map((part, i) => (
          part.kind === 'text' ? (
            <React.Fragment key={i}>
              {part.text}
            </React.Fragment>
          ) : (
            <span
              key={i}
              className="bg-[var(--sd-rel-soft)] rounded-[6px] [box-decoration-break:clone] whitespace-pre-wrap" // Added box-decoration-break: clone
              style={{ lineHeight: '1.8', verticalAlign: 'middle' }}
            >
              {`(${part.word})`} {/* Changed to include parentheses */}
            </span>
          )
        ))}
        {/* Add an extra line to ensure there's always space to type at the end */}
        {'\n'}
      </div>

      {/* Actual textarea for input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="[grid-area:1/1] w-full h-full bg-transparent text-[var(--sd-ink)] resize-none overflow-hidden
                   font-['IBM_Plex_Sans_KR'] text-[16px] leading-[1.8] py-0
                   placeholder:text-[var(--sd-faint)] focus:outline-none scroll-smooth" // Removed px-[24px]
        rows={minRows}
        style={{ minHeight: '100%' }}
      />
    </div>
  );
}
```
```tsx
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
} from 'lucide-react';
import { LETTER_PAPER_CLASS } from './LetterPaper'; // Import the constant

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
    <div className="sd-app flex flex-col min-h-app max-w-md mx-auto pt-[env(safe-area-inset-top)]"> {/* Changed h-screen to min-h-app */}
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} className="text-[var(--sd-ink)]" />
        </motion.button>
        <h1 className="text-xl font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">편지 쓰기</h1>
        <div className="w-[44px]"></div> {/* Spacer */}
      </div>

      {/* Letter Paper Section */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center">
        {previewOpen ? (
          <div className="w-full">
            {preview}
          </div>
        ) : (
          <div className={`sd-card w-full p-6 pb-2 rounded-[28px] relative ${LETTER_PAPER_CLASS}`}> {/* Used LETTER_PAPER_CLASS */}
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
            <div className="flex-1 min-h-[160px]"> {/* Adjusted minimum height for editor */}
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
        {!previewOpen && (
          <div className="flex justify-center gap-4 mt-4 mb-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleMini}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
            >
              {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
              <span>{miniOpen ? '키보드로' : '미니'}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onTogglePreview}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
            >
              {previewOpen ? <EyeOff size={20} /> : <Eye size={20} />}
              <span>편지로 보기</span>
            </motion.button>
          </div>
        )}
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
      <div className="relative z-40 bg-transparent pb-[env(safe-area-inset-bottom)]"> {/* Adjusted padding */}
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

      {/* Mini Emoticon Sheet (rendered outside normal flow, z-index managed) */}
      {miniSheet}
    </div>
  );
}
```
```tsx
// src/components/letter/LetterReadSheet.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Heart, Send, Trash2 } from 'lucide-react';
import type { MiniPart } from '@/lib/miniEmoticons'; // Import MiniPart

export interface LetterCommentView {
  id: string;
  by: string;
  text: string;
  parts: MiniPart[]; // Added for mini emoticons
  timeText: string;
  mine: boolean;
}

export interface LetterReadSheetProps {
  fromName: string;
  fullDateText: string;
  paper: React.ReactNode;
  hearts: number;
  onHeart: () => void;
  comments: LetterCommentView[];
  onDeleteComment: (id: string) => void;
  commentText: string;
  onCommentTextChange: (v: string) => void;
  onSubmitComment: () => void;
  commentSending: boolean;
  onClose: () => void;
  miniSheet?: React.ReactNode; // Added miniSheet prop
}

export function LetterReadSheet({
  fromName,
  fullDateText,
  paper,
  hearts,
  onHeart,
  comments,
  onDeleteComment,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  commentSending,
  onClose,
  miniSheet, // Destructured miniSheet
}: LetterReadSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const sheetVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: '0%', opacity: 1 },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex justify-center pb-[env(safe-area-inset-bottom)]"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={sheetVariants}
      transition={{ type: 'tween', duration: prefersReducedMotion ? 0 : 0.25 }}
      onClick={onClose} // Close on overlay click
    >
      <motion.div
        className="w-full max-w-md sd-app h-full flex flex-col rounded-t-[28px] overflow-hidden" // Changed bg-[var(--sd-app)] to sd-app
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the sheet
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[var(--sd-card-solid)] shadow-sm">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 -ml-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <X size={24} className="text-[var(--sd-ink)]" />
          </motion.button>
          <div className="flex flex-col items-center flex-grow text-center">
            <h2 className="text-[var(--sd-ink)] text-lg font-semibold"> {/* Removed font-ibm-plex-sans-kr */}
              {fromName}의 편지 {/* Changed title */}
            </h2>
            <p className="text-[var(--sd-muted)] text-sm"> {/* Removed font-ibm-plex-sans-kr */}
              {fullDateText}
            </p>
          </div>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {/* Scrollable Paper and Enclosures */}
        <div className="flex-grow overflow-y-auto p-4 bg-transparent">
          {paper}
        </div>

        {/* Heart and Comments Section */}
        <div className="bg-[var(--sd-card-solid)] pt-4 pb-2 border-t border-[var(--sd-line)] relative z-10"> {/* Added relative z-10 for stacking context */}
          {/* Heart Button */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={onHeart}
              className="p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center bg-[var(--sd-rel-soft)]"
              aria-label="하트 보내기"
            >
              <Heart size={24} fill="var(--sd-rel)" stroke="var(--sd-rel)" />
            </motion.button>
            <span className="text-[var(--sd-ink)] text-base tabular-nums"> {/* Removed font-ibm-plex-sans-kr */}
              {hearts}
            </span>
          </div>

          {/* Comments List */}
          <div className="px-4 pb-4 max-h-[200px] overflow-y-auto space-y-3">
            {comments.length === 0 ? (
              <p className="text-[var(--sd-muted)] text-sm text-center"> {/* Removed font-ibm-plex-sans-kr */}
                아직 댓글이 없어요.
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div className="flex-grow">
                    <span className="text-[var(--sd-cardlabel)] text-sm font-semibold mr-1"> {/* Removed font-ibm-plex-sans-kr */}
                      {comment.by}
                    </span>
                    <span className="text-[var(--sd-ink)] text-sm whitespace-pre-wrap"> {/* Removed font-ibm-plex-sans-kr */}
                      {comment.parts.map((part, index) => { // Updated to use parts
                        if (part.kind === 'text') {
                          return <span key={index}>{part.text}</span>;
                        } else {
                          return (
                            <img
                              key={index}
                              src={part.src}
                              alt={part.word}
                              className="inline-block h-5 align-text-bottom mx-[0.5px]" // 20px-22px height, choose 20px
                            />
                          );
                        }
                      })}
                    </span>
                    <p className="text-[var(--sd-faint)] text-xs mt-1"> {/* Removed font-ibm-plex-sans-kr */}
                      {comment.timeText}
                    </p>
                  </div>
                  {comment.mine && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteComment(comment.id)}
                      className="p-1 -mr-1 rounded-full min-w-[32px] min-h-[32px] flex items-center justify-center"
                      aria-label="댓글 삭제"
                    >
                      <Trash2 size={16} className="text-[var(--sd-faint)]" />
                    </motion.button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="px-4 pt-3 pb-4 border-t border-[var(--sd-line)] flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              placeholder="댓글을 남겨 주세요!"
              className="w-full p-2 text-base rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-ink)] placeholder-[var(--sd-muted)] focus:outline-none focus:border-[var(--m-letter-ac)]" // Removed font-ibm-plex-sans-kr
              disabled={commentSending}
              aria-label="댓글 입력"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSubmitComment}
              disabled={!commentText.trim() || commentSending}
              className={`
                p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center
                ${commentText.trim() && !commentSending ? 'bg-[var(--m-letter-ac)] text-white' : 'bg-[var(--sd-faint)] text-[var(--sd-ink)] cursor-not-allowed'}
              `}
              aria-label="댓글 보내기"
            >
              <Send size={24} />
            </motion.button>
          </div>
        </div>
        {miniSheet} {/* Render miniSheet at the bottom */}
      </motion.div>
    </motion.div>
  );
}
```
```tsx
// src/components/letter/LetterEnclosures.tsx
'use client';

import React from 'react';
import { Image } from 'lucide-react'; // Example icon for placeholder

export interface LetterEnclosuresProps {
  emoticons: { id: string; label: string; imageUrl: string }[];   // 큰 이모티콘 0~3개
  animated: { label: string; posterUrl: string; videoUrl: string } | null;   // 움직이는 포차코(영상)
  voice: React.ReactNode | null;    // 내가 기존 음성 재생기를 넣는다
  doodle: React.ReactNode | null;   // 내가 기존 손글씨 재생 판을 넣는다
}

export function LetterEnclosures({
  emoticons,
  animated,
  voice,
  doodle,
}: LetterEnclosuresProps) {
  const hasContent = emoticons.length > 0 || animated || voice || doodle;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {emoticons.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {emoticons.map((emo) => (
            <div key={emo.id} className="flex flex-col items-center">
              <img
                src={emo.imageUrl}
                alt={emo.label}
                className="w-16 h-16 rounded-lg object-contain"
              />
              <span className="text-[var(--sd-cardlabel)] text-xs mt-1 font-['IBM_Plex_Sans_KR']">
                {emo.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {animated && (
        <div className="flex flex-col items-center">
          <video
            src={animated.videoUrl}
            poster={animated.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-32 h-32 rounded-lg object-cover"
          />
          <span className="text-[var(--sd-cardlabel)] text-sm mt-2 font-['IBM_Plex_Sans_KR']">
            {animated.label}
          </span>
        </div>
      )}

      {voice && (
        <div className="w-full flex justify-center">
          {voice}
        </div>
      )}

      {doodle && (
        <div className="w-full flex justify-center">
          {doodle}
        </div>
      )}
    </div>
  );
}
```
```tsx
// src/components/letter/LetterVoicePanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic, StopCircle, PlayCircle, PauseCircle, Trash2 } from 'lucide-react';

export interface LetterVoicePanelProps {
  state: 'idle' | 'recording' | 'recorded';
  secLeft: number;
  duration: number;
  playing: boolean;
  onStart: () => void;
  onStop: () => void;
  onTogglePlay: () => void;
  onDelete: () => void;
}

export function LetterVoicePanel({
  state,
  secLeft,
  duration,
  playing,
  onStart,
  onStop,
  onTogglePlay,
  onDelete,
}: LetterVoicePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `00:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      {state === 'idle' && (
        <>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onStart}
            className="flex items-center gap-2 text-lg font-semibold bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] px-6 py-3 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]"
          >
            <Mic size={24} />
            <span>녹음 시작</span>
          </motion.button>
          <p className="mt-2 text-[var(--sd-muted)] text-sm">30초까지</p>
        </>
      )}

      {state === 'recording' && (
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ scale: prefersReducedMotion ? 1 : [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex items-center justify-center bg-red-500/20 rounded-full w-24 h-24"
          >
            <Mic size={40} className="text-red-600" />
            <span className="absolute text-red-600 text-sm font-bold -bottom-4">
              {secLeft > 0 ? formatTime(secLeft) : '00:00'}
            </span>
          </motion.div>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onStop}
            className="mt-6 flex items-center gap-2 text-lg font-semibold bg-[var(--sd-rel)] text-white px-6 py-3 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]"
          >
            <StopCircle size={24} />
            <span>녹음 멈춤</span>
          </motion.button>
        </div>
      )}

      {state === 'recorded' && (
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onTogglePlay}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] min-h-[44px] min-w-[44px]"
          >
            {playing ? <PauseCircle size={28} /> : <PlayCircle size={28} />}
          </motion.button>
          <span className="text-xl font-['IBM_Plex_Sans_KR'] tabular-nums">
            {formatTime(duration)}
          </span>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onDelete}
            className="flex items-center justify-center w-12 h-12 rounded-full text-[var(--sd-muted)] hover:bg-[var(--sd-surface-2)] min-h-[44px] min-w-[44px]"
          >
            <Trash2 size={24} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
```
```tsx
// src/components/letter/LetterSchedulePanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';

export interface LetterSchedulePanelProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  toName: string;
}

export function LetterSchedulePanel({
  enabled,
  onEnabledChange,
  value,
  onChange,
  toName,
}: LetterSchedulePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">예약 편지</span>
        {/* Toggle Switch */}
        <motion.button
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out
                      ${enabled ? 'bg-[var(--sd-rel)]' : 'bg-[var(--sd-muted)]'}`}
          role="switch"
          aria-checked={enabled}
        >
          <motion.span
            animate={{ x: enabled ? '100%' : '0%' }}
            transition={{ type: 'spring', stiffness: 700, damping: 50, duration: prefersReducedMotion ? 0 : 0.2 }}
            className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-md"
          />
        </motion.button>
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="overflow-hidden"
        >
          <div className="mb-4">
            <label htmlFor="schedule-datetime" className="sr-only">예약 날짜 및 시간</label>
            <input
              id="schedule-datetime"
              type="datetime-local"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-3 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-lg
                         focus:outline-none focus:ring-2 focus:ring-[var(--sd-rel)] appearance-none"
              style={{ minHeight: '44px' }} // Ensure sufficient touch target
            />
          </div>
          <p className="flex items-center gap-2 text-[var(--sd-muted)] text-sm">
            <Lock size={16} />
            <span>이 시각에 {toName}에게 도착해요. 그 전엔 잠겨 있어요.</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
```
```tsx
// src/components/letter/LetterStickerPanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export interface LetterStickerPanelProps {
  emoticons: { id: string; label: string; imageUrl: string }[];
  max: number;
  onAddEmoticon: () => void;
  onRemoveEmoticon: (index: number) => void;
  animated: { label: string; posterUrl: string; videoUrl: string } | null;
  onPickAnimated: () => void;
  onRemoveAnimated: () => void;
}

export function LetterStickerPanel({
  emoticons,
  max,
  onAddEmoticon,
  onRemoveEmoticon,
  animated,
  onPickAnimated,
  onRemoveAnimated,
}: LetterStickerPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      <h3 className="text-lg font-semibold mb-3">큰 스티커 · 편지 아래에 붙어요</h3>

      {/* Static Emoticons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {emoticons.map((emo, index) => (
          <div key={emo.id} className="relative">
            <img src={emo.imageUrl} alt={emo.label} className="w-16 h-16 rounded-lg object-cover" />
            <motion.button
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
              onClick={() => onRemoveEmoticon(index)}
              className="absolute -top-2 -right-2 bg-[var(--sd-muted)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-w-[24px] min-h-[24px]"
            >
              <X size={16} />
            </motion.button>
          </div>
        ))}
        {emoticons.length < max && (
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onAddEmoticon}
            className="w-16 h-16 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-muted)] flex flex-col items-center justify-center min-w-[44px] min-h-[44px]"
          >
            <Plus size={24} />
            <span className="text-xs mt-1">이모티콘</span>
          </motion.button>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-3">움직이는 포차코</h3>

      {/* Animated Pochacco */}
      <div className="flex gap-2">
        {animated ? (
          <div className="relative">
            <video
              src={animated.videoUrl}
              poster={animated.posterUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-24 h-24 rounded-lg object-cover"
            />
            <motion.button
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
              onClick={onRemoveAnimated}
              className="absolute -top-2 -right-2 bg-[var(--sd-muted)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-w-[24px] min-h-[24px]"
            >
              <X size={16} />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onPickAnimated}
            className="w-24 h-24 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-muted)] flex flex-col items-center justify-center min-w-[44px] min-h-[44px]"
          >
            <Plus size={24} />
            <span className="text-xs mt-1">움직이는 포차코</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
```
**Explanation:**

I have provided the complete code for `LetterPaper.tsx`, `LetterEditor.tsx`, `MiniEmoticonSheet.tsx`, `LetterComposeScreen.tsx`, `LetterReadSheet.tsx`, and the new `LetterEnclosures.tsx`.

The key changes include:
- `LetterPaper.tsx`: Now includes editing functionality with corresponding buttons, and uses a consistent `LETTER_PAPER_CLASS` for the background.
- `LetterEditor.tsx`: Fixed the mini emoticon rendering in the overlay for correct alignment and visibility, and adjusted padding.
- `MiniEmoticonSheet.tsx`: Increased the font size for emoticon labels.
- `LetterComposeScreen.tsx`: Updated to use `min-h-app` for screen height, rearranged the bottom toolbar for better stacking, and correctly renders the `preview` component when active.
- `LetterReadSheet.tsx`: Corrected the title's grammar, updated font usage, used `sd-app` class for the background, added `miniSheet` prop, and improved comment rendering to display mini emoticons as images.
- `LetterEnclosures.tsx`: This new component is designed to display attached items (emoticons, animated video, voice, doodle) in a compact, non-intrusive way.

These changes address all the feedback points provided.
