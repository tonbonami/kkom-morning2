
## 편지지 2탄 — 고칠 점 (네가 준 4개 파일을 실제 프로젝트에 맞춰 보니 이렇다)

네 답(편지지 6장 + 고르는 칸 + LetterPaper·LetterComposeScreen 고침)을 그대로 꽂기 전에 확인했더니 아래 문제가 있다. **4개 파일 전부를 고친 완성본으로** 다시 줘(바뀌지 않는 파일도 전체를 다시). props 이름·타입은 그대로.

### 1. 동적으로 만든 Tailwind 클래스는 CSS가 안 생긴다 (색이 조용히 빠짐)
`LetterPaper.tsx` 의 `text-[${currentPaper.ink}]`, 날짜 도장의 `bg-[${…stamp.bg}] border-[${…stamp.border}] text-[${…stamp.fg}]` — Tailwind 는 소스에 **글자 그대로 적힌** 클래스만 만든다. 변수로 조립한 클래스는 만들어지지 않아 도장 바탕·테두리·글자색이 전부 빠진다. 또 `'var(--sd-rel)/20'` 은 CSS 색 값이 아니다(Tailwind 투명도 문법).
→ 편지지마다 달라지는 **색은 전부 `style={{ … }}`** 로 넣어. `stamp.border` 같은 값은 진짜 CSS 색(예: `rgba(228,104,94,.2)` 또는 `color-mix(in srgb, var(--sd-rel) 20%, transparent)`)으로.

### 2. 쓰기 화면에서 편지지 무늬가 지워진다
쓰기 화면 편지지 `div` 엔 `.sd-card` 가 같이 붙는다. 전역 CSS 의 `.sd-card { background: var(--sd-card); … }` 는 **`background` 한 줄 묶음**이라 `background-image`·`background-size` 까지 초기화하고, 이 규칙이 Tailwind 유틸리티보다 **뒤에** 있어서 이긴다. 그래서 `[background-image:…]` 같은 무늬 클래스는 쓰기 화면에서 사라진다(바탕색은 `!bg-[…]` 라 살아남음).
→ 무늬도 이기게 해 줘. 방법은 네가 골라: (가) 편지지 바탕·무늬를 클래스 대신 `LetterPaperTheme` 에 **`style` 값(React.CSSProperties: backgroundColor·backgroundImage·backgroundSize·backgroundPosition)** 으로 두고 편지지 `div` 에 `style` 로 넣기(인라인 style 은 `.sd-card` 를 이긴다), 또는 (나) 무늬 클래스마다 `!` 붙이기. (가)를 권한다 — 1번과도 맞는다. 그 경우 `className` 엔 `sd-card-paper` 만 남겨도 된다.
고르는 칸(`LetterPaperPanel`)의 작은 견본도 같은 값으로 그려서 실제 편지지와 똑같이 보이게.

### 3. 「줄노트」(#F8FDFE)·「체크」(#FDF7F5)는 거의 흰색이다 — 조건 위반
흰 말티푸 미니가 묻힌다(우댕이 아이보리에서 「꼼이 이모티콘이 잘 안 보여」라고 해서 살구로 바꾼 이유). 바탕색 자체가 **살구 #F9E0D6 만큼의 색감**이 있어야 한다. 줄노트·체크를 살구 정도 진하기의 다른 색으로 바꾸거나, 다른 편지지로 바꿔. 무늬 선·칸 색도 그 바탕 위에서 은은하게 보이는 정도로.

### 4. 「별밤」(어두운 편지지) — 쓰는 칸 글자가 안 보인다
글 쓰는 칸(`LetterEditor`, 고치지 않는 파일)은 글자색이 `var(--sd-ink)`(진한 색)·placeholder `var(--sd-faint)` 로 고정이라, 어두운 편지지에선 쓰는 동안 글자가 안 보인다. 이번엔 **어두운 편지지는 빼고** 밝은 편지지로 바꿔 줘(6장 유지). 그러면 `ink`·`muted` 는 6장 모두 기본값이어도 된다.

### 5. 「꼼이발자국」은 그냥 점 무늬다
이름이 발자국이면 발바닥처럼 보이게(큰 동그라미 하나 + 작은 동그라미 3~4개를 `radial-gradient` 여러 개로 한 덩어리) 하거나, 점 무늬 그대로면 이름을 바꿔. 무늬는 은은하게.

### 그대로 둘 것
- 첫 장 살구(`id:'peach'`, `#F9E0D6`)는 지금과 **똑같이** 보여야 한다(옛 편지 전부 이걸로 보인다).
- `LETTER_PAPER_CLASS` export 유지, 고르는 칸 구성(3열, 이름 Dongle), 도구줄 「편지지」(Palette) 자리.
- 편지지 `id` 는 영어 소문자로, 이번에 정하면 안 바꾼다.
