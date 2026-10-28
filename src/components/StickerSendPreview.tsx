'use client';
// 카톡식 이모티콘 미리보기 — 대화 위에 반투명하게 떠 있는 카드(우댕 2026-10-28 카톡 화면 비교).
//   ★ 즐겨찾기(왼쪽 위) · ✕ 빼기(오른쪽 위) · 그림을 누르면 바로 전송. 뒤 대화가 비쳐 보이게 반투명 + 흐림.
//   처음엔 제미나이 시안(2026-10-22, 불투명 카드 + 안내 문구)이었는데, 대화를 가리고 글이 많아 카톡처럼 바꿨다.
//   카드 아래 한 줄로 「무엇이 갈지」를 보여 준다 — 낱말을 대신하면 「‘사랑해’ 대신 보내요」, 문장이면 「글은 그대로 두고 함께 보내요」(GPT 상의).

import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';

export default function StickerSendPreview({
  item,
  hasText,
  replacedWord,
  fav = false,
  onToggleFav,
  onCancel,
  onSendNow,
  reduceMotion = false,
}: {
  item: { image: string; thumb: string; isVideo: boolean; label: string } | null;
  hasText: boolean;
  replacedWord?: string;
  fav?: boolean;
  onToggleFav?: () => void;
  onCancel: () => void;
  onSendNow: () => void;
  reduceMotion?: boolean;
}) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key="sticker-preview"
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.16, ease: 'easeOut' } }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, transition: { duration: 0.12, ease: 'easeIn' } }}
          // 바깥 줄은 누름을 통과시킨다 — 카드 밖 대화는 그대로 스크롤·탭된다.
          className="pointer-events-none absolute bottom-full left-0 right-0 z-30 flex justify-center pb-2"
        >
          <div className="pointer-events-auto relative flex w-[212px] flex-col items-center rounded-[22px] px-4 pb-3 pt-9 backdrop-blur-md"
            style={{ background: 'rgba(38,36,44,0.42)', boxShadow: '0 6px 24px rgba(0,0,0,0.14)' }}>
            {onToggleFav && (
              <button type="button" onClick={onToggleFav} aria-label={fav ? '즐겨찾기에서 빼기' : '즐겨찾기에 담기'} aria-pressed={fav}
                className="absolute left-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full text-white active:bg-white/15">
                <Star size={20} strokeWidth={2.2} fill={fav ? '#FFD84D' : 'rgba(255,255,255,0.0)'} color={fav ? '#FFD84D' : '#fff'} />
              </button>
            )}
            <button type="button" onClick={onCancel} aria-label="이모티콘 빼기"
              className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full text-white active:bg-white/15">
              <X size={21} strokeWidth={2.4} />
            </button>
            <button type="button" onClick={onSendNow} aria-label="이 이모티콘 바로 보내기" className="flex items-center justify-center focus:outline-none">
              {item.isVideo ? (
                <video src={item.image} autoPlay loop muted playsInline className="max-h-[124px] w-auto rounded-lg object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.label} className="max-h-[124px] max-w-[168px] object-contain drop-shadow-sm" draggable={false} />
              )}
            </button>
            {(hasText || replacedWord) && (
              <span className="mt-1.5 max-w-full truncate rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {hasText ? '글은 그대로 두고 함께 보내요' : `‘${replacedWord}’ 대신 보내요`}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
