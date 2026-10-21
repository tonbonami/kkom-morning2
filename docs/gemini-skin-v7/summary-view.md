## 만들 것: 「오늘 상담 정리」 화면 — SkinChatSummaryView.tsx (새 파일)

### 배경 (우댕 요청, GPT와 정한 흐름)
꼼이가 Claude와 상담한 뒤 「오늘 상담 정리하기」를 누르면, Claude가 그날 상담을 정리해 이 화면에 보여 준다.
1. **정리**: 오늘 이야기한 핵심 · 꼼이가 말한 사실 · 걱정과 질문 · 해 보기로 한 것/확인할 일 · (참고) Claude가 설명·제안한 것.
2. **일지에 반영할 후보**: 꼼이가 직접 말한 사실만(예: 「약 — 항히스타민제 3알 · 21:00 · 먹음」). 꼼이가 하나씩 켜고 끄고, **고칠 수 있다**(예: 2알 → 3알). 일지에 이미 다른 값이 있으면 「지금 일지: 2알」을 같이 보여 주고 「바꾸기 / 메모로만 남기기」 중 고른다. 날짜가 애매한 후보는 날짜를 골라야 반영된다.
3. **다음 상담에도 기억할 것**: 약 바꿈·의사가 한 말·걱정·해 보기로 한 것 같은 기억 후보. 켜고 끄고 글을 고칠 수 있다. 켠 것만 Claude가 다음 상담부터 기억한다.
4. 맨 아래 고정: 큰 버튼 「선택한 내용을 일지에 반영 (n개)」 + 작게 「나중에 하기」. 반영이 끝나면 완료 상태(「일지에 반영했어요」 + 「일지에서 보기」 「상담으로 돌아가기」).
우댕 폰(readOnly)은 정리와 후보를 읽기만 한다(토글·고치기·아래 버튼 없음, 「꼼이가 확인하면 일지에 들어가요」 한 줄).

**먼저 이 흐름에 대한 네 의견을 5줄 이내로 써 줘**(헷갈릴 곳, 더 쉬운 배치, 빼면 좋을 것). 그다음 코드.

### props (이대로 — 부모가 데이터·저장을 다 맡음)
```ts
export type EditValue =
  | { kind: 'number'; value: number | null; unit: string; min: number; max: number; step: number }
  | { kind: 'bool'; value: boolean | null }
  | { kind: 'text'; value: string; options: string[] }            // options가 있으면 칩으로 고르기(예: 흔적 없음·색소 남음·긁은 상처)
  | { kind: 'list'; value: string[] }                              // 칩 여러 개 + 직접 쓰기
  | { kind: 'med'; value: { name: string; dose: string | null; time: string | null; status: 'taken' | 'missed' | 'late' | null } }
  | { kind: 'episode'; value: { start: string | null; durMin: number | null; areas: string[] }; areaOptions: string[] }
  | { kind: 'food'; value: { t: string | null; text: string } }
  | { kind: 'angio'; value: { present: boolean; areas: string[] }; areaOptions: string[] };

export interface SummaryItem {
  id: string;
  fieldLabel: string;        // 「약」 「의심 가는 것」 …
  label: string;             // 한 줄 요약(고치면 부모가 새로 만들어 줌)
  evidence: string;          // 근거가 된 꼼이의 말(작게, 따옴표)
  certain: boolean;          // false면 「짐작」 작은 표시
  date: string | null;       // null이면 날짜 골라야 함
  current: string | null;    // 일지에 이미 적힌 값(다를 때만) — 있으면 바꾸기/메모로 고르기
  on: boolean;
  mode: 'replace' | 'note';
  edit: EditValue;
}
export interface MemoryRow { id: string; kindLabel: string; text: string; on: boolean }

export default function SkinChatSummaryView(props: {
  dateLabel: string;                         // '10월 21일 (화)'
  phase: 'loading' | 'ready' | 'error' | 'applying' | 'done';
  errorText?: string;
  readOnly: boolean;
  summary: { key: string[]; facts: string[]; worries: string[]; plans: string[]; claudeNotes: string[] } | null;
  items: SummaryItem[];
  memory: MemoryRow[];
  dateChoices: { value: string; label: string }[];   // 날짜 고르기 칩(오늘·어제·그저께)
  onBack: () => void;
  onRegenerate: () => void;                  // 「다시 정리」(머리 오른쪽, readOnly면 숨김)
  onToggleItem: (id: string) => void;
  onModeItem: (id: string, mode: 'replace' | 'note') => void;
  onDateItem: (id: string, date: string) => void;
  onEditItem: (id: string, value: EditValue['value']) => void;
  onToggleMemory: (id: string) => void;
  onEditMemory: (id: string, text: string) => void;
  onApply: () => void;
  onLater: () => void;
  onOpenJournal: () => void;                 // 완료 뒤 「일지에서 보기」
})
```
- 고치기: 후보 카드의 「고치기」를 누르면 그 카드 안에서 kind에 맞는 입력이 펼쳐진다(숫자는 −/+ 와 칸, bool은 예/아니오, text는 options 칩 또는 입력, list는 칩 지우기+추가, med는 이름·용량·시각·먹음/늦게/거름, episode는 시각·분·부위 칩, food는 시각·내용, angio는 있음/없음·부위 칩). 고친 값은 바로 onEditItem.
- loading: 「Claude가 오늘 상담을 정리하고 있어요」 + 옅은 깜빡이는 카드 3개(20~40초 걸릴 수 있음).
- error: errorText + 「다시 해 보기」(onRegenerate).
- 후보가 0개면 「일지에 넣을 새 사실은 없었어요」, 기억 후보 0개면 그 칸 숨김.
- 켜진 후보 중 date가 null인 게 있으면 그 카드에 빨간 테두리·「날짜를 골라 주세요」, 아래 반영 버튼 위에 한 줄 안내(버튼은 눌리되 부모가 막음).
- 반영 버튼 숫자 n = 켜진 후보 수 + 켜진 기억 수.
