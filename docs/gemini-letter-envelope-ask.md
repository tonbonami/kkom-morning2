
## 이번 일 — 편지 3탄: 처음 열 때 봉투가 열리는 순간 + 귀퉁이 생각풍선

GPT 와 회의해서 정한 것(`docs/gpt-letter-envelope-answer.md` 요약):
- 받은 사람이 편지를 **처음 열 때 한 번만** 봉투가 열린다. 그 뒤로는 바로 편지. 「처음인지」 판단·기록은 내가 한다(너는 화면만).
- 편지함에서 편지를 누르면 아래에서 읽기 창이 올라오고, 그 안에서 **닫힌 봉투 → 덮개가 젖혀짐 → 내용 없는 종이가 위로 올라옴 → 봉투가 빠지고 실제 편지지가 펼쳐짐**. 두 번째 탭 없이 저절로. 「확 열리는」 시원함, 그러나 짧게.
- 꿀됑(우댕 캐릭터, 꿀벌 조끼 아기돼지)과 꼼이(흰 말티푸)가 **생각풍선** 안에 들어가 귀퉁이에 떠 있다. 꿀됑 왼쪽 위, 꼼이 오른쪽 아래. 보낸 사람 쪽이 살짝(약 8px) 크게.
- 우댕 한 줄: **「버벅이게 하는 것은 절대 금지.」** ← 이번 일의 제1 조건.

### ⚠️ 성능 규칙 (하나라도 어기면 못 쓴다)
- 움직임은 **`transform`(translate·scale·rotate, 3D 회전 포함)과 `opacity` 만**. `filter`·`blur`·`box-shadow`·`backdrop-filter`·`clip-path`·`width/height/top/left/margin`·배경색 같은 값을 **움직이지 마**(정지 상태로 쓰는 건 괜찮다). framer-motion `layout`·`layoutId` 금지.
- 움직이는 요소는 열 개 남짓. 무한 반복(`repeat: Infinity`) 금지 — 한 번 움직이고 멈춘다.
- 봉투·덮개·밀랍은 **CSS 도형**(div + border-radius/정지 clip-path/그라디언트)으로. 그림 파일·GIF·영상·SVG 필터 금지. 그림은 캐릭터 두 장뿐(내가 미리 불러 두고 `src` 로 준다).
- 덮개 3D 젖힘을 쓰면 `perspective` + `backface-visibility: hidden` + `transform-origin: top`.
- 봉투가 다 열리기 전엔 실제 편지·동봉물을 그리지 않는다(내가 `opened` 때만 children 을 꽂는다). 올라오는 종이는 **내용 없는 색 판**.
- `prefers-reduced-motion` 이면 움직임 없이 곧장 `onComplete`.

### 만들 파일

#### ① `src/lib/letterEnvelopes.ts` (새로, 'use client' 불필요)
편지지 6장(`src/lib/letterPapers.ts` 의 id: `peach` 살구 #F9E0D6 · `rose` 로즈 #F3D5DB · `sage` 세이지 #D5E3D8 · `ruled` 코튼줄 #F6E6CA · `sky` 은하늘 #D5E2EC · `honey` 꿀빛 #F8E7BE)마다 어울리는 봉투 색.
```ts
export type EnvelopePalette = {
  body: string; flap: string; lining: string;   // 봉투 몸통·덮개·안쪽 안감
  paperPreview: string;                          // 올라오는 내용 없는 종이 색(= 편지지 바탕과 같게)
  seal: string; sealInk: string;                 // 밀랍 도장(글자 없이 하트 압인)
  labelInk: string;                              // 봉투 앞 「From. 우댕」 글자색
};
export const ENVELOPE_BY_PAPER: Record<string, EnvelopePalette>;
export function envelopeFor(paperId?: string | null): EnvelopePalette;   // 모르는 id → 살구
```
- 세련되게(지난번 「촌스럽다」 평을 받은 건 채도 높은 파스텔 + 빽빽한 반복 무늬). 차분한 종이 봉투, 안감에 아주 은은한 색.
- 밀랍은 날짜 도장(편지지 속 `From. 이름 날짜` 사각 배지)과 **다른 토큰** — 같은 색으로 묶지 마.

#### ② `src/components/letter/ThoughtBubble.tsx` (새로)
```ts
export interface ThoughtBubbleProps {
  src: string;                 // 캐릭터 그림(글씨 없는 상반신, 투명 배경)
  size: number;                // 풍선 지름 px (64~80)
  tail: 'down-right' | 'up-left' | 'down-left' | 'up-right';   // 꼬리 동그라미 2개가 향하는 쪽
  appear?: boolean;            // true 면 한 번 살짝 떠오르며 나타남(2~3px), false 면 정지
}
```
- 구름처럼 둥근 풍선(테두리 얇게, 바탕은 흰색 92% 정도), 안에 캐릭터. 장식이라 `aria-hidden`, `alt=""`.

#### ③ `src/components/letter/EnvelopeReveal.tsx` (새로)
```ts
type Person = '우댕' | '꼼이';
export type OpeningPhase = 'closed' | 'opening' | 'opened';
export interface EnvelopeRevealProps {
  phase: OpeningPhase;          // closed: 닫힌 봉투(내가 확인 중일 때도 이것) → opening: 여는 순서 재생 → opened: 아무것도 안 그림(null)
  fromName: Person;
  toName: Person;
  palette: EnvelopePalette;
  kkulSrc: string;              // 꿀됑 그림 — 왼쪽 위
  kkomSrc: string;              // 꼼이 그림 — 오른쪽 아래
  reducedMotion: boolean;
  durationMs?: number;          // 여는 순서 전체 길이, 기본 700 (나는 시험 화면에서 700·1000·1300 을 비교한다 — 비율로 늘어나게)
  bubbles?: 'opening' | 'none'; // opening: 봉투와 같이 떴다가 같이 사라짐(기본). none: 안 그림(읽는 내내 띄우는 건 ④로 내가 따로 붙인다)
  onSkip: () => void;           // 오른쪽 위 「바로 열기」
  onComplete: () => void;       // 여는 순서가 끝나면 한 번
}
```
- 순서(700ms 기준 — `durationMs` 비율로): 0~100 자리 잡기 · 100~280 덮개 빠르게 젖힘(작은 오버슈트 2~3%) · 220~510 내용 없는 종이 위로 · 430~700 봉투·풍선 빠지며 종이가 화면 편지지 자리로 펼쳐짐 → `onComplete`.
- 봉투 앞: 작은 「From. 우댕」(Dongle 글꼴, `labelInk`), 덮개 끝에 밀랍(하트 압인). 받는 사람 이름은 안 써도 됨.
- 봉투가 놓이는 곳: 읽기 창 안쪽 위(편지지가 펼쳐질 자리). 폭은 화면 폭 390px 기준 안쪽 여백 16px. 「바로 열기」 단추(44px 이상)는 오른쪽 위 — 캐릭터 풍선이 단추·봉투를 가리지 않게.

#### ④ `src/components/letter/LetterCornerBubbles.tsx` (새로) — 읽는 내내 귀퉁이에 은은하게 (시험용 선택지)
```ts
export interface LetterCornerBubblesProps {
  kkulSrc: string; kkomSrc: string;
  fromName: '우댕' | '꼼이';     // 보낸 사람 쪽 조금 크게
}
```
- 편지지(`relative` 상자) 위에 `absolute` 로 겹쳐 놓는 층. 꿀됑 왼쪽 위·꼼이 오른쪽 아래, 편지지 밖으로 반쯤 걸치게. **본문 글자·To·From 도장·수정 단추를 가리지 않게** 작게(52~60px). 정지(처음 한 번 나타남만). `pointer-events: none`.

#### ⑤ `src/components/letter/UnopenedLetterCard.tsx` (새로) — 편지함 목록의 「안 연 편지」 한 칸
```ts
export interface UnopenedLetterCardProps {
  fromName: '우댕' | '꼼이';
  dateText: string;             // 예: '11월 7일 (토) 오후 3:12'
  palette: EnvelopePalette;
  onOpen: () => void;
}
```
- 작은 닫힌 봉투 그림(CSS 도형) + 「꼼이에게서 편지가 왔어요」 + 작은 「봉투를 열어 봐」. 본문·이모티콘·음성 여부는 보이지 않게. 정지(움직임 없음, 누를 때 `whileTap` 만).

### 지금 쓰는 디자인 값(공통 설명에서) — 글꼴 IBM Plex Sans KR·Dongle, `--sd-ink` `--sd-muted` `--sd-line` `--sd-rel` 등. 예전 초록(emerald)·slate 회색·보라 금지. 이모지 금지(아이콘은 lucide).

### 답 형식
파일 5개 완성 코드(각각 맨 위 파일 이름 주석). 설명은 맨 끝 3줄 이내. 파일을 열거나 명령을 실행하지 말고 답에 써 줘. **답이 길면 중간에 끊기니, 코드에 긴 주석·설명을 달지 말고 짧게.**
