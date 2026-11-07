# 결론 5줄

1. 「처음」은 **수신자가 실제 편지 모달을 처음 연 순간**으로 정의하고, `letterReads`가 아니라 편지 문서의 `firstOpenedAt`으로 기록하는 게 가장 단순해요.
2. 새 편지만 대상으로 `revealVersion: 1`을 넣고, 온라인에서는 Firestore 트랜잭션을 이긴 기기 한 대만 애니메이션을 보여 주세요.
3. 봉투는 두 번째 탭 없이 자동으로 열고, **총 0.7초** 안에 끝내며 `바로 열기`와 동작 줄이기를 지원하는 게 좋아요.
4. 꿀됑과 꼼이는 기존 글씨 없는 그림을 양쪽 귀퉁이에 모두 띄우되, 봉투 단계에서만 한 번 살짝 움직이고 사라지게 하세요.
5. 1차에는 기록·봉투·목록 본문 가림·성능 대응까지 하고, 홈 읽음 기준 통합·감정 자동 선택·새 그림·아이폰 진동은 2차가 안전해요.

## 1. 「처음」의 정의와 기록

### 제안

편지 문서에 다음 두 칸을 추가하는 안을 추천해요.

```ts
revealVersion?: 1
firstOpenedAt?: Timestamp
```

`openedBy`는 필요 없어요. 한 편지에는 `to`로 정해진 수신자가 한 명뿐입니다.

실제 개봉은 다음 순서가 좋아요.

1. 보낸 사람이 자기 편지를 열면 즉시 본문 표시, 기록하지 않음
2. 옛 편지처럼 `revealVersion`이 없으면 즉시 본문 표시
3. 수신자가 `revealVersion: 1`이고 `firstOpenedAt`이 없는 편지를 열면 트랜잭션 실행
4. 트랜잭션을 이긴 기기만 애니메이션 재생
5. 다른 기기는 재시도 중 `firstOpenedAt`을 발견하면 즉시 본문 표시

`letterReads/{이름}`은 건드리지 않는 게 맞아요. 이 값은 편지별 기록이 아니라 최신 편지 ID 하나뿐이고, 실제 모달 개봉이 아니라 `/letters` 진입만으로 갱신됩니다. [`src/lib/letters.ts:90`](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/letters.ts:90), [`src/app/letters/page.tsx:63`](/Users/mydang/Claude_Code/Kkom-Morning/src/app/letters/page.tsx:63)

### 왜 별도 `letterOpens`보다 편지 문서인가

이 앱은 편지마다 수신자가 한 명이라 `firstOpenedAt` 하나면 충분해요.

| 방식 | 판단 |
|---|---|
| `letters/{id}.firstOpenedAt` | 추천. 목록·홈에서도 추가 조회 없이 바로 사용 가능 |
| `letterReads/{이름}` 확장 | 비추천. 최신 ID 커서라는 현재 역할과 충돌 |
| `localStorage`만 사용 | 비추천. 폰·데스크톱 사이에서 중복 재생 |
| 별도 `letterOpens/...` 문서 | 가능하지만 목록 20통의 상태를 별도로 읽어야 해서 과함 |

현재 Firestore 규칙도 `skin` 이외 컬렉션을 모두 열어 두고 있어서, 별도 컬렉션으로 나눈다고 신뢰성이 강해지지는 않습니다. [`firestore.rules:3`](/Users/mydang/Claude_Code/Kkom-Morning/firestore.rules:3)

### 예외 처리

- 보낸 사람: 애니메이션 없음, `firstOpenedAt`도 기록하지 않음
- 두 기기 동시 개봉: 온라인에서는 트랜잭션 승자 한 대만 재생
- 오프라인: 트랜잭션 실패 시 본문을 바로 보여 주는 방식을 추천해요. 애니메이션 때문에 편지가 막히면 안 됩니다.
- 옛 편지: `revealVersion`이 없으면 이미 열린 것으로 간주
- 예약편지: 승격할 때 `revealVersion: 1`을 붙이면, 배포 전 예약했더라도 도착 후 첫 개봉 때 재생 가능
- 예약 도착 전: 지금처럼 `sealed` 상태라 선택 자체가 막혀 있으므로 개봉 기록 금지

예약 승격은 `LetterInboxV3`가 하는 게 아니라 `promoteLetters.ts`가 vault 내용을 병합하고 `sealed:false`로 바꿉니다. [`src/lib/promoteLetters.ts:58`](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/promoteLetters.ts:58)

## 2. 봉투 순간의 순서와 길이

### 제안

목록 카드 탭이 이미 “열겠다”는 행동이므로 두 번째 탭은 요구하지 않고 자동 재생을 추천해요.

총 길이는 **약 700ms**가 적당합니다.

- 0~100ms: 닫힌 봉투와 두 캐릭터가 자리 잡음
- 100~280ms: 덮개가 빠르게 뒤로 젖혀짐
- 220~510ms: 내용 없는 편지지 색 판이 위로 올라옴
- 430~700ms: 봉투와 캐릭터가 사라지고 실제 편지지가 펼쳐짐
- 700ms: 댓글·하트·동봉물을 포함한 평소 읽기 화면

「확 열리는」 느낌은 시간을 늘리는 대신 빠른 `ease-out`과 2~3%의 작은 오버슈트로 만드는 게 좋아요.

### 꼭 필요한 동작

- 우측 상단에 `바로 열기`
- `prefers-reduced-motion`이면 트랜잭션 기록만 하고 즉시 본문
- 화면 바깥을 누르면 기존처럼 닫을 수 있음
- 첫 개봉 중에는 기존 `LetterPaper`의 0.2초 페이드 애니메이션을 중복 재생하지 않음

현재 읽기판 자체가 0.25초 올라오고, 편지지도 다시 0.2초 움직입니다. 새 애니메이션을 그대로 덧붙이면 1초 이상 겹쳐 둔해집니다. [`src/components/letter/LetterReadSheet.tsx:51`](/Users/mydang/Claude_Code/Kkom-Morning/src/components/letter/LetterReadSheet.tsx:51), [`src/components/letter/LetterPaper.tsx:64`](/Users/mydang/Claude_Code/Kkom-Morning/src/components/letter/LetterPaper.tsx:64)

### 색과 도장

현재 테마에는 편지지와 사각형 From 도장 색만 있습니다. 밀랍 도장 색은 없어요. [`src/lib/letterPapers.ts:5`](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/letterPapers.ts:5)

각 테마에 별도 토큰을 넣는 게 안전해요.

```ts
envelope: {
  body: string
  flap: string
  lining: string
  seal: string
  sealInk: string
  labelInk: string
}
```

기존 `stamp`를 밀랍색으로 재사용하면 읽기 화면의 `From. 이름 날짜` 사각 도장까지 바뀝니다. [`src/components/letter/LetterPaper.tsx:171`](/Users/mydang/Claude_Code/Kkom-Morning/src/components/letter/LetterPaper.tsx:171)

봉투 앞면에는 작은 `From. 우댕`만 넣고, 밀랍에는 글자 없이 하트 압인 정도가 좋아요.

### 진동

1차에서는 빼는 게 맞아요. 현재 공용 햅틱은 `navigator.vibrate()`뿐이며 코드에도 iOS 미지원이라고 명시되어 있습니다. [`src/lib/feedback.ts:1`](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/feedback.ts:1)

나중에 네이티브 웹뷰 브리지가 생기면 덮개가 열리는 280ms 지점에 한 번만 넣으면 됩니다.

## 3. 귀퉁이 생각풍선

### 제안

우댕 원문대로 **꿀됑과 꼼이를 둘 다** 보여 주는 방향이 좋아요.

- 꿀됑: 장면의 왼쪽 위
- 꼼이: 오른쪽 아래
- 크기: 64~72px
- 생각풍선 꼬리: 작은 원 2개, 봉투 쪽을 향함
- 움직임: 2~3px 한 번 둥실한 뒤 550ms부터 페이드아웃
- 본문이 나온 뒤에는 완전히 제거
- 장식 이미지이므로 `alt=""`, `aria-hidden="true"`

캐릭터가 편지마다 좌우를 바꾸면 화면이 흔들려 보이므로, 위치는 캐릭터별로 고정하고 보낸 사람 쪽만 약 8px 크게 보여 주는 정도가 좋아요.

### 그림 선택

1차는 두 캐릭터 모두 `calm` 고정을 추천해요.

- 꿀됑: `/emo/kkuldaeng/mood/calm.png`
- 꼼이: `/emo/saidami/calm.webp`

편지 속 미니·큰 이모티콘과 자동 연결하면 “미안해 편지인데 사랑 표정” 같은 오판이 생길 수 있어요. 감정 연결은 2차가 맞습니다.

기존 그림으로 충분하므로 새 그림은 필요 없습니다. 다만 “봉투를 들여다보는 전용 자세”를 원한다면 ChatGPT로 별도 후보를 만든 뒤 우댕 확인을 받아야 해요.

주의할 점은 기존 `moodImage()`를 꼼이에게 쓰면 흰 말티푸가 아니라 포차코가 나온다는 것입니다. 생각풍선에서는 `saidami` 경로를 직접 써야 합니다. [`src/lib/moods.ts:30`](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/moods.ts:30), [`src/lib/miniEmoticons.ts:7`](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/miniEmoticons.ts:7)

## 4. 목록·홈 연결

### 목록

미개봉 받은 편지는 본문·이모티콘·음성 여부를 숨기는 게 맞아요.

현재 목록은 본문 두 줄과 큰 이모티콘까지 먼저 보여 줘서, 봉투를 열기 전에 내용이 노출됩니다. [`src/components/LetterInboxV3.tsx:314`](/Users/mydang/Claude_Code/Kkom-Morning/src/components/LetterInboxV3.tsx:314)

미개봉 카드 문구 예시는 이 정도면 충분해요.

> 꼼이에게서 편지가 왔어요  
> 봉투를 열어 봐

적용 대상은 다음 조건을 모두 만족할 때만입니다.

```ts
letter.to === me &&
letter.revealVersion === 1 &&
!letter.firstOpenedAt
```

보낸 편지와 옛 편지는 지금 미리보기를 유지하세요.

### 홈

홈은 현재도 본문을 노출하지 않고 `💌 상대에게서 새 편지`만 표시하므로 1차에는 그대로 둬도 됩니다. [`src/app/page.tsx:929`](/Users/mydang/Claude_Code/Kkom-Morning/src/app/page.tsx:929)

다만 빨간 점은 “실제로 열지 않음”이 아니라 “편지함에 들어가지 않음” 기준입니다. `/letters`에 들어가는 순간 최신 ID가 기록됩니다. [`src/app/page.tsx:660`](/Users/mydang/Claude_Code/Kkom-Morning/src/app/page.tsx:660)

따라서 1차에는:

- 목록: 실제 미개봉 봉투 처리
- 홈: 기존 편지 아이콘·빨간 점 유지

2차에서 빨간 점까지 `firstOpenedAt` 기준으로 통일하는 게 안전해요.

## 5. 웹뷰 성능과 위험

가장 큰 위험은 봉투 도형이 아니라 동봉된 움짤입니다.

현재 목록과 읽기 화면은 큰 이모티콘의 `imageUrl`을 그대로 `<img>`에 넣습니다. 움짤이면 봉투 애니메이션과 동시에 디코딩될 수 있어요. [`src/components/LetterInboxV3.tsx:93`](/Users/mydang/Claude_Code/Kkom-Morning/src/components/LetterInboxV3.tsx:93), [`src/components/letter/LetterEnclosures.tsx:43`](/Users/mydang/Claude_Code/Kkom-Morning/src/components/letter/LetterEnclosures.tsx:43)

또 별도 영상 스티커는 자동재생·반복입니다. [`src/components/letter/LetterEnclosures.tsx:58`](/Users/mydang/Claude_Code/Kkom-Morning/src/components/letter/LetterEnclosures.tsx:58)

필수 조건은 다음과 같아요.

- 개봉 중에는 실제 `LetterPaper`, 동봉물, 영상 스티커를 마운트하지 않음
- 올라오는 종이는 내용 없는 단색 가짜 종이 판으로 표현
- 개봉 완료 후 실제 편지 내용을 마운트
- 봉투는 CSS 도형과 `transform`, `opacity`만 사용
- 캐릭터는 정지 이미지 사용
- 무한 둥실 애니메이션 금지
- 목록에서는 움직이는 이모티콘의 `thumbUrl` 정지컷 사용
- 390px 폭과 실제 저사양 아이폰에서 동봉 움짤 3개짜리 편지로 검수

코드에도 움짤 여러 개 동시 디코딩이 저사양 기기를 버벅이게 한다는 경고가 이미 있습니다. [`src/lib/stickerPacks.ts:4`](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/stickerPacks.ts:4)

## 6. 단계 나누기

### 1차에 꼭 할 것

- `revealVersion`, `firstOpenedAt` 타입·변환·저장
- 수신자 전용 트랜잭션 개봉
- 예약 승격 때 `revealVersion` 보장
- 0.7초 봉투 UI
- 기존 두 캐릭터의 `calm` 그림
- `바로 열기`
- 동작 줄이기
- 미개봉 목록 본문·동봉물 가리기
- 개봉 완료 전 실제 편지·움짤 지연 마운트
- 390px와 실제 아이폰 확인

### 2차로 미룰 것

- 홈 빨간 점을 실제 개봉 기준으로 변경
- 편지 내용에 따른 캐릭터 표정 자동 선택
- 봉투를 들여다보는 전용 새 그림
- 네이티브 아이폰 햅틱 브리지
- 기념일별 특수 봉투
- 개봉 시각을 상대에게 보여 주는 기능

## 7. Gemini 디자인 의뢰서 초안

Gemini는 Firestore를 다루지 않고 순수 화면만 만드는 구조가 좋아요.

```ts
type Person = '우댕' | '꼼이';
type OpeningPhase = 'closed' | 'opening' | 'opened';

type EnvelopePalette = {
  body: string;
  flap: string;
  lining: string;
  paperPreview: string;
  seal: string;
  sealInk: string;
  labelInk: string;
};

interface EnvelopeRevealProps {
  phase: OpeningPhase;
  fromName: Person;
  toName: Person;
  palette: EnvelopePalette;

  leftCharacterSrc: string;
  rightCharacterSrc: string;

  reducedMotion: boolean;
  durationMs?: number; // 기본 700

  onSkip: () => void;
  onComplete: () => void;
}
```

데이터 연결용 컴포넌트는 Claude 쪽에서 분리하세요.

```ts
type GatePhase = 'checking' | 'closed' | 'opening' | 'opened';

interface LetterOpeningGateProps {
  letterId: string;
  viewer: Person;
  from: Person;
  to: Person;

  deliverySealed: boolean;
  revealVersion?: number;
  firstOpenedAt?: Date | null;
  paperId?: string | null;

  children: React.ReactNode;
}
```

`sealed`라는 UI 상태명은 쓰지 마세요. 현재 코드에서 `sealed`는 “예약편지가 아직 도착하지 않음”이라는 데이터 의미가 있어서 충돌합니다.

### Gemini에 줄 상태 설명

- `checking`: 최초 개봉 권한 확인 중, 닫힌 봉투만 표시
- `closed`: 트랜잭션 승자, 개봉 직전
- `opening`: 덮개 열림 → 가짜 종이 상승 → 봉투 퇴장
- `opened`: 봉투 컴포넌트 제거, 실제 `children` 마운트

### 금지 사항

- Firestore 접근이나 `localStorage` 처리
- 봉투를 드래그하거나 찢는 동작
- 두 번째 탭을 강제하는 동작
- 700ms를 넘는 연출
- GIF·영상·신규 대형 이미지
- 캐릭터 무한 반복 움직임
- 개봉 전에 실제 본문을 DOM에 노출
- 배경음·자동 음성 재생
- 기존 `LetterPaper` 레이아웃 변경
- 밀랍 도장과 기존 From 사각 도장 색을 같은 토큰으로 처리
- 390px에서 캐릭터가 봉투나 `바로 열기`를 가리는 배치

## 설명과 실제 코드가 다른 부분

- `letterReads`는 “실제로 읽은 편지”가 아니라 **편지함 진입 당시 상대 최신 편지 ID**입니다.
- 예약편지의 실제 도착·승격은 `LetterInboxV3`가 아니라 `promoteLetters.ts`가 담당합니다.
- 기본 살구 편지는 `paper` 칸이 저장되지 않습니다. 기본값이 아닌 편지만 저장해요. [`src/lib/letters.ts:273`](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/letters.ts:273)
- 현재 From 도장은 밀랍 도장이 아니라 날짜까지 적힌 사각형 배지입니다.
- 홈 빨간 점은 모달 개봉 여부와 무관하게 `/letters` 진입만으로 꺼집니다.
- 꼼이용 `moodImage()`는 흰 말티푸가 아니라 포차코를 반환합니다.
- 아이폰 진동은 현재 구현으로 작동하지 않습니다.
- 큰 이모티콘 8팩·121종, 꿀됑 12종, 꼼이 미니 22종은 설명과 코드가 일치합니다.

## 우댕이 정할 것

1. 개봉 방식  
   A. 카드 탭 후 자동으로 0.7초 개봉, 추천  
   B. 봉투를 한 번 더 눌러 개봉

2. 캐릭터  
   A. 꿀됑 왼쪽·꼼이 오른쪽 모두 표시, 추천  
   B. 보낸 사람 캐릭터만 표시

3. 옛 편지  
   A. 새 `revealVersion` 편지만 애니메이션, 추천  
   B. `firstOpenedAt`이 없는 옛 편지도 모두 애니메이션

4. 홈 범위  
   A. 1차에는 목록만 미개봉 봉투 처리, 추천  
   B. 홈 빨간 점 기준까지 이번에 함께 변경

5. 그림  
   A. 기존 `calm` 그림으로 먼저 완성, 추천  
   B. 봉투 전용 새 자세를 먼저 제작하고 우댕 확인 후 적용

참고로 Claude 교차 검토를 호출했지만 현재 `ask-claude`가 `Not logged in`으로 종료됐습니다. 로그인 조작은 하지 않았으며, 파일도 수정하지 않았습니다.