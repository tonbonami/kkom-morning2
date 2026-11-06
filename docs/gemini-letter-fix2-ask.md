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

## 2차 — 네가 1차에 준 코드(아래 그대로 붙임)를 이 앱에 넣고 화면을 띄워 보니 고칠 데가 나왔다. **고친 파일 전체**를 다시 줘.
고칠 게 없는 파일(LetterVoicePanel·LetterSchedulePanel·LetterStickerPanel)은 다시 안 줘도 된다. 새 파일 하나(LetterEnclosures)를 더 만든다.
props 이름·타입은 1차 그대로 두고, 아래에서 **더하라는 것만** 더해.

### 쓰기 화면에서 실제로 본 것
C1. `LetterEditor` — **미니 낱말 알약이 하나도 안 보인다.** 뒤에 깐 층 전체가 `opacity-0` 이라 배경까지 투명하다. 그리고 뒤에 깐 글에서 미니 조각을 `part.word`(괄호 없이)로, 그것도 `inline-block px-1 mx-[0.5px]` 로 그려서 **글자칸(`(사랑해)` 괄호 포함)과 폭이 달라 뒤 글자가 전부 어긋난다.** → 뒤에 깐 글은 **textarea 와 글자 하나까지 똑같이**(`(${word})` 그대로) 두고, 폭을 바꾸는 padding·margin·inline-block 없이 **배경색만** 칠해(줄이 바뀌어도 이어지게 `box-decoration-break: clone`). 투명은 글자색만, 배경은 보이게.
C2. **여백이 세 겹이다** — 편지지(`p-6`) + 입력칸 바깥(`px-[24px]`) + textarea(`px-[24px]`) → 글이 편지지 왼쪽에서 72px 들어가 있다(390px 화면에서 글줄이 좁다). 그리고 바깥과 textarea 가 각각 24px 를 가져 **뒤에 깐 층(24)과 textarea 글자(48)도 어긋난다.** → 가로 여백은 **편지지 한 곳에서만**, 입력칸은 0.
C3. `LetterComposeScreen` — **화면 아래 고정 보내기 단추가 도구 줄(음성·손글씨·스티커·예약)을 통째로 덮는다**(도구 줄이 안 보인다). → 도구 줄과 보내기 단추를 겹치지 않게(예: 화면 아래쪽에 둘을 위아래로 쌓은 바닥 영역). 그리고 `h-screen`(100vh) 은 이 웹뷰에서 실제 보이는 높이보다 길다 — 이 앱은 `min-h-app` 클래스(`min-height: var(--app-vh, 100dvh)`)를 쓴다.
C4. 미니 서랍이 열리면 보내기 단추가 서랍 뒤로 숨는다(`y: -100%` 로는 서랍 높이만큼 못 올라간다). 서랍이 열린 동안엔 숨겨도 되고 서랍 위에 둬도 되지만 **반쯤 걸치지 않게**.
C5. 「편지로 보기」를 열면 **편지지 안에 편지지가 또 들어가** 「To. 꼼이」「From. 우댕」이 두 번씩 나온다(쓰기 편지지 안 본문 자리에 `preview`(= LetterPaper) 를 넣어서). → 미리보기가 열리면 쓰기 편지지 **자리 전체를** `preview` 로 바꿔(안에 넣지 말고).
C6. `MiniEmoticonSheet` — 그림 밑 낱말이 너무 작아 안 읽힌다(Dongle `text-xs`). 12px 이상 IBM Plex 나 Dongle 18px 이상으로.
C7. 편지지 색이 화면마다 다르다 — 쓰기는 `sd-card bg-white/70`(흰색), 읽기는 `--sd-surface-2`(회분홍). **둘 다 같은 따뜻한 아이보리 편지지**로(색 값을 한 곳에 정해 두 파일이 같은 값을 쓰게 — 예: `LetterPaper.tsx` 에서 `export const LETTER_PAPER_CLASS = '…'` 를 내보내고 쓰기 화면이 가져다 쓰기).

### 읽기 화면에서 실제로 본 것
R1. 제목 `{fromName}이 보낸 편지` → 「**꼼이이** 보낸 편지」로 나온다(꼼이는 받침이 없다). → 「{fromName}의 편지」처럼 조사가 안 틀리는 말로.
R2. `font-dongle`·`font-ibm-plex-sans-kr` 클래스가 **이 앱 Tailwind 설정에 없다** → Dongle 이 하나도 안 먹었다. Dongle 은 `font-['Dongle']`(또는 이미 있는 `font-handwriting`), 본문은 클래스 없이(기본이 IBM Plex Sans KR).
R3. `bg-[var(--sd-app)]` — `--sd-app` 변수는 없다(`.sd-app` 은 **클래스**다). → 클래스 `sd-app` 으로.
R4. **보낸 사람의 「수정」이 빠졌다**(전엔 있던 기능). `LetterPaper` 에 더해:
```ts
  canEdit?: boolean;            // 내가 보낸 편지면 true — 「수정」 작은 단추
  onStartEdit?: () => void;
  onSaveEdit?: () => void;      // editing 일 때 「저장」
  onCancelEdit?: () => void;    // editing 일 때 「취소」
  savingEdit?: boolean;         // 저장 중이면 「저장 중…」
  miniOpen?: boolean;           // editing 중 미니 서랍이 열려 있나
  onToggleMini?: () => void;    // editing 중 「미니」 단추(쓰기 화면과 같은 모양) — 고칠 때도 글 속에 미니를 넣게
```
  그리고 `LetterReadSheet` 에 `miniSheet?: React.ReactNode` 자리를 더해 화면 맨 아래에 그대로 둬(쓰기 화면과 같은 `MiniEmoticonSheet` 를 내가 넣는다). 고치는 동안엔 댓글 입력칸이 서랍과 겹치지 않게.
R5. 「동봉한 것」 칸 — 지금은 내가 옛 화면 조각(초록 테두리 128px 이모티콘 카드 등)을 그대로 꽂아서 **옛 모양이 그대로 남았다.** 새 파일 `LetterEnclosures.tsx` 를 만들어 줘:
```ts
export interface LetterEnclosuresProps {
  emoticons: { id: string; label: string; imageUrl: string }[];   // 큰 이모티콘 0~3개
  animated: { label: string; posterUrl: string; videoUrl: string } | null;   // 움직이는 포차코(영상)
  voice: React.ReactNode | null;    // 내가 기존 음성 재생기를 넣는다
  doodle: React.ReactNode | null;   // 내가 기존 손글씨 재생 판을 넣는다
}
```
  편지 글보다 튀지 않게(이모티콘은 작게 한 줄, 영상도 작게) 정리. 없는 것은 안 보이게.
R6. 댓글 속 `(야호)` 같은 미니가 글자로 나온다. `LetterCommentView` 에 `parts: MiniPart[]` 를 더해 댓글도 미니 그림(글줄에 맞게 20~22px)으로 그려 줘(`text` 는 그대로 두되 그릴 땐 `parts`).

## 지금 코드(1차)

### 지금 코드 — src/components/letter/LetterEditor.tsx
```tsx
// src/components/letter/LetterEditor.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import type { MiniPart } from '@/lib/miniEmoticons';

export interface LetterEditorProps {
  value: string;
  onChange: (v: string) => void;
  parts: MiniPart[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  placeholder: string;
  minRows?: number;
  autoFocus?: boolean;
  onFocus?: () => void;
}

export function LetterEditor({
  value,
  onChange,
  parts,
  textareaRef,
  placeholder,
  minRows = 7,
  autoFocus,
  onFocus,
}: LetterEditorProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync scroll positions
  useEffect(() => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    if (textarea && overlay) {
      const handleScroll = () => {
        overlay.scrollTop = textarea.scrollTop;
      };
      textarea.addEventListener('scroll', handleScroll);
      return () => {
        textarea.removeEventListener('scroll', handleScroll);
      };
    }
    return undefined;
  }, [textareaRef]);

  return (
    <div
      className="relative grid grid-cols-1 grid-rows-1 font-['IBM_Plex_Sans_KR'] text-[var(--sd-ink)] text-[16px] leading-[1.8] px-[24px]"
      style={{ minHeight: `${minRows * 1.8 * 16}px` }}
    >
      {/* Overlay for styling mini emoticons */}
      <div
        ref={overlayRef}
        className="[grid-area:1/1] whitespace-pre-wrap break-words opacity-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
        style={{ color: 'transparent', minHeight: '100%' }}
      >
        {parts.map((part, i) => (
          part.kind === 'text' ? (
            <React.Fragment key={i}>
              {part.text}
            </React.Fragment>
          ) : (
            <span
              key={i}
              className="inline-block px-1 mx-[0.5px] bg-[var(--sd-rel-soft)] rounded-[6px]"
              style={{ lineHeight: '1.8', verticalAlign: 'middle' }}
            >
              {part.word}
            </span>
          )
        ))}
        {/* Add an extra line to ensure there's always space to type at the end */}
        {'\n'}
      </div>

      {/* Actual textarea for input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="[grid-area:1/1] w-full h-full bg-transparent text-[var(--sd-ink)] resize-none overflow-hidden
                   font-['IBM_Plex_Sans_KR'] text-[16px] leading-[1.8] px-[24px] py-0
                   placeholder:text-[var(--sd-faint)] focus:outline-none scroll-smooth"
        rows={minRows}
        style={{ minHeight: '100%' }}
      />
    </div>
  );
}
```

### 지금 코드 — src/components/letter/MiniEmoticonSheet.tsx
```tsx
// src/components/letter/MiniEmoticonSheet.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Keyboard, Smile } from 'lucide-react';

export interface MiniEmoticonSheetProps {
  open: boolean;
  items: { word: string; src: string }[];
  onPick: (word: string) => void;
  onClose: () => void;
}

export function MiniEmoticonSheet({ open, items, onPick, onClose }: MiniEmoticonSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { y: prefersReducedMotion ? 0 : '100%', opacity: prefersReducedMotion ? 0 : 1 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="fixed bottom-0 left-0 right-0 z-50
                     bg-[var(--sd-card-solid)] rounded-t-[28px] shadow-[var(--sd-shadow-card)]
                     max-h-[calc(40vh+env(safe-area-inset-bottom))] overflow-y-auto
                     pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--sd-line)]">
            <h2 className="text-lg font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
              미니 이모티콘 · 글 속에 쏙
            </h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full min-h-[44px]"
            >
              <Keyboard size={20} />
              <span>키보드로</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-5 gap-2 p-4">
            {items.map((item) => (
              <motion.button
                key={item.word}
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                onClick={() => onPick(item.word)}
                className="flex flex-col items-center p-2 rounded-lg aspect-square justify-center
                           text-[var(--sd-cardlabel)] text-xs font-['Dongle'] font-bold hover:bg-[var(--sd-surface-2)] min-h-[44px] min-w-[44px]"
              >
                <img src={item.src} alt={item.word} className="w-10 h-10 object-contain mb-1" />
                {item.word}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 지금 코드 — src/components/letter/LetterComposeScreen.tsx
```tsx
// src/components/letter/LetterComposeScreen.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Mic,
  PenLine,
  Sticker,
  Clock,
  Smile,
  Keyboard,
  Eye,
  EyeOff,
} from 'lucide-react';

export type LetterTool = 'voice' | 'doodle' | 'sticker' | 'schedule';

export interface LetterComposeScreenProps {
  toName: string;
  fromName: string;
  dateText: string;
  editor: React.ReactNode;
  miniOpen: boolean;
  onToggleMini: () => void;
  previewOpen: boolean;
  onTogglePreview: () => void;
  preview: React.ReactNode;
  activeTool: LetterTool | null;
  onToolChange: (t: LetterTool | null) => void;
  toolBadges: Partial<Record<LetterTool, string>>;
  toolPanel: React.ReactNode;
  miniSheet: React.ReactNode;
  error?: string;
  canSend: boolean;
  sending: boolean;
  scheduled: boolean;
  onSend: () => void;
  onBack: () => void;
}

export function LetterComposeScreen({
  toName,
  fromName,
  dateText,
  editor,
  miniOpen,
  onToggleMini,
  previewOpen,
  onTogglePreview,
  preview,
  activeTool,
  onToolChange,
  toolBadges,
  toolPanel,
  miniSheet,
  error,
  canSend,
  sending,
  scheduled,
  onSend,
  onBack,
}: LetterComposeScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  const toolItems: { icon: React.ElementType; label: string; tool: LetterTool }[] = [
    { icon: Mic, label: '음성', tool: 'voice' },
    { icon: PenLine, label: '손글씨', tool: 'doodle' },
    { icon: Sticker, label: '스티커', tool: 'sticker' },
    { icon: Clock, label: '예약', tool: 'schedule' },
  ];

  const sendButtonY = miniOpen ? 'calc(-100% - env(safe-area-inset-bottom))' : '0%'; // Move up when miniSheet is open

  return (
    <div className="sd-app flex flex-col h-screen max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 pt-[env(safe-area-inset-top)]">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} className="text-[var(--sd-ink)]" />
        </motion.button>
        <h1 className="text-xl font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">편지 쓰기</h1>
        <div className="w-[44px]"></div> {/* Spacer */}
      </div>

      {/* Letter Paper Section */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        <div className="sd-card w-full p-6 pb-2 rounded-[28px] relative bg-white/70">
          {/* To/Date */}
          <div className="text-center mb-6">
            <p className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)] leading-none mb-1">
              To. {toName}
            </p>
            <p className="font-['Dongle'] text-lg text-[var(--sd-muted)] leading-none">
              {dateText}
            </p>
          </div>

          {/* Editor / Preview */}
          <div className="flex-1 min-h-[160px]"> {/* Adjusted minimum height for editor */}
            {previewOpen ? preview : editor}
          </div>

          {/* From */}
          <div className="text-right mt-6 pr-[24px]">
            <p className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)]">
              From. {fromName}
            </p>
          </div>
        </div>

        {/* Mini Emoticon / Preview Toggle */}
        <div className="flex justify-center gap-4 mt-4 mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMini}
            className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
          >
            {miniOpen ? <Keyboard size={20} /> : <Smile size={20} />}
            <span>{miniOpen ? '키보드로' : '미니'}</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTogglePreview}
            className="flex items-center gap-1 text-[var(--sd-muted)] text-sm px-3 py-2 rounded-full border border-[var(--sd-line)] bg-[var(--sd-card-solid)] min-h-[44px]"
          >
            {previewOpen ? <EyeOff size={20} /> : <Eye size={20} />}
            <span>편지로 보기</span>
          </motion.button>
        </div>
      </div>

      {/* Tool Panel */}
      {activeTool && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="bg-[var(--sd-surface-2)] p-4 border-t border-[var(--sd-line)] overflow-hidden"
        >
          {toolPanel}
        </motion.div>
      )}

      {/* Tool Strip */}
      <div className="flex justify-around p-3 bg-[var(--sd-surface-2)] border-t border-[var(--sd-line)]">
        {toolItems.map((item) => {
          const isActive = activeTool === item.tool;
          const badgeText = toolBadges[item.tool];
          const IconComponent = item.icon;
          return (
            <motion.button
              key={item.tool}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToolChange(isActive ? null : item.tool)}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-['IBM_Plex_Sans_KR']
                          ${isActive ? 'text-[var(--sd-rel)]' : 'text-[var(--sd-muted)]'} min-h-[44px] min-w-[44px]`}
            >
              <IconComponent size={24} />
              <span>{item.label}</span>
              {badgeText && (
                <span className="absolute -top-1 -right-1 bg-[var(--sd-rel)] text-white text-[10px] rounded-full px-1 py-[1px] leading-none">
                  {badgeText}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Send Button */}
      <motion.div
        animate={{ y: sendButtonY }}
        transition={{ type: 'spring', damping: 30, stiffness: 400, duration: prefersReducedMotion ? 0 : 0.3 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-transparent z-40
                   pb-[calc(16px+env(safe-area-inset-bottom))]"
      >
        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        <motion.button
          whileTap={{ scale: canSend && !sending ? 0.98 : 1 }}
          onClick={onSend}
          disabled={!canSend || sending}
          className={`w-full py-4 rounded-full text-white text-lg font-['IBM_Plex_Sans_KR'] font-semibold
                      ${canSend && !sending ? 'bg-[var(--sd-rel)] shadow-[var(--sd-rel-shadow)]' : 'bg-[var(--sd-faint)]'}
                      ${sending ? 'cursor-not-allowed' : ''} min-h-[44px]`}
        >
          {sending ? '보내는 중...' : scheduled ? '예약 편지 보내기' : '편지 보내기'}
        </motion.button>
      </motion.div>

      {/* Mini Emoticon Sheet (rendered outside normal flow, z-index managed) */}
      {miniSheet}
    </div>
  );
}
```

### 지금 코드 — src/components/letter/LetterVoicePanel.tsx
```tsx
// src/components/letter/LetterVoicePanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic, StopCircle, PlayCircle, PauseCircle, Trash2 } from 'lucide-react';

export interface LetterVoicePanelProps {
  state: 'idle' | 'recording' | 'recorded';
  secLeft: number;
  duration: number;
  playing: boolean;
  onStart: () => void;
  onStop: () => void;
  onTogglePlay: () => void;
  onDelete: () => void;
}

export function LetterVoicePanel({
  state,
  secLeft,
  duration,
  playing,
  onStart,
  onStop,
  onTogglePlay,
  onDelete,
}: LetterVoicePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  const formatTime = (seconds: number) => {
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `00:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      {state === 'idle' && (
        <>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onStart}
            className="flex items-center gap-2 text-lg font-semibold bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] px-6 py-3 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]"
          >
            <Mic size={24} />
            <span>녹음 시작</span>
          </motion.button>
          <p className="mt-2 text-[var(--sd-muted)] text-sm">30초까지</p>
        </>
      )}

      {state === 'recording' && (
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ scale: prefersReducedMotion ? 1 : [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex items-center justify-center bg-red-500/20 rounded-full w-24 h-24"
          >
            <Mic size={40} className="text-red-600" />
            <span className="absolute text-red-600 text-sm font-bold -bottom-4">
              {secLeft > 0 ? formatTime(secLeft) : '00:00'}
            </span>
          </motion.div>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onStop}
            className="mt-6 flex items-center gap-2 text-lg font-semibold bg-[var(--sd-rel)] text-white px-6 py-3 rounded-full shadow-[var(--sd-shadow-btn)] min-h-[44px]"
          >
            <StopCircle size={24} />
            <span>녹음 멈춤</span>
          </motion.button>
        </div>
      )}

      {state === 'recorded' && (
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onTogglePlay}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--sd-rel-soft)] text-[var(--sd-rel)] min-h-[44px] min-w-[44px]"
          >
            {playing ? <PauseCircle size={28} /> : <PlayCircle size={28} />}
          </motion.button>
          <span className="text-xl font-['IBM_Plex_Sans_KR'] tabular-nums">
            {formatTime(duration)}
          </span>
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onDelete}
            className="flex items-center justify-center w-12 h-12 rounded-full text-[var(--sd-muted)] hover:bg-[var(--sd-surface-2)] min-h-[44px] min-w-[44px]"
          >
            <Trash2 size={24} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
```

### 지금 코드 — src/components/letter/LetterSchedulePanel.tsx
```tsx
// src/components/letter/LetterSchedulePanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';

export interface LetterSchedulePanelProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  toName: string;
}

export function LetterSchedulePanel({
  enabled,
  onEnabledChange,
  value,
  onChange,
  toName,
}: LetterSchedulePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">예약 편지</span>
        {/* Toggle Switch */}
        <motion.button
          whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out
                      ${enabled ? 'bg-[var(--sd-rel)]' : 'bg-[var(--sd-muted)]'}`}
          role="switch"
          aria-checked={enabled}
        >
          <motion.span
            animate={{ x: enabled ? '100%' : '0%' }}
            transition={{ type: 'spring', stiffness: 700, damping: 50, duration: prefersReducedMotion ? 0 : 0.2 }}
            className="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-md"
          />
        </motion.button>
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className="overflow-hidden"
        >
          <div className="mb-4">
            <label htmlFor="schedule-datetime" className="sr-only">예약 날짜 및 시간</label>
            <input
              id="schedule-datetime"
              type="datetime-local"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-3 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-ink)] text-lg
                         focus:outline-none focus:ring-2 focus:ring-[var(--sd-rel)] appearance-none"
              style={{ minHeight: '44px' }} // Ensure sufficient touch target
            />
          </div>
          <p className="flex items-center gap-2 text-[var(--sd-muted)] text-sm">
            <Lock size={16} />
            <span>이 시각에 {toName}에게 도착해요. 그 전엔 잠겨 있어요.</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
```

### 지금 코드 — src/components/letter/LetterStickerPanel.tsx
```tsx
// src/components/letter/LetterStickerPanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export interface LetterStickerPanelProps {
  emoticons: { id: string; label: string; imageUrl: string }[];
  max: number;
  onAddEmoticon: () => void;
  onRemoveEmoticon: (index: number) => void;
  animated: { label: string; posterUrl: string; videoUrl: string } | null;
  onPickAnimated: () => void;
  onRemoveAnimated: () => void;
}

export function LetterStickerPanel({
  emoticons,
  max,
  onAddEmoticon,
  onRemoveEmoticon,
  animated,
  onPickAnimated,
  onRemoveAnimated,
}: LetterStickerPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      <h3 className="text-lg font-semibold mb-3">큰 스티커 · 편지 아래에 붙어요</h3>

      {/* Static Emoticons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {emoticons.map((emo, index) => (
          <div key={emo.id} className="relative">
            <img src={emo.imageUrl} alt={emo.label} className="w-16 h-16 rounded-lg object-cover" />
            <motion.button
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
              onClick={() => onRemoveEmoticon(index)}
              className="absolute -top-2 -right-2 bg-[var(--sd-muted)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-w-[24px] min-h-[24px]"
            >
              <X size={16} />
            </motion.button>
          </div>
        ))}
        {emoticons.length < max && (
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onAddEmoticon}
            className="w-16 h-16 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-muted)] flex flex-col items-center justify-center min-w-[44px] min-h-[44px]"
          >
            <Plus size={24} />
            <span className="text-xs mt-1">이모티콘</span>
          </motion.button>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-3">움직이는 포차코</h3>

      {/* Animated Pochacco */}
      <div className="flex gap-2">
        {animated ? (
          <div className="relative">
            <video
              src={animated.videoUrl}
              poster={animated.posterUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-24 h-24 rounded-lg object-cover"
            />
            <motion.button
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
              onClick={onRemoveAnimated}
              className="absolute -top-2 -right-2 bg-[var(--sd-muted)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-w-[24px] min-h-[24px]"
            >
              <X size={16} />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onPickAnimated}
            className="w-24 h-24 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-muted)] flex flex-col items-center justify-center min-w-[44px] min-h-[44px]"
          >
            <Plus size={24} />
            <span className="text-xs mt-1">움직이는 포차코</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
```

### 지금 코드 — src/components/letter/LetterPaper.tsx
```tsx
// src/components/letter/LetterPaper.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { MiniPart } from '@/lib/miniEmoticons';

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
}: LetterPaperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        relative w-full bg-[var(--sd-surface-2)] text-[var(--sd-ink)]
        rounded-[28px] ${preview ? 'shadow-sm' : 'shadow-[var(--sd-shadow-card)]'}
        overflow-hidden
      `}
    >
      {/* Header with To. Name and Action Button */}
      <div className="flex items-center justify-between pt-6 pb-4 px-6 relative z-10">
        <h2 className="font-dongle text-xl text-[var(--sd-ink)] whitespace-nowrap">
          To. {toName}
        </h2>
        {headerAction && <div className="absolute top-4 right-4">{headerAction}</div>}
      </div>

      {/* Main Content Area */}
      <div className={`px-6 text-[16px] leading-[1.8] ${preview ? 'py-2' : 'py-4'}`}>
        {editing ? (
          <div className="min-h-[100px]">{editorSlot}</div> // Placeholder for editor slot
        ) : parts.length === 0 ? (
          <p className="font-ibm-plex-sans-kr text-[var(--sd-muted)] text-center py-8">
            {emptyText}
          </p>
        ) : (
          <p className="font-ibm-plex-sans-kr whitespace-pre-wrap">
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
            font-dongle text-[18px] text-[var(--sd-rel)] bg-[var(--sd-rel-soft)]
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

### 지금 코드 — src/components/letter/LetterReadSheet.tsx
```tsx
// src/components/letter/LetterReadSheet.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Heart, Send, Trash2 } from 'lucide-react';

export interface LetterCommentView {
  id: string;
  by: string;
  text: string;
  timeText: string;
  mine: boolean;
}

export interface LetterReadSheetProps {
  fromName: string;
  fullDateText: string;
  paper: React.ReactNode;
  hearts: number;
  onHeart: () => void;
  comments: LetterCommentView[];
  onDeleteComment: (id: string) => void;
  commentText: string;
  onCommentTextChange: (v: string) => void;
  onSubmitComment: () => void;
  commentSending: boolean;
  onClose: () => void;
}

export function LetterReadSheet({
  fromName,
  fullDateText,
  paper,
  hearts,
  onHeart,
  comments,
  onDeleteComment,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  commentSending,
  onClose,
}: LetterReadSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const sheetVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: '0%', opacity: 1 },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex justify-center pb-[env(safe-area-inset-bottom)]"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={sheetVariants}
      transition={{ type: 'tween', duration: prefersReducedMotion ? 0 : 0.25 }}
      onClick={onClose} // Close on overlay click
    >
      <motion.div
        className="w-full max-w-md bg-[var(--sd-app)] h-full flex flex-col rounded-t-[28px] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the sheet
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[var(--sd-card-solid)] shadow-sm">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 -ml-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <X size={24} className="text-[var(--sd-ink)]" />
          </motion.button>
          <div className="flex flex-col items-center flex-grow text-center">
            <h2 className="font-ibm-plex-sans-kr text-[var(--sd-ink)] text-lg font-semibold">
              {fromName}이 보낸 편지
            </h2>
            <p className="font-ibm-plex-sans-kr text-[var(--sd-muted)] text-sm">
              {fullDateText}
            </p>
          </div>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {/* Scrollable Paper and Enclosures */}
        <div className="flex-grow overflow-y-auto p-4 bg-transparent">
          {paper}
        </div>

        {/* Heart and Comments Section */}
        <div className="bg-[var(--sd-card-solid)] pt-4 pb-2 border-t border-[var(--sd-line)]">
          {/* Heart Button */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={onHeart}
              className="p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center bg-[var(--sd-rel-soft)]"
              aria-label="하트 보내기"
            >
              <Heart size={24} fill="var(--sd-rel)" stroke="var(--sd-rel)" />
            </motion.button>
            <span className="font-ibm-plex-sans-kr text-[var(--sd-ink)] text-base tabular-nums">
              {hearts}
            </span>
          </div>

          {/* Comments List */}
          <div className="px-4 pb-4 max-h-[200px] overflow-y-auto space-y-3">
            {comments.length === 0 ? (
              <p className="font-ibm-plex-sans-kr text-[var(--sd-muted)] text-sm text-center">
                아직 댓글이 없어요.
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div className="flex-grow">
                    <span className="font-ibm-plex-sans-kr text-[var(--sd-cardlabel)] text-sm font-semibold mr-1">
                      {comment.by}
                    </span>
                    <span className="font-ibm-plex-sans-kr text-[var(--sd-ink)] text-sm whitespace-pre-wrap">
                      {comment.text}
                    </span>
                    <p className="font-ibm-plex-sans-kr text-[var(--sd-faint)] text-xs mt-1">
                      {comment.timeText}
                    </p>
                  </div>
                  {comment.mine && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteComment(comment.id)}
                      className="p-1 -mr-1 rounded-full min-w-[32px] min-h-[32px] flex items-center justify-center"
                      aria-label="댓글 삭제"
                    >
                      <Trash2 size={16} className="text-[var(--sd-faint)]" />
                    </motion.button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="px-4 pt-3 pb-4 border-t border-[var(--sd-line)] flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              placeholder="댓글을 남겨 주세요!"
              className="w-full p-2 text-base font-ibm-plex-sans-kr rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-ink)] placeholder-[var(--sd-muted)] focus:outline-none focus:border-[var(--m-letter-ac)]"
              disabled={commentSending}
              aria-label="댓글 입력"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSubmitComment}
              disabled={!commentText.trim() || commentSending}
              className={`
                p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center
                ${commentText.trim() && !commentSending ? 'bg-[var(--m-letter-ac)] text-white' : 'bg-[var(--sd-faint)] text-[var(--sd-ink)] cursor-not-allowed'}
              `}
              aria-label="댓글 보내기"
            >
              <Send size={24} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
```
