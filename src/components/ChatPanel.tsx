'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ImagePlus, Smile, Reply, Copy, Trash2 } from 'lucide-react';
import {
  type ChatMessage, type ReplyRef,
  subscribeTyping, setTyping, markRead, subscribeRead, uploadChatImage,
  toggleReaction, deleteMessage,
} from '@/lib/chat';
import { MOOD_OPTIONS } from '@/lib/moods';

interface Props {
  me: string;
  partner: string;
  messages: ChatMessage[];
  open: boolean;
  onClose: () => void;
  onSend: (text: string, imageUrl?: string, sticker?: string, replyTo?: ReplyRef) => void;
  partnerOnline: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

const keyOf = (name: string) => (name === '우댕' ? 'udaeng' : 'kkomi');
const avatarOf = (name: string) => (name === '우댕' ? '/avatars/woodang_avatar.png' : '/avatars/kkomi_avatar.png');
const REACTIONS = ['❤️', '😆', '👍', '😮', '😢', '🥹'];

function timeText(d: Date | null): string {
  if (!d) return '';
  const h = d.getHours(); const m = d.getMinutes();
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
function preview(m: ChatMessage): string {
  if (m.sticker) return '이모티콘';
  if (m.imageUrl) return '사진';
  return m.text;
}

export default function ChatPanel({ me, partner, messages, open, onClose, onSend, partnerOnline, onLoadMore, hasMore }: Props) {
  const [draft, setDraft] = useState('');
  const [stickerOpen, setStickerOpen] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerLastRead, setPartnerLastRead] = useState<Date | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionMsg, setActionMsg] = useState<ChatMessage | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const isPrepending = useRef(false);
  const pendingAnchor = useRef<number | null>(null);

  const meKey = keyOf(me);
  const partnerKey = keyOf(partner);

  useEffect(() => {
    const a = subscribeTyping(partnerKey, setPartnerTyping);
    const b = subscribeRead(partnerKey, setPartnerLastRead);
    return () => { a(); b(); };
  }, [partnerKey]);

  useEffect(() => { if (open) markRead(meKey); }, [open, messages, meKey]);
  useEffect(() => { if (!open) setTyping(meKey, false); }, [open, meKey]);

  // 무한스크롤 앵커 복원(위로 불러올 때 화면 튐 방지) — layout effect가 먼저 실행됨
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingAnchor.current != null) {
      el.scrollTop = el.scrollHeight - pendingAnchor.current;
      pendingAnchor.current = null;
    }
  }, [messages]);

  // 새 메시지 시 맨 아래로 (단, 위로 불러오는 중이면 스킵)
  useEffect(() => {
    if (!open) return;
    if (isPrepending.current) { isPrepending.current = false; return; }
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, open, partnerTyping]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop < 60 && pendingAnchor.current == null) {
      isPrepending.current = true;
      pendingAnchor.current = el.scrollHeight - el.scrollTop; // 하단까지 거리 유지
      onLoadMore();
    }
  };

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
    onSend(t, undefined, undefined, replyTo ?? undefined);
    setDraft(''); setReplyTo(null); stopTyping();
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try { const url = await uploadChatImage(file); onSend('', url, undefined, replyTo ?? undefined); setReplyTo(null); }
    catch { /* 무시 */ }
    setUploading(false);
  };

  // 길게 누르기 → 액션 시트
  const startPress = (m: ChatMessage) => {
    if (m.deleted) return;
    longPressed.current = false;
    pressTimer.current = setTimeout(() => { longPressed.current = true; setActionMsg(m); }, 430);
  };
  const cancelPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

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

  const doReact = (emoji: string) => { if (actionMsg) toggleReaction(actionMsg.id, meKey, emoji); setActionMsg(null); };
  const doReply = () => { if (actionMsg) setReplyTo({ id: actionMsg.id, from: actionMsg.from, text: preview(actionMsg) }); setActionMsg(null); taRef.current?.focus(); };
  const doCopy = () => { if (actionMsg?.text) navigator.clipboard?.writeText(actionMsg.text).catch(() => {}); setActionMsg(null); };
  const doDelete = () => { if (actionMsg) deleteMessage(actionMsg.id); setActionMsg(null); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-[#FBF8F2]"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-black/5 bg-white/60 backdrop-blur-md">
            <button onClick={onClose} aria-label="닫기" className="p-1.5 -ml-1 text-slate-400 hover:text-slate-600"><X size={22} /></button>
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
          <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
            {hasMore && (
              <div className="flex justify-center py-1">
                <button onClick={onLoadMore} className="text-[11px] font-bold text-slate-400 bg-black/5 rounded-full px-3 py-1">이전 대화 더보기</button>
              </div>
            )}
            {withDays.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                <span className="text-4xl">💬</span>
                <p className="text-sm font-semibold">첫 메시지를 보내봐</p>
              </div>
            )}
            {withDays.map(({ m, showDay, day, showAvatar }) => {
              const mine = m.from === me;
              const unread = mine && !m.deleted && m.createdAt != null && (partnerLastRead == null || m.createdAt > partnerLastRead);
              const reactionEmojis = m.reactions ? Object.values(m.reactions) : [];
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] font-bold text-slate-400 bg-black/5 rounded-full px-3 py-1">{day}</span>
                    </div>
                  )}
                  <div className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && (showAvatar
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarOf(partner)} alt={partner} className="w-8 h-8 rounded-full object-cover shrink-0 self-end shadow-sm" />
                      : <div className="w-8 shrink-0" />)}
                    {mine && (
                      <div className="flex flex-col items-end mb-0.5 leading-tight">
                        {unread && <span className="text-[10px] font-bold text-[#FB7BA8]">1</span>}
                        <span className="text-[10px] text-slate-400">{timeText(m.createdAt)}</span>
                      </div>
                    )}

                    <div
                      className="flex flex-col select-none"
                      style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}
                      onPointerDown={() => startPress(m)}
                      onPointerUp={cancelPress}
                      onPointerLeave={cancelPress}
                      onPointerMove={cancelPress}
                      onContextMenu={(e) => { e.preventDefault(); if (!m.deleted) setActionMsg(m); }}
                    >
                      {/* 답장 인용 */}
                      {m.replyTo && !m.deleted && (
                        <div className={`mb-0.5 max-w-[70%] rounded-lg px-2.5 py-1 text-[11px] ${mine ? 'bg-black/5 text-slate-500' : 'bg-black/5 text-slate-500'}`}>
                          <span className="font-bold">{m.replyTo.from}</span> · {m.replyTo.text}
                        </div>
                      )}

                      {m.deleted ? (
                        <div className="max-w-[75%] px-3.5 py-2 text-[14px] italic text-slate-400 bg-black/5 rounded-2xl">삭제된 메시지예요</div>
                      ) : m.sticker ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.sticker} alt="이모티콘" className="w-28 h-28 object-contain drop-shadow-sm" />
                      ) : m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.imageUrl} alt="사진"
                          onClick={() => { if (longPressed.current) { longPressed.current = false; return; } setViewerImage(m.imageUrl!); }}
                          className="max-w-[68%] rounded-2xl shadow-sm object-cover cursor-pointer"
                          style={{ maxHeight: 280 }}
                        />
                      ) : (
                        <div className={`max-w-[75%] px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words shadow-sm ${
                          mine ? 'bg-[#FB7BA8] text-white rounded-2xl rounded-br-md' : 'bg-white text-slate-700 rounded-2xl rounded-bl-md'
                        }`}>
                          {m.text}
                        </div>
                      )}

                      {/* 반응 칩 */}
                      {reactionEmojis.length > 0 && (
                        <div className={`mt-0.5 flex gap-0.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                          <span className="rounded-full bg-white shadow-sm border border-black/5 px-1.5 py-0.5 text-[12px] leading-none">
                            {reactionEmojis.join(' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {!mine && <span className="text-[10px] text-slate-400 mb-0.5">{timeText(m.createdAt)}</span>}
                  </div>
                </div>
              );
            })}

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

          {/* 이모티콘 피커 */}
          {stickerOpen && (
            <div className="px-3 pt-3 pb-1 bg-white/80 backdrop-blur-md border-t border-black/5">
              <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto">
                {MOOD_OPTIONS.map((o) => (
                  <button key={o.id} onClick={() => { onSend('', undefined, o.image, replyTo ?? undefined); setReplyTo(null); setStickerOpen(false); }}
                    aria-label={o.label} className="aspect-square p-1.5 rounded-2xl active:bg-black/5 transition">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.image} alt={o.label} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 답장 인용 바 */}
          {replyTo && (
            <div className="mx-3 mb-1 flex items-center gap-2 rounded-xl bg-black/5 px-3 py-2">
              <div className="w-1 self-stretch rounded-full bg-[#FB7BA8]" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#FB7BA8]">{replyTo.from}에게 답장</div>
                <div className="text-[12px] text-slate-500 truncate">{replyTo.text}</div>
              </div>
              <button onClick={() => setReplyTo(null)} aria-label="답장 취소" className="text-slate-400"><X size={16} /></button>
            </div>
          )}

          {/* 입력 */}
          <div className="px-3 pb-6 pt-2 bg-white/60 backdrop-blur-md border-t border-black/5">
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <button onClick={() => setStickerOpen((v) => !v)} aria-label="이모티콘"
                className={`shrink-0 w-11 h-11 rounded-full border border-black/5 flex items-center justify-center active:scale-95 transition ${stickerOpen ? 'bg-[#FB7BA8] text-white' : 'bg-white text-slate-400'}`}>
                <Smile size={20} />
              </button>
              <button onClick={() => { setStickerOpen(false); fileRef.current?.click(); }} disabled={uploading} aria-label="사진"
                className="shrink-0 w-11 h-11 rounded-full bg-white border border-black/5 text-slate-400 flex items-center justify-center disabled:opacity-40 active:scale-95 transition">
                <ImagePlus size={20} />
              </button>
              <textarea ref={taRef} value={draft} onChange={onInput} onBlur={stopTyping}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1} placeholder={uploading ? '사진 올리는 중…' : '메시지 보내기…'}
                className="flex-1 resize-none rounded-2xl bg-white border border-black/5 px-4 py-2.5 text-[15px] text-slate-700 outline-none focus:border-[#FB7BA8]/50 max-h-[120px]" />
              <button onClick={send} disabled={!draft.trim()} aria-label="보내기"
                className="shrink-0 w-11 h-11 rounded-full bg-[#FB7BA8] text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition">
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* 길게 누르기 액션 시트 */}
          <AnimatePresence>
            {actionMsg && (
              <motion.div className="absolute inset-0 z-[65] flex items-end justify-center bg-black/20"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionMsg(null)}>
                <motion.div className="w-full max-w-md mb-0 rounded-t-3xl bg-white p-4 pb-8 shadow-xl"
                  initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} transition={{ type: 'spring', stiffness: 340, damping: 32 }}
                  onClick={(e) => e.stopPropagation()}>
                  {/* 반응 이모지 */}
                  <div className="flex justify-around pb-3 mb-2 border-b border-black/5">
                    {REACTIONS.map((emo) => (
                      <button key={emo} onClick={() => doReact(emo)} className="text-2xl active:scale-125 transition">{emo}</button>
                    ))}
                  </div>
                  <button onClick={doReply} className="w-full flex items-center gap-3 px-2 py-3 text-slate-700 active:bg-black/5 rounded-xl">
                    <Reply size={18} /> <span className="font-semibold">답장</span>
                  </button>
                  {actionMsg.text && !actionMsg.sticker && !actionMsg.imageUrl && (
                    <button onClick={doCopy} className="w-full flex items-center gap-3 px-2 py-3 text-slate-700 active:bg-black/5 rounded-xl">
                      <Copy size={18} /> <span className="font-semibold">복사</span>
                    </button>
                  )}
                  {actionMsg.from === me && (
                    <button onClick={doDelete} className="w-full flex items-center gap-3 px-2 py-3 text-rose-500 active:bg-black/5 rounded-xl">
                      <Trash2 size={18} /> <span className="font-semibold">삭제</span>
                    </button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 사진 풀스크린 뷰어 */}
          <AnimatePresence>
            {viewerImage && (
              <motion.div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/90"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewerImage(null)}>
                <button onClick={() => setViewerImage(null)} aria-label="닫기" className="absolute top-12 right-4 text-white/80 p-2"><X size={26} /></button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={viewerImage} alt="사진" className="max-w-full max-h-full object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
