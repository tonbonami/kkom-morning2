'use client';
// 제미나이 시안(2026-10-22, gemini-3-flash CLI) — 카톡식 이모티콘 미리보기(입력바 위). 값 그대로.
// 고친 것: ✕·그림 버튼에 aria-label(읽기 프로그램용)만.

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function StickerSendPreview({
  item,
  hasText,
  onCancel,
  onSendNow,
  reduceMotion = false,
}: {
  item: { image: string; thumb: string; isVideo: boolean; label: string } | null;
  hasText: boolean;
  onCancel: () => void;
  onSendNow: () => void;
  reduceMotion?: boolean;
}) {
  const trayVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, y: reduceMotion ? 0 : 15, transition: { duration: 0.15, ease: 'easeIn' } },
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          variants={trayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute bottom-full left-0 right-0 z-30 px-2 pb-2"
        >
          <div className="relative flex items-center p-3 w-full bg-[var(--ct-sheet)] border border-[var(--ct-sheet-border)] rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden min-h-[140px]">
            {/* 이모티콘 미리보기 영역 */}
            <button
              type="button"
              onClick={onSendNow}
              aria-label="이 이모티콘 바로 보내기"
              className="flex-shrink-0 flex items-center justify-center bg-transparent focus:outline-none group"
            >
              {item.isVideo ? (
                <video
                  src={item.image}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="max-h-[110px] w-auto object-contain rounded-lg"
                />
              ) : (
                <img
                  src={item.image}
                  alt={item.label}
                  className="max-h-[110px] w-auto object-contain"
                />
              )}
            </button>

            {/* 안내 문구 영역 */}
            <div className="ml-3 flex-1 flex flex-col justify-center pr-8">
              <p className="text-[12px] leading-tight text-[var(--ct-chip-text)] opacity-80 break-keep">
                {hasText ? (
                  <>
                    보내기를 누르면 글과 함께 가요
                    <br />
                    그림을 한 번 더 누르면 바로
                  </>
                ) : (
                  '보내기나 그림을 한 번 더 누르면 보내요'
                )}
              </p>
            </div>

            {/* ✕ 닫기 버튼 */}
            <button
              type="button"
              onClick={onCancel}
              aria-label="이모티콘 빼기"
              className="absolute top-1 right-1 w-10 h-10 flex items-center justify-center text-[var(--ct-label)] hover:text-[#FB7BA8] transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
