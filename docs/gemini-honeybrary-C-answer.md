```tsx
// src/components/honeybrary/HoneyRating.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';
import { type Rating } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface HoneyRatingProps {
  value?: Rating;
  onChange?: (v?: Rating) => void; /* 없으면 보기 전용 */
  size?: number; /* 별 한 개 px, 기본 32 */
}

const RATING_LABELS: Record<Rating, string> = {
  1: '조금 아쉬웠어요',
  2: '무난하게 읽었어요',
  3: '재미있게 읽었어요',
  4: '마음에 깊이 남았어요',
  5: '오래오래 남을 것 같아요',
};

export function HoneyRating({
  value,
  onChange,
  size = 32,
}: HoneyRatingProps) {
  const isInteractive = typeof onChange === 'function';
  const shouldReduceMotion = useReducedMotion();

  const handleStarClick = (starIndex: Rating) => {
    if (!isInteractive) return;
    if (value === starIndex) {
      onChange(undefined);
    } else {
      onChange(starIndex);
    }
  };

  if (!isInteractive) {
    if (!value) return null;
    return (
      <div className="inline-flex items-center gap-1" aria-label={`독서 별점 ${value}점`}>
        {([1, 2, 3, 4, 5] as Rating[]).map((star) => {
          const isFilled = star <= value;
          return (
            <Star
              key={star}
              size={size}
              style={{
                color: isFilled ? HONEY.star : HONEY.starEmpty,
                fill: isFilled ? HONEY.star : HONEY.starEmpty,
              }}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="이번 독서 경험">
        {([1, 2, 3, 4, 5] as Rating[]).map((star) => {
          const isFilled = value !== undefined && star <= value;
          return (
            <motion.button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star}점: ${RATING_LABELS[star]}`}
              onClick={() => handleStarClick(star)}
              whileTap={shouldReduceMotion ? undefined : { scale: 1.2 }}
              className="min-w-[44px] min-h-[44px] p-1.5 flex items-center justify-center rounded-full focus:outline-none"
            >
              <Star
                size={size}
                style={{
                  color: isFilled ? HONEY.star : HONEY.starEmpty,
                  fill: isFilled ? HONEY.star : HONEY.starEmpty,
                }}
                strokeWidth={1.5}
              />
            </motion.button>
          );
        })}
      </div>
      <p className="text-[13px] font-medium" style={{ color: HONEY.muted }}>
        {value ? RATING_LABELS[value] : '별은 안 줘도 괜찮아요'}
      </p>
    </div>
  );
}
```

```tsx
// src/components/honeybrary/ReviewKeywordPicker.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HONEY } from '@/lib/honeybraryTheme';

export interface ReviewKeywordPickerProps {
  items: string[];
  selected: string[];
  max: number;
  onChange: (selected: string[]) => void;
}

export function ReviewKeywordPicker({
  items,
  selected,
  max,
  onChange,
}: ReviewKeywordPickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const isMaxReached = selected.length >= max;

  const handleToggle = (keyword: string) => {
    if (selected.includes(keyword)) {
      onChange(selected.filter((k) => k !== keyword));
    } else {
      if (isMaxReached) return;
      onChange([...selected, keyword]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item);
          const isDisabled = !isSelected && isMaxReached;

          return (
            <motion.button
              key={item}
              type="button"
              onClick={() => handleToggle(item)}
              disabled={isDisabled}
              whileTap={shouldReduceMotion || isDisabled ? undefined : { scale: 0.96 }}
              className="min-h-[40px] px-3.5 py-2 rounded-full text-[13.5px] font-medium border flex items-center justify-center select-none transition-opacity"
              style={{
                backgroundColor: isSelected ? HONEY.accentSoft : '#FFFFFF',
                color: isSelected ? HONEY.accentSoftInk : HONEY.ink,
                borderColor: isSelected ? HONEY.accentSoftInk : HONEY.line,
                opacity: isDisabled ? 0.36 : 1,
              }}
              aria-pressed={isSelected}
            >
              {item}
            </motion.button>
          );
        })}
      </div>
      {isMaxReached && (
        <p className="text-[12px] text-right font-medium" style={{ color: HONEY.accentSoftInk }}>
          {max}개까지 고를 수 있어요
        </p>
      )}
    </div>
  );
}
```

```tsx
// src/components/honeybrary/ReviewPhotoPicker.tsx
'use client';

import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import { type PhotoVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface ReviewPhotoPickerProps {
  photos: PhotoVM[];
  max: number;
  onAdd: (files: File[]) => void;
  onRemove: (photoId: string) => void;
  disabled?: boolean;
}

export function ReviewPhotoPicker({
  photos,
  max,
  onAdd,
  onRemove,
  disabled = false,
}: ReviewPhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const canAddMore = photos.length < max && !disabled;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    const availableSlots = max - photos.length;
    const toAdd = fileList.slice(0, availableSlots);
    if (toAdd.length > 0) {
      onAdd(toAdd);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
        {canAddMore && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={disabled}
              onChange={handleFileChange}
              className="hidden"
            />
            <motion.button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              className="w-[76px] h-[76px] shrink-0 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-1 focus:outline-none"
              style={{
                borderColor: HONEY.line,
                backgroundColor: '#FFFFFF',
                color: HONEY.muted,
              }}
              aria-label="사진 추가"
            >
              <Plus size={20} strokeWidth={2} style={{ color: HONEY.accent }} />
              <span className="text-[11.5px] tabular-nums font-medium" style={{ color: HONEY.faint }}>
                {photos.length}/{max}
              </span>
            </motion.button>
          </>
        )}

        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative w-[76px] h-[76px] shrink-0 rounded-2xl overflow-hidden bg-black/[0.04]"
          >
            <img
              src={photo.thumbUrl || photo.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover select-none"
            />

            {photo.pending && (
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}

            {!disabled && (
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white focus:outline-none before:absolute before:-inset-2 before:content-['']"
                aria-label="사진 지우기"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[12px] font-medium" style={{ color: HONEY.faint }}>
        표지 · 오래 남은 문장 · 함께 읽은 자리
      </p>
    </div>
  );
}
```

```tsx
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
  }, [open, initial]);

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
          <div className="absolute inset-0 z-30 bg-black/40 rounded-[24px] flex items-center justify-center p-6">
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
          <div className="absolute inset-0 z-30 bg-black/40 rounded-[24px] flex items-center justify-center p-6">
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
```

```tsx
// src/components/honeybrary/HoneyReviewCard.tsx
'use client';

import React, { useState } from 'react';
import { EyeOff } from 'lucide-react';
import { HoneyRating } from '@/components/honeybrary/HoneyRating';
import { PartnerReplyBubble } from '@/components/honeybrary/PartnerReplyBubble';
import { type ReviewVM, type Person, partnerOf } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { SIGN_FONT, signFor } from '@/lib/letterSign';

export interface HoneyReviewCardProps {
  review: ReviewVM;
  me: Person;
  charSrc: Record<Person, string>;
  onEdit?: () => void;
  onOpenPhoto: (index: number) => void;
  onSaveReply?: (text: string) => Promise<void>;
}

export function HoneyReviewCard({
  review,
  me,
  charSrc,
  onEdit,
  onOpenPhoto,
  onSaveReply,
}: HoneyReviewCardProps) {
  const [revealedSpoiler, setRevealedSpoiler] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isMe = review.by === me;
  const isHiddenBySpoiler = review.hasSpoiler && !isMe && !revealedSpoiler;
  const isLongBody = (review.body?.length ?? 0) > 180;

  return (
    <div className="flex flex-col">
      {/* 꿀빛 편지지 감상 카드 */}
      <article
        className="relative rounded-[24px] p-6 flex flex-col gap-4 select-none"
        style={{
          ...HONEY.paperStyle,
          color: HONEY.ink,
        }}
      >
        {/* 머리: 작성자 이름, 수정 단추, 별점, 키워드 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-['Dongle'] text-[30px] font-bold leading-none" style={{ color: HONEY.ink }}>
              {review.by}의 감상
            </h3>
            {isMe && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="text-[13px] font-medium py-1 px-2.5 rounded-lg focus:outline-none"
                style={{ color: '#7E612B' }}
              >
                고치기
              </button>
            )}
            {isMe && review.hasSpoiler && (
              <span
                className="text-[11.5px] font-medium px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(237, 209, 154, 0.45)', color: '#7E612B' }}
              >
                스포일러 있음
              </span>
            )}
          </div>

          {review.rating && (
            <div>
              <HoneyRating value={review.rating} size={18} />
            </div>
          )}

          {review.keywords && review.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {review.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(237, 209, 154, 0.7)',
                    color: '#61400A',
                    border: '1px solid rgba(223, 188, 120, 0.8)',
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 스포일러 가림막 */}
        {isHiddenBySpoiler ? (
          <button
            type="button"
            onClick={() => setRevealedSpoiler(true)}
            className="w-full py-7 px-4 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
            style={{
              backgroundColor: 'rgba(237, 209, 154, 0.3)',
              borderColor: '#DFBC78',
              color: '#7E612B',
            }}
          >
            <EyeOff size={20} strokeWidth={1.8} />
            <span className="text-[14px] font-medium">스포일러가 있어요 · 눌러서 보기</span>
          </button>
        ) : (
          /* 몸체: 한 줄, 본문, 사진 */
          <div className="flex flex-col gap-3.5">
            {review.headline && (
              <p className="text-[16px] font-bold break-keep leading-snug" style={{ color: HONEY.ink }}>
                {review.headline}
              </p>
            )}

            {review.body && (
              <div className="flex flex-col items-start">
                <p
                  className={`text-[16px] leading-[1.8] whitespace-pre-wrap break-keep ${
                    !isExpanded && isLongBody ? 'line-clamp-6' : ''
                  }`}
                  style={{ color: HONEY.ink }}
                >
                  {review.body}
                </p>
                {isLongBody && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[13px] font-medium pt-1.5 underline underline-offset-4 focus:outline-none"
                    style={{ color: '#7E612B' }}
                  >
                    {isExpanded ? '접기' : '더 보기'}
                  </button>
                )}
              </div>
            )}

            {review.photos && review.photos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {review.photos.map((photo, i) => (
                  <button
                    key={photo.id || i}
                    type="button"
                    onClick={() => onOpenPhoto(i)}
                    className="w-16 h-16 shrink-0 rounded-xl overflow-hidden focus:outline-none border border-black/[0.08]"
                  >
                    <img
                      src={photo.thumbUrl || photo.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 끝: 밀랍 도장과 작성자 서명 */}
        <div className="flex items-center justify-between pt-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center select-none shrink-0"
            style={{
              backgroundColor: HONEY.seal,
              border: '1.5px solid #DFBC78',
              boxShadow: '0 2px 6px rgba(97,64,10,0.2), inset 0 1px 2px rgba(255,255,255,0.7)',
            }}
            aria-hidden
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={HONEY.sealInk}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-60"
            >
              <path d="M12 2l7.5 4.33v8.67L12 22l-7.5-4.33V6.33L12 2z" />
            </svg>
          </div>

          <span
            className="select-none"
            style={{
              fontFamily: SIGN_FONT,
              color: '#61400A',
              fontSize: '24px',
              transform: 'rotate(-4deg)',
              display: 'inline-block',
            }}
          >
            {signFor(review.by)}
          </span>
        </div>
      </article>

      {/* 상대의 한마디 (생각풍선) */}
      <PartnerReplyBubble
        reply={review.reply}
        replier={partnerOf(review.by)}
        charSrc={charSrc[partnerOf(review.by)]}
        canWrite={partnerOf(review.by) === me}
        onSave={onSaveReply}
      />
    </div>
  );
}
```

```tsx
// src/components/honeybrary/PartnerReplyBubble.tsx
'use client';

import React, { useState } from 'react';
import { ThoughtBubble } from '@/components/letter/ThoughtBubble';
import { type Person, LIMITS } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface PartnerReplyBubbleProps {
  reply?: { by: Person; text: string };
  replier: Person;
  charSrc: string;
  canWrite: boolean;
  onSave?: (text: string) => Promise<void>;
}

export function PartnerReplyBubble({
  reply,
  replier,
  charSrc,
  canWrite,
  onSave,
}: PartnerReplyBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(reply?.text ?? '');
  const [busy, setBusy] = useState(false);

  if (!reply && !canWrite) {
    return null;
  }

  const handleSave = async () => {
    if (!onSave || busy) return;
    setBusy(true);
    try {
      await onSave(draft.trim());
      setIsEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setDraft(reply?.text ?? '');
    setIsEditing(false);
  };

  if (!reply && !isEditing && canWrite) {
    return (
      <div className="mt-2.5 pl-4">
        <button
          type="button"
          onClick={() => {
            setDraft('');
            setIsEditing(true);
          }}
          className="text-[13px] font-medium underline underline-offset-4 py-1.5 px-1 focus:outline-none"
          style={{ color: HONEY.muted }}
        >
          한마디 남기기
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3.5 pl-3 flex items-start gap-3">
      <div className="shrink-0 pt-0.5">
        <ThoughtBubble
          src={charSrc}
          size={56}
          tail="down-right"
          appear={false}
        />
      </div>

      <div
        className="flex-1 rounded-2xl p-4 border shadow-sm flex flex-col gap-1.5"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderColor: HONEY.line,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ color: HONEY.muted }}>
            {replier}의 한마디
          </span>
          {canWrite && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setDraft(reply?.text ?? '');
                setIsEditing(true);
              }}
              className="text-[11.5px] font-medium underline underline-offset-2"
              style={{ color: HONEY.faint }}
            >
              고치기
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2 pt-1">
            <input
              type="text"
              maxLength={LIMITS.partnerReply}
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="한마디 남기기…"
              className="w-full text-[16px] px-3 py-2 rounded-xl border bg-white focus:outline-none"
              style={{ borderColor: HONEY.line, color: HONEY.ink }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] tabular-nums" style={{ color: HONEY.faint }}>
                {draft.length}/{LIMITS.partnerReply}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCancel}
                  className="text-[12.5px] font-medium py-1 px-2.5 rounded-lg"
                  style={{ color: HONEY.muted }}
                >
                  그만두기
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSave}
                  className="text-[12.5px] font-bold py-1 px-3 rounded-lg text-white"
                  style={{ backgroundColor: HONEY.accent }}
                >
                  {busy ? '남기는 중…' : '남기기'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed break-keep" style={{ color: HONEY.ink }}>
            {reply?.text}
          </p>
        )}
      </div>
    </div>
  );
}
```

허니브러리 감상(리뷰) 6개 컴포넌트 작성을 완료했습니다.
꿀빛 편지지 질감과 Alex Brush 서명·벌집 압인 밀랍 도장·ThoughtBubble 생각풍선으로 장부 느낌 없이 다정한 감상 편지를 완성했습니다.
iOS 웹뷰 환경에 맞춰 16px 이상 입력창, 44px 이상 터치 영역, 인시트 확인 모달 및 무거운 애니메이션 배제를 준수했습니다.
