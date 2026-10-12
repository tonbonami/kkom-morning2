# Aside 의뢰서 — Kling으로 꼼이 움짤 시험판 3개 만들기

> Teo 먼저 읽기 (⚠️ 돈·업로드 — Teo가 정할 것)
> - **크레딧은 쓰면 되돌릴 수 없다.** 아래 `크레딧 상한`을 Teo가 채워서 보낸다. 상한에 닿으면 Aside는 멈추고 보고한다.
> - 시작 그림 `start-kkom.png`(꼼이 캐릭터)가 **Kling 서버로 올라간다.** 우리 자체 캐릭터라 문제는 없지만 알고 보낼 것.
> - 결제·충전·구독 변경은 Aside가 하지 않는다(아래 금지). 크레딧이 모자라면 멈춘다.
> - 받은 영상은 Teo가 `/Users/mydang/Claude_Code/Kkom-Morning/art/kling/`로 옮겨 주면(또는 Aside가 거기 바로 저장) 꼼모닝 세션이 투명화·반복 다듬기·글자 배지·앱 넣기를 한다.
>
> **크레딧 상한: ______** (권장: 시험판 3개 × 최대 2번 = 생성 6번 분량)

---

## 너의 역할

너는 **Kling 사이트를 대신 조작하는 꼼꼼한 작업자**다. 그림을 새로 디자인하거나 지시를 해석해서 바꾸지 않는다. 아래 설정·문구를 **그대로** 넣고, 결과를 체크리스트로 판정하고, 받아서 보고한다.

## 현재 상태 (묻지 않는다)

| 묻지 않을 것 | 이미 아는 답 |
|---|---|
| 배경이 왜 초록인가 | 나중에 초록을 빼서 투명하게 만든다(영상은 투명 배경을 못 가진다) |
| 끝에 처음 자세로 안 돌아와도 되나 | **된다.** 반복 재생은 받은 뒤 편집으로 만든다. 그걸로 탈락시키지 마라 |
| 글자(힘내·뽀뽀…)는 어디에 | 나중에 따로 얹는다. **영상에 글자가 나오면 탈락** |
| 캐릭터 | 크림색 토이푸들 "꼼이", 왼쪽 귀 옆 **산호색 리본**. 시작 그림 그대로 유지돼야 한다 |

## 🚨 절대 금지

- **결제·충전·구독 변경·플랜 업그레이드 0번.** 크레딧이 모자라면 멈추고 보고.
- **크레딧 상한을 넘기지 마라.** 매 생성 전에 남은 크레딧과 이번 생성 비용을 확인하고 기록.
- 만든 영상을 **공개·게시·공유하지 마라**(커뮤니티 올리기, 공개 설정 등).
- Kling에 원래 있던 **다른 작업물 삭제 금지**, 계정 설정 변경 금지.
- `start-kkom.png` 말고 **다른 그림을 올리지 마라.**

## ✅ 해도 되는 것

- 이미지→영상(Image to Video) 화면에서 시작 그림 올리기, 문구 넣기, 설정 고르기, 생성
- 결과 재생해 보기, 프레임 넘겨 보기, **워터마크 없는** 다운로드
- 한 이모티콘이 체크리스트에 떨어지면 **같은 설정으로 한 번 더**(이모티콘당 최대 2번)

## 공통 설정

| 항목 | 값 |
|---|---|
| 기능 | Image to Video (시작 그림 1장, 끝 그림 없음) |
| 시작 그림 | `/Users/mydang/Claude_Code/Kkom-Morning/art/kling/start-kkom.png` (1536×1536, 순수 초록 #00B140) |
| 길이 | **5초** |
| 화면비 | 1:1 (그림 비율 그대로) |
| 모델·모드 | 고를 수 있는 것 중 **가장 최신 모델**, 모드는 **Professional(고품질)**. 비용이 상한에 안 맞으면 Standard로 하고 그렇게 했다고 적어라 |
| 카메라 | 고르는 칸이 있으면 **고정(Static / None)** |
| 창의성(Creativity) 같은 조절 칸 | 손대지 말고 기본값 |

**공통 Negative prompt** (칸이 있으면 세 개 모두에 그대로):
```
camera movement, zoom, pan, dolly, shaking camera, background change, gradient background, vignette, shadow, floor, ground, reflection, glow, light rays, sparkles on background, text, letters, numbers, subtitles, watermark, extra characters, second dog, extra limbs, extra paws, green objects, mint objects, teal objects, blurry, cropped ears, cropped paws, character leaving the frame, ribbon color change
```

## 만들 것 3개

각 문구를 Prompt 칸에 **그대로** 붙여 넣어라(영어 그대로).

### ① 힘내 — 파일 이름 `kling-fighting-1.mp4` (재시도면 `-2`)
```
A fluffy cream-white toy poodle puppy with a small coral-pink ribbon by her left ear sits facing the camera, exactly as in the image. She raises both front paws up to chest height as tiny fists and pumps them up and down twice with a determined, happy cheering face, mouth open. Her floppy ears bounce a little with each pump. Static camera, no zoom, no pan. The background stays a perfectly flat, uniform pure green (#00B140) for the entire video, with no shadow and no floor.
```

### ② 뽀뽀 — 파일 이름 `kling-kiss-1.mp4`
```
A fluffy cream-white toy poodle puppy with a small coral-pink ribbon by her left ear sits facing the camera, exactly as in the image. She closes her eyes happily, puckers her little mouth into a kiss and leans slightly forward toward the camera. One small coral-pink heart pops out near her mouth and floats gently upward, then fades. Static camera, no zoom, no pan. The background stays a perfectly flat, uniform pure green (#00B140) for the entire video, with no shadow and no floor.
```

### ③ 뭐해 — 파일 이름 `kling-what-1.mp4`
```
A fluffy cream-white toy poodle puppy with a small coral-pink ribbon by her left ear sits facing the camera, exactly as in the image. She tilts her head to one side with big curious eyes, blinks twice, then tilts a little further as if asking "what are you doing?", her floppy ears swinging gently. No text and no question mark appear. Static camera, no zoom, no pan. The background stays a perfectly flat, uniform pure green (#00B140) for the entire video, with no shadow and no floor.
```

## 체크리스트 — 결과마다 하나씩 판정

| # | 통과 조건 |
|---|---|
| C1 | **배경이 처음부터 끝까지 같은 평평한 초록**이다. 그림자·바닥·빛 번짐·그라데이션·반짝이가 없다 |
| C2 | **카메라가 고정**이다. 확대·이동·흔들림이 없다 |
| C3 | 꼼이가 **끝까지 화면 안**에 있다. 귀·발·리본이 화면 밖으로 잘리지 않는다 |
| C4 | 꼼이 **생김새가 유지**된다. 리본이 산호색 그대로, 눈·코 모양, 털 색이 시작 그림과 같다 |
| C5 | **동작이 문구와 맞다**(①주먹 두 번 ②뽀뽀+하트 ③갸웃+깜빡임) |
| C6 | **글자·다른 캐릭터·초록/민트/틸 물건**이 없다 |

하나라도 떨어지면 탈락. 탈락이고 상한이 남았으면 같은 설정으로 한 번 더(최대 2번). 두 번 다 탈락이면 덜 나쁜 쪽을 받고 "둘 다 탈락"이라고 적어라. **탈락한 것도 받아 둬라**(어디가 틀렸는지 보려고).

## 받기

- **워터마크 없는** 다운로드를 고른다. 워터마크 없는 다운로드가 안 보이면 **멈추고** 보고(워터마크가 박히면 이모티콘으로 못 쓴다).
- 파일 이름은 위에 적힌 대로. 가능하면 `/Users/mydang/Claude_Code/Kkom-Morning/art/kling/`에 저장, 안 되면 다운로드 폴더에 두고 이름만 맞춰라.

## 기록 규칙

- 본 것만 적어라. 못 본 것은 "못 봄". 추측하지 말 것.
- 화면에 보인 버튼·메뉴 이름은 **그대로** 옮겨라(Kling 화면이 이 문서와 다를 수 있다 — 다르면 다르다고 적어라).
- 판단이 안 서면 멈추고 "여기서 멈췄다".

## 보고 형식 (생성마다)

```
이모티콘: (힘내/뽀뽀/뭐해, 몇 번째)
설정: (모델 이름·모드·길이 — 화면 글자 그대로)
크레딧: (이번에 쓴 것 / 남은 것)
체크리스트: C1 통과/탈락 · C2 … · C6 … (탈락이면 몇 초쯤 무엇이 보였는지)
파일: (이름과 저장 위치)
```
첫 프레임·중간·마지막 프레임 스크린샷 3장.

## 마무리 (꼭 답할 것)

1. 쓴 크레딧 합계와 남은 크레딧.
2. Kling에서 **우리 조건(초록 고정·카메라 고정·글자 없음)을 지키기 가장 어려웠던 것** 하나와, 다음에 바꿀 설정·문구 제안(`[의견]`으로).
