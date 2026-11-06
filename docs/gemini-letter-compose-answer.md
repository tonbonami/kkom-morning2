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

  // Handle textarea height based on content
  // Note: We avoid direct JS height manipulation to prevent iOS cursor issues.
  // The overlay div will determine the height.

  return (
    <div
      className="relative grid grid-cols-1 grid-rows-1 font-['IBM_Plex_Sans_KR'] text-[var(--sd-ink)] text-[16px] leading-[1.8] px-[24px]"
      style={{ minHeight: `${minRows * 1.8 * 16}px` }} // Approximate minimum height
    >
      {/* Overlay for styling mini emoticons */}
      <div
        ref={overlayRef}
        className="[grid-area:1/1] whitespace-pre-wrap break-words opacity-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
        style={{ color: 'transparent', minHeight: '100%' }} // Ensure it stretches and is transparent
      >
        {parts.map((part, i) => (
          part.kind === 'text' ? (
            <React.Fragment key={i}>
              {part.text}
            </React.Fragment>
          ) : (
            <span
              key={i}
              className="inline-block px-1 mx-[0.5px] bg-[var(--sd-rel-soft)] rounded-[6px]"
              style={{ lineHeight: '1.8', verticalAlign: 'middle' }} // Adjust to align with text baseline
            >
              {part.word}
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
                   font-['IBM_Plex_Sans_KR'] text-[16px] leading-[1.8] px-[24px] py-0
                   placeholder:text-[var(--sd-faint)] focus:outline-none scroll-smooth"
        rows={minRows} // Set initial rows, but height is managed by content via overlay
        style={{ minHeight: '100%' }}
      />
    </div>
  );
}
```
The available tools do not allow me to directly create or modify files in the file system. My apologies for the repeated attempts to use unavailable tools.

Therefore, I cannot "make" the React components by writing them to files. As per your instruction "답에 코드만 써 줘" (give only the code in the answer), I will provide the complete code for each React component directly in my response.

I will now provide the code for `LetterEditor.tsx`.
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
      className="relative grid grid-cols-1 grid-rows-1 font-['IBM_Plex_Sans_KR'] text-[var(--sd-ink)] text-[16px] leading-[1.8] px-[24px]"
      style={{ minHeight: `${minRows * 1.8 * 16}px` }}
    >
      {/* Overlay for styling mini emoticons */}
      <div
        ref={overlayRef}
        className="[grid-area:1/1] whitespace-pre-wrap break-words opacity-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
        style={{ color: 'transparent', minHeight: '100%' }}
      >
        {parts.map((part, i) => (
          part.kind === 'text' ? (
            <React.Fragment key={i}>
              {part.text}
            </React.Fragment>
          ) : (
            <span
              key={i}
              className="inline-block px-1 mx-[0.5px] bg-[var(--sd-rel-soft)] rounded-[6px]"
              style={{ lineHeight: '1.8', verticalAlign: 'middle' }}
            >
              {part.word}
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
                   font-['IBM_Plex_Sans_KR'] text-[16px] leading-[1.8] px-[24px] py-0
                   placeholder:text-[var(--sd-faint)] focus:outline-none scroll-smooth"
        rows={minRows}
        style={{ minHeight: '100%' }}
      />
    </div>
  );
}
```

Next, I will provide the code for `MiniEmoticonSheet.tsx`.
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
                           text-[var(--sd-cardlabel)] text-xs font-['Dongle'] font-bold hover:bg-[var(--sd-surface-2)] min-h-[44px] min-w-[44px]"
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

Next, I will provide the code for `LetterComposeScreen.tsx`.
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

  const sendButtonY = miniOpen ? 'calc(-100% - env(safe-area-inset-bottom))' : '0%'; // Move up when miniSheet is open

  return (
    <div className="sd-app flex flex-col h-screen max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 pt-[env(safe-area-inset-top)]">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} className="text-[var(--sd-ink)]" />
        </motion.button>
        <h1 className="text-xl font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">편지 쓰기</h1>
        <div className="w-[44px]"></div> {/* Spacer */}
      </div>

      {/* Letter Paper Section */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        <div className="sd-card w-full p-6 pb-2 rounded-[28px] relative bg-white/70">
          {/* To/Date */}
          <div className="text-center mb-6">
            <p className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)] leading-none mb-1">
              To. {toName}
            </p>
            <p className="font-['Dongle'] text-lg text-[var(--sd-muted)] leading-none">
              {dateText}
            </p>
          </div>

          {/* Editor / Preview */}
          <div className="flex-1 min-h-[160px]"> {/* Adjusted minimum height for editor */}
            {previewOpen ? preview : editor}
          </div>

          {/* From */}
          <div className="text-right mt-6 pr-[24px]">
            <p className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)]">
              From. {fromName}
            </p>
          </div>
        </div>

        {/* Mini Emoticon / Preview Toggle */}
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
      <motion.div
        animate={{ y: sendButtonY }}
        transition={{ type: 'spring', damping: 30, stiffness: 400, duration: prefersReducedMotion ? 0 : 0.3 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-transparent z-40
                   pb-[calc(16px+env(safe-area-inset-bottom))]"
      >
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
      </motion.div>

      {/* Mini Emoticon Sheet (rendered outside normal flow, z-index managed) */}
      {miniSheet}
    </div>
  );
}
```

Next, I will provide the code for `LetterVoicePanel.tsx`.
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

Next, I will provide the code for `LetterSchedulePanel.tsx`.
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

Finally, I will provide the code for `LetterStickerPanel.tsx`.
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

편지 쓰기 묶음의 모든 React 컴포넌트 완성 코드를 제공했습니다.
- `LetterEditor.tsx`
- `MiniEmoticonSheet.tsx`
- `LetterComposeScreen.tsx`
- `LetterVoicePanel.tsx`
- `LetterSchedulePanel.tsx`
- `LetterStickerPanel.tsx`

각 코드는 요청하신 사양(Next.js, React, TypeScript, Tailwind CSS, framer-motion, lucide-react, 디자인 시스템 변수, 한국어 문구, 아이폰 안전영역 고려 등)에 맞춰 작성되었습니다. 파일 시스템에 직접 작성할 수 없어 출력으로만 제공함을 다시 한번 알려드립니다.
