/**
 * 허니브러리 — 화면이 쓰는 모양과 상수(파이어베이스 없음). 데이터는 src/lib/honeybrary.ts.
 *
 * 사이담 사이브러리(saidam/src/lib/library.ts)를 꼼모닝으로 옮긴 것 + 리뷰(감상).
 * 회의: docs/gpt-honeybrary-ask.md · docs/gpt-honeybrary-answer.md (2026-11-08).
 *
 * ⚠️⚠️ **장부가 되면 안 된다**(사이브러리 원칙 그대로). 권수·연속 기록·하트·댓글 수·「답변 0」·
 *    진행이 바뀐 시각은 없다. 별점이 생겼지만 **평균·합산·나란히 비교·별점 정렬은 없다** —
 *    별은 「책의 점수」가 아니라 「내 이번 독서 경험」이다(GPT 회의 3번).
 * ⚠️ 같이 읽는 책은 **한 권**, 진행은 **사람마다**(판본이 다를 수 있다). 퍼센트는 저장하지 않는다.
 */
export type Person = '우댕' | '꼼이';
export const PEOPLE: Person[] = ['우댕', '꼼이'];
export const partnerOf = (p: Person): Person => (p === '우댕' ? '꼼이' : '우댕');

/** 읽는 중 · 다 읽음 · 책장에 두기. ⚠️ 「덮음」이 없다 — 「추천을 거절했다」로 읽힌다(사이담 토의 1차 4번). */
export type ReadStatus = 'reading' | 'done' | 'shelved';
export const STATUS_LABEL: Record<ReadStatus, string> = {
  reading: '읽는 중', done: '다 읽음', shelved: '책장에 두기',
};

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface ReadingVM { status: ReadStatus; current?: number; total?: number }

/** 사진 한 장 — 목록·카드엔 thumbUrl(긴 변 480), 크게 볼 때만 url(긴 변 1600). pending = 올리는 중. */
export interface PhotoVM { id: string; url: string; thumbUrl: string; width?: number; height?: number; pending?: boolean }

/** 같이 보기 / 혼자 보기(우댕 2026-11-10, GPT 회의 docs/gpt-honeybrary-private-answer.md).
 *  ⚠️ 혼자 보기는 **상대 화면에 안 띄우는 것**이지 보안이 아니다(규칙이 열려 있다) — 「비밀」이라고 약속하지 말 것. */
export type Visibility = 'shared' | 'private';

export interface BookVM {
  id: string;
  title: string;
  coverUrl?: string;
  coverThumb?: string;
  placedBy: Person;                                // 책을 놓은 사람(「추천」이라 부르지 않는다)
  readers: Partial<Record<Person, ReadingVM>>;
  visibility: Visibility;                          // 혼자 보기면 놓은 사람 화면에만
}

/** 읽는 중 남긴 기록. parentNoteId 가 있으면 그 기록에 「한 줄 잇기」(한 단계만). */
export interface NoteVM { id: string; by: Person; text?: string; page?: number; photo?: PhotoVM; parentNoteId?: string }

/** 감상(리뷰) — 책 × 사람 하나. 별·키워드·글·사진 중 하나만 있어도 된다. */
export interface ReviewVM {
  id: string;
  by: Person;
  rating?: Rating;
  keywords: string[];
  headline?: string;
  body?: string;
  photos: PhotoVM[];
  hasSpoiler: boolean;
  reply?: { by: Person; text: string };            // 상대의 한마디 — 리뷰당 하나(배민 「사장님 댓글」 자리)
}

/** 감상 쓰기 창이 돌려주는 값(사진은 따로 — ReviewPhotoPicker 가 올리고 지운다). */
export interface ReviewDraft { rating?: Rating; keywords: string[]; headline: string; body: string; hasSpoiler: boolean }

/** 「이런 점이 좋았어요」 — GPT 회의 2번 초안 그대로. 최대 3개. */
export const REVIEW_KEYWORDS: string[] = [
  '술술 읽혔어요', '문장이 예뻐요', '인물이 오래 남아요', '생각할 거리가 있어요',
  '새로운 걸 알았어요', '마음이 따뜻해져요', '웃음이 났어요', '여운이 길어요',
  '함께 이야기하고 싶어요', '다시 펼치고 싶어요', '천천히 읽고 싶어요', '취향을 탈 수 있어요',
];

export const LIMITS = {
  title: 100, note: 2000, reply: 500,               // 책 제목 · 기록 · 한 줄 잇기(사이브러리 그대로)
  keywords: 3, headline: 40, body: 600, photos: 5, partnerReply: 200,
} as const;

export type Shelf = 'now' | 'done' | 'shelved';
/** 한 사람이라도 읽는 중이면 「요즘」, 다음 다 읽은 사람이 있으면 「다 읽은」, 나머지 「책장에 둔 책」. */
export function shelfOf(b: Pick<BookVM, 'readers'>): Shelf {
  const rs = Object.values(b.readers).filter(Boolean) as ReadingVM[];
  if (rs.some((r) => r.status === 'reading')) return 'now';
  if (rs.some((r) => r.status === 'done')) return 'done';
  return 'shelved';
}

/** 진행을 어떻게 보여 줄까 — ⚠️ **숫자가 없으면 숫자 칸을 안 그린다**(0% 금지). */
export type ProgressView =
  | { kind: 'bar'; pct: number; label: string }
  | { kind: 'page'; label: string }
  | { kind: 'none'; label: string };
export function progressView(r: ReadingVM): ProgressView {
  if (r.status === 'done') return { kind: 'none', label: STATUS_LABEL.done };
  if (r.status === 'shelved') return { kind: 'none', label: STATUS_LABEL.shelved };
  if (r.current && r.total && r.current <= r.total) {
    return { kind: 'bar', pct: Math.round((r.current / r.total) * 100), label: `${r.current} / ${r.total}쪽` };
  }
  if (r.current) return { kind: 'page', label: `${r.current}쪽까지` };
  return { kind: 'none', label: STATUS_LABEL.reading };
}
