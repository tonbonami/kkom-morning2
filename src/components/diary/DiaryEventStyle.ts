// src/components/diary/DiaryEventStyle.ts
// 일정 주인 색 — 옛 달력(src/lib/calendar.ts OWNER_META)과 같은 색: 꼼이 로즈 · 우댕 파랑 · 함께 보라.
// 우댕 결정함 2026-11-17: 「달력 주인 색은 옛 색으로 되돌리기」 (합치기 때 잠깐 보라·초록·주황이었다)
// 값은 Tailwind 3 팔레트 — dot = 400(함께 500), band = 100, text = 700(함께 800).
import type { EventOwnerKey } from '@/lib/diaryTypes';

export const EVENT_OWNER_STYLE: Record<
  EventOwnerKey,
  {
    label: string;
    dot: string;
    band: string;
    text: string;
  }
> = {
  kkomi: {
    label: '꼼이',
    dot: '#FB7185',
    band: '#FFE4E6',
    text: '#BE123C',
  },
  udaeng: {
    label: '우댕',
    dot: '#60A5FA',
    band: '#DBEAFE',
    text: '#1D4ED8',
  },
  together: {
    label: '함께',
    dot: '#A855F7',
    band: '#F3E8FF',
    text: '#6B21A8',
  },
};
