// src/components/letter/LetterEnclosures.tsx
'use client';

import React from 'react';
import { Image } from 'lucide-react'; // Example icon for placeholder

export interface LetterEnclosuresProps {
  emoticons: { id: string; label: string; imageUrl: string }[];   // 큰 이모티콘 0~3개
  animated: { label: string; posterUrl: string; videoUrl: string } | null;   // 움직이는 포차코(영상)
  voice: React.ReactNode | null;    // 내가 기존 음성 재생기를 넣는다
  doodle: React.ReactNode | null;   // 내가 기존 손글씨 재생 판을 넣는다
}

export function LetterEnclosures({
  emoticons,
  animated,
  voice,
  doodle,
}: LetterEnclosuresProps) {
  const hasContent = emoticons.length > 0 || animated || voice || doodle;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {emoticons.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {emoticons.map((emo) => (
            <div key={emo.id} className="flex flex-col items-center">
              <img
                src={emo.imageUrl}
                alt={emo.label}
                className="w-16 h-16 rounded-lg object-contain"
              />
              <span className="text-[var(--sd-cardlabel)] text-xs mt-1 font-['IBM_Plex_Sans_KR']">
                {emo.label}
              </span>
            </div>
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
          <span className="text-[var(--sd-cardlabel)] text-sm mt-2 font-['IBM_Plex_Sans_KR']">
            {animated.label}
          </span>
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
