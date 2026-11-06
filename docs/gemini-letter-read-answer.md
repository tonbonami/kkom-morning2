```typescript
// src/components/letter/LetterPaper.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { MiniPart } from '@/lib/miniEmoticons';

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
}: LetterPaperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)]
        rounded-[28px] ${preview ? 'shadow-sm' : 'shadow-[var(--sd-shadow-card)]'}
        overflow-hidden
      `}
    >
      {/* Header with To. Name and Action Button */}
      <div className="flex items-center justify-between pt-6 pb-4 px-6 relative z-10">
        <h2 className="font-dongle text-xl text-[var(--sd-ink)] whitespace-nowrap">
          To. {toName}
        </h2>
        {headerAction && <div className="absolute top-4 right-4">{headerAction}</div>}
      </div>

      {/* Main Content Area */}
      <div className={`px-6 text-[16px] leading-[1.8] ${preview ? 'py-2' : 'py-4'}`}>
        {editing ? (
          <div className="min-h-[100px]">{editorSlot}</div> // Placeholder for editor slot
        ) : parts.length === 0 ? (
          <p className="font-ibm-plex-sans-kr text-[var(--sd-muted)] text-center py-8">
            {emptyText}
          </p>
        ) : (
          <p className="font-ibm-plex-sans-kr whitespace-pre-wrap">
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
            font-dongle text-[18px] text-[var(--sd-rel)] bg-[var(--sd-rel-soft)]
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
```typescript
// src/components/letter/LetterReadSheet.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Heart, Send, Trash2 } from 'lucide-react';

export interface LetterCommentView {
  id: string;
  by: string;
  text: string;
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
        className="w-full max-w-md bg-[var(--sd-app)] h-full flex flex-col rounded-t-[28px] overflow-hidden"
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
            <h2 className="font-ibm-plex-sans-kr text-[var(--sd-ink)] text-lg font-semibold">
              {fromName}이 보낸 편지
            </h2>
            <p className="font-ibm-plex-sans-kr text-[var(--sd-muted)] text-sm">
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
        <div className="bg-[var(--sd-card-solid)] pt-4 pb-2 border-t border-[var(--sd-line)]">
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
            <span className="font-ibm-plex-sans-kr text-[var(--sd-ink)] text-base tabular-nums">
              {hearts}
            </span>
          </div>

          {/* Comments List */}
          <div className="px-4 pb-4 max-h-[200px] overflow-y-auto space-y-3">
            {comments.length === 0 ? (
              <p className="font-ibm-plex-sans-kr text-[var(--sd-muted)] text-sm text-center">
                아직 댓글이 없어요.
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div className="flex-grow">
                    <span className="font-ibm-plex-sans-kr text-[var(--sd-cardlabel)] text-sm font-semibold mr-1">
                      {comment.by}
                    </span>
                    <span className="font-ibm-plex-sans-kr text-[var(--sd-ink)] text-sm whitespace-pre-wrap">
                      {comment.text}
                    </span>
                    <p className="font-ibm-plex-sans-kr text-[var(--sd-faint)] text-xs mt-1">
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
              className="w-full p-2 text-base font-ibm-plex-sans-kr rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-ink)] placeholder-[var(--sd-muted)] focus:outline-none focus:border-[var(--m-letter-ac)]"
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
      </motion.div>
    </motion.div>
  );
}
```
두 가지 React 컴포넌트인 `LetterPaper.tsx`와 `LetterReadSheet.tsx`를 구현했습니다. 코드 블록만 작성했습니다.
