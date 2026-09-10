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

---

## 2026-09-10 — 사이담에서 넘긴 움짤 2종 (party, gift)

사이담 쪽에서 만들어 `public/emo/sai-anim/` 에 넣어 둔 것. 우댕님이 꼼모닝에도
전하라고 하셨다. 전달 시점에 꼼모닝 세션이 닫혀 있어서 글로 남긴다.

| 파일 | 뜻 | 제안 id |
|---|---|---|
| `party.webp` · `party-still.png` | 폭죽을 터뜨리며 축하한다 | `anim_party` / 라벨 `축하해!` |
| `gift.webp` · `gift-still.png` | 선물을 들어올려 내민다 | `anim_gift` / 라벨 `선물` |

⚠️ **둘 다 새 파일이라 캐시 버스터는 필요 없다.** (앞서 `bath` `wave` 는 같은
이름으로 그림을 갈아서 `?v=2` 가 필요했던 것이고, 이번은 경우가 다르다.)

레퍼런스 사진 없이 만든 것이라 소재도 이쪽에서 골랐다. 기념일을 세는 앱인데
축하할 이모티콘이 없었고, 선물은 시작과 끝 자세가 완전히 달라 움직임이 크게 난다.

### ⚠️ 이번에 데인 것 셋 — 같은 파이프라인이면 그대로 적용된다

**① 초록 배경에 초록 소품을 쓰면 안 된다.**
선물 상자를 민트색으로 그렸더니 크로마키와 despill 이 통째로 먹어서 **회색 상자**가
나왔다. 산호빛 분홍으로 다시 그려 해결.
⚠️ 더 중요한 건 **확인 방식이 틀렸다는 것**이다. "초록 소품이 위험하다"고 스스로
말해놓고, 검증할 때는 **떨어져 나온 작은 조각들만** 쟀다. 상자는 앞발에 붙어 있어
그 목록에 아예 안 잡혔고 "안전하다"고 보고했다. **의심한 지점과 측정한 지점이
달랐다.** 소품 색은 프롬프트에서 초록·민트·틸을 아예 금지어로 박아둘 것.

**② 두 키프레임 방식은 없는 물건을 만들어내지 못한다.**
시작컷을 "선물을 등 뒤에 숨긴" 그림으로 잡았더니, 앞의 절반은 **빈 앞발만 흔들다가**
상자가 허공에서 생겨났다. 모델에게 가져올 물건이 없었던 것.
시작컷을 "선물을 무릎에 놓고 내려다보는" 것으로 바꿔 **상자를 양쪽 그림에 다** 두니
한 번에 나왔다. **물건이 등장하는 연출은 양쪽 키프레임에 그 물건이 있어야 한다.**

**③ "마지막에 처음 자세로 돌아와라" 는 무시당한다.**
두 편 다 무시했다. 몸통만 떼어 첫 프레임과 비교하니 축하해는 초반 이후 끝까지
0.62 에 머물러 **한 번도 안 돌아왔다.** 모델은 A→B 를 재생하고 **B 에 머문다.**
**루프는 후반작업으로 만드는 게 맞다**고 보는 편이 낫다. 쓴 방법 둘:
- **되감기 꼬리**(선물) — 들어올린 프레임을 거꾸로 붙여 무릎으로 다시 내렸다.
  의미도 맞다(내밀었다가 내려놓는다). 이음새 0.781 → **0.935**
- **자르는 지점 바꾸기**(축하해) — 되감으면 색종이가 폭죽으로 빨려들어가 이상하다.
  준비 동작을 버리고 폭발 지점부터 잘라 "펑 → 축하 → 색종이가 흩날려 사라짐 →
  다시 펑". 폭죽은 반복해 터져도 자연스럽다. 이음새 0.634 → **0.910**

⚠️ **크로스페이드는 하지 말 것.** 해봤더니 **회색 유령이 겹치고 눈이 네 개**가 됐다.
투명 픽셀의 RGB 와 섞여서 그렇다.
⚠️ 위 두 방법은 새로 생성한 게 아니라 **있는 프레임을 편집한 것**이다. 밝혀 둘 것.

### 판단 기준을 먼저 재고 정했다

"이음새가 나쁘다"를 감으로 말하지 않으려고 **이미 배포된 12종의 루프 이음새를 먼저
쟀다** — 중앙값 0.949, 최저 0.883. 신규가 0.781·0.634 였으니 넘길 수치가 아니라는 게
숫자로 나왔다. 기존 것들 기준선을 한 번 재두면 새로 만들 때마다 판단이 쉽다.

참고로 **색이 연해 보이는 건 문제가 아니다.** 배포된 것들과 나란히 놓고 재보니
똑같다 — despill 이 채도를 깎는 파이프라인 특성이고 폰에서는 정상으로 보인다.
