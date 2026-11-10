
## 이번 일 — 허니브러리 4번째: 책마다 「같이 보기 / 혼자 보기」

우댕 요청: 「이 책을 공유할지, 나 혼자 볼지 선택할 수 있어야 해. 어디에 공유/공유 안 함을 넣을지도.」
GPT 회의에서 정한 것(`docs/gpt-honeybrary-private-answer.md`):
- 책마다 `visibility: 'shared' | 'private'`. 기본은 **같이 보기**. 혼자 보는 책은 **내 화면에만** 보이고, 상대 화면에는 **흔적 0** — 책도·빈칸도·숫자도·「혼자 보는 책이 있어요」도 없다(이건 데이터 쪽에서 내가 처리, 너는 내 화면만 그리면 된다).
- 「비밀」·「잠금」이라고 약속하지 마. 규칙이 열려 있어 보안 기능이 아니다. 문구: **「혼자 보기」**(주), 설명 「혼자 천천히 읽고 싶은 책이라면 내 화면에만 둘 수 있어요.」
- 혼자 보기를 고르면 「누가 읽어요?」는 **나로 고정**(상대·같이 칸은 숨김).
- 바꾸기는 **책을 놓은 사람만**, 책 화면 ⋯ 메뉴에서. 같이 → 혼자: 상대가 이미 남긴 게 있으면 **막는다**(막힌 이유를 보여 줌). 혼자 → 같이: 「그동안 남긴 진행과 기록·감상이 {상대}에게 함께 보여요.」 확인 한 번.
- 책장에 **따로 칸을 만들지 않는다** — 지금 칸(요즘/다 읽은/책장에 둔) 안에서 작은 자물쇠 + 「혼자」 표시만. 홈 카드도 작은 자물쇠만.
- 혼자 보는 책 화면에선 「둘의 감상」 대신 「내 감상」, 「{놓은 사람}이 놓은 책」 줄 대신 「혼자 보는 책」 배지.

앞서 네가 만든 허니브러리 부품(아래 「지금 코드」에 전문)을 **고쳐서 완성 파일로 다시** 주고, 새 부품 셋을 만들어 줘. 결(`HONEY` 토큰·`HoneySheet`)은 그대로 — 색을 늘리지 말고 옅은 잉크색·기존 카드색으로. 자물쇠는 lucide `Lock`(작게, 13~14px).

### 타입 변경(내가 `src/lib/honeybraryTypes.ts` 에 이미 넣는다)
```ts
export type Visibility = 'shared' | 'private';
export interface BookVM { /* 기존 그대로 + */ visibility: Visibility }
```

### 새 파일 3개
#### ① `src/components/honeybrary/BookVisibilityChoice.tsx`
```ts
export interface BookVisibilityChoiceProps { value: Visibility; onChange: (v: Visibility) => void; partnerName: string; disabled?: boolean }
```
- 두 칸 고르기: 「같이 보기」(아이콘 lucide `Users`, 작은 설명 「{partnerName}도 볼 수 있어요」) / 「혼자 보기」(`Lock`, 「내 화면에만 보여요」). 누름 영역 44px 이상. 고른 칸은 `accentSoft`.
- 혼자 보기를 골랐을 때만 아래 한 줄 「혼자 천천히 읽고 싶은 책이라면 내 화면에만 둘 수 있어요. 비밀번호로 잠그는 보관함은 아니에요.」(작게, faint).

#### ② `src/components/honeybrary/BookVisibilityBadge.tsx`
```ts
export interface BookVisibilityBadgeProps { compact?: boolean }
```
- 기본: 자물쇠 + 「혼자 보는 책」(책 화면 제목 아래). `compact`: 자물쇠 + 「혼자」(책 카드 제목 옆·홈 카드). 옅고 작게 — 눈에 띄는 경고처럼 보이면 안 된다.

#### ③ `src/components/honeybrary/VisibilityChangeSheet.tsx` (`HoneySheet` 안)
```ts
export interface VisibilityChangeSheetProps {
  open: boolean;
  current: Visibility;            // 지금 상태 — 바꿀 방향은 그 반대
  partnerName: string;
  checking?: boolean;             // 바꿀 수 있는지 내가 확인하는 중(짧게) — 「확인하는 중…」
  blockedReason?: string | null;  // 있으면 막힘: 이유만 보여 주고 「알겠어요」 하나
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}
```
- 같이 → 혼자: 제목 「혼자 보는 책으로 바꿀까요?」, 본문 「이제 {partnerName} 화면에서는 이 책이 보이지 않아요.」 · 「바꾸기」/「그만두기」.
- 혼자 → 같이: 제목 「같이 보는 책으로 바꿀까요?」, 본문 「그동안 남긴 진행과 기록·감상이 {partnerName}에게 함께 보여요.」 · 「바꾸기」/「그만두기」.
- 막힘(예: 「꼼이가 남긴 내용이 있어 혼자 보는 책으로 바꿀 수 없어요.」 — 문구는 내가 준다): 이유 + 「알겠어요」.

### 고칠 파일 4개(완성 파일로 다시)
#### ④ `BookPlacementSheet.tsx`
- props 에 `partnerName` 은 없다 — 기존처럼 `partnerOf(me)` 를 써. `onSubmit` 값에 `visibility: Visibility` 추가.
- 「책 제목」 다음, 「누가 읽어요?」 **위**에 `BookVisibilityChoice`(기본 'shared'). 혼자 보기면 「누가 읽어요?」 칸을 **숨기고** readerMode 는 'me' 로. 열릴 때마다 'shared' 로 되돌림.
#### ⑤ `HoneyBookCard.tsx` — `book.visibility === 'private'` 면 제목 옆(또는 제목 아래 진행 줄 위)에 `BookVisibilityBadge compact`. compact(책장에 둔 책 줄)에선 자물쇠 아이콘만.
#### ⑥ `HoneybraryHomeCard.tsx` — 책이 혼자 보는 책이면 제목 옆 작은 자물쇠만(글자 없이도 됨).
#### ⑦ `HoneyBookScreen.tsx` — props 추가:
```ts
canChangeVisibility: boolean;          // 놓은 사람만 true
onRequestVisibilityChange: () => void; // ⋯ 메뉴 항목을 누르면 — 시트(③)는 내가 연다
```
- `book.visibility === 'private'` 면: 제목 아래 「{놓은 사람}이 놓은 책」 대신 `BookVisibilityBadge`, 「둘의 감상」 → 「내 감상」, 감상 쓰기 유도 줄은 그대로.
- ⋯ 메뉴: `canChangeVisibility` 일 때만 맨 위에 「혼자 보는 책으로 바꾸기」(지금 같이) 또는 「같이 보는 책으로 바꾸기」(지금 혼자). 나머지 항목·동작은 그대로.

### 답 형식
파일 7개 완성 코드(각각 맨 위 파일 이름 주석). 고칠 파일은 **바뀐 곳만이 아니라 파일 전체**. 설명은 맨 끝 3줄 이내. 긴 주석 금지.
