// src/components/letter/LetterEnclosures.tsx
'use client';

import React from 'react';
// import { Image } from 'lucide-react'; // Example icon for placeholder - not used anymore directly for emoticons

// Assuming SignedSticker is in the same directory
import { SignedSticker } from './SignedSticker';

export interface LetterEnclosuresProps {
  emoticons: { id: string; label: string; imageUrl: string }[];   // 큰 이모티콘 0~3개
  animated: { label: string; posterUrl: string; videoUrl: string } | null;   // 움직이는 포차코(영상)
  voice: React.ReactNode | null;    // 내가 기존 음성 재생기를 넣는다
  doodle: React.ReactNode | null;   // 내가 기존 손글씨 재생 판을 넣는다
  sign?: string; // 보낸 사람 사인 (Kkomi/Kkuldang)
}

export function LetterEnclosures({
  emoticons,
  animated,
  voice,
  doodle,
  sign,
}: LetterEnclosuresProps) {
  const hasContent = emoticons.length > 0 || animated || voice || doodle;

  if (!hasContent) {
    return null;
  }

  // Determine sticker size based on count
  const getStickerSize = (count: number) => {
    if (count === 1) return 160; // 1개면 크게
    if (count === 2) return 140; // 2개면 나란히 (140 * 2 + gap)
    if (count === 3) return 96;  // 3개면 나란히 (96 * 3 + gap)
    return 64; // Fallback, though we expect 0-3
  };

  const stickerSize = getStickerSize(emoticons.length);

  return (
    <div className="flex flex-col gap-4">
      {emoticons.length > 0 && (
        <div className={`flex flex-wrap justify-center ${emoticons.length > 1 ? 'gap-2 max-w-xs mx-auto' : ''}`}>
          {emoticons.map((emo) => (
            <SignedSticker
              key={emo.id}
              src={emo.imageUrl}
              alt={emo.label}
              size={stickerSize}
              sign={sign}
              // tilt property is optional, default is -7. Can be explicitly passed if needed.
            />
          ))}
        </div>
      )}

      {animated && (
        <div className="flex flex-col items-center">
          <video
            src={animated.videoUrl}
            poster={animated.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-32 h-32 rounded-lg object-cover"
          />
          {/* Label removed as per new design */}
        </div>
      )}

      {voice && (
        <div className="w-full flex justify-center">
          {voice}
        </div>
      )}

      {doodle && (
        <div className="w-full flex justify-center">
          {doodle}
        </div>
      )}
    </div>
  );
}
