'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Trash2 } from 'lucide-react';
import type { ReactionComment } from '@/lib/reactions';

// 어느 entity에든 붙는 댓글 모달 — 모달 자체는 본 단일 컴포넌트로 재사용.
// open=true 일 때 entity의 댓글 구독 시작.

interface Props {
  open: boolean;
  title?: string;                         // 모달 헤더 (예: 게시물 제목)
  me: '우댕' | '꼼이';
  comments: ReactionComment[];
  onClose: () => void;
  onAdd: (text: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

function relTime(d: Date) {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return '방금 전';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function avatarColor(name?: string) {
  return name === '우댕' ? 'bg-[#10B981]' : 'bg-[#FCA5A5]';
}

export default function CommentSheet({ open, title, me, comments, onClose, onAdd, onDelete }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // 새 댓글 오면 부드럽게 스크롤
  useEffect(() => {
    if (open) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [comments.length, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await onAdd(t);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 max-w-md mx-auto"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] z-50 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">댓글</p>
                {title && <h3 className="text-[15px] font-bold text-slate-800 truncate mt-0.5">{title}</h3>}
              </div>
              <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-[13px] font-bold">첫 댓글을 남겨봐 💚</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 group">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 mt-0.5 shadow-inner ${avatarColor(c.by)}`}>
                        {c.by.substring(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-[13px] font-bold text-slate-700">{c.by}</span>
                          <span className="text-[11px] font-medium text-slate-400">{relTime(c.createdAt)}</span>
                        </div>
                        <p className="text-[14px] font-medium text-slate-600 break-words leading-snug whitespace-pre-wrap">
                          {c.text}
                        </p>
                      </div>
                      {c.by === me && (
                        <button
                          onClick={() => { if (confirm('댓글을 삭제할까요?')) onDelete(c.id); }}
                          className="shrink-0 p-2 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input — 키보드 위로 떠도 자연스럽게 */}
            <div className="shrink-0 bg-white border-t border-slate-100 p-4 pb-safe">
              <form onSubmit={submit} className="flex items-center gap-3 bg-[#F7F9F9] p-1.5 pl-4 rounded-full">
                <input
                  type="text"
                  placeholder="댓글 달기..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-300 transition-colors shrink-0"
                >
                  <Send size={16} className="-ml-0.5 mt-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
