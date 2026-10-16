// 제미나이 원본 그대로 — 단 하나: 원본의 `FoldUp` 아이콘이 이 프로젝트 lucide-react(0.475)에 없어 빌드가 깨져서
//   가장 가까운 `FoldVertical`(접기 모양)로 이름만 바꿈. 나머지 값·클래스는 수정 0.
import { ArrowUp, FoldVertical as FoldUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiaryNavProps {
  months: { key: string; label: string; count: number }[];
  activeKey: string | null;
  onJump: (key: string) => void;
  showBackToTop: boolean;
  onBackToTop: () => void;
  expanded: boolean;
  onCollapse: () => void;
}

export default function DiaryNav({
  months,
  activeKey,
  onJump,
  showBackToTop,
  onBackToTop,
  expanded,
  onCollapse,
}: DiaryNavProps) {
  if (!expanded) return null;

  return (
    <>
      {/* 상단 Sticky 달 이동 네비게이션 */}
      <div className="sticky top-0 z-10 w-full bg-[#fdfaf6]/90 backdrop-blur-sm border-b border-stone-200 py-2 shadow-sm">
        <div className="flex overflow-x-auto px-4 gap-2 no-scrollbar items-center">
          {months.map((month) => {
            const isActive = activeKey === month.key;
            return (
              <button
                key={month.key}
                onClick={() => onJump(month.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white text-stone-600 border border-stone-200 active:bg-stone-100'
                }`}
              >
                {month.label} <span className="text-xs opacity-80 ml-0.5">{month.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 우측 하단 플로팅 버튼 (위로 가기 & 접기) */}
      <div className="fixed bottom-6 right-4 z-20 flex flex-col gap-3">
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              onClick={onBackToTop}
              className="p-3 bg-white border border-stone-200 text-stone-600 rounded-full shadow-lg active:scale-95 transition-transform"
              aria-label="맨 위로"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onCollapse}
          className="p-3 bg-amber-500 text-white rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center"
          aria-label="옛 칭찬 접기"
        >
          <FoldUp className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      </div>
    </>
  );
}
