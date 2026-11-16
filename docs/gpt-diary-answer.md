우댕, 코드는 수정하지 않고 읽기만 했어요. 프랑스어 다이어리도 찾았습니다.

## 1. 결론 5줄

1. 기존 달력은 일정 관리로 유지하고, 다꾸 다이어리는 별도 기능으로 두는 게 맞아요.
2. 기본 화면은 월·주가 아니라 오늘의 세로형 「하루 한 장」이고, 좌우 넘김과 월 선택창만 붙여요.
3. 1차는 날짜마다 우댕 장·꼼이 장 두 장만 만들고, 함께 편집하는 장은 충돌이 생기므로 2차로 미뤄요.
4. 이동 중에는 React 상태를 바꾸지 않고 DOM transform만 갱신하며, 사진 4장·장식 30개로 먼저 검증해요.
5. 1차 핵심은 복잡한 자유 편집보다 「오늘 재료 자동 가져오기 → 1분 꾸미기 → 자동저장」이에요.

## 2. 핵심 경험

### 기본 흐름

- 홈의 `다이어리` 카드를 누르면 오늘 내 장이 바로 열려요.
- 빈 배경을 좌우로 밀면 어제·다음 날로 이동해요. 화면 가장자리 화살표도 함께 둬요.
- 상단 날짜를 누르면 월 선택창이 올라오고, 작성한 날만 작은 스티커 점으로 보여요.
- 주간 보기는 1차에서 빼요. 폰에서는 월 선택과 하루 편집 사이에 주간이 끼어 동선만 늘어납니다.
- 페이지는 폰에 맞는 세로 3:4 비율로 만들고 좌표는 0~1로 저장해요. 기존 낙서장도 화면 크기 차이를 막기 위해 정규화 좌표를 씁니다. [canvasBoard.ts:1](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/canvasBoard.ts:1)

프랑스어 다이어리의 월간→주간→일간 연결과 일간의 날씨·기분·일기 구성은 참고하되, 폰용 꼼모닝에서는 일간을 중심으로 줄이는 게 좋아요. [diary-2027/index.html:607](</Users/mydang/Claude_Code/한스푼 서점/books/diary-2027/index.html:607>) [diary-2027/index.html:635](</Users/mydang/Claude_Code/한스푼 서점/books/diary-2027/index.html:635>)

### 한 장에 올리는 것

1차:

- 일기 본문 1개
- 사진 최대 4장
- 정지 스티커
- 마스킹테이프
- 도장
- 날짜·기분·날씨·일정 칩
- 종이 배경 4종: 무지·줄·모눈·크림

마스킹테이프와 도장은 별도 편집 엔진이 아니라 스티커와 같은 물건으로 처리해요. 손글씨는 기존 낙서장 자산을 활용할 수 있지만, 제스처 충돌과 데이터량 때문에 2차가 안전합니다. 기존에는 손글씨 획을 별도로 저장하고 있습니다. [canvasBoard.ts:22](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/canvasBoard.ts:22)

### 가장 안전한 손짓

- 스티커 탭: 선택
- 선택한 스티커 끌기: 이동
- 하단 버튼: `작게`, `크게`, `↺`, `↻`, `앞으로`, `복제`, `삭제`
- 빈 배경 밀기: 날짜 이동
- 두 손가락 확대·회전, 길게 누르기: 1차 제외

자유 회전 핸들보다 15도씩 돌리는 버튼이 한 손 사용과 웹뷰 안정성에 더 좋아요. 이동 중에는 `ref + requestAnimationFrame`으로 `translate3d`만 바꾸고, 손을 뗄 때 한 번 저장해요. 사진 확대 기능도 같은 방식으로 버벅임을 피하고 있습니다. [ZoomableImage.tsx:43](/Users/mydang/Claude_Code/Kkom-Morning/src/components/ZoomableImage.tsx:43) [ZoomableImage.tsx:96](/Users/mydang/Claude_Code/Kkom-Morning/src/components/ZoomableImage.tsx:96)

## 3. 기존 달력과의 관계

대체하지 않고 같이 씁니다.

- 달력: 미래 일정 등록·장소·시간·알림
- 다이어리: 지나간 하루를 글과 사진으로 꾸미기
- 하루 장 상단: 그날 일정과 공휴일을 읽기 전용 칩으로 표시
- 일정 칩 탭: 기존 달력 편집창으로 이동
- 다이어리 월 선택창: 일정 제목을 넣지 않고 기념일 표시와 작성 여부만 표시

기존 일정에는 날짜 범위·시간·장소·알림이 이미 있습니다. [calendar.ts:15](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/calendar.ts:15) 달력은 현재 월 보기와 날짜 바텀시트 구조이므로 그대로 유지할 가치가 있어요. [calendar/page.tsx:127](/Users/mydang/Claude_Code/Kkom-Morning/src/app/calendar/page.tsx:127)

생일·기념일은 `specialDates`로 따로 관리하는 안을 추천해요.

```ts
specialDates/{id} {
  label: string
  kind: 'birthday' | 'anniversary' | 'custom'
  monthDay: '09-28'
  startYear?: 2023
  repeat: 'yearly'
  owner: '우댕' | '꼼이' | 'together'
  decorationId?: string
}
```

- 매년 자동 반복
- 시작 연도가 있으면 `우리 4주년`처럼 계산
- 달력과 다이어리가 같은 데이터를 표시
- 현재 코드에 박혀 있는 두 사람 생일과 2023-09-28을 초기 데이터로 옮김

현재 생일은 코드 상수이고, 함께한 날도 홈 코드에 직접 들어 있습니다. [birthday.ts:7](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/birthday.ts:7) [page.tsx:342](/Users/mydang/Claude_Code/Kkom-Morning/src/app/page.tsx:342)

## 4. 둘이 쓰는 방식

1차 추천은 날짜마다 두 장입니다.

- `내 장`: 나만 편집
- `상대 장`: 보기만 가능
- 상단 `우댕 | 꼼이` 전환
- 같은 장 공동 편집과 `우리 장`은 2차
- 상대 장 스티커 반응도 2차
- 작성일 연속 기록, “3일째 안 썼어요”, 비교 통계는 넣지 않음

중요한 제한이 있어요. 현재는 Firebase Auth가 없고 Firestore와 Storage가 사실상 열려 있습니다. 따라서 클라우드에 저장한 장을 진짜 `나만 보기`로 보장할 수 없어요. [firestore.rules:3](/Users/mydang/Claude_Code/Kkom-Morning/firestore.rules:3) [storage.rules:7](/Users/mydang/Claude_Code/Kkom-Morning/storage.rules:7)

그래서 1차에서는:

- 저장 전 초안은 내 폰에만 임시보관
- 클라우드에 올린 장은 둘이 같이 봄
- `비공개`라는 오해를 주는 버튼은 만들지 않음

진짜 비공개는 2차에서 Firebase Auth와 보안 규칙을 먼저 붙인 뒤 제공해야 해요.

## 5. 추천 기능 10개

| 단계 | 기능 | 설명과 이유 |
|---|---|---|
| 1차 | 오늘의 재료함 | 그날 기분·날씨·일정·꼼톡 사진 후보를 한 서랍에 모아 빈 장에서 시작하는 부담을 줄여요. |
| 1차 | 우리 스티커 서랍 | 꿀됑·꼼이·우리 팩을 그대로 사용해 꼼모닝만의 다꾸가 됩니다. 기존 팩 구조도 이미 사람별로 나뉘어 있어요. [emoticons.ts:194](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/emoticons.ts:194) |
| 1차 | 최근·즐겨찾기 | 수백 장을 매번 찾지 않고 자주 쓰는 12개부터 한 손으로 붙여요. |
| 1차 | 기념일 자동 장식 | 생일에는 케이크, 9월 28일에는 커플 도장이 자동으로 후보에 떠요. 강제로 붙이지는 않아요. |
| 1차 | 빈 장 질문 한 줄 | “오늘 둘이 가장 웃었던 일은?” 같은 짧은 질문으로 일기 시작을 도와요. AI 호출 없이 로컬 문구로 충분해요. |
| 1차 | 저장 복구 | 편집 중 내용을 로컬에 즉시 보관해 앱이 꺼져도 복구해요. 웹뷰 앱에서는 필수 안전장치예요. |
| 2차 | 작년 오늘 | 같은 날짜의 예전 장과 사진을 한 장만 제안해 추억 기능과 자연스럽게 연결해요. |
| 2차 | 월말 한 장 | 그달 대표 사진·기분·기념일을 골라 월간 표지 한 장을 만들어요. |
| 2차 | 스티커 답장 | 상대 장을 고치지 않고 가장자리 여백에 스티커 하나로 반응해요. 장부 느낌 없이 교감만 남아요. |
| 2차 | 봉인 장 | 작성자가 정한 날짜에 함께 열리는 장이에요. 기존 타임캡슐 톡과 잘 어울립니다. |

기분은 이미 사람+날짜 단위로 저장되므로 자동 재료로 가져오기 좋습니다. [moods.ts:50](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/moods.ts:50)

## 6. 데이터 모양

1차에는 물건마다 하위 문서를 만들지 말고, 메타 문서와 내용 문서를 나누는 안을 추천해요.

```ts
diaryPages/{YYYY-MM-DD_owner} {
  date: string
  owner: '우댕' | '꼼이'
  themeId: string
  itemCount: number
  hasPhoto: boolean
  excerpt: string
  schemaVersion: 1
  revision: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

diaryPages/{pageId}/content/main {
  body: {
    text: string
    fontSize: number
    color: string
    align: 'left' | 'center'
  }
  items: DiaryItem[]
}

DiaryItem {
  id: string
  type: 'sticker' | 'photo' | 'tape' | 'stamp'
  assetId?: string
  imageUrl?: string
  x: number       // 0~1
  y: number       // 0~1
  w: number       // 0~1
  h: number       // 0~1
  rotation: number
  z: number
  opacity: number
}
```

이유:

- 월 목록은 가벼운 `diaryPages` 메타만 최대 62개 읽어요.
- 하루를 열 때만 `content/main` 하나를 읽어요.
- 물건 30개 수준이면 배열이 단순하고 읽기 한 번, 저장 한 번으로 끝나요.
- 아이템 하위 컬렉션은 공동 실시간 편집을 붙이는 2차에만 검토해요.

사진 경로:

```text
diary/{owner}/{YYYY}/{MM}/{pageId}/{photoId}/display.webp
diary/{owner}/{YYYY}/{MM}/{pageId}/{photoId}/thumb.webp
```

표시용은 긴 변 1600px, 썸네일은 320px 정도를 권해요. Firestore에 base64 사진을 넣으면 기존 추억 기능처럼 문서가 무거워지는 문제가 다시 생깁니다. [memories.ts:46](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/memories.ts:46)

꼼톡 사진을 가져올 때는 URL만 참조하지 말고 다이어리 폴더로 복사해야 해요. 꼼톡 메시지를 지우면 원본 Storage 파일도 삭제되기 때문입니다. [chat.ts:162](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/chat.ts:162)

## 7. 성능과 위험

1차 안전선:

- 사진 최대 4장
- 스티커·테이프·도장 합계 30개
- 애니메이션 스티커는 다이어리에서는 정지컷만 사용
- 현재 장만 DOM에 올리고, 이전·다음 장은 메타만 미리 읽기
- 이동 중 React `setState` 금지
- `pointerup` 때 좌표 저장, 텍스트는 800ms 지연 저장
- `will-change`는 선택 중인 물건 하나에만 적용
- 사진은 썸네일 먼저 보여 주고 표시용 파일은 비동기 디코딩
- 월 화면에서 사진과 아이템 내용은 절대 읽지 않기
- 느린 기기에서 30개·사진 4장·빠른 연속 이동을 실제 아이폰 웹뷰로 검수한 뒤 한도를 올리기

기존 스티커 코드도 여러 움짤을 동시에 디코딩하면 버벅인다고 명시하고 정지 썸네일을 씁니다. [stickerPacks.ts:4](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/stickerPacks.ts:4)

## 8. 단계

### 1차

- 홈 다이어리 카드
- 오늘 하루 장, 날짜 넘김, 월 선택창
- 우댕 장·꼼이 장
- 본문·사진·정지 스티커·테이프·도장
- 오늘의 재료함
- 생일·기념일·일정 칩
- 자동저장과 로컬 복구
- 최근·즐겨찾기 스티커
- 정지 화면 성능 검수

### 2차

- `우리 장` 공동 편집
- 상대 장 스티커 반응
- 손글씨
- 작년 오늘
- 월말 한 장
- 봉인 장
- Firebase Auth 이후 진짜 나만 보기
- 사용 성능을 확인한 뒤 사진·아이템 한도 상향

## 9. Gemini 디자인 의뢰서 초안

```text
꼼모닝의 아이폰용 「다꾸 다이어리」 UI를 설계해 주세요.

조건
- 390×844px 아이폰 기준, 라이트 모드 전용
- 한 손 사용, 세로 3:4 종이 한 장이 중심
- 귀엽지만 유치하지 않은 크림 종이·연한 파스텔
- 큰 글씨 밀어 넣기, 흐린 소문자, 과한 색과 애니메이션 금지
- Firebase 연결과 데이터 로직은 Claude가 담당
- 컴포넌트는 mock props와 callback만 구현
- 편집 중 화면과 완성 장 보기 화면을 모두 제작

화면
1. DiaryDayScreen
2. DiaryMonthSheet
3. DiaryAssetDrawer
4. DiaryMaterialTray
5. DiaryEmptyState
6. DiaryViewMode

컴포넌트와 props

DiaryDayScreen {
  date: string
  me: '우댕' | '꼼이'
  pageOwner: '우댕' | '꼼이'
  mode: 'view' | 'edit'
  saveState: 'saved' | 'saving' | 'offline'
  page: DiaryPageVM
  items: DiaryItemVM[]
  onPrevDate(): void
  onNextDate(): void
  onOpenMonth(): void
  onChangeOwner(owner): void
  onOpenAssets(tab): void
  onEditText(text): void
  onSelectItem(id): void
}

DiaryPaper {
  theme: 'cream' | 'plain' | 'lined' | 'grid'
  ratio: '3:4'
  editable: boolean
  selectedItemId?: string
  items: DiaryItemVM[]
  onMove(id, x, y): void
  onBackgroundSwipe(direction): void
}

DiaryObjectToolbar {
  itemId: string
  onSmaller(): void
  onLarger(): void
  onRotateLeft(): void
  onRotateRight(): void
  onBringForward(): void
  onDuplicate(): void
  onDelete(): void
}

DiaryAssetDrawer {
  open: boolean
  tab: 'recent' | 'favorite' | 'kkomi' | 'kkul' | 'couple' | 'decor'
  assets: DiaryAssetVM[]
  onTabChange(tab): void
  onPick(assetId): void
  onClose(): void
}

DiaryMaterialTray {
  mood?: MoodVM
  weather?: WeatherVM
  events: EventVM[]
  chatPhotos: PhotoVM[]
  prompts: PromptVM[]
  onAddMaterial(id): void
}

OwnerSwitcher {
  me: '우댕' | '꼼이'
  selected: '우댕' | '꼼이'
  hasPage: Record<'우댕' | '꼼이', boolean>
  onChange(owner): void
}

월 선택창에는 작성 여부·생일·기념일만 작게 표시하고,
일정 제목이나 사진 썸네일로 복잡하게 만들지 마세요.
자유 핀치 확대·회전 UI는 만들지 말고 하단 버튼 편집을 사용하세요.
```

## 10. 우댕이 정할 것

1. 장 구성  
   A. 각자 장 두 개  
   B. 둘이 함께 쓰는 장 하나  
   C. 각자 장+우리 장 세 개  
   추천: **A**. 가장 단순하고 서로의 기록도 온전히 남아요.

2. 공개 방식  
   A. 저장한 장은 둘이 같이 보고, 저장 전 초안만 내 폰  
   B. Firebase Auth부터 붙이고 진짜 비공개 지원  
   추천: **A로 작게 시작**, 비공개가 꼭 필요하면 B를 먼저 해야 해요.

3. 조작 방식  
   A. 끌어서 이동, 크기·회전은 하단 버튼  
   B. 모서리 핸들로 자유 변형  
   C. 두 손가락 변형  
   추천: **A**. 한 손과 웹뷰 성능에 가장 안전해요.

4. 1차 사진 수  
   A. 최대 4장  
   B. 최대 6장  
   추천: **A**. 실제 아이폰 검수 후 늘려요.

5. 첫 화면  
   A. 오늘 하루 장  
   B. 월 달력  
   C. 주간  
   추천: **A**. 우댕 요청인 「폰으로 간단하게 하루 한 장」에 가장 정확해요.

참고로 Claude CLI 교차 검토도 요청했지만 현재 기기에서 `Not logged in`으로 막혀 Claude 의견은 미확인입니다. 위 내용은 확인한 코드와 프랑스어 다이어리를 바탕으로 한 GPT 회의안입니다.