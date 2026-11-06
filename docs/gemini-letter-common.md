너는 모바일 앱 UI 디자이너 겸 React 개발자야. 아래 요구대로 **React 컴포넌트들의 완성 코드**를 만들어 줘. 파일을 열거나 명령을 실행하지 말고, 답에 코드만 써 줘.

## 앱
- 「꼼모닝」: 연인 둘(우댕·꼼이)만 쓰는 커플 앱. 한국어. 아이폰 앱(웹뷰) 안에서 돈다. **라이트 전용**.
- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, `framer-motion` 11, `lucide-react` 아이콘만. 다른 라이브러리 금지.
- 글꼴(이미 불러와 있음): 본문 `"IBM Plex Sans KR"`(기본), 둥근 손글씨 느낌 `"Dongle"`(400·700) — Dongle 은 **짧은 글에만**(To/From·날짜 도장·서명). 긴 본문엔 쓰지 마.
- 디자인 시스템(이미 전역 CSS에 있는 변수 — 이름 그대로 `var(--…)`로 써):
  - 바탕 그라디언트 `.sd-app`(따뜻한 회백 #FCFAF7→#F7F6F7)
  - 카드 `.sd-card`(흰 반투명 rgba(255,255,255,.74), 모서리 28px, 그림자 `var(--sd-shadow-card)`), `--sd-card-solid:#FFFFFF`
  - 글자: `--sd-ink:#2E1D26`(본문), `--sd-muted:#6E5457`, `--sd-faint:#806668`, `--sd-cardlabel:#9C8A8C`(작은 이름표), 선 `--sd-line:#E4D2D2`, 면2 `--sd-surface-2:#F1EBEA`
  - 강조(관계색 코랄): `--sd-rel:#E4685E`, `--sd-rel-2:#EE7C6C`, `--sd-rel-soft:#FDEBE6`, 그림자 `--sd-rel-shadow`
  - 편지 카드 강조색 `--m-letter-ac`(홈 편지 카드가 쓰는 색 — 편지 화면 포인트로 써도 좋다)
  - 버튼 그림자 `--sd-shadow-btn`. 숫자는 `tabular-nums`.
- 금지: 형광 그라디언트, 보라/핑크 남발, 네온, 이모지(아이콘은 lucide), 예전 초록(#10B981·emerald) — **이번 일의 목적이 예전 초록·회색 모양을 벗는 것**이다.

## 편지 기능 새 단장 — 방향(GPT 상의로 정함)
- 편지를 **한 장의 편지지**처럼. 편지지 = 따뜻한 아이보리(아주 옅게) 한 종류, 은은한 종이 느낌은 좋지만 질감·반짝이·움직이는 배경을 한꺼번에 쓰지 말 것. **글이 주인공** — 긴 한글 본문이 읽히는 게 먼저(본문 16~17px, 줄간격 1.8 전후, 좌우 여백 24px 이상).
- **글 속 미니 이모티콘**: 글에는 `(사랑해)` 같은 글자로 저장되고, 보여 줄 때만 작은 그림(글줄 높이에 맞는 28~32px)으로 바뀐다. 그림 목록·글 쪼개기는 내가 한다. 너는 이미 쪼갠 조각을 받는다:
  ```ts
  // import type { MiniPart } from '@/lib/miniEmoticons';
  export type MiniPart = { kind: 'text'; text: string } | { kind: 'mini'; word: string; src: string };
  ```
  `text` 조각은 줄바꿈(`\n`)이 들어 있을 수 있다 → `whitespace-pre-wrap` 로 그대로 보여 줘. `mini` 조각은 `<img src={src} alt={word}>` 로, 글줄과 자연스럽게 섞이게(글자 기준선에 맞춰, 위아래 줄을 밀어내지 않게).
- 하지 말 것: 열 때마다 긴 봉투 애니, 찢기 같은 제스처, 본문 전체 손글씨체, 배경음악, 편지지마다 다른 레이아웃.

## 규칙(모든 컴포넌트)
- 각 파일 `'use client';`로 시작하는 완성 코드. 파일 이름 주석을 맨 위에(예: `// src/components/letter/LetterPaper.tsx`). **named export** 로.
- props 이름·타입은 아래와 **정확히 같게**(내가 데이터만 꽂는다). 가짜 데이터·저장·타이머 로직 넣지 말 것(애니메이션·열림 같은 화면용 상태만 허용).
- 문구는 전부 한국어, 짧고 다정하게.
- 버튼은 `motion.button` + `whileTap`. 누르는 영역 44px 이상. 입력칸 글씨는 **16px 이상**(아이폰이 16px 미만 입력칸을 누르면 화면을 확대한다).
- `prefers-reduced-motion` 이면 움직임 끄기(framer-motion `useReducedMotion`).
- 아이폰 안전영역 `env(safe-area-inset-bottom)` 고려, 화면은 `max-w-md mx-auto`.
- `ReactNode` 자리(slot)는 내가 기존 기능(녹음기·손글씨 판·하트·댓글 등)을 그대로 꽂는 곳이다 — 그 안을 그리지 말고 **자리와 둘레만** 디자인해.
- 코드 블록만 답해 줘(설명은 맨 끝에 3줄 이내).
