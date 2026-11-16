// src/components/diary/DiaryEventStyle.ts
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
    dot: '#845EC2',
    band: '#F5EEF9',
    text: '#4A2A75',
  },
  udaeng: {
    label: '우댕',
    dot: '#2E8B57',
    band: '#EDF6F1',
    text: '#17472C',
  },
  together: {
    label: '함께',
    dot: '#D97706',
    band: '#FEF3E2',
    text: '#68350A',
  },
};
