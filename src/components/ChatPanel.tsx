'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import type { ChatMessage } from '@/lib/chat';

interface Props {
  me: string;
  partner: string;
  messages: ChatMessage[];
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  partnerOnline: boolean;
}

function timeText(d: Date | null): string {
  if (!d) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  const ap = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${hh}:${String(m).padStart(2, '0')}`;
}
function dayText(d: Date | null): string {
  if (!d) return '';
  const now = new Date();
  const same = d.toDateString() === now.toDateString();
  const y = new Date(now.getTime() - 86400000);
  if (same) return '오늘';
  if (d.toDateString() === y.toDateString()) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function ChatPanel({ me, partner, messages, open, onClose, onSend, partnerOnline }: Props) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // 새 메시지/열림 시 맨 아래로
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, open]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    onSend(t);
    setDraft('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  // 날짜 구분선 삽입 위치 계산
  const withDays = useMemo(() => {
    let lastDay = '';
    return messages.map((m) => {
      const d = dayText(m.createdAt);
      const showDay = d !== lastDay;
      lastDay = d;
      return { m, showDay, day: d };
    });
  }, [messages]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-[#FBF8F2]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-black/5 bg-white/60 backdrop-blur-md">
            <button onClick={onClose} aria-label="닫기" className="p-1.5 -ml-1 text-slate-400 hover:text-slate-600">
              <X size={22} />
            </button>
            <div className="flex-1">
              <div className="text-base font-extrabold text-slate-700">{partner}</div>
              <div className={`text-xs font-bold ${partnerOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                {partnerOnline ? '지금 함께 💚' : '오프라인'}
              </div>
            </div>
          </div>

          {/* 메시지 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
            {withDays.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                <span className="text-4xl">💬</span>
                <p className="text-sm font-semibold">첫 메시지를 보내봐</p>
              </div>
            )}
            {withDays.map(({ m, showDay, day }) => {
              const mine = m.from === me;
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] font-bold text-slate-400 bg-black/5 rounded-full px-3 py-1">{day}</span>
                    </div>
                  )}
                  <div className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {mine && <span className="text-[10px] text-slate-400 mb-0.5">{timeText(m.createdAt)}</span>}
                    <div
                      className={`max-w-[75%] px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words shadow-sm ${
                        mine
                          ? 'bg-[#FB7BA8] text-white rounded-2xl rounded-br-md'
                          : 'bg-white text-slate-700 rounded-2xl rounded-bl-md'
                      }`}
                    >
                      {m.text}
                    </div>
                    {!mine && <span className="text-[10px] text-slate-400 mb-0.5">{timeText(m.createdAt)}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 입력 */}
          <div className="px-3 pb-6 pt-2 bg-white/60 backdrop-blur-md border-t border-black/5">
            <div className="flex items-end gap-2">
              <textarea
                ref={taRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="메시지 보내기…"
                className="flex-1 resize-none rounded-2xl bg-white border border-black/5 px-4 py-2.5 text-[15px] text-slate-700 outline-none focus:border-[#FB7BA8]/50 max-h-[120px]"
              />
              <button
                onClick={send}
                disabled={!draft.trim()}
                aria-label="보내기"
                className="shrink-0 w-11 h-11 rounded-full bg-[#FB7BA8] text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
