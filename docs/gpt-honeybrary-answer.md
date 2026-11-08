# 결론 7줄

1. 「제목만 허니브러리로 변경」은 불가능합니다. 화면은 가져올 수 있지만 방·uid·다크 모드·삭제 API를 꼼모닝 방식으로 다시 연결해야 합니다.
2. 새 경로 `/library`는 비어 있습니다. 옛 「우리들의 서재」는 `/novel`이라 기술적 충돌은 없습니다.
3. 사이브러리의 핵심인 공유 책 한 권, 사람별 진행, 세 책장 칸, 읽는 중 기록과 한 줄 잇기는 그대로 가져가는 게 맞습니다.
4. 리뷰는 책×사람당 하나로 두고, 정수 별 1~5·키워드 최대 3개·사진 최대 5장·한 줄·본문·스포일러를 지원하길 권합니다.
5. 별은 ‘책의 객관적 점수’가 아니라 ‘내 독서 경험’으로 다루고, 평균·합산·나란히 비교·별점 정렬은 넣지 않아야 따뜻함이 유지됩니다.
6. 사진은 원본과 작은 판을 함께 만들고 Storage 경로까지 저장해야 합니다. 꼼모닝의 레시피·위시·시집 사진 코드는 그대로 복사하면 안 됩니다.
7. 홈은 권수 없는 2×1 카드를 추천합니다. 1×1을 추가하면 현재 홈의 ‘1×1은 짝수로 배치’ 규칙이 깨져 반 칸이 남습니다.

Claude CLI에도 교차검수를 요청했지만 현재 `Not logged in · Please run /login` 상태였습니다. 로그인·인증은 대신 처리하지 않았으므로, 아래는 제가 코드와 공식 자료를 직접 대조한 결론입니다.

## 1. 무엇을 그대로, 무엇을 바꿀지

### 그대로 가져갈 것

- 책 한 권을 공유하고 진행만 사람별로 분리합니다.
- 상태는 `reading | done | shelved`, 문구는 `읽는 중 | 다 읽음 | 책장에 두기`를 유지합니다.
- 한 사람이라도 읽는 중이면 「요즘」, 그다음 다 읽은 사람이 있으면 「다 읽은」, 나머지는 「책장에 둔 책」으로 분류합니다.
- 현재 쪽·전체 쪽은 선택이고 퍼센트는 저장하지 않고 화면에서 계산합니다.
- 기록은 글·쪽수·사진 한 장을 선택적으로 받고 오래된 것부터 보여 줍니다.
- 기록의 `parentNoteId`로 한 단계만 잇습니다.
- 진행 변경 시각·권수·연속 기록·하트·미응답 수·알림은 넣지 않습니다.

근거는 [library.ts](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:37), [library.ts](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:117), [library.ts](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:126), [library.ts](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:207)입니다.

### 꼼모닝에 맞게 바꿀 것

추천 컬렉션은 방 없는 최상위 세 개입니다.

| 컬렉션 | 문서 ID | 핵심 필드 |
|---|---|---|
| `honeyBooks` | 자동 ID | `title`, `coverUrl?`, `coverThumb?`, `coverPath?`, `coverThumbPath?`, `placedBy`, `readers`, `createdAt` |
| `honeyBookNotes` | 자동 ID | `bookId`, `by`, `text?`, `page?`, `photo*?`, `parentNoteId?`, `createdAt` |
| `honeyBookReviews` | `${bookId}_udaeng` 또는 `${bookId}_kkomi` | `bookId`, `by`, `rating?`, `keywords[]`, `headline?`, `body?`, `photos[]`, `hasSpoiler`, `reply?`, `createdAt`, `updatedAt` |

`readers`는 다음 형태가 적합합니다.

```ts
type Person = '우댕' | '꼼이';

type Reading = {
  status: 'reading' | 'done' | 'shelved';
  current?: number;
  total?: number;
};

readers: Partial<Record<Person, Reading>>;
```

사이담의 `authorUid`는 책 저자라는 뜻으로 오해되므로 꼼모닝에서는 `placedBy`로 바꾸고, 기록·리뷰 작성자는 `by`로 통일하는 편이 명확합니다. 꼼모닝의 실제 신원도 로컬 로그인 코드에서 이름으로 바뀝니다. [page.tsx](/Users/mydang/Claude_Code/Kkom-Morning/src/app/page.tsx:282)

현재 Firestore와 Storage는 실제로 `skin` 외에는 열려 있습니다. 따라서 이름값은 신원 표시에 불과하고 보안상 위조를 막지는 못합니다. 둘만 쓰는 앱이라는 전제를 유지할 때만 허용할 구조입니다. [firestore.rules](/Users/mydang/Claude_Code/Kkom-Morning/firestore.rules:6), [storage.rules](/Users/mydang/Claude_Code/Kkom-Morning/storage.rules:6)

### 원본에서 함께 고쳐야 할 부분

- 상세 화면에 내 진행이 없으면 `나도 읽기`가 나타나야 합니다. 사이담 데이터 함수는 새 사람을 넣을 수 있지만 UI는 기존 내 줄이 있을 때만 고치기 버튼을 보여 줍니다. [책 화면](/Users/mydang/Claude_Code/saidam/src/app/library/[bookId]/page.tsx:87)
- 원 기록을 지울 때 연결된 한 줄도 함께 지우는 편이 낫습니다. 사이담은 원 기록을 지워도 답글을 남기고, 그 답글이 최상위 기록으로 승격됩니다. [책 화면](/Users/mydang/Claude_Code/saidam/src/app/library/[bookId]/page.tsx:62), [책 화면](/Users/mydang/Claude_Code/saidam/src/app/library/[bookId]/page.tsx:340)
- 표지 교체 시 예전 표지 파일도 지워야 합니다. 사이담은 새 URL만 덮어써서 이전 표지가 Storage에 남습니다. [library.ts](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:167)
- 업로드 후 문서 저장이 실패하면 방금 올린 파일을 되지우는 정리 절차가 필요합니다.

### 사진 경로와 삭제

추천 경로:

```text
honeybrary/books/{bookId}/cover/{timestamp}_{person}.jpg
honeybrary/books/{bookId}/cover/{timestamp}_{person}_t.jpg

honeybrary/notes/{noteId}/{timestamp}.jpg
honeybrary/notes/{noteId}/{timestamp}_t.jpg

honeybrary/reviews/{reviewId}/{photoId}.jpg
honeybrary/reviews/{reviewId}/{photoId}_t.jpg
```

URL뿐 아니라 `path`와 `thumbPath`도 저장해야 교체·삭제가 확실합니다.

책 삭제는 다음 범위를 한 번에 처리해야 합니다.

1. 해당 `bookId`의 기록과 리뷰를 조회합니다.
2. 표지·기록·리뷰의 원본과 작은 판을 삭제합니다.
3. 기록의 이어진 말, 리뷰 문서, 책 문서를 450개 단위 batch로 삭제합니다.
4. 파일 삭제가 실패하면 문서 삭제를 멈추고 재시도 상태를 보여 줍니다. `object-not-found`만 성공으로 간주합니다.

꼼모닝의 기존 레시피·위시는 원본만 올리고 문서만 지우며, 작은 판과 Storage 삭제가 없습니다. [recipes.ts](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/recipes.ts:100), [wishlist.ts](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/wishlist.ts:162), [poems.ts](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/poems.ts:125)

## 2. 리뷰 설계

네이버는 현재 별점과 함께 키워드·사진/영상·텍스트를 유지하고, 업종별 키워드를 선택형으로 제공합니다. 사업주 답글은 작성·수정·삭제할 수 있습니다. [네이버 별점 안내](https://help.naver.com/service/19485/contents/25093?osType=MOBILE), [네이버 키워드 안내](https://help.naver.com/service/30026/contents/20504?lang=ko&osType=COMMONOS), [네이버 답글 안내](https://help.naver.com/service/19485/contents/12293?osType=MOBILE)

배민 공식 자료에서도 별점·사진·리뷰·사장님 댓글과 사람 간 소통을 확인할 수 있습니다. 다만 자료의 「도움돼요」는 배민 앱 리뷰가 아니라 외식업광장 콘텐츠 반응 버튼입니다. 허니브러리에 가져올 근거로 보면 안 됩니다. [배민 공식 리뷰 글](https://ceo.baemin.com/guide/10856)

### 추천 리뷰 구성

- 책×사람당 리뷰 하나, 언제든 수정 가능
- 완독하면 `내 감상 남기기`를 눈에 띄게 보여 주되 읽는 중에도 작성 가능
- 별점은 정수 1~5, 반 별 없음
- 별점은 선택 사항
- 별·키워드·글·사진 중 하나만 있어도 저장 가능
- 한 줄 제목 40자, 본문 600자
- 사진 최대 5장
- 리뷰 전체 스포일러 토글 하나
- 상대의 한마디는 리뷰당 하나, 수정 가능, 대댓글 없음

별점 질문은 `이 책은 몇 점?`보다 다음 문구가 적합합니다.

> 이번 독서 경험은 어땠어요?

`다시 읽고 싶음`을 별도 점수축으로 만들면 평가표가 됩니다. 키워드 하나로 두는 편이 낫습니다.

### 키워드 12개, 최대 3개

- 술술 읽혔어요
- 문장이 예뻐요
- 인물이 오래 남아요
- 생각할 거리가 있어요
- 새로운 걸 알았어요
- 마음이 따뜻해져요
- 웃음이 났어요
- 여운이 길어요
- 함께 이야기하고 싶어요
- 다시 펼치고 싶어요
- 천천히 읽고 싶어요
- 취향을 탈 수 있어요

메뉴별 맛·양처럼 여러 축을 점수화하는 항목별 평가는 빼는 게 좋습니다. 별 하나와 감상 키워드만으로 충분합니다.

### 기록과 리뷰의 관계

- `기록`: 읽는 중 여러 번 남기는 밑줄·쪽수·장면
- `리뷰`: 그 책에 대한 한 사람의 정리된 감상 하나
- 자동 합치거나 변환하지 않습니다.
- 기록의 「한 줄 잇기」와 리뷰의 「상대 한마디」는 데이터도 분리합니다.
- 화면에서는 같은 생각풍선 디자인을 재사용해 통일감만 줍니다.

사이담의 현재 「한 줄 잇기」는 상대만 쓰는 구조도, 하나만 쓰는 구조도 아닙니다. 원 작성자도 이어 쓸 수 있고 여러 개를 달 수 있습니다. [책 화면](/Users/mydang/Claude_Code/saidam/src/app/library/[bookId]/page.tsx:319)

### 사진 안내 문구

> 표지 · 오래 남은 문장 · 함께 읽은 자리

밑줄 사진은 글자가 중요하므로 전체판은 긴 변 1600px JPEG 0.8, 작은 판은 480px JPEG 0.7을 권합니다. 업로드는 동시에 두 장까지만 처리합니다.

### 스포일러

필요합니다. `hasSpoiler`가 켜진 리뷰는 작성자·별·일반 키워드만 보여 주고 한 줄 제목·본문·사진은 모두 가립니다.

> 스포일러가 있어요 · 눌러서 보기

사진별 스포일러는 2차로 미룹니다.

## 3. 장부·평가가 되지 않게 하는 장치

- 두 사람 별점을 한 줄이나 두 칸에 나란히 놓지 않습니다.
- 평균·합산·분포를 계산하지 않습니다.
- 책장 카드와 홈 카드에는 별을 표시하지 않습니다.
- 별점순 정렬·필터를 만들지 않습니다.
- `우댕의 추천 책` 대신 `우댕이 놓은 책`이라고 씁니다.
- 상대 리뷰가 없을 때 빈 별이나 `아직 리뷰 없음`을 표시하지 않습니다.
- 리뷰 카드는 `우댕의 감상`, `꼼이의 감상`처럼 세로로 각각 보여 줍니다.
- 올해 권수·연속 기록·리뷰 수·도움돼요·알림은 넣지 않습니다.

사이담이 진행 시각과 각종 수치를 의도적으로 제외한 이유는 코드와 점검 스크립트에도 반영돼 있습니다. [library.ts](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:8), [check-library.mjs](/Users/mydang/Claude_Code/saidam/scripts/check-library.mjs:30)

## 4. 화면 흐름

### 책장

1. 헤더 `허니브러리` / `각자 읽고, 서로 한 줄씩`
2. 요즘 읽는 책
3. 다 읽은 책
4. 책장에 둔 책
5. 하단 `책 놓기`

책은 작은 표지, 제목, 사람별 진행만 보여 줍니다. 별점과 권수는 없습니다.

### 책 놓기

한 장짜리 bottom sheet가 적합합니다.

- 표지 선택
- 책 제목
- 누가 읽는지: `나 / 꼼이 / 같이`
- 현재 쪽·전체 쪽 선택
- 저장

### 책 화면

1. 표지·제목
2. 두 사람 진행
3. `나도 읽기` 또는 `내 진행 고치기`
4. `읽으며 남긴 기록`
5. `둘의 감상`
6. 하단 `기록 남기기` / `리뷰 쓰기` 두 동작

현재 사이담처럼 입력창을 항상 고정하면 리뷰 기능이 추가된 뒤 화면이 복잡해집니다. 두 버튼을 누르면 각각 sheet가 열리는 편을 추천합니다.

### 리뷰 쓰기

배민식 여러 단계보다 한 화면 세 구획이 낫습니다.

1. `이번 독서 경험` — 별·키워드
2. `남긴 장면` — 사진
3. `한 줄과 감상` — 제목·본문·스포일러

입력량이 크지 않아 3단계 마법사는 클릭만 늘립니다.

### 홈 카드

추천은 2×1입니다.

- 로고: 책 읽는 꿀됑 + `허니브러리`
- 읽는 책이 있으면: 표지 작은 판·제목·`우댕 · 182 / 320쪽`
- 없으면: `둘이 읽는 책을 놓고, 한 줄씩 남겨요`
- 권수와 새 리뷰 수 없음

사이담도 로고와 현재 책을 위해 2×1을 사용합니다. [사이담 홈 카드](/Users/mydang/Claude_Code/saidam/src/app/space/[id]/page.tsx:982), [SaibraryLogo.tsx](/Users/mydang/Claude_Code/saidam/src/components/library/SaibraryLogo.tsx:17)

꼼모닝은 현재 1×1 카드를 짝수쌍으로 두도록 명시돼 있습니다. [page.tsx](/Users/mydang/Claude_Code/Kkom-Morning/src/app/page.tsx:81) 1×1을 고르면 시집 등 기존 카드 하나를 2×1로 바꾸거나 다른 1×1 기능을 함께 추가해야 합니다.

## 5. 「편지처럼 예쁘게」

가져올 것:

- `꿀빛` 편지지의 따뜻한 밀랍색과 가장자리 음영
- 24px 안쪽 여백, 16px 본문, 넉넉한 줄간격
- 작성자 표시용 작은 사인 스티커
- 상대 한마디용 생각풍선
- 리뷰 완료 상태의 작은 밀랍 도장
- 빈 책장과 홈 카드의 정적인 꿀됑 그림

`꿀빛`은 이미 `#F8E7BE` 바탕과 갈색 잉크·비네팅을 갖고 있습니다. [letterPapers.ts](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/letterPapers.ts:125) 사인 스티커와 생각풍선도 컴포넌트 구조를 재사용할 수 있습니다. [SignedSticker.tsx](/Users/mydang/Claude_Code/Kkom-Morning/src/components/letter/SignedSticker.tsx:10), [ThoughtBubble.tsx](/Users/mydang/Claude_Code/Kkom-Morning/src/components/letter/ThoughtBubble.tsx:33)

가져오지 않을 것:

- 리뷰를 열 때마다 봉투 개봉 애니메이션
- 화면 전체 벌집 반복 무늬
- 모든 리뷰를 서로 다른 편지지로 표시
- 본문 전체 손글씨
- 계속 둥실거리는 캐릭터
- 반짝이·종이 질감·그라디언트를 한꺼번에 사용

벌집은 카드 모서리의 2~3칸 워터마크나 완료 도장 하나에만 쓰는 게 좋습니다. 기존 편지지도 반복 점·발바닥·체크 무늬가 촌스럽다는 평가를 받아 교체됐습니다. [letterPapers.ts](/Users/mydang/Claude_Code/Kkom-Morning/src/lib/letterPapers.ts:2)

## 6. 성능과 위험

반드시 반영할 것:

- 전체판·작은 판 동시 생성
- 책장·홈·리뷰 카드에서는 작은 판만 사용
- 확대 화면을 열 때만 전체판 로드
- `loading="lazy"`, `decoding="async"`, 사진 너비·높이 저장
- 리뷰 사진 최대 5장, 동시 업로드 2장
- 책 목록 최초 30권 + 더 보기
- 기록은 최신 30개를 받아 화면에서 오래된 순으로 뒤집고 `이전 기록 보기`
- 리뷰는 최대 두 문서라 별도 페이지 나누기 불필요
- 꿀됑은 정적 WebP 한 장
- 애니메이션은 탭 축소·sheet 이동·사진 fade 정도만
- `prefers-reduced-motion` 대응

사이담은 목록 200권을 한 번에 렌더링하고 기록을 오래된 순 `limit(500)`으로 받습니다. 500개가 넘으면 최신 기록이 빠지는 문제도 있습니다. [library.ts](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:35), [library.ts](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:207)

최종 꿀됑 WebP는 약 27KB라 그대로 활용하기에 충분히 가볍습니다. [SaibraryLogo.tsx](/Users/mydang/Claude_Code/saidam/src/components/library/SaibraryLogo.tsx:15)

## 7. 단계 나누기

### 1차에 반드시

- `/library` 허니브러리 책장
- 공유 책·사람별 진행·세 책장 칸
- `나도 읽기`와 진행 수정
- 기록·쪽수·사진 한 장·한 줄 잇기
- 사람당 리뷰 하나와 수정·삭제
- 정수 별 1~5, 키워드 최대 3개
- 한 줄·본문·사진 최대 5장
- 리뷰 전체 스포일러
- 상대 한마디 하나
- 사진 전체판·작은 판·Storage 경로 저장
- 책·기록·리뷰 삭제 시 사진까지 정리
- 30개 단위 더 보기
- 홈 카드

### 2차

- 리뷰 임시저장
- 사진 순서 바꾸기
- 자르기·블러
- 사진별 스포일러
- 밑줄 사진만 모아 보기
- 기록에서 리뷰 초안으로 문장 가져오기
- ISBN·책 검색·자동 표지

평균·연속 기록·연간 권수·좋아요·도움돼요는 2차에도 제외하길 권합니다.

## 8. Gemini 디자인 의뢰서 초안

아래를 그대로 넘기면 됩니다.

```text
꼼모닝의 새 기능 「허니브러리」 프레젠테이션 컴포넌트를 디자인해 줘.

환경
- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- framer-motion, lucide-react 사용 가능
- 라이트 모드 전용, iPhone WebView, 기준 폭 390px
- Firebase·구독·저장 로직은 넣지 말고 props와 callback만 사용
- 모든 입력 글자 16px 이상, 터치 영역 44px 이상
- prefers-reduced-motion 대응
- 지속 애니메이션과 큰 배경 이미지는 금지

디자인 방향
- 따뜻한 저채도 꿀빛·크림 종이, 충분한 여백
- 빽빽한 벌집 반복 무늬 금지
- 벌집은 모서리 장식 2~3칸 또는 작은 도장 한 번만
- 책 읽는 꿀됑은 홈 카드·빈 상태에만 정적으로 사용
- 리뷰 작성자는 작은 사인 스티커, 상대 한마디는 생각풍선
- 별점 평균·권수·연속 기록·리뷰 수·도움돼요는 그리지 말 것
- 별점은 리뷰 카드 안에서만 보이게
- 두 사람 별점을 비교표처럼 나란히 놓지 말 것

타입
type Person = '우댕' | '꼼이';
type ReadStatus = 'reading' | 'done' | 'shelved';
type Rating = 1 | 2 | 3 | 4 | 5;

interface ReadingVM {
  status: ReadStatus;
  current?: number;
  total?: number;
}

interface PhotoVM {
  id: string;
  url: string;
  thumbUrl: string;
  width?: number;
  height?: number;
}

interface BookVM {
  id: string;
  title: string;
  coverUrl?: string;
  coverThumb?: string;
  readers: Partial<Record<Person, ReadingVM>>;
}

interface NoteVM {
  id: string;
  by: Person;
  text?: string;
  page?: number;
  photo?: PhotoVM;
  parentNoteId?: string;
}

interface ReviewVM {
  id: string;
  by: Person;
  rating?: Rating;
  keywords: string[];
  headline?: string;
  body?: string;
  photos: PhotoVM[];
  hasSpoiler: boolean;
  reply?: { by: Person; text: string };
}

만들 컴포넌트
1. HoneybraryHomeCard
props:
{
  book?: BookVM;
  focusReader?: Person;
  readerArtSrc: string;
  onOpen: () => void;
}

2. HoneybraryShelfScreen
props:
{
  now: BookVM[];
  done: BookVM[];
  shelved: BookVM[];
  loading?: boolean;
  hasMore?: boolean;
  onOpenBook: (bookId: string) => void;
  onAddBook: () => void;
  onLoadMore?: () => void;
  onBack: () => void;
}

3. HoneyBookCard
props:
{
  book: BookVM;
  compact?: boolean;
  onClick: () => void;
}

4. BookPlacementSheet
props:
{
  open: boolean;
  me: Person;
  partner: Person;
  busy?: boolean;
  onSubmit: (value: {
    title: string;
    readerMode: 'me' | 'partner' | 'both';
    current?: number;
    total?: number;
    cover?: File;
  }) => void;
  onClose: () => void;
}

5. HoneyBookScreen
props:
{
  book: BookVM;
  me: Person;
  notes: NoteVM[];
  reviews: ReviewVM[];
  loadingMoreNotes?: boolean;
  hasOlderNotes?: boolean;
  onBack: () => void;
  onEditProgress: () => void;
  onJoinReading: () => void;
  onAddNote: () => void;
  onWriteReview: () => void;
  onEditReview: (reviewId: string) => void;
  onLoadOlderNotes?: () => void;
  onOpenPhoto: (photos: PhotoVM[], index: number) => void;
}

6. ReadingProgressPanel
props:
{
  readers: Partial<Record<Person, ReadingVM>>;
  me: Person;
  onEditMine: () => void;
  onJoin: () => void;
}

7. ReadingTimeline
props:
{
  notes: NoteVM[];
  me: Person;
  onReply: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onOpenPhoto: (photo: PhotoVM) => void;
}

8. HoneyReviewComposer
props:
{
  mode: 'create' | 'edit';
  reviewer: Person;
  initialValue?: {
    rating?: Rating;
    keywords: string[];
    headline: string;
    body: string;
    photos: PhotoVM[];
    hasSpoiler: boolean;
  };
  keywordOptions: string[];
  maxKeywords: 3;
  maxPhotos: 5;
  busy?: boolean;
  onSubmit: (value: unknown) => void;
  onCancel: () => void;
}

9. HoneyRating
props:
{
  value?: Rating;
  onChange: (value?: Rating) => void;
  disabled?: boolean;
}

10. ReviewKeywordPicker
props:
{
  items: string[];
  selected: string[];
  maxSelected: 3;
  onChange: (selected: string[]) => void;
}

11. ReviewPhotoPicker
props:
{
  photos: PhotoVM[];
  max: 5;
  onAdd: (files: File[]) => void;
  onRemove: (photoId: string) => void;
}

12. HoneyReviewCard
props:
{
  review: ReviewVM;
  me: Person;
  revealed: boolean;
  onRevealSpoiler: () => void;
  onEdit?: () => void;
  onReply?: () => void;
  onOpenPhoto: (index: number) => void;
}

13. PartnerReplyBubble
props:
{
  reply?: { by: Person; text: string };
  partner: Person;
  canWrite: boolean;
  onSave: (text: string) => void;
  onDelete?: () => void;
}

14. ReviewPhotoViewer
props:
{
  open: boolean;
  photos: PhotoVM[];
  initialIndex: number;
  onClose: () => void;
}

필수 시안 상태
- 책장 빈 상태
- 요즘/다 읽은/책장에 둔 책이 모두 있는 상태
- 표지 없는 책
- 두 사람 진행이 다른 책
- 기록 사진과 한 줄 잇기
- 리뷰 작성 화면
- 스포일러가 가려진 리뷰
- 상대 한마디가 있는 리뷰
- 390px 실제 크기에서 긴 제목·긴 한글 본문
```

## 내 설명 중 코드와 다른 것

- 옛 「우리들의 서재」는 `/library`가 아니라 `/novel`입니다. 홈 카드만 `{false && ...}`로 숨겨져 있습니다. [novel/page.tsx](/Users/mydang/Claude_Code/Kkom-Morning/src/app/novel/page.tsx:9), [홈](/Users/mydang/Claude_Code/Kkom-Morning/src/app/page.tsx:1225)
- 홈에는 별도로 외부 「댕’s 서재」도 살아 있습니다. 이름상 서재가 세 종류가 될 수 있습니다. [홈](/Users/mydang/Claude_Code/Kkom-Morning/src/app/page.tsx:1205)
- 사이담 계획 문서는 아직 만들지 않는다고 적혀 있지만 이미 구현됐습니다. [계획](/Users/mydang/Claude_Code/saidam/docs/사이브러리-계획.md:1)
- 계획의 단일 `readerUid/current/total/status`는 구현에서 사람별 `readers.{uid}`로 바뀌었습니다. [계획](/Users/mydang/Claude_Code/saidam/docs/사이브러리-계획.md:26), [실제 코드](/Users/mydang/Claude_Code/saidam/src/lib/library.ts:46)
- 계획에 있는 책 저자·여러 책 사진·시작일·완독일·쉬는 중·덮음은 실제 구현에 없습니다.
- 데이터는 사람별 진행을 지원하지만 상세 UI에는 두 번째 사람이 스스로 참여하는 길이 없습니다.
- 「상대가 한 줄 잇기」는 실제로 상대 전용·한 개 제한이 아닙니다.
- 사이담 책 삭제는 현재 URL에 연결된 파일을 지우지만, 표지 교체 전에 쓰던 고아 파일까지 지우지는 못합니다.
- 계획은 작은 판이 없으면 원본으로 대체한다고 했지만 목록은 `coverThumb`만 사용합니다. 작은 판이 없으면 사진 대신 제목 표지가 나옵니다. [책장 화면](/Users/mydang/Claude_Code/saidam/src/app/library/page.tsx:137)
- 꼼모닝 레시피·위시·시집 사진 코드는 작은 판과 Storage 삭제를 갖춘 모범 예제가 아닙니다.

## 우댕이 정해야 할 것

추천안을 먼저 적었습니다. 번호만 답해도 됩니다.

1. 별점 필수 여부  
   A. 선택 사항, 별 없이 글·사진만 저장 가능, 추천  
   B. 리뷰를 쓰려면 별점 필수

2. 홈 카드 크기  
   A. 2×1, 현재 책과 꿀됑 로고 표시, 추천  
   B. 1×1, 대신 기존 카드 하나의 기본 크기도 함께 조정

3. 리뷰의 상대 한마디  
   A. 기록 답글과 분리하고 리뷰당 하나, 추천  
   B. 기존 한 줄 잇기와 같은 여러 답글 구조

4. 리뷰 사진 상한  
   A. 5장, 추천  
   B. 3장, 더 가볍지만 밑줄·표지·읽은 자리를 함께 남기기 빠듯함

추천대로라면 `1A · 2A · 3A · 4A`입니다. 파일은 수정하지 않았습니다.