'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Novel, NovelSentence } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Heart, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  likeSentence as likeSentenceApi,
  editSentence as editSentenceApi,
  deleteSentence as deleteSentenceApi,
  getAtelierAuthorName,
} from '@/lib/novelApi';

interface ChatViewProps {
  novel: Novel;
  authorName: string;
  onRefresh: () => Promise<void>;
}

export default function ChatView({ novel, authorName, onRefresh }: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingOrder, setEditingOrder] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // smooth 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [novel.sentences.length]);

  // 좋아요
  const handleLike = async (sentence: NovelSentence) => {
    const result = await likeSentenceApi(sentence.bookId, sentence.order);
    if (result.success) {
      await onRefresh();
    }
  };

  // 마지막 문장이 내 것인지 확인
  const lastSentence = novel.sentences.length > 0
    ? novel.sentences[novel.sentences.length - 1]
    : null;
  const myName = getAtelierAuthorName();
  const canEditLast = lastSentence !== null && lastSentence.author === myName;

  // 수정 시작
  const handleEditStart = (sentence: NovelSentence) => {
    setEditingOrder(sentence.order);
    setEditText(sentence.text);
    setShowDeleteConfirm(false);
  };

  // 수정 취소
  const handleEditCancel = () => {
    setEditingOrder(null);
    setEditText('');
  };

  // 수정 저장
  const handleEditSave = async () => {
    if (!lastSentence || !editText.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await editSentenceApi(lastSentence.bookId, lastSentence.order, editText.trim());
      if (result.success) {
        setEditingOrder(null);
        setEditText('');
        await onRefresh();
      } else {
        console.error('수정 실패:', result.error);
      }
    } catch (error) {
      console.error('수정 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!lastSentence || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await deleteSentenceApi(lastSentence.bookId, lastSentence.order);
      if (result.success) {
        setShowDeleteConfirm(false);
        setEditingOrder(null);
        await onRefresh();
      } else {
        console.error('삭제 실패:', result.error);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderSentence = (sentence: NovelSentence, index: number) => {
    const isMe = sentence.author === authorName;
    const isChapter = sentence.type === 'chapter';
    const isParagraph = sentence.type === 'paragraph';
    const isLast = index === novel.sentences.length - 1;
    const isEditing = editingOrder === sentence.order;

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

          {/* 말풍선 — 수정 모드 */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-amber-300 rounded-2xl text-sm text-slate-800 resize-none outline-none focus:border-amber-500"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleEditCancel}
                  disabled={isProcessing}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={12} />
                  취소
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isProcessing || !editText.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Check size={12} />
                  저장
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 말풍선 — 일반 모드 */}
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

              {/* 시간 + 좋아요 + 수정/삭제 (마지막 내 문장만) */}
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

                {/* 마지막 문장 + 내 문장일 때만 수정/삭제 표시 */}
                {isLast && canEditLast && (
                  <>
                    <button
                      onClick={() => handleEditStart(sentence)}
                      className="text-slate-300 hover:text-amber-500 transition-colors"
                      title="수정"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={10} />
                    </button>
                  </>
                )}
              </div>

              {/* 삭제 확인 팝업 */}
              <AnimatePresence>
                {isLast && showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={cn(
                      'mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200',
                      isMe ? 'text-right' : 'text-left'
                    )}
                  >
                    <p className="text-[11px] text-rose-600 font-bold mb-2">
                      이 문장을 삭제할까요?
                    </p>
                    <div className={cn(
                      'flex gap-2',
                      isMe ? 'justify-end' : 'justify-start'
                    )}>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isProcessing}
                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                      >
                        아니요
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isProcessing}
                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                      >
                        {isProcessing ? '삭제 중...' : '네, 삭제'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
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

        {/* 채팅 영역 */}
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
            novel.sentences.map((sentence, index) => renderSentence(sentence, index))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
