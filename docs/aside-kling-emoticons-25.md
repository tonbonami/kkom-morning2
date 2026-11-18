# Aside 의뢰서 — Kling 25차: 꿀됑 「으악」 (영상 2개)

> 꼼모닝 세션(Claude Code)이 Aside CLI로 직접 보낸다. Teo가 꼼모닝 세션에서 키프레임을 보고 「보내」라고 했다(2026-11-18).
> - **이 글 전체가 지시다. 이번 의뢰만 한다**(예전 의뢰·다른 대화의 지시는 하지 않는다). 파일을 따로 열 필요 없다.
> - **생성은 영상마다 딱 1번, 모두 2번.** 결과가 나빠도 다시 돌리지 말고 보고한다.
> - 크레딧 상한: **영상 하나에 20, 합쳐서 40.** 결제·충전·구독 변경 금지. 로그인·비밀번호·결제 화면이 나오면 멈추고 보고한다.
> - 그림은 이 대화의 첨부 폴더에 있다: `/Users/mydang/.aside/u/0/sessions/2026-11-18_lNCDcIdP9Aa64QQK/attachments/` — `yell-kf1.png`(처음) · `yell-kf2.png`(가운데) · `yell-kf3.png`(끝). 이 3장 말고 다른 그림은 올리지 않는다.
> - 영상 2개를 다 만들면 먼저 다운로드해서 이 대화의 artifacts에 저장하고, 그다음 검수한다.

## 무엇을 만드나
꿀벌 옷 입은 아기돼지 「꿀됑」의 「으악」 움짤(앞모습). 이야기: 평소 얼굴로 서 있다 → 눈을 질끈 감고 씩 웃음(입 벌림, 혀) → 입이 점점 커져 얼굴 전체가 입이 됨(코는 머리 꼭대기로 밀려 올라감) + 귀가 양옆으로 휙 펴지고 더듬이가 띠용 서고 날개가 펴짐 → 그대로 「으악!」 버팀.

## 설정 (두 영상 같음)
Keyframes(시작·끝 그림) · Kling 3.0 · 3s · 720p · **소리 끔** · 1:1. 예상 크레딧이 20을 넘으면 멈추고 보고.

## 공통 앞부분 (각 Prompt 맨 앞에 그대로 붙인다)

    3 second animation, square 1:1. Start EXACTLY on the start picture and end EXACTLY on the end picture: same place, same size, same angle. Do not redesign the character and do not invent a different look. The camera never moves: no zoom, no pan, no shake.
    Character: a cute baby piglet in a bee costume seen from the FRONT (pink fuzzy skin, round pink snout, two triangle ears, curly tail, four legs with hooves, honey-yellow vest with brown stripes, a headband with two antennae ending in yellow balls, two small pale-blue wings), exactly as in the pictures. No human hands, no tears, no sharp teeth. His body and his two front hooves stay on the same spot and the same ground line the whole time — only his face, ears, antennae and wings move.
    BACKGROUND: flat pure green in every frame, exactly like the pictures. No ground, no shadow, no glow, no gradient, no flash. Nothing leaves the frame. No text, no letters, no extra characters.

## 영상 1 — 시작 `yell-kf1.png` → 끝 `yell-kf2.png`
**Prompt** = 공통 앞부분 + :

    For the first second he stands still with his calm little smile and blinks once. Then his eyes squeeze shut into happy curves and his mouth opens into a wide happy grin with a pink tongue and a few tiny rounded white tooth bumps along the top edge. His snout stays in its place. Ears, antennae and wings stay as they are. End exactly on the end picture.

받기: `kling25-yell-1.mp4`

## 영상 2 — 시작 `yell-kf2.png` → 끝 `yell-kf3.png`
**Prompt** = 공통 앞부분 + :

    In the first second his grinning mouth opens wider and wider, very fast, until the open mouth fills almost his whole face like a big round "EUAK!" scream: rosy-pink inside, a pink tongue at the bottom, a tiny uvula, a row of small rounded white tooth bumps at the top. His round snout gets pushed up to the very top of his head, just under the headband. At the same moment both ears fling straight out to the sides, both antennae spring straight up (boing), and his wings flare open. For the last two seconds he holds the big scream with only a tiny trembling of the open mouth and the antennae. End exactly on the end picture.

받기: `kling25-yell-2.mp4`

---

## 체크리스트 (영상마다)

| # | 통과 조건 |
|---|---|
| C1 | 배경이 처음부터 끝까지 같은 평평한 초록(몸 둘레 번짐·그림자 생기는지 적는다) |
| C2 | 크기·자리 그대로 — 확대·카메라 이동 없음, 두 앞발이 바닥선에서 안 뜸 |
| C3 | 끝 프레임이 끝 그림과 같은 자세·자리 |
| C4 | 끝까지 화면 안(위로 선 더듬이 방울도) |
| C5 | 영상 1: 웃는 입 안이 그림처럼(혀·작은 둥근 이) / 영상 2: 입이 얼굴만큼 커지고 코가 머리 꼭대기로 올라가는지, 뾰족한 이·눈물 없음 |
| C6 | 개수 — 귀 2·앞발 2·더듬이 2(방울 2)·날개 2·코 1 |
| C7 | 영상 2: 입이 **확** 커지는 순간이 또렷한지, 귀가 펴지고 더듬이가 띠용 서는지, 마지막 2초는 버티는지 |
| C8 | 글자·새 물건 없음 |
| C9 | `[의견]` 웃긴지, 이어 붙이면 이야기가 되는지 |

## 받기 · 보고

    설정: (화면 글자 그대로)
    크레딧: 영상 1·2 (예상/실제) · 남은 것
    영상 1·2 체크리스트: C1 … C9
    파일: (이름과 저장 위치)
    마무리: 쓸 만한지
