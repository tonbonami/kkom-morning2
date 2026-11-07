
## 이번 일 — 편지지 2탄: 「편지마다 편지지 고르기」

⚠️ 위 공통 설명과 달라진 점: 편지지는 지금 **살구 단색 `#F9E0D6` 한 종류**다(`LETTER_PAPER_CLASS = '!bg-[#F9E0D6] sd-card-paper'`, 아이보리 아님). 우댕이 고른 색이고 **기본 편지지로 그대로 남긴다**(옛 편지도 전부 이걸로 보인다).

이번엔 편지를 쓸 때 **편지지를 골라서** 보내게 한다. 받는 사람은 보낸 사람이 고른 편지지로 읽는다. 저장·불러오기는 내가 하고(편지에 `paper: '<id>'` 한 칸), 너는 **편지지들과 고르는 칸, 그리고 그걸 받는 화면 둘레**를 만든다.

### 편지지 디자인 조건 (가장 중요)
- **6장**(기본 살구 포함). 둘이 쓰는 커플 앱이니 둘의 캐릭터·계절·기분이 떠오르게. 예를 들면(꼭 이대로가 아니어도 됨): 꿀됑(꿀벌 조끼 아기돼지, 노랑·갈색 줄무늬, 꿀)의 꿀빛 벌집 무늬, 꼼이(흰 말티푸, 분홍 리본)의 발바닥·리본, 밤하늘·별, 줄 노트, 체크. 이름은 짧은 한국어(「살구」「꿀단지」처럼 2~4글자).
- 무늬는 **CSS 만으로**(그라디언트·`radial-gradient` 반복 무늬). 그림 파일 쓰지 마. 무늬는 **아주 은은하게** — 글이 주인공이다. 본문(진한 글자 `--sd-ink:#2E1D26`)이 어느 편지지에서도 또렷해야 한다.
- ⚠️ **흰 말티푸 미니 이모티콘(흰 털)이 묻히면 안 된다** — 우댕이 처음에 아이보리 편지지에서 「꼼이 이모티콘이 잘 안 보여」라고 해서 살구로 바꿨다. 그래서 편지지 바탕은 **흰색·아이보리처럼 너무 밝으면 안 되고**, 살구(#F9E0D6) 정도의 색감이 있어야 한다. 베이지·회색 계열은 우댕이 「색감도 없네」라고 해서 빼.
- 너무 어두운 편지지(밤하늘 등)를 넣는다면 본문·To/From·날짜 도장 글자색까지 그 편지지에 맞춰야 한다 → 편지지마다 글자색 묶음을 같이 정해 줘(아래 `ink`·`muted`). 어렵다면 어두운 건 빼.
- `.sd-card` 가 같이 붙는 곳이 있어서 바탕 클래스엔 **`!` 를 꼭** 붙여(`!bg-[…]`). 지금 클래스 끝의 `sd-card-paper` 는 그대로 붙여.

### 만들 파일 (새로 2개 + 고칠 파일 2개)

#### ① `src/lib/letterPapers.ts` (새로 — 'use client' 필요 없음)
```ts
export interface LetterPaperTheme {
  id: string;          // 저장되는 값 — 영어 소문자, 한 번 정하면 안 바꾼다(예: 'peach')
  name: string;        // 고르는 칸에 보이는 짧은 한국어 이름
  className: string;   // 편지지 바탕(무늬 포함). 예: '!bg-[#F9E0D6] sd-card-paper'
  ink: string;         // 본문·To/From 글자색 (CSS 색 값)
  muted: string;       // 날짜·흐린 글자색
  stamp: { bg: string; fg: string; border: string };   // From 날짜 도장 색
}
export const DEFAULT_PAPER_ID = 'peach';
export const LETTER_PAPERS: LetterPaperTheme[] = [ /* 6장, 첫 번째가 지금 살구 그대로 */ ];
export function paperById(id?: string | null): LetterPaperTheme;   // 모르는 id·없음 → 살구
```

#### ② `src/components/letter/LetterPaperPanel.tsx` (새로) — 쓰기 화면 아래 도구 칸에 들어가는 편지지 고르기
```ts
export interface LetterPaperPanelProps {
  papers: LetterPaperTheme[];
  value: string;                 // 지금 고른 id
  onChange: (id: string) => void;
}
```
- 작은 편지지 견본(무늬 그대로, 둥근 모서리) + 이름. 한 줄에 3장, 고른 것 또렷하게. 위에 짧은 제목(「편지지 · 받는 사람도 이 편지지로 읽어요」 정도).

#### ③ `src/components/letter/LetterPaper.tsx` (고치기 — 지금 코드 아래 첨부)
- props 에 `paper?: LetterPaperTheme` 추가 → 바탕 `className` 과 글자색(`ink`·`muted`)·날짜 도장(`stamp`)을 그 편지지 것으로. 없으면 `paperById()` 기본(살구) = 지금과 똑같이 보여야 한다.
- `LETTER_PAPER_CLASS` export 는 남겨 둬(다른 곳이 아직 쓴다) — 값은 살구 편지지 className 과 같게.
- 나머지 props·동작(수정·저장·미니 단추, 동봉한 것 칸)은 그대로.

#### ④ `src/components/letter/LetterComposeScreen.tsx` (고치기 — 지금 코드 아래 첨부)
- `LetterTool` 에 `'paper'` 추가, 도구줄에 「편지지」 단추(lucide 아이콘 하나 골라). 자리는 네가 보기 좋게(음성·손글씨·스티커·편지지·예약 다섯 개가 한 줄에 들어가게).
- props 에 `paper: LetterPaperTheme` 추가 → 쓰는 중인 편지지(지금 `LETTER_PAPER_CLASS` 쓰는 자리)와 To/날짜/From 글자색이 고른 편지지로 바로 바뀌게.
- 나머지 props 이름·동작은 그대로(내가 그대로 꽂는다).

### 지금 코드
