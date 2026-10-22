커플 둘이 쓰는 앱(Next.js 15 + React 18 + Tailwind 3.4 + framer-motion + lucide-react, 아이폰 세로 390px)의 채팅 「꼼톡」에 카카오톡처럼 **이모티콘 미리보기 → 글과 함께 한 말풍선으로 전송**을 넣는다. 새 컴포넌트 2개를 만들어 줘.

### 지금 동작과 바꿀 동작 (우댕 결정)
- 지금: 입력칸에 「사랑해」를 치면 입력칸 바로 위에 추천 이모티콘 줄(StickerSuggestTray, 아래 코드)이 뜨고, 하나를 누르면 그 자리에서 바로 전송된다. 이모티콘과 글이 말풍선 두 개로 간다.
- 바꿀 것(카톡과 같게): 이모티콘을 누르면(추천 줄이든 이모티콘 서랍이든) **입력칸 바로 위에 미리보기**가 뜬다. ✕로 취소. **같은 이모티콘을 한 번 더 누르면 바로 전송**(카톡). 입력칸의 보내기를 누르면 **이모티콘 + 친 글이 한 말풍선 묶음**으로 간다(글이 없으면 이모티콘만).

### 만들 것 1: StickerSendPreview.tsx (새 파일)
```ts
export default function StickerSendPreview(props: {
  item: { image: string; thumb: string; isVideo: boolean; label: string } | null;  // null이면 숨김(사라지는 애니메이션)
  hasText: boolean;          // 입력칸에 글이 있는지 — 안내 문구가 달라짐
  onCancel: () => void;      // ✕
  onSendNow: () => void;     // 미리보기 그림을 누르면 바로 전송(카톡의 「한 번 더 누르기」와 같은 효과)
  reduceMotion?: boolean;
})
```
- 자리: 추천 줄과 같은 자리(입력바 위, `absolute bottom-full left-0 right-0 z-30`). 추천 줄이 떠 있을 때도 미리보기가 그 위를 덮는다.
- 모양: 추천 줄과 같은 말투(아래 코드의 `--ct-sheet`, `--ct-sheet-border`, 둥근 카드, 옅은 그림자, 강조색 #FB7BA8). 왼쪽에 이모티콘 그림(최대 높이 110px, 비율 유지, isVideo면 `<video autoPlay loop muted playsInline>`), 오른쪽 위 ✕(누르는 곳 40px), 그림 아래 또는 옆에 작은 안내 한 줄: hasText면 「보내기를 누르면 글과 함께 가요 · 그림을 한 번 더 누르면 바로」, 아니면 「보내기나 그림을 한 번 더 누르면 보내요」. 글 12px, var(--ct-chip-text) 계열의 옅은 색.
- 그림을 누르면 onSendNow. 등장은 아래에서 살짝 올라오며(reduceMotion이면 움직임 없이).

### 만들 것 2: StickerTextStack.tsx (새 파일) — 이모티콘 + 글을 한 말풍선 묶음으로
```ts
export default function StickerTextStack(props: { mine: boolean; sticker: React.ReactNode; children: React.ReactNode })
```
- 카톡처럼 **이모티콘 위, 글 말풍선 아래**, 같은 쪽 정렬(mine이면 오른쪽, 아니면 왼쪽), 사이 간격 4px 정도. sticker·children은 부모가 지금 쓰는 이모티콘 그림·글 말풍선을 그대로 넘긴다(아래 「지금 이모티콘 그리기」「지금 글 말풍선」 코드). 이 컴포넌트는 묶음 배치만 한다(새 색·그림자 추가 금지).

### 지키기
- 색은 위 CSS 변수와 #FB7BA8만. 답은 파일마다 ```tsx 블록 하나, 첫 줄 `// 파일이름.tsx`, 'use client' 포함. 설명은 맨 끝 3줄 이내. 글은 한국어.

### 참고: 추천 줄 StickerSuggestTray.tsx (이 말투에 맞춰)
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type SuggestItem = {
  id: string;
  thumb: string;
  label: string;
};

export default function StickerSuggestTray({
  items,
  onPick,
  onClose,
  reduceMotion = false,
}: {
  items: SuggestItem[];
  onPick: (item: SuggestItem) => void;
  onClose: () => void;
  reduceMotion?: boolean;
}) {
  // 아이템이 0개면 부모가 아니라 컴포넌트 내부에서 사라지는 애니메이션 처리
  const show = items.length > 0;

  // 트레이 등장/퇴장 애니메이션
  const trayVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      y: reduceMotion ? 0 : 12,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  };

  // 개별 아이템 변경 시 깜빡임 방지 및 부드러운 페이드
  const itemVariants = {
    hidden: { opacity: 0, scale: reduceMotion ? 1 : 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={trayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          // 입력바 바로 위(bottom-full)에 살짝 떠 있는 둥근 카드 스타일
          className="absolute bottom-full left-0 right-0 z-20 px-2 pb-2"
        >
          <div
            className="relative flex items-center w-full bg-[var(--ct-sheet)] border border-[var(--ct-sheet-border)] rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden"
            style={{ height: '112px' }}
          >
            {/* 가로 스크롤 영역 (스크롤바 숨김) */}
            <div className="flex-1 flex overflow-x-auto items-center h-full pl-3 pr-[68px] gap-3 touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.button
                    key={item.id}
                    layout="position"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    onClick={() => onPick(item)}
                    className="flex-shrink-0 w-[92px] h-[92px] rounded-2xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FB7BA8] transition-colors bg-transparent"
                    title={item.label}
                  >
                    <img
                      src={item.thumb}
                      alt={item.label}
                      className="w-full h-full object-contain"
                      draggable={false}
                      loading="eager"
                    />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* X 버튼 배경 그라데이션 (스크롤된 이모티콘이 X버튼 아래로 자연스럽게 사라지도록) */}
            <div className="absolute right-0 top-0 bottom-0 w-[72px] bg-gradient-to-l from-[var(--ct-sheet)] via-[var(--ct-sheet)] to-transparent pointer-events-none" />

            {/* 오른쪽 고정 ✕ 닫기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              aria-label="추천 닫기"
              className="absolute right-3 flex items-center justify-center w-11 h-11 rounded-full bg-[var(--ct-sheet)] border border-[var(--ct-sheet-border)] shadow-[var(--ct-cell-shadow)] text-[var(--ct-label)] hover:text-[#FB7BA8] active:bg-[var(--ct-tab-active)] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FB7BA8]"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

```

### 참고: 지금 이모티콘 그리기 (ChatPanel 일부)
```tsx
                      ) : m.sticker ? (
                        isVideoSrc(m.sticker) ? (
                          <video src={m.sticker} poster={posterOf(m.sticker)} autoPlay loop muted playsInline
                            className="w-40 h-40 rounded-[26px] object-cover bg-white shadow-sm" />
                        ) : FULL_STICKERS.has(m.sticker) ? (
                          <motion.img src={m.sticker} alt="이모티콘" className="w-[76vw] max-w-[400px] h-auto rounded-2xl shadow-sm"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 }, opacity: { duration: 0.2 } }} />
                        ) : (
                          // 크기 통일 — ⚠️ 높이·폭 '둘 다' 상한(max-h 138 / max-w 150, 비율유지 contain). 높이만 잡으면
                          //   세로긴 프레임(사이 팩)은 잡히지만 가로넓은 것(심심해 319x252→187폭)·정사각(ㅋㅋㅋ 꽉참)이 커 보임.
                          //   두 상한으로 캐릭터 '덩치'를 통일(우댕: 뭐해/도착/심심해/ㅋㅋㅋ 지적). 푸데데 가로형이 대략 상한.
                          //   챗 이모티콘은 말풍선 없이 그림만. ⚠️ 움짤(sai-anim)은 스스로 움직여 통 흔들기(rotate) 제외, 정지만 흔든다.
                          <motion.img src={m.sticker} alt="이모티콘"
                            className="max-h-[138px] max-w-[150px] object-contain drop-shadow-sm"
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={m.sticker.startsWith('/emo/sai-anim/')
                              ? { scale: 1, opacity: 1 }
                              : { scale: 1, opacity: 1, rotate: [0, -5, 5, -3, 0] }}
                            transition={m.sticker.startsWith('/emo/sai-anim/')
                              ? { scale: { type: 'spring', stiffness: 420, damping: 14 }, opacity: { duration: 0.15 } }
                              : { scale: { type: 'spring', stiffness: 420, damping: 14 }, opacity: { duration: 0.15 }, rotate: { duration: 1.8, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' } }} />
                        )

```

### 참고: 지금 글 말풍선 (ChatPanel 일부)
```tsx
                            {!onlyUrl && (
                              <div
                                className={`max-w-full px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-keep rounded-2xl ${mine ? 'rounded-tr-sm shadow-[0_2px_8px_rgba(0,0,0,0.12)]' : 'rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)]'}`}
                                style={{ background: mine ? 'var(--ct-my-bg)' : 'var(--ct-partner-bg)', color: mine ? 'var(--ct-my-text)' : 'var(--ct-partner-text)' }}>
                                {renderRich(m.text, m.from)}
                              </div>
                            )}

```
