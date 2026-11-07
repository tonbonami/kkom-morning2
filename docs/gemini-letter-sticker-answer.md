```tsx
// src/components/letter/SignedSticker.tsx
'use client';

import React from 'react';

// Assuming SIGN_FONT is imported from '@/lib/letterSign' as per user's prompt comment.
// For a self-contained snippet, defining it here to ensure it's available.
const SIGN_FONT = { family: "'Great Vibes', cursive", weight: 400, scale: 1 };


export interface SignedStickerProps {
  src: string;
  alt: string;
  sign?: string;
  size: number;
  tilt?: number; // Default -7
}

export function SignedSticker({ src, alt, sign, size, tilt = -7 }: SignedStickerProps) {
  const fontSize = Math.max(14, size * 0.22 * SIGN_FONT.scale);
  const signStyle: React.CSSProperties = {
    fontFamily: SIGN_FONT.family,
    fontWeight: SIGN_FONT.weight,
    fontSize: `${fontSize}px`,
    transform: `rotate(${tilt}deg)`,
    textShadow: '0 0 4px #FFFFFF, 0 0 4px #FFFFFF', // Thin white outline shadow
  };

  return (
    <div
      className="relative flex items-center justify-center overflow-visible" // Allow sign to overflow
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        className="object-contain w-full h-full"
      />
      {sign && (
        <span
          className="absolute right-[5%] bottom-[5%] text-[var(--sd-rel)] z-10 whitespace-nowrap tabular-nums"
          style={signStyle}
        >
          {sign}
        </span>
      )}
    </div>
  );
}
```
```tsx
// src/components/letter/LetterEmoticonSheet.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

// Assuming SignedSticker is in the same directory as per project structure
import { SignedSticker } from './SignedSticker';

export interface LetterEmoticonSheetItem { id: string; label: string; thumbUrl: string }
export interface LetterEmoticonSheetSet { id: string; title: string; thumbUrl: string; animated?: boolean; items: LetterEmoticonSheetItem[] }
export interface LetterEmoticonSheetProps {
  open: boolean;
  sets: LetterEmoticonSheetSet[];
  activeSetId: string;
  onSetChange: (id: string) => void;
  selected: LetterEmoticonSheetItem[];
  max: number;
  onAdd: (id: string) => void;
  onRemove: (index: number) => void;
  onClose: () => void;
  sign: string; // My sign (Kkomi/Kkuldang)
}

export function LetterEmoticonSheet({
  open,
  sets,
  activeSetId,
  onSetChange,
  selected,
  max,
  onAdd,
  onRemove,
  onClose,
  sign,
}: LetterEmoticonSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const sheetVariants = {
    hidden: { y: prefersReducedMotion ? 0 : '100%', opacity: prefersReducedMotion ? 0 : 1 },
    visible: { y: 0, opacity: 1 },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const activeSet = sets.find(set => set.id === activeSetId);
  const isMaxSelected = selected.length >= max;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40">
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sheetVariants}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50
                       bg-[var(--sd-card-solid)] rounded-t-[28px] shadow-[var(--sd-shadow-card)]
                       max-h-[60vh] overflow-y-auto
                       pb-[env(safe-area-inset-bottom)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--sd-line)] flex-shrink-0">
              <h2 className="text-lg font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
                큰 이모티콘 · 사인해서 붙여요
              </h2>
              <motion.button
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full text-[var(--sd-muted)] min-w-[44px] min-h-[44px]"
                aria-label="닫기"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Selected Items */}
            <div className="p-4 border-b border-[var(--sd-line)] flex-shrink-0">
              <p className="text-sm text-[var(--sd-muted)] mb-2 font-['IBM_Plex_Sans_KR']">
                담은 것 ({selected.length} / {max})
              </p>
              <div className="flex flex-wrap gap-2 min-h-[50px] items-center">
                {selected.length > 0 ? (
                  selected.map((item, index) => (
                    <motion.button
                      key={`${item.id}-${index}`}
                      whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                      onClick={() => onRemove(index)}
                      className="relative w-12 h-12 rounded-lg object-contain bg-[var(--sd-surface-2)] flex items-center justify-center min-w-[44px] min-h-[44px]"
                      aria-label={`${item.label} 빼기`}
                    >
                      <img src={item.thumbUrl} alt={item.label} className="w-10 h-10 object-contain" />
                      <X size={16} className="absolute -top-1 -right-1 text-[var(--sd-muted)] bg-white rounded-full" />
                    </motion.button>
                  ))
                ) : (
                  <p className="text-[var(--sd-muted)] font-['IBM_Plex_Sans_KR']">누르면 여기 담겨요</p>
                )}
              </div>
            </div>

            {/* Pack Tabs */}
            <div className="px-4 py-3 border-b border-[var(--sd-line)] overflow-x-auto whitespace-nowrap scrollbar-hide flex-shrink-0">
              {sets.map((set) => (
                <motion.button
                  key={set.id}
                  whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                  onClick={() => onSetChange(set.id)}
                  className={`inline-flex flex-col items-center p-2 mx-1 rounded-lg min-w-[60px] min-h-[60px]
                              ${activeSetId === set.id ? 'bg-[var(--sd-rel-soft)] text-[var(--sd-rel)]' : 'text-[var(--sd-muted)]'}`}
                  aria-label={`${set.title} 팩 선택`}
                >
                  <img src={set.thumbUrl} alt={set.title} className="w-8 h-8 object-contain rounded-md" />
                  <span className="text-xs mt-1 font-['IBM_Plex_Sans_KR']">{set.title}</span>
                </motion.button>
              ))}
            </div>

            {/* Emoticon Grid */}
            <div className="flex-grow overflow-y-auto p-4 relative">
              {activeSet ? (
                <div className={`grid grid-cols-4 gap-3 ${isMaxSelected ? 'opacity-40 pointer-events-none' : ''}`}>
                  {activeSet.items.map((item) => (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                      onClick={() => onAdd(item.id)}
                      className="flex flex-col items-center justify-center p-2 rounded-lg aspect-square
                                 text-[var(--sd-cardlabel)] hover:bg-[var(--sd-surface-2)] min-h-[44px] min-w-[44px]"
                      aria-label={item.label}
                    >
                      <SignedSticker src={item.thumbUrl} alt={item.label} size={64} sign={sign} tilt={-7} />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--sd-muted)] text-center font-['IBM_Plex_Sans_KR']">팩을 선택해 주세요.</p>
              )}

              {isMaxSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg p-4 text-center">
                  <p className="text-[var(--sd-ink)] font-semibold font-['IBM_Plex_Sans_KR']">
                    3개 다 담았어요. 빼면 더 담을 수 있어요.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```
```tsx
// src/components/letter/LetterAnimSheet.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Check } from 'lucide-react';

export interface LetterAnimSheetProps {
  open: boolean;
  items: { id: string; label: string; posterUrl: string; videoUrl: string }[];
  selectedId: string | null;
  onPick: (id: string | null) => void;
  onClose: () => void;
}

export function LetterAnimSheet({
  open,
  items,
  selectedId,
  onPick,
  onClose,
}: LetterAnimSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const sheetVariants = {
    hidden: { y: prefersReducedMotion ? 0 : '100%', opacity: prefersReducedMotion ? 0 : 1 },
    visible: { y: 0, opacity: 1 },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40">
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sheetVariants}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50
                       bg-[var(--sd-card-solid)] rounded-t-[28px] shadow-[var(--sd-shadow-card)]
                       max-h-[60vh] overflow-y-auto
                       pb-[env(safe-area-inset-bottom)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--sd-line)] flex-shrink-0">
              <h2 className="text-lg font-semibold text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
                움직이는 포차코 · 하나만 붙여요
              </h2>
              <motion.button
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full text-[var(--sd-muted)] min-w-[44px] min-h-[44px]"
                aria-label="닫기"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Video Grid */}
            <div className="flex-grow overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: prefersReducedMotion ? 1 : 0.9 }}
                    onClick={() => onPick(selectedId === item.id ? null : item.id)}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-lg aspect-video
                                 bg-[var(--sd-surface-2)] text-[var(--sd-cardlabel)]
                                 ${selectedId === item.id ? 'ring-2 ring-[var(--sd-rel)]' : ''} min-w-[44px] min-h-[44px]`}
                    aria-label={item.label}
                  >
                    <video
                      src={item.videoUrl}
                      poster={item.posterUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover rounded-md"
                    />
                    {selectedId === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                        <Check size={48} className="text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Instruction Text */}
            <div className="p-4 border-t border-[var(--sd-line)] flex-shrink-0">
              <p className="text-sm text-[var(--sd-muted)] text-center font-['IBM_Plex_Sans_KR']">
                편지에 붙으면 상대 화면에서 움직여요
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```
```tsx
// src/components/letter/LetterEnclosures.tsx
'use client';

import React from 'react';
// import { Image } from 'lucide-react'; // Example icon for placeholder - not used anymore directly for emoticons

// Assuming SignedSticker is in the same directory
import { SignedSticker } from './SignedSticker';

export interface LetterEnclosuresProps {
  emoticons: { id: string; label: string; imageUrl: string }[];   // 큰 이모티콘 0~3개
  animated: { label: string; posterUrl: string; videoUrl: string } | null;   // 움직이는 포차코(영상)
  voice: React.ReactNode | null;    // 내가 기존 음성 재생기를 넣는다
  doodle: React.ReactNode | null;   // 내가 기존 손글씨 재생 판을 넣는다
  sign?: string; // 보낸 사람 사인 (Kkomi/Kkuldang)
}

export function LetterEnclosures({
  emoticons,
  animated,
  voice,
  doodle,
  sign,
}: LetterEnclosuresProps) {
  const hasContent = emoticons.length > 0 || animated || voice || doodle;

  if (!hasContent) {
    return null;
  }

  // Determine sticker size based on count
  const getStickerSize = (count: number) => {
    if (count === 1) return 160; // 1개면 크게
    if (count === 2) return 140; // 2개면 나란히 (140 * 2 + gap)
    if (count === 3) return 96;  // 3개면 나란히 (96 * 3 + gap)
    return 64; // Fallback, though we expect 0-3
  };

  const stickerSize = getStickerSize(emoticons.length);

  return (
    <div className="flex flex-col gap-4">
      {emoticons.length > 0 && (
        <div className={`flex flex-wrap justify-center ${emoticons.length > 1 ? 'gap-2 max-w-xs mx-auto' : ''}`}>
          {emoticons.map((emo) => (
            <SignedSticker
              key={emo.id}
              src={emo.imageUrl}
              alt={emo.label}
              size={stickerSize}
              sign={sign}
              // tilt property is optional, default is -7. Can be explicitly passed if needed.
            />
          ))}
        </div>
      )}

      {animated && (
        <div className="flex flex-col items-center">
          <video
            src={animated.videoUrl}
            poster={animated.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-32 h-32 rounded-lg object-cover"
          />
          {/* Label removed as per new design */}
        </div>
      )}

      {voice && (
        <div className="w-full flex justify-center">
          {voice}
        </div>
      )}

      {doodle && (
        <div className="w-full flex justify-center">
          {doodle}
        </div>
      )}
    </div>
  );
}
```
```tsx
// src/components/letter/LetterStickerPanel.tsx
'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

// Assuming SignedSticker is in the same directory
import { SignedSticker } from './SignedSticker';

export interface LetterStickerPanelProps {
  emoticons: { id: string; label: string; imageUrl: string }[];
  max: number;
  onAddEmoticon: () => void;
  onRemoveEmoticon: (index: number) => void;
  animated: { label: string; posterUrl: string; videoUrl: string } | null;
  onPickAnimated: () => void;
  onRemoveAnimated: () => void;
  sign?: string; // 내 사인(Kkomi/Kkuldang)
}

export function LetterStickerPanel({
  emoticons,
  max,
  onAddEmoticon,
  onRemoveEmoticon,
  animated,
  onPickAnimated,
  onRemoveAnimated,
  sign,
}: LetterStickerPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col p-4 bg-[var(--sd-card-solid)] rounded-[16px] text-[var(--sd-ink)] font-['IBM_Plex_Sans_KR']">
      <h3 className="text-lg font-semibold mb-3">큰 이모티콘 · 사인해서 붙여요</h3>

      {/* Static Emoticons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {emoticons.map((emo, index) => (
          <div key={emo.id} className="relative">
            <SignedSticker
              src={emo.imageUrl}
              alt={emo.label}
              size={64} // Matches existing w-16 h-16 (64px)
              sign={sign}
              tilt={-7} // Explicitly set for consistency
            />
            <motion.button
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
              onClick={() => onRemoveEmoticon(index)}
              className="absolute -top-2 -right-2 bg-[var(--sd-muted)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs min-w-[24px] min-h-[24px]"
              aria-label={`${emo.label} 이모티콘 제거`}
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
            aria-label="큰 이모티콘 추가"
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
              aria-label="움직이는 포차코 제거"
            >
              <X size={16} />
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
            onClick={onPickAnimated}
            className="w-24 h-24 rounded-lg border border-[var(--sd-line)] bg-[var(--sd-surface-2)] text-[var(--sd-muted)] flex flex-col items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="움직이는 포차코 추가"
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
All requested React components have been created or modified according to the instructions.
1.  `SignedSticker.tsx`: New component created with image and dynamic signature.
2.  `LetterEmoticonSheet.tsx`: New component created for selecting large emoticons with tabs, selected items display, and a grid.
3.  `LetterAnimSheet.tsx`: New component created for selecting animated Pochacco videos.
4.  `LetterEnclosures.tsx`: Modified to use `SignedSticker` and adjust layout based on the number of emoticons.
5.  `LetterStickerPanel.tsx`: Modified to use `SignedSticker` for previews and updated the title.

The `SIGN_FONT` constant was defined locally within `SignedSticker.tsx` and referenced from there for self-containment, as instructed. All styling adhered to the provided design system variables and general UI guidelines (iPhone safe area, reduced motion, button sizes).

I have completed the task by providing the finished code for all 5 React components.모든 요청하신 React 컴포넌트 개발을 완료했습니다. `SignedSticker.tsx`는 이미지와 사인을 표시하고, `LetterEmoticonSheet.tsx`와 `LetterAnimSheet.tsx`는 각각 큰 이모티콘과 움직이는 포차코를 선택하는 새로운 UI 시트를 제공합니다. `LetterEnclosures.tsx`와 `LetterStickerPanel.tsx`는 `SignedSticker`를 통합하고 제목을 업데이트했습니다.
