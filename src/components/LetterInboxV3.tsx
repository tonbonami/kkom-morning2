'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Pencil, Lock, MailOpen, Clock, X, Mail,
  Heart, MessageCircle, Trash2, Send, Mic, Smile
} from 'lucide-react';
import VoicePlayer from '@/components/VoicePlayer';
import DoodlePad, { type DoodleData } from '@/components/DoodlePad';
import { getEmoticonsByIds } from '@/lib/emoticons';

export type Letter = {
  id: string;
  from: '우댕' | '꼼이';
  to: '우댕' | '꼼이';
  body: string;
  createdAt: Date;
  openAt?: Date | null;
  voice?: { src: string; mime?: string; duration?: number } | null;
  doodle?: DoodleData | null;
  emoticonIds?: string[];
  hearts?: number;
  commentCount?: number;
};

export interface Comment {
  id: string;
  by: '우댕' | '꼼이';
  text: string;
  createdAt: Date;
}

export interface Props {
  me: '우댕' | '꼼이';
  letters: Letter[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading: boolean;
  onWriteLetter: () => void;
  onBack?: () => void;
  onHeart: (letterId: string) => Promise<void>;
  subscribeComments: (letterId: string, cb: (comments: Comment[]) => void) => () => void;
  addComment: (letterId: string, text: string) => Promise<void>;
  deleteComment: (letterId: string, commentId: string) => Promise<void>;
}

type FilterType = 'all' | 'received' | 'sent' | 'voice' | 'scheduled';

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------
const formatRelative = (d: Date) => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours === 0) return '방금 전';
    return `${diffHours}시간 전`;
  }
  if (diffDays === 1) return '어제';
  if (diffDays <= 3) return `${diffDays}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

const formatFullDate = (d: Date) => {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours() < 12 ? '오전' : '오후'} ${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatCount = (n?: number) => {
  const cnt = n || 0;
  if (cnt >= 1000) return (cnt / 1000).toFixed(1) + 'k+';
  return cnt.toString();
};

const avatarColor = (person: string) => person === '우댕' ? 'bg-[#10B981]' : 'bg-[#FCA5A5]';

function LetterEmoticonStrip({ ids, large = false }: { ids?: string[]; large?: boolean }) {
  const emoticons = getEmoticonsByIds(ids);
  if (emoticons.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${large ? 'flex-wrap mb-6' : 'mb-3'}`}>
      {emoticons.map((item, index) => (
        <motion.div
          key={`${item.id}-${index}`}
          initial={{ opacity: 0, y: 10, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -3 : 3 }}
          transition={{ delay: Math.min(index * 0.05, 0.15) }}
          className={`${large ? 'w-24 h-24 rounded-[28px]' : 'w-12 h-12 rounded-2xl'} bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shadow-sm`}
          title={item.label}
        >
          <img
            src={item.imageUrl}
            alt={item.label}
            className={`${large ? 'w-20 h-20' : 'w-10 h-10'} object-contain drop-shadow-sm`}
            loading="lazy"
          />
        </motion.div>
      ))}
      {!large && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-600">
          <Smile size={11} /> 이모티콘 {emoticons.length}개
        </span>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// Floating Heart Button
// -----------------------------------------------------------------
function HeartButton({
  count, onHeart, isLarge = false
}: {
  count?: number; onHeart: () => void; isLarge?: boolean;
}) {
  const [bursts, setBursts] = useState<{ id: number; x: number }[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBursts(prev => [...prev, { id: Date.now() + Math.random(), x: (Math.random() - 0.5) * 40 }]);
    onHeart();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center gap-1.5 transition-transform active:scale-95 ${
        isLarge ? 'bg-slate-50 px-4 py-2 rounded-full hover:bg-slate-100' : ''
      }`}
    >
      <Heart
        size={isLarge ? 20 : 14}
        className={`text-red-500 ${count ? 'fill-red-500' : (isLarge ? '' : 'fill-transparent')}`}
      />
      <span className={`font-bold ${isLarge ? 'text-[15px] text-slate-700' : 'text-[12px] text-slate-400'}`}>
        {formatCount(count)}
      </span>

      <AnimatePresence>
        {bursts.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -60, x: b.x, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute text-red-500 pointer-events-none"
            style={{ left: isLarge ? '16px' : '0px', top: '0px' }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>
    </button>
  );
}

// -----------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------
export default function LetterInboxV3({
  me, letters, hasMore, onLoadMore, loading, onWriteLetter, onBack,
  onHeart, subscribeComments, addComment, deleteComment
}: Props) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const now = new Date();

  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      const isReceived = l.to === me;
      const isSent = l.from === me;
      const isScheduled = l.openAt && l.openAt > now;

      if (filter === 'received') return isReceived && !isScheduled;
      if (filter === 'sent') return isSent && !isScheduled;
      if (filter === 'voice') return !!l.voice && (!isScheduled || isSent);
      if (filter === 'scheduled') return isScheduled;
      return true;
    });
  }, [letters, filter, me, now]);

  return (
    <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto relative font-sans text-slate-900 pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-[#F7F9F9]/90 backdrop-blur-md pt-safe">
        <div className="flex items-center justify-between px-6 py-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2 -ml-2 text-slate-800">
            <ArrowLeft size={24} />
          </motion.button>
          <div className="text-center">
            <h1 className="text-lg font-bold">우리의 편지</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              총 {letters.length}통 · 우댕 ↔ 꼼이
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: '전체' },
            { id: 'received', label: '받은 편지' },
            { id: 'sent', label: '보낸 편지' },
            { id: 'voice', label: '🎙 보이스' },
            { id: 'scheduled', label: '예약 중' },
          ].map((f) => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f.id as FilterType)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
      </header>

      {/* List */}
      <main className="px-5 mt-2 flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {filteredLetters.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-24 pb-12 text-center"
            >
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center text-[#99E6D9] mb-5">
                <MailOpen size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">아직 주고받은 편지가 없어요</h3>
              <p className="text-[14px] text-slate-500 mb-8">서로의 진심을 담은 첫 편지를 써볼까요?</p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onWriteLetter}
                className="px-8 py-3.5 bg-[#10B981] text-white font-bold rounded-full shadow-[0_4px_16px_rgba(16,185,129,0.25)] flex items-center gap-2"
              >
                <Pencil size={18} /> 편지 쓰기
              </motion.button>
            </motion.div>
          )}

          {filteredLetters.map((letter, i) => {
            const isMeReceiving = letter.to === me;
            const isLocked = isMeReceiving && letter.openAt && letter.openAt > now;
            const isScheduledSent = !isMeReceiving && letter.openAt && letter.openAt > now;
            const hasEmoticons = (letter.emoticonIds?.length ?? 0) > 0;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                key={letter.id}
                onClick={() => !isLocked && setSelectedLetter(letter)}
                className={`relative bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden ${
                  isLocked ? 'bg-white/60' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${avatarColor(letter.from)}`} />
                    <span className="text-[13px] font-bold text-slate-600">
                      {letter.from} → {letter.to === me ? '나' : letter.to}
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-slate-400">
                    {formatRelative(letter.createdAt)}
                  </span>
                </div>

                {isLocked ? (
                  <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                    <Lock size={24} className="text-slate-300" />
                    <p className="text-[14px] font-bold text-slate-500">
                      {letter.openAt?.getMonth()! + 1}월 {letter.openAt?.getDate()}일 {letter.openAt?.getHours()}시에 도착해요
                    </p>
                  </div>
                ) : (
                  <>
                    {letter.body ? (
                      <p className="text-[15px] leading-relaxed text-slate-700 line-clamp-2 mb-3">
                        {letter.body}
                      </p>
                    ) : hasEmoticons ? (
                      <p className="text-[15px] leading-relaxed text-slate-500 font-bold mb-3">
                        이모티콘 편지가 도착했어요
                      </p>
                    ) : null}
                    <LetterEmoticonStrip ids={letter.emoticonIds} />
                    {letter.voice && (
                      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                        <VoicePlayer src={letter.voice.src} mime={letter.voice.mime} durationHint={letter.voice.duration} compact accent="emerald" />
                      </div>
                    )}
                    {letter.doodle && (
                      <div className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] bg-emerald-50 px-2 py-1 rounded-full">
                        <Pencil size={11} /> 손글씨
                      </div>
                    )}

                    {/* Heart & Comments Counters */}
                    <div className="flex items-center justify-end gap-3 mt-1">
                      <HeartButton count={letter.hearts} onHeart={() => onHeart(letter.id)} />
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MessageCircle size={14} />
                        <span className="text-[12px] font-bold">{formatCount(letter.commentCount)}</span>
                      </div>
                    </div>
                  </>
                )}

                {isScheduledSent && (
                  <div className="absolute top-4 right-4 bg-[#FCA5A5]/10 text-[#FCA5A5] px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <Clock size={12} /> 예약됨
                  </div>
                )}
              </motion.div>
            );
          })}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="bg-white/60 h-32 rounded-[28px] animate-pulse" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {hasMore && !loading && filteredLetters.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onLoadMore}
            className="w-full py-4 mt-2 mb-8 rounded-[24px] border-2 border-dashed border-slate-200 text-[14px] font-bold text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
          >
            예전 편지 더 보기
          </motion.button>
        )}
      </main>

      {/* FAB */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md pointer-events-none z-30">
        <div className="relative w-full h-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onWriteLetter}
            className="absolute right-6 bottom-6 w-14 h-14 bg-[#10B981] rounded-full shadow-[0_8px_24px_rgba(16,185,129,0.35)] flex items-center justify-center text-white pointer-events-auto"
          >
            <Pencil size={24} fill="currentColor" strokeWidth={1} className="ml-0.5" />
          </motion.button>
        </div>
      </div>

      {/* Full Letter & Comments Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <LetterModal
            me={me}
            letter={selectedLetter}
            onClose={() => setSelectedLetter(null)}
            onHeart={() => onHeart(selectedLetter.id)}
            subscribeComments={subscribeComments}
            addComment={addComment}
            deleteComment={deleteComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// -----------------------------------------------------------------
// Letter Modal Sub-Component
// -----------------------------------------------------------------
function LetterModal({
  me, letter, onClose, onHeart, subscribeComments, addComment, deleteComment
}: {
  me: '우댕' | '꼼이';
  letter: Letter;
  onClose: () => void;
  onHeart: () => void;
  subscribeComments: Props['subscribeComments'];
  addComment: Props['addComment'];
  deleteComment: Props['deleteComment'];
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to comments dynamically
  useEffect(() => {
    const unsubscribe = subscribeComments(letter.id, (newComments) => {
      setComments(newComments);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [letter.id, subscribeComments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSending(true);
    try {
      await addComment(letter.id, commentText);
      setCommentText('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5 max-w-md mx-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full rounded-[32px] shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 z-10"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-2">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pr-10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-inner ${avatarColor(letter.from)}`}>
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {letter.from}의 편지
              </h2>
              <p className="text-[13px] font-medium text-slate-400 mt-0.5">
                {formatFullDate(letter.createdAt)}
              </p>
            </div>
          </div>

          {/* Body */}
          {letter.body ? (
            <div className="text-[16px] text-slate-700 leading-[1.7] whitespace-pre-wrap mb-6">
              {letter.body}
            </div>
          ) : (letter.emoticonIds?.length ?? 0) > 0 ? (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[13px] font-black text-emerald-700">
              <Smile size={14} /> 이모티콘만 살짝 보낸 편지
            </div>
          ) : null}

          <LetterEmoticonStrip ids={letter.emoticonIds} large />

          {/* Voice Player */}
          {letter.voice && (
            <div className="mb-6">
              <VoicePlayer src={letter.voice.src} mime={letter.voice.mime} durationHint={letter.voice.duration} />
            </div>
          )}

          {/* Doodle Replay */}
          {letter.doodle && (
            <div className="mb-6">
              <DoodlePad mode="play" data={letter.doodle} autoPlay />
            </div>
          )}

          {/* Interactive Action Row */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5 mb-5">
            <HeartButton count={letter.hearts} onHeart={onHeart} isLarge />
            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[14px]">
              <MessageCircle size={18} /> {formatCount(comments.length)}
            </div>
          </div>

          {/* Comments List */}
          <div className="flex flex-col gap-4 pb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 shadow-inner ${avatarColor(comment.by)}`}>
                  {comment.by.substring(0, 1)}
                </div>
                <div className="flex-1 min-w-0 bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-none">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[13px] font-bold text-slate-700">{comment.by}</span>
                    <span className="text-[11px] font-medium text-slate-400">{formatRelative(comment.createdAt)}</span>
                  </div>
                  <p className="text-[14px] font-medium text-slate-600 break-words leading-snug">
                    {comment.text}
                  </p>
                </div>
                {comment.by === me && (
                  <button
                    onClick={() => { if(confirm('댓글을 삭제할까요?')) deleteComment(letter.id, comment.id); }}
                    className="shrink-0 p-2 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity self-center"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Fixed Bottom Comment Input */}
        <div className="shrink-0 bg-white border-t border-slate-100 p-4">
          <form onSubmit={handleSendComment} className="flex items-center gap-3 bg-[#F7F9F9] p-1.5 pl-4 rounded-full border border-slate-200/50">
            <input
              type="text"
              placeholder="따뜻한 댓글을 남겨주세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-transparent text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSending}
              className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-300 transition-colors shrink-0 shadow-sm"
            >
              <Send size={18} className="-ml-0.5 mt-0.5" />
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
