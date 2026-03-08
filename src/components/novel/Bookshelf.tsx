'use client';

import { motion } from 'framer-motion';
import type { Novel } from '@/types';
import { cn } from '@/lib/utils';
import { Heart, MessageSquare } from 'lucide-react';

interface BookshelfProps {
  novels: Novel[];
  onNovelSelect: (novel: Novel) => void;
}

export default function Bookshelf({ novels, onNovelSelect }: BookshelfProps) {
  if (novels.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl">📚</div>
        <p className="text-sm font-bold text-slate-500">
          아직 완결된 소설이 없어요
        </p>
        <p className="text-xs text-slate-400">
          소설을 완결하면 서가에 보관됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {novels.map(function(novel, index) {
          var totalLikes = novel.sentences.reduce(function(sum, s) { return sum + s.likes; }, 0);

          return (
            <motion.button
              key={novel.bookId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 120 }}
              onClick={function() { onNovelSelect(novel); }}
              className="group text-left"
            >
              {/* 책 표지 */}
              <div
                className={cn(
                  'relative aspect-[3/4] rounded-2xl overflow-hidden',
                  'border border-white/60 shadow-lg',
                  'transition-all duration-300',
                  'group-hover:scale-105 group-hover:shadow-xl group-hover:-translate-y-1',
                  'active:scale-95'
                )}
                style={{ backgroundColor: novel.coverColor || '#FFF5E1' }}
              >
                {/* 장식 */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-3 right-3 w-12 h-12 border border-current rounded-full" />
                  <div className="absolute bottom-6 left-3 w-8 h-8 border border-current rounded-full" />
                </div>

                {/* 책등 효과 */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/5" />

                {/* 제목 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div className="text-2xl mb-3">📖</div>
                  <h3
                    className={cn(
                      'text-sm font-black text-slate-700 text-center leading-tight',
                      novel.fontStyle === 'serif' ? 'font-serif' : 'font-sans'
                    )}
                  >
                    {novel.title}
                  </h3>
                </div>
              </div>

              {/* 메타 정보 */}
              <div className="mt-2 px-1 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 truncate">
                  {novel.title}
                </p>
                <div className="flex items-center gap-3 text-[9px] text-slate-400">
                  <span className="flex items-center gap-0.5">
                    <MessageSquare size={8} />
                    {novel.sentences.length}
                  </span>
                  {totalLikes > 0 && (
                    <span className="flex items-center gap-0.5 text-rose-400">
                      <Heart size={8} />
                      {totalLikes}
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-slate-300">{novel.createdAt}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
