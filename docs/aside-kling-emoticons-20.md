# Aside 의뢰서 — Kling 20차: 꼼이 냥냥 펀치 다시 (영상 1개)

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 새 시작 그림을 보고 "보내"라고 했다(2026-10-30).
> - **이 글 전체가 지시다. 이번 의뢰만 한다**(이 대화의 19차는 끝났다. 다시 하지 않는다).
> - **생성은 딱 1번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **20.** 결제·충전·구독 변경 금지.
> - 그림 2장은 이 대화의 첨부 폴더에 있다: `/Users/mydang/.aside/u/0/sessions/2026-10-30_mIi9Xq8SISQgXZ7y/attachments/` — 시작 `kk1b.png`(새로 그림), 끝 `kk2.png`(19차와 같은 파일). 이 2장 말고 다른 그림은 올리지 않는다.
> - 영상을 다 만들면 먼저 다운로드해서 이 대화의 artifacts에 저장하고, 그다음 검수한다.
> - 결과 영상은 Teo가 직접 보고 OK하기 전엔 앱에 안 들어간다.

## 왜 다시 하나

19차 영상 1(`kk1` → `kk2`)은 0.5초에 몸을 돌리고 1.4초에 뒷다리로 서서 앞발을 사람 팔처럼 뻗었고, 1.6~2.1초엔 몸통이 옆으로 늘어나 탈락했다. 네가 말한 대로 시작·끝의 몸 자세가 달랐던 탓이다. 그래서 시작 그림을 **끝 그림과 몸·뒷다리·꼬리·리본이 픽셀까지 같고 앞발과 입만 다르게** 다시 그렸다. 펀치도 **한 번만** 시킨다(두 번은 편집에서 만든다).

## 너의 역할 · 🚨 절대 금지

19차와 같다. 결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 2장 말고 다른 그림 올리지 않기, **생성 버튼은 딱 1번**. 로그인·비밀번호 화면이 나오면 아무것도 입력하지 말고 멈추고 보고.

## 설정 — 화면 기본값이 바뀌어 있을 수 있으니 하나씩 확인

| 항목 | 값 |
|---|---|
| 입력 방식 | **Keyframes**(시작 그림 + 끝 그림) |
| 모델 | **Kling 3.0** |
| 길이 | **3s** |
| 화질 | **720p** |
| 소리(Native audio) | **끔** |
| 비율 | 1:1 (고를 수 있으면) |

예상 크레딧을 누르기 전에 적어 두고, 20을 넘으면 멈춰서 보고한다.

## 영상 — 꼼이 냥냥 펀치 한 번 — 시작 `kk1b.png`, 끝 `kk2.png`

**Prompt** (그대로):

    3 second animation, square 1:1. The start frame and the end frame are two keyframes of ONE short moment, already drawn in the same style, and they are IDENTICAL except for one front paw and the mouth. Animate only that difference. Do not redesign the character and do not invent a third look. The camera never moves.

    ONE character, Kkom: a fluffy cream-white maltipoo puppy, a real puppy on four legs, with two big floppy curly ears, ONE small pink ribbon on the left side of her head, small black nose, round pink paw pads, a fluffy round tail. EXACTLY TWO EARS, FOUR LEGS and ONE RIBBON in every frame.

    THE BODY IS GLUED IN PLACE: her body, her hind legs, her two other paws on the ground, her tail and her head position stay exactly where they are in both frames for the whole video. She never rises onto her hind legs, never stands up, never turns, never steps, never leans forward, and her body never stretches or gets longer. Only the front-right leg moves, like a cat's paw.

    EYES: simple sticker eyes only — round dot eyes, each ONE solid flat dark brown shape with ONE small white highlight, looking forward with determination the whole time. No eye whites, no iris ring, no eyebrows, no eyelashes, no teeth, no tongue.

    THE MOTION, ONCE:
    1. 0 to 0.3 second, the start frame: front-right paw curled close to her chest, mouth closed in a firm little line, cheeks puffed.
    2. From about 0.4 second she pushes that front-right paw straight forward in ONE quick short cat punch, and at the same moment her mouth opens in a shout. Her two ears give one small bounce from the punch and settle again (still two ears, attached normally).
    3. By about 1.0 second the paw is fully forward exactly like the end frame. Then she holds that pose perfectly still until the end — only a tiny breathing movement.
    4. Finish exactly on the end frame.

    BACKGROUND: flat green #00B140 in every frame. No ground drawn, no shadow, no glow, no gradient, no flash, no speed lines. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no sound words.

    Earlier attempts failed: she turned her body, rose onto her hind legs and thrust the paw like a human arm, her body stretched sideways, and her ears flapped like wings. None of that here.

받기: `kling20-kkom-punch.mp4`

## 체크리스트

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 초록** |
| C2 | **몸이 제자리** — 몸통·뒷다리·꼬리·머리 위치와 크기가 모든 프레임에서 같다. 확대·카메라 이동·몸 늘어남이면 탈락 |
| C3 | 끝까지 화면 안(귀·리본·발·꼬리 안 잘림) |
| C4 | 눈은 점눈(하이라이트 하나)만. 흰자·눈썹·속눈썹·이·혀 나오면 탈락(입 속 분홍은 끝 그림에 있던 것) |
| C5 | 앞발 **하나만** 접혔다 앞으로 쭉 — 펀치 한 번이 분명한지, 몇 초에 다 뻗는지 |
| C6 | **개수** — 귀 2·다리 4·리본 1. 귀가 튀는 순간은 한 프레임씩 센다 |
| C7 | 뒷다리로 서기·사람 팔처럼 뻗기 없음 |
| C8 | 표정이 끝까지 **결의**인지 |
| C9 | 글자·다른 캐릭터·반짝이 없음 |
| C10 | `[의견]` 「냥!」 펀치로 읽히는지 |

**얼굴만 보지 마라.** 0·0.5·1·1.5·2·2.5·3초 지점마다 몸 위치·개수·크기·배경을 다 본다.

## 받기 · 보고

워터마크 없이 다운로드해서 이 대화의 artifacts 폴더에 저장(탈락이어도). 19차 파일은 덮어쓰지 않는다.

    설정: (모델 이름·모드·길이·화질·소리 — 화면 글자 그대로)
    크레딧: (예상/실제) · 남은 것
    체크리스트: C1 … C10
    파일: (이름과 저장 위치)
    펀치가 시작하는 프레임 시각 · 다 뻗는 프레임 시각
