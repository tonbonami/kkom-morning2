너는 모바일 앱 UI 디자이너 겸 React 개발자야. 아래 요구대로 **React 컴포넌트들의 완성 코드**를 만들어 줘. 파일을 열거나 명령을 실행하지 말고, 답에 코드만 써 줘.

## 앱
- 「꼼모닝」: 연인 둘(우댕·꼼이)만 쓰는 커플 앱. 한국어. 아이폰 앱(웹뷰, 화면 확대 꺼짐) 안에서 돈다. **라이트 전용**, 거의 폰으로만 쓴다. 기준 폭 390px, 화면은 `max-w-md mx-auto`.
- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3.4, `framer-motion` 11, `lucide-react` 아이콘만. 다른 라이브러리 금지.
- 글꼴(이미 불러와 있음): 본문 `"IBM Plex Sans KR"`(기본), 둥근 손글씨 느낌 `"Dongle"`(400·700 — 날짜·짧은 제목·도장에만, 긴 본문엔 쓰지 마).
- 전역 변수(이름 그대로 `var(--…)`): 글자 `--sd-ink:#2E1D26` · `--sd-muted:#6E5457` · `--sd-faint:#806668`, 선 `--sd-line:#E4D2D2`, 면2 `--sd-surface-2:#F1EBEA`, 흰 카드 `--sd-card-solid:#FFFFFF`, 강조(코랄) `--sd-rel:#E4685E` · `--sd-rel-soft:#FDEBE6`, 위험 `--sd-crit:#C9524F`, 카드 그림자 `--sd-shadow-card`. 앱 바탕 `#FCFAF7`.
- 안전영역: Tailwind 에 `pt-safe`/`pb-safe` 가 **없다** → `style={{ paddingTop: 'env(safe-area-inset-top)' }}` 처럼 직접.

## 이번 기능 — 「다꾸 다이어리」(꾸밀 수 있는 하루 한 장)
우댕 요청: 「지금 같은 캘린더가 아니라 **실제로 꾸밀 수 있는 다꾸 가능한 다이어리**. 스티커도 붙일 수 있고, 주로 폰으로 쓰니까 **간단하게**. 생일 같은 거 표시할 수 있고, 일기 같은 거 적을 수 있고.」 (우댕은 종이 플래너 같은 PDF 다이어리를 만든 적이 있다 — 일간 쪽에 날짜·날씨·기분·오늘의 일기 칸이 있는 차분한 문구류 결.)
GPT 회의로 정한 것:
- 첫 화면 = **오늘 하루 장**(세로 3:4 종이 한 장). 빈 배경을 좌우로 밀면 어제·내일, 위 날짜를 누르면 **월 선택창**. 주간 보기 없음.
- 날짜마다 **우댕 장 · 꼼이 장** 두 장. 내 장만 고치고 상대 장은 보기만. 위에서 `우댕 | 꼼이` 전환. 저장한 장은 둘이 같이 본다(「비공개」 단추 없음).
- 한 장에 올리는 것: 일기 글 하나 · 사진 최대 4장 · 정지 스티커 · 마스킹테이프 · 도장 · 종이 4종(크림·무지·줄·모눈). 합쳐서 물건 30개까지.
- **조작은 한 손으로**: 물건 톡 = 고르기, 고른 물건 끌기 = 옮기기, 크기·회전·앞으로·복제·지우기는 **아래 단추**(작게/크게/↺15°/↻15°). 두 손가락 확대·회전, 모서리 손잡이 없음.
- 그날의 기분·날씨·일정·생일/기념일은 장 위쪽 **읽기 전용 칩**. 「오늘의 재료함」에서 그날 기분·날씨·꼼톡 사진·질문 한 줄을 톡 해서 장에 올린다.
- 장부·감시 금지: 「며칠째 안 씀」·연속 기록·작성 횟수·비교 통계 금지. 월 선택창엔 **작성 여부 점과 기념일 표시만**(일정 제목·사진 썸네일 금지).

### 디자인 방향
- **진짜 다이어리 속지** 같은 결: 크림 종이, 은은한 종이 그림자, 날짜는 손글씨(Dongle), 한쪽에 바인더 구멍이나 스프링 같은 문구류 디테일을 **조금만**. 귀엽지만 유치하지 않게. 연한 파스텔 포인트 한두 색.
- 줄·모눈 종이의 선은 아주 옅게(글을 가리지 않게). 그 밖의 전면 반복 무늬(점·하트·발바닥)는 금지 — 지난번 편지지에서 「넘 촌스럽다」 평을 받았다.
- 예전 초록(#10B981·emerald)·slate 회색·보라 남발·네온·형광 그라디언트·**이모지**(아이콘은 lucide) 금지. 큰 글씨 밀어 넣기, 과한 애니메이션 금지.

### ⚠️ 성능 — 우댕 제1 조건 「버벅이게 하는 것은 절대 금지」
- 물건을 끄는 동안 **React 상태를 바꾸지 마**: `ref` + `requestAnimationFrame` 으로 그 물건의 `transform: translate3d(...)` 만 바꾸고, **손을 뗄 때 한 번** `onMove(id, x, y)` 를 부른다(pointer events, 끄는 물건에만 `will-change: transform`, 종이엔 `touch-action: none`).
- 움직임은 `transform`·`opacity` 만. `filter`·`backdrop-blur`·`box-shadow` 애니메이션·framer-motion `layout`/`layoutId`·무한 반복 금지.
- 스티커·사진은 `<img loading="lazy" decoding="async" draggable={false}>`. 움짤 스티커도 정지 그림(`thumb`)만 건다.
- `prefers-reduced-motion` 이면 움직임 끄기.

## 공용 타입 — 내가 `src/lib/diaryTypes.ts` 에 그대로 둔다(import 해서 써, 다시 정의하지 마)
```ts
export type Person = '우댕' | '꼼이';
export type DiaryPaperTheme = 'cream' | 'plain' | 'lined' | 'grid';
export type DiaryItemType = 'sticker' | 'photo' | 'tape' | 'stamp';
/** 종이 위 물건 하나. x·y = 물건 **가운데**의 자리(종이 폭·높이에 대한 0~1), w = 종이 폭에 대한 폭(0~1), ratio = 높이/폭. */
export interface DiaryItemVM {
  id: string; type: DiaryItemType;
  src?: string;        // sticker·photo 그림 주소(정지 그림)
  decorId?: string;    // tape·stamp 는 그림 파일이 아니라 네가 CSS 로 그리는 꾸미기(아래 DiaryDecor)의 id
  x: number; y: number; w: number; ratio: number; rotation: number; z: number;
}
export interface DiaryChipVM { id: string; kind: 'mood' | 'weather' | 'event' | 'special'; label: string; iconSrc?: string }
export interface DiaryPageVM { date: string /*YYYY-MM-DD*/; owner: Person; theme: DiaryPaperTheme; text: string; items: DiaryItemVM[] }
export interface DiaryAssetVM { id: string; kind: 'sticker' | 'tape' | 'stamp'; src?: string /*sticker 정지 그림*/; decorId?: string; label?: string; favorite?: boolean }
export interface DiaryMaterialVM { id: string; kind: 'mood' | 'weather' | 'photo' | 'prompt' | 'special'; label: string; thumbSrc?: string }
export interface DiaryMonthDayVM { date: string; day: number; inMonth: boolean; isToday: boolean; mine: boolean /*내 장 있음*/; partner: boolean /*상대 장 있음*/; special?: string /*생일·기념일 이름*/; holiday?: boolean }
export interface SpecialDateVM { id: string; label: string; kind: 'birthday' | 'anniversary' | 'custom'; monthDay: string /*MM-DD*/; startYear?: number; owner: Person | 'together' }
export type DiaryItemAction = 'smaller' | 'larger' | 'rotateLeft' | 'rotateRight' | 'front' | 'duplicate' | 'delete';
export const DIARY_LIMITS: { items: 30; photos: 4; text: 1000 };
```

## 만들 파일 9개 (`src/components/diary/`)

#### ① `DiaryDecor.tsx` — 마스킹테이프·도장을 **CSS 도형**으로(그림 파일 없이)
```ts
export const DECOR_ASSETS: { id: string; kind: 'tape' | 'stamp'; label: string; ratio: number /*높이÷폭*/ }[];
export function DiaryDecor(props: { decorId: string; className?: string }): JSX.Element;  // 부모 칸을 가득 채워 그린다(w-full h-full)
```
- 테이프 8종쯤(꿀빛·살구·세이지·하늘·줄무늬·모눈·점 한 줄·크라프트): 반투명, 양끝이 살짝 찢긴 모양(정지 clip-path), 길쭉한 비율(ratio 0.22 안팎).
- 도장 8종쯤: 동그란/네모 잉크 도장 느낌 — 「참 잘했어요」 대신 우리 말로: 「오늘도 수고」 「데이트」 「맛있었다」 「보고싶어」 「사랑해」 「꿀잠」 「화이트닝」 「기념일」. Dongle 글씨, 잉크가 살짝 빠진 듯한 한 가지 색(도장마다 색 다르게, 낮은 채도), 살짝 기울임은 물건 회전으로 하니 여기선 곧게.

#### ② `DiaryPaper.tsx` — 종이 한 장(3:4) + 글 + 물건들
```ts
export interface DiaryPaperProps {
  page: DiaryPageVM;
  dateLabel: string;            // 예: '11월 17일 화요일' — 종이 위쪽에 손글씨로
  chips: DiaryChipVM[];         // 날짜 아래 읽기 전용 칩(기분·날씨·일정·기념일)
  editable: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;   // 손을 뗄 때 한 번
  onTextChange: (text: string) => void;
  onSwipe?: (dir: 'prev' | 'next') => void;                  // 빈 배경을 옆으로 밀면(물건을 끌 때·글 쓰는 중엔 아님)
}
```
- 종이 4종은 CSS 만으로. 종이 안: 위 = 날짜(Dongle) + 칩 줄, 그 아래 일기 글 칸(`editable` 이면 `<textarea>`, 글씨 16px 이상, 줄 종이면 줄에 글이 앉게 줄간격 맞춤, 1000자). 물건은 글 **위**에 얹힌다(z 순서대로).
- 물건 자리·크기는 `%`로(`left: x*100%` 등 가운데 기준 + `rotate`). 고른 물건엔 얇은 점선 테두리.
- 끌기는 위 성능 규칙대로 직접 구현(종이 밖으로 못 나가게 가운데 점을 0~1 로 묶음). 8px 넘게 움직여야 끌기로 본다(그 전에 떼면 톡 = 고르기).
- 보기 전용이면 물건·글 모두 못 건드림(빈 배경 밀기만).

#### ③ `DiaryObjectToolbar.tsx` — 고른 물건용 아래 단추 줄
```ts
export interface DiaryObjectToolbarProps { onAction: (a: DiaryItemAction) => void; onDone: () => void /*고르기 풀기*/ }
```
- 단추 7개 + 「완료」: 작게 · 크게 · ↺ · ↻ · 앞으로 · 복제 · 지우기(빨강). 각 44px 이상, 아이콘 + 아주 작은 글자.

#### ④ `DiaryAssetDrawer.tsx` — 스티커·테이프·도장 서랍(아래에서 올라옴)
```ts
export interface DiaryAssetDrawerProps {
  open: boolean;
  tabs: { id: string; label: string }[];   // 예: 최근 · 즐겨찾기 · 꼼이 · 꿀됑 · 우리 · 테이프 · 도장
  tab: string;
  assets: DiaryAssetVM[];                  // 지금 탭의 것만 내가 준다
  full?: boolean;                          // 물건 30개 다 참 — 「한 장에 30개까지 붙일 수 있어요」
  onTabChange: (id: string) => void;
  onPick: (asset: DiaryAssetVM) => void;   // 톡 = 종이 가운데에 붙임(서랍은 안 닫는다 — 연달아 붙이게)
  onToggleFavorite: (asset: DiaryAssetVM) => void;   // 칸 귀퉁이 작은 별
  onClose: () => void;
}
```
- 화면 아래 45% 높이쯤(종이가 위에 보이게), 4열 격자, 탭은 가로 스크롤 칩. 뒤 배경은 어둡게 하지 않는다(종이를 보면서 붙인다).

#### ⑤ `DiaryMaterialTray.tsx` — 「오늘의 재료함」
```ts
export interface DiaryMaterialTrayProps { materials: DiaryMaterialVM[]; onAdd: (m: DiaryMaterialVM) => void }
```
- 종이 아래 가로로 밀어 보는 작은 카드 줄: 오늘 기분 · 날씨 · 꼼톡에서 주고받은 사진(작은 그림) · 「오늘 둘이 가장 웃었던 일은?」 같은 질문 한 줄(톡 하면 글 칸에 들어감) · 기념일 장식. 비면 아무것도 안 그린다.

#### ⑥ `DiaryDayScreen.tsx` — 하루 화면 전체
```ts
export interface DiaryDayScreenProps {
  me: Person; pageOwner: Person;
  page: DiaryPageVM; dateLabel: string; chips: DiaryChipVM[]; materials: DiaryMaterialVM[];
  hasPage: Record<Person, boolean>;                 // 전환 단추에 「쓴 장 있음」 작은 점
  saveState: 'saved' | 'saving' | 'offline';
  isToday: boolean;
  selectedItemId: string | null;
  onBack: () => void; onPrevDate: () => void; onNextDate: () => void; onGoToday: () => void; onOpenMonth: () => void;
  onChangeOwner: (p: Person) => void;
  onSelectItem: (id: string | null) => void; onMoveItem: (id: string, x: number, y: number) => void; onItemAction: (a: DiaryItemAction) => void;
  onTextChange: (text: string) => void;
  onOpenAssets: () => void; onPickPhotos: (files: File[]) => void; onChangeTheme: (t: DiaryPaperTheme) => void;
  onAddMaterial: (m: DiaryMaterialVM) => void;
  onOpenSpecialDates: () => void;
}
```
- 머리(불투명): ← 홈 · 가운데 날짜(누르면 월 선택창, 양옆 ‹ ›) · 오른쪽 저장 상태(「저장됨」/「저장 중…」/「연결 끊김 — 폰에 보관 중」 아주 작게)와 ⋯(「기념일 관리」·「오늘로」).
- 그 아래 `우댕 | 꼼이` 전환(내 장이 먼저). 상대 장을 볼 땐 「꼼이의 장 — 보기만 할 수 있어요」 작은 줄, 꾸미기 단추들 숨김.
- 가운데 `DiaryPaper`(화면 폭에 맞춘 3:4). 상대가 그날 안 썼으면 빈 종이에 「아직 이날의 장이 없어요」(재촉 금지), 내 빈 장엔 「오늘 한 장 꾸며 볼까요?」.
- 아래 고정 꾸미기 줄(내 장일 때만): 스티커 · 사진(파일 고르기 `accept="image/*" multiple`) · 종이(4종 고르는 작은 줄이 펼쳐짐) · 글(누르면 글 칸에 커서). 물건을 고르면 이 줄이 `DiaryObjectToolbar` 로 바뀐다.
- 꾸미기 줄 위에 `DiaryMaterialTray`(내 오늘 장일 때만).

#### ⑦ `DiaryMonthSheet.tsx` — 월 선택창(아래에서 올라옴)
```ts
export interface DiaryMonthSheetProps {
  open: boolean; monthLabel: string /*'2026년 11월'*/; days: DiaryMonthDayVM[] /*6주 42칸*/;
  selectedDate: string;
  onPrevMonth: () => void; onNextMonth: () => void; onPickDate: (date: string) => void; onClose: () => void;
}
```
- 일~토 7열. 날짜 아래 작은 점 둘: 내 장(진한 점)·상대 장(옅은 점). 생일·기념일은 날짜 위 아주 작은 표시(lucide Cake/Heart/Star)와, 그 날을 누르면 아래에 이름 한 줄. 공휴일 숫자는 코랄. **숫자 합계·「이번 달 N장」 금지.**

#### ⑧ `DiarySpecialDatesSheet.tsx` — 생일·기념일 관리
```ts
export interface DiarySpecialDatesSheetProps {
  open: boolean; items: SpecialDateVM[]; busy?: boolean;
  onAdd: (v: Omit<SpecialDateVM, 'id'>) => void; onDelete: (id: string) => void; onClose: () => void;
}
```
- 목록(이름 · 날짜 · 「매년」 · 시작 연도가 있으면 「2023년부터」) + 추가 칸: 이름, 종류(생일/기념일/그 밖), 월·일 고르기, 시작 연도(선택), 누구 것(우댕/꼼이/같이). 지우기는 한 번 더 묻기(시트 안에서 — `confirm()` 금지).

#### ⑨ `DiaryHomeCard.tsx` — 홈 카드(2×1)
```ts
export interface DiaryHomeCardProps { dateLabel: string; excerpt?: string /*오늘 내 장 글 앞부분*/; thumbSrc?: string /*오늘 장의 첫 사진·스티커*/; partnerWroteToday?: boolean; onOpen: () => void }
```
- 틀: `<button className="sd-card w-full h-full px-4 py-4 flex flex-col relative text-left active:scale-[.98] transition-transform">`, 최소 높이 140px. ⚠️ `.sd-card` 는 `background` 묶음 값을 써서 Tailwind 바탕 클래스를 지운다 → 바탕색은 `style={{ background: … }}` 로.
- 작은 다이어리 속지 모양 + 「다이어리」(Dongle) + 오늘 날짜. 썼으면 글 한 줄, 안 썼으면 「오늘 한 장 꾸며 볼까요?」. 상대가 오늘 썼으면 작은 「꼼이가 오늘 한 장 썼어요」(숫자·연속 기록 금지).

## 규칙(모든 컴포넌트)
- 각 파일 `'use client';` 로 시작, 맨 위에 파일 이름 주석(예: `// src/components/diary/DiaryPaper.tsx`). **named export**.
- props 이름·타입은 위와 **정확히 같게**(데이터는 내가 꽂는다). 파이어베이스·저장·가짜 데이터 넣지 말 것 — 화면용 상태(열림·끄는 중 좌표)만.
- 문구는 전부 한국어, 짧고 다정하게. 버튼은 누르는 영역 44px 이상, **입력칸 글씨 16px 이상**(아이폰이 16px 미만 입력칸을 누르면 화면을 확대한다).
- 웹뷰에선 `confirm()`·`alert()` 이 막힌다 → 확인은 화면 안에서. 아래에서 올라오는 창은 Esc 로도 닫히게.
- Tailwind 함정: 투명도는 5 단위만(`bg-white/92` 는 안 생긴다 → `bg-white/[0.92]`), 문자열을 이어 붙여 만든 클래스는 안 생긴다(색은 `style` 로).
- 코드 블록만 답해 줘(설명은 맨 끝 3줄 이내). **답이 길면 중간에 끊기니 긴 주석을 달지 마.**
