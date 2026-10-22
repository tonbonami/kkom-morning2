'use client';
// 제미나이 시안(2026-10-22, gemini-3-flash CLI) — 이모티콘 위·글 말풍선 아래 한 묶음(카톡). 값 그대로.

import React from 'react';

export default function StickerTextStack({
  mine,
  sticker,
  children,
}: {
  mine: boolean;
  sticker: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
      <div className="px-1">{sticker}</div>
      {children}
    </div>
  );
}
