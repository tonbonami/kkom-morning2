# Aside 의뢰서 — Kling 10차: 꿀댕이 「안아줘」

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 그림 세 장을 보고 "보내"라고 했을 때만.
> - **생성은 영상마다 딱 1번, 모두 3번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 30.** 결제·충전·구독 변경 금지.
> - 그림 세 장은 첨부 폴더에 있다. `art/kkuldaeng/hug/`에도 같은 파일이 있다.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

---

## 9차에서 배운 것
- Kling 화면 기본값이 **Kling 4.0 · Omni reference · 1080p · 10s**로 바뀌어 있었다 → 입력 방식 **Keyframes**, 모델 **Kling 3.0**, 720p, 3s, 소리 끔으로 맞춘다(9차와 같게).
- 캐릭터가 한쪽에 치우치면 움직일 때 가장자리에 닿는다 → 이번엔 세 장 모두 **가운데 같은 자리에 서 있다.**

## 이야기 (끝이 처음으로 돌아가 반복)

| 그림 | 장면 |
|---|---|
| `kling11-1-ready.png` | ① "안아 줄게!" — 화면을 보고 신나서 몸을 앞으로, 날개는 접혀 있음 |
| `kling11-2-tiny.png` | ② 날개를 양옆으로 쫙 폈는데 **귀만큼 작다** — 자기 날개를 흘끗 보며 머쓱, 식은땀 한 방울 |
| `kling11-3-tail.png` | ③ 대신 뒤돌아 **꼬불 꼬리를 하트로** 말고, 어깨 너머로 수줍게 웃음. 꼬리 위에 작은 하트 |

영상 셋: **①→②, ②→③, ③→①.**

## 너의 역할 · 🚨 절대 금지

전과 같다. 결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 세 장 말고 다른 그림 올리지 않기, **생성 버튼은 영상마다 딱 1번**.

## 설정 (세 영상 같음)

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

## 영상 1 — 시작 `kling11-1-ready.png`, 끝 `kling11-2-tiny.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE sweet funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the character and do not invent a third look. He stays standing on the same spot in the center the whole time.

    The character: a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail. He wears a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, and two small opaque pale-blue bee wings on his back. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. He moves like a real piglet: never human hands, never standing on two legs.

    HIS WINGS are two SMALL opaque pale-blue bee wings and they STAY SMALL in every frame — never grow bigger. That is the joke.

    EYES: simple sticker eyes only — round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight) or closed happy curves. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.4 second, the start frame: he bounces once on his front legs, excited, "I'll hug you!".
    2. He takes a big breath and puffs out his chest, then snaps his two little wings straight out to the sides as wide as they can go, trembling with effort, like arms opening for a big hug.
    3. He notices how tiny they are: his eyes slide to look at one wing, his smile turns awkward, and a small opaque pale-blue sweat drop appears beside his head.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. The camera never moves: no zoom, no pan, no shake. Nothing leaves the frame. No text.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, the face was redrawn with human eyes, an ear split into two lumps, and extra legs appeared. None of that here.

받기: `kling11-hug-1.mp4`

## 영상 2 — 시작 `kling11-2-tiny.png`, 끝 `kling11-3-tail.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE sweet funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the character and do not invent a third look. He stays standing on the same spot in the center the whole time.

    The character: a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail. He wears a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, and two small opaque pale-blue bee wings on his back. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. He moves like a real piglet: never human hands, never standing on two legs.

    HIS WINGS are two SMALL opaque pale-blue bee wings and they STAY SMALL in every frame — never grow bigger. That is the joke.

    EYES: simple sticker eyes only — round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight) or closed happy curves. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.4 second, the start frame: awkward, wings still stretched out, sweat drop.
    2. He folds his wings back, gets an idea, and turns his body around so his round rump faces the viewer, looking back over his shoulder.
    3. His curly pink tail wiggles and curls itself into a clear little heart shape, and a small pink heart pops up above it. He smiles shyly with closed happy eyes, cheeks blushing.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. The camera never moves: no zoom, no pan, no shake. Nothing leaves the frame. No text.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, the face was redrawn with human eyes, an ear split into two lumps, and extra legs appeared. None of that here.

받기: `kling11-hug-2.mp4`

## 영상 3 — 시작 `kling11-3-tail.png`, 끝 `kling11-1-ready.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE sweet funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the character and do not invent a third look. He stays standing on the same spot in the center the whole time.

    The character: a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail. He wears a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, and two small opaque pale-blue bee wings on his back. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. He moves like a real piglet: never human hands, never standing on two legs.

    HIS WINGS are two SMALL opaque pale-blue bee wings and they STAY SMALL in every frame — never grow bigger. That is the joke.

    EYES: simple sticker eyes only — round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight) or closed happy curves. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.6 second, the start frame: he wiggles his rump a little so the heart-shaped tail sways; the small heart floats up and fades.
    2. His tail uncurls back into a normal curl and he turns around to face the viewer again.
    3. He leans forward eagerly with sparkling eyes and a big happy smile, ready to try the hug again, wings folded.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. The camera never moves: no zoom, no pan, no shake. Nothing leaves the frame. No text.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, the face was redrawn with human eyes, an ear split into two lumps, and extra legs appeared. None of that here.

받기: `kling11-hug-3.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록**(그림자·바닥·먼지·빛 번짐·연기 없음) |
| C2 | **크기 그대로** — 머리 크기가 모든 프레임에서 같다. 화면 전체가 커지면(확대) 탈락. 뛰어오른 자리와 떨어진 자리가 같다 |
| C3 | 끝까지 화면 안(귀·더듬이 끝·날개·발 안 잘림) |
| C4 | 눈은 `> <`·웃는 선·점눈(하이라이트 하나)만. 흰자·홍채 테·눈썹·속눈썹·**이**가 한 프레임이라도 나오면 탈락(웃는 입 안 분홍은 괜찮음) |
| C5 | 영상 1: 날개를 **쫙** 펴는 순간이 또렷한지. 영상 2: 돌아서며 꼬리가 **하트 모양**으로 말리는지 |
| C6 | **개수** — 다리 4·귀 2·더듬이 2·날개 2. 날개 펴는 순간(영상 1)·돌아서는 순간(영상 2·3)은 **한 프레임씩** 센다 |
| C7 | 사람 손·두 발로 서기 없음 |
| C8 | 날개는 늘 불투명 하늘빛. 비치거나 사라지거나 셋이 되면 탈락 |
| C9 | 글자·다른 캐릭터 없음 |
| C10 | `[의견]` "안아 주려는데 날개가 작아"(영상 1)와 "대신 꼬리 하트"(영상 2)가 **실제로 읽히는지**, 귀여운지 |
| C11 | **날개** — 끝까지 작고 불투명 하늘빛. 커지거나 비치면 탈락. 꼬리는 하나 |

**얼굴만 보지 마라.** 0·0.5·1·1.5·2·2.5·3초 지점마다 얼굴·개수·크기·배경을 다 본다.

## 받기 · 보고

세 영상 모두 워터마크 없이 다운로드해서 세션 artifacts 폴더에 저장(탈락이어도). 파일 이름이 겹치면 덮어쓰지 말고 알려 줄 것.

    설정: (모델 이름·모드·길이·화질·소리 — 화면 글자 그대로)
    크레딧: 영상1·2·3 (예상/실제) · 남은 것
    영상1 체크리스트: C1 … C11
    영상2 체크리스트: C1 … C11
    영상3 체크리스트: C1 … C11
    파일: (이름과 저장 위치)

영상마다 0·0.5·1·1.5·2·2.5·3초 스크린샷 7장. 영상 1은 날개 쫙 펴는 순간, 영상 2는 꼬리 하트 순간 한 장씩 더.

## 마무리 (꼭 답할 것)

1. 9차(꽃 줄게)와 비교해 **더 귀엽고 웃긴지** 한 줄.
2. 탈락이면 가장 큰 원인 하나와 다음에 바꿀 것(`[의견]`).
