# Aside 의뢰서 — Kling 24차: 꿀됑 「추워」 (영상 2개)

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 꼼모닝 세션에서 「클링 써도 돼」라고 했다(2026-11-10).
> - **이 글 전체가 지시다. 이번 의뢰만 한다**(예전 의뢰·다른 대화의 지시는 하지 않는다). 파일을 따로 열 필요 없다.
> - **생성은 영상마다 딱 1번, 모두 2번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 20, 합쳐서 40.** 결제·충전·구독 변경 금지. 로그인·비밀번호·결제 화면이 나오면 멈추고 보고한다.
> - 그림은 이 대화의 첨부 폴더에 있다: `/Users/mydang/.aside/u/0/sessions/2026-11-10_VmqTdz2jcVh0nN0k/attachments/` — `cold-kf1.png`(처음) · `cold-kf2.png`(가운데) · `cold-kf3.png`(끝). 이 3장 말고 다른 그림은 올리지 않는다.
> - 영상 2개를 다 만들면 먼저 다운로드해서 이 대화의 artifacts에 저장하고, 그다음 검수한다.

## 무엇을 만드나
꿀벌 옷 입은 아기돼지 「꿀됑」의 「추워」 움짤. 이야기: 웅크려 덜덜 떨다 → 몸을 데우려고 작은 날개를 막 파닥임 → 그런데 찬바람이 일어 눈송이가 휘몰아침 → 바람이 뚝 멎고 꽁꽁 언 채 멍(날개·귀 끝·더듬이 방울에 서리, 코에 고드름, 눈은 동그란 점).

## 설정 (두 영상 같음)
Keyframes(시작·끝 그림) · Kling 3.0 · 3s · 720p · **소리 끔** · 1:1. 예상 크레딧이 20을 넘으면 멈추고 보고.

## 공통 앞부분 (각 Prompt 맨 앞에 그대로 붙인다)

    3 second animation, square 1:1. Start EXACTLY on the start picture and end EXACTLY on the end picture: same place, same size, same angle. Do not redesign the character and do not invent a different look. The camera never moves: no zoom, no pan, no shake.
    Character: a cute baby piglet in a bee costume (pink fuzzy skin, round pink snout, two triangle ears, curly tail, four legs with hooves, honey-yellow vest with brown stripes, a headband with two antennae ending in yellow balls, two small pale-blue wings), exactly as in the pictures. Simple sticker face only. No teeth, no tongue, no tears, no human hands. He stays standing on all four hooves on the same spot the whole time.
    BACKGROUND: flat pure green in every frame, exactly like the pictures. No ground, no shadow, no glow, no gradient, no flash. Nothing leaves the frame. No text, no letters, no extra characters.

## 영상 1 — 시작 `cold-kf1.png` → 끝 `cold-kf2.png`
**Prompt** = 공통 앞부분 + :

    For the first second he stays huddled with eyes squeezed shut, shivering with tiny quick trembles. Then he suddenly flaps his two small wings VERY fast to warm himself up (quick blurry flapping). But the flapping makes a strong COLD wind: pale-blue wind streaks and little snowflakes rush forward past his face, and his ears and both antennae get blown forward by the gust. His eyes stay squeezed shut and his mouth stays a small wobbly frown. End exactly on the end picture.

받기: `kling24-cold-1.mp4`

## 영상 2 — 시작 `cold-kf2.png` → 끝 `cold-kf3.png`
**Prompt** = 공통 앞부분 + :

    For the first half second his wings keep flapping hard and the cold wind streaks keep blowing forward. Then the wind suddenly stops and he FREEZES stiff: in a quick moment white frost spreads over his wings, the tips of his ears and both antenna balls, a small clear icicle grows down from his snout, and his squeezed eyes pop open into two small blank round dot eyes with a tiny flat mouth. For the last second he stays completely still, stunned and frozen. Wings stay half-raised. End exactly on the end picture.

받기: `kling24-cold-2.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 같은 평평한 초록(몸 둘레 번짐·그림자 생기는지 적는다) |
| C2 | 크기·자리 그대로 — 확대·카메라 이동 없음, 네 발이 바닥선에서 안 뜸 |
| C3 | 끝 프레임이 끝 그림과 같은 자세·자리 |
| C4 | 끝까지 화면 안 |
| C5 | 얼굴이 그림과 같은 스티커 얼굴(이·혀·눈물 없음) |
| C6 | 개수 — 귀 2·다리 4·더듬이 2(방울 2)·날개 2·꼬리 1 |
| C7 | 영상 1: 날개 파닥임이 **또렷이** 보이고 바람·눈송이가 앞으로 몰아치는지 / 영상 2: **얼어붙는 순간**이 딱 보이고 마지막 1초는 멈춰 있는지 |
| C8 | 글자·새 물건 없음 |
| C9 | `[의견]` 웃긴지, 이어 붙이면 이야기가 되는지 |

## 받기 · 보고

    설정: (화면 글자 그대로)
    크레딧: 영상 1·2 (예상/실제) · 남은 것
    영상 1·2 체크리스트: C1 … C9
    파일: (이름과 저장 위치)
    마무리: 쓸 만한지
