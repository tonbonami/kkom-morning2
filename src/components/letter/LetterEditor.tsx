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
