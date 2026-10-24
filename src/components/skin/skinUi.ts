// 제미나이 시안(2026-10-21, 우댕 전달) — 꼼이 피부 일지 공통 타입. 값 그대로.
// skinUi.ts
// 배선(2026-10-24): SkinDraft에 itch10·redness·memos 추가(가려움·붉어짐 0~10, 메모 네 칸).
export type MedStatus = 'taken' | 'missed' | 'late';

export interface SkinMed {
  name: string;
  dose?: string | null;
  time?: string | null;
  status: MedStatus | null;
}

export interface SkinEpisode {
  start?: string | null;
  durMin?: number | null;
  areas: string[];
  over24h?: boolean | null;
  bruiseLike?: boolean | null;
}

export interface SkinFood {
  t?: string | null;
  text: string;
}

export type MemoSlot = 'morning' | 'noon' | 'evening' | 'night';
export type SkinMemos = Record<MemoSlot, string>;

export interface SkinDraft {
  date: string; // 'YYYY-MM-DD'
  // 2026-10-24(우댕): 가려움·붉어짐 0~10 슬라이드(0 = 증상 없음, null = 안 적음), 팽진 없앰
  itch10: number | null;   // 가려움 0~10
  redness: number | null;  // 붉어짐 0~10
  memos: SkinMemos;        // 아침·점심·저녁·밤 메모
  wheals: number | null; // 0~3 — 예전 기록 그대로 두는 값(화면에선 안 씀)
  itch: number | null; // 0~3 — 예전 기록 그대로 두는 값(화면에선 안 씀)
  meds: SkinMed[];
  episodes: SkinEpisode[];
  angioedema: { present: boolean; areas: string[] } | null;
  trace: string | null;
  triggers: string[];
  foods: SkinFood[];
  sleepH: number | null;
  wakeItch: boolean | null;
  waterMl: number | null;
  stress: number | null; // 0~10
  period: boolean | null;
  cycleDay: number | null;
  newProducts: string[];
  note: string;
}

export const AREAS = ['손·손바닥', '팔', '발·발바닥', '다리·허벅지', '몸통', '목', '얼굴', '두피', '엉덩이'];
export const TRIGGERS = ['약 거름', '운동·걷기', '더위·열감', '샤워 후', '땀', '스트레스', '잠 부족', '술', '매운 음식', '밀가루·면', '유제품', '해산물', '견과', '생리 주기', '새 제품', '추위', '압박(옷·가방끈)', '공복', '모르겠음'];
