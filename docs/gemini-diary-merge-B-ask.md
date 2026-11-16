너는 모바일 앱 UI 디자이너 겸 React 개발자야. 지난번에 네가 만든 꼼모닝 「다꾸 다이어리」 시안(하루 장 + 월간 꾸미기 달력)에 **기존 달력(일정)을 합친다**. 파일을 열거나 명령을 실행하지 말고, 답에 코드만 써 줘.

## 앱·규칙(지난번과 같다)
- 꼼모닝: 연인 둘(우댕·꼼이)만 쓰는 커플 앱, 아이폰 웹뷰(화면 확대 꺼짐), **라이트 전용**, 기준 폭 390px, `max-w-md mx-auto`.
- Next.js 15, React 19, TypeScript, Tailwind 3.4, `framer-motion` 11, `lucide-react` 만.
- 글꼴: 본문 IBM Plex Sans KR, 손글씨 느낌 `Dongle`(날짜·제목·도장에만).
- 변수: `--sd-ink:#2E1D26` `--sd-muted:#6E5457` `--sd-faint:#806668` `--sd-line:#E4D2D2` `--sd-surface-2:#F1EBEA` `--sd-card-solid:#FFFFFF` `--sd-rel:#E4685E` `--sd-rel-soft:#FDEBE6` `--sd-crit:#C9524F`. 앱 바탕 `#FCFAF7`. 안전영역은 `env(safe-area-inset-*)` 를 style 로.
- 이모지 금지(lucide), `confirm()/alert()` 금지, 입력칸 글씨 16px 이상, 누르는 영역 44px 이상(달력 칸 안은 예외), 문자열로 이어 붙인 클래스 금지. `React.JSX.Element` 라고 써(전역 `JSX` 없음).
- ⚠️ **Tailwind 3 은 `bg-[var(--sd-line)]/40` 꼴(변수 색 + 투명도)을 못 만든다 — 색이 조용히 빠진다.** 투명도가 필요하면 `bg-[color:color-mix(in_srgb,var(--sd-line)_40%,transparent)]` 처럼 쓰거나 style 로 줘. (지난 시안에서 실제로 칸 색이 다 빠졌다.)
- ⚠️ 성능: 움직임은 transform·opacity 만, 무한 반복·backdrop-blur·layout 애니 금지. 스티커 그림은 `<img loading="lazy" decoding="async" draggable={false}>`.
- 아래에서 올라오는 시트는 지난번 시트들과 같은 결(둥근 윗모서리, 흐린 검정 바탕 톡하면 닫힘, Esc 닫힘, `fixed inset-0 z-[70]`).
- 장부 금지: 횟수·연속 기록·비교 통계를 그리지 않는다.

## 왜 — 우댕 말
> 지금 있는 캘린더랑 다이어리 다른 게 뭐야? 2개를 통합할 수도 있어? … 합치는 쪽으로.

GPT 와 회의해 정한 것(우댕이 「추천대로」 확정):
- 일정(제목·주인·날짜~날짜·시간·장소·메모·알림)은 지금 데이터 그대로 두고, **다이어리 월간 달력이 그 일정을 읽어서 그린다.** 일정에는 아침 알림이 걸려 있다.
- 띠가 두 종류가 된다: **일정 띠**(진짜 일정 — 여러 날 일정) / **장식 띠**(지금의 꾸미기 테이프). 둘은 한눈에 달라 보여야 한다. 일정 띠 = 주인 색의 또렷하고 반듯한 띠(왼쪽에 주인 색 굵은 선), 장식 띠 = 지금처럼 찢긴 끝의 반투명 마스킹테이프.
- 좁은 칸(안쪽 39×58px)에 제목을 다 못 쓴다 → 일정 띠는 **주마다 한 줄**(제목은 띠의 첫 조각에만), 하루짜리 일정은 **주인 색 점**(최대 2개) + 못 그린 것은 **「+2」**. 제목 전체는 날짜를 눌러 연 시트에서 본다.
- 보기 모드에서 날짜 톡 = **그날 시트**(일정 목록 + 「일정 추가」 + 「하루 장 열기」). 일정이 없는 날도 항상 시트.
- 꾸미기 모드에서는 일정 띠·일정 점이 흐려지고 눌리지 않는다. **지우개는 스티커·메모·장식 띠만** 지운다(일정은 절대 못 지움). 일정 삭제는 일정 창 안에서만, 「이 일정을 지우면 알림도 없어져요」 를 보여 주고.
- 각자 달력(우댕·꼼이)에는 자기 일정 + 함께 일정만, 「같이」 달력에는 전부 보인다(걸러서 주는 건 내가 한다).

## 주인 색 — 한 파일에서 정하고 다 같이 쓴다
`src/components/diary/DiaryEventStyle.ts` (이 파일은 **B 묶음**에서 만든다. A 묶음은 import 만):
```ts
import type { EventOwnerKey } from '@/lib/diaryTypes';
export const EVENT_OWNER_STYLE: Record<EventOwnerKey, { label: string /*'꼼이'|'우댕'|'함께'*/; dot: string /*진한 색 hex*/; band: string /*띠 바탕 hex(옅게)*/; text: string /*띠 글씨 hex*/ }>;
```
세 색은 크림 종이·코랄(`--sd-rel`)과 어울리되 서로 뚜렷이 구분되게(색맹도 구분되도록 명도 차이). 기념일의 코랄과 헷갈리지 않게.

## 공용 타입 — `src/lib/diaryTypes.ts` 에 이미 있다(import 해서 써)
```ts
export type Person = '우댕' | '꼼이';
export type MonthOwner = 'together' | Person;
export type EventOwnerKey = 'kkomi' | 'udaeng' | 'together';
export interface MonthStickerVM { id: string; src?: string; decorId?: string; by?: Person }
export interface MonthSpecialVM { id: string; label: string; kind: 'birthday' | 'anniversary' | 'custom'; years?: number; sticker?: MonthStickerVM }
export interface MonthCellEventsVM { owners: EventOwnerKey[] /*칸에 점으로 그릴 하루 일정의 주인, 최대 2*/; more: number /*칸에 못 그린 일정 수 → 「+N」*/ }
export interface DiaryMonthCellVM {
  date: string; day: number; inMonth: boolean; isToday: boolean; holiday?: boolean;
  stickers: MonthStickerVM[]; memo?: string; specials: MonthSpecialVM[]; mine: boolean; partner: boolean;
  events?: MonthCellEventsVM;
}
// 한 주 안의 띠 조각 — 어느 주·몇 번째 칸부터 몇 칸·몇 번째 줄인지는 내가 계산해서 준다(너는 그리기만).
export interface MonthBandSegVM {
  key: string; id: string; kind: 'event' | 'decor';
  week: number /*0~5*/; col: number /*0~6*/; span: number /*칸 수*/; row: 0 | 1 /*띠 줄: 0 윗줄, 1 아랫줄*/;
  label: string; showLabel: boolean; continuesLeft: boolean; continuesRight: boolean /*앞·뒤 주로 이어짐 — 그쪽 끝은 반듯하게 잘라*/;
  owner?: EventOwnerKey /*event*/; decorId?: string /*decor 는 테이프 id. event 는 있으면 그 테이프 무늬를 띠 바탕으로*/;
}
export interface DiaryEventVM {
  id: string; title: string; owner: EventOwnerKey; startDate: string; endDate: string;
  allDay: boolean; startTime?: string /*'HH:mm'*/; location?: string; memo?: string; remindDaysBefore: number[]; decorId?: string;
}
export interface DiaryEventDraft {
  title: string; owner: EventOwnerKey; startDate: string; endDate: string;
  allDay: boolean; startTime: string; location: string; memo: string; remindDaysBefore: number[] /*[] | [1] | [7] | [1,7]*/; decorId: string | null /*null = 주인 색 기본*/;
}
export interface UpcomingItemVM {
  id: string; kind: 'event' | 'special'; title: string; whenLabel: string /*'오늘'|'내일'|'3일 뒤'|'진행 중'*/; dateLabel: string /*'11월 21일 (토)'*/;
  owner?: EventOwnerKey; timeLabel?: string /*'10:30'*/; date: string;
}
export type MonthTitleStyle = 'plain' | 'brush' | 'round';
export type MonthTool = 'sticker' | 'span' | 'memo' | 'erase';
export interface DiaryAssetVM { id: string; kind: 'sticker' | 'tape' | 'stamp'; src?: string; decorId?: string; label?: string; favorite?: boolean }
```
이미 있는 부품: `import { DiaryDecor } from './DiaryDecor'`(`<DiaryDecor decorId className />` — 부모 칸을 가득 채움, 테이프 id `tape-honey|apricot|sage|sky|stripe|grid|dots|kraft`).

## 이번 묶음(B) — 파일 5개 (`src/components/diary/`)

#### ① `DiaryEventStyle.ts` — 주인 색(위 「주인 색」 모양 그대로 export). 컴포넌트 없음.

#### ② `DiaryDayAgendaSheet.tsx` — 날짜를 눌렀을 때 그날 시트(새 파일)
```ts
export interface DiaryDayAgendaSheetProps {
  open: boolean; dateLabel: string /*'11월 17일 화요일'*/; holiday?: string | null; specials: MonthSpecialVM[];
  events: DiaryEventVM[];                                   // 그날 일정(여러 날 일정 포함), 내가 정렬해서 준다
  me: Person;
  pages: Record<Person, { has: boolean; excerpt?: string; thumbSrc?: string }>;   // 두 사람의 그날 하루 장
  onAddEvent: () => void; onOpenEvent: (id: string) => void; onOpenPage: (owner: Person) => void; onClose: () => void;
}
```
- 위: 날짜(Dongle 크게) + 공휴일·기념일 작은 칩(「3주년」 포함).
- **일정 목록**: 줄마다 주인 색 세로선 + 제목 + 둘째 줄에 `하루 종일` 또는 시간, 여러 날이면 `11.21 ~ 11.23`, 장소(있으면), 알림이 걸려 있으면 작은 종(lucide Bell). 줄 전체가 버튼(44px 이상) → `onOpenEvent`. 일정이 없으면 한 줄 「일정이 없는 날이에요」.
- 목록 아래 「일정 추가」(보조 버튼, lucide CalendarPlus).
- **하루 장**: 두 사람 칸을 나란히(내 것 먼저). 쓴 장 = 썸네일(있으면) + 첫 줄 + 「열기」. 안 쓴 **내** 장 = 「한 장 꾸미기」(주 버튼 — 이 시트에서 제일 눈에 띄는 단추). 안 쓴 **상대** 장 = 흐리게 「아직 없어요」(안 눌림).
- 시트가 길면 안에서 스크롤(`max-h-[85dvh]`).

#### ③ `DiaryEventSheet.tsx` — 일정 추가·수정(새 파일, 값은 밖에서 받고 바뀐 것만 알린다)
```ts
export interface DiaryEventSheetProps {
  open: boolean; mode: 'create' | 'edit'; value: DiaryEventDraft; saving: boolean;
  tapeIds: string[];                                        // 띠 무늬 후보(DiaryDecor 테이프 id)
  onChange: (patch: Partial<DiaryEventDraft>) => void;
  onSave: () => void; onDelete?: () => void /*edit 일 때만*/; onClose: () => void;
}
```
- 한 손으로 빨리: 처음엔 **간단히** — 제목(한 줄, 16px) / 주인(꼼이·우댕·함께 3칸, 주인 색) / 날짜(시작 ~ 끝, `<input type="date">` 두 개 — 값 검증은 내가 한다) / 하루 종일 토글(끄면 시작 시간 `<input type="time">`) / 띠 무늬(「주인 색」 칸 + `tapeIds` 가로 한 줄, `DiaryDecor` 미리보기).
- 접힌 줄 **「장소·메모·알림 더하기」** 를 누르면 펼침: 장소(한 줄) / 메모(3줄) / 알림 = 「하루 전」「일주일 전」 토글 칩 2개 + 설명 「그날 아침 8시에 알려 줘요」. `mode === 'edit'` 이고 장소·메모·알림 중 값이 있으면 처음부터 펼친 채로.
- 아래 고정: 「저장」(제목이 비면 비활성, `saving` 이면 「저장 중…」 + 비활성). 키보드가 올라와도 보이게 시트는 `max-h-[88dvh]`, 내용만 스크롤.
- `mode === 'edit'` 이고 `onDelete` 가 있으면 내용 맨 아래 작은 글씨 단추 「일정 지우기」 → 누르면 그 자리에 확인 줄: **「이 일정을 지우면 알림도 없어져요」** [취소] [지우기] → `onDelete`. (실수로 한 번에 지워지면 안 된다.)
- 창이 열릴 때마다 확인 줄·펼침 상태를 처음으로.

#### ④ `DiaryUpcomingSheet.tsx` — 다가오는 일정·기념일 목록(새 파일)
```ts
export interface DiaryUpcomingSheetProps { open: boolean; items: UpcomingItemVM[]; onOpenItem: (item: UpcomingItemVM) => void; onClose: () => void }
```
- 제목 「다가와요」. 줄마다: 왼쪽 표시(일정 = 주인 색 점, 기념일 = 작은 케이크/하트 코랄) + `whenLabel` 굵게 + 제목 + 오른쪽에 `dateLabel`(`timeLabel` 있으면 같이) 작게. 줄 전체가 버튼. 빈 목록 = 「보름 안에 다가오는 일이 없어요」. 개수·통계 글 금지.

#### ⑤ `DiaryHomeCard.tsx` — 홈의 달력 카드와 다이어리 카드를 하나로(아래 「지금 코드」를 고쳐 파일 전체 다시)
```ts
export interface DiaryHomeCardProps {
  dateLabel: string; excerpt?: string; thumbSrc?: string; partnerWroteToday?: boolean;
  nextEvent?: { title: string; whenLabel: string; owner: EventOwnerKey } | null;   // 가장 가까운 일정 한 줄
  onOpen: () => void;         // 오늘 하루 장
  onOpenMonth: () => void;    // 월간 달력(일정)
}
```
- 카드 크기·결은 지금 그대로(2x1, 최소 높이 140px). 제목은 「우리 다이어리」.
- 누르는 곳이 둘: **윗부분**(날짜·오늘 장 첫 줄·썸네일·상대 표시 — 지금 그대로) → `onOpen`, **맨 아래 한 줄**(위에 옅은 선) → `onOpenMonth`: `nextEvent` 가 있으면 주인 색 점 + `whenLabel` 굵게 + ` · title` + `›`, 없으면 「달력 보기 ›」. 한 줄은 44px 이상.
- `<button>` 안에 `<button>` 을 넣지 마(바깥은 div).

## 답 형식
파일 5개 완성 코드(각각 맨 위 `// src/components/diary/파일이름` 주석 — 확장자까지, tsx 파일은 `'use client';`, named export). 설명은 맨 끝 3줄 이내. **긴 주석 금지(답이 길면 끊긴다).**

---
## 지금 코드(참고)

### DiaryHomeCard.tsx 
```tsx
// src/components/diary/DiaryHomeCard.tsx
'use client';

import React from 'react';

export interface DiaryHomeCardProps {
  dateLabel: string;
  excerpt?: string;
  thumbSrc?: string;
  partnerWroteToday?: boolean;
  onOpen: () => void;
}

export function DiaryHomeCard({
  dateLabel,
  excerpt,
  thumbSrc,
  partnerWroteToday = false,
  onOpen,
}: DiaryHomeCardProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="sd-card w-full h-full px-4 py-4 flex flex-col justify-between relative text-left active:scale-[.98] transition-transform rounded-2xl border border-[var(--sd-line)]"
      style={{
        background: 'var(--sd-card-solid, #FFFFFF)',
        minHeight: '140px',
        boxShadow: 'var(--sd-shadow-card, 0 4px 16px rgba(46,29,38,0.06))',
      }}
    >
      {/* 상단: 다이어리 라벨과 날짜 */}
      <div>
        <div className="flex items-center justify-between">
          <span className="font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)] font-normal">
            다이어리
          </span>
          <span className="text-xs text-[var(--sd-faint)]">{dateLabel}</span>
        </div>

        {/* 일기 미리보기 또는 작성 유도 문구 */}
        <p className="text-xs text-[var(--sd-muted)] mt-2 line-clamp-2 leading-relaxed">
          {excerpt ? excerpt : '오늘 한 장 꾸며 볼까요?'}
        </p>
      </div>

      {/* 하단: 상대방 작성 알림 & 썸네일 */}
      <div className="flex items-center justify-between mt-3">
        {partnerWroteToday ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-medium">
            꼼이가 오늘 한 장 썼어요
          </span>
        ) : (
          <span />
        )}

        {thumbSrc && (
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-[var(--sd-line)] bg-[var(--sd-surface-2)]">
            <img
              src={thumbSrc}
              alt="diary thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
      </div>
    </button>
  );
}
```

### DiaryMonthMemoSheet.tsx — 시트는 이 결로(고치지 않는다, 참고만)
```tsx
// src/components/diary/DiaryMonthMemoSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export interface DiaryMonthMemoSheetProps {
  open: boolean;
  dateLabel: string;
  value: string;
  onSave: (text: string) => void;
  onClose: () => void;
}

export function DiaryMonthMemoSheet({
  open,
  dateLabel,
  value,
  onSave,
  onClose,
}: DiaryMonthMemoSheetProps): React.JSX.Element | null {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (open) setText(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(text.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25">
      <div
        className="w-full max-w-md bg-[var(--sd-card-solid)] border-t border-[var(--sd-line)] rounded-t-3xl shadow-2xl p-5 flex flex-col space-y-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--sd-line)]">
          <span className="font-['Dongle'] text-2xl text-[var(--sd-ink)] font-normal">
            {dateLabel} 한 줄 메모
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              maxLength={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="7자 이내 메모"
              autoFocus
              className="w-full min-h-[44px] px-3.5 pr-12 rounded-xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[16px] text-[var(--sd-ink)] outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--sd-faint)]">
              {text.length}/7
            </span>
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-[var(--sd-ink)] text-white text-sm font-medium flex items-center justify-center gap-1 active:opacity-90"
          >
            <Check className="w-4 h-4" />
            넣기
          </button>
        </form>
      </div>
    </div>
  );
}
```
