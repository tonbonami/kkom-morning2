'use client';
// 피부 일지 화면 틀(연결용, 모양 없음) — 아이폰 상태바 자리에 아래 내용이 비쳐 '구멍'처럼 보이던 문제(우댕 2026-10-21).
// 상태바 높이만큼 덮개를 깔고, 그 아래부터 스크롤되는 상자에 화면을 넣는다 → 제미나이 화면의 sticky 머리가 상태바 바로 밑에 붙는다.
import React, { useEffect, useState } from 'react';
import { isPractice } from '@/lib/practice';

export default function SkinScreen({ children }: { children: React.ReactNode }) {
  const [practice, setPractice] = useState(false);
  useEffect(() => setPractice(isPractice()), []);
  return (
    <>
      {practice && (
        // 연습 모드 띠 — 화면 맨 아래(저장 막대 위)에 고정. 예시 기록이고 아무것도 저장·전송되지 않는다.
        <div className="fixed inset-x-0 z-40 flex justify-center pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 134px)' }}>
          <span className="px-3 py-1.5 rounded-full text-[12px] font-bold shadow" style={{ background: '#FDE68A', color: '#78350F' }}>
            🧪 연습 모드 — 예시 기록이에요 · 저장·사진·상담이 실제로 안 나가요
          </span>
        </div>
      )}
      <div aria-hidden className="fixed inset-x-0 top-0 z-30" style={{ height: 'env(safe-area-inset-top)', background: 'var(--sd-surface-2)' }} />
      <div className="fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain" style={{ top: 'env(safe-area-inset-top)', background: 'var(--sd-surface-2)' }}>
        {children}
      </div>
    </>
  );
}
