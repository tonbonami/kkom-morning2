# Aside 의뢰서 — Kling 16차: 꼼이·꿀댕이 「뽀뽀」

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 "1,2 둘다 하자. 내 반응 보지말고 그냥 클링으로 돌려"라고 했다(2026-10-20).
> - **생성은 영상마다 딱 1번, 모두 2번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 30.** 결제·충전·구독 변경 금지.
> - 그림 세 장은 이 대화의 **첨부 폴더(attachments)**에 있다: `kp1-before.png` `kp2-kiss.png` `kp3-after.png`.
> - **영상 2개를 다 만들면 먼저 다운로드해서 artifacts에 저장하고**, 그다음 검수한다.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

---

## 이야기

꼼이(왼쪽 강아지)가 옆의 꿀댕이(오른쪽 꿀벌 옷 아기돼지)를 슬쩍 보다가 **볼에 기습 뽀뽀**. 꿀댕이는 깜짝 놀라 더듬이 방울이 하트로 바뀌고, 꼼이가 수줍게 키득거리며 물러나는 사이 **얼굴이 새빨개져 행복에 녹아 살짝 떠오른다.** 웃음 포인트는 **꿀댕이의 과한 반응**(하트 더듬이 뿅 → 붕 뜨기).

## 너의 역할 · 🚨 절대 금지

전과 같다. 결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 세 장 말고 다른 그림 올리지 않기, **생성 버튼은 영상마다 딱 1번**.

## 설정 (두 영상 같음) — 화면 기본값이 바뀌어 있을 수 있으니 하나씩 확인

| 항목 | 값 |
|---|---|
| 입력 방식 | **Keyframes**(시작 그림 + 끝 그림) |
| 모델 | **Kling 3.0** |
| 길이 | **3s** |
| 화질 | **720p** |
| 소리(Native audio) | **끔** |
| 비율 | 1:1 (고를 수 있으면) |

---

## 영상 1 — 시작 `kp1-before.png`, 끝 `kp2-kiss.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE sweet little moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    THE CHARACTERS (both are real animals on FOUR legs the whole time — never standing on two legs, never human hands):
    LEFT — KKOM: a fluffy cream-white maltipoo puppy, two big floppy curly ears, ONE small pink ribbon on her head, small black nose, pink paw pads. EXACTLY TWO EARS, ONE ribbon, FOUR LEGS.
    RIGHT — KKULDAENG: a baby piglet in a bee costume: pink skin, round flat pink snout, small triangle ears, rosy cheeks, curly tail, a honey-yellow vest with brown stripes on his body only, a headband with TWO bendy brown antennae, two small pale-blue wings. EXACTLY TWO EARS, TWO ANTENNAE, TWO WINGS, FOUR LEGS.

    EYES: simple sticker eyes only — round dot eyes (ONE solid dark shape with ONE small white highlight) or closed happy curves. No eye whites, no eyebrows, no eyelashes, no teeth, no tongue, no drawn lips.

    THE MOTION, ONCE:
    1. 0 to 0.5 second, the start frame: Kkom glances sideways at Kkuldaeng with a sly little smile; he looks ahead, calm and unaware.
    2. Kkom takes one quick little step to the right and stretches her neck up, closing her eyes.
    3. At about 1.8 seconds she gives him a quick peck on the CHEEK — "chu!" — a tiny pink heart pops out between them.
    4. Kkuldaeng freezes in surprise: his cheeks flush pink and his two round yellow antenna balls POP into two pink hearts. His wings stick out stiffly.
    5. Finish exactly on the end frame.

    Kkuldaeng stays in the same place the whole time; only Kkom moves toward him. Their two faces touch only at the kiss and never melt into one shape.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no numbers.

    Earlier attempts failed: one character leaned onto and overlapped the other, puppies stood up on two legs, ears or antennae split into extra pieces, faces were redrawn with human eyes. None of that here.

받기: `kling17-kiss-1.mp4`

## 영상 2 — 시작 `kp2-kiss.png`, 끝 `kp3-after.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE sweet little moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    THE CHARACTERS (both are real animals on FOUR legs the whole time — never standing on two legs, never human hands):
    LEFT — KKOM: a fluffy cream-white maltipoo puppy, two big floppy curly ears, ONE small pink ribbon on her head, small black nose, pink paw pads. EXACTLY TWO EARS, ONE ribbon, FOUR LEGS.
    RIGHT — KKULDAENG: a baby piglet in a bee costume: pink skin, round flat pink snout, small triangle ears, rosy cheeks, curly tail, a honey-yellow vest with brown stripes on his body only, a headband with TWO bendy brown antennae ending in two pink hearts, two small pale-blue wings. EXACTLY TWO EARS, TWO ANTENNAE, TWO WINGS, FOUR LEGS.

    EYES: simple sticker eyes only — round dot eyes (ONE solid dark shape with ONE small white highlight) or closed happy curves. No eye whites, no eyebrows, no eyelashes, no teeth, no tongue, no drawn lips.

    THE MOTION, ONCE:
    1. 0 to 0.3 second, the start frame: the kiss on his cheek.
    2. Kkom pulls her head back a little and giggles shyly, eyes closed in happy curves, lifting one front paw near her mouth. She stays standing in the same spot.
    3. Kkuldaeng melts with happiness: his whole face glows deeper and deeper pink, his eyes close into dreamy curves, a dazed happy smile, his wings start buzzing fast, and he slowly floats up just a little off the ground.
    4. Three small pink hearts rise one by one above his head.
    5. Finish exactly on the end frame.

    The two characters drift slightly apart after the kiss and never overlap. Kkuldaeng only floats straight up a little; he does not fly away.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no numbers.

    Earlier attempts failed: one character leaned onto and overlapped the other, puppies stood up on two legs, ears or antennae split into extra pieces, faces were redrawn with human eyes. None of that here.

받기: `kling17-kiss-2.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록** |
| C2 | 둘의 크기가 모든 프레임에서 같다. 확대·카메라 이동이면 탈락 |
| C3 | 끝까지 화면 안(귀 끝·하트·날개 안 잘림) |
| C4 | 눈은 점눈·웃는 선만. 흰자·눈썹·속눈썹·**이·혀·입술** 나오면 탈락 |
| C5 | 영상1: 꼼이가 **볼에 쪽** 하고 더듬이 방울이 **하트로 뿅** 바뀌는지. 영상2: 꿀댕이가 **빨개지며 날개 붕붕 살짝 떠오르는지** |
| C6 | **개수** — 꼼이 귀 2·리본 1·다리 4 / 꿀댕이 귀 2·더듬이 2·날개 2·다리 4. 움직이는 순간은 한 프레임씩 센다 |
| C7 | 사람 손·두 발로 서기 없음 |
| C8 | 둘이 **겹치거나 한 덩어리로 녹지 않는지**(뽀뽀 순간 볼만 닿기) |
| C9 | 글자·숫자·다른 캐릭터 없음 |
| C10 | `[의견]` "기습 뽀뽀 → 꿀댕이 녹아서 붕 뜸"이 읽히는지, 귀여운지 |

## 받기 · 보고

두 영상 모두 워터마크 없이 다운로드해서 세션 artifacts 폴더에 저장(탈락이어도).

    설정: (화면 글자 그대로)
    크레딧: 영상1·2 (예상/실제) · 남은 것
    영상1·2 체크리스트: C1 … C10
    파일: (이름과 저장 위치)

## 마무리 (꼭 답할 것)

1. 꿀댕이 반응(하트 더듬이·붕 뜨기)이 충분히 보이는지 한 줄.
2. 탈락이면 가장 큰 원인과 다음에 바꿀 것(`[의견]`).
