# Aside 의뢰서 — Kling 21차: 꿀댕이 「좋은 아침」 해돋이 (영상 3개)

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 키프레임 3장을 보고 "보내"라고 했다(2026-11-02).
> - **이 글 전체가 지시다. 이번 의뢰만 한다**(예전 대화에 남은 다른 지시는 하지 않는다).
> - **생성은 영상마다 딱 1번, 모두 3번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 20, 합쳐서 60.** 결제·충전·구독 변경 금지.
> - 그림 3장은 이 대화의 첨부 폴더에 있다: `/Users/mydang/.aside/u/0/sessions/2026-11-02_POpoQvKumnB1pmB8/attachments/` — `m1-night.png` `m2-peek.png` `m3-sunrise.png`. 이 3장 말고 다른 그림은 올리지 않는다.
> - 영상 3개를 다 만들면 먼저 다운로드해서 이 대화의 artifacts에 저장하고, 그다음 검수한다.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

## 이야기

꼼이 「좋은 아침」(밤바다 수평선 위로 꼼이 얼굴이 해처럼 떠오름)의 꿀댕이 짝. 밤바다에 더듬이 방울 두 개만 작은 해처럼 빼꼼(1) → 멍한 얼굴로 코까지 떠오름(2) → 뒤에서 진짜 해가 뜨고, 자기가 해를 띄운 줄 알고 뿌듯(3) → 해가 너무 밝아 눈부셔 코만 벌름, 멍하게 다시 내려감(→2).
영상 A = 1 → 2, 영상 B = 2 → 3, 영상 C = 3 → 2. 편집에서 A·B·C·(A 거꾸로)로 이어 끝없이 반복한다.
**배경이 그려진 장면**이다(초록 배경 아님). 카메라·수평선·바다는 절대 움직이지 않는다.

## 너의 역할 · 🚨 절대 금지

결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 3장 말고 다른 그림 올리지 않기, **생성 버튼은 영상마다 딱 1번**. 로그인·비밀번호 화면이 나오면 아무것도 입력하지 말고 멈추고 보고.

## 설정 (세 영상 같음) — 화면 기본값이 바뀌어 있을 수 있으니 하나씩 확인(지난번 기본값이 4s·9:16이었다)

| 항목 | 값 |
|---|---|
| 입력 방식 | **Keyframes**(시작 그림 + 끝 그림) |
| 모델 | **Kling 3.0** |
| 길이 | **3s** |
| 화질 | **720p** |
| 소리(Native audio) | **끔** |
| 비율 | 1:1 |

예상 크레딧을 누르기 전에 적어 두고, 20을 넘으면 멈춰서 보고한다.

---

## 영상 A — 밤에서 빼꼼 — 시작 `m1-night.png`, 끝 `m2-peek.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE gentle moment in the same painted scene. Animate BETWEEN them. Do not redesign anything and do not invent a third look. The camera, the horizon line and the sea never move.

    Scene: a calm sea at the horizon before dawn. Kkuldaeng, a baby piglet with a bee headband (two bendy dark-brown antennae ending in round yellow balls), rises slowly and straight UP from behind the horizon, like the sun rising. He does not get bigger or smaller and does not move sideways — only up. The part of him below the horizon is simply hidden behind the sea surface: no splash, no ripples around him, no reflection of his body.
    EXACTLY two ears, two antennae with two separate yellow balls in every frame.

    THE MOTION, ONCE:
    1. 0 to 0.3 second, the start frame: night, only the two glowing yellow antenna balls above the horizon.
    2. He rises smoothly and slowly: the antennae, then the headband and ears, then his eyes and round pink snout come up over the horizon.
    3. At the same time the sky low near the horizon slowly warms from navy to soft purple and orange (the sun stays hidden), and a faint golden path appears on the water.
    4. His face is sleepy and blank the whole time: plain dot eyes staring straight ahead, no expression. Finish exactly on the end frame and hold it for the last 0.3 second.

    EYES: dot eyes only, each ONE solid flat dark brown shape with ONE small white highlight. No eye whites, no eyebrows, no eyelashes, no teeth, no tongue.
    No zoom, no pan, no shake, no camera move. No text, no letters.

    Earlier attempts in other videos failed: the character got bigger as it rose (camera zoomed in), antennae merged or became three, and faces were redrawn with human eyes. None of that here.

받기: `kling21-morning-a.mp4`

## 영상 B — 해가 뜨고 뿌듯 — 시작 `m2-peek.png`, 끝 `m3-sunrise.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE gentle moment in the same painted scene. Animate BETWEEN them. Do not redesign anything and do not invent a third look. The camera, the horizon line and the sea never move.

    Scene: a calm sea at sunrise. Kkuldaeng, a baby piglet with natural piglet proportions in a bee costume (fuzzy honey-yellow vest with chocolate-brown stripes, two SMALL opaque pale-blue bee wings, a headband with two bendy dark-brown antennae ending in round yellow balls), rises straight UP from behind the horizon. He does not get bigger or smaller and does not move sideways — only up. The part of him below the horizon is hidden behind the sea surface: no splash, no ripples around him.
    EXACTLY two ears, two antennae with two separate yellow balls, two wings in every frame. No hands, no arms.

    THE MOTION, ONCE:
    1. 0 to 0.3 second, the start frame: pre-dawn, his head up to the snout, blank sleepy face.
    2. The big soft sun rises slowly from behind the horizon DIRECTLY BEHIND him, and long soft rays spread out; the sky turns warm orange-gold and a bright glittering sun path grows on the water.
    3. He rises with the sun until the horizon cuts across his chest; his two small wings open a little.
    4. As the sun appears, his face turns very proud and happy: eyes close into happy curves, rosy cheeks, chin slightly raised — as if he raised the sun himself. His two yellow antenna balls glow a little extra.
    5. Finish exactly on the end frame and hold it for the last 0.4 second.

    EYES: dot eyes (one flat dark shape with one small white highlight) at the start, closed happy curves at the end. No eye whites, no eyebrows, no eyelashes, no teeth, no tongue.
    No zoom, no pan, no shake, no camera move, no flash. No text, no letters.

    Earlier attempts in other videos failed: the character got bigger as it rose (camera zoomed in), the sun stuck to the character's back, antennae or wings merged or multiplied, and faces were redrawn with human eyes. None of that here.

받기: `kling21-morning-b.mp4`

## 영상 C — 눈부셔 코 벌름, 다시 내려감 — 시작 `m3-sunrise.png`, 끝 `m2-peek.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE gentle moment in the same painted scene. Animate BETWEEN them. Do not redesign anything and do not invent a third look. The camera, the horizon line and the sea never move.

    Scene: the same sea. Kkuldaeng, a baby piglet in a bee costume (striped vest, two small pale-blue wings, headband with two antennae ending in yellow balls) is proudly risen in front of the big sun.
    EXACTLY two ears, two antennae with two separate yellow balls, two wings in every frame. No hands, no arms.

    THE MOTION, ONCE:
    1. 0 to 0.5 second, the start frame: proud, eyes closed happily, sun behind him.
    2. From 0.5 to 1.2 seconds the sun behind him gets dazzlingly brighter for a moment. He scrunches his closed eyes against the glare and his round pink snout twitches — the nostrils flare twice, "sniff sniff".
    3. Then, dazed, he slowly sinks straight DOWN behind the horizon while the sun sinks back down behind the horizon with him; the rays fade and the sky returns to soft pre-dawn purple and orange.
    4. He ends with his head up to the snout, his face blank and dazed: plain dot eyes staring straight ahead. Finish exactly on the end frame and hold it for the last 0.3 second.
    He does not get bigger or smaller and does not move sideways — only down. The part of him below the horizon is hidden behind the sea surface: no splash, no ripples.

    EYES: closed curves at the start, dot eyes (one flat dark shape with one small white highlight) at the end. No eye whites, no eyebrows, no eyelashes, no teeth, no tongue.
    No zoom, no pan, no shake, no camera move, no white-out of the whole frame (only the sun brightens). No text, no letters.

    Earlier attempts in other videos failed: the camera zoomed, the whole frame flashed white, antennae or wings merged or multiplied, and faces were redrawn with human eyes. None of that here.

받기: `kling21-morning-c.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | **카메라·수평선·바다가 그대로** — 수평선 높이가 모든 프레임에서 같다. 확대·카메라 이동이면 탈락 |
| C2 | **꿀댕이 크기 그대로** — 위아래로만 움직이고 커지거나 작아지지 않는다(머리 폭을 0·1.5·3초에 재서 적는다) |
| C3 | 수평선 아래 몸이 물 위로 비치거나 물보라·물결이 생기지 않는다 |
| C4 | 눈은 점눈(하이라이트 하나)·감은 선만. 흰자·눈썹·속눈썹·이·혀 나오면 탈락 |
| C5 | 영상 A: 방울만 → 코까지 멍하게 떠오름 · 영상 B: 해가 **꿀댕이 바로 뒤에서** 뜨고 얼굴이 뿌듯하게 바뀜 · 영상 C: 해가 잠깐 더 밝아지고 **코가 벌름**, 그다음 멍하게 내려감 |
| C6 | **개수** — 귀 2·더듬이 2·방울 2·날개 2. 한 프레임씩 센다 |
| C7 | 해가 꿀댕이 몸에 붙거나 녹아 합쳐지지 않는다 |
| C8 | 글자·다른 캐릭터 없음 |
| C9 | `[의견]` 「자기가 해를 띄운 줄 알고 뿌듯 → 눈부셔 코 벌름」이 읽히는지, 귀여운지 |

**얼굴만 보지 마라.** 0·0.5·1·1.5·2·2.5·3초 지점마다 수평선 높이·크기·개수·배경을 다 본다.

## 받기 · 보고

세 영상 모두 워터마크 없이 다운로드해서 이 대화의 artifacts 폴더에 저장(탈락이어도). 파일 이름이 겹치면 덮어쓰지 말고 알려 줄 것.

    설정: (모델 이름·모드·길이·화질·소리 — 화면 글자 그대로)
    크레딧: 영상 A·B·C (예상/실제) · 남은 것
    영상 A·B·C 체크리스트: C1 … C9
    파일: (이름과 저장 위치)

## 마무리 (꼭 답할 것)

1. 셋 중 가장 잘 나온 것과 아쉬운 것, 이유.
2. 탈락이면 가장 큰 원인과 다음에 바꿀 것(`[의견]`).
