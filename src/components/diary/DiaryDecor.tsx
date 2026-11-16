// src/components/diary/DiaryDecor.tsx
'use client';

import React from 'react';

export const DECOR_ASSETS: { id: string; kind: 'tape' | 'stamp'; label: string; ratio: number }[] = [
  // 마스킹테이프 8종 (ratio ~0.22, 반투명 & 양끝 찢김)
  { id: 'tape-honey', kind: 'tape', label: '꿀빛', ratio: 0.22 },
  { id: 'tape-apricot', kind: 'tape', label: '살구', ratio: 0.22 },
  { id: 'tape-sage', kind: 'tape', label: '세이지', ratio: 0.22 },
  { id: 'tape-sky', kind: 'tape', label: '하늘', ratio: 0.22 },
  { id: 'tape-stripe', kind: 'tape', label: '줄무늬', ratio: 0.22 },
  { id: 'tape-grid', kind: 'tape', label: '모눈', ratio: 0.22 },
  { id: 'tape-dots', kind: 'tape', label: '도트', ratio: 0.22 },
  { id: 'tape-kraft', kind: 'tape', label: '크라프트', ratio: 0.22 },
  // 도장 8종 (우리말 도장)
  { id: 'stamp-cheer', kind: 'stamp', label: '오늘도 수고', ratio: 0.6 },
  { id: 'stamp-date', kind: 'stamp', label: '데이트', ratio: 0.6 },
  { id: 'stamp-yummy', kind: 'stamp', label: '맛있었다', ratio: 0.6 },
  { id: 'stamp-miss', kind: 'stamp', label: '보고싶어', ratio: 0.6 },
  { id: 'stamp-love', kind: 'stamp', label: '사랑해', ratio: 0.6 },
  { id: 'stamp-sleep', kind: 'stamp', label: '꿀잠', ratio: 0.6 },
  { id: 'stamp-whitening', kind: 'stamp', label: '화이트닝', ratio: 0.6 },
  { id: 'stamp-special', kind: 'stamp', label: '기념일', ratio: 0.6 },
];

const TAPE_CLIP = 'polygon(0% 4%, 2% 0%, 5% 6%, 8% 1%, 10% 5%, 90% 5%, 93% 0%, 96% 6%, 98% 1%, 100% 4%, 98% 96%, 96% 100%, 93% 94%, 90% 99%, 88% 95%, 10% 95%, 7% 100%, 4% 94%, 2% 98%, 0% 96%)';

export function DiaryDecor({ decorId, className = '' }: { decorId: string; className?: string }): React.JSX.Element {
  // 테이프
  if (decorId.startsWith('tape-')) {
    let bgStyle: React.CSSProperties = { clipPath: TAPE_CLIP, opacity: 0.88 };

    switch (decorId) {
      case 'tape-honey':
        bgStyle = { ...bgStyle, background: '#F8E2A7' };
        break;
      case 'tape-apricot':
        bgStyle = { ...bgStyle, background: '#FCD7C8' };
        break;
      case 'tape-sage':
        bgStyle = { ...bgStyle, background: '#DCE8D5' };
        break;
      case 'tape-sky':
        bgStyle = { ...bgStyle, background: '#DCE7EE' };
        break;
      case 'tape-stripe':
        bgStyle = {
          ...bgStyle,
          backgroundColor: '#F5ECE3',
          backgroundImage: 'repeating-linear-gradient(45deg, #E6D8CA 0, #E6D8CA 3px, transparent 3px, transparent 8px)',
        };
        break;
      case 'tape-grid':
        bgStyle = {
          ...bgStyle,
          backgroundColor: '#F6EFEA',
          backgroundImage: 'linear-gradient(#E8DCD4 1px, transparent 1px), linear-gradient(90deg, #E8DCD4 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        };
        break;
      case 'tape-dots':
        bgStyle = {
          ...bgStyle,
          backgroundColor: '#F7EDE6',
          backgroundImage: 'radial-gradient(#E4D0C5 1.5px, transparent 1.5px)',
          backgroundSize: '8px 8px',
        };
        break;
      case 'tape-kraft':
      default:
        bgStyle = { ...bgStyle, background: '#E3CBB3' };
        break;
    }

    return (
      <div className={`w-full h-full relative ${className}`}>
        <div className="w-full h-full shadow-sm" style={bgStyle} />
      </div>
    );
  }

  // 도장
  const stampConfig: Record<string, { text: string; color: string; border: string; shape: 'rect' | 'circle' }> = {
    'stamp-cheer': { text: '오늘도 수고', color: '#964842', border: 'border-2 border-[#964842]', shape: 'rect' },
    'stamp-date': { text: '데이트', color: '#B25D4E', border: 'border-2 border-[#B25D4E]', shape: 'rect' },
    'stamp-yummy': { text: '맛있었다', color: '#88583B', border: 'border-2 border-[#88583B]', shape: 'rect' },
    'stamp-miss': { text: '보고싶어', color: '#566675', border: 'border-2 border-[#566675]', shape: 'rect' },
    'stamp-love': { text: '사랑해', color: '#C05451', border: 'border-2 border-[#C05451]', shape: 'circle' },
    'stamp-sleep': { text: '꿀잠', color: '#5F6956', border: 'border-2 border-[#5F6956]', shape: 'rect' },
    'stamp-whitening': { text: '화이트닝', color: '#7E6377', border: 'border-2 border-[#7E6377]', shape: 'rect' },
    'stamp-special': { text: '기념일', color: '#A85250', border: 'border-2 border-[#A85250]', shape: 'circle' },
  };

  const stamp = stampConfig[decorId] || { text: '참잘했어요', color: '#964842', border: 'border-2 border-[#964842]', shape: 'rect' };

  return (
    // 글씨는 도장 폭에 맞춰 줄어든다(cqw) — 고정 24px 이라 달력 칸·여백 줄처럼 작은 자리에선 글자가 테두리 밖으로 겹쳤다
    <div className={`w-full h-full flex items-center justify-center select-none pointer-events-none ${className}`} style={{ containerType: 'inline-size', padding: '4%' }}>
      <div
        className={`w-full h-full flex items-center justify-center border-dashed ${stamp.border} ${
          stamp.shape === 'circle' ? 'rounded-full aspect-square' : 'rounded-lg'
        }`}
        style={{ color: stamp.color, opacity: 0.88 }}
      >
        <div className="w-full h-full border border-current rounded-[inherit] m-0.5 flex items-center justify-center px-1">
          <span className="font-['Dongle'] font-bold leading-none tracking-tight whitespace-nowrap" style={{ fontSize: '23cqw' }}>
            {stamp.text}
          </span>
        </div>
      </div>
    </div>
  );
}
