// src/components/honeybrary/BookVisibilityChoice.tsx
'use client';

import React from 'react';
import { Users, Lock } from 'lucide-react';
import type { Visibility } from '@/lib/honeybraryTypes';
import { HONEY } from '@/lib/honeybraryTheme';

export interface BookVisibilityChoiceProps {
  value: Visibility;
  onChange: (v: Visibility) => void;
  partnerName: string;
  disabled?: boolean;
}

export function BookVisibilityChoice({
  value,
  onChange,
  partnerName,
  disabled = false,
}: BookVisibilityChoiceProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12.5px] font-bold" style={{ color: HONEY.muted }}>
        누구 화면에 둘까요?
      </span>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('shared')}
          aria-pressed={value === 'shared'}
          className="min-h-[58px] p-2.5 rounded-xl text-left flex flex-col justify-center transition-colors disabled:opacity-50"
          style={
            value === 'shared'
              ? {
                  background: HONEY.accentSoft,
                  color: HONEY.accentSoftInk,
                  border: `1.5px solid ${HONEY.accent}`,
                }
              : {
                  background: HONEY.card,
                  color: HONEY.muted,
                  border: `1px solid ${HONEY.line}`,
                }
          }
        >
          <span className="flex items-center gap-1.5 text-[14px] font-bold">
            <Users size={16} />
            같이 보기
          </span>
          <span className="text-[11.5px] mt-0.5 opacity-80 truncate">
            {partnerName}도 볼 수 있어요
          </span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('private')}
          aria-pressed={value === 'private'}
          className="min-h-[58px] p-2.5 rounded-xl text-left flex flex-col justify-center transition-colors disabled:opacity-50"
          style={
            value === 'private'
              ? {
                  background: HONEY.accentSoft,
                  color: HONEY.accentSoftInk,
                  border: `1.5px solid ${HONEY.accent}`,
                }
              : {
                  background: HONEY.card,
                  color: HONEY.muted,
                  border: `1px solid ${HONEY.line}`,
                }
          }
        >
          <span className="flex items-center gap-1.5 text-[14px] font-bold">
            <Lock size={15} />
            혼자 보기
          </span>
          <span className="text-[11.5px] mt-0.5 opacity-80 truncate">
            내 화면에만 보여요
          </span>
        </button>
      </div>

      {value === 'private' && (
        <p className="text-[11.5px] leading-relaxed pl-1" style={{ color: HONEY.faint }}>
          혼자 천천히 읽고 싶은 책이라면 내 화면에만 둘 수 있어요. 비밀번호로 잠그는 보관함은 아니에요.
        </p>
      )}
    </div>
  );
}
