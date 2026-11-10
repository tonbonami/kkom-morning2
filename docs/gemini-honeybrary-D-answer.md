```tsx
// src/components/honeybrary/BookVisibilityChoice.tsx
'use client';

import React from 'react';
import { Users, Lock } from 'lucide-react';
import type { Visibility } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface BookVisibilityChoiceProps {
  value: Visibility;
  onChange: (v: Visibility) => void;
  partnerName: string;
  disabled?: boolean;
}

export function BookVisibilityChoice({
  value,
  onChange,
  partnerName,
  disabled = false,
}: BookVisibilityChoiceProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12.5px] font-bold" style={{ color: HONEY.muted }}>
        누구 화면에 둘까요?
      </span>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('shared')}
          aria-pressed={value === 'shared'}
          className="min-h-[58px] p-2.5 rounded-xl text-left flex flex-col justify-center transition-colors disabled:opacity-50"
          style={
            value === 'shared'
              ? {
                  background: HONEY.accentSoft,
                  color: HONEY.accentSoftInk,
                  border: `1.5px solid ${HONEY.accent}`,
                }
              : {
                  background: HONEY.card,
                  color: HONEY.muted,
                  border: `1px solid ${HONEY.line}`,
                }
          }
        >
          <span className="flex items-center gap-1.5 text-[14px] font-bold">
            <Users size={16} />
            같이 보기
          </span>
          <span className="text-[11.5px] mt-0.5 opacity-80 truncate">
            {partnerName}도 볼 수 있어요
          </span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('private')}
          aria-pressed={value === 'private'}
          className="min-h-[58px] p-2.5 rounded-xl text-left flex flex-col justify-center transition-colors disabled:opacity-50"
          style={
            value === 'private'
              ? {
                  background: HONEY.accentSoft,
                  color: HONEY.accentSoftInk,
                  border: `1.5px solid ${HONEY.accent}`,
                }
              : {
                  background: HONEY.card,
                  color: HONEY.muted,
                  border: `1px solid ${HONEY.line}`,
                }
          }
        >
          <span className="flex items-center gap-1.5 text-[14px] font-bold">
            <Lock size={15} />
            혼자 보기
          </span>
          <span className="text-[11.5px] mt-0.5 opacity-80 truncate">
            내 화면에만 보여요
          </span>
        </button>
      </div>

      {value === 'private' && (
        <p className="text-[11.5px] leading-relaxed pl-1" style={{ color: HONEY.faint }}>
          혼자 천천히 읽고 싶은 책이라면 내 화면에만 둘 수 있어요. 비밀번호로 잠그는 보관함은 아니에요.
        </p>
      )}
    </div>
  );
}
```

```tsx
// src/components/honeybrary/BookVisibilityBadge.tsx
'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { HONEY } from '@/lib/honeybraryTheme';

export interface BookVisibilityBadgeProps {
  compact?: boolean;
}

export function BookVisibilityBadge({ compact = false }: BookVisibilityBadgeProps) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium shrink-0 leading-none"
        style={{ background: 'var(--sd-surface-2)', color: HONEY.faint }}
      >
        <Lock size={11} />
        <span>혼자</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium shrink-0 leading-none"
      style={{ background: 'var(--sd-surface-2)', color: HONEY.muted }}
    >
      <Lock size={13} />
      <span>혼자 보는 책</span>
    </span>
  );
}
```

```tsx
// src/components/honeybrary/VisibilityChangeSheet.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Visibility } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneySheet } from './HoneySheet';

export interface VisibilityChangeSheetProps {
  open: boolean;
  current: Visibility;
  partnerName: string;
  checking?: boolean;
  blockedReason?: string | null;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function VisibilityChangeSheet({
  open,
  current,
  partnerName,
  checking = false,
  blockedReason,
  busy = false,
  onConfirm,
  onClose,
}: VisibilityChangeSheetProps) {
  const shouldReduceMotion = useReducedMotion();

  const title = blockedReason
    ? '바꿀 수 없어요'
    : current === 'shared'
      ? '혼자 보는 책으로 바꿀까요?'
      : '같이 보는 책으로 바꿀까요?';

  return (
    <HoneySheet open={open} title={title} onClose={onClose}>
      <div className="flex flex-col gap-5 pt-1">
        {checking ? (
          <p className="text-[14.5px] py-4 text-center" style={{ color: HONEY.muted }}>
            확인하는 중…
          </p>
        ) : blockedReason ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] leading-relaxed" style={{ color: HONEY.ink }}>
              {blockedReason}
            </p>
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="w-full h-[48px] rounded-[16px] text-[14.5px] font-bold flex items-center justify-center transition-opacity"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            >
              알겠어요
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] leading-relaxed" style={{ color: HONEY.muted }}>
              {current === 'shared'
                ? `이제 ${partnerName} 화면에서는 이 책이 보이지 않아요.`
                : `그동안 남긴 진행과 기록·감상이 ${partnerName}에게 함께 보여요.`}
            </p>

            <div className="flex items-center gap-2.5 mt-2">
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={busy}
                className="flex-1 h-[48px] rounded-[16px] text-[14.5px] font-bold flex items-center justify-center min-h-[44px] disabled:opacity-50"
                style={{
                  background: HONEY.card,
                  color: HONEY.muted,
                  border: `1px solid ${HONEY.line}`,
                }}
              >
                그만두기
              </motion.button>
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="flex-1 h-[48px] rounded-[16px] text-[14.5px] font-bold text-white flex items-center justify-center min-h-[44px] disabled:opacity-50"
                style={{ background: HONEY.accent, color: HONEY.accentInk }}
              >
                {busy ? '바꾸는 중…' : '바꾸기'}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </HoneySheet>
  );
}
```

```tsx
// src/components/honeybrary/BookPlacementSheet.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ImagePlus } from 'lucide-react';
import { partnerOf, type Person, type Visibility } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneySheet } from './HoneySheet';
import { BookVisibilityChoice } from './BookVisibilityChoice';

export interface BookPlacementSheetProps {
  open: boolean;
  me: Person;
  busy: boolean;
  error?: string | null;
  onSubmit: (v: {
    title: string;
    readerMode: 'me' | 'partner' | 'both';
    current?: number;
    total?: number;
    cover: File | null;
    visibility: Visibility;
  }) => void;
  onClose: () => void;
}

export function BookPlacementSheet({
  open,
  me,
  busy,
  error,
  onSubmit,
  onClose,
}: BookPlacementSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('shared');
  const [readerMode, setReaderMode] = useState<'me' | 'partner' | 'both'>('me');
  const [current, setCurrent] = useState('');
  const [total, setTotal] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setVisibility('shared');
    setReaderMode('me');
    setCurrent('');
    setTotal('');
    setCover(null);
    setPreview(null);
  }, [open]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const num = (s: string) => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const c = num(current);
  const t = num(total);
  const tooFar = !!(c && t && c > t);

  const handleSave = () => {
    if (!title.trim() || busy || tooFar) return;
    onSubmit({
      title: title.trim(),
      readerMode: visibility === 'private' ? 'me' : readerMode,
      current: c,
      total: t,
      cover,
      visibility,
    });
  };

  return (
    <HoneySheet open={open} title="책 놓기" onClose={onClose}>
      <div className="flex flex-col gap-5 pt-1">
        <div className="flex gap-4 items-end">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="표지 사진 고르기"
            className="shrink-0 rounded-[10px] overflow-hidden flex items-center justify-center transition-opacity active:opacity-85"
            style={{
              width: 84,
              height: 126,
              border: preview ? 'none' : `1.5px dashed ${HONEY.line}`,
              background: preview ? 'transparent' : HONEY.card,
            }}
          >
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span
                className="flex flex-col items-center text-center gap-1 text-[11.5px] px-2 leading-tight"
                style={{ color: HONEY.faint }}
              >
                <ImagePlus size={20} />
                표지 사진<br />(안 넣어도 돼요)
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setCover(f);
              setPreview(f ? URL.createObjectURL(f) : null);
              e.target.value = '';
            }}
          />
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-bold" style={{ color: HONEY.muted }}>
              책 제목
            </span>
            <input
              id="book-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="예) 소년이 온다"
              autoComplete="off"
              className="w-full rounded-xl px-3.5 py-3 text-[16px] outline-none"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            />
          </label>
        </div>

        <BookVisibilityChoice
          value={visibility}
          partnerName={partnerOf(me)}
          onChange={(v) => {
            setVisibility(v);
            if (v === 'private') {
              setReaderMode('me');
            }
          }}
        />

        {visibility === 'shared' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-bold" style={{ color: HONEY.muted }}>
              누가 읽어요?
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'me' as const, label: '나' },
                { mode: 'partner' as const, label: partnerOf(me) },
                { mode: 'both' as const, label: '같이' },
              ].map((opt) => {
                const active = readerMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setReaderMode(opt.mode)}
                    aria-pressed={active}
                    className="h-[44px] rounded-xl text-[14px] font-bold transition-colors"
                    style={
                      active
                        ? { background: HONEY.accent, color: HONEY.accentInk }
                        : {
                            background: HONEY.card,
                            color: HONEY.muted,
                            border: `1px solid ${HONEY.line}`,
                          }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold" style={{ color: HONEY.muted }}>
            어디까지 읽었어요?{' '}
            <span className="font-medium" style={{ color: HONEY.faint }}>
              · 안 적어도 돼요
            </span>
          </span>
          <div className="flex items-center gap-2">
            <input
              id="book-current"
              inputMode="numeric"
              value={current}
              onChange={(e) =>
                setCurrent(e.target.value.replace(/\D/g, '').slice(0, 5))
              }
              placeholder="지금 쪽"
              className="w-full rounded-xl px-3.5 py-3 text-[16px] outline-none tabular-nums"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            />
            <span style={{ color: HONEY.faint }}>/</span>
            <input
              id="book-total"
              inputMode="numeric"
              value={total}
              onChange={(e) =>
                setTotal(e.target.value.replace(/\D/g, '').slice(0, 5))
              }
              placeholder="전체 쪽"
              className="w-full rounded-xl px-3.5 py-3 text-[16px] outline-none tabular-nums"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            />
          </div>
          {tooFar && (
            <p className="text-[12px]" style={{ color: HONEY.crit }}>
              지금 쪽이 전체 쪽보다 커요.
            </p>
          )}
        </div>

        {error && (
          <p className="text-[13px]" style={{ color: HONEY.crit }}>
            {error}
          </p>
        )}

        <motion.button
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          onClick={handleSave}
          disabled={!title.trim() || busy || tooFar}
          className="w-full h-[50px] rounded-[18px] text-[15px] font-bold text-white disabled:opacity-50 flex items-center justify-center transition-opacity mt-2 min-h-[44px]"
          style={{ background: HONEY.accent, color: HONEY.accentInk }}
        >
          {busy ? '놓는 중…' : '책장에 놓기'}
        </motion.button>
      </div>
    </HoneySheet>
  );
}
```

```tsx
// src/components/honeybrary/HoneyBookCard.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { PEOPLE, type BookVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneyBookCover } from './HoneyBookCover';
import { ReaderProgressLine } from './ReaderProgressLine';
import { BookVisibilityBadge } from './BookVisibilityBadge';

export interface HoneyBookCardProps {
  book: BookVM;
  compact?: boolean;
  onClick: () => void;
}

export function HoneyBookCard({
  book,
  compact = false,
  onClick,
}: HoneyBookCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 py-2 px-1 text-left w-full min-h-[44px] active:opacity-75 transition-opacity"
      >
        <HoneyBookCover title={book.title} src={book.coverThumb} width={26} rounded={5} />
        {book.visibility === 'private' && (
          <Lock size={13} className="shrink-0" style={{ color: HONEY.faint }} />
        )}
        <span
          className="text-[13.5px] truncate font-medium flex-1"
          style={{ color: HONEY.muted }}
        >
          {book.title}
        </span>
      </button>
    );
  }

  return (
    <motion.button
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      onClick={onClick}
      className="flex gap-4 p-3.5 rounded-[20px] text-left w-full min-h-[44px]"
      style={{
        background: HONEY.card,
        boxShadow: HONEY.shadowCard,
      }}
    >
      <HoneyBookCover title={book.title} src={book.coverThumb} width={58} />
      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
        <div className="flex items-start justify-between gap-1.5">
          <p
            className="text-[15px] font-bold leading-snug line-clamp-2 flex-1"
            style={{ color: HONEY.ink }}
          >
            {book.title}
          </p>
          {book.visibility === 'private' && (
            <span className="shrink-0 mt-0.5">
              <BookVisibilityBadge compact />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {PEOPLE.map((p) => {
            const r = book.readers[p];
            if (!r) return null;
            return <ReaderProgressLine key={p} name={p} reading={r} compact />;
          })}
        </div>
      </div>
    </motion.button>
  );
}
```

```tsx
// src/components/honeybrary/HoneybraryHomeCard.tsx
'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { PEOPLE, type BookVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import HoneybraryLogo from '@/components/honeybrary/HoneybraryLogo';
import { HoneyBookCover } from './HoneyBookCover';
import { ReaderProgressLine } from './ReaderProgressLine';

export interface HoneybraryHomeCardProps {
  book?: BookVM;
  onOpen: () => void;
}

export function HoneybraryHomeCard({ book, onOpen }: HoneybraryHomeCardProps) {
  const activeReaders = book
    ? PEOPLE.filter((p) => book.readers[p] !== undefined)
    : [];

  return (
    <button
      onClick={onOpen}
      className="sd-card w-full h-full px-4 py-4 flex flex-col justify-between relative text-left active:scale-[.98] transition-transform min-h-[140px]"
      style={{ background: '#FAF5EE' }}
    >
      <div>
        <HoneybraryLogo height={56} text={0.65} />
      </div>

      {book ? (
        <div className="flex items-center gap-3 mt-3 pt-1">
          <HoneyBookCover title={book.title} src={book.coverThumb} width={34} rounded={6} />
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-1 truncate">
              {book.visibility === 'private' && (
                <Lock size={13} className="shrink-0" style={{ color: HONEY.faint }} />
              )}
              <p className="text-[13.5px] font-bold truncate" style={{ color: HONEY.ink }}>
                {book.title}
              </p>
            </div>
            {activeReaders.map((p) => {
              const r = book.readers[p];
              if (!r) return null;
              return <ReaderProgressLine key={p} name={p} reading={r} compact />;
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-1">
          <p className="text-[13px] font-medium" style={{ color: HONEY.faint }}>
            둘이 읽는 책을 놓고, 한 줄씩 남겨요
          </p>
        </div>
      )}
    </button>
  );
}
```

```tsx
// src/components/honeybrary/HoneyBookScreen.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import type { BookVM, Person, NoteVM, ReadingVM, PhotoVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneyBookCover } from '@/components/honeybrary/HoneyBookCover';
import { ReadingProgressPanel } from '@/components/honeybrary/ReadingProgressPanel';
import { ReadingTimeline } from '@/components/honeybrary/ReadingTimeline';
import { HoneyConfirmSheet } from '@/components/honeybrary/HoneyConfirmSheet';
import { BookVisibilityBadge } from '@/components/honeybrary/BookVisibilityBadge';

export interface HoneyBookScreenProps {
  book: BookVM;
  me: Person;
  notes: NoteVM[];
  hasOlderNotes: boolean;
  loadingOlderNotes?: boolean;
  onLoadOlderNotes: () => void;
  reviewsSlot: React.ReactNode;
  hasMyReview: boolean;
  canChangeVisibility: boolean;
  onRequestVisibilityChange: () => void;
  toast?: string | null;
  onBack: () => void;
  onSaveMyReading: (r: ReadingVM) => void;
  onJoinReading: () => void;
  onAddNote: () => void;
  onWriteReview: () => void;
  onReplyNote: (noteId: string, text: string) => Promise<void>;
  onDeleteNote: (noteId: string) => void;
  onOpenPhoto: (photos: PhotoVM[], index: number) => void;
  onRename: (title: string) => void;
  onChangeCover: (file: File) => void;
  onDeleteBook: () => void;
}

export function HoneyBookScreen({
  book,
  me,
  notes,
  hasOlderNotes,
  loadingOlderNotes = false,
  onLoadOlderNotes,
  reviewsSlot,
  hasMyReview,
  canChangeVisibility,
  onRequestVisibilityChange,
  toast,
  onBack,
  onSaveMyReading,
  onJoinReading,
  onAddNote,
  onWriteReview,
  onReplyNote,
  onDeleteNote,
  onOpenPhoto,
  onRename,
  onChangeCover,
  onDeleteBook,
}: HoneyBookScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState(book.title);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRenameTitle(book.title);
  }, [book.title]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const placedByText = book.placedBy === '우댕' ? '우댕이 놓은 책' : '꼼이가 놓은 책';
  const myReading = book.readers[me];
  const isMyReadingDone = myReading?.status === 'done';

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = renameTitle.trim();
    setRenaming(false);
    if (trimmed && trimmed !== book.title) {
      onRename(trimmed);
    } else {
      setRenameTitle(book.title);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: HONEY.ground }}>
      <div className="relative max-w-md mx-auto pb-36">
        <header
          className="sticky top-0 z-20"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            background: HONEY.ground,
            borderBottom: `1px solid ${HONEY.line}`,
          }}
        >
          <div className="flex items-center justify-between px-4 h-14">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onBack}
              aria-label="책장으로"
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
              style={{ color: HONEY.ink }}
            >
              <ArrowLeft size={22} />
            </motion.button>
            <span className="text-[13px] font-bold" style={{ color: HONEY.faint }}>
              허니브러리
            </span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="책 메뉴"
                aria-expanded={menuOpen}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                style={{ color: HONEY.ink }}
              >
                <MoreHorizontal size={22} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-52 rounded-2xl overflow-hidden z-30 text-[14px]"
                      style={{
                        background: HONEY.card,
                        boxShadow: '0 12px 30px -12px rgba(40,20,30,.25)',
                        border: `1px solid ${HONEY.line}`,
                      }}
                    >
                      {canChangeVisibility && (
                        <button
                          className="w-full text-left px-4 py-3 min-h-[44px]"
                          style={{ color: HONEY.ink, borderBottom: `1px solid ${HONEY.line}` }}
                          onClick={() => {
                            setMenuOpen(false);
                            onRequestVisibilityChange();
                          }}
                        >
                          {book.visibility === 'shared'
                            ? '혼자 보는 책으로 바꾸기'
                            : '같이 보는 책으로 바꾸기'}
                        </button>
                      )}
                      <button
                        className="w-full text-left px-4 py-3 min-h-[44px]"
                        style={{ color: HONEY.ink }}
                        onClick={() => {
                          setMenuOpen(false);
                          setRenaming(true);
                        }}
                      >
                        제목 고치기
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 min-h-[44px]"
                        style={{ color: HONEY.ink }}
                        onClick={() => {
                          setMenuOpen(false);
                          coverInputRef.current?.click();
                        }}
                      >
                        표지 사진 바꾸기
                      </button>
                      <button
                        className="w-full text-left px-4 py-3 min-h-[44px]"
                        style={{ color: HONEY.crit }}
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmDeleteBook(true);
                        }}
                      >
                        책 지우기
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onChangeCover(file);
            }}
          />
        </header>

        <main className="px-5 pt-4 flex flex-col gap-6">
          <section className="flex flex-col items-center text-center gap-3">
            <HoneyBookCover title={book.title} src={book.coverUrl} width={132} rounded={12} />
            {renaming ? (
              <form onSubmit={handleRenameSubmit} className="flex gap-2 w-full px-2 mt-1">
                <input
                  id="rename-input"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  maxLength={100}
                  autoFocus
                  className="flex-1 min-w-0 rounded-xl px-3.5 py-2 text-[16px] font-bold text-center outline-none"
                  style={{
                    background: HONEY.card,
                    border: `1px solid ${HONEY.line}`,
                    color: HONEY.ink,
                  }}
                />
                <button
                  type="submit"
                  className="px-3 rounded-xl text-[14px] font-bold text-white min-h-[44px]"
                  style={{ background: HONEY.accent }}
                >
                  저장
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <h1
                  className="text-[20px] font-bold leading-snug px-4 text-balance"
                  style={{ color: HONEY.ink }}
                >
                  {book.title}
                </h1>
                {book.visibility === 'private' ? (
                  <BookVisibilityBadge />
                ) : (
                  <span className="text-[12.5px] font-medium" style={{ color: HONEY.faint }}>
                    {placedByText}
                  </span>
                )}
              </div>
            )}
          </section>

          <section>
            <ReadingProgressPanel
              readers={book.readers}
              me={me}
              onSave={onSaveMyReading}
              onJoin={onJoinReading}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[15px] font-bold" style={{ color: HONEY.ink }}>
              읽으며 남긴 기록
            </h2>
            {hasOlderNotes && (
              <div className="flex justify-center -mt-1 pb-1">
                <button
                  onClick={onLoadOlderNotes}
                  disabled={loadingOlderNotes}
                  className="text-[12.5px] font-bold px-3 py-1.5 rounded-full min-h-[32px]"
                  style={{ background: 'var(--sd-surface-2)', color: HONEY.muted }}
                >
                  {loadingOlderNotes ? '기록 불러오는 중…' : '이전 기록 보기'}
                </button>
              </div>
            )}
            <ReadingTimeline
              notes={notes}
              me={me}
              onReply={onReplyNote}
              onDelete={onDeleteNote}
              onOpenPhoto={onOpenPhoto}
            />
          </section>

          {(reviewsSlot || (!hasMyReview && isMyReadingDone)) && (
            <section className="flex flex-col gap-3">
              <h2 className="text-[15px] font-bold" style={{ color: HONEY.ink }}>
                {book.visibility === 'private' ? '내 감상' : '둘의 감상'}
              </h2>
              {!hasMyReview && isMyReadingDone && (
                <p className="text-[13px]" style={{ color: HONEY.muted }}>
                  다 읽었다면, 이번 독서 경험을 남겨 봐요
                </p>
              )}
              {reviewsSlot}
            </section>
          )}
        </main>

        <div
          className="fixed bottom-0 inset-x-0 z-30 max-w-md mx-auto px-5 pt-3"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
            background: 'linear-gradient(to top, #FAF6F0 85%, rgba(250,246,240,0))',
          }}
        >
          <div className="flex items-center gap-2.5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onAddNote}
              className="flex-1 h-12 rounded-2xl text-[14.5px] font-bold flex items-center justify-center min-h-[44px]"
              style={{
                background: HONEY.card,
                color: HONEY.ink,
                border: `1px solid ${HONEY.line}`,
                boxShadow: HONEY.shadowCard,
              }}
            >
              기록 남기기
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onWriteReview}
              className="flex-1 h-12 rounded-2xl text-[14.5px] font-bold text-white flex items-center justify-center min-h-[44px]"
              style={{
                background: HONEY.accent,
                boxShadow: '0 4px 14px -4px rgba(179,98,20,0.4)',
              }}
            >
              {hasMyReview ? '내 감상 고치기' : '감상 쓰기'}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {toast && (
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="rounded-full px-4 py-2 text-[13px] font-bold text-white shadow-md"
                style={{ background: 'rgba(46,29,38,0.92)' }}
              >
                {toast}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <HoneyConfirmSheet
          open={confirmDeleteBook}
          title="이 책을 지울까요?"
          body="둘이 남긴 기록·감상·사진도 같이 사라져요. 되돌릴 수 없어요."
          confirmText="지우기"
          danger
          onConfirm={() => {
            setConfirmDeleteBook(false);
            onDeleteBook();
          }}
          onClose={() => setConfirmDeleteBook(false)}
        />
      </div>
    </div>
  );
}
```

「같이 보기 / 혼자 보기」 선택 UI와 배지, 상태 전환 확인 시트를 새로 제작하고 기존 4개 컴포넌트에 반영했습니다.
혼자 보는 책은 제목 옆 자물쇠 및 내 감상 모드로 전환되며, 놓은 사람만 ⋯ 메뉴에서 시트를 띄워 전환할 수 있습니다.
모든 버튼 터치 영역 44px 이상과 16px 입력 폰트 크기, `useReducedMotion`을 적용했습니다.
