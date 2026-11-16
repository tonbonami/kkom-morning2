너는 모바일 앱 UI 디자이너 겸 React 개발자야. 지난번에 네가 만든 꼼모닝 「다꾸 다이어리」(하루 한 장) 시안에 **월간 꾸미기 달력**을 더한다. 파일을 열거나 명령을 실행하지 말고, 답에 코드만 써 줘.

## 앱·규칙(지난번과 같다)
- 꼼모닝: 연인 둘(우댕·꼼이)만 쓰는 커플 앱, 아이폰 웹뷰(화면 확대 꺼짐), **라이트 전용**, 기준 폭 390px, `max-w-md mx-auto`.
- Next.js 15, React 19, TypeScript, Tailwind 3.4, `framer-motion` 11, `lucide-react` 만.
- 글꼴: 본문 IBM Plex Sans KR, 손글씨 느낌 `Dongle`(날짜·제목·도장에만).
- 변수: `--sd-ink:#2E1D26` `--sd-muted:#6E5457` `--sd-faint:#806668` `--sd-line:#E4D2D2` `--sd-surface-2:#F1EBEA` `--sd-card-solid:#FFFFFF` `--sd-rel:#E4685E` `--sd-rel-soft:#FDEBE6` `--sd-crit:#C9524F`. 앱 바탕 `#FCFAF7`. 안전영역은 `env(safe-area-inset-*)` 를 style 로.
- 이모지 금지(lucide), `confirm()/alert()` 금지, 입력칸 글씨 16px 이상, 누르는 영역 44px 이상(날짜 칸은 예외 — 아래), Tailwind 투명도는 5 단위(`/[0.92]`), 문자열로 이어 붙인 클래스 금지. `React.JSX.Element` 라고 써(전역 `JSX` 없음).
- ⚠️ 성능: 움직임은 transform·opacity 만, 무한 반복·backdrop-blur·layout 애니 금지. 스티커 그림은 `<img loading="lazy" decoding="async" draggable={false}>`.

## 왜 — 우댕 말
> 주간 달력 같은 것 또는 월간 달력에 스티커 같은 거 붙이는 기능도 있어? 생일 같은 것은 스티커 붙이고 전용으로. … 다꾸하는 사람들은 달력 꾸미는 것도 좋아하잖아.

GPT 와 다시 회의해 정한 것:
- 월간은 날짜 고르는 창이 아니라 **꾸미는 달력 한 장**(전체 화면). 종이 다이어리의 먼슬리처럼.
- 달력 주인은 **같이 | 우댕 | 꼼이** 세 장을 위에서 전환(기본 「같이」 = 둘이 함께 꾸밈. 각자 것은 본인만 꾸미고 상대는 보기만).
- 날짜 칸(폭 약 50px, 높이 62~68px): 위 날짜 숫자 · 가운데 **작은 스티커 최대 2개**(16~20px, 왼쪽·오른쪽 정해진 자리 — 자유 끌기·회전 없음) · 아래 **한 줄 메모**(최대 7자, 9~10px).
- 붙이는 손짓: 「꾸미기」 모드에서 도구를 고르고 날짜를 톡. 평소(보기 모드)엔 날짜 톡 = 그날 하루 장 열기.
  - 스티커: 서랍에서 고른 스티커가 아래 줄에 「지금 고른 것」으로 보이고, 날짜를 톡할 때마다 붙는다(연달아).
  - 기간 테이프: 시작일 톡 → 끝날 톡 → 이름·테이프 고르는 작은 시트. 여러 날을 **가로 띠**로 잇는다(주가 바뀌면 조각으로 나눔, 띠 안에 이름 한 번). 한 달 8개까지.
  - 메모: 날짜 톡 → 한 줄 입력 시트.
  - 지우개: 스티커·메모·기간 띠를 톡하면 지움. 지우면 아래에 「지웠어요 · 되돌리기」가 잠깐.
- **생일·기념일 전용 스티커**: 기념일을 등록할 때 스티커를 하나 고르면 매년 그 칸에 저절로 붙는다(일반 스티커 2개와 별개로, 날짜 숫자 옆에 작게). 시작 연도가 있으면 「3주년」. 7일 전부터 달력 위에 「곧 꼼이 생일 · 7일」 **한 줄만**(재촉·알림·체크리스트 금지).
- 달 꾸밈: 달 제목(손글씨 프리셋 3가지 — 누르면 바뀜) 옆 **머리 그림 1개**, 달력 아래 **여백 줄에 스티커 최대 6개**(가로 한 줄, 정해진 자리).
- 장부 금지: 「이번 달 N일 썼어요」·연속 기록·누가 더 많이 붙였나 같은 숫자 금지. 하루 장을 쓴 날은 칸 귀퉁이 작은 점(내 것 진하게·상대 것 옅게)만.
- 같이 꾸미는 달력에서 누가 붙였는지는 평소 숨기고, 지우개로 누르기 전 등 고를 때만 작게.

## 공용 타입 — `src/lib/diaryTypes.ts` 에 이미 있다(import 해서 써)
```ts
export type Person = '우댕' | '꼼이';
export type MonthOwner = 'together' | Person;
export interface MonthStickerVM { id: string; src?: string /*그림*/; decorId?: string /*DiaryDecor 로 그리는 테이프·도장*/; by?: Person }
export interface MonthSpecialVM { id: string; label: string; kind: 'birthday' | 'anniversary' | 'custom'; years?: number; sticker?: MonthStickerVM }
export interface DiaryMonthCellVM {
  date: string; day: number; inMonth: boolean; isToday: boolean; holiday?: boolean;
  stickers: MonthStickerVM[]; memo?: string; specials: MonthSpecialVM[]; mine: boolean; partner: boolean;
}
export interface MonthSpanVM { id: string; startDate: string; endDate: string; label: string; decorId: string /*tape-…*/ }
export type MonthTitleStyle = 'plain' | 'brush' | 'round';
export type MonthTool = 'sticker' | 'span' | 'memo' | 'erase';
export const MONTH_LIMITS: { cellStickers: 2; memo: 7; spans: 8; margin: 6 };
export interface DiaryAssetVM { id: string; kind: 'sticker' | 'tape' | 'stamp'; src?: string; decorId?: string; label?: string; favorite?: boolean }
export interface SpecialDateVM { id: string; label: string; kind: 'birthday' | 'anniversary' | 'custom'; monthDay: string; startYear?: number; owner: Person | 'together'; sticker?: MonthStickerVM }
```
이미 있는 부품(그대로 import): `import { DiaryDecor, DECOR_ASSETS } from './DiaryDecor'`(`<DiaryDecor decorId className />` — 부모 칸을 가득 채움, 테이프 id 는 `tape-honey|apricot|sage|sky|stripe|grid|dots|kraft`). 스티커 서랍 `DiaryAssetDrawer` 는 내가 그대로 다시 쓴다(너는 「서랍 열기」 단추만).

## 만들 파일 5개 (`src/components/diary/`)

#### ① `DiaryMonthCell.tsx` — 날짜 칸 하나
```ts
export interface DiaryMonthCellProps {
  cell: DiaryMonthCellVM;
  mode: 'view' | 'decorate';
  tool: MonthTool | null;
  marked?: boolean;                 // 기간 테이프 시작일로 찍힌 칸(끝날을 기다리는 중)
  hasSpanAbove?: number;            // 이 칸 위를 지나는 기간 띠 줄 수(0~2) — 띠 자리를 비워 스티커·메모가 안 겹치게
  onTap: () => void;
  onRemoveSticker?: (stickerId: string) => void;   // 지우개일 때 스티커를 톡
  onRemoveMemo?: () => void;
}
```
- 이번 달이 아닌 칸은 흐리게(톡 안 됨). 오늘은 날짜 숫자에 코랄 동그라미. 공휴일·일요일 숫자는 코랄.
- 기념일 전용 스티커는 날짜 숫자 오른쪽에 작게(없으면 lucide Cake/Heart/Star 아주 작게), `years` 가 있으면 「3주년」 같은 아주 작은 글자.
- 일반 스티커 2자리(가운데 줄 왼쪽·오른쪽), 하나면 가운데. 메모는 아래 한 줄(넘치면 자름).
- 하루 장 쓴 날 점: 칸 왼쪽 아래 귀퉁이(내 것 `--sd-ink` 3px, 상대 것 옅게).
- 지우개 도구일 땐 스티커·메모가 살짝 흔들리지 않고(애니 금지) 대신 옅은 빨간 테두리로 「누르면 지워져요」를 알림.

#### ② `DiaryMonthScreen.tsx` — 월간 꾸미기 달력 화면 전체
```ts
export interface DiaryMonthScreenProps {
  me: Person;
  owner: MonthOwner;
  canEdit: boolean;                               // 상대의 달력을 볼 땐 false(꾸미기 단추 없음)
  monthLabel: string;                             // '2026년 11월'
  monthNumber: number;                            // 11 — 달 제목을 크게 쓸 때
  titleStyle: MonthTitleStyle;
  hero?: MonthStickerVM | null;                   // 달 제목 옆 머리 그림
  cells: DiaryMonthCellVM[];                      // 6주 42칸(일요일 시작)
  spans: MonthSpanVM[];
  margin: MonthStickerVM[];                       // 아래 여백 줄 스티커(최대 6)
  upcoming?: { label: string; daysLeft: number } | null;   // 「곧 꼼이 생일 · 7일」
  mode: 'view' | 'decorate';
  tool: MonthTool | null;
  selectedAsset?: DiaryAssetVM | null;            // 스티커 도구에서 지금 고른 것
  spanStart?: string | null;                      // 기간 테이프 시작일을 찍은 상태
  undoText?: string | null;                       // 「스티커를 지웠어요」 — 있으면 되돌리기 줄
  saveState: 'saved' | 'saving' | 'offline';
  onBack: () => void;                             // 하루 장으로
  onPrevMonth: () => void; onNextMonth: () => void; onGoThisMonth: () => void;
  onChangeOwner: (o: MonthOwner) => void;
  onToggleMode: () => void;                       // 「꾸미기」 ↔ 「완료」
  onPickTool: (t: MonthTool) => void;
  onOpenAssets: () => void;                       // 스티커 서랍 열기(다른 스티커 고르기)
  onTapDay: (date: string) => void;               // 보기: 하루 장 열기 / 꾸미기: 도구에 따라 내가 처리
  onRemoveSticker: (date: string, stickerId: string) => void;
  onRemoveMemo: (date: string) => void;
  onTapSpan: (spanId: string) => void;            // 꾸미기에서 기간 띠 톡(지우개면 지움, 아니면 이름 고치기)
  onTapHero: () => void;                          // 머리 그림 자리 톡(꾸미기: 지금 고른 스티커를 머리 그림으로 / 지우개: 뺌)
  onTapMargin: (index: number) => void;           // 여백 줄 자리 톡
  onCycleTitleStyle: () => void;                  // 달 제목 손글씨 바꾸기
  onUndo: () => void;
  onOpenSpecialDates: () => void;                 // 생일·기념일 관리
}
```
- 머리: ← · 가운데 달 제목(Dongle 크게, `titleStyle` 3가지: plain = 「11월」 깔끔 / brush = 살짝 기울고 밑줄 붓 자국 / round = 동그란 꿀빛 원 안 숫자) + 옆에 머리 그림(48~56px, 없고 꾸미기 모드면 점선 자리 「머리 그림」) · ‹ › · 저장 상태 아주 작게 · ⋯(「생일·기념일 관리」·「이번 달로」).
- 그 아래 `같이 | 우댕 | 꼼이` 전환(알약 3칸). 상대 것을 볼 땐 「꼼이의 달력 — 보기만 할 수 있어요」.
- `upcoming` 한 줄(있을 때만, 작은 케이크/하트 아이콘 + 글).
- 달력 종이: 크림 종이 한 장(하루 장과 같은 결 — 모서리 둥글고 은은한 그림자, 왼쪽 바인더 구멍 디테일 조금). 요일 줄(일~토, 일요일 코랄) + 6줄 × 7칸 `DiaryMonthCell`. 칸 사이 선은 아주 옅게.
- **기간 띠**: `spans` 를 주(행)마다 조각으로 나눠 그 행의 **칸 위쪽(날짜 숫자 바로 아래)** 에 가로 띠로 겹쳐 그린다(`DiaryDecor` 테이프, 높이 12px 안팎, 반투명, 띠의 첫 조각에만 `label` 아주 작게). 같은 행에 띠가 2개면 두 줄. 조각 계산(어느 행·몇 번째 칸부터 몇 칸)은 네가 `cells` 의 date 로 한다. 띠가 지나는 칸엔 `hasSpanAbove` 를 넘겨 스티커·메모가 아래로 비키게.
- 달력 아래 **여백 줄**: 스티커 자리 6칸(40px). 보기 모드엔 붙인 것만, 꾸미기 모드엔 빈 자리가 점선.
- 아래 고정 줄:
  - 보기 모드(`canEdit`): 주 버튼 「달력 꾸미기」(lucide Sparkles 말고 Paintbrush/Sticker 류).
  - 꾸미기 모드: 도구 4개(스티커 · 기간 테이프 · 메모 · 지우개 — 고른 도구는 코랄 소프트 바탕) + 「완료」. 도구 위 한 줄 안내가 도구마다 바뀐다: 스티커 = 지금 고른 스티커 작은 그림 + 「날짜를 톡 하면 붙어요」 + 「다른 스티커」 단추 / 기간 = 「시작하는 날을 톡」 → (spanStart 있으면) 「끝나는 날을 톡」 / 메모 = 「메모할 날짜를 톡」 / 지우개 = 「지울 것을 톡」.
  - `undoText` 가 있으면 그 줄 위에 「{undoText} · 되돌리기」.
- 숫자 합계·통계 금지.

#### ③ `DiaryMonthMemoSheet.tsx` — 날짜 한 줄 메모
```ts
export interface DiaryMonthMemoSheetProps { open: boolean; dateLabel: string; value: string; onSave: (text: string) => void /*빈 글이면 지움*/; onClose: () => void }
```
- 아래에서 올라오는 작은 시트: 입력 한 칸(7자, 16px, 글자 수 `3/7`), 「넣기」. 열릴 때 value 로 채움. Esc 닫힘.

#### ④ `DiaryMonthSpanSheet.tsx` — 기간 테이프 이름·무늬
```ts
export interface DiaryMonthSpanSheetProps {
  open: boolean; rangeLabel: string /*'11월 21일 ~ 23일'*/;
  value: { label: string; decorId: string };
  tapeIds: string[];                                // 고를 수 있는 테이프 id 들
  canDelete?: boolean;                              // 이미 있는 띠를 고칠 때
  onSave: (v: { label: string; decorId: string }) => void; onDelete?: () => void; onClose: () => void;
}
```
- 이름(6자, 예: 「제주 여행」「시험 기간」) + 테이프 고르기(가로 줄, `DiaryDecor` 미리보기) + 「붙이기」. 고칠 땐 작은 「띠 떼기」.

#### ⑤ `DiarySpecialDatesSheet.tsx` — 지난번 것을 고쳐서 **파일 전체** 다시(아래에 지금 코드)
- props 에 추가: `stickerAssets: DiaryAssetVM[]`(전용 스티커 후보 — 내가 준다). `onAdd` 값에 `sticker?: MonthStickerVM` 포함(타입이 이미 그렇다).
- 추가 칸에 「전용 스티커」: 가로로 미는 한 줄(44px 칸), 고른 것에 코랄 테두리, 「없음」 칸 포함. 설명 한 줄 「매년 이 날 달력 칸에 붙어요」.
- 목록 줄 왼쪽에 그 기념일의 스티커(없으면 종류 아이콘), 주인 표시는 「우댕/꼼이/같이」(영어 `together` 를 그대로 찍지 마 — 지난번에 그 버그가 있었다).

## 답 형식
파일 5개 완성 코드(각각 맨 위 `// src/components/diary/파일이름.tsx` 주석, `'use client';`, named export). 설명은 맨 끝 3줄 이내. **긴 주석 금지(답이 길면 끊긴다).**

---
## 지금 코드(참고·고칠 것)
