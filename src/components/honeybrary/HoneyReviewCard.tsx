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
              fontFamily: SIGN_FONT.family,
              fontWeight: SIGN_FONT.weight,
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
