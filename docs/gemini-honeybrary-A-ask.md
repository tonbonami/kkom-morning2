
## 이번 일 — 허니브러리 1/3: 바탕 결(토큰) + 책장 화면 + 책 놓기 + 홈 카드

허니브러리는 세 번에 나눠 의뢰한다. 이번(1/3)에 정한 **토큰·표지·시트 틀**을 2/3(책 화면·기록)과 3/3(감상 쓰기·감상 카드)이 그대로 가져다 쓴다 — 그러니 결을 여기서 단단히 정해 줘.

맨 아래에 사이담 사이브러리의 **실제 코드**(책장 화면·표지·진행 줄)를 붙인다. **짜임·문구·⚠️ 주의는 그대로** 두고, 사이담 전용(`useSpaceState`·`SpaceGate`·`LoadFailed`·`useEscClose`·`hasSeen`·`var(--sd-star)`·`var(--sd-sheet)`·`var(--sd-ground)`·uid·방·다크 모드)은 빼고 꼼모닝 결(꿀빛)로 다시 입혀 줘.

### 만들 파일 8개

#### ① `src/lib/honeybraryTheme.ts` ('use client' 불필요) — 허니브러리 전 화면이 쓰는 값
```ts
import type React from 'react';
export const HONEY: {
  ground: string;        // 책장·책 화면 바탕(아주 옅은 꿀빛 크림 — 앱 바탕 #FCFAF7 와 이어지게)
  paper: string;         // 꿀빛 종이 #F8E7BE 계열
  paperStyle: React.CSSProperties;  // 감상 카드 등 「종이」 바탕 style(꿀빛 편지지 결: 바탕색 + 가장자리 inset 음영)
  card: string;          // 책 카드·입력칸의 흰 면
  ink: string; muted: string; faint: string; line: string;
  accent: string;        // 주 버튼 바탕(꿀·호박색 계열, 흰 글자와 대비 4.5:1 이상 — 너무 밝은 노랑이면 글자가 안 읽힌다)
  accentInk: string;     // 주 버튼 글자
  accentSoft: string;    // 고른 칩·고른 칸 바탕
  accentSoftInk: string; // 그 위 글자
  bar: string; barTrack: string;    // 진행 막대 / 막대 바탕
  star: string; starEmpty: string;  // 별(감상 안에서만 쓴다)
  seal: string; sealInk: string;    // 밀랍 도장 / 압인
  sheet: string;         // 아래에서 올라오는 시트 바탕
  shadowCard: string;    // 카드 그림자(box-shadow 값)
  crit: string;          // 지우기·경고 글자
};
```

#### ② `src/components/honeybrary/HoneyBookCover.tsx` — 책 표지(세로 2:3)
```ts
export interface HoneyBookCoverProps { title: string; src?: string; width: number; rounded?: number /*기본 10*/; className?: string }
```
- 사진이 있으면 사진(`object-cover`, `loading="lazy"`), 없으면 **제목으로 만든 표지**. ⚠️ 사진 없는 책이 대부분이다 — 빈 회색 칸은 책장이 고장 난 것처럼 보인다. 제목에서 색을 정해 **늘 같은 책은 같은 색**(사이담 코드의 hueOf 방식).
- 사이담 표지 색(분홍·민트·하늘·보라 파스텔 그라디언트)은 꼼모닝에선 들뜬다 → **천으로 싼 양장본**처럼 차분한 색 6가지(꿀빛과 어울리게: 밀랍·차·올리브·먹청·벽돌·자두 같은 낮은 채도), 왼쪽에 책등 그림자 한 줄, 제목은 크기에 맞춰. 반짝이·무늬 금지.

#### ③ `src/components/honeybrary/ReaderProgressLine.tsx` — 진행 한 줄
```ts
export interface ReaderProgressLineProps { name: string; reading: ReadingVM; compact?: boolean }
```
- 「우댕 · 182 / 320쪽 ▬▬▬▭」, 「꼼이 · 90쪽까지」, 「꼼이 · 읽는 중」 — `progressView` 를 써. ⚠️ 막대는 `kind==='bar'` 일 때만. 두 사람 줄은 겨루듯 나란히 두지 말고 위아래 한 줄씩(부르는 쪽이 쌓는다).

#### ④ `src/components/honeybrary/HoneySheet.tsx` — 아래에서 올라오는 시트 틀(2/3·3/3도 쓴다)
```ts
export interface HoneySheetProps {
  open: boolean; title: string; onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;   // 아래 고정 단추 자리(안전영역 위)
  tall?: boolean;             // true 면 화면 거의 전체(감상 쓰기용), 아니면 내용만큼
}
```
- 뒤 어둡게(눌러 닫기) + 시트 `y` 스프링. 머리: 제목 + ✕(lucide X). 내용이 길면 시트 안에서만 스크롤. Esc 로 닫기(`keydown`). `z-50`. `backdrop-blur` 금지.

#### ⑤ `src/components/honeybrary/HoneyBookCard.tsx` — 책장의 책 한 권
```ts
export interface HoneyBookCardProps { book: BookVM; compact?: boolean; onClick: () => void }
```
- 기본: 표지 작은 판(`coverThumb`, 폭 58) + 제목(2줄까지) + 읽는 사람마다 `ReaderProgressLine compact`(이름은 '우댕'·'꼼이' 그대로). **별·권수·감상 여부 표시 금지.**
- `compact`(책장에 둔 책 줄): 폭 26 표지 + 제목 한 줄, 흐리게.

#### ⑥ `src/components/honeybrary/HoneybraryShelfScreen.tsx` — 책장 화면 전체
```ts
export interface HoneybraryShelfScreenProps {
  books: BookVM[];             // 놓은 순(최근 먼저). 칸 나누기는 shelfOf 로 네가 한다.
  loading: boolean;            // 처음 불러오는 중
  hasMore: boolean; loadingMore?: boolean; onLoadMore: () => void;   // 30권씩 「더 보기」
  firstHint: boolean; onCloseHint: () => void;                       // 처음 한 번 안내
  onBack: () => void; onOpenBook: (bookId: string) => void; onAddBook: () => void;
}
```
- 머리(위에 붙음): ← 홈 · 가운데 `HoneybraryLogo`(작게, height 40 안팎) + 「각자 읽고, 서로 한 줄씩」. 머리 바탕은 불투명(블러 금지).
- 처음 안내(✕로 닫기): 「새로 생긴 허니브러리예요」 / 「읽는 책을 놓고 생각이나 사진을 남기면, 상대가 그 아래 한 줄씩 이어 남길 수 있어요.」 / 「다 읽으면 별점과 사진으로 감상도 남겨요. 둘만 봐요.」 / 「진행은 각자 자기 것만 고칠 수 있고, 무엇을 해도 알림은 가지 않아요.」
- 빈 책장: 책 읽는 꿀됑(`HoneybraryLogo` 크게 또는 표지 두 권) + 「첫 책을 놓아 보세요」 + 「지금 읽는 책 하나면 돼요. 쪽수는 안 적어도 괜찮아요.」
- 칸: 「요즘 읽는 책」(비면 「지금 읽는 책이 없어요」) · 「다 읽은 책」(있을 때만) · 「책장에 둔 책」(있을 때만, compact 줄). **칸 제목 옆에 권수 금지.**
- 맨 아래 「더 보기」(hasMore 일 때만) · 아래 고정 주 버튼 「+ 책 놓기」(안전영역 위).
- 불러오는 중: 「책장을 여는 중…」.

#### ⑦ `src/components/honeybrary/BookPlacementSheet.tsx` — 책 놓기(`HoneySheet` 안)
```ts
export interface BookPlacementSheetProps {
  open: boolean; me: Person; busy: boolean; error?: string | null;
  onSubmit: (v: { title: string; readerMode: 'me' | 'partner' | 'both'; current?: number; total?: number; cover: File | null }) => void;
  onClose: () => void;
}
```
- 사이담 AddBookSheet 그대로: 표지 사진 고르기(84x126 점선 칸 「표지 사진 (안 넣어도 돼요)」, 고르면 미리보기 — `URL.createObjectURL`/`revokeObjectURL` 은 네가) · 「책 제목」(예: 소년이 온다, 100자) · 「누가 읽어요?」 **세 칸: 나 / {상대 이름} / 같이** · 「어디까지 읽었어요? · 안 적어도 돼요」 지금 쪽 / 전체 쪽(숫자만 5자리, 지금 > 전체면 「지금 쪽이 전체 쪽보다 커요.」) · 주 버튼 「책장에 놓기」(busy 면 「놓는 중…」).
- 열릴 때마다 칸을 비운다.

#### ⑧ `src/components/honeybrary/HoneybraryHomeCard.tsx` — 홈 카드(2×1, 다른 홈 카드들 사이)
```ts
export interface HoneybraryHomeCardProps { book?: BookVM /*요즘 읽는 책 하나 — 없으면 undefined*/; onOpen: () => void }
```
- 홈의 다른 카드와 같은 틀: `<button className="sd-card w-full h-full px-4 py-4 flex flex-col relative text-left active:scale-[.98] transition-transform">`, 높이는 칸이 정한다(최소 140px). ⚠️ `.sd-card` 는 `background` 묶음 값을 써서 Tailwind 바탕 클래스를 지운다 → 카드 바탕색은 **`style={{ background: … }}`** 로(꿀빛 아주 옅은 틴트).
- 위: `HoneybraryLogo`(height 56~64). 아래: 책이 있으면 표지 작은 판(폭 34 안팎) + 제목 한 줄 + 읽는 사람 진행 한 줄(`ReaderProgressLine compact`). 없으면 「둘이 읽는 책을 놓고, 한 줄씩 남겨요」.
- **권수·새 감상 수·별 금지.** 정지(움직임은 누를 때 scale 만).

### 답 형식
파일 8개 완성 코드(각각 맨 위 파일 이름 주석). 설명은 맨 끝 3줄 이내.

---
## 참고: 사이담 사이브러리 실제 코드 (짜임·문구 그대로 옮길 원본)
