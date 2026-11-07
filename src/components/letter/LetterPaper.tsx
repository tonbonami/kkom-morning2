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
