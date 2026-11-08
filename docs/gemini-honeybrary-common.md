너는 모바일 앱 UI 디자이너 겸 React 개발자야. 아래 요구대로 **React 컴포넌트들의 완성 코드**를 만들어 줘. 파일을 열거나 명령을 실행하지 말고, 답에 코드만 써 줘.

## 앱
- 「꼼모닝」: 연인 둘(우댕·꼼이)만 쓰는 커플 앱. 한국어. 아이폰 앱(웹뷰) 안에서 돈다. **라이트 전용**. 기준 폭 390px, 화면은 `max-w-md mx-auto`.
- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3.4, `framer-motion` 11, `lucide-react` 아이콘만. 다른 라이브러리 금지.
- 글꼴(이미 불러와 있음): 본문 `"IBM Plex Sans KR"`(기본), 둥근 손글씨 느낌 `"Dongle"`(400·700) — Dongle 은 **짧은 글에만**(이름표·날짜 도장·작은 제목). 영어 흘림 사인 `"'Alex Brush', cursive"`(편지에서 쓰는 사인 글씨체, `import { SIGN_FONT, signFor } from '@/lib/letterSign'` — `signFor('우댕')==='Kkuldang'`, `signFor('꼼이')==='Kkomi'`).
- 전역 디자인 변수(이름 그대로 `var(--…)`): 글자 `--sd-ink:#2E1D26` · `--sd-muted:#6E5457` · `--sd-faint:#806668` · `--sd-cardlabel:#9C8A8C`, 선 `--sd-line:#E4D2D2`, 면2 `--sd-surface-2:#F1EBEA`, 흰 카드 `--sd-card-solid:#FFFFFF`, 위험 `--sd-crit:#C9524F`, 카드 그림자 `--sd-shadow-card`, 버튼 그림자 `--sd-shadow-btn`. 바탕 그라디언트 클래스 `.sd-app`. 숫자는 `tabular-nums`.
- 안전영역: Tailwind 에 `pt-safe`/`pb-safe` 가 **없다** → `style={{ paddingTop: 'env(safe-area-inset-top)' }}` 처럼 직접.

## 이번 기능 — 「허니브러리」(둘의 책장)
사이담 앱의 「사이브러리」를 그대로 옮기고 이름만 「허니브러리」로 바꾼다. 대신 **리뷰(감상)를 네이버·배민처럼 정교하게** — 별점·「이런 점이 좋았어요」 키워드·사진 여러 장·한 줄·본문·스포일러 가리기·상대의 한마디. GPT 와 회의해 정한 것:
- 책 한 권을 둘이 같이 두고, **진행(지금 쪽/전체 쪽)은 사람마다**. 칸은 「요즘 읽는 책」·「다 읽은 책」·「책장에 둔 책」.
- 읽는 중 남기는 **기록**(글·쪽수·사진 한 장) + 그 기록에 **한 줄 잇기**(한 단계만). 이어진 말이 **없는** 기록엔 아무것도 그리지 않는다(「답변 0」·빈 말풍선·「첫 답을 남겨 보세요」 금지 — 숙제처럼 보이면 혼자 쓰는 사람이 기록을 멈춘다).
- **감상(리뷰)** = 책 × 사람 하나, 언제든 고침. 별 1~5(정수, 반 별 없음, **선택**) · 키워드 12개 중 최대 3개 · 한 줄 40자 · 본문 600자 · 사진 최대 5장 · 스포일러 토글 하나 · 상대의 한마디 하나(대댓글 없음).

### ⚠️ 장부·평가가 되지 않게 (어기면 못 쓴다)
- 두 사람 별점을 **한 줄·두 칸에 나란히** 놓지 마. 감상은 「우댕의 감상」「꼼이의 감상」처럼 **세로로 각각**.
- 평균·합산·분포·별점순 정렬·필터 금지. **책장 카드와 홈 카드엔 별을 그리지 마** — 별은 감상 카드 안에서만.
- 권수(「올해 12권」)·연속 기록·리뷰 수·도움돼요·좋아요·하트·「마지막으로 읽은 때」·「3일 전」 같은 시각 금지.
- 상대 감상이 없을 때 빈 별·「아직 리뷰 없음」 금지(그냥 안 그린다). 「추천한 책」 대신 「우댕이 놓은 책」.
- 별점 질문은 「이 책은 몇 점?」이 아니라 **「이번 독서 경험은 어땠어요?」**.

### 「편지처럼 예쁘게」 — 오늘까지 만든 편지 새 단장의 결을 가져온다
- **꿀빛 편지지**(편지에서 쓰는 6장 중 하나, 허니브러리의 바탕 결): 바탕 `#F8E7BE`, 가장자리 `boxShadow: 'inset 0 0 28px rgba(186,142,60,.25), inset 0 0 0 1px rgba(186,142,60,.35)'`, 글자 `#2E1D26`, 흐린 글자 `#7E612B`, 도장 `bg #EDD19A / fg #61400A / border #DFBC78`. 감상 카드는 이 종이 위에 쓴 짧은 편지처럼 — 24px 안쪽 여백, 본문 16px, 줄간격 1.8 전후.
- **작성자 사인**: 감상 끝에 작성자 영어 사인(`signFor(by)`, Alex Brush) — 편지의 사인 스티커처럼 살짝 기울여.
- **생각풍선**: 상대의 한마디는 편지 귀퉁이에 쓰는 생각풍선 부품을 써 — `import { ThoughtBubble } from '@/components/letter/ThoughtBubble'` (`props: { src: string; size: number /*64~80*/; tail: 'down-right'|'up-left'|'down-left'|'up-right'; appear?: boolean }` — 흰 92% 동그라미 안에 캐릭터, 꼬리 동그라미 2개). 캐릭터 그림(투명 배경 상반신): 우댕=꿀됑 `'/emo/kkuldaeng/mood/calm.png'`, 꼼이 `'/emo/saidami/calm.webp'` — 내가 `charSrc` 로 넘긴다.
- **밀랍 도장**: 감상을 다 쓴 카드 귀퉁이에 작은 꿀색 밀랍 도장 하나(CSS 도형, 벌집 육각 하나 압인 정도).
- **로고**: `import HoneybraryLogo from '@/components/honeybrary/HoneybraryLogo'` (default export, `props: { height?: number /*꿀됑 높이 px, 기본 64*/; text?: number /*글씨 비율, 기본 .6*/; className?: string }`) — 의자에 앉아 책 읽는 꿀됑 그림(세로로 긴 186x320) + 「허니브러리」 동글 글씨. 정지 그림. 홈 카드·책장 머리·빈 상태에만.
- 가져오지 않을 것: 감상을 열 때마다 봉투 애니, **화면 전체 벌집 반복 무늬**(지난번 편지지의 빽빽한 점·발바닥·체크 전면 무늬가 우댕에게 「넘 촌스럽다」 평을 받고 교체됐다 — 벌집은 귀퉁이 2~3칸 워터마크나 도장 하나에만), 감상마다 다른 편지지, 본문 전체 손글씨, 계속 둥실거리는 캐릭터, 반짝이·질감·그라디언트를 한꺼번에.
- 예전 초록(#10B981·emerald)·slate 회색·보라 남발·네온·형광 그라디언트·**이모지**(아이콘은 lucide) 금지.

### ⚠️ 성능 — 우댕 제1 조건 「버벅이게 하는 것은 절대 금지」
- 움직임은 **`transform`·`opacity` 만**. `filter`·`blur`·`backdrop-filter`·`box-shadow`·크기·위치 값을 움직이지 마(정지 상태로 쓰는 건 괜찮다, 단 `backdrop-blur` 는 쓰지 마 — 웹뷰에서 스크롤이 무겁다). framer-motion `layout`·`layoutId` 금지. 무한 반복 금지.
- 목록·카드의 사진은 **작은 판(`thumbUrl`·`coverThumb`)만**, 크게 볼 때만 원본. `<img loading="lazy" decoding="async">`, 사진 자리는 비율 상자로 미리 잡아 화면이 덜컹이지 않게.
- `prefers-reduced-motion` 이면 움직임 끄기(framer-motion `useReducedMotion`).

## 공용 타입 — 이미 있는 파일 `src/lib/honeybraryTypes.ts` (그대로 import 해서 써, 다시 정의하지 마)
```ts
export type Person = '우댕' | '꼼이';
export const PEOPLE: Person[]; export const partnerOf: (p: Person) => Person;
export type ReadStatus = 'reading' | 'done' | 'shelved';
export const STATUS_LABEL: Record<ReadStatus, string>; // 읽는 중 · 다 읽음 · 책장에 두기
export type Rating = 1 | 2 | 3 | 4 | 5;
export interface ReadingVM { status: ReadStatus; current?: number; total?: number }
export interface PhotoVM { id: string; url: string; thumbUrl: string; width?: number; height?: number; pending?: boolean /*올리는 중*/ }
export interface BookVM { id: string; title: string; coverUrl?: string; coverThumb?: string; placedBy: Person; readers: Partial<Record<Person, ReadingVM>> }
export interface NoteVM { id: string; by: Person; text?: string; page?: number; photo?: PhotoVM; parentNoteId?: string }
export interface ReviewVM { id: string; by: Person; rating?: Rating; keywords: string[]; headline?: string; body?: string; photos: PhotoVM[]; hasSpoiler: boolean; reply?: { by: Person; text: string } }
export interface ReviewDraft { rating?: Rating; keywords: string[]; headline: string; body: string; hasSpoiler: boolean }
export const REVIEW_KEYWORDS: string[]; // 12개
export const LIMITS: { title: 100; note: 2000; reply: 500; keywords: 3; headline: 40; body: 600; photos: 5; partnerReply: 200 };
export type Shelf = 'now' | 'done' | 'shelved'; export function shelfOf(b): Shelf;
export type ProgressView = { kind: 'bar'; pct: number; label: string } | { kind: 'page'; label: string } | { kind: 'none'; label: string };
export function progressView(r: ReadingVM): ProgressView; // ⚠️ 숫자가 없으면 막대를 안 그린다(0% 막대·빈 막대 금지)
```

## 규칙(모든 컴포넌트)
- 각 파일 `'use client';` 로 시작하는 완성 코드, 맨 위에 파일 이름 주석(예: `// src/components/honeybrary/HoneyBookCard.tsx`). **named export**(로고만 default).
- props 이름·타입은 아래 요구와 **정확히 같게**(데이터는 내가 꽂는다). 파이어베이스·저장·구독·가짜 데이터 넣지 말 것 — 화면용 상태(열림·입력 중 글자·펼침)만.
- 문구는 전부 한국어, 짧고 다정하게. 사이브러리 원래 문구가 있으면 그대로 두고 「사이브러리」→「허니브러리」만.
- 버튼은 `motion.button` + `whileTap`, 누르는 영역 44px 이상. **입력칸 글씨 16px 이상**(아이폰이 16px 미만 입력칸을 누르면 화면을 확대한다).
- 웹뷰에선 `confirm()`·`alert()` 이 막힌다 → 확인은 화면 안 시트로.
- Tailwind 함정: 투명도는 5 단위만(`bg-white/92` 는 안 생긴다 → `bg-white/[0.92]`), 문자열을 이어 붙여 만든 클래스는 안 생긴다(색은 `style` 로).
- 코드 블록만 답해 줘(설명은 맨 끝 3줄 이내). **답이 길면 중간에 끊기니 긴 주석을 달지 마.**
