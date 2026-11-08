```ts
// src/lib/honeybraryTheme.ts
import type React from 'react';

export const HONEY: {
  ground: string;
  paper: string;
  paperStyle: React.CSSProperties;
  card: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  accentSoftInk: string;
  bar: string;
  barTrack: string;
  star: string;
  starEmpty: string;
  seal: string;
  sealInk: string;
  sheet: string;
  shadowCard: string;
  crit: string;
} = {
  ground: '#FAF6F0',
  paper: '#F8E7BE',
  paperStyle: {
    backgroundColor: '#F8E7BE',
    boxShadow: 'inset 0 0 28px rgba(186,142,60,.25), inset 0 0 0 1px rgba(186,142,60,.35)',
  },
  card: '#FFFFFF',
  ink: '#2E1D26',
  muted: '#6E5457',
  faint: '#806668',
  line: '#E4D2D2',
  accent: '#B36214',
  accentInk: '#FFFFFF',
  accentSoft: '#F6E8CF',
  accentSoftInk: '#6B3E0C',
  bar: '#C97A1E',
  barTrack: '#EFE2D3',
  star: '#E69B24',
  starEmpty: '#E8D7C7',
  seal: '#EDD19A',
  sealInk: '#61400A',
  sheet: '#FAF6F0',
  shadowCard: '0 1px 3px rgba(70,50,40,.06), 0 8px 20px -10px rgba(70,50,40,.12)',
  crit: '#C9524F',
};
```

```tsx
// src/components/honeybrary/HoneyBookCover.tsx
'use client';

import React from 'react';

export interface HoneyBookCoverProps {
  title: string;
  src?: string;
  width: number;
  rounded?: number;
  className?: string;
}

const CLOTH_PALETTE: [string, string][] = [
  ['#B0894C', '#997339'],
  ['#8A624A', '#744F39'],
  ['#5F7057', '#4E5D46'],
  ['#546B7C', '#425665'],
  ['#A35D52', '#8B4A40'],
  ['#7A5265', '#653F52'],
];

function clothHueOf(title: string): [string, string] {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) >>> 0;
  }
  return CLOTH_PALETTE[h % CLOTH_PALETTE.length];
}

export function HoneyBookCover({
  title,
  src,
  width,
  rounded = 10,
  className = '',
}: HoneyBookCoverProps) {
  const height = Math.round(width * 1.5);
  const boxStyle: React.CSSProperties = {
    width,
    height,
    borderRadius: rounded,
  };

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`object-cover shrink-0 select-none ${className}`}
        style={{
          ...boxStyle,
          boxShadow: '0 4px 12px -4px rgba(70,40,50,.2)',
        }}
      />
    );
  }

  const [a, b] = clothHueOf(title);

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center text-center overflow-hidden select-none ${className}`}
      style={{
        ...boxStyle,
        background: `linear-gradient(165deg, ${a}, ${b})`,
        boxShadow: 'inset 4px 0 6px -2px rgba(0,0,0,0.32), 0 4px 12px -4px rgba(70,40,50,.2)',
        padding: Math.max(6, Math.round(width * 0.1)),
      }}
      aria-hidden
    >
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: Math.max(3, Math.round(width * 0.05)),
          background: 'linear-gradient(to right, rgba(0,0,0,0.22), transparent)',
        }}
      />
      <span
        className="font-medium leading-snug text-white break-keep line-clamp-4"
        style={{
          fontSize: Math.max(10, Math.min(17, Math.round(width * 0.13))),
          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}
      >
        {title}
      </span>
    </div>
  );
}
```

```tsx
// src/components/honeybrary/ReaderProgressLine.tsx
'use client';

import React from 'react';
import { progressView, type ReadingVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface ReaderProgressLineProps {
  name: string;
  reading: ReadingVM;
  compact?: boolean;
}

export function ReaderProgressLine({
  name,
  reading,
  compact = false,
}: ReaderProgressLineProps) {
  const v = progressView(reading);

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className={`${compact ? 'text-[11.5px]' : 'text-[12.5px]'} font-bold shrink-0`}
        style={{ color: HONEY.muted }}
      >
        {name}
      </span>
      <span className="text-[11px] shrink-0" style={{ color: HONEY.line }}>
        ·
      </span>
      <span
        className={`${compact ? 'text-[11.5px]' : 'text-[12.5px]'} tabular-nums shrink-0`}
        style={{ color: HONEY.faint }}
      >
        {v.label}
      </span>
      {v.kind === 'bar' && (
        <span
          className="flex-1 min-w-[36px] h-[5px] rounded-full overflow-hidden"
          style={{ background: HONEY.barTrack }}
          role="progressbar"
          aria-valuenow={v.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${name} ${v.label}`}
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.max(3, v.pct)}%`, background: HONEY.bar }}
          />
        </span>
      )}
    </div>
  );
}
```

```tsx
// src/components/honeybrary/HoneySheet.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { HONEY } from '@/lib/honeybraryTheme';

export interface HoneySheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tall?: boolean;
}

export function HoneySheet({
  open,
  title,
  onClose,
  children,
  footer,
  tall = false,
}: HoneySheetProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="fixed inset-0 bg-black/[0.35]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full max-w-md mx-auto rounded-t-[28px] overflow-hidden flex flex-col ${
              tall ? 'max-h-[92vh] h-[92vh]' : 'max-h-[88vh]'
            }`}
            style={{ background: HONEY.sheet }}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 360, damping: 36 }
            }
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
              <h2 className="text-[17px] font-bold" style={{ color: HONEY.ink }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="닫기"
                className="p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                style={{ color: HONEY.faint }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {children}
            </div>
            {footer && (
              <div
                className="shrink-0 px-6 pt-2"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}
              >
                {footer}
              </div>
            )}
            {!footer && (
              <div style={{ height: 'env(safe-area-inset-bottom)' }} className="shrink-0" />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

```tsx
// src/components/honeybrary/HoneyBookCard.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PEOPLE, type BookVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneyBookCover } from './HoneyBookCover';
import { ReaderProgressLine } from './ReaderProgressLine';

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
        className="flex items-center gap-3 py-2 px-1 text-left w-full min-h-[44px] active:opacity-75 transition-opacity"
      >
        <HoneyBookCover title={book.title} src={book.coverThumb} width={26} rounded={5} />
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
        <p
          className="text-[15px] font-bold leading-snug line-clamp-2"
          style={{ color: HONEY.ink }}
        >
          {book.title}
        </p>
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
// src/components/honeybrary/HoneybraryShelfScreen.tsx
'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { shelfOf, type BookVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import HoneybraryLogo from '@/components/honeybrary/HoneybraryLogo';
import { HoneyBookCard } from './HoneyBookCard';

export interface HoneybraryShelfScreenProps {
  books: BookVM[];
  loading: boolean;
  hasMore: boolean;
  loadingMore?: boolean;
  onLoadMore: () => void;
  firstHint: boolean;
  onCloseHint: () => void;
  onBack: () => void;
  onOpenBook: (bookId: string) => void;
  onAddBook: () => void;
}

export function HoneybraryShelfScreen({
  books,
  loading,
  hasMore,
  loadingMore = false,
  onLoadMore,
  firstHint,
  onCloseHint,
  onBack,
  onOpenBook,
  onAddBook,
}: HoneybraryShelfScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  const shelves = useMemo(() => {
    const out = { now: [] as BookVM[], done: [] as Book[], shelved: [] as Book[] };
    for (const b of books) {
      out[shelfOf(b)].push(b);
    }
    return out;
  }, [books]);

  return (
    <div className="min-h-screen" style={{ background: HONEY.ground }}>
      <div className="relative max-w-md mx-auto pb-32">
        <header
          className="sticky top-0 z-20"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            background: HONEY.ground,
          }}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
              onClick={onBack}
              aria-label="홈으로"
              className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ color: HONEY.ink }}
            >
              <ArrowLeft size={24} />
            </motion.button>
            <div className="flex flex-col items-center">
              <HoneybraryLogo height={40} text={0.6} />
              <p className="text-[12px] font-medium mt-0.5" style={{ color: HONEY.faint }}>
                각자 읽고, 서로 한 줄씩
              </p>
            </div>
            <span className="w-10" />
          </div>
        </header>

        <main className="px-5 pt-3 flex flex-col gap-7">
          {firstHint && (
            <div
              className="flex items-start gap-2 rounded-2xl px-4 py-3.5 text-[12.5px] font-medium leading-relaxed"
              style={{ background: 'var(--sd-surface-2)', color: HONEY.muted }}
            >
              <div className="flex-1 break-keep flex flex-col gap-1">
                <p className="font-bold text-[13.5px]" style={{ color: HONEY.ink }}>
                  새로 생긴 허니브러리예요
                </p>
                <p>읽는 책을 놓고 생각이나 사진을 남기면, 상대가 그 아래 한 줄씩 이어 남길 수 있어요.</p>
                <p>다 읽으면 별점과 사진으로 감상도 남겨요. 둘만 봐요.</p>
                <p>진행은 각자 자기 것만 고칠 수 있고, 무엇을 해도 알림은 가지 않아요.</p>
              </div>
              <button
                onClick={onCloseHint}
                aria-label="안내 닫기"
                className="shrink-0 p-1.5 text-[14px] leading-none min-w-[32px] min-h-[32px] flex items-center justify-center"
                style={{ color: HONEY.faint }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <p
              className="text-center py-20 text-[13.5px] font-medium"
              style={{ color: HONEY.faint }}
            >
              책장을 여는 중…
            </p>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 px-4 gap-3">
              <HoneybraryLogo height={68} text={0.65} />
              <p className="text-[16px] font-bold mt-2" style={{ color: HONEY.ink }}>
                첫 책을 놓아 보세요
              </p>
              <p className="text-[13px] leading-relaxed break-keep" style={{ color: HONEY.faint }}>
                지금 읽는 책 하나면 돼요. 쪽수는 안 적어도 괜찮아요.
              </p>
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-[15px] font-bold mb-3" style={{ color: HONEY.ink }}>
                  요즘 읽는 책
                </h2>
                {shelves.now.length === 0 ? (
                  <p className="text-[13px]" style={{ color: HONEY.faint }}>
                    지금 읽는 책이 없어요
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {shelves.now.map((b) => (
                      <HoneyBookCard
                        key={b.id}
                        book={b}
                        onClick={() => onOpenBook(b.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {shelves.done.length > 0 && (
                <section>
                  <h2 className="text-[15px] font-bold mb-3" style={{ color: HONEY.ink }}>
                    다 읽은 책
                  </h2>
                  <div className="flex flex-col gap-3">
                    {shelves.done.map((b) => (
                      <HoneyBookCard
                        key={b.id}
                        book={b}
                        onClick={() => onOpenBook(b.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {shelves.shelved.length > 0 && (
                <section>
                  <h2
                    className="text-[12px] font-bold tracking-wide mb-2 px-1"
                    style={{ color: HONEY.faint }}
                  >
                    책장에 둔 책
                  </h2>
                  <div className="flex flex-col gap-1.5">
                    {shelves.shelved.map((b) => (
                      <HoneyBookCard
                        key={b.id}
                        book={b}
                        compact
                        onClick={() => onOpenBook(b.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {hasMore && (
                <div className="flex justify-center pt-2 pb-4">
                  <motion.button
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="px-5 py-2.5 rounded-full text-[13px] font-bold transition-opacity"
                    style={{ background: HONEY.accentSoft, color: HONEY.accentSoftInk }}
                  >
                    {loadingMore ? '불러오는 중…' : '더 보기'}
                  </motion.button>
                </div>
              )}
            </>
          )}
        </main>

        <div
          className="fixed bottom-0 inset-x-0 max-w-md mx-auto px-5 pointer-events-none z-30"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}
        >
          <motion.button
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            onClick={onAddBook}
            className="pointer-events-auto w-full h-[52px] rounded-[18px] flex items-center justify-center gap-1.5 text-[15px] font-bold shadow-lg"
            style={{ background: HONEY.accent, color: HONEY.accentInk }}
          >
            <Plus size={18} strokeWidth={2.6} /> 책 놓기
          </motion.button>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// src/components/honeybrary/BookPlacementSheet.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ImagePlus } from 'lucide-react';
import { partnerOf, type Person } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneySheet } from './HoneySheet';

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
  const [readerMode, setReaderMode] = useState<'me' | 'partner' | 'both'>('me');
  const [current, setCurrent] = useState('');
  const [total, setTotal] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
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
      readerMode,
      current: c,
      total: t,
      cover,
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
          className="w-full h-[50px] rounded-[18px] text-[15px] font-bold text-white disabled:opacity-50 flex items-center justify-center transition-opacity mt-2"
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
// src/components/honeybrary/HoneybraryHomeCard.tsx
'use client';

import React from 'react';
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
            <p className="text-[13.5px] font-bold truncate" style={{ color: HONEY.ink }}>
              {book.title}
            </p>
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

허니브러리 1/3(토큰·양장본 표지·진행선·바텀시트·책 카드·책장 화면 전체·책 놓기 시트·홈 카드) 구현 코드입니다.
iOS 웹뷰 확대 방지를 위해 입력칸은 16px 이상을 유지하고, 블러·무한 애니메이션 없이 `transform`과 `opacity` 중심의 가벼운 인터랙션으로 완성했습니다.
지정해주신 디자인 변수와 꿀빛 편지지 결이 책장 전반에 온전히 스며들도록 구성했습니다.
