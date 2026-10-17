# Aside 의뢰서 — Kling 11차: 꿀댕이·꼼이 「일어나!」

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 키프레임 세 장을 보고 진행하라고 했다(2026-10-18).
> - **생성은 영상마다 딱 1번, 모두 3번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 30.** 결제·충전·구독 변경 금지.
> - 그림 세 장은 이 대화의 **첨부 폴더(attachments)**에 있다: `kling12-1-breath.png`, `kling12-2-buzz.png`, `kling12-3-blank.png`.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

---

## 이야기 — 이번엔 캐릭터가 둘이다 (끝이 처음으로 돌아가 반복)

| 그림 | 장면 |
|---|---|
| `kling12-1-breath.png` | ① 꼼이(흰 말티푸)가 엎드려 콧방울 달고 잔다. 꿀댕이(꿀벌옷 아기돼지)가 옆에 떠서 **볼 빵빵하게 숨을 참는다** |
| `kling12-2-buzz.png` | ② 꿀댕이가 날개를 **붕붕붕** 떤다(소리 선). 꼼이는 눈도 안 뜨고 **자기 두 귀를 얼굴 위로 덮는다**(이불처럼) |
| `kling12-3-blank.png` | ③ 꿀댕이가 옆에 내려앉아 **멍** — 점 눈·식은땀. 꼼이는 귀 이불 속에서 쿨쿨, 콧방울이 더 커짐 |

영상 셋: **①→②, ②→③, ③→①.** 웃음 포인트는 ②에서 **양옆에 늘어진 귀가 들려 얼굴로 넘어오는 순간**이다.

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

## 영상 1 — 시작 `kling12-1-breath.png`, 끝 `kling12-2-buzz.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    TWO characters:
    THE SLEEPING PUPPY (left): a fluffy cream-white maltipoo with big floppy curly ears, a small pink ribbon, round pink paw pads, lying on her belly with her chin on her front paws, a small pale-blue nose bubble. She STAYS ASLEEP the whole time and her eyes never open. Her body, paws and position never move or slide — only her ears move. EXACTLY TWO EARS and ONE ribbon in every frame.
    THE FLYING PIGLET (right): a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail, a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, two SMALL opaque pale-blue bee wings that never grow bigger. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. Never human hands, never standing on two legs.

    EYES: simple sticker eyes only — closed curves, squeezed > < lines, or round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight). No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.4 second, the start frame: the piglet hovers next to the puppy's head holding a huge breath, cheeks puffed round, eyes squeezed shut.
    2. He leans toward her ear and buzzes his two small wings as fast as he can: the wings become a blur and little curved sound-wave arcs pulse out toward her head.
    3. The puppy does not wake up. Still asleep, she slowly lifts BOTH of her big floppy ears up from the sides of her head and folds them over her own face, like pulling a blanket over her head, until her eyes are hidden under her ear fur. The ears must clearly travel from the sides, up, and over the face. Her body and paws stay still.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash, no bed, no pillow. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, faces were redrawn with human eyes, an ear split into two lumps, and extra legs appeared. None of that here.

받기: `kling12-wake-1.mp4`

## 영상 2 — 시작 `kling12-2-buzz.png`, 끝 `kling12-3-blank.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    TWO characters:
    THE SLEEPING PUPPY (left): a fluffy cream-white maltipoo with big floppy curly ears folded over her face like a blanket, a small pink ribbon, round pink paw pads, lying on her belly with her chin on her front paws, a pale-blue nose bubble. She STAYS ASLEEP the whole time and her eyes stay hidden under her ears. Her body, paws and position never move or slide. EXACTLY TWO EARS and ONE ribbon in every frame.
    THE FLYING PIGLET (right): a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail, a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, two SMALL opaque pale-blue bee wings that never grow bigger. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. Never human hands, never standing on two legs.

    EYES: simple sticker eyes only — closed curves or round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight). No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.3 second, the start frame: the piglet is still buzzing his wings at her.
    2. He notices she is not waking up. His wings slow down and stop, and he sinks gently down and lands on all four legs on the ground just to the right of the puppy.
    3. He stares at her completely blank: round dot eyes, a tiny straight mouth, a small pale-blue sweat drop appears beside his head, one antenna droops.
    4. Meanwhile the puppy keeps sleeping peacefully under her ear-blanket and her nose bubble slowly grows a little bigger.
    5. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash, no bed, no pillow. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, faces were redrawn with human eyes, an ear split into two lumps, and extra legs appeared. None of that here.

받기: `kling12-wake-2.mp4`

## 영상 3 — 시작 `kling12-3-blank.png`, 끝 `kling12-1-breath.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    TWO characters:
    THE SLEEPING PUPPY (left): a fluffy cream-white maltipoo with big floppy curly ears, a small pink ribbon, round pink paw pads, lying on her belly with her chin on her front paws, a pale-blue nose bubble. She STAYS ASLEEP the whole time and her eyes never open. Her body, paws and position never move or slide — only her ears move. EXACTLY TWO EARS and ONE ribbon in every frame.
    THE PIGLET (right): a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail, a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, two SMALL opaque pale-blue bee wings that never grow bigger. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. Never human hands, never standing on two legs.

    EYES: simple sticker eyes only — closed curves, squeezed > < lines, or round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight). No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.4 second, the start frame: the piglet stands blank next to the sleeping puppy.
    2. Still asleep, the puppy lets her two ears slide back down to the sides of her head, showing her closed sleepy eyes again, and her nose bubble shrinks back to small.
    3. The piglet shakes off the sweat drop, flaps his small wings, hops up and rises into the air to hover at the upper right next to her head.
    4. He takes a huge breath: cheeks puff up round, eyes squeeze shut, ready to try again.
    5. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash, no bed, no pillow. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, faces were redrawn with human eyes, an ear split into two lumps, and extra legs appeared. None of that here.

받기: `kling12-wake-3.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록**(그림자·바닥·이불·베개·빛 번짐 없음) |
| C2 | **크기 그대로** — 두 캐릭터 머리 크기가 모든 프레임에서 같다. 화면 전체가 커지면(확대) 탈락 |
| C3 | 끝까지 화면 안(귀·더듬이 끝·날개·발 안 잘림) |
| C4 | 눈은 감은 선·`> <`·점눈(하이라이트 하나)만. 흰자·홍채 테·눈썹·속눈썹·**이·혀**가 한 프레임이라도 나오면 탈락. **꼼이 눈이 뜨이면 탈락** |
| C5 | 영상 1: 꼼이 귀가 **양옆에서 들려 얼굴 위로 넘어오는** 게 또렷한지. 영상 2: 꿀댕이가 **내려앉아 멍**한지. 영상 3: 귀가 내려오고 꿀댕이가 다시 떠오르는지 |
| C6 | **개수** — 꿀댕이 다리 4·귀 2·더듬이 2·날개 2, 꼼이 귀 2·리본 1·콧방울 1. 귀가 움직이는 순간은 **한 프레임씩** 센다 |
| C7 | 사람 손·두 발로 서기 없음 |
| C8 | 날개는 늘 작고 불투명 하늘빛. 비치거나 사라지거나 셋이 되면 탈락 |
| C9 | 글자(Z 포함)·다른 캐릭터 없음 |
| C10 | **꼼이 몸이 미끄러지거나 움직이지 않는다**(귀만 움직임). 두 캐릭터가 서로 섞이거나 합쳐지면 탈락 |
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

영상마다 0·0.5·1·1.5·2·2.5·3초 스크린샷 7장. 영상 1은 귀가 얼굴로 넘어오는 순간 한 장 더.

## 마무리 (꼭 답할 것)

1. 10차(안아줘)와 비교해 **더 웃긴지** 한 줄.
2. 탈락이면 가장 큰 원인 하나와 다음에 바꿀 것(`[의견]`).
