/**
 * 다꾸 다이어리 — 화면이 쓰는 모양과 상수(파이어베이스 없음).
 * 기획: docs/gpt-diary-ask.md · docs/gpt-diary-answer.md (GPT 회의 2026-11-15), 시안 의뢰 docs/gemini-diary-ask.md.
 *
 * 우댕 2026-11-15: 「지금 같은 캘린더가 아니라 실제로 꾸밀 수 있는 다꾸 가능한 다이어리. 스티커도 붙일 수 있고,
 *   주로 폰으로 쓰니까 간단하게. 생일 같은 거 표시할 수 있고, 일기 같은 거 적을 수 있고.」
 *
 * ⚠️ 장부·감시 금지 — 「며칠째 안 씀」·연속 기록·작성 횟수·비교 통계를 만들지 않는다.
 * ⚠️ 좌표는 종이에 대한 0~1(폰마다 종이 크기가 달라도 같은 자리). 낙서장(canvasBoard.ts)과 같은 방식.
 */
export type Person = '우댕' | '꼼이';
export type DiaryPaperTheme = 'cream' | 'plain' | 'lined' | 'grid';
export type DiaryItemType = 'sticker' | 'photo' | 'tape' | 'stamp';

/**
 * 사진 모양(GPT 회의 2026-11-18 「다이어리 꾸미기 회의」 — 새 그림 없이 CSS 로 되는 넷만. 필름·찢은 종이는 그림이 필요해서 나중에).
 * 없으면 'white'(처음부터 있던 흰 테두리) — 옛 장은 고칠 것 없이 그대로 보인다.
 */
export type DiaryPhotoFrame = 'white' | 'none' | 'polaroid' | 'circle';
export const DIARY_PHOTO_FRAMES: { id: DiaryPhotoFrame; label: string }[] = [
  { id: 'white', label: '기본' }, { id: 'none', label: '없음' }, { id: 'polaroid', label: '폴라로이드' }, { id: 'circle', label: '동그라미' },
];
/** 사진을 어디서 가져왔나 — 사진 앱 / 꼼톡 / 추억. 가져온 사진도 다이어리 쪽에 복사본을 올린다(원본이 지워져도 장이 안 깨지게). */
export type DiaryPhotoSource = 'library' | 'chat' | 'memories';

/** 종이 위 물건 하나. x·y = 물건 **가운데**의 자리(종이 폭·높이에 대한 0~1), w = 종이 폭에 대한 폭(0~1), ratio = 높이/폭. */
export interface DiaryItemVM {
  id: string; type: DiaryItemType;
  src?: string;        // sticker·photo 그림 주소(정지 그림)
  decorId?: string;    // tape·stamp — 그림 파일이 아니라 CSS 로 그리는 꾸미기(components/diary/DiaryDecor)의 id
  path?: string;       // photo — Storage 경로(장에서 빠지면 파일도 지우려고 같이 적어 둔다)
  /** photo — ratio 는 **사진 자체**의 높이/폭이다. 테두리·글귀 자리까지 넣은 물건 상자 비율은 photoBoxRatio 로 그때 계산. */
  frame?: DiaryPhotoFrame;
  caption?: string;    // photo — 사진 아래 글귀(40자). 기본·폴라로이드에서만 보이고, 없음·동그라미에선 숨기기만 한다(안 지움).
  source?: DiaryPhotoSource;
  x: number; y: number; w: number; ratio: number; rotation: number; z: number;
}

/**
 * 사진 물건 상자의 높이/폭 — 테두리 모양마다 다르다(폭 W 에 대한 비율).
 *   기본: 글귀 없으면 사진 비율 그대로(안쪽 4px 흰 테두리 — 처음 모양), 글귀 있으면 둘레 4% + 아래 22%.
 *   폴라로이드: 둘레 5.5% + 아래 25%(인스탁스 비율쯤). 동그라미: 1:1. 없음: 사진 비율.
 */
export const PHOTO_PAD = { white: { side: 0.04, bottom: 0.22 }, polaroid: { side: 0.055, bottom: 0.25 } } as const;
export function photoShowsCaption(it: Pick<DiaryItemVM, 'frame' | 'caption'>): boolean {
  const f = it.frame ?? 'white';
  return !!it.caption?.trim() && (f === 'white' || f === 'polaroid');
}
export function photoBoxRatio(it: Pick<DiaryItemVM, 'frame' | 'caption' | 'ratio'>): number {
  const f = it.frame ?? 'white';
  if (f === 'circle') return 1;
  if (f === 'polaroid') { const p = PHOTO_PAD.polaroid; return p.side + (1 - 2 * p.side) * it.ratio + p.bottom; }
  if (f === 'white' && photoShowsCaption(it)) { const p = PHOTO_PAD.white; return p.side + (1 - 2 * p.side) * it.ratio + p.bottom; }
  return it.ratio;
}
export interface DiaryChipVM { id: string; kind: 'mood' | 'weather' | 'event' | 'special'; label: string; iconSrc?: string }
/** question = 그 장에 고른 「오늘의 질문」 — 글과 따로 두고 다른 색으로 그린다(꼼이 2026-11-17 「이 글씨 색을 밑에 글씨와 구분할 수 있게」). */
export interface DiaryPageVM { date: string; owner: Person; theme: DiaryPaperTheme; text: string; items: DiaryItemVM[]; question?: string }
/** 서랍의 고를 거리 하나. packId = 어느 팩 탭인지(서랍에서 끄기·옮기기용 — 장에 붙인 물건에는 저장하지 않는다). */
export interface DiaryAssetVM { id: string; packId?: string; kind: 'sticker' | 'tape' | 'stamp'; src?: string; decorId?: string; label?: string; favorite?: boolean }
export interface DiaryMaterialVM { id: string; kind: 'mood' | 'weather' | 'photo' | 'prompt' | 'special'; label: string; thumbSrc?: string }
export interface DiaryMonthDayVM { date: string; day: number; inMonth: boolean; isToday: boolean; mine: boolean; partner: boolean; special?: string; holiday?: boolean }
/** 생일·기념일. sticker = 전용 스티커(등록할 때 고름) — 매년 그 날짜 칸에 저절로 붙는다(월간 장식 개수에 안 센다). */
export interface SpecialDateVM { id: string; label: string; kind: 'birthday' | 'anniversary' | 'custom'; monthDay: string; startYear?: number; owner: Person | 'together'; sticker?: MonthStickerVM }
export type DiaryItemAction = 'smaller' | 'larger' | 'rotateLeft' | 'rotateRight' | 'front' | 'duplicate' | 'delete';

/** 빈 장 질문 한 줄(GPT 회의: AI 호출 없이 로컬 문구) — 날마다 하나씩 돌아간다. 문구를 고치면 옛 장의 질문 알아보기(diary.ts toPage)가 그 문구를 놓친다 — 빼지 말고 뒤에 더할 것. */
export const DIARY_PROMPTS = [
  '오늘 둘이 가장 웃었던 일은?', '오늘 제일 맛있었던 건?', '오늘 고마웠던 순간은?', '오늘을 한 단어로 하면?',
  '오늘 나를 칭찬한다면?', '내일 하고 싶은 일 하나는?', '오늘 들은 말 중에 기억에 남는 건?',
] as const;

/** 한 장에 물건 30개·사진 4장·글 1000자(GPT 회의 7번 — 실기기 검수 뒤에 늘린다). */
export const DIARY_LIMITS = { items: 30, photos: 4, text: 1000, caption: 40 } as const;

// ── 월간 꾸미기 달력(GPT 회의 2: docs/gpt-diary-calendar-answer.md, 우댕 2026-11-17 「다꾸하는 사람들은 달력 꾸미는 것도 좋아하잖아」) ──
/** 달력 주인 — 같이 꾸미는 한 장 / 각자 한 장(우댕 「둘이 공동 + 각자 한 장 선택하게」). 하루 장은 각자뿐. */
export type MonthOwner = 'together' | Person;
/** 달력에 붙는 작은 스티커(자유 배치 아님 — 칸의 정해진 자리). by = 붙인 사람(같이 달력에서 고를 때만 보여 줌). */
export interface MonthStickerVM { id: string; src?: string; decorId?: string; by?: Person }
/** 그 날의 기념일 한 개 — years 는 시작 연도가 있을 때 「3주년」의 3. */
export interface MonthSpecialVM { id: string; label: string; kind: 'birthday' | 'anniversary' | 'custom'; years?: number; sticker?: MonthStickerVM }
export interface DiaryMonthCellVM {
  date: string; day: number; inMonth: boolean; isToday: boolean; holiday?: boolean;
  stickers: MonthStickerVM[];          // 최대 2개(왼쪽·오른쪽 자리)
  memo?: string;                       // 한 줄 메모, 최대 7자
  specials: MonthSpecialVM[];          // 그 날의 생일·기념일(여러 개일 수 있다)
  mine: boolean; partner: boolean;     // 하루 장을 쓴 날(작은 점)
  events?: MonthCellEventsVM;          // 그날 일정 요약(달력 합치기) — 제목은 칸에 안 쓴다
}
/** 여러 날을 잇는 기간 테이프(여행·시험 등) — 주가 바뀌면 화면에서 조각으로 나눠 그린다. */
export interface MonthSpanVM { id: string; startDate: string; endDate: string; label: string; decorId: string }
export type MonthTitleStyle = 'plain' | 'brush' | 'round';
export type MonthTool = 'sticker' | 'span' | 'memo' | 'erase';
/** 날짜당 스티커 2 · 메모 7자 · 기간 테이프 8 · 여백 스티커 6 (GPT 회의 2의 안전선). */
export const MONTH_LIMITS = { cellStickers: 2, memo: 7, spans: 8, margin: 6 } as const;

// ── 달력 합치기(GPT 회의 3: docs/gpt-diary-merge-answer.md · 우댕 2026-11-17 「합치는 쪽으로」「추천대로 해봐」) ──
// 일정의 원본은 계속 calendarEvents(src/lib/calendar.ts) 하나 — 알림·꼼톡 카드가 거기에 물려 있다. 여기는 화면이 쓰는 모양뿐.
/** 일정의 주인 — calendarEvents.owner 그대로. */
export type EventOwnerKey = 'kkomi' | 'udaeng' | 'together';
/** 달력 칸의 일정 요약: owners = 칸에 점으로 그릴 하루짜리 일정의 주인(최대 2), more = 칸에 못 그린 일정 수(「+N」). */
export interface MonthCellEventsVM { owners: EventOwnerKey[]; more: number }
/**
 * 한 주 안에 그리는 띠 조각 — 자리는 lib/diaryCalendar.ts 가 미리 계산해서 준다(화면은 그리기만).
 * kind 'event' = 진짜 일정(알림이 걸려 있을 수 있다 — 지우개로 못 지움), 'decor' = 꾸미기 띠(diaryMonths.spans).
 * row 0 = 일정 줄, 1 = 장식 줄(그 주에 일정 띠가 없으면 장식 띠가 0 으로 올라온다).
 */
export interface MonthBandSegVM {
  key: string; id: string; kind: 'event' | 'decor';
  week: number; col: number; span: number; row: 0 | 1;
  label: string; showLabel: boolean; continuesLeft: boolean; continuesRight: boolean;
  owner?: EventOwnerKey; decorId?: string;
}
/** 날짜 시트·다가오는 목록의 일정 한 줄. */
export interface DiaryEventVM {
  id: string; title: string; owner: EventOwnerKey; startDate: string; endDate: string;
  allDay: boolean; startTime?: string; location?: string; memo?: string; remindDaysBefore: number[]; decorId?: string;
}
/** 일정 추가·수정 창이 다루는 값(창은 값을 받아 그리고, 바뀐 것만 알려 준다). decorId null = 주인 색 기본 띠. */
export interface DiaryEventDraft {
  title: string; owner: EventOwnerKey; startDate: string; endDate: string;
  allDay: boolean; startTime: string; location: string; memo: string; remindDaysBefore: number[]; decorId: string | null;
}
/** 다가오는 것 한 줄(일정·기념일 같이). whenLabel 은 '오늘'·'내일'·'3일 뒤'·'진행 중' 처럼 미리 만든 말. */
export interface UpcomingItemVM {
  id: string; kind: 'event' | 'special'; title: string; whenLabel: string; dateLabel: string;
  owner?: EventOwnerKey; timeLabel?: string; date: string;
}
