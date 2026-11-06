총평  
편지의 핵심 문제는 기능 부족보다 “작성 폼 → 흰 목록 카드 → 흰 모달”로 이어져 편지다운 감정 전환이 약한 점입니다.  
MVP는 `textarea + (단어) 토큰 + 실시간 편지 미리보기`를 쓰고, 읽기 화면을 한 장의 편지지로 재구성하는 게 효과가 가장 큽니다.  
`contenteditable`, 과한 봉투 애니메이션, 편지지·스티커 상점식 확장은 미루는 것을 권합니다.

## 1. 「예전 폼팩터」 새 단장

### 쓰기 화면

추천은 “긴 설정 폼”이 아니라 “편지 한 장을 쓰고, 필요할 때 첨부를 여는 화면”입니다.

- 상단: `꼼이에게` + 날짜
- 중앙: 선택한 편지지 위 큰 본문 입력
- 입력 바로 아래: 미니 이모티콘 버튼, 현재 단어 추천
- 하단: `보이스 · 손글씨 · 큰 스티커 · 예약`을 한 줄 도구 모음 또는 접히는 첨부 메뉴로 정리
- 보내기 버튼은 하단 고정
- 작성 중 편지의 실제 모양을 바로 확인

현재는 본문 카드 다음에 보이스, 손글씨, 예약이 각각 별도 패널로 길게 이어져 “편지 쓰기”보다 설정 양식처럼 보입니다. 본문은 6행짜리 14px 입력이고, 첨부 기능들이 모두 같은 시각적 무게를 가집니다. `src/app/letter/new/page.tsx:217`, `src/app/letter/new/page.tsx:221`, `src/app/letter/new/page.tsx:313`, `src/app/letter/new/page.tsx:374`, `src/app/letter/new/page.tsx:406`

큰 이모티콘과 움직이는 포차코는 없애지 말고 “편지 아래에 붙이는 큰 스티커”로 이름과 역할을 분명히 해야 합니다. 현재 큰 이모티콘은 80px 선택물이고 포차코도 별도 첨부라서, 새 미니 이모티콘과 섞으면 사용자가 차이를 이해하기 어렵습니다. `src/app/letter/new/page.tsx:229`, `src/app/letter/new/page.tsx:238`, `src/app/letter/new/page.tsx:249`

매일 쓰게 만드는 데는 꾸미기 수보다 부담이 적은 진입이 중요합니다. 썸원도 “하루 한 번, 짧게 써도 되는 구조”를 핵심으로 설명합니다. [썸원 공식 소개](https://www.sumone.co/), [썸원 공식 FAQ](https://sumone.co/faq/)

따라서 빈 화면에는 과장된 문구보다 다음 정도가 적당합니다.

- `오늘 꼼이에게 남기고 싶은 말`
- 선택형 시작 문장 3개: `오늘 고마웠던 일`, `문득 보고 싶었던 순간`, `그냥 남기고 싶은 말`
- 선택하면 본문에 문구를 박아 넣지 말고 placeholder만 바꾸기

### 읽기 화면

현재 흰 모달 안에 프로필형 헤더, 일반 본문, 첨부, SNS형 하트·댓글이 차례로 붙습니다. 구조는 안정적이지만 “편지를 펼쳤다”는 느낌이 약합니다. `src/components/LetterInboxV3.tsx:474`, `src/components/LetterInboxV3.tsx:488`, `src/components/LetterInboxV3.tsx:500`, `src/components/LetterInboxV3.tsx:546`

추천 구조는 다음입니다.

- 화면 전체를 덮는 편지 읽기 화면 또는 거의 전체 높이의 바텀시트
- 편지지 안에는 `받는 사람 → 본문 → 보낸 사람·날짜 도장`
- 본문 16~17px, 줄간격 1.8 전후, 최소 좌우 여백 24px
- 인라인 미니 이모티콘은 글자 높이보다 약간 큰 28~32px
- 큰 이모티콘·보이스·손글씨·영상은 편지 본문 아래 “동봉한 것” 구역
- 하트와 댓글은 편지지 바깥 하단에 두어 내용과 분리

현재 큰 이모티콘은 읽기 화면에서 128px 카드들로 표시되고, 영상은 208px 정사각형입니다. 둘 다 본문보다 훨씬 강해서 편지의 주인공을 빼앗을 수 있습니다. `src/components/LetterInboxV3.tsx:84`, `src/components/LetterInboxV3.tsx:96`, `src/components/LetterInboxV3.tsx:556`, `src/components/LetterInboxV3.tsx:573`, `src/components/LetterInboxV3.tsx:585`

Between도 편지를 일반 채팅과 구분된 별도 보관함으로 모으고, 배경음악을 동반한 감정적 읽기 경험으로 분리합니다. 꼼모닝은 이미 보이스와 손글씨가 있으므로 음악을 추가하기보다 읽기 집중도를 높이는 쪽이 맞습니다. [Between Love Letter 공식 도움말](https://help.between.us/hc/en-us/articles/115007270327--Between-Plus-What-is-a-Love-Letter)

### 목록

목록은 본문 전체를 보여주는 카드보다 “봉투 목록”처럼 압축하는 편이 좋습니다.

- 보낸 사람·받은 사람
- 날짜
- 본문 1~2줄 미리보기
- `보이스`, `손글씨`, `큰 스티커`는 작은 아이콘만
- 편지지 색을 카드 왼쪽 띠나 작은 우표로 표시
- 미확인 편지는 작은 봉인 점
- 예약 편지는 기존처럼 본문을 노출하지 않고 도착 시각만 표시

현재 목록 카드마다 큰 이모티콘 스트립과 보이스 플레이어까지 들어가 카드 높이가 들쭉날쭉합니다. `src/components/LetterInboxV3.tsx:317`, `src/components/LetterInboxV3.tsx:326`, `src/components/LetterInboxV3.tsx:327`

필터는 유지해도 좋지만 `전체 · 받은 · 보낸 · 예약`을 우선하고, `보이스`는 부차 필터로 내리는 편이 낫습니다. 현재 다섯 필터가 같은 무게입니다. `src/components/LetterInboxV3.tsx:222`

### 홈 카드

실제 홈 카드는 `daily-letter.tsx`가 아니라 `src/app/page.tsx` 안의 모듈입니다. 새 편지가 있으면 `💌 꼼이에게서 새 편지`, 없으면 `마음이 생기면 천천히`만 표시합니다. `src/app/page.tsx:929`, `src/app/page.tsx:937`, `src/app/page.tsx:941`

추천:

- 새 편지: 작은 닫힌 봉투 + `꼼이에게서 편지가 왔어요` + 날짜
- 읽은 뒤: 최신 본문을 노출하지 말고 `마지막 편지 · 11월 6일` 정도
- 바로가기 두 개는 넣지 말고 카드 탭은 최신 편지, 작은 연필 버튼만 새 편지 쓰기
- 인라인 토큰은 홈에서 이미지로 잔뜩 그리지 말고 `(사랑해)` → `사랑해` 또는 `♡` 같은 안전한 텍스트로 평문화

홈은 현재 최신 본문·보이스·손글씨·이모티콘 상태까지 구독하지만 카드에서 대부분 사용하지 않습니다. 새 디자인 때 불필요한 상태를 정리하거나, “첨부 있음” 표시로 의도적으로 써야 합니다. `src/app/page.tsx:208`, `src/app/page.tsx:293`, `src/app/page.tsx:299`

참고로 `src/components/daily-letter.tsx`의 영문 “Today's letter has arrived!” 뒤집기 카드는 현재 코드에서 import되지 않는 이전 컴포넌트입니다. `src/components/daily-letter.tsx:30`, `src/components/daily-letter.tsx:43`

## 2. 문장 중간 미니 이모티콘

### 추천: textarea + 토큰 + 편지 미리보기

MVP는 `contenteditable`이 아니라 현재 꼼톡 방식을 재사용해야 합니다.

- 저장값: `오늘도 (사랑해) 많이`
- 입력 화면: textarea에는 토큰이 보임
- 그 아래 또는 편지지 배경 뒤 미리보기에서는 그림으로 표시
- 선택한 토큰만 이미지로 바꾸고, 알 수 없는 `(단어)`는 그대로 글자로 표시

꼼톡에는 이미 필요한 핵심이 있습니다.

- 단어·이미지 목록: `src/components/ChatPanel.tsx:584`
- 단어 룩업: `src/components/ChatPanel.tsx:611`
- 알려진 단어만 매칭하는 정규식: `src/components/ChatPanel.tsx:623`
- 인라인 렌더링: `src/components/ChatPanel.tsx:758`
- 36px 미니 표시: `src/components/ChatPanel.tsx:772`
- 커서 위치 토큰 삽입과 커서 복원: `src/components/ChatPanel.tsx:1563`

단, 이 로직이 `ChatPanel.tsx` 안에 사유화돼 있으므로 편지에서 그대로 복사하지 말고 공용 모듈로 분리하는 게 좋습니다. 그렇지 않으면 꼼톡과 편지의 단어 목록·그림 우선순위가 나중에 달라집니다.

### contenteditable을 권하지 않는 이유

`contenteditable` 안에 이미지 노드를 직접 끼우면 다음을 별도로 처리해야 합니다.

- 한글 조합 중 React 재렌더링
- 이미지 앞뒤 커서 이동
- Backspace 한 번으로 토큰 전체 삭제
- 이미지가 포함된 범위 선택·복사·붙여넣기
- 줄바꿈 DOM을 문자열로 직렬화
- 수정 화면에서 문자열을 다시 DOM으로 복원
- iOS 키보드가 내려갔다 돌아올 때 selection 복원

Selection API 자체도 selection과 focus 관계가 브라우저마다 복잡하다고 설명합니다. [MDN Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Selection_API) WebKit에는 iOS에서 조합 중 값을 프로그램으로 바꾸면 조합이 깨지는 공개 버그도 남아 있습니다. [WebKit bug 255857](https://bugs.webkit.org/show_bug.cgi?id=255857)

현재 꼼톡조차 iPhone 캐럿 안정성을 위해 textarea 높이를 JS로 조작하지 않고 그림자 글 레이아웃을 사용하며, 한글 조합 중 Enter도 별도 방어합니다. `src/components/ChatPanel.tsx:2418`, `src/components/ChatPanel.tsx:2423`, `src/components/ChatPanel.tsx:2427`

편지 한 기능을 위해 작은 리치텍스트 편집기를 새로 만드는 셈이므로 비용 대비 이득이 없습니다.

### 넣는 길

추천 순서는 다음입니다.

1. 꼼톡의 `미니` 서랍 재사용
2. 탭하면 현재 커서 위치에 삽입
3. 마지막 단어에 대응하는 이모티콘이 있으면 입력 옆 버튼 썸네일로 조용히 추천
4. 자동 팝업 추천 줄은 만들지 않기

꼼톡도 큰 추천 줄이 대화를 가려 불편했고, 지금은 입력 버튼의 작은 그림으로 바뀌었습니다. `src/components/ChatPanel.tsx:1116`, `src/components/ChatPanel.tsx:1118`, `src/components/ChatPanel.tsx:1120`

편지에서는 단어 선택 시 “문장을 대신하는 큰 스티커” 동작을 가져오면 안 됩니다. 항상 커서 자리에 `(단어)`를 넣는 단순 규칙이 낫습니다. 현재 꼼톡의 커서 삽입 구현은 `selectionStart`, `selectionEnd`, `setSelectionRange`까지 이미 갖춰져 있습니다. `src/components/ChatPanel.tsx:1564`

### 읽기·홈·알림·예약·옛 편지

- 읽기: `renderRich`의 미니 부분만 공용화해 본문에 적용
- 목록: 이미지만 여러 개 그리지 말고 토큰을 글자 또는 대표 아이콘으로 평문화
- 홈: 본문을 노출한다면 토큰 제거 후 1줄
- 알림: `(사랑해)`를 `사랑해` 또는 `♡`로 치환한 plain text
- 예약: `body` 안 문자열이므로 별도 필드 없이 `letterVault`에 함께 봉인
- 옛 편지: 토큰이 없으니 이전과 완전히 동일
- 알 수 없는 토큰: 원문 유지. 자산이 삭제돼도 본문 유실 없음

주의할 점은 채팅 알림이 현재 `[[e:id]]`만 `🐶`로 바꾸고 `(단어)` 토큰은 평문화하지 않는다는 사실입니다. `src/lib/chat.ts:59`, `src/lib/chat.ts:68` 편지 알림은 지금 본문 자체를 보내지 않으므로 즉시 노출 사고는 없지만, 향후 미리보기를 넣을 경우 공용 `toPlainText()`가 필요합니다. `src/app/api/notify-letter/route.ts:68`, `src/app/api/notify-letter/route.ts:78`

## 3. 편지지·봉투·열어 보기 연출

### MVP

- 편지지 1종: 따뜻한 아이보리 또는 아주 옅은 브랜드색
- 날짜 도장
- `To. 꼼이`, `From. 우댕`
- 읽기 화면 처음 열릴 때 180~250ms 정도의 가벼운 펼침·페이드
- 봉인 예약 편지는 기존 잠금 카드 유지

손글씨 글꼴은 본문 전체에 쓰지 않는 것을 권합니다. 한글 손글씨체는 작은 모바일 화면에서 긴 글의 가독성이 빨리 떨어집니다. 날짜 도장, To/From, 짧은 서명에만 사용하세요.

### 2차

- 편지지 3종만: 기본 아이보리, 연분홍, 연초록
- 작성 화면에서 작은 스와치로 선택
- 봉투 표지와 편지지 색 연결
- 받는 사람이 처음 열 때만 0.5초 이내 봉투 열림
- `prefers-reduced-motion`이면 즉시 열기
- 이미 읽은 편지는 애니메이션 없이 바로 본문 표시

이때 새 필드는 `paperTheme?: 'ivory' | 'rose' | 'mint'` 정도면 충분합니다. 필드가 없는 옛 편지는 `ivory`로 표시합니다.

### 3차 또는 보류

- 계절·기념일 편지지
- 즐겨 쓰는 편지지 기억
- 첫 열람 시각 또는 “열어봄” 표시가 정말 필요할 때만 `openedAt`, `openedBy` 검토

### 하지 말 것

- 편지를 열 때마다 긴 봉투 애니메이션
- 찢기·드래그·정확한 제스처를 요구하는 봉인
- 여러 단계의 우표·봉투·스티커 꾸미기
- 움직이는 배경, 반짝이, 종이 질감을 한 화면에 동시 적용
- 본문 전체 손글씨체
- 배경음악 자동재생
- 편지지별 서로 다른 본문 색과 레이아웃

LINE Gift도 메시지 카드를 선물에 감정을 더하는 한 단계로 두지, 카드 편집 자체를 복잡한 제작 도구로 만들지는 않습니다. [LINE Gift 공식 기능 소개](https://linegift.line.me/feature/)

## 4. 단계별 계획

### MVP, 1~2일

데이터 변경: 없음. `body`에 `(단어)` 토큰을 그대로 저장합니다.

바꿀 파일:

- `src/components/ChatPanel.tsx`
  - 미니 데이터·토큰 파서·plain text 변환을 공용 파일로 이동
- 새 공용 모듈 후보: `src/lib/miniEmoticons.tsx`
  - 단어 목록
  - `renderMiniRich()`
  - `insertMiniToken()`
  - `toPlainText()`
- `src/app/letter/new/page.tsx`
  - textarea 유지
  - 미니 서랍
  - 커서 위치 삽입
  - 편지 형태 실시간 미리보기
  - 첨부 기능 접기
- `src/components/LetterInboxV3.tsx`
  - 목록 plain text 미리보기
  - 읽기 본문 인라인 렌더링
  - 편지지형 레이아웃
  - 수정 textarea에도 동일한 미니 삽입 제공
- `src/app/page.tsx`
  - 홈 편지 카드 문구·상태 정돈

옛 편지는 토큰이 없으므로 일반 본문 그대로 보입니다.

### 2차

데이터 추가:

```ts
paperTheme?: 'ivory' | 'rose' | 'mint'
```

바꿀 파일:

- `src/lib/letters.ts`
  - `Letter`, `InboxLetter`, `sendLetter`, `toInboxLetter`, `updateLetter`에 테마 전달
- `src/app/letter/new/page.tsx`
  - 편지지 3종 선택
- `src/components/LetterInboxV3.tsx`
  - 목록 우표/띠, 읽기 편지지 테마
- `src/lib/promoteLetters.ts`
  - 별도 코드는 거의 필요 없지만 vault 내용이 통째로 승격되는지 회귀검사
- 알림 라우트
  - 본문 미리보기를 추가할 때만 `toPlainText()` 적용

필드가 없는 옛 편지는 `ivory` 기본값입니다. 예약 편지는 `paperTheme`도 `letterVault`의 `content`에 넣어야 합니다. 현재 승격은 vault 문서 전체를 letters에 병합하므로 구조상 호환됩니다. `src/lib/letters.ts:260`, `src/lib/letters.ts:278`, `src/lib/promoteLetters.ts:58`, `src/lib/promoteLetters.ts:66`

### 3차

검토할 데이터:

```ts
openedAt?: Timestamp
openedBy?: string
```

단, “처음 열었을 때만 봉투 애니메이션”을 기기 로컬 상태로 처리할 수 있다면 서버 필드는 추가하지 않는 편이 낫습니다.

작업:

- 최초 열람 애니메이션
- 동작 줄이기 설정 대응
- 기념일 편지지
- 편지 검색 또는 연도별 묶음
- 첨부물이 많은 편지는 “동봉한 것 3개”로 접기
- 토큰 사용 빈도 기반 최근 미니 정렬

## 5. 실제 위험·함정

1. 예약편지 누출

예약 편지는 본문뿐 아니라 음성·손글씨·큰 이모티콘·영상까지 `letterVault`로 분리합니다. 새 `paperTheme`나 미래의 인라인 관련 필드를 `letters`에 직접 넣지 말고, 내용 성격이면 반드시 vault 쪽 `content`에 넣어야 합니다. `src/lib/letters.ts:260`, `src/lib/letters.ts:270`, `src/lib/letters.ts:278`

2. 예약 승격 실패

이 저장소에는 과거 크론이 빠져 예약 편지가 영구 봉인됐던 사고 기록이 있습니다. 승격 경로는 5분 크론과 백스톱 크론이 공유하며 `notifiedAt`으로 중복 방지합니다. 이 파일의 필드 병합·삭제 순서를 건드리면 안 됩니다. `src/lib/promoteLetters.ts:3`, `src/lib/promoteLetters.ts:8`, `src/lib/promoteLetters.ts:58`, `src/lib/promoteLetters.ts:112`

3. 본문 수정 기능 누락

편지는 보낸 사람이 모달에서 본문을 수정할 수 있습니다. 새 작성 화면에만 미니 삽입기를 넣으면 수정할 때 토큰을 직접 타이핑해야 합니다. `src/components/LetterInboxV3.tsx:436`, `src/components/LetterInboxV3.tsx:513`, `src/components/LetterInboxV3.tsx:524`, `src/app/letters/page.tsx:85`

또한 `updateLetter()`는 현재 `letters/{id}`만 수정합니다. 봉인 중인 예약 편지는 UI에서 열지 못하게 되어 있어 안전하지만, 나중에 “예약 편지 수정”을 만들면 반드시 `letterVault`를 수정해야 합니다. `src/lib/letters.ts:315`, `src/lib/letters.ts:322`, `src/components/LetterInboxV3.tsx:274`

4. 파서 중복

`MINI_BY_WORD`, 보낸 사람별 이미지, 정규식, 렌더러가 전부 거대한 `ChatPanel.tsx` 내부에 있습니다. 편지용 사본을 만들면 새 단어 추가 때 꼼톡과 편지가 달라질 가능성이 큽니다. `src/components/ChatPanel.tsx:614`, `src/components/ChatPanel.tsx:618`, `src/components/ChatPanel.tsx:624`, `src/components/ChatPanel.tsx:758`

5. 토큰 충돌

모든 괄호 문장을 바꾸면 안 됩니다. `(내일 보자)` 같은 정상 문장까지 이미지로 오인할 수 있습니다. 현재처럼 알려진 단어 목록만 정규식에 넣어야 합니다. `src/components/ChatPanel.tsx:623`, `src/components/ChatPanel.tsx:629`

6. 알림 미리보기

즉시 편지 알림은 현재 본문을 노출하지 않고 “편지를 보냈어”로만 알립니다. 예약 편지도 도착 후 같은 방식입니다. 새 미리보기를 넣더라도 봉인 전 내용이나 토큰 원문을 알림에 보내면 안 됩니다. `src/app/api/notify-letter/route.ts:44`, `src/app/api/notify-letter/route.ts:68`, `src/lib/promoteLetters.ts:76`

7. 댓글과 본문의 영역 혼동

현재 댓글은 편지 모달의 고정 하단 입력이고 본문과 같은 흰 모달 안에 있습니다. 편지지를 도입할 때 댓글까지 종이 안에 넣으면 편지와 대화의 위계가 섞입니다. 댓글은 편지지 바깥에 유지하는 편이 좋습니다. `src/components/LetterInboxV3.tsx:591`, `src/components/LetterInboxV3.tsx:599`, `src/components/LetterInboxV3.tsx:629`

8. 첨부물 크기와 스크롤

큰 이모티콘 128px 여러 개, 영상 208px, 자동재생 손글씨, 보이스가 모두 한 편지에 올 수 있습니다. 읽자마자 모든 동적 첨부를 자동재생하면 스크롤·디코딩·시선 경쟁이 생깁니다. 영상은 화면 진입 시 1개만 재생하거나 탭 재생, 손글씨는 “재생하기”가 안전합니다. `src/components/LetterInboxV3.tsx:96`, `src/components/LetterInboxV3.tsx:565`, `src/components/LetterInboxV3.tsx:581`

9. 권한 검증

UI는 `isMine`일 때만 수정 버튼을 보여주지만, `updateLetter()` 자체에는 작성자 확인이 없습니다. 실제 보안은 Firestore 규칙에 달렸습니다. 리뉴얼 범위를 넘어가더라도 출시 전 규칙 검증은 필요합니다. `src/components/LetterInboxV3.tsx:436`, `src/lib/letters.ts:317`

## 내 요약 중 틀린 것

대부분 맞습니다. 다만 네 가지를 고쳐야 합니다.

- `daily-letter.tsx`가 현재 홈 카드라는 부분은 틀립니다. 현재 홈 편지 카드는 `src/app/page.tsx:929`이고, `daily-letter.tsx`는 현재 사용되지 않는 옛 컴포넌트입니다.
- 읽기 모달 본문은 단순 16px 글자가 맞지만, 보낸 사람은 그 자리에서 본문을 수정할 수 있습니다. `src/components/LetterInboxV3.tsx:513`, `src/components/LetterInboxV3.tsx:526`
- 꼼톡의 `(단어)` 미니는 단순 32px 고정이 아니라 현재 실제 클래스는 `h-9`, 즉 36px입니다. `src/components/ChatPanel.tsx:777`
- `[[e:id]]`는 포차코 영상 미니라기보다 `MOOD_OPTIONS`의 기본 미니 이미지 토큰입니다. 영상이 될 수 있는 것은 `(단어)`가 매칭하는 `TEXT_STICKERS` 쪽입니다. `src/components/ChatPanel.tsx:765`, `src/components/ChatPanel.tsx:781`

## Gemini에게 부탁할 시안 목록

1. 편지 쓰기 기본 화면  
   받는 사람, 날짜, 편지지형 textarea, 미니 이모티콘 버튼, 현재 단어 추천 썸네일, 접힌 첨부 도구, 하단 고정 보내기

2. 미니 이모티콘 서랍 열린 화면  
   키보드 자리를 차지하는 서랍, 최근·미니 탭, 검색, 커서 위치 삽입 후 돌아온 상태

3. 미니 토큰이 들어간 작성 미리보기  
   textarea에는 `(사랑해)`, 편지 미리보기에는 28~32px 그림, 줄바꿈 2~3개 포함

4. 편지 읽기 화면  
   아이보리 편지지, To/From, 날짜 도장, 인라인 미니 2개, 긴 본문, 하단 동봉물과 편지지 밖 하트·댓글

5. 첨부가 많은 편지 읽기 화면  
   보이스, 손글씨, 큰 이모티콘, 영상이 함께 있을 때의 접힌 “동봉한 것” 구성

6. 편지 목록  
   받은 편지·보낸 편지·예약 편지·미확인 편지가 한 화면에 섞인 상태, 390px 폭

7. 예약 편지 목록 카드  
   본문 없는 봉투, 도착 날짜·시각, 받는 사람과 보낸 사람 각각의 표현

8. 홈 편지 카드 3상태  
   새 편지 있음, 모두 읽음, 편지 없음

9. 본문 수정 화면  
   기존 편지지 안 textarea, 미니 삽입 버튼, 저장·취소, 첨부는 수정 불가라는 표현

10. 모션 프레임  
   닫힌 봉투 → 펼침 → 편지지 노출의 3프레임, 전체 0.5초 이하, 동작 줄이기 대체 상태

모든 시안은 390px 실제 모바일 폭으로 요청하고, “동화풍·다꾸풍보다 차분한 커플 기록 앱, 색 3개 이하, 긴 한글 본문 가독성 우선”을 명시하는 게 좋습니다.