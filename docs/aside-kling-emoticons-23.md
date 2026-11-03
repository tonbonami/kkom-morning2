# Aside 의뢰서 — Kling 23차: 꼬까 마스코트 yay·night 다시 (영상 2개)

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. 22차 결과를 보고 Teo가 꼼모닝 세션에서 "허락할게"라고 했다(2026-11-04, 22차 한도 100을 넘는 것까지 허락).
> - **이 글 전체가 지시다. 이번 의뢰만 한다**(22차는 끝났다. 다시 하지 않는다).
> - **생성은 영상마다 딱 1번, 모두 2번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 20, 합쳐서 40.** 결제·충전·구독 변경 금지.
> - 그림은 이 대화의 첨부 폴더에 있다: `/Users/mydang/.aside/u/0/sessions/2026-11-04_hr5MtyIefeX3y2wt/attachments/` — **`kkoka-yay2.png`(새로 그림)** · `kkoka-night.png`(22차와 같음). 이 2장 말고 다른 그림은 올리지 않는다(같은 폴더의 다른 그림, 특히 옛 `kkoka-yay.png`는 쓰지 않는다).
> - 영상 2개를 다 만들면 먼저 다운로드해서 이 대화의 artifacts에 저장하고(22차 파일은 덮어쓰지 않는다), 그다음 검수한다.

## 왜 다시 하나 (22차 네 보고 그대로)

- yay: 시작 그림이 한 발 든 공중 자세라 3초에 네 번 움직여 정신없었다 → **두 발로 선 그림(`kkoka-yay2.png`)으로 바꿨다.** 이번엔 **딱 한 번만** 폴짝.
- night: 숨쉬기·잎 들썩임이 너무 작아 카드에서 멈춘 그림처럼 보였다 → 숨을 **또렷하게**.

## 설정 (두 영상 같음) — 22차와 같다

Keyframes(시작·끝 **같은 파일**) · Kling 3.0 · 3s · 720p · 소리 끔 · 1:1. 예상 크레딧이 20을 넘으면 멈추고 보고.

## 공통 앞부분 (각 Prompt 맨 앞에 그대로 붙인다)

    3 second seamless LOOP animation, square 1:1. The start frame and the end frame are the SAME picture: start from it, do the small motion below, and come back to EXACTLY the same pose, position and size at the end so the clip loops without a jump. Do not redesign the character and do not invent a different look. The camera never moves.
    Character style: cute round quokka (warm orange-brown fluffy fur, small round ears, dark brown nose, rosy cheeks, small dark paws), exactly as in the picture. Simple sticker eyes only: closed curves as in the picture. No teeth, no tongue sticking out beyond what is in the picture, no human hands.
    BACKGROUND: flat pure blue in every frame, exactly like the picture. No ground, no shadow, no glow, no gradient, no flash. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no extra characters, no new objects.

## 영상 1 — yay — 시작·끝 `kkoka-yay2.png`
**Prompt** = 공통 앞부분 + :

    The quokka stands with both feet flat on the ground and both arms raised in a happy cheer. It stands still for the first second. Then, ONLY ONCE, between 1.0 and 2.0 seconds, it does one small happy hop straight up (feet leave the ground just a little, arms wave once) and lands softly back on both feet. Then it stands still again until the end, exactly in the starting pose. No crouching, no squashing, no second hop. The four small yellow sparkles stay in their places and only twinkle gently.

받기: `kling23-kkoka-yay.mp4`

## 영상 2 — night — 시작·끝 `kkoka-night.png`
**Prompt** = 공통 앞부분 + :

    The quokka sleeps curled up under a big green leaf, eyes closed the whole time. It breathes slowly and CLEARLY VISIBLY: one deep slow breath in (its round back and belly clearly swell up), the big leaf on top clearly lifts with the breath, then one slow breath out (back and leaf sink down again). Near the end one ear gives a tiny sleepy twitch. It ends exactly in the starting sleeping pose. The leaf stays one leaf, same size and color, always attached on top of the quokka.

받기: `kling23-kkoka-night.mp4`

---

## 체크리스트 (영상마다) — 22차와 같다

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 같은 평평한 파랑(내려앉을 때 머리·팔 둘레 어두운 번짐이 생기는지 적는다) |
| C2 | 크기·자리 그대로 — 확대·카메라 이동 없음 |
| C3 | 끝 프레임이 시작 프레임과 같은 자세·자리(0초·3초 차이 숫자) |
| C4 | 끝까지 화면 안 |
| C5 | 눈·입 모양이 그림과 같은 스티커 얼굴 |
| C6 | 개수 — 귀 2·반짝이 4(yay)·잎 1(night) |
| C7 | yay: 폴짝이 **딱 한 번**인지(몇 초에 몇 번인지) / night: 숨·잎 들썩임이 **카드 크기(140px)에서도 보이는지** |
| C8 | 글자·새 물건 없음 |
| C9 | `[의견]` 카드에서 계속 반복돼도 귀엽고 거슬리지 않을지 |

## 받기 · 보고

    설정: (화면 글자 그대로)
    크레딧: 영상 1·2 (예상/실제) · 남은 것
    영상 1·2 체크리스트: C1 … C9
    파일: (이름과 저장 위치)
    마무리: 22차 것보다 나아졌는지, 쓸 만한지
