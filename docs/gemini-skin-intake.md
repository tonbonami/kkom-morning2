# 제미나이에게 — 꼼이 초진 설문 화면 (SkinIntake)

> 우댕: 아래 Run 명령으로 클립보드에 넣고 제미나이(새 대화 OK)에 ⌘V.
> `awk '/^## 보낼 글/{f=1;next} f' docs/gemini-skin-intake.md | pbcopy`
> 받아 온 코드는 꼼모닝 세션이 값 하나 안 바꾸고 넣어요. 문항 86개(10개 섹션)는 데이터로 따로 넣어요.

## 보낼 글

커플 앱(Next.js 15 + React + Tailwind + framer-motion + lucide-react, 휴대폰 세로 375~430px)의 「꼼이 피부 일지」 안에 들어갈 **초진 설문 화면**을 TSX 컴포넌트 하나로 만들어 줘. 꼼이가 피부과·알레르기내과에 가기 전에 자기 피부 이력을 정리하는 설문이야(10개 섹션, 86문항, 지금 27문항까지 답함). 한 번에 다 안 해도 되고, 며칠에 걸쳐 섹션별로 이어서 하는 화면이야.

### 지금 앱 분위기 (그대로 따라가기)
- 바탕 `className="sd-app"`, 카드 `className="sd-card"`(반투명 흰 카드, 둥근 28px, 그림자), 덜 중요한 카드 `sd-card sd-card--quiet` — CSS에 이미 있음
- 색은 CSS 변수로만: 글자 `var(--sd-ink)` / 보조 `var(--sd-muted)` / 흐린 `var(--sd-faint)` / 구분선 `var(--sd-line)` / 옅은 면 `var(--sd-surface-2)` / 강조(코랄) `var(--sd-rel)`, 옅은 강조 `var(--sd-rel-soft)` / 위험 `var(--sd-crit)`. 다크 모드는 변수가 알아서 바뀌니 `bg-white` 같은 고정색 대신 변수로.
- 같은 앱의 다른 화면: 제목 `text-lg font-bold`, 카드 안 `p-5`, 칩·버튼 `rounded-xl`/`rounded-full`, 아이콘 lucide-react, 눌리는 건 `motion.button` + `whileTap={{ scale: 0.96 }}`. 글씨 14px 이상(본문 15~16px).
- 맨 위 머리는 `sticky`로 두되 `top: env(safe-area-inset-top)` 대신 `top-0`이어도 돼(바깥에서 상태바 자리를 따로 막아 줌).

### 데이터 모양 (그대로 써 줘)
```ts
export type IntakeQ = {
  id: string;                                   // '4.1'
  t: 'single' | 'multi' | 'scale' | 'text' | 'long';
  q: string;                                    // 질문 (꼼이에게 하는 반말)
  o?: string[];                                 // single/multi 선택지
  ends?: [string, string];                      // scale 양 끝 글자, 예 ['0 없음', '10 참기 힘듦']
  ph?: string;                                  // text/long 자리글자
  h?: string;                                   // 질문 아래 작은 도움말
  req?: 1;                                      // 꼭 답해 줬으면 하는 문항
  miss?: 1;                                     // 「잘 모르겠어」 칩을 함께 보여 줄 문항
  rev?: 1;                                      // 점수가 높을수록 좋은 문항(표시만 참고)
};
export type IntakeSection = { no: string; id: string; title: string; note?: string; qs: IntakeQ[] };
export type IntakeAnswer = string | string[];   // single·text·long·scale = string('0'~'10'), multi = string[]
```

예시(실제 문항 일부):
```ts
{ id: '1.7', t: 'single', q: '집 습도를 재거나 관리하고 있어?', o: ['습도계+가습기 둘 다 있음','가습기만 있음','습도계만 있음','둘 다 없음'], miss: 1, h: '겨울 실내 습도 30% 이하면 그것만으로도 각질·가려움이 설명되는 경우가 많아.' }
{ id: '2.4', t: 'scale', q: '가려움 강도', ends: ['0 없음', '10 참기 힘듦'], req: 1 }
{ id: '2.8', t: 'multi', q: '특히 나빠지는 때는? (다 체크)', o: ['밤·잘 때','자고 일어난 직후','땀 흘린 뒤','샤워 직후','스트레스 받을 때','생리 전후','계절 바뀔 때','추울 때','더울 때','특정 음식 먹은 뒤','특정 화장품 쓴 뒤','옷·마스크가 닿는 부위'], miss: 1 }
{ id: '10.4', t: 'long', q: '절대 못 바꾸거나 지키기 어려운 것', ph: '예: 야근 때문에 수면시간은 못 늘려. 커피는 못 끊어.', h: '솔직하게 적어줘. 못 지킬 계획을 세우는 게 제일 비효율적이야.', req: 1 }
```
섹션 10개: 01 기본 정보 · 02 지금 증상 · 03 진단 & 검사 기록 · 04 약 — 먹은 것, 바른 것 · 05 씻기·바르기·닿는 것 · 06 식습관 · 07 물 마시는 습관 · 08 수면 습관 · 09 스트레스·몸·생활 · 10 목표 — 뭘 먼저 잡을까. 섹션마다 `note`(꼼이에게 건네는 한두 줄)가 있어.

### 시그니처 (이름·인자 그대로)
```ts
export default function SkinIntake(props: {
  sections: IntakeSection[];
  answers: Record<string, IntakeAnswer>;
  firstSections: string[];                       // 먼저 하면 좋은 섹션 id 순서, 예 ['goal', 'med']
  onAnswer: (id: string, value: IntakeAnswer | null) => void; // null = 답 지우기
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  readOnly: boolean;                             // true면 답만 보기(우댕 폰) — 모든 입력 잠금
  onBack: () => void;
}): JSX.Element
```

### 원하는 것
1. **목차 화면**(처음 열 때): 머리(뒤로 · 「초진 설문」), 전체 진행(예: 27 / 86, 얇은 진행 막대), 그 아래 섹션 카드 10개 — 번호·제목·「n / 전체」·완료 표시. `firstSections`에 든 섹션은 맨 위로 올리고 「먼저」 칩. 섹션을 누르면 그 섹션 화면으로.
2. **섹션 화면**: 머리(뒤로 = 목차), 섹션 번호·제목, `note`를 말풍선처럼 부드럽게, 그 아래 문항들을 카드로 차례대로. 맨 아래 「이전 섹션 / 다음 섹션」.
3. **문항 종류별 입력**
   - single: 칩 한 개 고르기(다시 누르면 해제 → onAnswer(id, null))
   - multi: 칩 여러 개(전부 빼면 null)
   - scale: 0~10 숫자 11칸 한 줄(좁으면 두 줄), 양 끝 `ends` 글자를 아래 작게
   - text: 한 줄 입력, long: 여러 줄(자동 높이). 둘 다 **입력칸에서 벗어날 때(blur)** onAnswer
   - `miss`가 있으면 선택지 끝에 「잘 모르겠어」 칩 — 값은 single이면 '모름', multi면 ['모름'](다른 칩과 함께 못 고름)
   - `h`는 질문 아래 작은 도움말(Lightbulb 아이콘 + 흐린 글자), `req`는 질문 옆 작은 「꼭」 칩
   - 답한 문항은 카드 테두리나 작은 체크로 답했음을 알 수 있게
4. **저장 표시**: 머리 오른쪽에 saveState — 저장 중… / 저장됨(체크) / 저장 못 했어요(빨강). 자동 저장이라 저장 버튼은 없어.
5. **readOnly**: 모든 입력 잠그고(눌러도 안 바뀜) 머리 아래에 「보기 전용이에요 — 설문은 꼼이만 써요」 한 줄.
6. 섹션 화면을 바꿀 때 맨 위로 스크롤.

파일 하나(`SkinIntake.tsx`), 외부 라이브러리 추가 금지, 모든 글자는 한국어(질문 문구는 데이터 그대로).
