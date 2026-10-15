# Aside 의뢰서 — Kling 9차: 꿀댕이 「꽃 줄게」

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보내는 첫 의뢰서야. Teo가 그림 세 장을 보고 "보내"라고 했을 때만 보낸다.
> - **생성은 영상마다 딱 1번, 모두 3번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 30.** 결제·충전·구독 변경 금지는 전과 같다.
> - 그림 세 장은 첨부 폴더에 있다. `art/kkuldaeng/flower/`에도 같은 파일이 있다.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

---

## 7·8차에서 배운 것
- Kling은 시작 장면을 숫자로 박아도 1초 넘게 끈다 → 꼼모닝이 편집에서 자르니 괜찮다. 대신 **중간 동작(휘어짐·착지)이 뭉개지지 않는 게** 더 중요하다.
- 빠른 동작 순간에 다리가 사람 팔처럼 쫙 펴지는 프레임이 끼었다 → 다리 4개·발굽 유지 강조.

## 이야기 (끝이 처음으로 돌아가 반복)

| 그림 | 장면 |
|---|---|
| `kling10-1-fly.png` | ① 꿀댕이가 날개 붕붕 공중에 떠서, 왼쪽에 꼿꼿이 선 분홍 코스모스 꼭대기를 노린다 |
| `kling10-2-bend.png` | ② 꽃 위에 앉았는데 **너무 무거워서** 갈색 줄기가 고개 숙이듯 휘어 꽃과 꿀댕이가 바닥까지 내려앉음. "어?" 얼굴, 꽃잎 날림 |
| `kling10-3-give.png` | ③ 바닥에 서서 꺾인 꽃을 입에 물고 화면 쪽으로 내밂, 볼 빨개짐, 꽃잎(하나는 하트) |

꽃 줄기는 **갈색**(초록 배경을 빼면 초록은 사라지므로). 영상 셋: **①→②, ②→③, ③→①.**

## 너의 역할 · 🚨 절대 금지

전과 같다. Kling을 대신 조작하는 꼼꼼한 작업자. 결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 세 장 말고 다른 그림 올리지 않기, **생성 버튼은 영상마다 딱 1번**(하나가 나빠도 나머지는 1번씩).

## 설정 (세 영상 같음)

| 항목 | 값 |
|---|---|
| 기능 | VIDEO 3.0, 시작 그림 + **Add an end frame** |
| 길이 | **3s** (5s로 떠 있으면 3s로) |
| 화질 | **720p** |
| 소리(Native audio) | **끔** |
| 비율 | 1:1 (고를 수 있으면) |

예상 크레딧을 누르기 전에 적어 두고, 30을 넘으면 멈춰서 보고한다.

---

## 영상 1 — 시작 `kling10-1-fly.png`, 끝 `kling10-2-bend.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE sweet funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the character or the flower and do not invent a third look.

    The character: a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail. He wears a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, and two small opaque pale-blue bee wings on his back. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. He moves like a real piglet: never human hands, never standing on two legs.

    THE FLOWER: one pink cosmos flower (eight rounded pink petals, honey-yellow center) on a thin caramel-brown stem, no leaves, its stem planted in the ground on the left. The flower head keeps the same size in every frame. Nothing is ever green.

    EYES: simple sticker eyes only — round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight) or closed happy curves. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.5 second, the start frame: he hovers, his little wings buzzing very fast, eyeing the top of the flower.
    2. He flutters over and lands on top of the flower head, lying across it on his tummy.
    3. The moment he lands, the thin stem cannot hold him: it bends over in one smooth droop, like a head nodding down, and the flower head with him on it sinks all the way down to just above the ground. His eyes go round, "uh oh?", his ears fling up, and a few pink petals pop off and float up.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no grass, no shadow, no glow, no gradient, no flash. The camera never moves: no zoom, no pan, no shake. Nothing leaves the frame. No text.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, the face was redrawn with human eyes, and extra legs appeared. None of that here.

받기: `kling10-flower-1.mp4`

## 영상 2 — 시작 `kling10-2-bend.png`, 끝 `kling10-3-give.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE sweet funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the character or the flower and do not invent a third look.

    The character: a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail. He wears a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, and two small opaque pale-blue bee wings on his back. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. He moves like a real piglet: never human hands, never standing on two legs.

    THE FLOWER: one pink cosmos flower (eight rounded pink petals, honey-yellow center) on a thin caramel-brown stem, no leaves, its stem planted in the ground on the left. The flower head keeps the same size in every frame. Nothing is ever green.

    EYES: simple sticker eyes only — round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight) or closed happy curves. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.5 second, the start frame: he lies on the drooped flower, blinking in surprise, petals floating.
    2. He hops off onto the ground on all four legs, turns to the flower, and gently bites the stem; it snaps off with a tiny bounce.
    3. He turns to face the viewer holding the flower in his mouth, blushing, eyes closing into a shy happy smile, offering it: "for you". The floating petals drift down slowly, one of them shaped like a little heart.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no grass, no shadow, no glow, no gradient, no flash. The camera never moves: no zoom, no pan, no shake. Nothing leaves the frame. No text.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, the face was redrawn with human eyes, and extra legs appeared. None of that here.

받기: `kling10-flower-2.mp4`

## 영상 3 — 시작 `kling10-3-give.png`, 끝 `kling10-1-fly.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE sweet funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the character or the flower and do not invent a third look.

    The character: a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail. He wears a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, and two small opaque pale-blue bee wings on his back. EXACTLY FOUR LEGS, EXACTLY TWO EARS, EXACTLY TWO ANTENNAE and EXACTLY TWO WINGS in every frame. He moves like a real piglet: never human hands, never standing on two legs.

    THE FLOWER: one pink cosmos flower (eight rounded pink petals, honey-yellow center) on a thin caramel-brown stem, no leaves, its stem planted in the ground on the left. The flower head keeps the same size in every frame. Nothing is ever green.

    EYES: simple sticker eyes only — round dot eyes (each ONE solid flat dark brown shape with EXACTLY ONE small white highlight) or closed happy curves. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.6 second, the start frame: he holds the flower in his mouth, shyly offering it, swaying a little.
    2. He turns and plants the flower back into the ground on the left; it springs back up straight with a little wobble, as good as new.
    3. He flutters up into the air beside it, wings buzzing, and eyes the top of the flower again, ready to try once more.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no grass, no shadow, no glow, no gradient, no flash. The camera never moves: no zoom, no pan, no shake. Nothing leaves the frame. No text.

    Earlier attempts failed: the start pose was held far too long, legs flung out like human arms during a fast move, the face was redrawn with human eyes, and extra legs appeared. None of that here.

받기: `kling10-flower-3.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록**(그림자·바닥·먼지·빛 번짐·연기 없음) |
| C2 | **크기 그대로** — 머리 크기가 모든 프레임에서 같다. 화면 전체가 커지면(확대) 탈락. 뛰어오른 자리와 떨어진 자리가 같다 |
| C3 | 끝까지 화면 안(귀·더듬이 끝·날개·발 안 잘림) |
| C4 | 눈은 `> <`·웃는 선·점눈(하이라이트 하나)만. 흰자·홍채 테·눈썹·속눈썹·**이**가 한 프레임이라도 나오면 탈락(웃는 입 안 분홍은 괜찮음) |
| C5 | 영상 1: 앉는 순간 줄기가 **한 번에 푹 휘어** 내려앉는지(천천히 녹듯 내려오면 부분). 영상 3: 꽃이 다시 꼿꼿이 서는지 |
| C6 | **개수** — 다리 4·귀 2·더듬이 2·날개 2. 착지·휘어짐(영상 1)·꽃 무는 순간(영상 2)·날아오르는 순간(영상 3)은 **한 프레임씩** 센다 |
| C7 | 사람 손·두 발로 서기 없음 |
| C8 | 날개는 늘 불투명 하늘빛. 비치거나 사라지거나 셋이 되면 탈락 |
| C9 | 글자·다른 캐릭터 없음 |
| C10 | `[의견]` "너무 무거워서 꽃이 푹 숙임"(영상 1)과 "꽃 줄게"(영상 2)가 **실제로 읽히는지**, 예쁜지 |
| C11 | **꽃** — 꽃 머리 크기가 그대로이고, 줄기는 늘 갈색, 초록 잎·풀이 생기지 않는다 |

**얼굴만 보지 마라.** 0·0.5·1·1.5·2·2.5·3초 지점마다 얼굴·개수·크기·배경을 다 본다.

## 받기 · 보고

세 영상 모두 워터마크 없이 다운로드해서 세션 artifacts 폴더에 저장(탈락이어도). 파일 이름이 겹치면 덮어쓰지 말고 알려 줄 것.

    설정: (모델 이름·모드·길이·화질·소리 — 화면 글자 그대로)
    크레딧: 영상1·2·3 (예상/실제) · 남은 것
    영상1 체크리스트: C1 … C11
    영상2 체크리스트: C1 … C11
    영상3 체크리스트: C1 … C11
    파일: (이름과 저장 위치)

영상마다 0·0.5·1·1.5·2·2.5·3초 스크린샷 7장. 영상 1은 줄기가 휘는 순간, 영상 2는 꽃 무는 순간 한 장씩 더.

## 마무리 (꼭 답할 것)

1. 8차(ㅋㅋㅋ)와 비교해 **더 예쁘고 웃긴지** 한 줄.
2. 탈락이면 가장 큰 원인 하나와 다음에 바꿀 것(`[의견]`).
