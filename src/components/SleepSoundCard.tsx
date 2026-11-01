// src/components/SleepSoundCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Play, Pause } from 'lucide-react';

export interface SleepSoundCardProps {
  playing: boolean;
  soundName: string;
  endText: string;
  available: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

export function SleepSoundCard({
  playing,
  soundName,
  endText,
  available,
  onToggle,
  onOpen,
}: SleepSoundCardProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (available && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); // Prevent default scroll behavior for spacebar
      onOpen();
    }
  };

  return (
    <motion.div
      onClick={available ? onOpen : undefined}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={available ? 0 : -1}
      whileTap={{ scale: available ? 0.98 : 1 }}
      className={`
        sd-card w-full h-full px-4 py-4 flex flex-col relative text-left transition-transform
        ${playing ? 'bg-[var(--sd-card-solid)] border-[var(--sd-rel-soft)] border-2' : ''}
        ${!available ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{
        backgroundColor: playing ? 'var(--sd-card-solid)' : 'rgba(255,255,255,.74)',
      }}
    >
      {/* Card name line */}
      <div className="flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--sd-cardlabel)] mb-2">
        <Moon size={16} />
        <span>잠 소리</span>
      </div>

      <div className="flex-grow flex flex-col justify-center items-start">
        <h3 className="text-[var(--sd-ink)] text-lg font-bold">
          {available ? soundName : '꼼모닝 앱에서 들을 수 있어요'}
        </h3>
        {available && (
          <p className="text-[var(--sd-muted)] text-sm mt-1">{endText}</p>
        )}
      </div>

      {/* Play/Pause Button */}
      {available && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation(); // Prevent onOpen from being called
            onToggle();
          }}
          whileTap={{ scale: 0.9 }}
          className={`
            absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center
            ${playing ? 'bg-[var(--sd-rel)] text-white shadow-[var(--sd-rel-shadow)]' : 'bg-white text-[var(--sd-rel)] shadow-[var(--sd-shadow-btn)]'}
            transition-all duration-200 ease-in-out
          `}
          // Subtle pulse animation when playing
          animate={playing ? {
            scale: [1, 1.05, 1],
            boxShadow: ['var(--sd-rel-shadow)', '0 0 0 8px rgba(228, 104, 94, 0.2), var(--sd-rel-shadow)', 'var(--sd-rel-shadow)']
          } : {}}
          transition={playing ? {
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
            delay: 0.5,
          } : {}}
        >
          {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </motion.button>
      )}
    </motion.div>
  );
}
