// 움직이는 포차코 스티커 — 편지에 붙이는 짧은 루프 영상(무음 mp4).
// AI 영상(Hailuo/Kling 등)으로 만든 걸 크롭/압축해서 public/letter-stickers/에 둠.
// 새 스티커 추가 시 이 배열에만 넣으면 편지 작성/보관함 양쪽에 자동 반영.

export interface AnimatedSticker {
  id: string;
  label: string;
  videoUrl: string;   // 무음 h264 mp4, iOS Safari autoplay 호환
  posterUrl: string;  // 첫 로드 시 보여줄 정지 이미지 (webp)
}

export const ANIMATED_STICKERS: AnimatedSticker[] = [
  {
    id: 'pochacco-heart',
    label: '하트 포차코',
    videoUrl: '/letter-stickers/pochacco-heart.mp4',
    posterUrl: '/letter-stickers/pochacco-heart-poster.webp',
  },
  {
    id: 'pochacco-rose',
    label: '장미 포차코',
    videoUrl: '/letter-stickers/pochacco-rose.mp4',
    posterUrl: '/letter-stickers/pochacco-rose-poster.webp',
  },
];

export function getAnimatedSticker(id?: string | null): AnimatedSticker | undefined {
  if (!id) return undefined;
  return ANIMATED_STICKERS.find((s) => s.id === id);
}
