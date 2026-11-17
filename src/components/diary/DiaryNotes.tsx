'use client';
/**
 * 다이어리 장 아래 ♥·한마디 — 상대 장엔 마음을 누르고 한마디를 남기고, 내 장에선 받은 걸 보고 답글을 단다.
 * 우댕 2026-11-17 (꼼이 장을 보며): 「이거 내가 답글 남기거나 하트는 못해?」  저장은 lib/diary.ts(notes).
 *
 * ⚠️ 내 장에선 내가 먼저 쓰는 칸을 띄우지 않는다 — 상대가 뭔가 남겼을 때만 「답글」 칸이 생긴다(일기는 내 글이 주인공).
 * ⚠️ 지우기는 내가 쓴 한마디만, 한 번 더 눌러야 지워진다.
 */
import React, { useRef, useState } from 'react';
import { Heart, SendHorizontal, X } from 'lucide-react';
import type { Person } from '@/lib/diaryTypes';
import { DIARY_NOTE_MAX, type DiaryNoteVM } from '@/lib/diary';

/** 우댕이 / 꼼이가 */
const subj = (name: string) => {
  const c = name.charCodeAt(name.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return `${name}가`;
  return (c - 0xac00) % 28 !== 0 ? `${name}이` : `${name}가`;
};

const timeOf = (ms: number) => {
  if (!ms) return '';
  const t = new Date(ms);
  const now = new Date();
  const same = t.toDateString() === now.toDateString();
  const hm = t.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  return same ? hm : `${t.getMonth() + 1}/${t.getDate()} ${hm}`;
};

export function DiaryNotes({ me, pageOwner, notes, pageExists, onToggleHeart, onSend, onDelete }: {
  me: Person;
  pageOwner: Person;
  notes: DiaryNoteVM[];
  /** 장에 글·물건이 있나 — 빈 장엔 마음·한마디를 받지 않는다 */
  pageExists: boolean;
  onToggleHeart: () => void;
  onSend: (text: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}): React.JSX.Element | null {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = me === pageOwner;
  const hearts = notes.filter((n) => n.kind === 'heart');
  const texts = notes.filter((n) => n.kind === 'text');
  const myHeart = hearts.some((h) => h.by === me);
  const otherHeart = hearts.find((h) => h.by !== me);
  const otherLeft = notes.some((n) => n.by !== me);

  // 빈 장 + 남은 것도 없음 → 아무것도 안 그린다. 내 장인데 상대가 아직 아무것도 안 남겼으면 → 안 그린다.
  if (!pageExists && notes.length === 0) return null;
  if (isOwner && !otherLeft && texts.length === 0) return null;

  const canWrite = isOwner ? otherLeft : pageExists;

  const send = async () => {
    const t = draft.trim();
    if (!t || sending) return;
    setSending(true);
    const ok = await onSend(t);
    setSending(false);
    if (ok) { setDraft(''); if (inputRef.current) inputRef.current.style.height = ''; }
  };

  const grow = (el: HTMLTextAreaElement) => { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 96)}px`; };

  return (
    <section
      className="rounded-2xl border border-[var(--sd-line)] bg-[var(--sd-card-solid)] px-3.5 pt-2.5 pb-2 shadow-sm"
      aria-label="마음과 한마디"
    >
      {/* 마음 */}
      <div className="flex items-center gap-2 min-h-[36px]">
        {!isOwner && pageExists && (
          <button
            type="button"
            onClick={onToggleHeart}
            aria-pressed={myHeart}
            aria-label={myHeart ? '마음 거두기' : '마음 남기기'}
            className="min-h-[40px] -ml-1.5 pl-1.5 pr-3 rounded-full flex items-center gap-1.5 text-[13px] font-medium active:scale-95 transition-transform"
            style={{ color: myHeart ? 'var(--sd-rel)' : 'var(--sd-muted)' }}
          >
            <Heart className="w-[22px] h-[22px]" strokeWidth={2} fill={myHeart ? 'currentColor' : 'none'} />
            {myHeart ? '마음 남겼어요' : '마음'}
          </button>
        )}
        {isOwner && otherHeart && (
          <p className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'var(--sd-rel)' }}>
            <Heart className="w-[18px] h-[18px]" fill="currentColor" strokeWidth={2} />
            {subj(otherHeart.by)} 마음을 남겼어요
          </p>
        )}
      </div>

      {/* 한마디 */}
      {texts.length > 0 && (
        <ul className="mt-1 flex flex-col gap-2 border-t border-[var(--sd-line)] pt-2.5">
          {texts.map((n) => {
            const mineNote = n.by === me;
            return (
              <li key={n.id} className="flex items-start gap-2 text-[14px] leading-snug">
                <span className="shrink-0 font-bold" style={{ color: 'var(--sd-ink)' }}>{n.by}</span>
                <p className="flex-1 min-w-0 whitespace-pre-wrap break-words select-text" style={{ color: 'var(--sd-ink)' }}>
                  {n.text}
                  <span className="ml-1.5 text-[11px] whitespace-nowrap" style={{ color: 'var(--sd-faint)' }}>{timeOf(n.at)}</span>
                </p>
                {mineNote && (confirmId === n.id ? (
                  <button
                    type="button"
                    onClick={() => { setConfirmId(null); onDelete(n.id); }}
                    onBlur={() => setConfirmId(null)}
                    className="shrink-0 min-h-[32px] -my-1 px-2 rounded-full text-[12px] font-bold"
                    style={{ color: 'var(--sd-crit)', background: 'var(--sd-surface-2)' }}
                  >
                    지우기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(n.id)}
                    aria-label="내 한마디 지우기"
                    className="shrink-0 min-w-[32px] min-h-[32px] -my-1.5 -mr-1.5 flex items-center justify-center"
                    style={{ color: 'var(--sd-faint)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ))}
              </li>
            );
          })}
        </ul>
      )}

      {/* 쓰는 칸 */}
      {canWrite && (
        <div className="mt-2 flex items-end gap-1.5 rounded-xl bg-[var(--sd-surface-2)] pl-3 pr-1 py-1">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={DIARY_NOTE_MAX}
            enterKeyHint="send"
            placeholder={isOwner ? '답글 달기' : `${pageOwner}에게 한마디`}
            onChange={(e) => { setDraft(e.target.value); grow(e.target); }}
            onFocus={(e) => { const el = e.currentTarget; window.setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320); }}
            onKeyDown={(e) => {
              // 한글 조합 중 Enter 는 글자 확정 — 그때 보내면 마지막 글자가 두 번 간다
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); }
            }}
            className="flex-1 min-w-0 resize-none select-text bg-transparent py-2 text-[15px] leading-snug outline-none placeholder:text-[var(--sd-faint)]"
            style={{ color: 'var(--sd-ink)' }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            aria-label="보내기"
            className="shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full active:scale-95 disabled:opacity-35"
            style={{ color: 'var(--sd-rel)' }}
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}
