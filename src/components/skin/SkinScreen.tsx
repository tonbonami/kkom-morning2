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
      <div aria-hidden className="fixed inset-x-0 top-0 z-30" style={{ height: 'env(safe-area-inset-top)', background: 'var(--sd-surface-2)' }} />
      {/* break-keep: 한글이 「비/교하기」처럼 단어 중간에서 안 끊기게. 글자색 기본값도 여기서(다크 모드에서 색 없는 글자가 묻히던 것 — Aside 2차) */}
      <div className="fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain break-keep" style={{ top: 'env(safe-area-inset-top)', background: 'var(--sd-surface-2)', color: 'var(--sd-ink)' }}>
        {practice && (
          // 연습 모드 띠 — 맨 위 흐름 안에 한 줄(스크롤하면 사라짐). 아래 고정이던 땐 저장 막대·안내문을 가렸다(Aside 2차).
          <div className="flex justify-center px-4 pt-2">
            <span className="px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: '#FDE68A', color: '#78350F' }}>
              🧪 연습 모드 — 예시 기록이에요 · 저장·사진·상담이 실제로 안 나가요
            </span>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
