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

## 4차 — 편지지 **색**만 정해 줘 (네가 만든 LetterPaper 를 앱에 넣고 쓰는 중)

### 지금 상황(우댕님 반응 그대로)
- 처음 편지지 `#FCFAF7`(거의 흰 아이보리): 「바탕이 너무 밝아서 내가 보낸 편지에서 꼼이 이모티콘이 잘 안 보여. 조금만 어둡게」
  - 글 속 미니 이모티콘(꼼이미니) = **흰 말티푸** 그림. 털 평균색 ≈ `#FBF1EA`(크림빛 흰색), 눈·코는 짙은 갈색, 볼에 연분홍. 편지지가 털색과 같아 그림이 묻혔다(밝기 대비 1.07).
  - 꿀됑(분홍 아기돼지·노랑 조끼) 미니도 섞여 나온다.
- 그래서 `#EEE3D5`(따뜻한 베이지)로 바꿨더니: 「**베이지는 아니야! ㅠㅠ**」「**색감도 없네...**」
- 내가 견본으로 보여 준 은은한 색 6개(모두 흰 말티푸가 떠 보이는 밝기): 1 살구 `#F9E0D6` · 2 분홍 `#F7DFE3` · 3 하늘 `#E1ECF5` · 4 민트 `#DFF0E8` · 5 라벤더 `#E9E4F4` · 6 버터 `#F8EDCF` → 우댕님: 「너 제미나이한테 물어봐」.

### 정할 것
- 이 앱(디자인 시스템 위, 관계색 코랄 `--sd-rel`, From 도장은 `--sd-rel-soft` 바탕·코랄 글자) 안에서 **색감이 있으면서**, 흰 말티푸 미니가 **또렷하게 떠 보이고**, 긴 한글 본문이 편하게 읽히는 편지지 색 하나. 커플 앱의 「편지」 느낌.
- 단색이 심심하면 아주 은은한 그라디언트·종이 결 같은 것도 좋다(단 글 읽기·미니 그림을 해치지 않게, 형광·네온·보라 남발 금지).
- 편지지 색이 바뀌면 같이 맞춰야 할 것(To 글자색·From 도장·「동봉한 것」 구분선 등)이 있으면 함께.

### 답 형식
1. 고른 색과 이유 3줄(왜 흰 말티푸가 잘 보이는지, 왜 이 앱에 어울리는지).
2. `src/components/letter/LetterPaper.tsx` **파일 전체**(바꾼 곳만 바꾸고 나머지는 그대로). ⚠️ `LETTER_PAPER_CLASS` 는 꼭 `!bg-…` 처럼 앞에 `!` 를 붙여 둬 — 쓰기 화면 편지지는 `.sd-card`(반투명 흰 background, 층 밖 CSS)와 같이 붙어서 `!` 가 없으면 흰색이 이긴다. 그라디언트를 쓰면 `!bg-[linear-gradient(...)]` 처럼.
3. 다른 파일도 바꿔야 하면 그 파일 전체.

### 지금 LetterPaper.tsx
```tsx
// src/components/letter/LetterPaper.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { MiniPart } from '@/lib/miniEmoticons';
import { PencilLine, Check, XCircle, Smile, Keyboard } from 'lucide-react'; // Added for edit buttons

// 우댕 2026-11-06 「바탕이 너무 밝아서 꼼이 이모티콘이 잘 안 보여, 조금만 어둡게」 — #FCFAF7 은 꼼이미니 털색(≈#FBF1EA)과 같아 묻혔다. 후보 3개 비교해 B.
//   ⚠️ `!` — 쓰기 화면 편지지는 `.sd-card`(background: 반투명 흰색, 층 밖 CSS)와 같이 붙어 그쪽이 이겼다(쓰기만 흰색이던 이유).
export const LETTER_PAPER_CLASS = '!bg-[#EEE3D5] sd-card-paper'; // Custom class for warm ivory paper

export interface LetterPaperProps {
  toName: string;
  fromName: string;
  dateText: string;
  parts: MiniPart[];
  preview?: boolean;
  emptyText?: string;
  editing?: boolean;
  editorSlot?: React.ReactNode;
  headerAction?: React.ReactNode;
  enclosures?: React.ReactNode;
  canEdit?: boolean;            // 내가 보낸 편지면 true — 「수정」 작은 단추
  onStartEdit?: () => void;
  onSaveEdit?: () => void;      // editing 일 때 「저장」
  onCancelEdit?: () => void;    // editing 일 때 「취소」
  savingEdit?: boolean;         // 저장 중이면 「저장 중…」
  miniOpen?: boolean;           // editing 중 미니 서랍이 열려 있나
  onToggleMini?: () => void;    // editing 중 「미니」 단추(쓰기 화면과 같은 모양) — 고칠 때도 글 속에 미니를 넣게
}

export function LetterPaper({
  toName,
  fromName,
  dateText,
  parts,
  preview = false,
  emptyText = '아직 쓴 말이 없어요',
  editing = false,
  editorSlot,
  headerAction,
  enclosures,
  canEdit,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  savingEdit,
  miniOpen,
  onToggleMini,
}: LetterPaperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative w-full ${LETTER_PAPER_CLASS} text-[var(--sd-ink)]
        rounded-[28px] ${preview ? 'shadow-sm' : 'shadow-[var(--sd-shadow-card)]'}
        overflow-hidden
      `}
    >
      {/* Header with To. Name and Action Button */}
      <div className="flex items-center justify-between pt-6 pb-4 px-6 relative z-10">
        <h2 className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)] whitespace-nowrap leading-none mb-1">
          To. {toName}
        </h2>
        <div className="flex items-center gap-2">
          {headerAction}
          {canEdit && !editing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStartEdit}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
            >
              <PencilLine size={20} />
              <span>수정</span>
            </motion.button>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCancelEdit}
                className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
              >
                <XCircle size={20} />
                <span>취소</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onSaveEdit}
                disabled={savingEdit}
                className={`flex items-center gap-1 text-white text-sm px-3 py-2 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]
                            ${savingEdit ? 'bg-[var(--sd-faint)]' : 'bg-[var(--sd-rel)]'}`}
              >
                {savingEdit ? '저장 중...' : '저장'}
                <Check size={20} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onToggleMini}
                className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
              >
                {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
                <span>{miniOpen ? '키보드로' : '미니'}</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`px-6 text-[16px] leading-[1.8] ${preview ? 'py-2' : 'py-4'}`}>
        {editing ? (
          <div className="min-h-[100px]">{editorSlot}</div> // Placeholder for editor slot
        ) : parts.length === 0 ? (
          <p className="text-[var(--sd-muted)] text-center py-8">
            {emptyText}
          </p>
        ) : (
          <p className="whitespace-pre-wrap">
            {parts.map((part, index) => {
              if (part.kind === 'text') {
                return <span key={index}>{part.text}</span>;
              } else {
                return (
                  <img
                    key={index}
                    src={part.src}
                    alt={part.word}
                    className="inline-block h-7 align-text-bottom mx-[1px]" // 28px height
                  />
                );
              }
            })}
          </p>
        )}
      </div>

      {/* From. Name and Date Stamp */}
      <div className={`flex justify-end pr-6 pb-6 pt-4 ${preview ? 'pt-2 pb-4' : ''}`}>
        <div
          className={`
            font-['Dongle'] text-lg text-[var(--sd-rel)] bg-[var(--sd-rel-soft)]
            px-3 py-1 rounded-lg shadow-sm whitespace-nowrap tabular-nums
            ${preview ? 'text-base px-2 py-0.5' : ''}
          `}
        >
          From. {fromName} {dateText}
        </div>
      </div>

      {/* Enclosures Section */}
      {enclosures && (
        <div className="pt-4 border-t border-[var(--sd-line)]">
          <p className="text-center text-[var(--sd-cardlabel)] text-sm mb-3">동봉한 것</p>
          <div className="pb-6 px-6">
            {enclosures}
          </div>
        </div>
      )}
    </motion.div>
  );
}
```
