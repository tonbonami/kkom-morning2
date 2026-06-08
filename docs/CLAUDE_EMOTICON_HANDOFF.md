# Claude Handoff: Emoticon Letter

## Summary

The letter composer now supports KakaoTalk-style emoticon letters. Users can send text, voice, doodle, and optional emoticons together, or send only emoticons. Emoticons are saved as stable IDs in Firestore, so future asset swaps do not break older letters.

## Main Files

- `src/lib/emoticons.ts`
  - Source of truth for emoticon sets and metadata.
  - `EMOTICONS` contains ID, label, meaning, notification phrase, and image URL.
  - `EMOTICON_SETS` controls what appears in the picker.
  - `buildEmoticonNotificationTitle()` creates meaning-based push titles.
- `src/app/letter/new/page.tsx`
  - Composer UI.
  - Floating emoticon bottom sheet.
  - Selected emoticon preview.
  - `MAX_EMOTICONS_PER_LETTER` is currently `3`.
- `src/lib/letters.ts`
  - `Letter` and `InboxLetter` now include optional `emoticonIds`.
  - `sendLetter()` saves `emoticonIds` and sends them to `/api/notify-letter`.
- `src/components/LetterInboxV3.tsx`
  - Renders emoticons in the letter list and letter detail modal.
- `src/app/api/notify-letter/route.ts`
  - Immediate push notification supports emoticon-only and text+emoticon letters.
- `src/app/api/notify-pending-letters/route.ts`
  - Scheduled letter notification also understands emoticon IDs.

## Current Asset Setup

Original user-uploaded sheet:

- `public/imoticon/Pochacco_love.png`

The original file is a 3x3 sheet. It was split into individual stickers:

- `public/imoticon/pochacco-love/1.png`
- `public/imoticon/pochacco-love/2.png`
- `public/imoticon/pochacco-love/3.png`
- `public/imoticon/pochacco-love/4.png`
- `public/imoticon/pochacco-love/5.png`
- `public/imoticon/pochacco-love/6.png`
- `public/imoticon/pochacco-love/7.png`
- `public/imoticon/pochacco-love/8.png`
- `public/imoticon/pochacco-love/9.png`

The visible picker set is currently:

1. 사랑해
2. 내꺼야
3. 안아줘
4. 보고싶어
5. 빠샤
6. 할수있어
7. 충전완료
8. 최고야
9. 내편

Some legacy temporary IDs remain in `EMOTICONS` with `setId: 'legacy_hidden'` so old letters will not break.

## Important Notes

- Do not store image URLs in letter documents. Store only `emoticonIds`.
- To replace art later, keep IDs stable and only update `imageUrl`.
- The picker bottom sheet uses `inset-x-4 bottom-4 max-w-md mx-auto`; avoid combining `left-1/2 -translate-x-1/2` with Framer Motion `y` animations, because it can visually shift the modal.
- Sticker images in the picker are intentionally large and use `object-contain` plus `overflow-hidden` so they fill the card without spilling out.

## Known Caveat

The original uploaded PNG is RGB and has a visible textured background. The split files may still show that texture. For a clean sticker look, regenerate or clean the source as transparent PNG/WEBP, then replace the 9 files under `public/imoticon/pochacco-love/`.
