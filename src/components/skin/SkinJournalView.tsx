// 제미나이 시안(2026-10-21, 우댕 전달) — 값 그대로.
// SkinJournalView.tsx
import React from 'react';
import { ArrowLeft, LineChart } from 'lucide-react';

export default function SkinJournalView({
  header,
  week,
  form,
}: {
  header: { onBack: () => void; onOpenInsights: () => void };
  week: React.ReactNode;
  form: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--sd-surface-2)] text-[var(--sd-ink)] max-w-md mx-auto relative flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <button onClick={header.onBack} className="p-2 -ml-2 text-[var(--sd-ink)]">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">꼼이 피부 일지</h1>
        <button onClick={header.onOpenInsights} className="p-2 -mr-2 text-[var(--sd-rel)] flex items-center gap-1">
          <LineChart size={20} />
          <span className="text-sm font-bold">분석</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2">
        {week}
        <div className="mt-6 mb-2">
          <h2 className="text-xl font-bold text-[var(--sd-ink)] px-1">기록하기</h2>
        </div>
        {form}
      </div>
    </div>
  );
}
