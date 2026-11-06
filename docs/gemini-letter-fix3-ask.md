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

## 3차 — 2차 코드를 넣고 띄워 보니 남은 것 세 가지. **고친 두 파일 전체**를 다시 줘(나머지 파일은 그대로 둔다). props 는 그대로.

1. `LetterEditor` — 뒤에 깐 층이 미니 조각마다 **빈칸을 하나 더 붙인다.** 화면에서 잰 값:
   - textarea 글: `꼼이야 오늘도 고마웠어 (사랑해) 많이`
   - 뒤에 깐 층 글: `꼼이야 오늘도 고마웠어 (사랑해)  많이` ← `(사랑해)` 뒤 빈칸이 둘
   알약 span 안 글자가 `(사랑해) `(끝에 빈칸)로 그려진다. 그래서 미니 뒤 글자가 미니 하나마다 한 칸씩 밀리고, 미니가 많으면 줄이 바뀌는 자리까지 달라진다. → 뒤에 깐 층의 글자는 `textContent` 가 **textarea 값 + 끝 줄바꿈 하나와 정확히 같아야** 한다(미니 조각은 `(${word})` 만, 빈칸·글자를 더하지 말 것).
2. `LetterComposeScreen` — 「편지로 보기」를 누르면 「미니」·「편지로 보기」 단추 줄이 **같이 사라져서**(`{!previewOpen && (…)}`) 다시 쓰기로 돌아올 단추가 없다. → 미리보기 중에도 단추 줄을 보이게 하고, 그때 「편지로 보기」는 「다시 쓰기」처럼 돌아가는 말로(미니 단추는 미리보기 중엔 숨기거나 눌렀을 때 쓰기로 돌아가게 — 네가 판단).
3. `LetterComposeScreen` — 뒤로 화살표 단추에 `aria-label="뒤로"` 가 없다(읽기 프로그램이 이름을 못 읽는다).

## 지금 코드(2차)

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
      className="relative grid grid-cols-1 grid-rows-1 font-['IBM_Plex_Sans_KR'] text-[var(--sd-ink)] text-[16px] leading-[1.8]"
      style={{ minHeight: `${minRows * 1.8 * 16}px` }}
    >
      {/* Overlay for styling mini emoticons */}
      <div
        ref={overlayRef}
        className="[grid-area:1/1] whitespace-pre-wrap break-words pointer-events-none overflow-hidden text-transparent
                   min-h-full py-0" // Removed px-[24px], added py-0
        aria-hidden="true"
        style={{ minHeight: '100%' }}
      >
        {parts.map((part, i) => (
          part.kind === 'text' ? (
            <React.Fragment key={i}>
              {part.text}
            </React.Fragment>
          ) : (
            <span
              key={i}
              className="bg-[var(--sd-rel-soft)] rounded-[6px] [box-decoration-break:clone] whitespace-pre-wrap" // Added box-decoration-break: clone
              style={{ lineHeight: '1.8', verticalAlign: 'middle' }}
            >
              {`(${part.word})`} {/* Changed to include parentheses */}
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
                   font-['IBM_Plex_Sans_KR'] text-[16px] leading-[1.8] py-0
                   placeholder:text-[var(--sd-faint)] focus:outline-none scroll-smooth" // Removed px-[24px]
        rows={minRows}
        style={{ minHeight: '100%' }}
      />
    </div>
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
import { LETTER_PAPER_CLASS } from './LetterPaper'; // Import the constant

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

  return (
    <div className="sd-app flex flex-col min-h-app max-w-md mx-auto pt-[env(safe-area-inset-top)]"> {/* Changed h-screen to min-h-app */}
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft size={24} className="text-[var(--sd-ink)]" />
        </motion.button>
        <h1 className="text-xl font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">편지 쓰기</h1>
        <div className="w-[44px]"></div> {/* Spacer */}
      </div>

      {/* Letter Paper Section */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col items-center">
        {previewOpen ? (
          <div className="w-full">
            {preview}
          </div>
        ) : (
          <div className={`sd-card w-full p-6 pb-2 rounded-[28px] relative ${LETTER_PAPER_CLASS}`}> {/* Used LETTER_PAPER_CLASS */}
            {/* To/Date */}
            <div className="text-center mb-6">
              <p className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)] leading-none mb-1">
                To. {toName}
              </p>
              <p className="font-['Dongle'] text-lg text-[var(--sd-muted)] leading-none">
                {dateText}
              </p>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[160px]"> {/* Adjusted minimum height for editor */}
              {editor}
            </div>

            {/* From */}
            <div className="text-right mt-6 pr-[24px]">
              <p className="font-['Dongle'] text-2xl font-bold text-[var(--sd-ink)]">
                From. {fromName}
              </p>
            </div>
          </div>
        )}

        {/* Mini Emoticon / Preview Toggle */}
        {!previewOpen && (
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
        )}
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

      {/* Bottom Toolbar: Tool Strip and Send Button */}
      <div className="relative z-40 bg-transparent pb-[env(safe-area-inset-bottom)]"> {/* Adjusted padding */}
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
        <div className="p-4">
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
        </div>
      </div>

      {/* Mini Emoticon Sheet (rendered outside normal flow, z-index managed) */}
      {miniSheet}
    </div>
  );
}
```
