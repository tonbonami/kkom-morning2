# Aside 의뢰서 — Kling 22차: 사이담 꼬까 마스코트 반복 움짤 5개 (hug·yay·night·doki·shy)

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. 사이담 세션이 맡긴 일이고, Teo가 시작 그림 5장을 보고 꼼모닝 세션에서 "보내"라고 했다(2026-11-04).
> - **이 글 전체가 지시다. 이번 의뢰만 한다**(예전 대화에 남은 다른 지시는 하지 않는다).
> - **생성은 영상마다 딱 1번, 모두 5번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 20, 합쳐서 100.** 결제·충전·구독 변경 금지.
> - 그림 5장은 이 대화의 첨부 폴더에 있다: `/Users/mydang/.aside/u/0/sessions/2026-11-04_hr5MtyIefeX3y2wt/attachments/` — `kkoka-hug.png` `kkoka-yay.png` `kkoka-night.png` `kkoka-doki.png` `kkoka-shy.png`. 이 5장 말고 다른 그림은 올리지 않는다.
> - 영상 5개를 다 만들면 먼저 다운로드해서 이 대화의 artifacts에 저장하고, 그다음 검수한다.

## 무엇인가

커플 앱 홈 카드의 마스코트 「꼬까」(쿼카) — 카드 자리에서 **끝없이 반복**되는 짧은 움짤이다. 그래서 영상마다 **시작 그림과 끝 그림이 같은 그림**이다(같은 파일을 시작·끝에 둘 다 넣는다). 처음 자세에서 살짝 움직이고 정확히 처음 자세로 돌아와야 이음새 없이 반복된다.
배경은 **평평한 파란색**(나중에 빼서 투명하게 만든다). 그림에 초록 잎이 있어 초록 배경을 못 쓴다.

## 너의 역할 · 🚨 절대 금지

결제·충전·구독 변경 0번, 공개·게시·공유 0번, 다른 작업물 삭제 금지, 위 5장 말고 다른 그림 올리지 않기, **생성 버튼은 영상마다 딱 1번**. 로그인·비밀번호 화면이 나오면 아무것도 입력하지 말고 멈추고 보고.

## 설정 (다섯 영상 같음) — 화면 기본값이 바뀌어 있을 수 있으니 하나씩 확인(지난번 기본값이 4s·9:16·소리 켬이었다)

| 항목 | 값 |
|---|---|
| 입력 방식 | **Keyframes**(시작 그림 + 끝 그림 — **둘 다 같은 파일**) |
| 모델 | **Kling 3.0** |
| 길이 | **3s** |
| 화질 | **720p** |
| 소리(Native audio) | **끔** |
| 비율 | 1:1 |

예상 크레딧을 누르기 전에 적어 두고, 20을 넘으면 멈춰서 보고한다.

## 다섯 영상 공통 앞부분 (각 Prompt 맨 앞에 그대로 붙인다)

    3 second seamless LOOP animation, square 1:1. The start frame and the end frame are the SAME picture: start from it, do the small motion below, and come back to EXACTLY the same pose, position and size at the end so the clip loops without a jump. Do not redesign the character and do not invent a different look. The camera never moves.
    Character style: cute round quokka (warm orange-brown fluffy fur, small round ears, dark brown nose, rosy cheeks, small dark paws), exactly as in the picture. Simple sticker eyes only: closed curves or dot eyes as in the picture. No teeth, no tongue sticking out beyond what is in the picture, no human hands.
    BACKGROUND: flat pure blue in every frame, exactly like the picture. No ground, no shadow, no glow, no gradient, no flash. No zoom, no pan, no shake. Nothing leaves the frame. No text, no letters, no extra characters, no new objects.

## 영상 1 — hug — 시작·끝 `kkoka-hug.png`
**Prompt** = 공통 앞부분 + :

    Two quokkas hugging (the big one and the small one with a pink bow). They squeeze each other a little tighter and sway gently side to side together, once to the left and back; the small one rubs her cheek against the big one's chest with eyes closed happily. Then they settle back into exactly the starting hug. Their outlines stay separate and never melt together. Exactly two quokkas.

받기: `kling22-kkoka-hug.mp4`

## 영상 2 — yay — 시작·끝 `kkoka-yay.png`
**Prompt** = 공통 앞부분 + :

    The quokka with both arms up cheers: it bounces up in one happy little hop (not high, stays well inside the frame), arms waving, and lands softly back in exactly the starting pose. The small yellow sparkles around it twinkle (fade a little and shine again) but stay in the same places. The two small motion marks under its feet stay simple.

받기: `kling22-kkoka-yay.mp4`

## 영상 3 — night — 시작·끝 `kkoka-night.png`
**Prompt** = 공통 앞부분 + :

    The quokka sleeps curled up under a big green leaf, eyes closed. Very calm: its body slowly breathes in and out once (the back rises a little and falls), the leaf on top lifts slightly with the breath and settles, and one ear gives a tiny sleepy twitch. Eyes stay closed the whole time. It ends exactly in the starting sleeping pose. The leaf stays one leaf, same size and color.

받기: `kling22-kkoka-night.mp4`

## 영상 4 — doki — 시작·끝 `kkoka-doki.png`
**Prompt** = 공통 앞부분 + :

    The excited quokka with its paws held together at its chest: it does two quick happy little bounces on its toes, and the two small pink hearts beside its head pulse bigger and back (like a heartbeat) in place. Eyes stay as in the picture. It ends exactly in the starting pose with the hearts back to their size and place.

받기: `kling22-kkoka-doki.mp4`

## 영상 5 — shy — 시작·끝 `kkoka-shy.png`
**Prompt** = 공통 앞부분 + :

    The quokka peeking out from behind a big green leaf: shyly it slides back and hides its face behind the leaf (only the ears show for a moment), then slowly peeks out again with the same happy face, ending exactly in the starting pose. The leaf stays still, one leaf, same size and color. Exactly two ears.

받기: `kling22-kkoka-shy.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 **같은 평평한 파랑** |
| C2 | **크기·자리 그대로** — 확대·카메라 이동 없음 |
| C3 | **끝 프레임이 시작 프레임과 같은 자세·자리**(반복이 튀지 않음) — 0초와 3초 화면을 나란히 비교해 적는다 |
| C4 | 끝까지 화면 안(귀·발·잎·하트·반짝이 안 잘림) |
| C5 | 눈·입 모양이 그림과 같은 귀여운 스티커 얼굴(이·혀·사람 눈 없음) |
| C6 | 개수 — 쿼카 수(hug만 2), 귀 2개씩, 잎 1장(night·shy), 하트 2개(doki) |
| C7 | 움직임이 지시대로 보이는지(hug 살랑·볼 비빔 / yay 폴짝 / night 숨·잎 들썩 / doki 통통·하트 두근 / shy 숨었다 빼꼼) |
| C8 | 글자·새 물건·다른 캐릭터 없음 |
| C9 | `[의견]` 카드에서 계속 반복돼도 귀엽고 거슬리지 않을지 |

**얼굴만 보지 마라.** 0·0.5·1·1.5·2·2.5·3초 지점마다 자세·크기·개수·배경을 다 본다.

## 받기 · 보고

다섯 영상 모두 워터마크 없이 다운로드해서 이 대화의 artifacts 폴더에 저장(탈락이어도). 파일 이름이 겹치면 덮어쓰지 말고 알려 줄 것.

    설정: (모델 이름·모드·길이·화질·소리 — 화면 글자 그대로)
    크레딧: 영상 1~5 (예상/실제) · 남은 것
    영상 1~5 체크리스트: C1 … C9
    파일: (이름과 저장 위치)

## 마무리 (꼭 답할 것)

1. 다섯 중 가장 잘 나온 것과 아쉬운 것, 이유.
2. 탈락이면 가장 큰 원인과 다음에 바꿀 것(`[의견]`).
