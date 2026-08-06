'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ImagePlus, Smile } from 'lucide-react';
import {
  type ChatMessage,
  subscribeTyping, setTyping, markRead, subscribeRead, uploadChatImage,
} from '@/lib/chat';
import { MOOD_OPTIONS } from '@/lib/moods';

interface Props {
  me: string;
  partner: string;
  messages: ChatMessage[];
  open: boolean;
  onClose: () => void;
  onSend: (text: string, imageUrl?: string, sticker?: string) => void;
  partnerOnline: boolean;
}

const keyOf = (name: string) => (name === '우댕' ? 'udaeng' : 'kkomi');
const avatarOf = (name: string) => (name === '우댕' ? '/avatars/woodang_avatar.png' : '/avatars/kkomi_avatar.png');

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
  if (d.toDateString() === now.toDateString()) return '오늘';
  const y = new Date(now.getTime() - 86400000);
  if (d.toDateString() === y.toDateString()) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function ChatPanel({ me, partner, messages, open, onClose, onSend, partnerOnline }: Props) {
  const [draft, setDraft] = useState('');
  const [stickerOpen, setStickerOpen] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLastRead, setPartnerLastRead] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meKey = keyOf(me);
  const partnerKey = keyOf(partner);

  // 상대 입력중 / 상대 읽음 구독
  useEffect(() => {
    const a = subscribeTyping(partnerKey, setPartnerTyping);
    const b = subscribeRead(partnerKey, setPartnerLastRead);
    return () => { a(); b(); };
  }, [partnerKey]);

  // 채팅 열려있고 새 메시지 보이면 읽음 처리
  useEffect(() => {
    if (open) markRead(meKey);
  }, [open, messages, meKey]);

  // 닫힐 때 입력중 해제
  useEffect(() => {
    if (!open) setTyping(meKey, false);
  }, [open, meKey]);

  // 새 메시지/입력중/열림 시 맨 아래로
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, open, partnerTyping]);

  const stopTyping = () => { setTyping(meKey, false); if (typingTimer.current) clearTimeout(typingTimer.current); };

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    setTyping(meKey, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(meKey, false), 2500);
  };

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    onSend(t);
    setDraft('');
    stopTyping();
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadChatImage(file);
      onSend('', url);
    } catch { /* 업로드 실패 무시 */ }
    setUploading(false);
  };

  const withDays = useMemo(() => {
    let lastDay = '';
    return messages.map((m, i) => {
      const d = dayText(m.createdAt);
      const showDay = d !== lastDay;
      lastDay = d;
      const prev = messages[i - 1];
      const showAvatar = m.from !== me && (showDay || !prev || prev.from !== m.from);
      return { m, showDay, day: d, showAvatar };
    });
  }, [messages, me]);

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarOf(partner)} alt={partner} className="w-9 h-9 rounded-full object-cover shadow-sm" />
            <div className="flex-1">
              <div className="text-base font-extrabold text-slate-700">{partner}</div>
              <div className={`text-xs font-bold ${partnerTyping ? 'text-[#FB7BA8]' : partnerOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                {partnerTyping ? '입력 중…' : partnerOnline ? '지금 함께 💚' : '오프라인'}
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
            {withDays.map(({ m, showDay, day, showAvatar }) => {
              const mine = m.from === me;
              const unread = mine && m.createdAt != null && (partnerLastRead == null || m.createdAt > partnerLastRead);
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] font-bold text-slate-400 bg-black/5 rounded-full px-3 py-1">{day}</span>
                    </div>
                  )}
                  <div className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && (showAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarOf(partner)} alt={partner} className="w-8 h-8 rounded-full object-cover shrink-0 self-end shadow-sm" />
                    ) : (
                      <div className="w-8 shrink-0" />
                    ))}
                    {mine && (
                      <div className="flex flex-col items-end mb-0.5 leading-tight">
                        {unread && <span className="text-[10px] font-bold text-[#FB7BA8]">1</span>}
                        <span className="text-[10px] text-slate-400">{timeText(m.createdAt)}</span>
                      </div>
                    )}
                    {m.sticker ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.sticker} alt="이모티콘" className="w-28 h-28 object-contain drop-shadow-sm" />
                    ) : m.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.imageUrl}
                        alt="사진"
                        className="max-w-[68%] rounded-2xl shadow-sm object-cover"
                        style={{ maxHeight: 280 }}
                      />
                    ) : (
                      <div
                        className={`max-w-[75%] px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words shadow-sm ${
                          mine
                            ? 'bg-[#FB7BA8] text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-slate-700 rounded-2xl rounded-bl-md'
                        }`}
                      >
                        {m.text}
                      </div>
                    )}
                    {!mine && <span className="text-[10px] text-slate-400 mb-0.5">{timeText(m.createdAt)}</span>}
                  </div>
                </div>
              );
            })}

            {/* 상대 입력 중 버블 */}
            {partnerTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-400 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 이모티콘 피커 (포차코 표정 12종) */}
          {stickerOpen && (
            <div className="px-3 pt-3 pb-1 bg-white/80 backdrop-blur-md border-t border-black/5">
              <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto">
                {MOOD_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { onSend('', undefined, o.image); setStickerOpen(false); }}
                    aria-label={o.label}
                    className="aspect-square p-1.5 rounded-2xl active:bg-black/5 transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.image} alt={o.label} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 입력 */}
          <div className="px-3 pb-6 pt-2 bg-white/60 backdrop-blur-md border-t border-black/5">
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <button
                onClick={() => setStickerOpen((v) => !v)}
                aria-label="이모티콘"
                className={`shrink-0 w-11 h-11 rounded-full border border-black/5 flex items-center justify-center active:scale-95 transition ${stickerOpen ? 'bg-[#FB7BA8] text-white' : 'bg-white text-slate-400'}`}
              >
                <Smile size={20} />
              </button>
              <button
                onClick={() => { setStickerOpen(false); fileRef.current?.click(); }}
                disabled={uploading}
                aria-label="사진"
                className="shrink-0 w-11 h-11 rounded-full bg-white border border-black/5 text-slate-400 flex items-center justify-center disabled:opacity-40 active:scale-95 transition"
              >
                <ImagePlus size={20} />
              </button>
              <textarea
                ref={taRef}
                value={draft}
                onChange={onInput}
                onBlur={stopTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                rows={1}
                placeholder={uploading ? '사진 올리는 중…' : '메시지 보내기…'}
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
