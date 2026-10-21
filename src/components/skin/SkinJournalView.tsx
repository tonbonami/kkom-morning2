'use client';
// 제미나이 6차(gemini-3-flash CLI): 머리 줄 「분석」 옆 「상담」 버튼(header.onOpenChat) — 상담이 분석 맨 아래에만 있어 세 번 눌러야 갔다. 값 그대로.

import React from 'react';
import { ArrowLeft, LineChart, MessageCircle } from 'lucide-react';

export default function SkinJournalView({
  header,
  week,
  form,
  formTitle = '기록하기',
}: {
  header: { 
    onBack: () => void; 
    onOpenInsights: () => void; 
    onOpenChat: () => void;
  };
  week: React.ReactNode;
  form: React.ReactNode;
  formTitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--sd-surface-2)] text-[var(--sd-ink)] max-w-md mx-auto relative flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <button onClick={header.onBack} className="p-2 -ml-2 text-[var(--sd-ink)]" aria-label="뒤로 가기">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold truncate">꼼이 피부 일지</h1>
        <div className="flex items-center -mr-2">
          <button onClick={header.onOpenInsights} className="p-2 text-[var(--sd-rel)] flex items-center gap-1">
            <LineChart size={20} />
            <span className="text-sm font-bold">분석</span>
          </button>
          <button onClick={header.onOpenChat} className="p-2 text-[var(--sd-rel)] flex items-center gap-1">
            <MessageCircle size={20} />
            <span className="text-sm font-bold">상담</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2">
        {week}
        <div className="mt-6 mb-2">
          <h2 className="text-xl font-bold text-[var(--sd-ink)] px-1">{formTitle}</h2>
        </div>
        {form}
      </div>
    </div>
  );
}
