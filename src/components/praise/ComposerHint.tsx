import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircleHeart, StickyNote } from 'lucide-react';

interface ComposerHintProps {
  kind: 'praise' | 'request' | 'memo';
  partner: string;
}

export default function ComposerHint({ kind, partner }: ComposerHintProps) {
  const hints = {
    praise: {
      text: `${partner}에게 예쁜 스티커와 함께 칭찬이 가요`,
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      bg: 'bg-amber-50/80',
    },
    request: {
      text: `${partner}에게 '나 칭찬해 줘' 귀여운 부탁이 가요`,
      icon: <MessageCircleHeart className="w-4 h-4 text-rose-400" />,
      bg: 'bg-rose-50/80',
    },
    memo: {
      text: '둘이 함께 보는 다이어리에 포스트잇을 붙여요',
      icon: <StickyNote className="w-4 h-4 text-emerald-500" />,
      bg: 'bg-emerald-50/80',
    },
  };

  const current = hints[kind];

  return (
    <div className="relative h-8 mt-2 flex justify-center items-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={kind}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${current.bg}`}
        >
          {current.icon}
          <span className="text-sm text-stone-600 font-medium tracking-wide">
            {current.text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
