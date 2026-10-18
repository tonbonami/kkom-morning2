# Aside 의뢰서 — Kling 13차: 꿀댕이·꼼이 「일어나!」 세 번째

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 고친 키프레임 세 장을 보고 "보내"라고 했다(2026-10-18, 13차).
> - **12차에서 바뀐 것:** Teo가 12차를 보고 "오히려 꿀댕이가 귀를 들어서 덮어주는 것 같은 느낌". 원인: 영상 1에서 ① 꿀댕이 앞발이 꼼이 머리에 닿아 있었고 ② 귀가 붕붕 소리보다 **먼저** 넘어갔다. 이번엔 1·2번 그림에서 꿀댕이를 꼼이에게서 **멀리 떼어 놓았고**(100px·81px), 순서를 **붕붕 먼저 → 그다음 꼼이 혼자 귀 넘김**으로 못 박는다. 꿀댕이는 끝까지 꼼이에게 **닿지 않는다**.
> - **11차에서 바뀐 것:** Teo가 11차 결과를 보고 "귀가 4개잖아" — 두 귀로 얼굴을 덮는 장면에서 옆머리 털까지 귀로 보였다. 이번엔 **귀 하나만**(꿀댕이 쪽, 리본 없는 귀) 얼굴을 덮고, 리본 귀는 그대로 옆에 있다. 그리고 "콧방울 더 크게" — 장면마다 콧방울이 커진다.
> - **생성은 영상마다 딱 1번, 모두 3번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 30.** 결제·충전·구독 변경 금지.
> - 그림 세 장은 이 대화의 **첨부 폴더(attachments)**에 있다: `kling14-1-breath.png`, `kling14-2-buzz.png`(꿀댕이 자리만 옮김), `kling13-3-blank.png`(12차 그대로).
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

---

## 이야기 — 이번엔 캐릭터가 둘이다 (끝이 처음으로 돌아가 반복)

| 그림 | 장면 |
|---|---|
| `kling14-1-breath.png` | ① 꼼이(흰 말티푸)가 엎드려 콧방울 달고 잔다. 꿀댕이(꿀벌옷 아기돼지)가 옆에 떠서 **볼 빵빵하게 숨을 참는다** |
| `kling14-2-buzz.png` | ② 꿀댕이가 날개를 **붕붕붕** 떤다(소리 선). 꼼이는 눈도 안 뜨고 **꿀댕이 쪽 귀 하나를 얼굴 위로 덮는다**(이불처럼). 리본 귀는 옆에 그대로. 콧방울이 **커진다** |
| `kling13-3-blank.png` | ③ 꿀댕이가 옆에 내려앉아 **멍** — 점 눈·식은땀. 꼼이는 귀 이불 속에서 쿨쿨, 콧방울이 **왕만큼** 커짐 |

영상 셋: **①→②, ②→③, ③→①.** 웃음 포인트는 ②에서 **꿀댕이 쪽 귀 하나가 들려 얼굴로 넘어오는 순간**과, 깨울수록 **콧방울이 커지는 것**이다. **꼼이 귀는 어느 프레임에서도 2개**(리본 귀 1 + 다른 귀 1)여야 한다.

## 너의 역할 · 🚨 절대 금지

전과 같다. 결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 세 장 말고 다른 그림 올리지 않기, **생성 버튼은 영상마다 딱 1번**.

## 설정 (세 영상 같음) — 화면 기본값이 바뀌어 있을 수 있으니 하나씩 확인

| 항목 | 값 |
|---|---|
| 입력 방식 | **Keyframes**(시작 그림 + 끝 그림) |
| 모델 | **Kling 3.0** |
| 길이 | **3s** |
| 화질 | **720p** |
| 소리(Native audio) | **끔** |
| 비율 | 1:1 (고를 수 있으면) |

예상 크레딧을 누르기 전에 적어 두고, 30을 넘으면 멈춰서 보고한다.

---

## 영상 1 — 시작 `kling14-1-breath.png`, 끝 `kling14-2-buzz.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    TWO characters:
    THE SLEEPING PUPPY (left): a fluffy cream-white maltipoo with two big floppy curly ears, a small pink ribbon at the base of the ear on the viewer's LEFT, round pink paw pads, lying on her belly with her chin on her front paws, a pale-blue nose bubble. She STAYS ASLEEP the whole time and her eyes never open. Her body, paws and position never move or slide. EXACTLY TWO EARS in every frame — never a third or fourth ear-like lump — and ONE ribbon.
    THE FLYING PIGLET (right): a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail, a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, two SMALL opaque pale-blue bee wings that never grow bigger. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. Never human hands, never standing on two legs.

    EYES: simple sticker eyes only — closed curves, squeezed > < lines, or round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight). No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE, IN THIS ORDER:
    1. 0 to 0.4 second, the start frame: the piglet hovers in the air at the upper right, clearly apart from the puppy, holding a huge breath, cheeks puffed round, eyes squeezed shut.
    2. 0.4 to 1.4 seconds: staying in the air at a distance, he buzzes his two small wings as fast as he can: the wings become a blur and little curved sound-wave arcs pulse out toward her head. During this whole buzz her ears do NOT move yet.
    3. 1.4 to 2.2 seconds, only AFTER the buzzing: the puppy does not wake up. Still asleep, she lifts ONLY her ear on the viewer's RIGHT (the one nearer the piglet, without the ribbon) and flips it up and over her own face like pulling a blanket over her head, until her eyes are hidden under that ear. The ear clearly travels from the right side, up, and over the face. Her ear with the ribbon stays hanging at the left side the whole time. After the ear has moved, the right side of her head shows no ear.
    The piglet did NOT do this: he stays up in the air at a distance the whole time and never touches her, her ear or her head. When her ear flops over, he blinks in surprise with round dot eyes.
    4. 2.2 to 3 seconds: sleeping even deeper, her nose bubble swells from small to big — about as wide as her snout and both cheeks together. Her body and paws stay still.
    5. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash, no bed, no pillow. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, faces were redrawn with human eyes, the puppy seemed to have FOUR ears when her ears covered her face, the piglet's front hooves rested on her head and her ear flipped BEFORE the buzzing — so it looked like the piglet lifted her ear for her — and extra legs appeared. None of that here.

받기: `kling14-wake-1.mp4`

## 영상 2 — 시작 `kling14-2-buzz.png`, 끝 `kling13-3-blank.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    TWO characters:
    THE SLEEPING PUPPY (left): a fluffy cream-white maltipoo lying on her belly with her chin on her front paws, round pink paw pads. One ear (with a small pink ribbon) hangs at the left side of her head; her other ear is flipped over her face like a blanket, hiding her eyes. A big pale-blue nose bubble. She STAYS ASLEEP the whole time and her eyes stay hidden. Her body, ears, paws and position never move or slide. EXACTLY TWO EARS in every frame — never a third or fourth ear-like lump — and ONE ribbon.
    THE FLYING PIGLET (right): a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail, a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, two SMALL opaque pale-blue bee wings that never grow bigger. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. Never human hands, never standing on two legs.

    EYES: simple sticker eyes only — closed curves or round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight). No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.3 second, the start frame: the piglet is still buzzing his wings at her.
    2. He notices she is not waking up. His wings slow down and stop, and he sinks gently down and lands on all four legs on the ground just to the right of the puppy. He never touches or leans on her.
    3. He stares at her completely blank: round dot eyes, a tiny straight mouth, a small pale-blue sweat drop appears beside his head, one antenna droops.
    4. Meanwhile the puppy keeps sleeping peacefully under her ear-blanket and her nose bubble keeps swelling until it is HUGE, about half the width of her head, resting on her paws. It never pops.
    5. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash, no bed, no pillow. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, faces were redrawn with human eyes, the puppy seemed to have FOUR ears, the puppy's body changed shape, and extra legs appeared. None of that here.

받기: `kling14-wake-2.mp4`

## 영상 3 — 시작 `kling13-3-blank.png`, 끝 `kling14-1-breath.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    TWO characters:
    THE SLEEPING PUPPY (left): a fluffy cream-white maltipoo with two big floppy curly ears, a small pink ribbon at the base of the ear on the viewer's LEFT, round pink paw pads, lying on her belly with her chin on her front paws, a pale-blue nose bubble. She STAYS ASLEEP the whole time and her eyes never open. Her body, paws and position never move or slide. EXACTLY TWO EARS in every frame — never a third or fourth ear-like lump — and ONE ribbon.
    THE PIGLET (right): a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail, a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, two SMALL opaque pale-blue bee wings that never grow bigger. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. Never human hands, never standing on two legs.

    EYES: simple sticker eyes only — closed curves, squeezed > < lines, or round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight). No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.4 second, the start frame: the piglet stands blank next to the sleeping puppy.
    2. Still asleep, the puppy lets the ear on her face slide back down to the right side of her head, showing her closed sleepy eyes again, and her huge nose bubble slowly shrinks back to small (it never pops). Her ribbon ear never moves.
    3. The piglet shakes off the sweat drop, flaps his small wings, hops straight up and rises into the air to hover at the upper right next to her head. He never leans on, touches or overlaps the puppy — he always stays a little apart from her.
    4. He takes a huge breath: cheeks puff up round, eyes squeeze shut, ready to try again.
    5. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash, no bed, no pillow. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters.

    Earlier attempts failed: the start pose was held far too long, the piglet leaned into the puppy so their outlines overlapped, the puppy seemed to have FOUR ears, fur turned into a shapeless clump, and extra legs appeared. None of that here.

받기: `kling14-wake-3.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록**(그림자·바닥·이불·베개·빛 번짐 없음) |
| C2 | **크기 그대로** — 두 캐릭터 머리 크기가 모든 프레임에서 같다. 화면 전체가 커지면(확대) 탈락 |
| C3 | 끝까지 화면 안(귀·더듬이 끝·날개·발 안 잘림) |
| C4 | 눈은 감은 선·`> <`·점눈(하이라이트 하나)만. 흰자·홍채 테·눈썹·속눈썹·**이·혀**가 한 프레임이라도 나오면 탈락. **꼼이 눈이 뜨이면 탈락** |
| C5 | 영상 1: **순서** — 소리 선(붕붕)이 **먼저** 나오고 그동안 귀는 가만히, **그다음에** 꿀댕이 쪽 귀 하나가 넘어오는지(리본 귀는 그대로). 귀가 넘어갈 때 꿀댕이가 **떨어져 있는지**(닿으면 그 시간 적기) + 콧방울이 커지는지. 영상 2: 꿀댕이가 **내려앉아 멍** + 콧방울 **왕**. 영상 3: 귀가 내려오고 콧방울 작아지고 꿀댕이가 다시 떠오르는지 |
| C6 | **개수** — 꿀댕이 다리 4·귀 2·더듬이 2·날개 2, 꼼이 귀 2·리본 1·콧방울 1. **꼼이 귀는 「귀처럼 보이는 털뭉치」까지 센다** — 3개·4개로 보이는 프레임이 하나라도 있으면 그 시간을 적는다(11차 탈락 원인) |
| C7 | 사람 손·두 발로 서기 없음 |
| C8 | 날개는 늘 작고 불투명 하늘빛. 비치거나 사라지거나 셋이 되면 탈락 |
| C9 | 글자(Z 포함)·다른 캐릭터 없음 |
| C10 | **꼼이 몸이 미끄러지거나 모양이 바뀌지 않는다**(귀·콧방울만 움직임). 두 캐릭터가 **겹치거나** 섞이면 그 시간을 적는다 |
| C11 | `[의견]` "깨우려는데 귀로 덮고 계속 잔다 → 꿀댕이 멍"이 **실제로 읽히는지**, 웃긴지 |

**얼굴만 보지 마라.** 0·0.5·1·1.5·2·2.5·3초 지점마다 두 캐릭터의 얼굴·개수·크기·배경을 다 본다.

## 받기 · 보고

세 영상 모두 워터마크 없이 다운로드해서 세션 artifacts 폴더에 저장(탈락이어도). 파일 이름이 겹치면 덮어쓰지 말고 알려 줄 것.

    설정: (모델 이름·모드·길이·화질·소리 — 화면 글자 그대로)
    크레딧: 영상1·2·3 (예상/실제) · 남은 것
    영상1 체크리스트: C1 … C11
    영상2 체크리스트: C1 … C11
    영상3 체크리스트: C1 … C11
    파일: (이름과 저장 위치)

영상마다 0·0.5·1·1.5·2·2.5·3초 스크린샷 7장. 영상 1은 귀가 얼굴로 넘어오는 순간, 영상 2는 콧방울이 가장 클 때 한 장씩 더.

## 마무리 (꼭 답할 것)

1. 12차와 비교해 **"꼼이가 스스로 귀를 덮었다"로 읽히는지**(꿀댕이가 해 준 것처럼 보이지 않는지) 한 줄.
2. 탈락이면 가장 큰 원인 하나와 다음에 바꿀 것(`[의견]`).
