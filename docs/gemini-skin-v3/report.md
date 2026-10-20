## 만들 것: 「모아보기」 — 하루하루를 보고서처럼 모아 보는 화면 (새 파일 2개)

기록이 한 달, 석 달 넘게 쌓이면 7일 띠로는 못 본다. 날마다 무엇을 적었는지 **읽기 좋은 보고서**로 쭉 이어 보는 화면이다. 진료 때 의사에게 보여 줄 수도 있다.
같은 하루 카드(SkinDayReport)는 우댕 폰(보기 전용) 기록 화면에서도 입력 폼 대신 쓴다 — 우댕이 칸을 하나하나 눌러 열지 않아도 그날 적힌 게 다 보이게.

### 공통 타입 (두 파일이 같이 씀 — SkinDayReport.tsx 안에서 export)
```ts
export type MedStatus = 'taken' | 'missed' | 'late';
export interface ReportDay {
  date: string;                 // 'YYYY-MM-DD'
  logged: boolean;              // false = 그날 기록 자체가 없음
  wheals: number | null;        // 팽진 0~3
  itch: number | null;          // 가려움 0~3
  uas: number | null;           // 둘의 합 0~6 (둘 다 있을 때만)
  meds: { name: string; dose?: string | null; time?: string | null; status: MedStatus | null }[];
  episodes: { start?: string | null; durMin?: number | null; areas: string[]; over24h?: boolean | null; bruiseLike?: boolean | null }[];
  angioedema: { present: boolean; areas: string[] } | null;   // areas 예: '입술', '눈', '목·혀'
  trace: string | null;         // '흔적 없음' | '색소 남음' | '긁은 상처'
  triggers: string[];           // 의심 가는 것
  foods: { t?: string | null; text: string }[];
  sleepH: number | null; wakeItch: boolean | null; waterMl: number | null; stress: number | null; // stress 0~10
  period: boolean | null; cycleDay: number | null;
  newProducts: string[];
  note: string;
  photoCount: number;
  env: { temp: number | null; humidity: number | null; pm10: number | null; pm25: number | null } | null; // 그날 저장 때 날씨
}
```

### 파일 1: SkinDayReport.tsx — 하루 보고서 카드 (읽기 전용)
```ts
export default function SkinDayReport(props: {
  day: ReportDay;
  photos?: { id: string; url: string }[];  // 있으면 썸네일 줄, 없으면 photoCount로 「사진 n장 보기」 버튼
  onOpenPhotos?: (index: number) => void;
  onEdit?: () => void;                     // 꼼이일 때만 옴 — 작게 「이날 고치기」
  showHeader?: boolean;                    // 기본 true. 기록 화면에선 날짜 머리를 숨기고 씀
})
```
- 머리: 「10월 21일 (화)」 + 점수 칩 「3 / 6」(0 옅게 → 6 진하게, 4 이상은 빨강 계열 옅은 바탕) + 약 칩(먹음 ✓ / 늦게 시계 / 거름 ✕, 안 적었으면 칩 없음).
- 몸: **적힌 칸만** 「이름 — 값」 줄로, 이 순서: 팽진·가려움(「팽진 2 · 가려움 1」) / 약(이름·용량·시각·상태) / 두드러기 올라온 시각·부위(여러 번이면 줄마다 「밤 10:20 · 팔·몸통 · 40분」, 24시간 넘게·멍처럼 남음은 작은 경고 칩) / 붓기(목·혀가 있으면 빨강 강조) / 흔적 / 의심 가는 것(칩) / 먹은 것(시각 + 내용) / 생활(잠 n시간 · 물 n ml · 스트레스 n/10 · 가려워서 깸) / 생리(「생리 중 · 3일째」) / 새로 쓴 제품 / 메모(여러 줄 그대로, 따옴표 느낌 상자).
- 맨 아래 작게 한 줄: 「안 적은 칸: 흔적 · 먹은 것 · 생리」(안 적은 칸 이름만, 회색). 다 적었으면 이 줄 없음.
- 날씨 한 줄(작게): 「그날 12° · 습도 40% · 미세먼지 35 · 초미세 18」(없으면 생략).
- 사진: 썸네일 72px 가로 줄(누르면 onOpenPhotos(i)), 썸네일이 없고 photoCount>0이면 「사진 n장 보기」 버튼.
- logged=false 면 카드 대신 얇은 한 줄 「10월 18일 (토) · 기록 없음」.

### 파일 2: SkinReportView.tsx — 모아보기 화면
```ts
export type ReportRange = '2w' | 'month' | 'prevMonth' | '3m' | 'all';
export default function SkinReportView(props: {
  onBack: () => void;
  range: ReportRange; onRange: (r: ReportRange) => void;
  rangeLabel: string;              // 예: '10월 1일 ~ 10월 21일'
  days: ReportDay[];               // 범위 안 모든 날, 최신 → 과거 순(기록 없는 날 포함)
  summary: {
    daysLogged: number; daysTotal: number;
    avgUas: number | null;         // 기록한 날 평균 0~6
    hardDays: number;              // 점수 4 이상
    medMissedDays: number; angioedemaDays: number;
    topTriggers: { name: string; days: number }[]; // 최대 3
  };
  loading: boolean;
  onOpenDay: (date: string) => void;     // 하루 카드의 「사진 n장 보기」·「이날 고치기」가 이걸로 기록 화면의 그날로 감
  canEdit: boolean;                      // 꼼이면 true → 카드에 onEdit 넘김
})
```
- 위 고정 머리: ← 뒤로 + 「모아보기」. 그 아래 범위 칩 한 줄(가로 스크롤 가능): 최근 2주 · 이번 달 · 지난달 · 3개월 · 전체. 칩 아래 작게 rangeLabel.
- 요약 카드: 「기록한 날 18 / 21일」「평균 점수 2.3 / 6」「힘든 날(4점 이상) 3일」「약 거른 날 2일」「붓기 있던 날 1일」 + 자주 적은 의심 요인 3개 칩(「술 4일」). 값이 0이어도 보여 주되, 기록한 날이 0이면 요약 대신 「이 기간엔 기록이 없어요」.
- 목록: **주 단위로 묶음**(월요일 시작). 묶음 머리 「10월 13일 ~ 19일 · 기록 5/7일 · 점수 합 18」(점수 합은 그 주 기록한 날 점수 합). 묶음 안은 최신 날부터 SkinDayReport.
  기록 없는 날이 이어지면 한 줄로 합쳐 「10/15 ~ 10/17 · 기록 없음」.
- loading이면 카드 자리 3개 옅은 깜빡임.
- 맨 아래 작은 글: 「기록을 모아 정리한 것이고 진단이 아니에요.」
- 하루 카드가 많아도(90일+) 부드럽게 스크롤되게 — 애니메이션은 머리·칩 정도만, 카드마다 등장 애니메이션 금지.
