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

## 이번 묶음(A) — 고칠 파일 2개 (`src/components/diary/`). 아래 「지금 코드」를 고쳐서 **파일 전체**를 다시 써 줘.
지금 코드의 계산·규칙(스티커 크기 `px`, `specialBig`, 메모 줄 수, 지우개 테두리, color-mix 클래스, 머리·주인 전환·여백 줄·되돌리기·저장 상태·⋯ 메뉴)은 **그대로 두고**, 아래에 적은 것만 바꾼다. 안 바꿔도 되는 줄은 한 글자도 건드리지 마.

#### ① `DiaryMonthCell.tsx`
- props 는 그대로(`hasSpanAbove` = 이 칸 위를 지나는 띠 **줄 수** 0~2, 한 줄 13px).
- `cell.events` 가 있으면 일정 표시를 더한다: `owners` 만큼 **주인 색 점**(지름 5px, `EVENT_OWNER_STYLE[owner].dot`, 최대 2개) + `more > 0` 이면 **「+N」**(8~9px, `--sd-muted`). 칸 안쪽은 39×58px 뿐이다 — 날짜 줄(16px)에는 이미 날짜 숫자·기념일 표시(「3주년」)가 있고 오른쪽 위에는 하루 장 점(4px, 검정/옅은 색)이 있다. 일정 점·「+N」과 하루 장 점이 **서로 헷갈리지 않고 겹치지 않게** 자리를 다시 잡아 줘(예: 일정 점은 날짜 줄 오른쪽 끝, 하루 장 점은 칸 아래쪽 귀퉁이 — 네가 제일 예쁜 쪽으로). 「25 3주년」 처럼 날짜 줄이 꽉 찬 칸에서도 겹치면 안 된다.
- `mode === 'decorate'` 이면 일정 점·「+N」은 40% 로 흐리게.
- `hasSpanAbove === 2` 인 칸: 스티커는 16px, 스티커가 있으면 메모는 숨긴다(자리가 없다). `hasSpanAbove === 1` 은 지금 규칙 그대로.

#### ② `DiaryMonthScreen.tsx`
props 바뀌는 것(나머지는 그대로):
```ts
// 빠짐: spans, onTapSpan
bands: MonthBandSegVM[];                                   // 띠 조각 — 자리 계산은 끝나 있다. 그리기만.
onTapBand: (id: string, kind: 'event' | 'decor') => void;
upcoming?: UpcomingItemVM | null;                          // (전에는 {label, daysLeft})
onOpenUpcoming: () => void;
onAddEvent: () => void;
```
- **띠 그리기**: 지금의 조각 계산 코드는 지우고 `bands` 를 그대로 그린다. `week` 행의 칸 위쪽(날짜 줄 바로 아래), `row` 0/1(줄 간격 13px, 띠 높이 11~12px), 왼쪽 = `col/7`, 폭 = `span/7`(양옆 2px 띄움). `showLabel` 일 때만 `label`(8~9px, 한 줄, 넘치면 자름). `continuesLeft/Right` 인 쪽 끝은 반듯하게.
  - `kind === 'event'`: `EVENT_OWNER_STYLE[owner]` 의 `band` 바탕 + 왼쪽 끝 `dot` 색 굵은 선(2~3px) + `text` 색 글씨, 모서리 살짝 둥글게. `decorId` 가 있으면 그 테이프 무늬(`DiaryDecor`)를 바탕에 옅게 깔고 왼쪽 선과 글씨는 그대로.
  - `kind === 'decor'`: 지금의 마스킹테이프 그대로(`DiaryDecor decorId`, 반투명, 찢긴 끝).
  - 보기 모드: 일정 띠 톡 → `onTapBand(id, 'event')`. 장식 띠는 눌리지 않는다(`pointer-events-none` — 밑의 날짜 칸이 눌린다).
  - 꾸미기 모드: 일정 띠는 40% 로 흐리고 눌리지 않는다. 장식 띠 톡 → `onTapBand(id, 'decor')`.
- 각 칸에 넘기는 `hasSpanAbove` = 그 칸을 지나는 조각들의 `row` 최댓값 + 1 (없으면 0). `bands` 에서 계산해.
- **다가오는 한 줄**: `upcoming` 이 있으면 누를 수 있는 한 줄 → `onOpenUpcoming`. 내용 = 아이콘(kind 'event' = 주인 색 점, 'special' = 작은 케이크) + `whenLabel` 굵게 + ` · title` + (있으면 `timeLabel`) + 오른쪽 끝 `›`.
- **아래 고정 줄(보기 모드)**: 「일정 추가」(주 버튼, lucide CalendarPlus) + `canEdit` 일 때만 「달력 꾸미기」(보조 버튼). `canEdit` 이 아니어도 「일정 추가」는 보인다.
- 꾸미기 도구 이름 「기간 띠」 → **「장식 띠」**. 그 도구의 안내 줄 = 「꾸미기용 띠예요 · 알림이 필요하면 일정으로」 뒤에 지금처럼 「시작하는 날을 톡」/「끝나는 날을 톡」.
- 지우개 안내 줄 = 「스티커·메모·장식 띠를 톡 (일정은 안 지워져요)」.

## 답 형식
파일 2개 완성 코드(각각 맨 위 `// src/components/diary/파일이름.tsx` 주석, `'use client';`, named export). 설명은 맨 끝 3줄 이내. **긴 주석 금지(답이 길면 끊긴다).**

---
## 지금 코드

### DiaryMonthCell.tsx
```tsx
// src/components/diary/DiaryMonthCell.tsx
'use client';

import React from 'react';
import { Cake, Heart, Star } from 'lucide-react';
import { DiaryMonthCellVM, MonthTool } from '@/lib/diaryTypes';
import { DiaryDecor } from './DiaryDecor';

export interface DiaryMonthCellProps {
  cell: DiaryMonthCellVM;
  mode: 'view' | 'decorate';
  tool: MonthTool | null;
  marked?: boolean;
  hasSpanAbove?: number;
  onTap: () => void;
  onRemoveSticker?: (stickerId: string) => void;
  onRemoveMemo?: () => void;
}

export function DiaryMonthCell({
  cell,
  mode,
  tool,
  marked = false,
  hasSpanAbove = 0,
  onTap,
  onRemoveSticker,
  onRemoveMemo,
}: DiaryMonthCellProps): React.JSX.Element {
  const isErase = mode === 'decorate' && tool === 'erase';
  const special = cell.specials[0];
  // 스티커 크기(우댕 2026-11-17 「스티커 키워줘」) — 16px 고정이던 것을 칸에 맞춰 키운다. 칸 안쪽이 39x58px 라서
  //   한 개 26 · 긴 메모(두 줄)와 같이 22 · 기간 띠 밑 20 · 두 개 19.
  // 기념일 전용 스티커는 자리가 있으면(붙인 스티커 0~1개) 가운데 줄에 같은 크기로, 없으면 날짜 옆에 작게.
  const userStickers = cell.stickers.slice(0, 2);
  const specialBig = !!special?.sticker && userStickers.length < 2;
  const shown = (specialBig ? 1 : 0) + userStickers.length;
  const px = shown >= 2 ? 19 : hasSpanAbove > 0 ? 20 : cell.memo && cell.memo.length > 4 ? 22 : 26;
  const drawSticker = (st: { src?: string; decorId?: string }) =>
    st.src ? (
      <img src={st.src} alt="" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-contain" />
    ) : st.decorId ? (
      <DiaryDecor decorId={st.decorId} className="w-full h-full" />
    ) : null;

  return (
    <div
      onClick={cell.inMonth ? onTap : undefined}
      className={`relative w-full h-[66px] p-1 flex flex-col justify-between border-b border-r border-[color:color-mix(in_srgb,var(--sd-line)_40%,transparent)] select-none ${
        !cell.inMonth
          ? 'opacity-25 bg-[color:color-mix(in_srgb,var(--sd-surface-2)_30%,transparent)]'
          : marked
          ? 'bg-[color:color-mix(in_srgb,var(--sd-rel-soft)_60%,transparent)]'
          : 'bg-transparent'
      } ${cell.inMonth && mode === 'decorate' ? 'cursor-pointer active:bg-[color:color-mix(in_srgb,var(--sd-surface-2)_50%,transparent)]' : ''}`}
    >
      <div className="flex items-center justify-between w-full h-4">
        <div className="flex items-center gap-0.5">
          {cell.isToday ? (
            <span className="w-4 h-4 rounded-full bg-[var(--sd-rel)] text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {cell.day}
            </span>
          ) : (
            <span
              className={`text-[11px] font-medium leading-none ${
                cell.holiday ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-ink)]'
              }`}
            >
              {cell.day}
            </span>
          )}

          {special && (
            <div className="flex items-center gap-0.5 ml-0.5">
              {special.sticker ? (
                specialBig ? null : <div className="w-3.5 h-3.5">{drawSticker(special.sticker)}</div>
              ) : special.kind === 'birthday' ? (
                <Cake className="w-2.5 h-2.5 text-[var(--sd-rel)]" />
              ) : special.kind === 'anniversary' ? (
                special.years ? null : <Heart className="w-2.5 h-2.5 text-[var(--sd-rel)] fill-current" />
              ) : (
                <Star className="w-2.5 h-2.5 text-[var(--sd-rel)]" />
              )}
              {special.years && (
                <span className="text-[9px] text-[var(--sd-rel)] font-medium leading-none whitespace-nowrap">
                  {special.years}주년
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {hasSpanAbove > 0 && (
        <div style={{ height: `${hasSpanAbove * 13}px` }} className="shrink-0" />
      )}

      {/* 하루 장을 쓴 날의 점 — 메모 줄에 같이 있으면 메모가 두세 글자에서 잘려서(칸 폭 47px) 오른쪽 위로 뺐다 */}
      {(cell.mine || cell.partner) && (
        <div className={`absolute right-[3px] flex items-center gap-0.5 ${special?.years ? 'top-[21px]' : 'top-[10px]'}`}>
          {cell.mine && <span className="w-1 h-1 rounded-full bg-[var(--sd-ink)]" />}
          {cell.partner && <span className="w-1 h-1 rounded-full bg-[var(--sd-line)]" />}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center gap-px" style={shown ? { minHeight: px } : undefined}>
        {specialBig && special?.sticker && (
          <div className="flex items-center justify-center shrink-0" style={{ width: px, height: px }}>
            {drawSticker(special.sticker)}
          </div>
        )}
        {userStickers.map((s) => (
          <div
            key={s.id}
            onClick={(e) => {
              if (isErase && onRemoveSticker) {
                e.stopPropagation();
                onRemoveSticker(s.id);
              }
            }}
            style={{ width: px, height: px }}
            className={`flex items-center justify-center shrink-0 ${
              isErase
                ? 'rounded border border-[color:color-mix(in_srgb,var(--sd-crit)_60%,transparent)] bg-[color:color-mix(in_srgb,var(--sd-crit)_10%,transparent)] cursor-pointer'
                : ''
            }`}
          >
            {drawSticker(s)}
          </div>
        ))}
      </div>

      {/* 한 줄 메모(7자) — 칸 폭에 네 글자쯤 들어가서 두 줄까지 보여 준다. 기간 띠 + 스티커가 같이 있는 칸만 한 줄. */}
      {cell.memo && (
        <div
          onClick={(e) => {
            if (isErase && onRemoveMemo) {
              e.stopPropagation();
              onRemoveMemo();
            }
          }}
          className={`w-full text-center break-all text-[9px] leading-[10px] text-[var(--sd-muted)] font-normal ${
            hasSpanAbove > 0 && cell.stickers.length > 0 ? 'line-clamp-1' : 'line-clamp-2'
          } ${
            isErase
              ? 'rounded border border-[color:color-mix(in_srgb,var(--sd-crit)_60%,transparent)] bg-[color:color-mix(in_srgb,var(--sd-crit)_10%,transparent)] cursor-pointer'
              : ''
          }`}
        >
          {cell.memo}
        </div>
      )}
    </div>
  );
}
```

### DiaryMonthScreen.tsx
```tsx
// src/components/diary/DiaryMonthScreen.tsx
'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MoreHorizontal,
  Paintbrush,
  Check,
  Undo2,
  Cake,
  Heart,
  Smile,
  Layers,
  FileText,
  Eraser,
} from 'lucide-react';
import {
  Person,
  MonthOwner,
  MonthStickerVM,
  DiaryMonthCellVM,
  MonthSpanVM,
  MonthTitleStyle,
  MonthTool,
  DiaryAssetVM,
} from '@/lib/diaryTypes';
import { DiaryMonthCell } from './DiaryMonthCell';
import { DiaryDecor } from './DiaryDecor';

export interface DiaryMonthScreenProps {
  me: Person;
  owner: MonthOwner;
  canEdit: boolean;
  monthLabel: string;
  monthNumber: number;
  titleStyle: MonthTitleStyle;
  hero?: MonthStickerVM | null;
  cells: DiaryMonthCellVM[];
  spans: MonthSpanVM[];
  margin: MonthStickerVM[];
  upcoming?: { label: string; daysLeft: number } | null;
  mode: 'view' | 'decorate';
  tool: MonthTool | null;
  selectedAsset?: DiaryAssetVM | null;
  spanStart?: string | null;
  undoText?: string | null;
  saveState: 'saved' | 'saving' | 'offline';
  onBack: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoThisMonth: () => void;
  onChangeOwner: (o: MonthOwner) => void;
  onToggleMode: () => void;
  onPickTool: (t: MonthTool) => void;
  onOpenAssets: () => void;
  onTapDay: (date: string) => void;
  onRemoveSticker: (date: string, stickerId: string) => void;
  onRemoveMemo: (date: string) => void;
  onTapSpan: (spanId: string) => void;
  onTapHero: () => void;
  onTapMargin: (index: number) => void;
  onCycleTitleStyle: () => void;
  onUndo: () => void;
  onOpenSpecialDates: () => void;
}

interface SpanPiece {
  span: MonthSpanVM;
  startCol: number;
  colSpan: number;
  track: number;
  isFirst: boolean;
}

export function DiaryMonthScreen({
  me,
  owner,
  canEdit,
  monthLabel,
  monthNumber,
  titleStyle,
  hero,
  cells,
  spans,
  margin,
  upcoming,
  mode,
  tool,
  selectedAsset,
  spanStart,
  undoText,
  saveState,
  onBack,
  onPrevMonth,
  onNextMonth,
  onGoThisMonth,
  onChangeOwner,
  onToggleMode,
  onPickTool,
  onOpenAssets,
  onTapDay,
  onRemoveSticker,
  onRemoveMemo,
  onTapSpan,
  onTapHero,
  onTapMargin,
  onCycleTitleStyle,
  onUndo,
  onOpenSpecialDates,
}: DiaryMonthScreenProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDecorate = mode === 'decorate';

  const cellSpansAbove: number[] = new Array(cells.length).fill(0);
  const weekSpanPieces: SpanPiece[][] = Array.from({ length: 6 }, () => []);

  for (let w = 0; w < 6; w++) {
    const wStart = cells[w * 7]?.date;
    const wEnd = cells[w * 7 + 6]?.date;
    if (!wStart || !wEnd) continue;

    const currentSpans = spans.filter((s) => s.startDate <= wEnd && s.endDate >= wStart);
    const tracks: (string | null)[] = [null, null];

    currentSpans.forEach((s) => {
      let startCol = 0;
      let endCol = 6;
      for (let c = 0; c < 7; c++) {
        const d = cells[w * 7 + c].date;
        if (d === s.startDate) startCol = c;
        if (d === s.endDate) endCol = c;
      }
      if (s.startDate < wStart) startCol = 0;
      if (s.endDate > wEnd) endCol = 6;

      let chosenTrack = 0;
      if (tracks[0] !== null) chosenTrack = 1;
      tracks[chosenTrack] = s.id;

      const isFirst = s.startDate >= wStart && s.startDate <= wEnd;
      weekSpanPieces[w].push({
        span: s,
        startCol,
        colSpan: endCol - startCol + 1,
        track: chosenTrack,
        isFirst,
      });

      for (let c = startCol; c <= endCol; c++) {
        const cellIdx = w * 7 + c;
        cellSpansAbove[cellIdx] = Math.min(2, (cellSpansAbove[cellIdx] || 0) + 1);
      }
    });
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#FCFAF7] flex flex-col justify-between select-none">
      <div className="p-4 space-y-3">
        {/* 상단 바 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCycleTitleStyle}
              className="flex items-center gap-2 active:opacity-80"
            >
              {titleStyle === 'round' ? (
                <div className="w-10 h-10 rounded-full bg-[#F5DEB3]/50 flex items-center justify-center">
                  <span className="font-['Dongle'] text-3xl leading-none text-[var(--sd-ink)]">
                    {monthNumber}
                  </span>
                </div>
              ) : titleStyle === 'brush' ? (
                <div className="relative pb-0.5">
                  <span className="font-['Dongle'] text-4xl text-[var(--sd-ink)] italic leading-none">
                    {monthNumber}월
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-[color:color-mix(in_srgb,var(--sd-rel)_30%,transparent)]" />
                </div>
              ) : (
                <span className="font-['Dongle'] text-4xl text-[var(--sd-ink)] leading-none">
                  {monthNumber}월
                </span>
              )}
            </button>

            <div
              onClick={onTapHero}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden ${
                hero
                  ? 'bg-transparent'
                  : isDecorate
                  ? 'border border-dashed border-[var(--sd-line)] bg-[color:color-mix(in_srgb,var(--sd-surface-2)_50%,transparent)] cursor-pointer'
                  : 'bg-transparent'
              }`}
            >
              {hero ? (
                hero.src ? (
                  <img
                    src={hero.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  hero.decorId && <DiaryDecor decorId={hero.decorId} className="w-full h-full" />
                )
              ) : isDecorate ? (
                <span className="text-[10px] text-[var(--sd-faint)]">머리</span>
              ) : null}
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={onPrevMonth}
                className="w-7 h-8 flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNextMonth}
                className="w-7 h-8 flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 relative">
            <span className="text-[10px] text-[var(--sd-faint)]">
              {saveState === 'saving' ? '저장 중' : saveState === 'offline' ? '오프라인' : ''}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--sd-muted)] active:scale-95"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 z-30 w-36 py-1 rounded-2xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-lg space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onGoThisMonth();
                  }}
                  className="w-full h-10 px-3 text-left text-xs text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
                >
                  이번 달로
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSpecialDates();
                  }}
                  className="w-full h-10 px-3 text-left text-xs text-[var(--sd-ink)] active:bg-[var(--sd-surface-2)]"
                >
                  생일·기념일 관리
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 주인 전환 알약 */}
        <div className="flex items-center justify-between">
          <div className="flex p-0.5 rounded-full bg-[var(--sd-surface-2)] border border-[color:color-mix(in_srgb,var(--sd-line)_60%,transparent)]">
            {(['together', '우댕', '꼼이'] as MonthOwner[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onChangeOwner(tab)}
                className={`min-h-[32px] px-3 rounded-full text-xs transition-colors ${
                  owner === tab
                    ? 'bg-[var(--sd-card-solid)] text-[var(--sd-ink)] font-medium shadow-sm'
                    : 'text-[var(--sd-muted)]'
                }`}
              >
                {tab === 'together' ? '같이' : tab}
              </button>
            ))}
          </div>

          {!canEdit && (
            <span className="text-[11px] text-[var(--sd-faint)]">
              {owner}의 달력 — 보기 전용
            </span>
          )}
        </div>

        {/* 기념일 알림 한 줄 */}
        {upcoming && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] text-xs font-medium">
            <Cake className="w-3.5 h-3.5 shrink-0" />
            <span>
              {upcoming.daysLeft === 0 ? `오늘은 ${upcoming.label}` : `곧 ${upcoming.label} · ${upcoming.daysLeft}일`}
            </span>
          </div>
        )}

        {/* 달력 종이 */}
        <div className="relative rounded-2xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-sm overflow-hidden p-2">
          {/* 바인더 구멍 */}
          <div className="absolute left-1 top-4 bottom-4 flex flex-col justify-between pointer-events-none z-10">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#E8DDD8] border border-[var(--sd-line)]"
              />
            ))}
          </div>

          <div className="pl-2">
            <div className="grid grid-cols-7 mb-1 text-center text-[10px] text-[var(--sd-faint)]">
              <span className="text-[var(--sd-rel)] font-medium">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
            </div>

            <div className="flex flex-col border-t border-l border-[color:color-mix(in_srgb,var(--sd-line)_40%,transparent)]">
              {Array.from({ length: 6 }, (_, w) => (
                <div key={w} className="relative grid grid-cols-7">
                  {weekSpanPieces[w].map((piece) => {
                    const leftPct = (piece.startCol / 7) * 100;
                    const widthPct = (piece.colSpan / 7) * 100;
                    const topPx = 18 + piece.track * 13;

                    return (
                      <div
                        key={`${piece.span.id}-${w}`}
                        onClick={(e) => {
                          if (isDecorate) {
                            e.stopPropagation();
                            onTapSpan(piece.span.id);
                          }
                        }}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: `${topPx}px`,
                        }}
                        className={`absolute h-[11px] z-10 rounded-sm overflow-hidden px-1 flex items-center select-none ${
                          isDecorate ? 'cursor-pointer active:opacity-75' : 'pointer-events-none'
                        }`}
                      >
                        {/* DiaryDecor 뿌리가 relative 라 absolute 를 직접 주면 안 먹는다(띠가 줄어들고 이름이 밖으로 밀림) → 감싸서 깐다 */}
                        <div className="absolute inset-0 opacity-80">
                          <DiaryDecor decorId={piece.span.decorId} />
                        </div>
                        {piece.isFirst && (
                          <span className="relative z-10 text-[9px] text-[var(--sd-ink)] font-medium truncate leading-none">
                            {piece.span.label}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {cells.slice(w * 7, w * 7 + 7).map((cell, cIdx) => {
                    const globalIdx = w * 7 + cIdx;
                    return (
                      <DiaryMonthCell
                        key={cell.date}
                        cell={cell}
                        mode={mode}
                        tool={tool}
                        marked={spanStart === cell.date}
                        hasSpanAbove={cellSpansAbove[globalIdx]}
                        onTap={() => onTapDay(cell.date)}
                        onRemoveSticker={(sId) => onRemoveSticker(cell.date, sId)}
                        onRemoveMemo={() => onRemoveMemo(cell.date)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* 아래 여백 줄 (스티커 최대 6) */}
            <div className="mt-2 pt-2 border-t border-[color:color-mix(in_srgb,var(--sd-line)_50%,transparent)] flex items-center justify-between px-1">
              {Array.from({ length: 6 }, (_, idx) => {
                const item = margin[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => onTapMargin(idx)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item
                        ? 'bg-transparent'
                        : isDecorate
                        ? 'border border-dashed border-[var(--sd-line)] bg-[color:color-mix(in_srgb,var(--sd-surface-2)_40%,transparent)] cursor-pointer active:scale-95'
                        : 'opacity-0'
                    }`}
                  >
                    {item ? (
                      item.src ? (
                        <img
                          src={item.src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        item.decorId && (
                          <DiaryDecor decorId={item.decorId} className="w-full h-full" />
                        )
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 제어 줄 */}
      <div
        className="w-full border-t border-[var(--sd-line)] bg-[var(--sd-card-solid)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {undoText && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--sd-surface-2)] border-b border-[var(--sd-line)] text-xs text-[var(--sd-ink)]">
            <span>{undoText}</span>
            <button
              type="button"
              onClick={onUndo}
              className="flex items-center gap-1 font-medium text-[var(--sd-rel)] active:opacity-80"
            >
              <Undo2 className="w-3.5 h-3.5" />
              되돌리기
            </button>
          </div>
        )}

        {!isDecorate ? (
          <div className="p-3 flex justify-center">
            {canEdit && (
              <button
                type="button"
                onClick={onToggleMode}
                className="w-full min-h-[44px] rounded-2xl bg-[var(--sd-surface-2)] border border-[var(--sd-line)] text-[var(--sd-ink)] text-sm font-medium flex items-center justify-center gap-1.5 active:bg-[color:color-mix(in_srgb,var(--sd-line)_50%,transparent)]"
              >
                <Paintbrush className="w-4 h-4 text-[var(--sd-rel)]" />
                달력 꾸미기
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <div className="flex items-center justify-between px-2 text-xs text-[var(--sd-muted)]">
              {tool === 'sticker' && (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-[var(--sd-surface-2)] flex items-center justify-center overflow-hidden">
                      {selectedAsset?.src ? (
                        <img
                          src={selectedAsset.src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="w-full h-full object-contain"
                        />
                      ) : selectedAsset?.decorId ? (
                        <DiaryDecor decorId={selectedAsset.decorId} className="w-full h-full" />
                      ) : (
                        <Smile className="w-3.5 h-3.5 text-[var(--sd-faint)]" />
                      )}
                    </div>
                    <span>날짜를 톡 하면 붙어요</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAssets}
                    className="min-h-[32px] px-2 rounded-lg bg-[var(--sd-surface-2)] text-[11px] text-[var(--sd-ink)] font-medium"
                  >
                    다른 스티커
                  </button>
                </div>
              )}
              {tool === 'span' && (
                <span>{spanStart ? '끝나는 날을 톡' : '시작하는 날을 톡'}</span>
              )}
              {tool === 'memo' && <span>메모할 날짜를 톡</span>}
              {tool === 'erase' && <span>지울 것을 톡</span>}
            </div>

            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 flex-1">
                {(
                  [
                    { id: 'sticker', label: '스티커', icon: Smile },
                    { id: 'span', label: '기간 띠', icon: Layers },
                    { id: 'memo', label: '메모', icon: FileText },
                    { id: 'erase', label: '지우개', icon: Eraser },
                  ] as { id: MonthTool; label: string; icon: any }[]
                ).map((t) => {
                  const Icon = t.icon;
                  const active = tool === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onPickTool(t.id)}
                      className={`flex-1 min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                        active
                          ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] font-medium'
                          : 'bg-[var(--sd-surface-2)] text-[var(--sd-muted)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onToggleMode}
                className="min-w-[48px] min-h-[44px] rounded-xl bg-[var(--sd-ink)] text-white text-xs font-medium flex items-center justify-center gap-0.5 px-3 active:opacity-90"
              >
                <Check className="w-4 h-4" />
                완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```
