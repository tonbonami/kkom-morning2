// src/components/honeybrary/NoteComposerSheet.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { LIMITS } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneySheet } from '@/components/honeybrary/HoneySheet';

export interface NoteComposerSheetProps {
  open: boolean;
  busy: boolean;
  error?: string | null;
  onSubmit: (v: { text: string; page?: number; photo: File | null }) => void;
  onClose: () => void;
}

export function NoteComposerSheet({
  open,
  busy,
  error,
  onSubmit,
  onClose,
}: NoteComposerSheetProps) {
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText('');
      setPage('');
      setPhoto(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const canSubmit = (text.trim().length > 0 || photo !== null) && !busy;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const p = parseInt(page, 10);
    onSubmit({
      text: text.trim(),
      page: Number.isFinite(p) && p > 0 ? p : undefined,
      photo,
    });
  };

  return (
    <HoneySheet
      open={open}
      title="기록 남기기"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          {error && (
            <p className="text-[12.5px] px-1" style={{ color: HONEY.crit }}>
              {error}
            </p>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 rounded-2xl text-[15px] font-bold text-white disabled:opacity-40 min-h-[44px]"
            style={{
              background: HONEY.accent,
              boxShadow: canSubmit ? '0 4px 14px -4px rgba(179,98,20,0.4)' : undefined,
            }}
          >
            {busy ? '남기는 중…' : '남기기'}
          </motion.button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <textarea
          id="note-composer-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={LIMITS.note}
          placeholder="마음에 남은 문장, 밑줄 친 곳, 떠오른 생각"
          className="w-full rounded-2xl p-3.5 text-[16px] outline-none resize-none leading-relaxed"
          style={{
            background: HONEY.card,
            border: `1px solid ${HONEY.line}`,
            color: HONEY.ink,
          }}
        />

        <div className="flex items-center gap-2">
          <label htmlFor="note-page-input" className="text-[13.5px] font-bold shrink-0" style={{ color: HONEY.muted }}>
            몇 쪽?
          </label>
          <input
            id="note-page-input"
            inputMode="numeric"
            value={page}
            onChange={(e) => setPage(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="안 적어도 돼요"
            className="w-36 rounded-xl px-3 py-2 text-[16px] outline-none tabular-nums"
            style={{
              background: HONEY.card,
              border: `1px solid ${HONEY.line}`,
              color: HONEY.ink,
            }}
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (preview) URL.revokeObjectURL(preview);
              setPhoto(f);
              setPreview(f ? URL.createObjectURL(f) : null);
              e.target.value = '';
            }}
          />

          {preview ? (
            <div className="relative inline-block self-start">
              <img
                src={preview}
                alt=""
                className="h-28 rounded-xl object-cover border"
                style={{ borderColor: HONEY.line }}
              />
              <button
                type="button"
                onClick={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setPhoto(null);
                  setPreview(null);
                }}
                aria-label="사진 빼기"
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white min-w-[28px] min-h-[28px]"
                style={{ background: 'rgba(46,29,38,0.85)' }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed text-[13.5px] font-bold min-h-[44px]"
              style={{
                borderColor: HONEY.line,
                background: 'var(--sd-surface-2)',
                color: HONEY.muted,
              }}
            >
              <ImagePlus size={18} />
              <span>사진 한 장 (표지·밑줄·읽은 자리)</span>
            </button>
          )}
        </div>
      </div>
    </HoneySheet>
  );
}
