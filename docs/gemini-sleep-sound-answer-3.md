```tsx
// src/components/SleepSoundScreen.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface SleepSoundOption {
  id: string;
  name: string;
  desc: string;
}

export interface SleepSoundScreenProps {
  sounds: SleepSoundOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  endMode: 'morning' | 'forever';
  onEndModeChange: (m: 'morning' | 'forever') => void;
  morningTime: string;
  onMorningTimeChange: (t: string) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  playing: boolean;
  remainingText?: string;
  available: boolean;
  onPlay: () => void;
  onStop: () => void;
  onBack: () => void;
}

export function SleepSoundScreen({
  sounds,
  selectedId,
  onSelect,
  endMode,
  onEndModeChange,
  morningTime,
  onMorningTimeChange,
  volume,
  onVolumeChange,
  playing,
  remainingText,
  available,
  onPlay,
  onStop,
  onBack,
}: SleepSoundScreenProps) {
  const selectedSound = sounds.find((s) => s.id === selectedId);

  // Background animation variants
  const backgroundVariants = {
    play: {
      opacity: [0.05, 0.1, 0.05],
      scale: [1, 1.02, 1],
      transition: {
        duration: 8,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
    stop: { opacity: 0 },
  };

  return (
    <div
      className="
        relative w-full min-h-[100dvh]
        flex flex-col text-[var(--sd-muted)]
        pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
        bg-[#1a1514] text-[#F1EBEA]
      "
    >
      {playing && (
        <motion.div
          className="absolute inset-0 bg-[var(--sd-rel)]" // Subtle coral overlay
          variants={backgroundVariants}
          initial="stop"
          animate={playing ? 'play' : 'stop'}
        />
      )}

      <div className="relative z-10 flex flex-col flex-grow max-w-md mx-auto w-full px-4 sm:px-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between h-14 flex-shrink-0">
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--sd-faint)]"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-xl font-extrabold text-[var(--sd-card-solid)] flex-grow text-center pr-10">
            잠 소리
          </h1>
        </div>

        {/* Central Play/Pause Button */}
        <div className="flex-grow flex flex-col items-center justify-center my-4">
          <motion.button
            onClick={playing ? onStop : onPlay}
            whileTap={{ scale: 0.9 }}
            className={`
              w-28 h-28 rounded-full flex items-center justify-center
              ${playing ? 'bg-[var(--sd-rel)] text-white shadow-[var(--sd-rel-shadow)]' : 'bg-[var(--sd-surface-2)] text-[var(--sd-rel)] shadow-md'}
              transition-all duration-200 ease-in-out
            `}
            disabled={!available}
          >
            {available ? (
              playing ? (
                <Pause size={48} fill="currentColor" />
              ) : (
                <Play size={48} fill="currentColor" />
              )
            ) : (
              <span className="text-sm px-2 text-center">앱 전용</span>
            )}
          </motion.button>
          <p className="mt-4 text-2xl font-bold text-[var(--sd-card-solid)]">
            {selectedSound?.name || '소리를 선택하세요'}
          </p>
          {playing && remainingText && (
            <p className="text-[var(--sd-muted)] text-sm mt-1">{remainingText}</p>
          )}
        </div>

        {/* Sound Options */}
        <div className={`grid ${sounds.length === 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mb-6 flex-shrink-0`}>
          {sounds.map((sound) => (
            <motion.button
              key={sound.id}
              onClick={() => onSelect(sound.id)}
              whileTap={{ scale: 0.95 }}
              className={`
                flex flex-col items-center justify-center py-3 px-2 rounded-xl text-center text-sm
                ${selectedId === sound.id ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
                transition-colors duration-200
              `}
              style={{
                boxShadow: selectedId === sound.id ? 'var(--sd-rel-shadow)' : 'none',
              }}
            >
              <span className="text-base">{sound.name}</span>
              <span className="text-xs text-[var(--sd-muted)] mt-0.5">{sound.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* End Mode */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-shrink-0">
          <motion.button
            onClick={() => onEndModeChange('morning')}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm
              ${endMode === 'morning' ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
              transition-colors duration-200
            `}
          >
            <Moon size={18} />
            <span>아침까지</span>
          </motion.button>
          <motion.button
            onClick={() => onEndModeChange('forever')}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm
              ${endMode === 'forever' ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
              transition-colors duration-200
            `}
          >
            <Moon size={18} />
            <span>계속</span>
          </motion.button>
        </div>

        {endMode === 'morning' && (
          <div className="flex items-center justify-center mb-6 flex-shrink-0">
            <input
              type="time"
              value={morningTime}
              onChange={(e) => onMorningTimeChange(e.target.value)}
              className="
                bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)] text-2xl font-bold tabular-nums
                rounded-xl py-3 px-4 w-36 text-center appearance-none
                focus:outline-none focus:ring-2 focus:ring-[var(--sd-rel)]
              "
              style={{
                background: 'rgba(255,255,255,.08)',
                color: 'var(--sd-card-solid)',
                border: 'none',
              }}
            />
          </div>
        )}

        {/* Volume Slider */}
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <VolumeX size={24} className="text-[var(--sd-faint)]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="
              flex-grow h-3 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-runnable-track]:bg-[rgba(255,255,255,.15)]
              [&::-webkit-slider-runnable-track]:h-2
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-[var(--sd-rel)]
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:-mt-[5px]
              [&::-webkit-slider-thumb]:shadow-[var(--sd-rel-shadow)]
            "
            style={{
              '--range-shdw': 'var(--sd-rel-shadow)',
              '--track-bg': 'rgba(255,255,255,.15)',
              '--thumb-bg': 'var(--sd-rel)',
              '--thumb-shadow': 'var(--sd-rel-shadow)',
              '--thumb-mt': '-5px',
              '--thumb-size': '20px',
              '--track-height': '8px',
            } as React.CSSProperties}
          />
          <Volume2 size={24} className="text-[var(--sd-card-solid)]" />
        </div>

        {/* Bottom Info */}
        <p className="text-center text-xs text-[var(--sd-faint)] flex-shrink-0">
          화면을 잠가도 계속 나와요 · 아침 알람은 그대로 울려요
        </p>

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white text-lg font-bold text-center p-4 rounded-xl z-20">
            꼼모닝 아이폰 앱에서만 재생돼요
          </div>
        )}
      </div>
    </div>
  );
}
```
```tsx
// src/components/SleepSoundScreen.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface SleepSoundOption {
  id: string;
  name: string;
  desc: string;
}

export interface SleepSoundScreenProps {
  sounds: SleepSoundOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  endMode: 'morning' | 'forever';
  onEndModeChange: (m: 'morning' | 'forever') => void;
  morningTime: string;
  onMorningTimeChange: (t: string) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  playing: boolean;
  remainingText?: string;
  available: boolean;
  onPlay: () => void;
  onStop: () => void;
  onBack: () => void;
}

export function SleepSoundScreen({
  sounds,
  selectedId,
  onSelect,
  endMode,
  onEndModeChange,
  morningTime,
  onMorningTimeChange,
  volume,
  onVolumeChange,
  playing,
  remainingText,
  available,
  onPlay,
  onStop,
  onBack,
}: SleepSoundScreenProps) {
  const selectedSound = sounds.find((s) => s.id === selectedId);

  // Background animation variants
  const backgroundVariants = {
    play: {
      opacity: [0.05, 0.1, 0.05],
      scale: [1, 1.02, 1],
      transition: {
        duration: 8,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
    stop: { opacity: 0 },
  };

  return (
    <div
      className="
        relative w-full min-h-[100dvh]
        flex flex-col text-[var(--sd-muted)]
        pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
        bg-[#1a1514] text-[#F1EBEA]
      "
    >
      {playing && (
        <motion.div
          className="absolute inset-0 bg-[var(--sd-rel)]" // Subtle coral overlay
          variants={backgroundVariants}
          initial="stop"
          animate={playing ? 'play' : 'stop'}
        />
      )}

      <div className="relative z-10 flex flex-col flex-grow max-w-md mx-auto w-full px-4 sm:px-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between h-14 flex-shrink-0">
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--sd-faint)]"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-xl font-extrabold text-[var(--sd-card-solid)] flex-grow text-center pr-10">
            잠 소리
          </h1>
        </div>

        {/* Central Play/Pause Button */}
        <div className="flex-grow flex flex-col items-center justify-center my-4">
          <motion.button
            onClick={playing ? onStop : onPlay}
            whileTap={{ scale: 0.9 }}
            className={`
              w-28 h-28 rounded-full flex items-center justify-center
              ${playing ? 'bg-[var(--sd-rel)] text-white shadow-[var(--sd-rel-shadow)]' : 'bg-[var(--sd-surface-2)] text-[var(--sd-rel)] shadow-md'}
              transition-all duration-200 ease-in-out
            `}
            disabled={!available}
          >
            {available ? (
              playing ? (
                <Pause size={48} fill="currentColor" />
              ) : (
                <Play size={48} fill="currentColor" />
              )
            ) : (
              <span className="text-sm px-2 text-center">앱 전용</span>
            )}
          </motion.button>
          <p className="mt-4 text-2xl font-bold text-[var(--sd-card-solid)]">
            {selectedSound?.name || '소리를 선택하세요'}
          </p>
          {playing && remainingText && (
            <p className="text-[var(--sd-muted)] text-sm mt-1">{remainingText}</p>
          )}
        </div>

        {/* Sound Options */}
        <div className={`grid ${sounds.length === 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mb-6 flex-shrink-0`}>
          {sounds.map((sound) => (
            <motion.button
              key={sound.id}
              onClick={() => onSelect(sound.id)}
              whileTap={{ scale: 0.95 }}
              className={`
                flex flex-col items-center justify-center py-3 px-2 rounded-xl text-center text-sm
                ${selectedId === sound.id ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
                transition-colors duration-200
              `}
              style={{
                boxShadow: selectedId === sound.id ? 'var(--sd-rel-shadow)' : 'none',
              }}
            >
              <span className="text-base">{sound.name}</span>
              <span className="text-xs text-[var(--sd-muted)] mt-0.5">{sound.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* End Mode */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-shrink-0">
          <motion.button
            onClick={() => onEndModeChange('morning')}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm
              ${endMode === 'morning' ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
              transition-colors duration-200
            `}
          >
            <Moon size={18} />
            <span>아침까지</span>
          </motion.button>
          <motion.button
            onClick={() => onEndModeChange('forever')}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-grow flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm
              ${endMode === 'forever' ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-bold' : 'bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)]'}
              transition-colors duration-200
            `}
          >
            <Moon size={18} />
            <span>계속</span>
          </motion.button>
        </div>

        {endMode === 'morning' && (
          <div className="flex items-center justify-center mb-6 flex-shrink-0">
            <input
              type="time"
              value={morningTime}
              onChange={(e) => onMorningTimeChange(e.target.value)}
              className="
                bg-[rgba(255,255,255,.08)] text-[var(--sd-card-solid)] text-2xl font-bold tabular-nums
                rounded-xl py-3 px-4 w-36 text-center appearance-none
                focus:outline-none focus:ring-2 focus:ring-[var(--sd-rel)]
              "
              style={{
                background: 'rgba(255,255,255,.08)',
                color: 'var(--sd-card-solid)',
                border: 'none',
              }}
            />
          </div>
        )}

        {/* Volume Slider */}
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <VolumeX size={24} className="text-[var(--sd-faint)]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="
              flex-grow h-3 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-runnable-track]:bg-[rgba(255,255,255,.15)]
              [&::-webkit-slider-runnable-track]:h-2
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-[var(--sd-rel)]
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:-mt-[5px]
              [&::-webkit-slider-thumb]:shadow-[var(--sd-rel-shadow)]
            "
            style={{
              '--range-shdw': 'var(--sd-rel-shadow)',
              '--track-bg': 'rgba(255,255,255,.15)',
              '--thumb-bg': 'var(--sd-rel)',
              '--thumb-shadow': 'var(--sd-rel-shadow)',
              '--thumb-mt': '-5px',
              '--thumb-size': '20px',
              '--track-height': '8px',
            } as React.CSSProperties}
          />
          <Volume2 size={24} className="text-[var(--sd-card-solid)]" />
        </div>

        {/* Bottom Info */}
        <p className="text-center text-xs text-[var(--sd-faint)] flex-shrink-0">
          화면을 잠가도 계속 나와요 · 아침 알람은 그대로 울려요
        </p>

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white text-lg font-bold text-center p-4 rounded-xl z-20">
            꼼모닝 아이폰 앱에서만 재생돼요
          </div>
        )}
      </div>
    </div>
  );
}
```
