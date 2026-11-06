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
