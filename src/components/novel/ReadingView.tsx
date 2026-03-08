'use client';

import { motion } from 'framer-motion';
import type { Novel, NovelSentence } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, Heart, MessageSquare, Layers } from 'lucide-react';

interface ReadingViewProps {
  novel: Novel;
}

// delay 최대값 제한 (문장이 많아도 2초 이내)
function getDelay(index: number): number {
  return Math.min(index * 0.05, 2);
}

export default function ReadingView({ novel }: ReadingViewProps) {
  const totalSentences = novel.sentences.length;
  const totalLikes = novel.sentences.reduce(function(sum, s) { return sum + s.likes; }, 0);
  const chapterCount = novel.sentences.filter(function(s) { return s.type === 'chapter'; }).length;

  function renderSentences(sentences: NovelSentence[]) {
    var elements: React.ReactNode[] = [];
    var currentNormals: NovelSentence[] = [];
    var normalGroupIndex = 0;

    function flushNormals() {
      if (currentNormals.length === 0) return;
      var group = currentNormals.slice();
      var groupKey = 'normal-group-' + normalGroupIndex;
      normalGroupIndex++;

      elements.push(
        <motion.p
          key={groupKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: getDelay(elements.length) }}
          className="text-sm leading-[2] text-slate-700"
        >
          {group.map(function(s) {
            return (
              <span key={s.bookId + '-' + s.order}>
                {s.text}{' '}
              </span>
            );
          })}
        </motion.p>
      );
      currentNormals = [];
    }

    for (var i = 0; i < sentences.length; i++) {
      var sentence = sentences[i];

      if (sentence.type === 'chapter') {
        flushNormals();
        elements.push(
          <motion.div
            key={sentence.bookId + '-' + sentence.order}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: getDelay(elements.length) }}
            className="py-8 text-center"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <BookOpen size={14} className="text-slate-300" />
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-700 tracking-tight">
              {sentence.text}
            </h3>
          </motion.div>
        );
      } else if (sentence.type === 'paragraph') {
        flushNormals();
        elements.push(
          <motion.p
            key={sentence.bookId + '-' + sentence.order}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: getDelay(elements.length) }}
            className="text-sm leading-[2] text-slate-700 mt-6 indent-4"
          >
            {sentence.text}
          </motion.p>
        );
      } else {
        currentNormals.push(sentence);
      }
    }

    flushNormals();

    return elements;
  }

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardContent className="p-0">
        {/* 표지 헤더 */}
        <div
          className="relative px-8 py-12 text-center"
          style={{ backgroundColor: novel.coverColor || '#FFF5E1' }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-16 h-16 border border-current rounded-full" />
            <div className="absolute bottom-4 right-4 w-24 h-24 border border-current rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-current rounded-full" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 space-y-3"
          >
            <div className="text-3xl">📖</div>
            <h2
              className={cn(
                'text-2xl font-black tracking-tight text-slate-800',
                novel.fontStyle === 'serif' ? 'font-serif' : 'font-sans'
              )}
            >
              {novel.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              꼼이 & 테오 · {novel.createdAt}
            </p>
            {novel.status === 'completed' && (
              <span className="inline-block px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-[10px] font-black text-purple-600 tracking-wider uppercase">
                Completed
              </span>
            )}
          </motion.div>
        </div>

        {/* 통계 바 */}
        <div className="grid grid-cols-3 border-b border-slate-100">
          <div className="py-3 text-center border-r border-slate-100">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <MessageSquare size={10} />
              <span className="text-[9px] font-black tracking-wider uppercase">문장</span>
            </div>
            <p className="text-sm font-black text-slate-700">{totalSentences}</p>
          </div>
          <div className="py-3 text-center border-r border-slate-100">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Layers size={10} />
              <span className="text-[9px] font-black tracking-wider uppercase">챕터</span>
            </div>
            <p className="text-sm font-black text-slate-700">{chapterCount}</p>
          </div>
          <div className="py-3 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Heart size={10} />
              <span className="text-[9px] font-black tracking-wider uppercase">좋아요</span>
            </div>
            <p className="text-sm font-black text-rose-500">{totalLikes}</p>
          </div>
        </div>

        {/* 본문 — 미색 종이 질감 배경 적용 */}
        <div
          className={cn(
            'px-8 py-10 max-h-[60vh] overflow-y-auto bg-[#FCF9F2]',
            novel.fontStyle === 'serif' ? 'font-serif' : 'font-sans'
          )}
          style={{ scrollbarWidth: 'thin' }}
        >
          {novel.sentences.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">📝</div>
              <p className="text-sm text-slate-400">아직 작성된 문장이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1">
              {renderSentences(novel.sentences)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
