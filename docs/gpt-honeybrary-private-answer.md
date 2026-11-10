## 결론 5줄

1. `visibility: 'shared' | 'private'`와 `privateOwner`를 두고, 옛 책은 모두 `shared`로 이관하는 게 좋아요.
2. 복합 색인 없이 상대 폰 다운로드를 막으려면 사람별 정렬키 `visibleAt.udaeng/kkomi`로 한 번만 질의하세요.
3. 나만 보기에서는 독자를 반드시 `나`로 고정하고, 상대 기록이 생긴 공유 책은 나만 보기 전환을 막는 것을 추천해요.
4. 책 놓기에는 「누구와 볼까요? 같이 보기 / 혼자 보기」를 추가하고, 책 화면 메뉴에서 나중에 바꾸게 해요.
5. 이는 화면상 가림일 뿐 보안 기능이 아니므로 「비밀」은 쓰지 말고, 상대 화면에는 흔적을 전혀 남기지 마세요.

## 1. 데이터

제안:

```ts
type Visibility = 'shared' | 'private';

visibility: Visibility;
privateOwner?: Person;
visibleAt: {
  udaeng?: Timestamp;
  kkomi?: Timestamp;
}
```

- 공유: 양쪽 `visibleAt`에 `createdAt`
- 나만 보기: 소유자 쪽만 존재
- 옛 책: `visibility: 'shared'`와 양쪽 `visibleAt`을 일괄 채운 뒤 새 질의로 전환
- 필드가 없는 옛 책을 읽을 때만 `shared`로 해석하되, `orderBy(visibleAt…)`에는 누락되므로 이관은 필수예요.

조회는 `orderBy('visibleAt.udaeng', 'desc'), limit(n)`처럼 사람별 한 질의면 됩니다. 단일 필드 정렬이라 복합 색인이 필요 없고 상대의 비공개 문서는 내려받지 않습니다. `or()`나 공유·개인 두 질의 병합은 전체 최신 30권 판정과 `더 보기`가 복잡해져 비추천이에요. 기존 30권 증가 방식과 홈 10권도 그대로 유지할 수 있습니다. 현재는 모든 책을 최신순으로 받습니다. `src/lib/honeybrary.ts:156-161`, `src/app/library/page.tsx:35-48`, `src/app/page.tsx:328`

단, 규칙이 열려 있어 책 ID를 직접 알면 읽을 수 있습니다. 화면 목록에서 내려받지 않는 것까지만 보장돼요. `firestore.rules:6-10`, `storage.rules:6-10`

## 2. 나중에 바꾸기

- 변경 권한: `placedBy`만. 현재 제목·표지·삭제도 권한 검사가 없어 새 기능에서 함께 화면 제어가 필요합니다. `src/components/honeybrary/HoneyBookScreen.tsx:146-175`
- 같이 → 나만: 상대 `readers`, 상대 작성 기록·한 줄 잇기·감상·한마디 중 하나라도 있으면 막기. 상대 자료를 몰래 숨기거나 지우면 안 됩니다.
- 막힘 문구: `꼼이가 남긴 내용이 있어 혼자 보는 책으로 바꿀 수 없어요.`
- 나만 → 같이: 허용하되 확인창에서 `그동안 남긴 진행과 기록·감상이 꼼이에게 함께 보여요.`라고 알리기.
- 전환 후 상대가 책 화면을 열어둔 상태라면 즉시 책장으로 내보내고, 하위 `notes/reviews` 구독도 끊어야 합니다. 지금은 책·감상·기록을 동시에 구독하므로 순서를 바꿔야 해요. `src/app/library/[bookId]/page.tsx:59-70`

## 3. 다른 기능과의 관계

나만 보기 선택 시 「누가 읽어요?」는 `나`로 고정하고 상대·같이 선택지는 숨기는 편이 자연스러워요. 현재 세 선택지는 독립적으로 항상 노출됩니다. `src/components/honeybrary/BookPlacementSheet.tsx:140-171`

비공개 책에서는 상대의 한 줄 잇기·감상 한마디·참여하기가 모두 없어야 합니다. 현재 기록과 감상은 책 아래 공용 컬렉션이므로 화면뿐 아니라 구독 자체를 하지 않아야 해요. `src/lib/honeybrary.ts:240-245`, `src/lib/honeybrary.ts:298-302`

내 폰 홈에는 내 나만 보기 책도 보여 주세요. 다만 상대 홈에는 문서 자체가 내려오지 않아야 합니다. 현재 홈은 내가 읽는 중인 책을 우선 선택합니다. `src/app/page.tsx:1043-1048`

## 4. 어디에 넣을까

- 책 놓기: 「누가 읽어요?」 위에 `누구와 볼까요?`
  - `같이 보기` 기본값
  - `혼자 보기`
  - 보조문구: `혼자 보는 책은 내 화면에만 보여요.`
- 책 화면: 제목 아래 작은 `혼자 보는 책` 배지. ⋯ 메뉴에는 `같이 보는 책으로 바꾸기` 또는 `혼자 보는 책으로 바꾸기`.
- 책장: 별도 「나만 보는 책」 칸은 만들지 말고 기존 요즘/다 읽은/둔 책 안에 작은 자물쇠와 `혼자` 표시만. 별도 칸은 독서 흐름보다 공개 여부를 크게 만들어요. 현재 책장은 진행 상태로만 세 구역을 나눕니다. `src/components/honeybrary/HoneybraryShelfScreen.tsx:39-45`
- 홈 카드: 내 비공개 책도 정상 표시하되 작은 자물쇠만. 숫자나 별도 상태 문구는 불필요해요.

## 5. 따뜻하고 정직한 문구

주 문구는 `혼자 천천히 읽는 책`보다 선택 의미가 더 분명한 `혼자 보기`를 추천해요. 설명에서 온기를 보충하면 됩니다.

> 혼자 천천히 읽고 싶은 책이라면 내 화면에만 둘 수 있어요.  
> 꼼모닝 안에서 상대 화면에 보이지 않지만, 비밀번호로 잠그는 비밀 보관함은 아니에요.

상대 화면에는 책, 빈칸, 개수, 알림, 「혼자 보는 책이 있어요」 모두 없어야 합니다.

## 6. Gemini 디자인 의뢰서 초안

고칠 컴포넌트:

- `BookPlacementSheet`
  - `visibility: 'shared' | 'private'`
  - `onSubmit`에 `visibility` 추가
  - 비공개일 때 독자 선택을 `me`로 고정
- `HoneyBookScreen`
  - `visibility`, `canChangeVisibility`
  - `onChangeVisibility(next)`
  - 제목 아래 배지와 메뉴·확인창
- `HoneyBookCard`, `HoneybraryHomeCard`
  - `visibility` 또는 확장된 `BookVM`
  - 비공개일 때 작은 자물쇠 표시
- 새 `BookVisibilityChoice`
  - `value`, `onChange`, `disabled?`
- 새 `BookVisibilityBadge`
  - `visibility`, `compact?`
- 새 `VisibilityChangeSheet`
  - `current`, `partnerName`, `blockedReason?`, `onConfirm`, `onClose`

모바일 390px 기준으로, 색을 늘리지 말고 기존 카드색·옅은 잉크색을 사용하도록 요청하면 됩니다.

## 설명 중 코드와 다른 것

큰 차이는 없습니다. Firestore와 Storage가 `skin` 외에 열린 것도 맞고, 책장 30권·홈 10권도 맞습니다. 다만 홈은 단순 최신 첫 책이 아니라, 받은 10권 중 `내가 읽는 중`을 먼저 고르고 없으면 `둘 중 누군가 읽는 중`을 고릅니다. `src/app/page.tsx:1043-1048`

## 우댕이 정해야 할 것

1. 상대 내용이 있는 공유 책의 비공개 전환  
   - 추천: 전환 막기  
   - 대안: 경고 후 상대 자료까지 숨기기

2. 책 놓기의 기본값  
   - 추천: `같이 보기`  
   - 대안: 마지막 선택 기억

3. 책장 표시  
   - 추천: 기존 구역 안 작은 `혼자` 배지  
   - 대안: 별도 「혼자 보는 책」 구역