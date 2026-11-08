// src/components/honeybrary/PartnerReplyBubble.tsx
'use client';

import React, { useState } from 'react';
import { ThoughtBubble } from '@/components/letter/ThoughtBubble';
import { type Person, LIMITS } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface PartnerReplyBubbleProps {
  reply?: { by: Person; text: string };
  replier: Person;
  charSrc: string;
  canWrite: boolean;
  onSave?: (text: string) => Promise<void>;
}

export function PartnerReplyBubble({
  reply,
  replier,
  charSrc,
  canWrite,
  onSave,
}: PartnerReplyBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(reply?.text ?? '');
  const [busy, setBusy] = useState(false);

  if (!reply && !canWrite) {
    return null;
  }

  const handleSave = async () => {
    if (!onSave || busy) return;
    setBusy(true);
    try {
      await onSave(draft.trim());
      setIsEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setDraft(reply?.text ?? '');
    setIsEditing(false);
  };

  if (!reply && !isEditing && canWrite) {
    return (
      <div className="mt-2.5 pl-4">
        <button
          type="button"
          onClick={() => {
            setDraft('');
            setIsEditing(true);
          }}
          className="text-[13px] font-medium underline underline-offset-4 py-1.5 px-1 focus:outline-none"
          style={{ color: HONEY.muted }}
        >
          한마디 남기기
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3.5 pl-3 flex items-start gap-3">
      <div className="shrink-0 pt-0.5">
        <ThoughtBubble
          src={charSrc}
          size={56}
          tail="down-right"
          appear={false}
        />
      </div>

      <div
        className="flex-1 rounded-2xl p-4 border shadow-sm flex flex-col gap-1.5"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderColor: HONEY.line,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold" style={{ color: HONEY.muted }}>
            {replier}의 한마디
          </span>
          {canWrite && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setDraft(reply?.text ?? '');
                setIsEditing(true);
              }}
              className="text-[11.5px] font-medium underline underline-offset-2"
              style={{ color: HONEY.faint }}
            >
              고치기
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2 pt-1">
            <input
              type="text"
              maxLength={LIMITS.partnerReply}
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="한마디 남기기…"
              className="w-full text-[16px] px-3 py-2 rounded-xl border bg-white focus:outline-none"
              style={{ borderColor: HONEY.line, color: HONEY.ink }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] tabular-nums" style={{ color: HONEY.faint }}>
                {draft.length}/{LIMITS.partnerReply}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCancel}
                  className="text-[12.5px] font-medium py-1 px-2.5 rounded-lg"
                  style={{ color: HONEY.muted }}
                >
                  그만두기
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSave}
                  className="text-[12.5px] font-bold py-1 px-3 rounded-lg text-white"
                  style={{ backgroundColor: HONEY.accent }}
                >
                  {busy ? '남기는 중…' : '남기기'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed break-keep" style={{ color: HONEY.ink }}>
            {reply?.text}
          </p>
        )}
      </div>
    </div>
  );
}
