## 1. 결론 5줄

1. 일정의 원본은 계속 `calendarEvents` 하나로 두고, 알림·꼼톡 로직도 그대로 유지해요.
2. 새로 만드는 기간 띠는 진짜 일정으로 저장하되, 장식용 띠는 별도 장식으로 남겨요.
3. 월간 칸에는 모든 제목을 넣지 않고 `일정 띠 1줄 + 하루 일정 표시 + 스티커 + 메모`까지만 보여 줘요.
4. 날짜를 누르면 일정과 하루 장을 함께 여는 날짜 시트를 띄우고, 일정이 없는 날만 하루 장 바로 열기를 검토해요.
5. 옛 달력은 다이어리에서 일정 추가·수정·알림 이동까지 검수한 뒤 마지막에 주소만 전환해요.

## 2. 1~12 항목별 추천

### 1. 띠와 일정의 관계

추천안:

- 새 도구를 `일정 띠`와 `장식 띠`로 분리해요.
- `일정 띠`는 `calendarEvents`에 저장해요.
- `장식 띠`는 현재 `diaryMonths.spans`에 남겨요.
- 기존 `spans`는 자동 변환하지 않고 모두 장식 띠로 간주해요.
- 기존 띠를 눌렀을 때만 `일정으로 바꾸기`를 제공하고, 주인·알림을 확인한 뒤 새 일정을 만들어요.

이유:

현재 기간 띠에는 날짜·이름·무늬만 있고 주인·시간·장소·알림이 없어요. 자동 변환하면 필요한 값을 추측해야 합니다. `diaryMonths.spans` 저장 구조는 `src/lib/diary.ts:257-260`, 일정 필드는 `src/lib/calendar.ts:15-27`에 있어요.

또한 현재 지우개로 기간 띠를 즉시 삭제합니다. `src/components/diary/DiaryApp.tsx:382-385` 이 동작을 일정에 그대로 연결하면 장식을 지우다가 알림까지 사라져요.

버린 안:

- 모든 기간 띠를 무조건 일정으로 통일: 장식 자유가 사라지고 삭제가 위험해요.
- 기존 띠 자동 변환: 주인과 알림을 추측해야 해서 버려요.
- 일정 정보를 `diaryMonths`에도 복제: 원본이 두 개가 되어 서로 어긋나므로 버려요.

### 2. 칸 메모와 하루짜리 일정

추천안:

둘 다 유지해요.

- 칸 메모: “비 오는 날”, “푹 쉬기” 같은 짧은 다꾸 문구
- 일정: 시간·장소·알림이 필요한 약속
- 메모를 일정으로 자동 변환하거나, 일정 제목을 메모에 복사하지 않아요.

이유:

메모는 날짜별 7자 장식이고 `src/lib/diaryTypes.ts:42-48`, 일정은 알림과 상세 필드를 가진 업무 데이터예요. 역할이 달라요.

버린 안:

- 메모를 하루 일정으로 통일: 짧은 감상에도 주인·알림 같은 불필요한 입력이 생겨요.
- 하루 일정을 메모로 통일: 알림·시간·장소가 사라져요.
- 두 값을 자동 동기화: 한쪽 수정 시 충돌해요.

### 3. 주인 구분

추천안:

- `같이` 달력: 꼼이·우댕·함께 일정을 모두 보여 줘요.
- `우댕` 달력: 우댕 일정 + 함께 일정
- `꼼이` 달력: 꼼이 일정 + 함께 일정
- 상대 개인 일정은 `같이` 달력에서 볼 수 있지만 내 개인 달력에는 섞지 않아요.
- 꾸미기 권한은 지금처럼 `같이`와 내 달력만 허용하고 상대 달력은 보기 전용으로 둬요.

현재 편집 권한도 `같이 또는 내 달력`으로 제한돼 있어요. `src/components/diary/DiaryApp.tsx:266-287`

이유:

각자 달력의 의미를 살리면서도, 함께 일정은 어느 장에서도 놓치지 않게 됩니다. 비공개 기능으로 오해시키지 않고 단순한 보기 필터로만 사용해야 해요.

버린 안:

- 세 달력에 모든 일정 표시: 달력 전환 의미가 없어져요.
- `같이` 달력에 함께 일정만 표시: 상대 개인 일정까지 한눈에 보던 기존 공유 달력 기능이 약해져요.
- 일정 owner와 월간 owner를 합쳐 저장: 일정 데이터가 월간 꾸미기 문서에 종속돼요.

### 4. 좁은 칸에 그리기

추천안:

47×66px 한 칸을 다음처럼 고정해요.

1. 날짜·공휴일·기념일: 16px
2. 여러 날 일정 띠: 11px 한 줄
3. 스티커: 19~22px, 최대 2개
4. 메모: 9px 한 줄
5. 하루 일정: 날짜 옆 owner 색 점 1개 + 추가 개수 `+2`

표시 규칙:

- 여러 날 일정 띠는 한 주에 1줄만 표시해요.
- 겹친 띠는 칸 오른쪽에 `+2`로 묶어요.
- 하루 일정도 첫 owner 점 하나와 숨은 개수만 표시해요.
- `+N`을 누르면 날짜 시트에서 전부 보여 줘요.
- 기념일은 날짜 줄에 작은 아이콘만 두고, 별도 큰 스티커가 있으면 일반 스티커 자리 하나를 사용해요.
- 일정이 많은 날에는 메모를 한 줄로 줄여요.
- 제목은 띠 시작 조각에만 표시해요.

보기 모드:

- 일정 띠와 `+N`을 또렷하게 표시해요.
- 일정 띠를 누르면 일정 상세를 열어요.

꾸미기 모드:

- 일정 띠를 반투명하게 유지하되 선택·삭제할 수 없게 해요.
- 지우개는 스티커·메모·장식 띠에만 작동해요.
- 일정 수정은 꾸미기 모드를 종료한 뒤 날짜 시트에서만 들어가요.

현재 칸은 이미 66px이고 스티커·띠·메모가 공간을 나눠 씁니다. `src/components/diary/DiaryMonthCell.tsx:32-38`, `src/components/diary/DiaryMonthCell.tsx:46-55`, `src/components/diary/DiaryMonthCell.tsx:133-151`

현재 띠는 화면상 두 트랙을 쓰지만, 세 번째부터는 두 번째 트랙과 겹칠 수 있는 배치예요. `src/components/diary/DiaryMonthScreen.tsx:125-150` 일정과 장식 띠를 합치기 전에 슬롯 계산을 고쳐야 해요.

버린 안:

- 칸 안에 하루 일정 제목까지 표시: 스티커와 메모가 사실상 사라져요.
- 띠 두 줄을 항상 확보: 26px가 빠져 다꾸 영역이 너무 작아져요.
- 좌우 스크롤이나 칸 확대: 월간을 한눈에 보는 장점이 없어져요.

### 5. 날짜를 눌렀을 때

추천안:

보기 모드의 날짜 탭은 `DayAgendaSheet`를 열어요.

시트 순서:

1. 날짜·공휴일·기념일
2. 그날 일정 목록
3. `일정 추가`
4. 큰 버튼 `하루 장 열기`
5. 우댕 장·꼼이 장 작성 여부

동작:

- 일정 행 탭: 상세·수정
- `일정 추가`: 해당 날짜가 기본값인 간단 추가
- `하루 장 열기`: 현재 선택한 사람의 장
- 일정이 전혀 없는 날은 사용자 검수 후 `하루 장 바로 열기`를 선택 옵션으로 둘 수 있어요. 1차는 일관성을 위해 항상 시트를 추천해요.

현재 보기 모드는 날짜를 누르면 바로 하루 장으로 갑니다. `src/components/diary/DiaryApp.tsx:369-370` 기존 달력은 이미 날짜별 일정 시트를 갖고 있어요. `src/app/calendar/page.tsx:207-214`, `src/app/calendar/page.tsx:253-320`

버린 안:

- 날짜 탭은 계속 하루 장 직행: 일정 추가·확인 진입점이 숨어요.
- 짧게 누르면 하루 장, 길게 누르면 일정: 발견하기 어렵고 한 손 사용에 불리해요.
- 날짜마다 작은 일정 추가 버튼 배치: 47px 칸에서는 오작동이 많아요.

### 6. 일정 추가·수정 창

추천안:

기존 창의 저장 로직은 재사용하되, 화면은 Gemini가 다이어리 모양으로 다시 그리게 해요. `calendar/page.tsx`에서 UI 전체를 떼지 말고 일정 폼 상태·검증·저장만 공용 모듈로 분리해요.

간단 추가 기본 화면:

- 제목
- 날짜 또는 기간
- 주인
- 하루 종일
- 띠 무늬
- `저장`
- `시간·장소·알림 더하기`

기본값:

- 날짜: 누른 날짜
- 종료일: 시작일과 같음
- 주인: 현재 보고 있는 달력 주인
- `같이` 달력에서는 `함께`
- 하루 종일: 켬
- 알림: 없음
- 띠 무늬: owner 기본 무늬 또는 최근 사용 무늬
- 시간·장소·메모: 비움

상세 펼침:

- 시작 시간
- 장소
- 메모
- 1일 전·1주일 전 알림
- 시작일·종료일
- 일정 삭제

현재 창도 owner, 날짜 범위, 하루 종일, 시간, 장소, 메모, 1일·7일 전 알림을 지원해요. `src/app/calendar/page.tsx:384-454`

삭제는 상세 창 안에서만 하고 `“이 일정을 지우면 알림도 없어져요”`를 명시해요. 현재는 일반 확인창 뒤 바로 영구 삭제합니다. `src/app/calendar/page.tsx:377-381`

버린 안:

- 기존 창 JSX를 그대로 복사: 달력과 다이어리 양쪽 수정이 갈라져요.
- 띠를 붙이는 즉시 제목 없는 일정을 자동 저장: 정리하기 어려운 빈 일정이 생겨요.
- 기본 알림 1일 전: 원하지 않은 푸시가 늘어날 수 있어요.

### 7. 다가오는 일정

추천안:

월간 상단에는 `다가와요` 한 줄만 두고, 일정과 기념일 중 가장 가까운 하나를 보여 줘요.

예:

- `내일 · 병원 10:30`
- `곧 꼼이 생일 · 7일`
- `진행 중 · 제주 여행`

한 줄을 누르면 `UpcomingSheet`를 열고 다음을 함께 보여 줘요.

- 진행 중인 일정
- 앞으로 15일 일정, 최대 8개
- 앞으로 7일 기념일
- 일정과 기념일은 아이콘으로 구분

기존 일정 계산은 15일·최대 8개예요. `src/lib/calendarLayout.ts:160-181` 다이어리 기념일은 현재 7일 안의 첫 항목 한 개만 찾습니다. `src/components/diary/DiaryApp.tsx:316-323`

버린 안:

- 기존 15일 카드 목록을 월간 위에 그대로 배치: 달력이 아래로 밀려요.
- 기념일 한 줄과 일정 목록을 따로 유지: 상단 정보가 두 덩어리가 돼요.
- 일정과 기념일을 같은 데이터로 저장: 알림과 반복 방식이 달라요.

### 8. 홈 카드

추천안:

`calendar`와 `diary`를 `diary` 2×1 카드 하나로 합쳐요.

카드 내용:

- 제목: `우리 다이어리`
- 이번 달 날짜 또는 작은 달력 인상
- 가장 가까운 일정 한 줄
- 오늘 내 장의 썸네일 또는 첫 문장
- 상대가 오늘 장을 썼다면 작은 점만 표시
- 카드 본문 탭: 다이어리 월간
- 오늘 장 영역 탭: 오늘 하루 장

현재 달력 카드는 다음 일정만 보여 주고 `src/app/page.tsx:867-885`, 다이어리 카드는 오늘 장과 상대 작성 여부를 보여 줍니다. `src/app/page.tsx:1060-1073`

저장된 배치 이동:

- 화면에서 먼저 `calendar + diary → diary 하나`로 정규화하되 Firestore에는 바로 쓰지 않아요.
- 둘 다 있으면 둘 중 앞에 있던 위치에 통합 카드를 둬요.
- 둘 중 하나라도 켜져 있으면 통합 카드를 켜요.
- 크기는 `diary`에 저장된 값을 우선하고, 없으면 2×1로 해요.
- 사용자가 다음에 `카드 배치 완료`를 눌렀을 때만 새 배치를 저장해요.
- 안정화 후 `layoutVersion: 2`와 이전 배치 백업을 저장해요.

홈 배치는 `moduleOrder/moduleSizes/enabledModules`로 공유 저장됩니다. `src/lib/homeLayout.ts:7-26` 현재 두 카드의 기본 크기도 서로 달라요. `src/app/page.tsx:109-117`

버린 안:

- 배포와 동시에 저장 문서를 자동 덮어쓰기: 롤백이 어려워요.
- 달력 1×1만 남기기: 다이어리의 썸네일과 오늘 장 진입이 사라져요.
- 통합 카드를 1×1로 축소: 일정과 하루 장 정보를 함께 담기 어려워요.

### 9. 옛 길 처리

추천안:

- `/calendar`: 처음에는 기존 화면 유지
- 통합 검수 완료 후 `/diary?view=month`로 리다이렉트
- 날짜가 있으면 `/diary?view=month&date=2026-11-17`
- 특정 일정이면 `event={eventId}`를 붙여 날짜 시트와 해당 일정을 열어요.
- 알림 URL도 날짜·event ID를 포함해요.
- 꼼톡 일정 카드는 탭 가능한 카드로 바꾸고 같은 주소를 열어요.
- 홈 상단의 달력 아이콘도 통합 월간으로 옮겨요.

현재 아침 알림은 무조건 `/calendar`를 엽니다. `src/app/api/notify-calendar-reminders/route.ts:75-79` 일정 추가 알림도 같습니다. `src/app/api/notify-calendar/route.ts:31-35`

꼼톡 일정 카드는 현재 눌러도 아무 동작이 없고 일정 ID도 메시지에 저장하지 않아요. `src/components/ChatPanel.tsx:1937-1953`, `src/app/api/calendar-chat-cards/route.ts:57-72`

버린 안:

- `/calendar`를 바로 삭제: 예전 알림과 홈 버튼이 깨져요.
- `/calendar`에서 단순히 오늘 월간만 열기: 사용자가 알림에서 어떤 일정을 보러 왔는지 잃어요.
- 일정 제목으로 대상 찾기: 제목이 같은 일정이 있을 수 있어요.

### 10. 옮기는 순서

추천안은 아래 5단계예요.

1. 일정 읽기 통합
2. 날짜 시트
3. 일정 쓰기 통합
4. 홈·딥링크 전환
5. 옛 달력 제거

옛 달력은 양쪽 아이폰에서 다음을 통과한 뒤에만 떼요.

- 일정 추가
- 여러 날 일정
- 시간·장소·메모
- 1일·7일 전 알림
- 일정 수정·삭제
- 푸시 탭 이동
- 꼼톡 카드 이동
- 느린 네트워크
- 390px 화면

버린 안:

- 한 번에 교체: 어느 단계에서 알림이 깨졌는지 찾기 어려워요.
- 새 월간을 만들기 전에 데이터부터 이전: 데이터 이전 자체가 필요하지 않아요.
- 홈 카드부터 제거: 새 일정 진입이 완성되기 전에 길이 사라져요.

### 11. 성능·위험

추천안:

1차에서는 데이터 구조를 바꾸지 않고, 앱 안에 `CalendarEventsProvider`를 두어 실시간 구독을 한 번만 해요.

현재는 홈과 다이어리가 각각 전체 컬렉션을 구독합니다. `src/app/page.tsx:420-430`, `src/components/diary/DiaryApp.tsx:90-91` 구독 함수 자체도 전체 `calendarEvents`를 읽어요. `src/lib/calendar.ts:69-78`

둘만 쓰는 앱이고 일정 수가 적은 현재는 전체 구독을 유지해도 괜찮아요. 다만 계속 누적되므로 다음 기준을 두는 게 좋아요.

- 일정 500개 미만: 단일 전체 구독 유지
- 500개 이상 또는 월 전환 체감 지연 발생: `eventMonths: ['2026-11']` 같은 조회용 필드를 추가해 현재 달만 구독
- 월 화면에는 현재 달만 DOM에 올리기
- 이미지와 일정 계산은 메모이제이션
- 알림 크론은 당장은 전체 조회 유지

삭제 안전:

- 꾸미기 지우개는 일정을 절대 선택하지 못하게 해요.
- 일정 삭제는 상세 창에서만 가능하게 해요.
- 삭제 전에 알림도 사라진다고 알려요.
- 이후에는 `deletedAt`을 둔 소프트 삭제와 실행 취소를 검토해요.
- 일정 띠와 장식 띠는 색뿐 아니라 테두리·아이콘도 다르게 표시해요.

버린 안:

- 월이 바뀔 때마다 전체 이벤트를 다시 구독: 중복 읽기가 늘어요.
- 처음부터 복잡한 월별 하위 컬렉션으로 이전: 알림 크론과 꼼톡까지 모두 바꿔야 해요.
- 일정 띠에 다꾸 지우개 허용: 가장 위험해서 금지해요.

### 12. 1차에서 뺄 것

추천 제외 목록:

- 위클리 화면
- 반복 일정
- Apple·Google 캘린더 동기화
- 일정 검색
- 일정 완료·출석·통계
- `며칠째 기록` 등 장부 기능
- 시간표 형태의 하루 보기
- 칸 안 일정 제목 여러 줄
- 일정 띠 자유 이동·늘이기
- 기존 장식 띠 자동 일정 변환
- 일정 공동 실시간 편집 충돌 해결
- 이벤트별 사진 첨부
- 월간 자유 확대
- 상대 개인 일정 숨김 같은 보안 기능
- 과거 일정 대량 이전
- 장식 띠 알림

1차 목표는 `읽기 통합 + 날짜 시트 + 안전한 추가·수정 + 홈·딥링크 이동`까지만 잡아요.

## 3. 제미나이에 맡길 화면·부품 목록

Gemini에는 데이터 연결 없이 mock props와 callback만 구현하도록 맡겨요.

### `DiaryCalendarMonthScreen`

하는 일: 일정과 다꾸가 합쳐진 월간 전체 화면

```ts
type DiaryCalendarMonthScreenProps = {
  me: '우댕' | '꼼이'
  owner: 'together' | '우댕' | '꼼이'
  month: string
  monthLabel: string
  mode: 'view' | 'decorate'
  canEditDecor: boolean
  cells: MonthCellVM[]
  eventBands: CalendarEventBandVM[]
  decorBands: DecorBandVM[]
  upcoming?: UpcomingItemVM
  saveState: 'saved' | 'saving' | 'offline'
  onPrevMonth(): void
  onNextMonth(): void
  onGoThisMonth(): void
  onChangeOwner(owner): void
  onToggleDecorate(): void
  onTapDate(date: string): void
  onTapEvent(eventId: string): void
  onTapOverflow(date: string): void
  onOpenUpcoming(): void
  onAddEvent(): void
}
```

### `DiaryCalendarMonthCell`

하는 일: 47×66px 안의 날짜·기념일·일정 수·스티커·메모 표시

```ts
type DiaryCalendarMonthCellProps = {
  cell: {
    date: string
    day: number
    inMonth: boolean
    isToday: boolean
    holiday?: string
    special?: SpecialSummaryVM
    stickers: MonthStickerVM[]
    memo?: string
    diaryState: { mine: boolean; partner: boolean }
    singleEventOwners: Array<'kkomi' | 'udaeng' | 'together'>
    hiddenEventCount: number
  }
  mode: 'view' | 'decorate'
  hasVisibleBand: boolean
  onTap(): void
  onTapOverflow(): void
  onRemoveSticker(id: string): void
  onRemoveMemo(): void
}
```

### `CalendarEventBand`

하는 일: 진짜 여러 날 일정 띠

```ts
type CalendarEventBandProps = {
  id: string
  title: string
  owner: 'kkomi' | 'udaeng' | 'together'
  decorId?: string
  startColumn: number
  columnSpan: number
  continuesLeft: boolean
  continuesRight: boolean
  showTitle: boolean
  muted: boolean
  onTap(id: string): void
}
```

### `DecorBand`

하는 일: 알림 없는 순수 장식 띠

```ts
type DecorBandProps = {
  id: string
  decorId: string
  label?: string
  startColumn: number
  columnSpan: number
  showLabel: boolean
  editable: boolean
  onTap(id: string): void
}
```

일정 띠와 혼동되지 않도록 장식 띠에는 점선 가장자리나 테이프 끝 모양을 사용해요.

### `DayAgendaSheet`

하는 일: 날짜를 눌렀을 때 일정과 하루 장을 함께 제공

```ts
type DayAgendaSheetProps = {
  open: boolean
  date: string
  dateLabel: string
  holiday?: string
  specials: SpecialSummaryVM[]
  events: CalendarEventVM[]
  diary: {
    selectedOwner: '우댕' | '꼼이'
    hasPage: Record<'우댕' | '꼼이', boolean>
    excerpt?: string
    thumbSrc?: string
  }
  onClose(): void
  onAddEvent(date: string): void
  onOpenEvent(id: string): void
  onOpenDiary(date: string, owner: '우댕' | '꼼이'): void
}
```

### `EventQuickAddSheet`

하는 일: 한 손으로 제목 중심의 빠른 일정 추가

```ts
type EventQuickAddSheetProps = {
  open: boolean
  initialDate: string
  initialEndDate: string
  initialOwner: 'kkomi' | 'udaeng' | 'together'
  initialAllDay: boolean
  initialDecorId?: string
  saving: boolean
  onSave(value: {
    title: string
    owner: 'kkomi' | 'udaeng' | 'together'
    startDate: string
    endDate: string
    allDay: boolean
    decorId?: string
  }): void
  onOpenDetails(draft): void
  onClose(): void
}
```

### `EventEditorSheet`

하는 일: 전체 필드 수정 및 안전한 삭제

```ts
type EventEditorSheetProps = {
  open: boolean
  mode: 'create' | 'edit'
  value: CalendarEventDraft
  saving: boolean
  deleteWarning?: string
  decorOptions: DecorOptionVM[]
  onChange(patch: Partial<CalendarEventDraft>): void
  onSave(): void
  onRequestDelete(): void
  onClose(): void
}
```

### `UpcomingStrip` / `UpcomingSheet`

하는 일: 가장 가까운 한 항목과 15일 목록

```ts
type UpcomingStripProps = {
  item?: UpcomingItemVM
  onOpen(): void
}

type UpcomingSheetProps = {
  open: boolean
  items: UpcomingItemVM[]
  onOpenEvent(id: string): void
  onOpenSpecial(id: string): void
  onClose(): void
}
```

### `UnifiedDiaryHomeCard`

하는 일: 기존 달력·다이어리 카드 통합

```ts
type UnifiedDiaryHomeCardProps = {
  monthLabel: string
  nextEvent?: {
    title: string
    dateLabel: string
    owner: 'kkomi' | 'udaeng' | 'together'
  }
  todayDiary?: {
    excerpt?: string
    thumbSrc?: string
    partnerWrote: boolean
  }
  onOpenMonth(): void
  onOpenTodayDiary(): void
}
```

### `LegacySpanConvertSheet`

하는 일: 기존 장식 띠를 사용자가 원할 때만 일정으로 변환

```ts
type LegacySpanConvertSheetProps = {
  open: boolean
  span: DecorBandVM
  defaultOwner: 'kkomi' | 'udaeng' | 'together'
  onKeepAsDecor(): void
  onConvert(value: {
    title: string
    owner: 'kkomi' | 'udaeng' | 'together'
    remindDaysBefore: number[]
    decorId?: string
  }): void
  onClose(): void
}
```

## 4. 데이터 변경

### `calendarEvents`

기존 필드는 그대로 두고 선택 필드만 추가해요.

```ts
interface CalendarEventDoc {
  // 기존 필드 유지
  decorId?: string
  updatedAt?: Timestamp
  schemaVersion?: 2
}
```

규칙:

- 일정 날짜·제목·owner·알림의 원본은 무조건 `calendarEvents`
- 다이어리 문서에는 일정 사본을 저장하지 않음
- `decorId`가 없어도 기존 owner 색 기본 띠로 표시
- 크론과 꼼톡은 `decorId`를 몰라도 정상 동작
- 기존 문서는 마이그레이션 없이 그대로 읽기

### `diaryMonths.spans`

```ts
interface MonthSpanVM {
  id: string
  startDate: string
  endDate: string
  label: string
  decorId: string
  kind?: 'decor'
}
```

규칙:

- `kind`가 없는 기존 span도 `decor`로 읽기
- 새 진짜 일정은 이곳에 저장하지 않음
- 장식 띠에는 알림·owner를 추가하지 않음
- 일정으로 바꿀 때 `calendarEvents`를 새로 만든 뒤, 사용자가 승인한 경우에만 원래 장식 띠를 제거

### 홈 배치

1차에는 저장 구조를 바꾸지 않고 화면에서만 정규화해요. 안정화 후에만 다음을 추가해요.

```ts
interface HomeLayout {
  layoutVersion?: 2
  legacyCalendarDiaryLayout?: {
    moduleOrder?: string[]
    moduleSizes?: Record<string, CardSize>
    enabledModules?: string[]
  }
}
```

### 꼼톡 일정 카드

```ts
{
  kind: 'calendar'
  calendarEventId: string
  calendarDate: string
  href: string
}
```

기존 카드에는 이 필드가 없으므로 예전 카드는 계속 읽기 전용으로 보여 줘요.

## 5. 단계별 순서

### 1단계: 월간에서 일정 읽기

배포되는 것:

- 다이어리 월간에 `calendarEvents` 일정 띠·점·`+N` 표시
- owner별 필터
- 일정은 모두 읽기 전용
- 기존 `/calendar` 유지
- 홈 카드 유지
- 알림 변경 없음

되돌리는 법:

- 일정 오버레이 기능 플래그를 끄면 지금 월간으로 즉시 복귀
- 데이터 변경이 없어 롤백이 쉬워요.

### 2단계: 날짜 시트

배포되는 것:

- 날짜 탭으로 `DayAgendaSheet`
- 일정 목록
- 하루 장 열기
- 기존 일정 상세는 `/calendar` 창을 공용 컴포넌트로 연결

되돌리는 법:

- 날짜 탭을 기존 `goDate()` 동작으로 되돌려요.
- 일정 데이터에는 변화가 없어요.

### 3단계: 다이어리에서 일정 추가·수정

배포되는 것:

- 간단 추가
- 상세 펼침
- `decorId`
- 여러 날 일정 띠 만들기
- 꾸미기 지우개와 일정 삭제 완전 분리

되돌리는 법:

- 다이어리의 추가·수정 버튼만 숨기고 기존 `/calendar` 편집기를 사용해요.
- 새 일정도 같은 `calendarEvents`에 있으므로 손실이 없어요.

### 4단계: 홈·알림·꼼톡 이동

배포되는 것:

- 통합 홈 카드
- 홈 상단 달력 버튼을 다이어리 월간으로 이동
- 알림 URL에 날짜·event ID 추가
- 새 꼼톡 일정 카드 탭 지원
- `/calendar`는 아직 기존 화면 유지

되돌리는 법:

- 링크 목적지만 `/calendar`로 돌려요.
- 홈 배치는 아직 자동 저장하지 않아요.

### 5단계: 옛 달력 종료

조건:

- 우댕·꼼이 아이폰에서 핵심 흐름 검수 완료
- 아침 알림과 꼼톡 카드 실제 수신 확인
- 최소 1~2주 병행 사용
- 일정 추가·수정 누락 없음 확인

배포되는 것:

- `/calendar`를 통합 월간으로 리다이렉트
- 옛 화면 코드는 한 번 더 릴리스 동안 남김
- 이후 사용 문제가 없을 때만 옛 UI 코드 제거

되돌리는 법:

- 리다이렉트 기능 플래그를 끄고 옛 화면을 다시 열어요.
- `calendarEvents`를 옮기지 않았으므로 데이터 복구가 필요 없어요.

## 6. 우댕이 직접 정해야 할 것

### A. 일정이 없는 날짜의 탭

1. 항상 날짜 시트를 열기
2. 일정이 없으면 하루 장 바로 열기

추천: **1번**이에요. 날짜마다 동작이 달라지지 않아 배우기 쉽고, 일정 추가 길도 항상 보여요.

### B. 장식 띠 유지 범위

1. 여러 날 장식 띠도 계속 허용
2. 장식 띠는 월 여백에만 허용하고, 날짜를 잇는 띠는 모두 일정

추천: **1번**이에요. 다꾸 자유를 살리되 `장식` 표식과 다른 테두리를 붙여 혼동을 막아요.

### C. 개인 달력의 상대 일정

1. 각자 달력에는 자기 일정 + 함께 일정
2. 상대 일정도 흐리게 표시

추천: **1번**이에요. `같이` 달력에서 전부 볼 수 있으므로 개인 달력까지 복잡하게 만들 필요가 없어요.

그 외에는 지금 결정만으로 구현안을 확정할 수 있어요.

## 7. 내 방향 중 틀렸거나 위험한 것

맞는 방향:

- 달력 화면을 다이어리 월간으로 모으기
- `calendarEvents`와 알림 크론·꼼톡 유지
- 일정과 다꾸를 한 화면에 그리기
- 날짜 시트에서 일정과 하루 장 연결
- 홈 카드 통합

수정이 필요한 부분:

1. **“기간 띠 = 일정으로 통일”은 절반만 맞아요.**  
   새 `일정 띠`는 일정으로 저장하는 게 맞지만, 장식 띠까지 없애면 다꾸 기능이 약해져요. 둘을 데이터와 삭제 동작에서 분리해야 해요.

2. **현재 띠 지우개를 일정에 연결하면 위험해요.**  
   지금은 한 번 탭으로 `spans`를 삭제합니다. `src/components/diary/DiaryApp.tsx:382-385` 진짜 일정은 상세 창과 별도 확인을 거쳐야 해요.

3. **47×66px에 일정 제목·띠·스티커 2개·메모·기념일을 모두 정상 크기로 넣을 수는 없어요.**  
   일정 제목은 여러 날 띠 시작점만, 하루 일정은 점과 `+N`만 보여 주는 우선순위가 필요해요.

4. **전체 구독을 여러 화면에서 각각 두면 낭비예요.**  
   현재 홈과 다이어리가 별도로 구독하므로 공용 Provider로 한 번만 받아야 해요. 다만 1차부터 데이터 구조를 월별로 옮길 필요는 없어요.

5. **`/calendar`를 바로 없애면 안 돼요.**  
   아침 푸시, 일정 추가 푸시, 홈 상단 버튼이 모두 `/calendar`를 사용합니다. `src/app/api/notify-calendar-reminders/route.ts:75-79`, `src/app/api/notify-calendar/route.ts:31-35`, `src/app/page.tsx:1133-1149`

6. **꼼톡 카드가 현재 일정을 열 수 있다고 가정하면 안 돼요.**  
   지금 카드는 단순 텍스트이며 눌러도 메뉴가 없습니다. `src/components/ChatPanel.tsx:1937-1953`

코드는 읽기만 했고 수정한 파일은 없습니다. Gemini 교차 검토 명령도 실행했지만 응답 없이 지연되어 중단했으므로, Gemini 의견은 이번 결론에 반영되지 않았어요.