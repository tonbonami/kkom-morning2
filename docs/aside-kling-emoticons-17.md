# Aside 의뢰서 — Kling 17차: 의사 꿀댕이 「제자리 걷기」

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 그림(B)을 보고 "AB, 보내자"라고 했다(2026-10-21).
> - **이번 의뢰만 한다. 이 대화에 남아 있는 예전 지시(채팅 검수 등)는 하지 않는다.**
> - **생성은 딱 1번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **30.** 결제·충전·구독 변경 금지.
> - 그림 한 장은 이 대화의 **첨부 폴더(attachments)**에 있다: `kd1-walk.png`.
> - 영상을 만들면 먼저 다운로드해서 artifacts에 저장하고, 그다음 검수한다.
> - 결과 영상은 Teo가 직접 보기 전엔 앱에 안 들어간다.

---

## 쓰임

꼼이 피부 일지의 「분석」 화면 맨 위에서, 의사 가운을 입은 꿀댕이가 뒷짐을 지고 **고민하며 왔다 갔다** 한다. 좌우 이동과 방향 전환은 앱이 하므로, 영상은 **제자리에서 걷는 동작만** 필요하다(러닝머신 위처럼 몸은 그 자리).

## 너의 역할 · 🚨 절대 금지

전과 같다. 결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 한 장 말고 다른 그림 올리지 않기, **생성 버튼은 딱 1번**.

## 설정 — 화면 기본값이 바뀌어 있을 수 있으니 하나씩 확인

| 항목 | 값 |
|---|---|
| 입력 방식 | **Keyframes**(시작 그림 + 끝 그림) — **둘 다 `kd1-walk.png`** (같은 그림으로 시작·끝 → 반복 고리) |
| 모델 | **Kling 3.0** |
| 길이 | **3s** |
| 화질 | **720p** |
| 소리(Native audio) | **끔** |
| 비율 | 1:1 (고를 수 있으면) |

예상 크레딧을 누르기 전에 적어 두고, 30을 넘으면 멈춰서 보고한다.

## 영상 — 시작·끝 모두 `kd1-walk.png`

**Prompt** (그대로):

    3 second seamless looping animation, square 1:1. The start frame and the end frame are the same image, so the motion must return exactly to it. Do not redesign the character and do not invent a new look. The camera never moves.

    THE CHARACTER — KKULDAENG, a cute baby piglet doctor standing upright on his two hind legs: a white buttoned doctor's coat with a tiny pen in the breast pocket, a stethoscope around his neck, black rounded-square horn-rimmed glasses, a headband with TWO bendy brown antennae ending in round yellow balls, two small pale-blue bee wings on his back, a curly pink tail. His two front hooves stay clasped behind his back the whole time. EXACTLY TWO EARS, TWO ANTENNAE, TWO WINGS, TWO LEGS he walks on. Hooves only, never human hands.

    EYES: round dark dot eyes behind the glasses, glancing up thoughtfully. No eye whites, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION: he WALKS IN PLACE like on a treadmill — he takes two slow, thoughtful steps (left, right) facing the same direction, his body gently bobbing up and down with each step, the coat swaying a little, the antennae bobbing softly. His body does NOT move across the frame; he stays in the same spot and the same size. He keeps a pondering "hmm" face. End exactly on the start pose so the clip loops.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no numbers.

    Earlier attempts with this character failed when legs or ears split into extra pieces, front legs turned into human arms, or the character slid across the frame. None of that here.

받기: `kling18-doctor-walk.mp4`

---

## 체크리스트

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록** |
| C2 | 몸이 **제자리**(옆으로 미끄러지지 않음), 크기 같음. 카메라 이동이면 탈락 |
| C3 | 끝까지 화면 안(더듬이 끝·날개·꼬리 안 잘림) |
| C4 | 다리 2개가 번갈아 걷는다(다리가 3개로 보이는 프레임 없음) |
| C5 | 앞발은 끝까지 뒷짐(사람 손 없음) |
| C6 | 안경·청진기·가운이 녹거나 모양이 바뀌지 않음 |
| C7 | 마지막 프레임이 첫 프레임과 거의 같아서 이어 붙여도 튀지 않음 |
| C8 | 글자·숫자·다른 캐릭터 없음 |
| C9 | `[의견]` "고민하며 걷는 의사"로 보이는지, 귀여운지 |

## 받기 · 보고

워터마크 없이 다운로드해서 세션 artifacts 폴더에 저장(탈락이어도).

    설정: (화면 글자 그대로)
    크레딧: (예상/실제) · 남은 것
    체크리스트: C1 … C9
    파일: (이름과 저장 위치)
