'use client';
// 허니브러리 로고 — 의자에 앉아 책 읽는 꿀됑 + 「허니브러리」 글씨. 사이담 SaibraryLogo 를 그대로 옮기고 글자만 바꿨다.
// 우댕 2026-11-08: 「사이담의 사이브러리를 그대로 가져오는 거야. 제목만 허니브러리로 바꿔서.」
//
// ⚠️ 글씨는 그림에 굽지 않고 **진짜 글자**(동글 700)로 그린다 — 그림 한 장으로 줄이면 동글의 가는 획이 뭉개진다(꿀닥터 때 겪음).
// ⚠️ 색은 꿀닥터와 같은 짝 — 「허니」는 「꿀」의 꿀색, 「브러리」는 「닥터」의 분홍, 테두리는 같은 갈색.
// ⚠️ 그림(186x320, 27KB)은 사이담 art/saibrary 에서 우댕이 두 번 고쳐 정한 것(날씬한 아기 돼지·의자에 앉아 읽기).
const READER = '/emo/kkuldaeng/library/reader.webp?v=1'; // 그림을 바꾸면 v 를 올린다(같은 주소는 옛 그림이 남는다)

export default function HoneybraryLogo({ height = 64, text = 0.6, className = '' }: {
  height?: number;   // 꿀됑 높이(px)
  text?: number;     // 글씨 크기(꿀됑 높이 대비 font-size 비율)
  className?: string;
}) {
  const h = height;
  const f = Math.round(h * text);
  const stroke = Math.max(1.5, f * 0.07);
  return (
    <span className={`inline-flex items-center select-none ${className}`} style={{ height: h }}
          role="img" aria-label="허니브러리">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={READER} alt="" draggable={false} aria-hidden
           className="shrink-0" style={{ height: h, width: 'auto', maxWidth: 'none' }} />
      <span aria-hidden className="font-bold whitespace-nowrap"
        style={{
          fontFamily: "'Dongle', sans-serif", fontSize: f, lineHeight: 1, marginLeft: Math.round(f * 0.12),
          marginTop: Math.round(f * 0.28), letterSpacing: Math.round(f * 0.02),
          WebkitTextStroke: `${stroke}px #6B3F1D`, paintOrder: 'stroke fill',
        }}>
        <span style={{ color: '#F6C23E' }}>허니</span>
        <span style={{ color: '#F7A3B5' }}>브러리</span>
      </span>
    </span>
  );
}
