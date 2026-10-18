# Aside 의뢰서 — Kling 15차: 꼼이 「퇴근!」

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 키프레임 세 장을 보고 "보내"라고 했다(2026-10-19).
> - **생성은 영상마다 딱 1번, 모두 2번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 30.** 결제·충전·구독 변경 금지.
> - 그림 세 장은 이 대화의 **첨부 폴더(attachments)**에 있다: `tg1-tired.png` `tg2-ding.png` `tg3-fly.png`.
> - **영상 2개를 다 만들면 먼저 다운로드해서 artifacts에 저장하고**, 그다음 검수한다.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

---

## 이야기

꼼이가 축 처져 있다가 6시 「땡!」에 두 귀가 날개처럼 솟고, 귀를 퍼덕이며 날아서 퇴근한다. 웃음 포인트는 **귀가 날개처럼 팔랑팔랑 퍼덕이는 것.**

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

## 영상 1 — 시작 `tg1-tired.png`, 끝 `tg2-ding.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the character and do not invent a third look. The camera never moves.

    THE CHARACTER — KKOM: a fluffy cream-white maltipoo puppy with two big floppy curly ears, ONE small pink ribbon at the base of the ear on the viewer's LEFT, round pink paw pads. EXACTLY TWO EARS, ONE ribbon and FOUR LEGS in every frame. Real puppy anatomy: paws, never human hands, never standing like a person.
    THE PROP: one small round pastel-pink twin-bell alarm clock standing on the invisible ground at the lower right. It stays in exactly the same place and size the whole time. Its face has tick marks only, no numbers.

    EYES: simple sticker eyes only — tired flat lines, closed happy curves, or round dot eyes (each ONE solid flat dark brown shape with ONE small white highlight). No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.6 second, the start frame: Kkom sits slumped and drained, ears drooping, eyes half-closed, letting out a tiny sigh. The clock ticks quietly.
    2. At about 0.8 second the clock rings "ding!": it shakes in place with short motion lines and two tiny yellow sparkles pop around its bells.
    3. Instantly Kkom snaps bolt upright: her eyes pop wide open into round sparkly dot eyes, and BOTH ears shoot straight up and out like wings with a big fluffy whoosh — this is the funny part, make the ears fly up fast and big.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no numbers.

    Earlier attempts failed: the start pose was held far too long, ears split into extra lumps so there seemed to be three or four ears, legs flung out like human arms, faces were redrawn with human eyes, and props melted or changed size. None of that here.

받기: `kling16-offwork-1.mp4`

## 영상 2 — 시작 `tg2-ding.png`, 끝 `tg3-fly.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE funny moment, already drawn in the same style. Animate BETWEEN them. Do not redesign the character and do not invent a third look. The camera never moves.

    THE CHARACTER — KKOM: a fluffy cream-white maltipoo puppy with two big floppy curly ears, ONE small pink ribbon at the base of the ear on the viewer's LEFT, round pink paw pads. EXACTLY TWO EARS, ONE ribbon and FOUR LEGS in every frame. Real puppy anatomy: paws, never human hands, never standing like a person.
    THE PROP: one small round pastel-pink twin-bell alarm clock standing on the invisible ground at the lower right. It stays in exactly the same place and size the whole time. Its face has tick marks only, no numbers.

    EYES: simple sticker eyes only — tired flat lines, closed happy curves, or round dot eyes (each ONE solid flat dark brown shape with ONE small white highlight). No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.3 second, the start frame: Kkom sits upright with both ears spread up like wings; the clock is still ringing.
    2. She starts flapping her two big ears like bird wings — FAST, big, flappy, fluffy flaps, many times — and lifts off the ground.
    3. Still flapping her ears hard, she flies up and away to the upper right, happy, eyes closed in happy curves, small open happy mouth, paws tucked, a few short motion lines behind her. Her body stays the same size; she does not shrink into the distance.
    4. The clock stays alone on the ground at the lower right, exactly where it was.
    5. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no numbers.

    Earlier attempts failed: the start pose was held far too long, ears split into extra lumps so there seemed to be three or four ears, legs flung out like human arms, faces were redrawn with human eyes, and props melted or changed size. None of that here.

받기: `kling16-offwork-2.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록** |
| C2 | 꼼이 머리 크기가 모든 프레임에서 같다(멀어지며 작아지지 않음). 확대·카메라 이동이면 탈락 |
| C3 | 끝까지 화면 안(귀 끝·발 안 잘림) |
| C4 | 눈은 지친 선·웃는 선·점눈만. 흰자·눈썹·속눈썹·**이·혀** 나오면 탈락 |
| C5 | 영상1: 「땡!」 뒤 **두 귀가 빠르고 크게 솟는지**. 영상2: **귀를 날개처럼 여러 번 퍼덕이며** 날아가는지 |
| C6 | **개수** — 귀 2·리본 1·다리 4. 귀가 움직이는 순간은 한 프레임씩 센다(귀 같은 털뭉치까지) |
| C7 | 사람 손·두 발로 서기 없음 |
| C8 | 시계가 **같은 자리·같은 크기**로 남는지, 녹거나 모양이 바뀌지 않는지 |
| C9 | 글자·숫자·다른 캐릭터 없음 |
| C10 | `[의견]` "퇴근 땡 → 귀 날개로 날아감"이 읽히는지, 웃긴지 |

## 받기 · 보고

두 영상 모두 워터마크 없이 다운로드해서 세션 artifacts 폴더에 저장(탈락이어도).

    설정: (화면 글자 그대로)
    크레딧: 영상1·2 (예상/실제) · 남은 것
    영상1·2 체크리스트: C1 … C10
    파일: (이름과 저장 위치)

## 마무리 (꼭 답할 것)

1. 귀 퍼덕임이 충분히 크고 웃긴지 한 줄.
2. 탈락이면 가장 큰 원인과 다음에 바꿀 것(`[의견]`).
