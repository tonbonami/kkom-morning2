'use client';

// 임시 폰트 비교 페이지 — /praise/fonts
// 사용자가 폰에서 보고 고른 폰트로 칭찬 다이어리에 적용.
// 결정되면 이 페이지는 삭제.

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const SAMPLE_LINES = [
  '오늘 청소 끝까지 해줘서 고마워',
  '사랑해 꼼이야 ♥',
  '10월 25일 우댕 → 꼼이',
  '별 다섯개 줄게 ⭐⭐⭐⭐⭐',
];

const FONTS = [
  { id: 'gaegu', name: 'Gaegu (현재)', css: '"Gaegu", sans-serif', weight: 700, note: '통통하고 동글, 자간 넓음' },
  { id: 'hi-melody', name: 'Hi Melody', css: '"Hi Melody", sans-serif', weight: 400, note: '또렷한 손글씨, 깔끔' },
  { id: 'nanum-pen', name: 'Nanum Pen Script', css: '"Nanum Pen Script", sans-serif', weight: 400, note: '만년필 느낌, 자연스러움' },
  { id: 'cute-font', name: 'Cute Font', css: '"Cute Font", sans-serif', weight: 400, note: '동글, 매우 귀여움' },
  { id: 'single-day', name: 'Single Day', css: '"Single Day", sans-serif', weight: 400, note: '얇고 시크' },
  { id: 'dongle', name: 'Dongle', css: '"Dongle", sans-serif', weight: 700, note: '동글동글, 부드러움' },
  { id: 'east-sea', name: 'East Sea Dokdo', css: '"East Sea Dokdo", sans-serif', weight: 400, note: '거친 손글씨' },
  { id: 'nanum-brush', name: 'Nanum Brush Script', css: '"Nanum Brush Script", sans-serif', weight: 400, note: '붓글씨 느낌' },
];

export default function FontPreviewPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFFCF5] text-slate-800">
      <main className="max-w-md mx-auto px-5 pt-6 pb-12 space-y-4">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.push('/praise')}
            className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-white/70 flex items-center justify-center text-slate-500 active:scale-95 transition"
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black">손글씨 폰트 비교</h1>
            <p className="text-[11px] font-bold text-slate-400">맘에 드는 거 골라줘</p>
          </div>
        </header>

        {FONTS.map((font) => (
          <section
            key={font.id}
            className="rounded-[22px] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.05)] border border-white/70"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-emerald-600">{font.name}</span>
              <span className="text-[10px] font-bold text-slate-400">{font.note}</span>
            </div>
            <div
              style={{ fontFamily: font.css, fontWeight: font.weight, letterSpacing: '-0.02em', lineHeight: 1.4 }}
              className="space-y-1.5 text-slate-800"
            >
              {SAMPLE_LINES.map((line, i) => (
                <p key={i} className="text-[20px]">
                  {line}
                </p>
              ))}
            </div>
            {/* 같은 폰트 자간 더 좁은 버전 */}
            <details className="mt-3">
              <summary className="text-[10px] font-bold text-slate-400 cursor-pointer">자간 더 좁게 (-0.06em)</summary>
              <div
                style={{ fontFamily: font.css, fontWeight: font.weight, letterSpacing: '-0.06em', lineHeight: 1.35 }}
                className="space-y-1.5 text-slate-800 mt-2 pt-2 border-t border-slate-100"
              >
                {SAMPLE_LINES.map((line, i) => (
                  <p key={i} className="text-[20px]">
                    {line}
                  </p>
                ))}
              </div>
            </details>
          </section>
        ))}

        <div className="rounded-[22px] bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-700">
          마음에 드는 폰트 번호/이름 알려줘 — 적용할게
        </div>
      </main>
    </div>
  );
}
