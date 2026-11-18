// src/components/diary/DiaryObjectToolbar.tsx
'use client';

import React from 'react';
import { ZoomOut, ZoomIn, RotateCcw, RotateCw, ArrowUpToLine, ArrowDownToLine, Copy, Trash2, Check } from 'lucide-react';
import { DiaryItemAction } from '@/lib/diaryTypes';

export interface DiaryObjectToolbarProps {
  onAction: (a: DiaryItemAction) => void;
  onDone: () => void;
}

export function DiaryObjectToolbar({ onAction, onDone }: DiaryObjectToolbarProps): React.JSX.Element {
  return (
    <div
      className="w-full bg-[var(--sd-card-solid)] border border-[var(--sd-line)] rounded-2xl shadow-lg px-2 py-1.5 flex items-center justify-between"
      style={{ touchAction: 'none' }}
    >
      {/* 여덟 단추가 폭을 똑같이 나눠 쓴다 — 시안은 가로로 밀리는 줄이라 390px 에서 「지우기」가 「완료」 밑에 깔렸다 */}
      <div className="flex-1 min-w-0 grid grid-cols-8 py-0.5">
        <button
          type="button"
          onClick={() => onAction('smaller')}
          className="min-w-0 min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <ZoomOut className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">작게</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('larger')}
          className="min-w-0 min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <ZoomIn className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">크게</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('rotateLeft')}
          className="min-w-0 min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <RotateCcw className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">↺15°</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('rotateRight')}
          className="min-w-0 min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <RotateCw className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">↻15°</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('front')}
          className="min-w-0 min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <ArrowUpToLine className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">앞으로</span>
        </button>

        {/* 「뒤로」 — 필기를 스티커·사진 밑에 깔 때(필기 2단계, 11/18) */}
        <button
          type="button"
          onClick={() => onAction('back')}
          className="min-w-0 min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <ArrowDownToLine className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">뒤로</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('duplicate')}
          className="min-w-0 min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-surface-2)] text-[var(--sd-ink)]"
        >
          <Copy className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">복제</span>
        </button>

        <button
          type="button"
          onClick={() => onAction('delete')}
          className="min-w-0 min-h-[44px] flex flex-col items-center justify-center rounded-xl active:bg-[var(--sd-rel-soft)] text-[var(--sd-crit)]"
        >
          <Trash2 className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-medium">지우기</span>
        </button>
      </div>

      <div className="h-7 w-[1px] bg-[var(--sd-line)] mx-1" />

      <button
        type="button"
        onClick={onDone}
        className="min-w-[48px] min-h-[44px] px-2 flex flex-col items-center justify-center rounded-xl bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-medium active:scale-95"
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        <span className="text-[10px] mt-0.5">완료</span>
      </button>
    </div>
  );
}
