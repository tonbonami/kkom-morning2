// 홈 히어로 프리뷰용 미니 낙서 썸네일 — 현재 페이지 획을 SVG로 축소 렌더.
// 획은 정규화 0~1 좌표. 보드 3:4 비율(viewBox 300x400)에 맞춰 그리고, meet로 프리뷰 안에 가운데 정렬.
import type { BoardStroke } from '@/lib/canvasBoard';

export default function DoodleThumb({ strokes }: { strokes: BoardStroke[] }) {
  if (!strokes.length) return null;
  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      {strokes.map((s) => (
        <polyline
          key={s.id}
          points={s.points.map((p) => `${(p.x * 300).toFixed(1)},${(p.y * 400).toFixed(1)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={Math.max(2, s.size)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.95}
        />
      ))}
    </svg>
  );
}
