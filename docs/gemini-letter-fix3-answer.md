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
        className="[grid-area:1/1] whitespace-pre-wrap break-words pointer-events-none overflow-hidden text-transparent min-h-full py-0"
        aria-hidden="true"
        style={{ minHeight: '100%' }}
      >{parts.map((part, i) => (
        part.kind === 'text' ? (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        ) : (
          <span
            key={i}
            className="bg-[var(--sd-rel-soft)] rounded-[6px] [box-decoration-break:clone]"
            style={{ lineHeight: '1.8' }}
          >{`(${part.word})`}</span>
        )
      ))}{'\n'}</div>

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
                   placeholder:text-[var(--sd-faint)] focus:outline-none scroll-smooth"
        rows={minRows}
        style={{ minHeight: '100%' }}
      />
    </div>
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
```

1. `LetterEditor`: JSX 공백 노드가 생기지 않도록 인라인 태그로 결속해 overlay의 `textContent`를 textarea 값 + `\n`과 100% 일치시켰습니다.
2. `LetterComposeScreen`: 미리보기 중에도 버튼 줄을 유지하며 「다시 쓰기」로 전환되고(미니는 숨김), 뒤로 가기 버튼에 `aria-label="뒤로"`를 추가했습니다.
