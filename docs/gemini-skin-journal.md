# 제미나이에게 — 꼼이 피부 일지: 기록 화면 + 분석·상담 화면

> 우댕: 아래 「보낼 글」을 제미나이에 통째로 붙여 넣고, 꼼모닝 **홈 화면 스크린샷 1장**을 같이 첨부해 주세요(지금 앱 분위기 참고용).
> 받아 온 코드는 꼼모닝 세션이 **값 하나 안 바꾸고** 넣고 데이터만 연결해요.
> 의사 꿀됑 움짤은 따로 만들어서 `doctorSrc`로 넣어요.

---

## 보낼 글

커플 앱(Next.js 15 + React + Tailwind + framer-motion + lucide-react, 휴대폰 세로 375~430px)에 들어갈 **「꼼이 피부 일지」** 화면을 TSX 컴포넌트로 만들어 줘. 사용자는 여자친구 「꼼이」 한 명이다. 5월부터 원인 모를 두드러기·가려움이 있어서, 매일 기록을 쌓아 원인을 찾고 병원에 가져갈 자료를 만든다.

### 지금 앱 분위기 (그대로 따라가기)
- 바탕: 아주 연한 웜 회백 그라디언트 — `className="sd-app"` (CSS에 이미 있음)
- 카드: `className="sd-card"` (반투명 흰 카드, 둥근 28px, 부드러운 그림자). 덜 중요한 카드는 `sd-card sd-card--quiet`
- 색은 CSS 변수로만: 글자 `var(--sd-ink)` #2E1D26 / 보조 `var(--sd-muted)` #6E5457 / 흐린 `var(--sd-faint)` / 구분선 `var(--sd-line)` #E4D2D2 / 옅은 면 `var(--sd-surface-2)` / 강조(코랄) `var(--sd-rel)` #E4685E, 옅은 강조 `var(--sd-rel-soft)` / 위험 `var(--sd-crit)` #C9524F
- 다크 모드는 변수가 알아서 바뀌니 색을 직접 쓰지 말 것.
- 아이콘은 lucide-react만, 눌리는 건 `motion.button` + `whileTap={{ scale: 0.96 }}`. 글씨 14px 이상(본문 15~16px). 이모지 대신 아이콘.
- 최대 폭 `max-w-md mx-auto`, 엄지가 닿는 아래쪽에 주요 버튼.

### 공통 타입 (그대로 써 줘)
```ts
export type MedStatus = 'taken' | 'missed' | 'late';
export interface SkinMed { name: string; dose?: string | null; time?: string | null; status: MedStatus | null }
export interface SkinEpisode { start?: string | null; durMin?: number | null; areas: string[]; over24h?: boolean | null; bruiseLike?: boolean | null }
export interface SkinFood { t?: string | null; text: string }
export interface SkinDraft {
  date: string;                       // 'YYYY-MM-DD'
  wheals: number | null;              // 팽진 0~3 (null = 아직 안 적음)
  itch: number | null;                // 가려움 0~3
  meds: SkinMed[];
  episodes: SkinEpisode[];
  angioedema: { present: boolean; areas: string[] } | null;  // 입술·눈 / 목·혀
  trace: string | null;               // '흔적 없음' | '색소 남음' | '긁은 상처'
  triggers: string[];
  foods: SkinFood[];
  sleepH: number | null; wakeItch: boolean | null; waterMl: number | null; stress: number | null; // stress 0~10
  period: boolean | null; cycleDay: number | null;
  newProducts: string[];
  note: string;
}
export const AREAS = ['손·손바닥','팔','발·발바닥','다리·허벅지','몸통','목','얼굴','두피','엉덩이'];
export const TRIGGERS = ['약 거름','운동·걷기','더위·열감','샤워 후','땀','스트레스','잠 부족','술','매운 음식','밀가루·면','유제품','해산물','견과','생리 주기','새 제품','추위','압박(옷·가방끈)','공복','모르겠음'];
```

---

## 1부 — 기록 화면

### 1-1. `SkinPinGate` — 처음 한 번 PIN 넣기
```ts
export default function SkinPinGate(props: {
  status: 'idle' | 'checking' | 'bad' | 'locked';  // bad=틀림, locked=5번 틀려 15분 잠김
  onSubmit: (pin: string) => void;
}): JSX.Element
```
- 「꼼이 피부 일지」 제목 + 한 줄 설명(꼼이만 볼 수 있게 잠겨 있어요) + 숫자 PIN 입력(4~8자리, 숫자 키패드) + 확인 버튼.
- 틀리면 살짝 흔들리고 「PIN이 달라요」, 잠기면 「15분 뒤에 다시 해 주세요」.

### 1-2. `SkinWeekStrip` — 최근 7일 한눈에
```ts
export default function SkinWeekStrip(props: {
  days: { date: string; label: string; uas: number | null; med: MedStatus | null; hasLog: boolean }[]; // 오래된 날 → 오늘, 7개
  selected: string;
  onSelect: (date: string) => void;
}): JSX.Element
```
- 날마다 작은 칸: 요일·날짜, UAS(0~6) 점수를 색 농도나 작은 막대로, 약 상태 작은 표시(먹음/거름/늦게/기록 없음 구분), 기록 없는 날은 비어 보이게. 선택된 날 강조.

### 1-3. `SkinDayForm` — 하루 기록
```ts
export default function SkinDayForm(props: {
  value: SkinDraft;
  onChange: (patch: Partial<SkinDraft>) => void;   // 바뀐 필드만
  onSave: () => void;
  saving: boolean;
  savedAt: string | null;       // '오후 9:12에 저장됨' 같은 문구를 내가 만들어 넘김
  isToday: boolean;
}): JSX.Element
```
섹션 순서(위가 제일 자주 씀, 카드 하나씩):
1. **오늘 점수** — 팽진(부푼 자국) 0~3, 가려움 0~3을 각각 4칸 선택(0 없음 · 1 약간 · 2 보통 · 3 심함, 칸마다 짧은 설명). 둘을 더한 「오늘 UAS n / 6」 크게. **「오늘은 증상 없음」 버튼** 하나로 둘 다 0. (null과 0이 달라 보여야 함 — 안 적은 상태는 비어 있게)
2. **약** — 항히스타민 기본 1줄: 먹음 / 늦게 / 거름 세 버튼 + 시각(time input). 「약 추가」로 줄 늘리기(이름·용량·시각·상태).
3. **증상이 올라온 때** — 0개 이상: 시작 시각, 지속(분), 부위(AREAS 칩 여러 개), 체크 2개 「한 자국이 24시간 넘게 갔어요」「멍처럼 남았어요」. 「추가」 버튼.
4. **붓기** — 입술·눈 붓기 있음/없음 + 부위 칩(입술, 눈, 목·혀). **목·혀를 고르면 그 자리에 빨간 경고 띠**: 「목·혀가 붓거나 숨이 차면 지금 바로 119」.
5. **흔적** — 흔적 없음 / 색소 남음 / 긁은 상처 중 하나.
6. **의심 가는 것** — TRIGGERS 칩 여러 개 + 「직접 쓰기」로 목록 밖 값 추가(칩으로 붙음).
7. **먹은 것** — 줄마다 시각 + 내용, 「추가」.
8. **생활** — 잠 몇 시간(0.5 단위), 가려워서 깼어요(예/아니오), 물(ml, 빠른 버튼 +250), 스트레스 0~10 슬라이더.
9. **생리** — 생리 중(예/아니오) + 주기 n일째(선택).
10. **새로 쓴 제품** — 칩 추가(화장품·세제 등).
11. **메모** — 여러 줄.
- 화면 아래 붙는 **저장 막대**: 「저장」 버튼(저장 중 표시) + savedAt 문구.
- 섹션 3~10은 기본으로 접혀 있다가 눌러서 펼치기(값이 있으면 요약 한 줄 보이기). 매일 30초 안에 점수·약만 찍고 끝낼 수 있어야 한다.

### 1-4. `SkinJournalView` — 화면 틀
```ts
export default function SkinJournalView(props: {
  header: { onBack: () => void; onOpenInsights: () => void };   // 오른쪽 위 「분석」 버튼
  week: React.ComponentProps<typeof SkinWeekStrip>;
  form: React.ComponentProps<typeof SkinDayForm>;
}): JSX.Element
```
위에서부터: 뒤로가기 · 「꼼이 피부 일지」 · 분석 버튼 → SkinWeekStrip → 선택한 날짜 크게 → SkinDayForm.

---

## 2부 — 분석·상담 화면 (여기는 **전문적인 느낌**)

기록 화면보다 한 톤 단정하게: 병원 차트처럼 얇은 구분선, 숫자는 `tabular-nums`, 작은 대문자 느낌 라벨(자간 살짝), 색은 절제. 전문적이되 무섭지 않게. 같은 CSS 변수 안에서.

### 2-1. `DoctorPacer` — 의사 꿀됑이 왔다 갔다
```ts
export default function DoctorPacer(props: {
  src: string;          // 오른쪽을 보고 제자리에서 걷는 투명 배경 움짤(webp). 크기 약 96px
  thinking?: boolean;   // true면 걸음을 멈추고 제자리에서 고민(그냥 멈춤 + 작은 「…」 말풍선 점 3개 애니)
}): JSX.Element
```
- 화면 상단 띠(높이 약 120px) 안에서 왼쪽 끝 ↔ 오른쪽 끝을 천천히 왕복(한쪽 약 5초). 끝에 닿으면 1초 멈췄다가 **좌우 뒤집어서(scaleX -1)** 돌아간다. 걸을 때 위아래로 아주 살짝 통통.
- `prefers-reduced-motion`이면 가운데에 멈춰 있기.

### 2-2. `SkinInsightsView` — 분석 화면
```ts
export default function SkinInsightsView(props: {
  doctorSrc: string;
  thinking: boolean;                    // 분석 불러오는 중
  onBack: () => void;
  onOpenChat: () => void;               // 「Claude와 상담하기」
  summary: {
    uas7: number | null;                // 최근 7일 UAS 합 (0~42)
    uas7Prev: number | null;            // 그 전 7일
    daysLogged: number; daysTotal: number;   // 최근 30일 중 기록한 날
    medMissedDays: number;
    afterMissedAvg: number | null;      // 약 거른 '다음날' 평균 UAS
    afterTakenAvg: number | null;       // 약 먹은 '다음날' 평균 UAS
  };
  series: { date: string; uas: number | null; med: MedStatus | null }[];  // 최근 30일
  triggers: { name: string; days: number; avgUas: number }[];          // 많이 나온 순, 최대 6개
  areas: { name: string; days: number }[];
}): JSX.Element
```
- 맨 위 DoctorPacer 띠 → 큰 숫자 카드 「최근 7일 UAS7」 + 지난주 대비 화살표 + 단계 칩(0 증상 없음 · 1~6 잘 조절됨 · 7~15 가벼움 · 16~27 중간 · 28~42 심함) → **30일 그래프**(막대 = UAS, 약 거른 날은 막대 아래 작은 표시; recharts 써도 됨) → 「약 거른 다음날 vs 먹은 다음날」 두 숫자 나란히 비교 카드 → 의심 요인 표(이름 · 나온 날 · 그날 평균 UAS) → 부위 빈도 → 아래 큰 버튼 「Claude와 상담하기」.
- 기록이 7일 미만이면 각 카드에 「기록이 더 쌓이면 보여요」 빈 상태.
- 맨 아래 작게: 「이 화면은 기록을 정리한 것이고 진단이 아니에요. 진료는 피부과·알레르기내과에서.」

### 2-3. `SkinChat` — Claude와 상담
```ts
export default function SkinChat(props: {
  messages: { id: string; role: 'user' | 'assistant'; text: string; at: string }[];
  streamingText: string | null;     // 답이 오는 중이면 지금까지 글자
  onSend: (text: string) => void;
  sending: boolean;
  onBack: () => void;
  suggestions: string[];            // 빈 화면에 보일 질문 예시 칩
}): JSX.Element
```
- 머리: 「Claude」 이름과 작은 칩 **「Anthropic의 AI」** — 상대가 사람이 아니라 Claude라는 게 늘 보이게. 의사 꿀됑 작은 얼굴은 쓰지 말 것(꿀됑은 분석 화면 장식, 상담 상대는 Claude).
- 머리 아래 얇은 고정 띠: 「진단이 아니라 기록을 같이 보는 대화예요 · 입술·혀·목이 붓거나 숨이 차면 119」.
- 말풍선: 꼼이(오른쪽, `--sd-rel-soft`), Claude(왼쪽, 카드색). Claude 답에는 줄바꿈·목록이 있을 수 있으니 줄바꿈 유지. 시간 작게.
- 오는 중이면 마지막 말풍선에 글자가 이어 붙고 커서 깜빡임.
- 입력칸: 알약 모양, 1~4줄, 16px, 보내기 버튼(코랄). 빈 화면엔 suggestions 칩.

---

파일은 컴포넌트마다 따로(`SkinPinGate.tsx`, `SkinWeekStrip.tsx`, `SkinDayForm.tsx`, `SkinJournalView.tsx`, `DoctorPacer.tsx`, `SkinInsightsView.tsx`, `SkinChat.tsx`), 공통 타입은 `skinUi.ts` 하나에. 시그니처(이름·인자)는 위 그대로, 외부 라이브러리 추가 금지(recharts만 허용), 모든 글자는 한국어.
