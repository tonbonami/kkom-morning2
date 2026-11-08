// src/components/honeybrary/ReadingTimeline.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import type { NoteVM, Person, PhotoVM } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface ReadingTimelineProps {
  notes: NoteVM[];
  me: Person;
  onReply: (noteId: string, text: string) => Promise<void>;
  onDelete: (noteId: string) => void;
  onOpenPhoto: (photos: PhotoVM[], index: number) => void;
}

export function ReadingTimeline({
  notes,
  me,
  onReply,
  onDelete,
  onOpenPhoto,
}: ReadingTimelineProps) {
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const { tops, repliesOf } = useMemo(() => {
    const ids = new Set(notes.map((n) => n.id));
    const tops = notes.filter((n) => !n.parentNoteId || !ids.has(n.parentNoteId));
    const repliesOf: Record<string, NoteVM[]> = {};
    for (const n of notes) {
      if (n.parentNoteId && ids.has(n.parentNoteId)) {
        (repliesOf[n.parentNoteId] ??= []).push(n);
      }
    }
    return { tops, repliesOf };
  }, [notes]);

  if (tops.length === 0) {
    return (
      <p className="text-[13px] leading-relaxed py-2" style={{ color: HONEY.faint }}>
        마음에 남은 문장이나 밑줄 친 쪽을 남겨 보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tops.map((n) => (
        <NoteItem
          key={n.id}
          note={n}
          replies={repliesOf[n.id] ?? []}
          me={me}
          open={openNoteId === n.id}
          onToggle={() => setOpenNoteId((prev) => (prev === n.id ? null : n.id))}
          onReply={onReply}
          onDelete={onDelete}
          onOpenPhoto={onOpenPhoto}
        />
      ))}
    </div>
  );
}

function NoteItem({
  note,
  replies,
  me,
  open,
  onToggle,
  onReply,
  onDelete,
  onOpenPhoto,
}: {
  note: NoteVM;
  replies: NoteVM[];
  me: Person;
  open: boolean;
  onToggle: () => void;
  onReply: (noteId: string, text: string) => Promise<void>;
  onDelete: (noteId: string) => void;
  onOpenPhoto: (photos: PhotoVM[], index: number) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [askDeleteTarget, setAskDeleteTarget] = useState<NoteVM | null>(null);

  const isMine = note.by === me;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = replyText.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await onReply(note.id, t);
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onToggle();
        }}
        className="rounded-[18px] p-4 flex flex-col gap-2 text-left cursor-pointer transition-shadow"
        style={{
          background: HONEY.card,
          border: `1px solid ${open ? HONEY.accent : HONEY.line}`,
          boxShadow: open
            ? '0 0 0 1.5px rgba(179,98,20,0.3), 0 2px 6px rgba(70,55,60,0.05)'
            : HONEY.shadowCard,
        }}
      >
        <div className="flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: HONEY.faint }}>
          <span>{note.by}</span>
          {note.page && <span className="tabular-nums">· {note.page}쪽</span>}
        </div>

        {note.text && (
          <p
            className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words"
            style={{ color: HONEY.ink }}
          >
            {note.text}
          </p>
        )}

        {note.photo && (
          <div
            className="self-start rounded-xl overflow-hidden mt-1 select-none"
            style={{
              maxWidth: '100%',
              aspectRatio:
                note.photo.width && note.photo.height
                  ? `${note.photo.width} / ${note.photo.height}`
                  : '4 / 3',
              maxHeight: 220,
              background: 'var(--sd-surface-2)',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPhoto([note.photo!], 0);
              }}
              aria-label="사진 크게 보기"
              className="w-full h-full block"
            >
              <img
                src={note.photo.thumbUrl || note.photo.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        )}
      </div>

      {replies.map((r) => {
        const replyAuthor = r.by === me ? '내가 이어 남김' : r.by === '우댕' ? '우댕이 이어 남김' : '꼼이가 이어 남김';
        return (
          <div key={r.id} className="relative ml-6 pl-1 flex flex-col">
            <div className="absolute -top-1.5 left-4 flex flex-col items-center pointer-events-none">
              <span
                className="w-1.5 h-1.5 rounded-full bg-white/[0.92] border -mb-0.5"
                style={{ borderColor: HONEY.line }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full bg-white/[0.92] border"
                style={{ borderColor: HONEY.line }}
              />
            </div>
            <div
              className="rounded-[18px] px-4 py-3 flex flex-col gap-1 bg-white/[0.92] border"
              style={{
                borderColor: HONEY.line,
                boxShadow: '0 2px 8px -2px rgba(70,40,50,0.06)',
              }}
            >
              <div
                className="flex items-center justify-between text-[11.5px] font-bold"
                style={{ color: HONEY.faint }}
              >
                <span>{replyAuthor}</span>
                {open && r.by === me && (
                  <button
                    type="button"
                    onClick={() => setAskDeleteTarget(r)}
                    className="font-bold min-h-[28px] px-1"
                    style={{ color: HONEY.faint }}
                  >
                    지우기
                  </button>
                )}
              </div>
              <p
                className="text-[14px] leading-relaxed whitespace-pre-wrap break-words"
                style={{ color: HONEY.ink }}
              >
                {r.text}
              </p>
            </div>
          </div>
        );
      })}

      {open && (
        <div className="ml-6 flex flex-col gap-2 pt-1">
          <form onSubmit={handleSendReply} className="flex gap-2">
            <input
              id={`reply-input-${note.id}`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={500}
              placeholder={isMine ? '이어서 한 줄 더' : '여기에 한 줄 이어 남기기'}
              className="flex-1 min-w-0 rounded-xl px-3.5 py-2 text-[16px] outline-none"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              aria-label="이어 남기기"
              className="px-3 rounded-xl text-white disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              style={{ background: HONEY.accent }}
            >
              <Send size={16} />
            </button>
          </form>

          {isMine && (
            <button
              type="button"
              onClick={() => setAskDeleteTarget(note)}
              className="self-start text-[12px] font-bold min-h-[32px] px-1"
              style={{ color: HONEY.faint }}
            >
              이 기록 지우기
            </button>
          )}
        </div>
      )}

      {askDeleteTarget && (
        <div
          className="ml-6 rounded-xl p-3 flex items-center justify-between gap-2 text-[13px]"
          style={{ background: 'var(--sd-surface-2)', border: `1px solid ${HONEY.line}` }}
        >
          <span style={{ color: HONEY.muted }}>
            {askDeleteTarget.id === note.id
              ? '이어진 말도 같이 지워져요. 지울까요?'
              : '지울까요?'}
          </span>
          <span className="flex gap-3 font-bold shrink-0">
            <button
              type="button"
              className="min-h-[32px] px-2"
              style={{ color: HONEY.faint }}
              onClick={() => setAskDeleteTarget(null)}
            >
              아니요
            </button>
            <button
              type="button"
              className="min-h-[32px] px-2"
              style={{ color: HONEY.crit }}
              onClick={() => {
                const targetId = askDeleteTarget.id;
                setAskDeleteTarget(null);
                onDelete(targetId);
              }}
            >
              지우기
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
