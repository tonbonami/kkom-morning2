'use client';
// 「힘든 날 우댕에게 알리기」 한 줄(연결용 작은 조각) — 꼼이만 켜고 끈다(우댕 고름 2026-10-21, 피부 기록 세션: 꼼이가 켜고 끄게).
// 우댕 폰(보기 전용)에서는 지금 켜져 있는지만 보여 준다. 모양은 같은 화면의 안내 줄과 카드 토큰만 쓴다.
import React from 'react';

export default function SkinPartnerAlert({ on, readOnly, busy, onToggle }: {
  on: boolean | null; readOnly: boolean; busy: boolean; onToggle: (next: boolean) => void;
}) {
  if (on === null) return null;
  return (
    <div className="sd-card sd-card--quiet mt-3 px-5 py-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[15px] font-bold" style={{ color: 'var(--sd-ink)' }}>힘든 날 우댕에게 알리기</p>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--sd-muted)' }}>
          {readOnly ? (on ? '꼼이가 켜 뒀어요 — 꼼이 오늘 점수(0~6)가 4 이상이 되면 알림이 와요' : '꼼이가 켜면 힘든 날 알림이 와요')
            : '오늘 점수(0~6)가 4 이상인 날, 우댕 폰에 「오늘 꼼이 피부가 힘든 날이에요」만 한 번 가요. 점수·기록·사진은 안 가요. 누르면 바로 적용돼요.'}
        </p>
      </div>
      <button
        type="button" role="switch" aria-checked={on} aria-label="힘든 날 우댕에게 알리기"
        disabled={readOnly || busy} onClick={() => onToggle(!on)}
        className="shrink-0 w-12 h-7 rounded-full relative transition-colors disabled:opacity-60"
        style={{ background: on ? 'var(--sd-rel)' : 'var(--sd-line)' }}>
        <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all" style={{ left: on ? 22 : 2 }} />
      </button>
    </div>
  );
}
