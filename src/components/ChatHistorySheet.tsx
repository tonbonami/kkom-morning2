'use client';
/**
 * 꼼톡 「지난 대화」 — 날짜를 골라 그날부터 읽기(읽기 전용). 위로 「이전 대화」, 아래로 「다음 대화」.
 * 우댕 2026-11-18: 「오래 된 대화는 이전 대화 보기 기능 넣어서 쉽게 볼 수 있도록.」
 *   본 대화창은 위로 올리며 이어 붙이고(카톡처럼), 몇 달 전처럼 먼 날은 여기서 바로 간다 — 본 창에 수천 개를 쌓지 않으려고.
 * 반응·답장·지우기 같은 동작은 없다(본 대화창에서). 아직 오지 않은 상대 타임캡슐은 안 보인다.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Loader2, CalendarDays } from 'lucide-react';
import { fetchMessagesBefore, fetchMessagesFrom, photosOf, type ChatMessage } from '@/lib/chat';

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayFull = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[d.getDay()]}요일`;
const timeOf = (d: Date | null) => {
  if (!d) return '';
  const h = d.getHours(), m = d.getMinutes();
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`;
};

export default function ChatHistorySheet({ open, onClose, me, renderText }: {
  open: boolean;
  onClose: () => void;
  me: string;
  /** 본 대화창과 같은 글 그리기(미니 이모티콘·링크) */
  renderText: (text: string, from?: string) => React.ReactNode;
}) {
  const [date, setDate] = useState('');
  const [msgs, setMsgs] = useState<ChatMessage[] | null>(null);
  const [loading, setLoading] = useState<'' | 'jump' | 'before' | 'after'>('');
  const [doneBefore, setDoneBefore] = useState(false);
  const [doneAfter, setDoneAfter] = useState(false);
  const [failed, setFailed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<number | null>(null);   // 위로 이어 붙일 때 아래까지 거리(화면이 안 튀게)

  const visible = (m: ChatMessage) => !m.capsule || m.from === me || (m.createdAt != null && m.createdAt.getTime() <= Date.now());

  useEffect(() => { if (!open) { setMsgs(null); setDate(''); setFailed(false); } }, [open]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && anchor.current != null) { el.scrollTop = el.scrollHeight - anchor.current; anchor.current = null; }
  }, [msgs]);

  const jump = async (d: Date) => {
    setDate(ymd(d)); setLoading('jump'); setFailed(false);
    try {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const r = await fetchMessagesFrom(start, 80);
      setMsgs(r.msgs.filter(visible)); setDoneAfter(r.done); setDoneBefore(false);
      requestAnimationFrame(() => { if (listRef.current) listRef.current.scrollTop = 0; });
    } catch { setFailed(true); } finally { setLoading(''); }
  };
  const loadBefore = async () => {
    const first = msgs?.find((m) => m.createdAt)?.createdAt;
    if (!first || loading) return;
    setLoading('before');
    try {
      const r = await fetchMessagesBefore(first, 60);
      const el = listRef.current;
      if (el) anchor.current = el.scrollHeight - el.scrollTop;
      setMsgs((cur) => { const ids = new Set((cur ?? []).map((m) => m.id)); return [...r.msgs.filter((m) => visible(m) && !ids.has(m.id)), ...(cur ?? [])]; });
      setDoneBefore(r.done);
    } catch { setFailed(true); } finally { setLoading(''); }
  };
  const loadAfter = async () => {
    const last = [...(msgs ?? [])].reverse().find((m) => m.createdAt)?.createdAt;
    if (!last || loading) return;
    setLoading('after');
    try {
      const r = await fetchMessagesFrom(new Date(last.getTime() + 1), 80);
      setMsgs((cur) => { const ids = new Set((cur ?? []).map((m) => m.id)); return [...(cur ?? []), ...r.msgs.filter((m) => visible(m) && !ids.has(m.id))]; });
      setDoneAfter(r.done);
    } catch { setFailed(true); } finally { setLoading(''); }
  };

  if (!open) return null;

  const ago = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return d; };
  const QUICK: { label: string; at: () => Date }[] = [
    { label: '1주 전', at: () => ago(7) }, { label: '1달 전', at: () => ago(30) }, { label: '3달 전', at: () => ago(91) },
    { label: '1년 전', at: () => ago(365) }, { label: '처음부터', at: () => new Date(2023, 0, 1) },
  ];

  let lastDay = '';
  return (
    <div className="absolute inset-0 z-[67] flex flex-col" style={{ background: 'var(--ct-sheet, #FBF8F2)' }}>
      <div className="flex items-center gap-3 px-4 pb-2 border-b border-black/[0.05]" style={{ paddingTop: 'max(env(safe-area-inset-top), 2.75rem)' }}>
        <button onClick={onClose} aria-label="지난 대화 닫기" className="grid h-10 w-10 -ml-2 place-items-center rounded-full text-slate-400 active:scale-90"><X size={22} /></button>
        <div className="flex-1 font-['Dongle'] text-3xl font-bold leading-none" style={{ color: 'var(--ct-chip-text)' }}>지난 대화</div>
      </div>

      <div className="px-4 pt-2.5 pb-2 space-y-2 border-b border-black/[0.04]">
        <label className="flex items-center gap-2 rounded-xl bg-black/[0.04] px-3 min-h-[44px]">
          <CalendarDays size={18} className="text-slate-400 shrink-0" />
          <span className="text-[13px] font-bold text-slate-500 shrink-0">날짜로 가기</span>
          <input
            type="date" value={date} max={ymd(new Date())}
            onChange={(e) => { const v = e.target.value; if (/^\d{4}-\d\d-\d\d$/.test(v)) void jump(new Date(`${v}T00:00:00`)); }}
            className="flex-1 min-w-0 bg-transparent text-[15px] font-semibold text-right outline-none" style={{ color: 'var(--ct-chip-text)' }}
          />
        </label>
        <div className="flex gap-1.5 overflow-x-auto">
          {QUICK.map((q) => (
            <button key={q.label} onClick={() => void jump(q.at())} className="shrink-0 min-h-[36px] px-3.5 rounded-full text-[13px] font-bold bg-black/5 text-slate-500 active:scale-95">{q.label}</button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {msgs === null && loading !== 'jump' && !failed && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-slate-400">
            <CalendarDays size={30} />
            <p className="text-sm font-semibold">보고 싶은 날을 골라 주세요</p>
            <p className="text-xs">그날부터 대화를 읽을 수 있어요</p>
          </div>
        )}
        {loading === 'jump' && <div className="py-16 flex justify-center text-slate-400"><Loader2 className="animate-spin" size={22} /></div>}
        {failed && <p className="py-6 text-center text-xs text-slate-400">대화를 불러오지 못했어요. 잠시 뒤 다시 해 주세요</p>}

        {msgs && loading !== 'jump' && (
          <>
            {!doneBefore ? (
              <div className="flex justify-center py-1">
                <button onClick={() => void loadBefore()} disabled={!!loading} className="min-h-[36px] px-4 rounded-full bg-black/5 text-[12px] font-bold text-slate-500 active:scale-95">
                  {loading === 'before' ? '불러오는 중…' : '↑ 이전 대화'}
                </button>
              </div>
            ) : (
              <p className="py-2 text-center text-[11px] font-bold text-slate-400">대화의 처음이에요</p>
            )}
            {msgs.length === 0 && <p className="py-10 text-center text-sm text-slate-400">이날부터는 대화가 없어요</p>}
            {msgs.map((m) => {
              const d = m.createdAt;
              const day = d ? dayFull(d) : '';
              const showDay = day !== lastDay; lastDay = day;
              const mine = m.from === me;
              const photos = m.deleted ? [] : photosOf(m);
              return (
                <div key={m.id}>
                  {showDay && day && (
                    <div className="flex justify-center my-4">
                      <span className="rounded-full bg-black/5 px-4 py-1.5 text-xs font-bold text-[#64748B]">{day}</span>
                    </div>
                  )}
                  {m.kind === 'calendar' ? (
                    <div className="my-2 flex justify-center"><div className="max-w-[86%] rounded-2xl px-4 py-2 text-center text-[13px] font-bold" style={{ background: 'var(--ct-partner-bg)', color: 'var(--ct-chip-text)' }}>{m.text}</div></div>
                  ) : (
                    <div className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {mine && <span className="text-[10px] text-slate-400 shrink-0 mb-0.5">{timeOf(d)}</span>}
                      <div className="max-w-[76%] flex flex-col gap-1">
                        {!mine && <span className="text-[11px] font-bold text-slate-400 px-1">{m.from}</span>}
                        {m.deleted ? (
                          <div className="rounded-2xl px-3.5 py-2 text-[13px] italic text-slate-400 bg-black/[0.04]">삭제된 메시지예요</div>
                        ) : (
                          <>
                            {m.sticker && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.sticker} alt="" loading="lazy" decoding="async" className={`w-28 h-28 object-contain ${mine ? 'self-end' : ''}`} />
                            )}
                            {photos.length > 0 && (
                              <div className={`grid gap-1 ${photos.length > 1 ? 'grid-cols-2' : ''} ${mine ? 'self-end' : ''}`}>
                                {photos.slice(0, 4).map((u, i) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img key={i} src={m.imageThumbs?.[i] ?? u} alt="" loading="lazy" decoding="async" className={`${photos.length > 1 ? 'w-28 h-28' : 'max-w-[220px] max-h-[260px]'} rounded-xl object-cover bg-black/5`} />
                                ))}
                              </div>
                            )}
                            {m.audioUrl && <div className="rounded-2xl px-3.5 py-2 text-[13px] bg-black/[0.04] text-slate-500">🎤 음성 메시지</div>}
                            {m.videoUrl && <div className="rounded-2xl px-3.5 py-2 text-[13px] bg-black/[0.04] text-slate-500">🎬 동영상</div>}
                            {m.text && (
                              <div
                                className={`rounded-2xl px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words select-text ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}
                                style={mine ? { background: 'var(--ct-my-bg)', color: 'var(--ct-my-text)' } : { background: 'var(--ct-partner-bg)', color: 'var(--ct-partner-text)' }}
                              >
                                {renderText(m.text, m.from)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {!mine && <span className="text-[10px] text-slate-400 shrink-0 mb-0.5">{timeOf(d)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
            {!doneAfter ? (
              <div className="flex justify-center py-2">
                <button onClick={() => void loadAfter()} disabled={!!loading} className="min-h-[36px] px-4 rounded-full bg-black/5 text-[12px] font-bold text-slate-500 active:scale-95">
                  {loading === 'after' ? '불러오는 중…' : '↓ 다음 대화'}
                </button>
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] font-bold text-slate-400">여기부터는 대화창에서 이어져요</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
