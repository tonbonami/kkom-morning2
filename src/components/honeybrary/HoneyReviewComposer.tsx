// src/components/honeybrary/HoneyReviewComposer.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HoneySheet } from '@/components/honeybrary/HoneySheet';
import { HoneyRating } from '@/components/honeybrary/HoneyRating';
import { ReviewKeywordPicker } from '@/components/honeybrary/ReviewKeywordPicker';
import { ReviewPhotoPicker } from '@/components/honeybrary/ReviewPhotoPicker';
import {
  type Rating,
  type PhotoVM,
  type ReviewDraft,
  LIMITS,
} from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface HoneyReviewComposerProps {
  open: boolean;
  mode: 'create' | 'edit';
  bookTitle: string;
  initial?: ReviewDraft;
  keywordOptions: string[];
  photos: PhotoVM[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (photoId: string) => void;
  busy: boolean;
  progressText?: string | null;
  error?: string | null;
  onSubmit: (d: ReviewDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function HoneyReviewComposer({
  open,
  mode,
  bookTitle,
  initial,
  keywordOptions,
  photos,
  onAddPhotos,
  onRemovePhoto,
  busy,
  progressText,
  error,
  onSubmit,
  onDelete,
  onClose,
}: HoneyReviewComposerProps) {
  const shouldReduceMotion = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [rating, setRating] = useState<Rating | undefined>(initial?.rating);
  const [keywords, setKeywords] = useState<string[]>(initial?.keywords ?? []);
  const [headline, setHeadline] = useState<string>(initial?.headline ?? '');
  const [body, setBody] = useState<string>(initial?.body ?? '');
  const [hasSpoiler, setHasSpoiler] = useState<boolean>(initial?.hasSpoiler ?? false);

  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(initial?.rating);
      setKeywords(initial?.keywords ?? []);
      setHeadline(initial?.headline ?? '');
      setBody(initial?.body ?? '');
      setHasSpoiler(initial?.hasSpoiler ?? false);
      setConfirmClose(false);
      setConfirmDelete(false);
    }
    // ⚠️ 열릴 때 한 번만 채운다 — initial 을 의존값에 두면 부모가 다시 그릴 때마다(사진 추가·상대 한마디 도착) 쓰던 글이 지워진다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hasContent = Boolean(
    rating !== undefined ||
    keywords.length > 0 ||
    headline.trim().length > 0 ||
    body.trim().length > 0 ||
    photos.length > 0
  );

  const handleRequestClose = () => {
    if (busy) return;
    if (hasContent) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleBodyInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSubmit = () => {
    if (!hasContent || busy) return;
    onSubmit({
      rating,
      keywords,
      headline: headline.trim(),
      body: body.trim(),
      hasSpoiler,
    });
  };

  const sheetTitle = `${mode === 'edit' ? '감상 고치기' : '감상 남기기'} · ${bookTitle}`;

  const footer = (
    <div className="w-full pt-2">
      <motion.button
        type="button"
        disabled={!hasContent || busy}
        onClick={handleSubmit}
        whileTap={hasContent && !busy && !shouldReduceMotion ? { scale: 0.98 } : undefined}
        className="w-full min-h-[50px] rounded-2xl text-[16px] font-bold text-white flex items-center justify-center transition-opacity"
        style={{
          backgroundColor: HONEY.accent,
          opacity: !hasContent || busy ? 0.45 : 1,
        }}
      >
        {busy
          ? progressText || '남기는 중…'
          : mode === 'edit'
          ? '고친 감상 남기기'
          : '감상 남기기'}
      </motion.button>
    </div>
  );

  return (
    <HoneySheet
      open={open}
      title={sheetTitle}
      onClose={handleRequestClose}
      tall
      footer={footer}
    >
      <div className="relative flex flex-col gap-6 pt-1 pb-4">
        {/* 구획 1: 독서 경험과 키워드 */}
        <section
          className="rounded-[22px] p-5 flex flex-col gap-4 border"
          style={{ backgroundColor: '#FFFFFF', borderColor: HONEY.line }}
        >
          <div className="text-center space-y-1">
            <h3 className="text-[15px] font-bold" style={{ color: HONEY.ink }}>
              이번 독서 경험은 어땠어요?
            </h3>
          </div>
          <HoneyRating value={rating} onChange={setRating} size={32} />

          <div className="pt-2 border-t" style={{ borderColor: HONEY.line }}>
            <p className="text-[13px] font-bold pb-2" style={{ color: HONEY.muted }}>
              이런 점이 좋았어요 (최대 3개)
            </p>
            <ReviewKeywordPicker
              items={keywordOptions}
              selected={keywords}
              max={LIMITS.keywords}
              onChange={setKeywords}
            />
          </div>
        </section>

        {/* 구획 2: 남긴 장면 */}
        <section
          className="rounded-[22px] p-5 flex flex-col gap-3 border"
          style={{ backgroundColor: '#FFFFFF', borderColor: HONEY.line }}
        >
          <h3 className="text-[15px] font-bold" style={{ color: HONEY.ink }}>
            남긴 장면
          </h3>
          <ReviewPhotoPicker
            photos={photos}
            max={LIMITS.photos}
            onAdd={onAddPhotos}
            onRemove={onRemovePhoto}
            disabled={busy}
          />
        </section>

        {/* 구획 3: 한 줄과 감상 */}
        <section
          className="rounded-[22px] p-5 flex flex-col gap-4 border"
          style={{ backgroundColor: '#FFFFFF', borderColor: HONEY.line }}
        >
          <h3 className="text-[15px] font-bold" style={{ color: HONEY.ink }}>
            한 줄과 감상
          </h3>

          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              maxLength={LIMITS.headline}
              disabled={busy}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="이 책을 한 줄로 말하면"
              className="w-full text-[16px] px-4 py-3 rounded-xl border bg-white focus:outline-none"
              style={{ borderColor: HONEY.line, color: HONEY.ink }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={4}
                maxLength={LIMITS.body}
                disabled={busy}
                value={body}
                onChange={handleBodyInput}
                placeholder="기억에 남는 장면, 읽고 달라진 생각…"
                className="w-full text-[16px] leading-relaxed p-4 pb-8 rounded-xl border bg-white focus:outline-none resize-none min-h-[120px]"
                style={{ borderColor: HONEY.line, color: HONEY.ink }}
              />
              <span
                className="absolute right-3.5 bottom-2.5 text-[12px] tabular-nums font-medium select-none"
                style={{ color: HONEY.faint }}
              >
                {body.length}/{LIMITS.body}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-3 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={busy}
              checked={hasSpoiler}
              onChange={(e) => setHasSpoiler(e.target.checked)}
              className="w-5 h-5 rounded accent-amber-600 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-[14px] font-medium" style={{ color: HONEY.ink }}>
                줄거리·결말이 들어 있어요
              </span>
              <span className="text-[12px]" style={{ color: HONEY.faint }}>
                상대에게는 가려진 상태로 보여요
              </span>
            </div>
          </label>
        </section>

        {error && (
          <p className="text-[13px] text-center font-medium px-4" style={{ color: HONEY.crit }}>
            {error}
          </p>
        )}

        {mode === 'edit' && onDelete && (
          <div className="pt-2 pb-1 text-center">
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
              className="text-[13px] font-medium underline underline-offset-4 py-2 px-4 focus:outline-none"
              style={{ color: HONEY.faint }}
            >
              감상 지우기
            </button>
          </div>
        )}

        {/* 시트 내 닫기 확인 창 */}
        {confirmClose && (
          <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-6">
            <div
              className="w-full max-w-xs rounded-2xl p-5 text-center space-y-3.5 shadow-lg border"
              style={{ backgroundColor: '#FFFFFF', borderColor: HONEY.line }}
            >
              <p className="text-[15px] font-bold" style={{ color: HONEY.ink }}>
                쓰던 감상을 닫을까요?
              </p>
              <p className="text-[13px]" style={{ color: HONEY.muted }}>
                작성 중인 내용이 사라져요.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmClose(false)}
                  className="flex-1 min-h-[44px] rounded-xl text-[14px] font-medium"
                  style={{ backgroundColor: HONEY.ground, color: HONEY.ink }}
                >
                  계속 쓰기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmClose(false);
                    onClose();
                  }}
                  className="flex-1 min-h-[44px] rounded-xl text-[14px] font-medium text-white"
                  style={{ backgroundColor: HONEY.crit }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 시트 내 감상 지우기 확인 창 */}
        {confirmDelete && (
          <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-6">
            <div
              className="w-full max-w-xs rounded-2xl p-5 text-center space-y-3.5 shadow-lg border"
              style={{ backgroundColor: '#FFFFFF', borderColor: HONEY.line }}
            >
              <p className="text-[15px] font-bold" style={{ color: HONEY.ink }}>
                감상을 지울까요?
              </p>
              <p className="text-[13px]" style={{ color: HONEY.muted }}>
                지운 감상은 다시 되돌릴 수 없어요.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 min-h-[44px] rounded-xl text-[14px] font-medium"
                  style={{ backgroundColor: HONEY.ground, color: HONEY.ink }}
                >
                  그만두기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete?.();
                  }}
                  className="flex-1 min-h-[44px] rounded-xl text-[14px] font-medium text-white"
                  style={{ backgroundColor: HONEY.crit }}
                >
                  지우기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HoneySheet>
  );
}
