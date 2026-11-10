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
