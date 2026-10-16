import { Sticker } from 'lucide-react';

interface PraiseMetaProps {
  dateText: string;
  whoText: string;
  stickerCount: number;
  tone: 'udaeng' | 'kkomi';
}

export default function PraiseMeta({ dateText, whoText, stickerCount, tone }: PraiseMetaProps) {
  // 우댕(초록)과 꼼이(분홍) 테마 색상 지정
  const theme =
    tone === 'udaeng'
      ? { text: 'text-emerald-700', bg: 'bg-emerald-100/50', icon: 'text-emerald-500' }
      : { text: 'text-rose-700', bg: 'bg-rose-100/50', icon: 'text-rose-400' };

  return (
    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-200/60">
      <div className="flex items-center gap-1.5 text-sm text-stone-600 font-medium tracking-wide">
        <span>{dateText}</span>
        <span className="text-stone-300">·</span>
        <span>{whoText}</span>
      </div>

      {/* 스티커 개수 칩 */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${theme.bg}`}>
        <Sticker className={`w-3.5 h-3.5 ${theme.icon}`} strokeWidth={2.5} />
        <span className={`text-xs font-semibold tracking-wide ${theme.text}`}>
          스티커 {stickerCount}장
        </span>
      </div>
    </div>
  );
}
