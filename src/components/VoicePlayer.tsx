'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoicePlayerProps {
  src: string;
  mime?: string;
  durationHint?: number;
  accent?: 'emerald' | 'mint';
  compact?: boolean;
}

// 가상의 웨이브폼 패턴
const WAVE_BARS = [
  35, 50, 25, 60, 80, 40, 55, 30, 70, 90, 45, 65, 35, 75, 50,
  85, 40, 60, 30, 70, 55, 35, 80, 45, 65, 25, 50, 40, 75, 35
];

export default function VoicePlayer({
  src,
  mime,
  durationHint,
  accent = 'emerald',
  compact = false,
}: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);

  const accentColor = accent === 'mint' ? 'bg-[#99E6D9]' : 'bg-[#10B981]';
  const heightClass = compact ? 'h-11' : 'h-14';
  const btnSizeClass = compact ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = compact ? 14 : 18;

  useEffect(() => {
    const handleOtherPlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== src) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('voice-play', handleOtherPlay);
    return () => window.removeEventListener('voice-play', handleOtherPlay);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current || error) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      window.dispatchEvent(new CustomEvent('voice-play', { detail: src }));
      audioRef.current.play().catch(() => setError(true));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration || durationHint || 1;
    setCurrentTime(current);
    setProgress(current / total);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || error) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = percent * duration;
    setProgress(percent);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`w-full ${heightClass} bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center px-2 py-1 select-none overflow-hidden`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setError(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      >
        {mime && <source src={src} type={mime} />}
      </audio>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        disabled={error}
        className={`shrink-0 flex items-center justify-center rounded-full ${accentColor} text-white shadow-sm disabled:opacity-50`}
        style={{ width: btnSizeClass.split(' ')[0].replace('w-', '') === '8' ? '32px' : '40px', height: btnSizeClass.split(' ')[1].replace('h-', '') === '8' ? '32px' : '40px' }}
      >
        {isPlaying ? (
          <Pause size={iconSize} fill="currentColor" />
        ) : (
          <Play size={iconSize} fill="currentColor" className="ml-0.5" />
        )}
      </motion.button>

      <div className="flex-1 mx-3 h-full flex items-center relative cursor-pointer" onClick={handleScrub}>
        {error ? (
          <div className="flex items-center text-[13px] text-slate-400 font-medium">
            <AlertCircle size={14} className="mr-1.5" /> 재생할 수 없는 음성이에요
          </div>
        ) : (
          <div className="w-full h-6 flex items-center justify-between gap-[2px]">
            {WAVE_BARS.map((height, i) => {
              const barPercent = i / WAVE_BARS.length;
              const isPlayed = progress > barPercent;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-colors duration-200 ${
                    isPlayed ? accentColor.replace('bg-', 'bg-').replace('10B981', '10B981/80') : 'bg-slate-200'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 min-w-[50px] text-right pr-2">
        <span className="text-[11px] font-bold text-slate-400 tabular-nums">
          {error ? '--:--' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
        </span>
      </div>
    </div>
  );
}
