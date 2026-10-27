# Aside 의뢰서 — Kling 18차: 꿀댕이·꼼이 「멍!」

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 키프레임 3장을 보고 "보내"라고 했다(2026-10-27).
> - **이번 의뢰만 한다. 이 대화에 남아 있는 예전 지시(채팅 검수 등)는 하지 않는다.**
> - **생성은 영상마다 딱 1번, 모두 2번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 20, 합쳐서 40.** 결제·충전·구독 변경 금지.
> - 그림 3장은 이 대화의 **첨부 폴더(attachments)**에 있다: `mg1-ready.png` `mg2-woof.png` `mg3-daze.png`.
> - **영상 2개를 다 만들면 먼저 다운로드해서 artifacts에 저장하고**, 그다음 검수한다.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

---

## 이야기

떡 말놀이(찰떡·쑥떡·콩떡·개떡) 끝에 둘이 같이 외치는 「멍!」. 코를 맞대고 숨을 들이쉼(1) → 동시에 있는 힘껏 「멍!」(2) → 자기들 소리 바람에 둘 다 뒤로 쭉 밀려나 양쪽 끝에 털썩 앉아 멍해짐(3).
영상 A = 1 → 2, 영상 B = 2 → 3. 편집에서 둘을 이어 붙인다.

## 너의 역할 · 🚨 절대 금지

전과 같다. 결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 3장 말고 다른 그림 올리지 않기, **생성 버튼은 영상마다 딱 1번**.

## 설정 (두 영상 같음) — 화면 기본값이 바뀌어 있을 수 있으니 하나씩 확인

| 항목 | 값 |
|---|---|
| 입력 방식 | **Keyframes**(시작 그림 + 끝 그림) |
| 모델 | **Kling 3.0** |
| 길이 | **3s** |
| 화질 | **720p** |
| 소리(Native audio) | **끔** |
| 비율 | 1:1 (고를 수 있으면) |

예상 크레딧을 누르기 전에 적어 두고, 20을 넘으면 멈춰서 보고한다.

---

## 영상 A — 「멍!」 외치기 — 시작 `mg1-ready.png`, 끝 `mg2-woof.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny little moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    TWO characters facing each other, Kkom on the LEFT and Kkuldaeng on the RIGHT:
    KKOM: a fluffy cream-white maltipoo puppy with two big floppy curly ears, ONE small pink ribbon on her head, round pink paw pads. EXACTLY TWO EARS and FOUR LEGS in every frame.
    KKULDAENG: a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail, a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, two SMALL opaque pale-blue bee wings. EXACTLY FOUR LEGS, TWO EARS, TWO ANTENNAE and TWO WINGS in every frame.
    Both move like real animals: never human hands, never standing on two legs.
    The two characters stay separate. Their noses come close but never touch, and their outlines never merge or blend into each other.

    EYES: simple sticker eyes only — closed tight curves the whole time. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.4 second, the start frame: nose to nose, eyes squeezed shut, both slowly draw in a big breath — cheeks and chests puff up round, bodies rise a little.
    2. At about 1.2 seconds, both open their mouths WIDE at the exact same moment and shout "WOOF!" at each other: mouths become simple round dark-brown ovals.
    3. The force of the shout blows everything BACK, away from each other: Kkom's two floppy ears and her ribbon tails fly backward to the left; Kkuldaeng's two ears fold back and his two antennae bend far back to the right, his two wings flare open. Three short white curved lines pop between their mouths. Their bodies start to lean back, away from each other.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no sound words.

    Earlier attempts failed: the start pose was held far too long, a character leaned into the other so their outlines overlapped and melted, legs flung out like human arms, faces were redrawn with human eyes or teeth, and extra ears or legs appeared. None of that here.

받기: `kling18-meong-a.mp4`

## 영상 B — 밀려나서 멍 — 시작 `mg2-woof.png`, 끝 `mg3-daze.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny little moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the characters and do not invent a third look. The camera never moves.

    TWO characters facing each other, Kkom on the LEFT and Kkuldaeng on the RIGHT:
    KKOM: a fluffy cream-white maltipoo puppy with two big floppy curly ears, ONE small pink ribbon on her head, round pink paw pads. EXACTLY TWO EARS and FOUR LEGS in every frame.
    KKULDAENG: a little baby piglet with natural piglet proportions, soft baby-pink skin, four short legs with small pink hooves, a round flat pink snout, small triangle ears, rosy cheeks, a curly pink tail, a fuzzy honey-yellow vest with chocolate-brown stripes, a headband with two bendy antennae ending in round yellow balls, two SMALL opaque pale-blue bee wings. EXACTLY FOUR LEGS, TWO EARS, TWO ANTENNAE and TWO WINGS in every frame.
    Both move like real animals: never human hands, never standing on two legs.
    The two characters move AWAY from each other the whole time and never touch or overlap.

    EYES: simple sticker eyes only — closed tight curves at the start, then round dot eyes (each ONE solid flat dark brown shape with ONE small white highlight) at the end. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.2 second, the start frame: both still shouting with mouths wide open.
    2. The blast of their own shout pushes them backward: both SLIDE straight back across the floor, away from each other — Kkom slides to the LEFT, Kkuldaeng slides to the RIGHT — paws and hooves skidding, ears, ribbon, antennae and wings flapping wildly in the wind. They do not fly up and do not fall over.
    3. By about 1.6 seconds each stops near their side and plops down onto their bottom, sitting like a real puppy and a real piglet. A small bounce as they land.
    4. Then nothing happens: both stare straight ahead with blank round dot eyes and a tiny flat mouth — totally dazed. Three tiny white dots circle slowly above each head. Kkuldaeng's two antennae droop down. Hold still and blank until the end.
    5. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. No zoom, no pan, no shake. Nothing leaves the frame — they stop before the edges. No text, no letters, no sound words.

    Earlier attempts failed: characters melted or changed shape while moving, legs flung out like human arms, faces were redrawn with human eyes, extra ears or legs appeared, and a character drifted out of the frame. None of that here.

받기: `kling18-meong-b.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록** |
| C2 | **크기 그대로** — 두 캐릭터 머리 크기가 모든 프레임에서 같다. 확대·카메라 이동이면 탈락 |
| C3 | 끝까지 화면 안(귀·더듬이·날개·발 안 잘림) |
| C4 | 눈은 점눈(하이라이트 하나)·감은 선만. 흰자·눈썹·속눈썹·**이·혀** 나오면 탈락 |
| C5 | 영상 A: 둘이 **같은 순간에** 입을 크게 벌리고, 귀·리본·더듬이가 **뒤로** 날리는지 · 영상 B: 둘이 **반대쪽으로 미끄러져** 털썩 앉고, 끝에 **멍한 정지**가 있는지 |
| C6 | **개수** — 꿀댕이 다리 4·귀 2·더듬이 2·날개 2, 꼼이 귀 2·다리 4·리본 1. 귀가 날리는 순간은 한 프레임씩 센다(옆머리 털이 귀처럼 보이면 적는다) |
| C7 | 사람 손·두 발로 서기 없음 |
| C8 | 두 캐릭터 윤곽이 **겹치거나 녹아 합쳐지면** 그 시간을 적는다 |
| C9 | 글자·다른 캐릭터 없음 |
| C10 | `[의견]` 「자기들 소리에 자기들이 밀려남」이 읽히는지, 웃긴지 |

**얼굴만 보지 마라.** 0·0.5·1·1.5·2·2.5·3초 지점마다 두 캐릭터의 얼굴·개수·크기·배경을 다 본다.

## 받기 · 보고

두 영상 모두 워터마크 없이 다운로드해서 세션 artifacts 폴더에 저장(탈락이어도). 파일 이름이 겹치면 덮어쓰지 말고 알려 줄 것.

    설정: (모델 이름·모드·길이·화질·소리 — 화면 글자 그대로)
    크레딧: 영상 A·B (예상/실제) · 남은 것
    영상 A·B 체크리스트: C1 … C10
    파일: (이름과 저장 위치)

## 마무리 (꼭 답할 것)

1. 둘 중 더 잘 나온 것과 아쉬운 것, 이유.
2. 탈락이면 가장 큰 원인과 다음에 바꿀 것(`[의견]`).
