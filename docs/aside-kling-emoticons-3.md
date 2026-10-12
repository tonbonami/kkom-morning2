# Aside 의뢰서 — Kling 꼼이 움짤 3차: 「힘내!」 (사이담 Flova 연출법으로)

> Teo 먼저 읽기
> - **생성은 딱 1번.** 결과가 나쁘면 다시 돌리지 말고 멈춰서 보고한다.
> - 크레딧 상한: **이번 1회 비용까지만.** 결제·충전·구독 변경 금지는 1·2차와 같다.
> - 그림 두 장은 꼼모닝 세션이 Aside 첨부 폴더에 넣어 둔다(`kling-a-ready.png`, `kling-b-go.png`). `art/kling/expr/`에도 같은 파일이 있다.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

---

## 2차에서 배운 것 (왜 또 바꿨나)

2차는 "얼굴은 하나도 바꾸지 마"라고 묶고, 끝 그림도 시작과 **같은 무표정**으로 줬다. 그래서 앞만 보고 주먹만 불끈 쥐는 어색한 영상이 나왔다. 몸도 찌그러졌다.

사이담이 Flova로 만든 폭죽·흥!은 반대로 했다.
1. **감정이 다른 두 장**을 같은 화풍으로 직접 그려 준다(시작 = 준비, 끝 = 터짐).
2. 영상 모델에겐 **두 그림 사이만** 움직이라고 한다.
3. 동작은 **박자**로 준다: 잠깐 모으기 → 2~3프레임 만에 확 → 길게 머물며 통통.
4. **지난 실패를 문구에 적는다.**

이번엔 그 방식 그대로다. 두 장은 발바닥 위치·크기를 픽셀로 맞춰 놨다(모델이 크기 차이를 확대로 읽지 않게).

| 그림 | 모습 |
|---|---|
| `kling-a-ready.png` (시작) | 두 주먹을 가슴에 꼭 모음, 눈 `> <` 질끈, 입 꾹 — 용기 모으는 중 |
| `kling-b-go.png` (끝) | 한쪽 주먹 번쩍(그림 오른쪽), 다른 주먹은 가슴, 귀 펄럭, 눈 `^ ^`, 입 작게 `o`, 주먹 옆 노란 반짝이 셋 |

둘 다 **발이 정확히 4개**, 뒷발 분홍 발바닥이 같은 자리다.

## 너의 역할

1·2차와 같다. **Kling을 대신 조작하는 꼼꼼한 작업자.** 문구·설정을 그대로 넣고, 체크리스트로 판정하고, 받아서 보고한다.

## 🚨 절대 금지

- 결제·충전·구독 변경 0번. 공개·게시·공유 0번. 다른 작업물 삭제 금지.
- 위 두 그림 말고 다른 그림을 올리지 마라.
- **생성 버튼은 딱 1번.** 결과가 나빠도 다시 누르지 마라.

## 설정

| 항목 | 값 |
|---|---|
| 기능 | VIDEO 3.0, 시작 그림 + **Add an end frame** (2차와 같은 자리) |
| 시작 그림 | `kling-a-ready.png` |
| 끝 그림 | `kling-b-go.png` |
| 길이 | **3s** |
| 화질 | **720p** (사이담 폭죽과 같은 값. 이모티콘은 작게 보여서 충분하다) |
| 소리(Native audio·Sound) | **끔** — 켜져 있으면 초당 크레딧이 1.5배 |
| 비율 | 1:1 (고를 수 있으면) |

생성 버튼 옆에 뜨는 **예상 크레딧 숫자를 누르기 전에 적어 둬라.** 30을 넘으면 누르지 말고 멈춰서 보고한다.

Prompt 칸이 글자 수로 막으면 생성하지 말고 멈춰서 한도 숫자를 적어 보고해라.

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are the two keyframes of ONE movement, already drawn in the same style. Animate BETWEEN them. Do not redesign the puppy and do not invent a third look.

    The puppy: cream-white curly poodle, softly painted fur, no outline, a coral ribbon on one ear, a small dark brown button nose, pink cheeks. She sits with her back legs splayed so the tummy and the pink paw pads face us. EXACTLY FOUR LEGS in every frame: two back legs that never move, and two front paws, which are the only limbs that move.

    EYES: closed in every frame. At the start, two squeezed "> <" lines. At the end, two happy "^ ^" curves. They never open. No eye whites, no iris, no eyebrows, no realistic eyes.

    THE MOTION, "you can do it!", ONCE:
    1. Hold the start frame for about 0.5 second: both fists pressed to her chest, eyes squeezed, gathering courage, body dipping down a tiny bit.
    2. THE PUNCH: in only two or three frames she throws the fist on the right side of the picture straight up into the end pose. The other fist stays at her chest. Ears fly up and out, the eyes flip into happy curves, the mouth becomes a small "o". INSTANT, not a slow morph. At the same moment three small yellow sparkles pop out beside the raised fist.
    3. Hold the end pose for the rest of the clip: two small fist pumps (the raised fist dips a little and comes back up), ears settling softly, sparkles twinkling in place. The sparkles never multiply and never fall.
    4. Finish exactly on the end frame.

    Her back legs, paw pads and seat stay exactly where they are. She keeps the same size in the frame the whole time.

    BACKGROUND: flat green #00B140, one single colour in every frame. No floor, no shadow, no glow, no gradient, no smoke, no light flash. It is keyed out later, so anything drawn on it becomes a hole.
    The camera never moves: no zoom, no pan, no shake. Nothing leaves the frame. No text.

    Earlier attempts failed: the face was redrawn with human eyes and an open mouth, the camera zoomed in, and a fifth and sixth leg appeared while a paw was moving. None of that here.

## 체크리스트

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록**(그림자·바닥·빛 번짐·연기·그라데이션 없음) |
| C2 | **크기 그대로** — 뒷발 분홍 발바닥이 처음과 끝에 같은 자리. 확대·이동 없음 |
| C3 | 끝까지 화면 안(귀·주먹·반짝이·리본 안 잘림) |
| C4 | **눈은 늘 감은 선** — `> <`에서 `^ ^`로. 흰자·홍채·눈썹·뜬 눈·이·혀가 **한 프레임이라도** 나오면 탈락 |
| C5 | **확 바뀐다** — 주먹 번쩍이 2~3프레임 안에 일어난다. 1초 넘게 천천히 녹아 바뀌면 탈락 |
| C6 | 주먹 번쩍 뒤 **통통 두 번**(주먹이 조금 내려갔다 올라옴). 가만히 굳어 있으면 `[의견]`에 적기 |
| C7 | **발이 정확히 4개** — 특히 주먹이 올라가는 순간. 가슴의 주먹과 머리 위 주먹이 **동시에 하나씩 더** 보이면(팔 3개) 탈락 |
| C8 | 반짝이는 **노랑, 주먹 옆 위쪽에만**. 초록·회색·연기처럼 번지거나 아래로 떨어지면 탈락 |
| C9 | 글자·다른 캐릭터 없음 |

**얼굴만 보지 마라.** 0·0.5·1·1.5·2·2.5·3초 지점마다 멈춰서 **얼굴·발 개수·크기·배경** 넷을 다 본다. 주먹이 올라가는 순간(0.4~0.9초쯤)은 **한 프레임씩** 넘겨서 팔 개수를 센다.

## 받기

워터마크 없는 다운로드, 파일 이름 `kling-fighting-3.mp4`, 세션 artifacts 폴더에 저장. 탈락이어도 받아 둔다.

## 보고 형식

    설정: (모델 이름·모드·길이·화질 — 화면 글자 그대로)
    크레딧: (이번에 쓴 것 / 남은 것)
    체크리스트: C1 … C9 (탈락이면 몇 초쯤 무엇이 보였는지)
    파일: (이름과 저장 위치)

0·0.5·1·1.5·2·2.5·3초 지점 스크린샷 7장(얼굴과 발이 다 보이게). 주먹이 올라가는 순간 한 장 더.

## 마무리 (꼭 답할 것)

1. 2차(같은 무표정 두 장)와 비교해 **표정이 살아났는지** 한 줄.
2. 탈락이면 가장 큰 원인 하나와 다음에 바꿀 것(`[의견]`).
