'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Novel, NovelSentence } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { likeSentence as likeSentenceApi } from '@/lib/novelApi';

interface ChatViewProps {
  novel: Novel;
  authorName: string;
  onRefresh: () => Promise<void>;
}

export default function ChatView({ novel, authorName, onRefresh }: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // ✅ 수정: smooth 스크롤 적용
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [novel.sentences.length]);

  // ✅ 수정: 좋아요 후 데이터 갱신
  const handleLike = async (sentence: NovelSentence) => {
    const result = await likeSentenceApi(sentence.bookId, sentence.order);
    if (result.success) {
      await onRefresh();
    }
  };

  const renderSentence = (sentence: NovelSentence, index: number) => {
    var isMe = sentence.author === authorName;
    var isChapter = sentence.type === 'chapter';
    var isParagraph = sentence.type === 'paragraph';

    // 챕터 구분선
    if (isChapter) {
      return (
        <motion.div
          key={sentence.bookId + '-' + sentence.order}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          className="flex items-center gap-3 py-4"
        >
          <div className="flex-1 h-px bg-amber-200" />
          <span className="text-[10px] font-black text-amber-500 tracking-widest uppercase px-2">
            {sentence.text}
          </span>
          <div className="flex-1 h-px bg-amber-200" />
        </motion.div>
      );
    }

    return (
      <motion.div
        key={sentence.bookId + '-' + sentence.order}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, type: 'spring', stiffness: 150 }}
        className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}
      >
        {/* 상대방 아바타 */}
        {!isMe && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-sm">
            {sentence.author === '꼼이' ? '🐰' : '🐶'}
          </div>
        )}

        <div className={cn('max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
          {/* 작성자 이름 */}
          <p className={cn(
            'text-[10px] font-bold text-slate-400 px-1 mb-1',
            isMe ? 'text-right' : 'text-left'
          )}>
            {sentence.author}
          </p>

          {/* 말풍선 */}
          <div
            className={cn(
              'px-4 py-3 rounded-2xl text-sm leading-relaxed',
              isParagraph && 'border-l-2 border-amber-300',
              isMe
                ? 'bg-amber-500 text-white rounded-tr-sm'
                : 'bg-white/70 backdrop-blur-sm text-slate-800 border border-white/60 rounded-tl-sm shadow-sm'
            )}
          >
            {sentence.text}
          </div>

          {/* 시간 + 좋아요 */}
          <div className={cn(
            'flex items-center gap-2 px-1 mt-1',
            isMe ? 'justify-end' : 'justify-start'
          )}>
            <span className="text-[9px] text-slate-300">
              {sentence.timestamp ? sentence.timestamp.slice(11, 16) : ''}
            </span>
            <button
              onClick={() => handleLike(sentence)}
              className="flex items-center gap-0.5 text-slate-300 hover:text-rose-400 active:scale-110 transition-all"
            >
              <Heart size={10} />
              {sentence.likes > 0 && (
                <span className="text-[9px] font-bold text-rose-400">{sentence.likes}</span>
              )}
            </button>
          </div>
        </div>

        {/* 내 아바타 */}
        {isMe && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">
            {sentence.author === '테오' ? '🐶' : '🐰'}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <Card variant="glass">
      <CardContent className="p-4">
        {/* 소설 제목 */}
        <div className="text-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-700 tracking-tight">
            {novel.title}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {novel.sentences.length}문장 · {novel.createdAt}~
          </p>
        </div>

        {/* 채팅 영역 — 화면 비율 기반 높이 */}
        <div
          ref={scrollRef}
          className="space-y-4 max-h-[50vh] overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          {novel.sentences.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">✨</div>
              <p className="text-xs text-slate-400 font-medium">
                첫 문장을 작성해 이야기를 시작하세요!
              </p>
            </div>
          ) : (
            novel.sentences.map(function(sentence, index) {
              return renderSentence(sentence, index);
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
