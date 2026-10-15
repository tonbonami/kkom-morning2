# 제미나이에게 — 카톡식 이모티콘 추천 트레이 디자인

> 우댕: 아래 "보낼 글" 전체를 제미나이에 붙여 넣고, **카톡 스크린샷 2장**(사랑 쳤을 때 추천 뜬 화면)을 같이 첨부해 주세요.
> 제미나이가 준 코드를 받아 오면 꼼모닝 세션이 **값 하나 안 바꾸고 그대로** 넣고, 데이터만 연결해요.

---

## 보낼 글

커플 채팅 앱(Next.js + React + Tailwind + framer-motion, 아이폰 웹뷰)의 **이모티콘 추천 트레이** 컴포넌트를 디자인해서 TSX 파일 하나로 줘.

### 참고: 카카오톡 (첨부 스크린샷)
- 입력창 바로 위에 **흰 둥근 트레이**가 떠 있고, 그 안에 추천 이모티콘이 **큼직하게**(약 100px) 가로로 늘어서서 가로 스크롤된다.
- 트레이 오른쪽 끝에 **✕ 닫기** 버튼이 고정돼 있다(스크롤해도 제자리).
- 한 글자만 쳐도 뜨고, 치는 동안 계속 바뀐다.

### 지금 우리 앱 (바꿀 것)
- 입력바 위 높이 60px 띠, 왼쪽에 ✨ 아이콘, 48px 정사각 칸에 이모티콘. 너무 작고 카톡보다 눈에 안 띈다.

### 만들 것: `StickerSuggestTray.tsx`

```ts
export type SuggestItem = { id: string; thumb: string; label: string };   // id = 고유키(React key로 쓸 것), thumb = 투명 PNG/WebP 그림, label = 접근성 이름
export default function StickerSuggestTray(props: {
  items: SuggestItem[];            // 0~12개. 0개면 아무것도 안 그림(사라지는 애니메이션은 부모 AnimatePresence가 아니라 이 컴포넌트 안에서)
  onPick: (item: SuggestItem) => void;   // 탭 = 바로 전송
  onClose: () => void;             // ✕ — 지금 치는 단어 동안 숨김(언제 다시 뜰지는 부모가 정함)
  reduceMotion?: boolean;          // true면 움직임 최소화
}): JSX.Element | null
```

### 꼭 지킬 것
- **색은 아래 CSS 변수만** 써서 밝은·어두운 채팅 테마를 모두 따라가게. 하드코딩 색 금지(✕ 아이콘·그림자 포함).
  - `--ct-header` 입력바 배경(반투명) · `--ct-sheet` 서랍 배경 · `--ct-sheet-border` 테두리 · `--ct-cell` 칸 배경 · `--ct-cell-shadow` 칸 그림자 · `--ct-label` 보조 글자색 · `--ct-tab-active` 강조 배경(분홍 기운)
  - 앱 강조색은 분홍 `#FB7BA8` (✕나 눌림 상태에 쓰고 싶으면 이것만).
- 이모티콘 그림은 **배경 없는 투명 그림**이다. 칸 배경 없이 그림만 크게 둬도 되고, 아주 연한 칸을 둬도 된다 — 카톡처럼 **그림이 주인공**이게.
- 이모티콘 크기 **88~100px**. 화면 폭 375px에서 3.5개쯤 보여서 옆으로 더 있다는 게 느껴지게.
- 가로 스크롤은 스크롤바 숨김, 손가락으로 부드럽게. 탭하면 살짝 눌리는 반응(whileTap scale).
- ✕는 오른쪽 끝 고정, 누를 수 있는 크기 44px 이상, `aria-label="추천 닫기"`.
- 트레이 등장: 아래에서 살짝 올라오며 나타남(200ms 안팎). **목록이 바뀔 때마다 트레이 전체가 깜빡이지 않게** — 칸은 `item.id`를 key로, 새로 들어온 칸만 살짝 페이드.
- `reduceMotion`이면 이동 없이 투명도만.
- 이미지 태그는 `<img>`(next/image 말고), `draggable={false}`, `loading="eager"`.
- lucide-react 아이콘만 사용(✕ = `X`).
- 파일 하나, 외부 라이브러리 추가 금지(react, framer-motion, lucide-react, tailwind만).

### 놓일 자리
채팅 화면 맨 아래 입력바 **바로 위**. 입력바는 `--ct-header` 배경에 위쪽 얇은 테두리가 있다. 트레이는 입력바와 붙어 보여도 되고, 카톡처럼 살짝 떠 있는 둥근 카드여도 된다 — 더 예쁜 쪽으로.
