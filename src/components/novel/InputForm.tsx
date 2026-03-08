'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Novel, NovelSentenceType } from '@/types';
import { addSentence, isMyTurn, getNextTurnAuthor } from '@/lib/novelApi';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Send, RefreshCw, Type, Pilcrow, BookMarked } from 'lucide-react';

interface InputFormProps {
  novel: Novel;
  authorName: string;
  onSentenceAdded: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export default function InputForm({
  novel,
  authorName,
  onSentenceAdded,
  onRefresh,
  isRefreshing,
}: InputFormProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTypeButtons, setShowTypeButtons] = useState(false);
  const [selectedType, setSelectedType] = useState<NovelSentenceType>('normal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const myTurn = isMyTurn(novel);
  const nextTurn = getNextTurnAuthor(novel);
  const isFirstSentence = novel.sentences.length === 0;

  // 마침표·느낌표·물음표 기준 문장 수 (1~3 제한)
  const countSentences = (input: string): number => {
    const trimmed = input.trim();
    if (!trimmed) return 0;
    if (selectedType === 'chapter') return 1;

    const sentences = trimmed.split(/[.!?。…]+/).filter(function(s) {
      return s.trim().length > 0;
    });
    return sentences.length;
  };

  const sentenceCount = countSentences(text);
  const isValidLength = selectedType === 'chapter'
    ? text.trim().length > 0
    : (sentenceCount >= 1 && sentenceCount <= 3);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setShowTypeButtons(!showTypeButtons);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || !myTurn || !isValidLength || isSending) return;

    setIsSending(true);
    try {
      const result = await addSentence(novel.bookId, authorName, text.trim(), selectedType);

      if (result.success) {
        setText('');
        setSelectedType('normal');
        setShowTypeButtons(false);
        await onSentenceAdded();
      } else {
        console.error('문장 추가 실패:', result.error);
      }
    } catch (error) {
      console.error('전송 오류:', error);
    } finally {
      setIsSending(false);
    }
  };

  const typeButtons: { type: NovelSentenceType; icon: React.ReactNode; label: string }[] = [
    { type: 'normal', icon: <Type size={14} />, label: '일반' },
    { type: 'paragraph', icon: <Pilcrow size={14} />, label: '문단' },
    { type: 'chapter', icon: <BookMarked size={14} />, label: '챕터' },
  ];

  return (
    <Card variant="glass">
      <CardContent className="p-4 space-y-3">
        {/* ✅ 수정: 턴 인디케이터에 Glow 효과 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2.5 h-2.5 rounded-full transition-all',
              myTurn
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]'
                : 'bg-slate-300'
            )} />
            <span className={cn(
              'text-[10px] font-bold',
              myTurn ? 'text-emerald-600' : 'text-slate-400'
            )}>
              {myTurn
                ? authorName + '의 차례입니다 ✍️'
                : nextTurn + '의 차례를 기다리는 중...'
              }
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="새로고침"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
          </button>
        </div>

        {/* 타입 선택 (Shift+Enter 토글) */}
        <AnimatePresence>
          {showTypeButtons && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-2">
                {typeButtons.map(function(btn) {
                  return (
                    <button
                      key={btn.type}
                      onClick={function() { setSelectedType(btn.type); }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all',
                        selectedType === btn.type
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-white/50 text-slate-400 border border-white/60 hover:text-slate-600'
                      )}
                    >
                      {btn.icon}
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ 수정: 내 차례일 때 입력창에 Glow 테두리 */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={function(e) { setText(e.target.value); }}
              onKeyDown={handleKeyDown}
              disabled={!myTurn || isSending}
              placeholder={
                !myTurn
                  ? nextTurn + '의 차례입니다'
                  : isFirstSentence
                  ? '첫 문장으로 이야기를 시작하세요...'
                  : selectedType === 'chapter'
                  ? '챕터 제목을 입력하세요'
                  : '1~3문장을 입력하세요 (Shift+Enter: 타입 변경)'
              }
              rows={2}
              className={cn(
                'w-full px-4 py-3 bg-white/60 backdrop-blur-sm border rounded-2xl',
                'text-sm text-slate-800 placeholder:text-slate-300',
                'resize-none outline-none transition-all',
                myTurn
                  ? 'border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:shadow-[0_0_12px_2px_rgba(251,191,36,0.15)]'
                  : 'border-white/60 opacity-50 cursor-not-allowed'
              )}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!myTurn || !text.trim() || !isValidLength || isSending}
            className={cn(
              'p-3 rounded-2xl transition-all flex-shrink-0',
              myTurn && text.trim() && isValidLength
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200/50 active:scale-90'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            )}
            aria-label="전송"
          >
            {isSending ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* 힌트 */}
        <div className="flex items-center justify-between px-1">
          <span className={cn(
            'text-[9px] font-bold',
            selectedType === 'chapter'
              ? 'text-purple-400'
              : sentenceCount > 3
              ? 'text-rose-400'
              : sentenceCount > 0
              ? 'text-emerald-400'
              : 'text-slate-300'
          )}>
            {selectedType === 'chapter'
              ? '📖 챕터 제목'
              : sentenceCount + '/3 문장'
            }
          </span>
          <span className="text-[9px] text-slate-300">
            Shift+Enter: 타입 · Enter: 전송
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
