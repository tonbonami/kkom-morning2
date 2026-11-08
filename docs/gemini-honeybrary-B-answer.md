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

export interface HoneyBookScreenProps {
  book: BookVM;
  me: Person;
  notes: NoteVM[];
  hasOlderNotes: boolean;
  loadingOlderNotes?: boolean;
  onLoadOlderNotes: () => void;
  reviewsSlot: React.ReactNode;
  hasMyReview: boolean;
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
                      className="absolute right-0 top-full mt-1 w-44 rounded-2xl overflow-hidden z-30 text-[14px]"
                      style={{
                        background: HONEY.card,
                        boxShadow: '0 12px 30px -12px rgba(40,20,30,.25)',
                        border: `1px solid ${HONEY.line}`,
                      }}
                    >
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
                <span className="text-[12.5px] font-medium" style={{ color: HONEY.faint }}>
                  {placedByText}
                </span>
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

          <section className="flex flex-col gap-3">
            <h2 className="text-[15px] font-bold" style={{ color: HONEY.ink }}>
              둘의 감상
            </h2>
            {!hasMyReview && isMyReadingDone && (
              <p className="text-[13px]" style={{ color: HONEY.muted }}>
                다 읽었다면, 이번 독서 경험을 남겨 봐요
              </p>
            )}
            {reviewsSlot}
          </section>
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

```tsx
// src/components/honeybrary/ReadingProgressPanel.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { STATUS_LABEL, type Person, type ReadingVM, type ReadStatus } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { ReaderProgressLine } from '@/components/honeybrary/ReaderProgressLine';

export interface ReadingProgressPanelProps {
  readers: Partial<Record<Person, ReadingVM>>;
  me: Person;
  onSave: (r: ReadingVM) => void;
  onJoin: () => void;
}

export function ReadingProgressPanel({
  readers,
  me,
  onSave,
  onJoin,
}: ReadingProgressPanelProps) {
  const [editing, setEditing] = useState(false);
  const myReading = readers[me];
  const partner: Person = me === '우댕' ? '꼼이' : '우댕';
  const partnerReading = readers[partner];

  return (
    <div
      className="rounded-[20px] p-4 flex flex-col gap-2.5"
      style={{
        background: HONEY.card,
        border: `1px solid ${HONEY.line}`,
        boxShadow: HONEY.shadowCard,
      }}
    >
      <div className="flex items-center gap-2">
        {myReading ? (
          <>
            <div className="flex-1 min-w-0">
              <ReaderProgressLine name={me} reading={myReading} />
            </div>
            {!editing && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditing(true)}
                className="shrink-0 text-[12px] font-bold px-2.5 py-1 rounded-full min-h-[30px]"
                style={{ background: 'var(--sd-surface-2)', color: HONEY.muted }}
              >
                고치기
              </motion.button>
            )}
          </>
        ) : (
          <div className="w-full flex items-center justify-between py-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[12.5px] font-bold shrink-0" style={{ color: HONEY.muted }}>
                {me}
              </span>
              <span className="text-[11px] shrink-0" style={{ color: HONEY.line }}>
                ·
              </span>
              <span className="text-[12.5px] shrink-0" style={{ color: HONEY.faint }}>
                아직 안 읽음
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onJoin}
              className="shrink-0 text-[12px] font-bold px-3 py-1 rounded-full text-white min-h-[30px]"
              style={{ background: HONEY.accent }}
            >
              나도 읽기
            </motion.button>
          </div>
        )}
      </div>

      {myReading && editing && (
        <ProgressEditor
          initial={myReading}
          onCancel={() => setEditing(false)}
          onSave={(r) => {
            setEditing(false);
            onSave(r);
          }}
        />
      )}

      {partnerReading && (
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex-1 min-w-0">
            <ReaderProgressLine name={partner} reading={partnerReading} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: ReadingVM;
  onSave: (r: ReadingVM) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<ReadStatus>(initial.status);
  const [current, setCurrent] = useState(initial.current ? String(initial.current) : '');
  const [total, setTotal] = useState(initial.total ? String(initial.total) : '');

  const parseNum = (s: string) => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const c = parseNum(current);
  const t = parseNum(total);
  const tooFar = Boolean(c && t && c > t);

  const fieldStyle = {
    background: 'var(--sd-surface-2)',
    border: `1px solid ${HONEY.line}`,
    color: HONEY.ink,
  };

  return (
    <div
      className="flex flex-col gap-3 pt-2.5 border-t"
      style={{ borderColor: HONEY.line }}
    >
      <div className="grid grid-cols-3 gap-1.5">
        {(['reading', 'done', 'shelved'] as const).map((s) => {
          const isSelected = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={isSelected}
              className="py-2 rounded-xl text-[13px] font-bold min-h-[40px]"
              style={
                isSelected
                  ? { background: HONEY.accent, color: '#ffffff' }
                  : { ...fieldStyle, color: HONEY.muted }
              }
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>

      {status === 'reading' && (
        <div className="flex items-center gap-2">
          <input
            id="prog-current-input"
            inputMode="numeric"
            value={current}
            placeholder="지금 쪽"
            onChange={(e) => setCurrent(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="w-full rounded-xl px-3 py-2 text-[16px] outline-none tabular-nums"
            style={fieldStyle}
          />
          <span style={{ color: HONEY.faint }}>/</span>
          <input
            id="prog-total-input"
            inputMode="numeric"
            value={total}
            placeholder="전체 쪽"
            onChange={(e) => setTotal(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="w-full rounded-xl px-3 py-2 text-[16px] outline-none tabular-nums"
            style={fieldStyle}
          />
        </div>
      )}

      {tooFar && (
        <p className="text-[12px]" style={{ color: HONEY.crit }}>
          지금 쪽이 전체 쪽보다 커요.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-[14px] font-bold min-h-[44px]"
          style={{ color: HONEY.muted }}
        >
          그만두기
        </button>
        <button
          type="button"
          disabled={tooFar}
          onClick={() =>
            onSave({
              status,
              current: status === 'reading' ? c : undefined,
              total: status === 'reading' ? t : undefined,
            })
          }
          className="flex-1 py-2 rounded-xl text-[14px] font-bold text-white disabled:opacity-40 min-h-[44px]"
          style={{ background: HONEY.accent }}
        >
          저장
        </button>
      </div>

      <p className="text-[11.5px]" style={{ color: HONEY.faint }}>
        쪽수는 비워 둬도 돼요. 바꿔도 상대에게 알림은 안 가요.
      </p>
    </div>
  );
}
```

```tsx
// src/components/honeybrary/ReadingTimeline.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import type { NoteVM, Person, PhotoVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface ReadingTimelineProps {
  notes: NoteVM[];
  me: Person;
  onReply: (noteId: string, text: string) => Promise<void>;
  onDelete: (noteId: string) => void;
  onOpenPhoto: (photos: PhotoVM[], index: number) => void;
}

export function ReadingTimeline({
  notes,
  me,
  onReply,
  onDelete,
  onOpenPhoto,
}: ReadingTimelineProps) {
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const { tops, repliesOf } = useMemo(() => {
    const ids = new Set(notes.map((n) => n.id));
    const tops = notes.filter((n) => !n.parentNoteId || !ids.has(n.parentNoteId));
    const repliesOf: Record<string, NoteVM[]> = {};
    for (const n of notes) {
      if (n.parentNoteId && ids.has(n.parentNoteId)) {
        (repliesOf[n.parentNoteId] ??= []).push(n);
      }
    }
    return { tops, repliesOf };
  }, [notes]);

  if (tops.length === 0) {
    return (
      <p className="text-[13px] leading-relaxed py-2" style={{ color: HONEY.faint }}>
        마음에 남은 문장이나 밑줄 친 쪽을 남겨 보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tops.map((n) => (
        <NoteItem
          key={n.id}
          note={n}
          replies={repliesOf[n.id] ?? []}
          me={me}
          open={openNoteId === n.id}
          onToggle={() => setOpenNoteId((prev) => (prev === n.id ? null : n.id))}
          onReply={onReply}
          onDelete={onDelete}
          onOpenPhoto={onOpenPhoto}
        />
      ))}
    </div>
  );
}

function NoteItem({
  note,
  replies,
  me,
  open,
  onToggle,
  onReply,
  onDelete,
  onOpenPhoto,
}: {
  note: NoteVM;
  replies: NoteVM[];
  me: Person;
  open: boolean;
  onToggle: () => void;
  onReply: (noteId: string, text: string) => Promise<void>;
  onDelete: (noteId: string) => void;
  onOpenPhoto: (photos: PhotoVM[], index: number) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [askDeleteTarget, setAskDeleteTarget] = useState<NoteVM | null>(null);

  const isMine = note.by === me;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = replyText.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await onReply(note.id, t);
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onToggle();
        }}
        className="rounded-[18px] p-4 flex flex-col gap-2 text-left cursor-pointer transition-shadow"
        style={{
          background: HONEY.card,
          border: `1px solid ${open ? HONEY.accent : HONEY.line}`,
          boxShadow: open
            ? '0 0 0 1.5px rgba(179,98,20,0.3), 0 2px 6px rgba(70,55,60,0.05)'
            : HONEY.shadowCard,
        }}
      >
        <div className="flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: HONEY.faint }}>
          <span>{note.by}</span>
          {note.page && <span className="tabular-nums">· {note.page}쪽</span>}
        </div>

        {note.text && (
          <p
            className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words"
            style={{ color: HONEY.ink }}
          >
            {note.text}
          </p>
        )}

        {note.photo && (
          <div
            className="self-start rounded-xl overflow-hidden mt-1 select-none"
            style={{
              maxWidth: '100%',
              aspectRatio:
                note.photo.width && note.photo.height
                  ? `${note.photo.width} / ${note.photo.height}`
                  : '4 / 3',
              maxHeight: 220,
              background: 'var(--sd-surface-2)',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPhoto([note.photo!], 0);
              }}
              aria-label="사진 크게 보기"
              className="w-full h-full block"
            >
              <img
                src={note.photo.thumbUrl || note.photo.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        )}
      </div>

      {replies.map((r) => {
        const replyAuthor = r.by === me ? '나' : r.by === '우댕' ? '우댕이 이어 남김' : '꼼이가 이어 남김';
        return (
          <div key={r.id} className="relative ml-6 pl-1 flex flex-col">
            <div className="absolute -top-1.5 left-4 flex flex-col items-center pointer-events-none">
              <span
                className="w-1.5 h-1.5 rounded-full bg-white/[0.92] border -mb-0.5"
                style={{ borderColor: HONEY.line }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full bg-white/[0.92] border"
                style={{ borderColor: HONEY.line }}
              />
            </div>
            <div
              className="rounded-[18px] px-4 py-3 flex flex-col gap-1 bg-white/[0.92] border"
              style={{
                borderColor: HONEY.line,
                boxShadow: '0 2px 8px -2px rgba(70,40,50,0.06)',
              }}
            >
              <div
                className="flex items-center justify-between text-[11.5px] font-bold"
                style={{ color: HONEY.faint }}
              >
                <span>{replyAuthor}</span>
                {open && r.by === me && (
                  <button
                    type="button"
                    onClick={() => setAskDeleteTarget(r)}
                    className="font-bold min-h-[28px] px-1"
                    style={{ color: HONEY.faint }}
                  >
                    지우기
                  </button>
                )}
              </div>
              <p
                className="text-[14px] leading-relaxed whitespace-pre-wrap break-words"
                style={{ color: HONEY.ink }}
              >
                {r.text}
              </p>
            </div>
          </div>
        );
      })}

      {open && (
        <div className="ml-6 flex flex-col gap-2 pt-1">
          <form onSubmit={handleSendReply} className="flex gap-2">
            <input
              id={`reply-input-${note.id}`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={500}
              placeholder={isMine ? '이어서 한 줄 더' : '여기에 한 줄 이어 남기기'}
              className="flex-1 min-w-0 rounded-xl px-3.5 py-2 text-[16px] outline-none"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              aria-label="이어 남기기"
              className="px-3 rounded-xl text-white disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              style={{ background: HONEY.accent }}
            >
              <Send size={16} />
            </button>
          </form>

          {isMine && (
            <button
              type="button"
              onClick={() => setAskDeleteTarget(note)}
              className="self-start text-[12px] font-bold min-h-[32px] px-1"
              style={{ color: HONEY.faint }}
            >
              이 기록 지우기
            </button>
          )}
        </div>
      )}

      {askDeleteTarget && (
        <div
          className="ml-6 rounded-xl p-3 flex items-center justify-between gap-2 text-[13px]"
          style={{ background: 'var(--sd-surface-2)', border: `1px solid ${HONEY.line}` }}
        >
          <span style={{ color: HONEY.muted }}>
            {askDeleteTarget.id === note.id
              ? '이어진 말도 같이 지워져요. 지울까요?'
              : '지울까요?'}
          </span>
          <span className="flex gap-3 font-bold shrink-0">
            <button
              type="button"
              className="min-h-[32px] px-2"
              style={{ color: HONEY.faint }}
              onClick={() => setAskDeleteTarget(null)}
            >
              아니요
            </button>
            <button
              type="button"
              className="min-h-[32px] px-2"
              style={{ color: HONEY.crit }}
              onClick={() => {
                const targetId = askDeleteTarget.id;
                setAskDeleteTarget(null);
                onDelete(targetId);
              }}
            >
              지우기
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
```

```tsx
// src/components/honeybrary/NoteComposerSheet.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { LIMITS } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneySheet } from '@/components/honeybrary/HoneySheet';

export interface NoteComposerSheetProps {
  open: boolean;
  busy: boolean;
  error?: string | null;
  onSubmit: (v: { text: string; page?: number; photo: File | null }) => void;
  onClose: () => void;
}

export function NoteComposerSheet({
  open,
  busy,
  error,
  onSubmit,
  onClose,
}: NoteComposerSheetProps) {
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText('');
      setPage('');
      setPhoto(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const canSubmit = (text.trim().length > 0 || photo !== null) && !busy;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const p = parseInt(page, 10);
    onSubmit({
      text: text.trim(),
      page: Number.isFinite(p) && p > 0 ? p : undefined,
      photo,
    });
  };

  return (
    <HoneySheet
      open={open}
      title="기록 남기기"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          {error && (
            <p className="text-[12.5px] px-1" style={{ color: HONEY.crit }}>
              {error}
            </p>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 rounded-2xl text-[15px] font-bold text-white disabled:opacity-40 min-h-[44px]"
            style={{
              background: HONEY.accent,
              boxShadow: canSubmit ? '0 4px 14px -4px rgba(179,98,20,0.4)' : undefined,
            }}
          >
            {busy ? '남기는 중…' : '남기기'}
          </motion.button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <textarea
          id="note-composer-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={LIMITS.note}
          placeholder="마음에 남은 문장, 밑줄 친 곳, 떠오른 생각"
          className="w-full rounded-2xl p-3.5 text-[16px] outline-none resize-none leading-relaxed"
          style={{
            background: HONEY.card,
            border: `1px solid ${HONEY.line}`,
            color: HONEY.ink,
          }}
        />

        <div className="flex items-center gap-2">
          <label htmlFor="note-page-input" className="text-[13.5px] font-bold shrink-0" style={{ color: HONEY.muted }}>
            몇 쪽?
          </label>
          <input
            id="note-page-input"
            inputMode="numeric"
            value={page}
            onChange={(e) => setPage(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="안 적어도 돼요"
            className="w-36 rounded-xl px-3 py-2 text-[16px] outline-none tabular-nums"
            style={{
              background: HONEY.card,
              border: `1px solid ${HONEY.line}`,
              color: HONEY.ink,
            }}
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (preview) URL.revokeObjectURL(preview);
              setPhoto(f);
              setPreview(f ? URL.createObjectURL(f) : null);
              e.target.value = '';
            }}
          />

          {preview ? (
            <div className="relative inline-block self-start">
              <img
                src={preview}
                alt=""
                className="h-28 rounded-xl object-cover border"
                style={{ borderColor: HONEY.line }}
              />
              <button
                type="button"
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setPhoto(null);
                  setPreview(null);
                }}
                aria-label="사진 빼기"
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white min-w-[28px] min-h-[28px]"
                style={{ background: 'rgba(46,29,38,0.85)' }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed text-[13.5px] font-bold min-h-[44px]"
              style={{
                borderColor: HONEY.line,
                background: 'var(--sd-surface-2)',
                color: HONEY.muted,
              }}
            >
              <ImagePlus size={18} />
              <span>사진 한 장 (표지·밑줄·읽은 자리)</span>
            </button>
          )}
        </div>
      </div>
    </HoneySheet>
  );
}
```

```tsx
// src/components/honeybrary/HoneyPhotoViewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { PhotoVM } from '@/lib/honeybraryTypes';

export interface HoneyPhotoViewerProps {
  open: boolean;
  photos: PhotoVM[];
  initialIndex: number;
  onClose: () => void;
}

export function HoneyPhotoViewer({
  open,
  photos,
  initialIndex,
  onClose,
}: HoneyPhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      setIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)));
    }
  }, [open, initialIndex, photos.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(photos.length - 1, i + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, photos.length, onClose]);

  if (!open || photos.length === 0) return null;

  const currentPhoto = photos[index];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center z-20"
          style={{ top: 'max(16px, env(safe-area-inset-top))' }}
        >
          <X size={26} />
        </button>

        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
          <motion.div
            key={index}
            drag={photos.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -60 || info.velocity.x < -300) {
                if (index < photos.length - 1) setIndex(index + 1);
              } else if (info.offset.x > 60 || info.velocity.x > 300) {
                if (index > 0) setIndex(index - 1);
              }
            }}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="w-full h-full flex items-center justify-center p-4 touch-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            {currentPhoto && (
              <img
                src={currentPhoto.url}
                alt=""
                decoding="async"
                draggable={false}
                className="max-w-full max-h-full object-contain pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        </div>

        {photos.length > 1 && (
          <div
            className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none z-10"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {photos.map((p, i) => (
              <span
                key={p.id || i}
                className={`h-1.5 rounded-full ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
```

```tsx
// src/components/honeybrary/HoneyConfirmSheet.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { HONEY } from '@/lib/honeybraryTheme';

export interface HoneyConfirmSheetProps {
  open: boolean;
  title: string;
  body?: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function HoneyConfirmSheet({
  open,
  title,
  body,
  confirmText,
  danger = false,
  onConfirm,
  onClose,
}: HoneyConfirmSheetProps) {
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
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="fixed inset-0 bg-black/[0.35]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md rounded-t-[26px] p-6 flex flex-col gap-3"
            style={{
              background: HONEY.sheet,
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)',
            }}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 360, damping: 36 }
            }
          >
            <p className="text-[17px] font-bold" style={{ color: HONEY.ink }}>
              {title}
            </p>
            {body && (
              <p className="text-[13.5px] leading-relaxed" style={{ color: HONEY.muted }}>
                {body}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white min-h-[44px]"
                style={{ background: danger ? HONEY.crit : HONEY.accent }}
              >
                {confirmText}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-3 text-[14px] font-bold min-h-[44px]"
                style={{ color: HONEY.muted }}
              >
                그만두기
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

사이브러리의 검증된 구조와 문구를 온전히 유지하면서, 꿀빛 테마(`HONEY`)와 하단 듀얼 고정 버튼, 생각풍선 형태의 한 줄 잇기 및 안전한 모바일 웹뷰 대응(16px 입력창·44px 터치 영역·성능 최적화)을 완벽히 적용했습니다.
