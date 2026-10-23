'use client';
// 꿀닥터 로고(우댕 2026-10-24 「2번」 OK) — 걷는 의사 꿀됑 움짤(분석 화면과 같은 walk.webp, 색 그대로)
// + 「꿀닥터」(동글 700, 꿀은 꿀색 · 닥터는 분홍, 갈색 테두리) + 「꿀」 왼쪽 위 노란 방울 더듬이(Codex C 시안에서 오림).
// 그림 한 장으로 줄이면 동글의 가는 획이 뭉개져 안 읽혀서(우댕: "너무 작아. 글자 읽히지도 않아")
// 글씨는 진짜 글자로 그린다 — 어떤 크기에서도 선명. 동글은 layout.tsx에서 이미 불러온다.
import React from 'react';

const WALK = '/emo/kkuldaeng/doctor/walk.webp';        // 213x240, 36프레임, 그림은 가로 34~178px
const STILL = '/emo/kkuldaeng/doctor/walk-still.webp'; // 같은 크기 정지컷(움직임 줄이기 설정)
const ANTENNA = '/emo/kkuldaeng/doctor/antenna.webp';  // 150x99 — 오른쪽 아래가 줄기 끝

export default function KkulDoctorLogo({ height = 48, text = 0.62, walking = true, className = '' }: {
  height?: number;   // 꿀됑 높이(px)
  text?: number;     // 글씨 크기(꿀됑 높이 대비 font-size 비율) — 2번 시안 비율 ≈ 0.55, 작은 자리에선 조금 키운다
  walking?: boolean; // false면 정지컷
  className?: string;
}) {
  const h = height;
  const f = Math.round(h * text);             // 동글 font-size
  const docW = Math.round((144 / 240) * h);   // 움짤 안 그림 부분만(양옆 빈 여백 자르기)
  const stroke = Math.max(1.5, f * 0.07);
  const antH = Math.round(f * 0.42);
  return (
    <span className={`inline-flex items-center select-none ${className}`} style={{ height: h }} role="img" aria-label="꿀닥터">
      <span className="relative shrink-0 overflow-hidden" style={{ width: docW, height: h }} aria-hidden>
        <picture>
          {walking && <source srcSet={STILL} media="(prefers-reduced-motion: reduce)" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={walking ? WALK : STILL} alt="" draggable={false}
            style={{ height: h, width: 'auto', maxWidth: 'none', marginLeft: -Math.round((34 / 240) * h) }} />
        </picture>
      </span>
      <span aria-hidden className="font-bold whitespace-nowrap"
        style={{
          fontFamily: "'Dongle', sans-serif", fontSize: f, lineHeight: 1, marginLeft: Math.round(f * 0.34),
          marginTop: Math.round(f * 0.28), letterSpacing: Math.round(f * 0.02),
          WebkitTextStroke: `${stroke}px #6B3F1D`, paintOrder: 'stroke fill',
        }}>
        <span className="relative inline-block" style={{ color: '#F6C23E' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ANTENNA} alt="" draggable={false} className="absolute pointer-events-none"
            style={{ height: antH, width: 'auto', maxWidth: 'none', left: -Math.round(antH * 0.42), top: -Math.round(antH * 0.30) }} />
          꿀
        </span>
        <span style={{ color: '#F7A3B5' }}>닥터</span>
      </span>
    </span>
  );
}
