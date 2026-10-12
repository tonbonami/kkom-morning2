# Aside 의뢰서 — Kling 꼼이 움짤 2차: 「힘내」 하나, 시작·끝 그림 두 장으로

> Teo 먼저 읽기
> - **생성은 딱 1번.** 결과가 나쁘면 다시 돌리지 말고 멈춰서 보고한다(Teo 결정: "이번엔 하나만").
> - 크레딧 상한: **이번 1회 비용까지만.** 결제·충전·구독 변경 금지는 1차와 같다.
> - 그림 두 장은 꼼모닝 세션이 Aside 첨부 폴더에 넣어 둔다(`start-kkom-1024.png`, `end-fighting.png`).

---

## 참고 — 비교용 무료 버전

같은 두 그림으로 꼼모닝 세션이 **영상 모델 없이** 만든 버전(주먹 내렸다 올렸다 + 통통)도 따로 나온다. 영상 모델은 얼굴을 다시 그리는 버릇이 있어서(사이담이 여섯 번 조여도 실패한 기록), Teo가 둘을 나란히 보고 고른다. 그러니 이번 1번이 탈락이어도 괜찮다 — **있는 그대로 판정만** 해 줘.

## 1차에서 배운 것 (왜 이렇게 바꿨나)

1차(힘내·뽀뽀)는 **시작 그림 한 장**만 줬다. 1초 뒤부터 모델이 얼굴을 새로 그려서 눈에 흰자·홍채·눈썹이 생기고 입이 사람처럼 벌어졌다. "카메라 고정"인데 1.4배 확대됐고, 배경이 탁해지고 발밑에 그림자가 생겼다. 뽀뽀는 흰 연기 고리가 생기고 하트가 초록으로 변했다.
→ 이번엔 **끝 그림까지 같은 화풍으로 직접 준다.** 모델은 두 그림 사이만 움직이면 된다. 예전에 예쁘게 나온 폭죽 움짤이 이 방식이었다.

## 너의 역할

1차와 같다. **Kling을 대신 조작하는 꼼꼼한 작업자.** 문구·설정을 그대로 넣고, 체크리스트로 판정하고, 받아서 보고한다.

## 🚨 절대 금지 (1차와 같다 + 하나)

- 결제·충전·구독 변경 0번. 공개·게시·공유 0번. 다른 작업물 삭제 금지.
- 아래 두 그림 말고 다른 그림을 올리지 마라.
- **생성 버튼은 딱 1번.** 결과가 나빠도 다시 누르지 마라.

## 설정

| 항목 | 값 |
|---|---|
| 기능 | Image to Video에서 **시작 그림 + 끝 그림(Start & End frames / 첫 프레임·끝 프레임)** 을 둘 다 넣는 방식 |
| 시작 그림 | `start-kkom-1024.png` (1024×1024) |
| 끝 그림 | `end-fighting.png` (1024×1024) |
| 길이 | **5초** |
| 모델·모드 | **끝 그림을 넣을 수 있는** 모델·모드 중 가장 최신. 끝 그림 칸이 특정 모드에서만 열리면 그 모드로 |
| 카메라 | 고르는 칸이 있으면 **고정(Static / None)** |
| 창의성(Creativity)↔충실도(Relevance) 같은 칸 | **충실도(Relevance) 쪽 끝**으로. 1차는 기본값이라 모델이 얼굴을 마음대로 바꿨다 |

⚠️ **끝 그림을 넣는 칸이 안 보이거나 Pro 플랜에서 막혀 있으면 생성하지 말고 멈춰서**, 화면에 보이는 옵션 이름을 그대로 적어 보고해라.

**Prompt** (그대로 — 사이담에서 통한 문구 구조: 길이·끝 처리부터, 안 움직일 것을 먼저, 동작은 프레임 수로):

    Make a short animation, square 1:1, from these two drawings. Do not worry about how it ends; it will be looped later.

    The first image is the start pose. The second image is the end pose.

    Her face does not move or change at all: the same simple round dark eyes with one small white highlight, the same small black nose, the same tiny closed smile, the same pink cheeks. Her ears, ribbon, body and back legs stay where they are. The fluffy cream fur stays the same drawing.

    Only her two front paws move: over about eight frames they rise from her lap to her chest and curl into tiny soft fists, then she gives one small bounce (her whole body dips two frames down and comes back up).

    Keep the flat green background exactly as it is. Camera fixed. No zoom. No text.

**Negative prompt** (칸이 있으면 그대로):

    human eyes, realistic eyes, eyebrows, eye whites, detailed iris, eyelid lines, open mouth, teeth, tongue, facial expression change, face redraw, zoom, zoom in, close-up, camera movement, pan, dolly, shaking camera, background change, darker green, gradient background, vignette, shadow, floor, ground, reflection, glow, halo, smoke, mist, ring, sparkles, text, letters, numbers, watermark, extra characters, second dog, extra limbs, extra paws, green objects, blurry, cropped ears, cropped paws, ribbon color change

## 체크리스트

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록**(그림자·바닥·빛 번짐·연기·그라데이션 없음) |
| C2 | **카메라 고정**(확대·이동 없음 — 캐릭터 크기가 처음과 끝이 같다) |
| C3 | 끝까지 화면 안(귀·발·리본 안 잘림) |
| C4 | **얼굴이 안 변한다** — 눈은 단순한 검은 동그라미+하이라이트, 입은 작게 다문 웃음. 흰자·눈썹·벌린 입·이·혀가 **한 프레임이라도** 나오면 탈락 |
| C5 | 앞발이 가슴 높이로 올라가 주먹 쥔 모양으로 끝난다 |
| C6 | 글자·다른 캐릭터·초록 물건 없음 |

**C4를 특히 꼼꼼히:** 1초·2초·3초·4초 지점에서 멈춰서 얼굴을 확대해 봐라.

## 받기

워터마크 없는 다운로드, 파일 이름 `kling-fighting-kf.mp4`, 세션 artifacts 폴더에 저장. 탈락이어도 받아 둔다.

## 보고 형식

    설정: (모델 이름·모드·길이·충실도 값 — 화면 글자 그대로)
    크레딧: (이번에 쓴 것 / 남은 것)
    체크리스트: C1 … C6 (탈락이면 몇 초쯤 무엇이 보였는지)
    파일: (이름과 저장 위치)

0·1·2·3·4·5초 지점 스크린샷 6장(얼굴이 보이게).

## 마무리 (꼭 답할 것)

1. 1차(시작 그림 한 장)와 비교해 **얼굴이 덜 변했는지** 한 줄.
2. 탈락이면 가장 큰 원인 하나와 다음에 바꿀 것(`[의견]`).
