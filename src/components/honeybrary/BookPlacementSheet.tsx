// src/components/honeybrary/BookPlacementSheet.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ImagePlus } from 'lucide-react';
import { partnerOf, type Person, type Visibility } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';
import { HoneySheet } from './HoneySheet';
import { BookVisibilityChoice } from './BookVisibilityChoice';

export interface BookPlacementSheetProps {
  open: boolean;
  me: Person;
  busy: boolean;
  error?: string | null;
  onSubmit: (v: {
    title: string;
    readerMode: 'me' | 'partner' | 'both';
    current?: number;
    total?: number;
    cover: File | null;
    visibility: Visibility;
  }) => void;
  onClose: () => void;
}

export function BookPlacementSheet({
  open,
  me,
  busy,
  error,
  onSubmit,
  onClose,
}: BookPlacementSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('shared');
  const [readerMode, setReaderMode] = useState<'me' | 'partner' | 'both'>('me');
  const [current, setCurrent] = useState('');
  const [total, setTotal] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setVisibility('shared');
    setReaderMode('me');
    setCurrent('');
    setTotal('');
    setCover(null);
    setPreview(null);
  }, [open]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const num = (s: string) => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const c = num(current);
  const t = num(total);
  const tooFar = !!(c && t && c > t);

  const handleSave = () => {
    if (!title.trim() || busy || tooFar) return;
    onSubmit({
      title: title.trim(),
      readerMode: visibility === 'private' ? 'me' : readerMode,
      current: c,
      total: t,
      cover,
      visibility,
    });
  };

  return (
    <HoneySheet open={open} title="책 놓기" onClose={onClose}>
      <div className="flex flex-col gap-5 pt-1">
        <div className="flex gap-4 items-end">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="표지 사진 고르기"
            className="shrink-0 rounded-[10px] overflow-hidden flex items-center justify-center transition-opacity active:opacity-85"
            style={{
              width: 84,
              height: 126,
              border: preview ? 'none' : `1.5px dashed ${HONEY.line}`,
              background: preview ? 'transparent' : HONEY.card,
            }}
          >
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span
                className="flex flex-col items-center text-center gap-1 text-[11.5px] px-2 leading-tight"
                style={{ color: HONEY.faint }}
              >
                <ImagePlus size={20} />
                표지 사진<br />(안 넣어도 돼요)
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setCover(f);
              setPreview(f ? URL.createObjectURL(f) : null);
              e.target.value = '';
            }}
          />
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-bold" style={{ color: HONEY.muted }}>
              책 제목
            </span>
            <input
              id="book-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="예) 소년이 온다"
              autoComplete="off"
              className="w-full rounded-xl px-3.5 py-3 text-[16px] outline-none"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            />
          </label>
        </div>

        <BookVisibilityChoice
          value={visibility}
          partnerName={partnerOf(me)}
          onChange={(v) => {
            setVisibility(v);
            if (v === 'private') {
              setReaderMode('me');
            }
          }}
        />

        {visibility === 'shared' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-bold" style={{ color: HONEY.muted }}>
              누가 읽어요?
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'me' as const, label: '나' },
                { mode: 'partner' as const, label: partnerOf(me) },
                { mode: 'both' as const, label: '같이' },
              ].map((opt) => {
                const active = readerMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setReaderMode(opt.mode)}
                    aria-pressed={active}
                    className="h-[44px] rounded-xl text-[14px] font-bold transition-colors"
                    style={
                      active
                        ? { background: HONEY.accent, color: HONEY.accentInk }
                        : {
                            background: HONEY.card,
                            color: HONEY.muted,
                            border: `1px solid ${HONEY.line}`,
                          }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold" style={{ color: HONEY.muted }}>
            어디까지 읽었어요?{' '}
            <span className="font-medium" style={{ color: HONEY.faint }}>
              · 안 적어도 돼요
            </span>
          </span>
          <div className="flex items-center gap-2">
            <input
              id="book-current"
              inputMode="numeric"
              value={current}
              onChange={(e) =>
                setCurrent(e.target.value.replace(/\D/g, '').slice(0, 5))
              }
              placeholder="지금 쪽"
              className="w-full rounded-xl px-3.5 py-3 text-[16px] outline-none tabular-nums"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            />
            <span style={{ color: HONEY.faint }}>/</span>
            <input
              id="book-total"
              inputMode="numeric"
              value={total}
              onChange={(e) =>
                setTotal(e.target.value.replace(/\D/g, '').slice(0, 5))
              }
              placeholder="전체 쪽"
              className="w-full rounded-xl px-3.5 py-3 text-[16px] outline-none tabular-nums"
              style={{
                background: HONEY.card,
                border: `1px solid ${HONEY.line}`,
                color: HONEY.ink,
              }}
            />
          </div>
          {tooFar && (
            <p className="text-[12px]" style={{ color: HONEY.crit }}>
              지금 쪽이 전체 쪽보다 커요.
            </p>
          )}
        </div>

        {error && (
          <p className="text-[13px]" style={{ color: HONEY.crit }}>
            {error}
          </p>
        )}

        <motion.button
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          onClick={handleSave}
          disabled={!title.trim() || busy || tooFar}
          className="w-full h-[50px] rounded-[18px] text-[15px] font-bold text-white disabled:opacity-50 flex items-center justify-center transition-opacity mt-2 min-h-[44px]"
          style={{ background: HONEY.accent, color: HONEY.accentInk }}
        >
          {busy ? '놓는 중…' : '책장에 놓기'}
        </motion.button>
      </div>
    </HoneySheet>
  );
}
