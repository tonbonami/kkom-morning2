# 허니브러리 회의 2 — 「이 책을 둘이 같이 볼지, 나만 볼지」 고르기

너(GPT)와 Claude 가 회의하는 자리다. 아래 파일을 **직접 읽고** 의견을 줘. 내 설명이 코드와 다르면 코드가 맞다 — 반박해 줘. 읽기만 하고 파일은 고치지 마. 비밀 파일(`.env*`, `*.p8`, `*.pem`, `*.key`, `GoogleService-Info.plist`, `*secret*`, `certs/`)은 열지 마. `node_modules/`·`.next/`·`ios/` 건너뛰어. **짧게** 답해 줘(한도가 빠듯하다).

## 우댕 요청(원문)
> 허니브러리에 한가지 기능 더 넣어줘. 이책을 공유할지, 나혼자 볼지 선택할 수 있어야해. gpt랑 먼저 회의하고, 제미 시안 받아서 하자. 어디에 공유/공유안한 넣을지도.

## 지금 상태 (어제 배포, 저장소 `Kkom-Morning/`)
- 꼼모닝 = 연인 둘(우댕·꼼이)만 쓰는 앱. 신원은 이름 문자열. **Firestore·Storage 규칙이 `skin` 외엔 다 열려 있다**(`firestore.rules`) — 「나만 보기」는 보안이 아니라 **상대 화면에 안 띄우는 것**밖에 못 한다.
- 데이터 `src/lib/honeybrary.ts`: `honeyBooks/{id}`(title·placedBy·readers.{udaeng|kkomi}·cover·createdAt) + 하위 `notes`·`reviews/{udaeng|kkomi}`. 책장은 `subscribeHoneyBooks(n)` = `orderBy('createdAt','desc') limit(n)`(30권씩 더 보기), 홈 카드는 같은 함수로 10권.
- 화면: 책장 `src/components/honeybrary/HoneybraryShelfScreen.tsx`·`HoneyBookCard.tsx`, 책 놓기 `BookPlacementSheet.tsx`(누가 읽어요? 나/상대/같이), 책 화면 `HoneyBookScreen.tsx`(⋯ 메뉴: 제목 고치기·표지 바꾸기·책 지우기), 홈 카드 `HoneybraryHomeCard.tsx` + `src/app/page.tsx`(`library:` 부분). 이음 `src/app/library/page.tsx`·`src/app/library/[bookId]/page.tsx`. 타입 `src/lib/honeybraryTypes.ts`.
- 원칙(지난 회의 `docs/gpt-honeybrary-answer.md`): 장부 금지 — 권수·평균·나란히 별·시각·알림 없음.

## 안건 (중요한 순서, 안건마다 제안 / 이유 / 근거 `파일:줄`)
1. **데이터** — 필드 모양(`visibility: 'shared'|'private'`? `privateTo?: Person`?), 옛 책 기본값. 상대 폰이 **아예 내려받지 않게** 할 질의 방법(복합 색인 없이 가능한지: 질의 둘을 합치기? `or()`?), 30권씩 더 보기와 홈 카드 10권은 어떻게.
2. **나중에 바꾸기** — 같이 → 나만: 상대가 이미 진행 줄·기록·한 줄 잇기·감상·한마디를 남겼으면? 막기/경고/허용, 상대 것은 어떻게 되나. 나만 → 같이: 그동안 쓴 기록·감상이 한꺼번에 보이는 것 괜찮나. 누가 바꿀 수 있나(놓은 사람만?).
3. **다른 기능과 얽힘** — 책 놓기 「누가 읽어요? 나/상대/같이」와의 관계(나만 보기면 「상대」·「같이」는?), 상대의 한마디·한 줄 잇기, 홈 카드(내 폰 홈엔 내 나만 보기 책도 뜨나).
4. **어디에 넣을까(우댕이 콕 집어 물음)** — 책 놓기 시트의 어느 자리, 책 화면(배지·메뉴), 책장(자물쇠 표시? 따로 칸 「나만 보는 책」?), 홈 카드. 각 자리의 문구 초안.
5. **따뜻하게** — 「상대에게 숨긴다」가 아니라 「혼자 천천히 읽는 책」으로 읽히게. 상대 화면엔 **흔적 0**(「숨긴 책 3권」 같은 숫자·빈칸 금지). 규칙이 열려 있다는 사실을 문구에서 어떻게 정직하게(「비밀」이라고 약속하면 안 됨).
6. **Gemini 디자인 의뢰서 초안** — 고칠 컴포넌트·새 컴포넌트와 props(이름·타입). 데이터는 Claude 가 잇는다.

## 답 형식
맨 위 「결론 5줄」 → 안건별 → 내 설명 중 코드와 다른 것 → 우댕이 정해야 할 것(선택지 + 추천). 한국어.
