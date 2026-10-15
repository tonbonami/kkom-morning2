import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type SuggestItem = {
  id: string;
  thumb: string;
  label: string;
};

export default function StickerSuggestTray({
  items,
  onPick,
  onClose,
  reduceMotion = false,
}: {
  items: SuggestItem[];
  onPick: (item: SuggestItem) => void;
  onClose: () => void;
  reduceMotion?: boolean;
}) {
  // 아이템이 0개면 부모가 아니라 컴포넌트 내부에서 사라지는 애니메이션 처리
  const show = items.length > 0;

  // 트레이 등장/퇴장 애니메이션
  const trayVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      y: reduceMotion ? 0 : 12,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  };

  // 개별 아이템 변경 시 깜빡임 방지 및 부드러운 페이드
  const itemVariants = {
    hidden: { opacity: 0, scale: reduceMotion ? 1 : 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={trayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          // 입력바 바로 위(bottom-full)에 살짝 떠 있는 둥근 카드 스타일
          className="absolute bottom-full left-0 right-0 z-20 px-2 pb-2"
        >
          <div
            className="relative flex items-center w-full bg-[var(--ct-sheet)] border border-[var(--ct-sheet-border)] rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden"
            style={{ height: '112px' }}
          >
            {/* 가로 스크롤 영역 (스크롤바 숨김) */}
            <div className="flex-1 flex overflow-x-auto items-center h-full pl-3 pr-[68px] gap-3 touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.button
                    key={item.id}
                    layout="position"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    onClick={() => onPick(item)}
                    className="flex-shrink-0 w-[92px] h-[92px] rounded-2xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FB7BA8] transition-colors bg-transparent"
                    title={item.label}
                  >
                    <img
                      src={item.thumb}
                      alt={item.label}
                      className="w-full h-full object-contain"
                      draggable={false}
                      loading="eager"
                    />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* X 버튼 배경 그라데이션 (스크롤된 이모티콘이 X버튼 아래로 자연스럽게 사라지도록) */}
            <div className="absolute right-0 top-0 bottom-0 w-[72px] bg-gradient-to-l from-[var(--ct-sheet)] via-[var(--ct-sheet)] to-transparent pointer-events-none" />

            {/* 오른쪽 고정 ✕ 닫기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              aria-label="추천 닫기"
              className="absolute right-3 flex items-center justify-center w-11 h-11 rounded-full bg-[var(--ct-sheet)] border border-[var(--ct-sheet-border)] shadow-[var(--ct-cell-shadow)] text-[var(--ct-label)] hover:text-[#FB7BA8] active:bg-[var(--ct-tab-active)] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FB7BA8]"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
