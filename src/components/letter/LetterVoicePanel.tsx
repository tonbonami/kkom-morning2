// src/components/letter/LetterVoicePanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic, StopCircle, PlayCircle, PauseCircle, Trash2 } from 'lucide-react';

export interface LetterVoicePanelProps {
  state: 'idle' | 'recording' | 'recorded';
  secLeft: number;
  duration: number;
  playing: boolean;
  onStart: () => void;
  onStop: () => void;
  onTogglePlay: () => void;
  onDelete: () => void;
}

export function LetterVoicePanel({
  state,
  secLeft,
  duration,
  playing,
  onStart,
  onStop,
  onTogglePlay,
  onDelete,
}: LetterVoicePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `00:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      {state === 'idle' && (
        <>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onStart}
            className="flex items-center gap-2 text-lg font-semibold bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] px-6 py-3 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]"
          >
            <Mic size={24} />
            <span>녹음 시작</span>
          </motion.button>
          <p className="mt-2 text-[var(--sd-muted)] text-sm">30초까지</p>
        </>
      )}

      {state === 'recording' && (
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ scale: prefersReducedMotion ? 1 : [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex items-center justify-center bg-red-500/20 rounded-full w-24 h-24"
          >
            <Mic size={40} className="text-red-600" />
            <span className="absolute text-red-600 text-sm font-bold -bottom-4">
              {secLeft > 0 ? formatTime(secLeft) : '00:00'}
            </span>
          </motion.div>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onStop}
            className="mt-6 flex items-center gap-2 text-lg font-semibold bg-[var(--sd-rel)] text-white px-6 py-3 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]"
          >
            <StopCircle size={24} />
            <span>녹음 멈춤</span>
          </motion.button>
        </div>
      )}

      {state === 'recorded' && (
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onTogglePlay}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] min-h-[44px] min-w-[44px]"
          >
            {playing ? <PauseCircle size={28} /> : <PlayCircle size={28} />}
          </motion.button>
          <span className="text-xl font-['IBM_Plex_Sans_KR'] tabular-nums">
            {formatTime(duration)}
          </span>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onDelete}
            className="flex items-center justify-center w-12 h-12 rounded-full text-[var(--sd-muted)] hover:bg-[var(--sd-surface-2)] min-h-[44px] min-w-[44px]"
          >
            <Trash2 size={24} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
