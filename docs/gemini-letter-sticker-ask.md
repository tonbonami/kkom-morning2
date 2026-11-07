
## 이번 일 — 편지 큰 이모티콘 2탄: 「고르는 창 새로」 + 「보낸 사람 사인」

지난번에 편지 쓰기·읽기 화면을 새로 했다(아래 지금 코드 두 개 첨부). ⚠️ 위 공통 설명과 달라진 점: **편지지 색은 이제 살구 단색 `#F9E0D6`**(아이보리 아님). 편지지 클래스는 `LETTER_PAPER_CLASS`(`'!bg-[#F9E0D6] sd-card-paper'`)로 이미 있다 — 이 일에서 편지지 색은 건드리지 마.

이번엔 편지 아래에 붙이는 **큰 이모티콘**(한 편지에 최대 3개) 차례다.

1. **팩이 1개 → 8개(121개)로 늘었다.** 꼼이 움짤(26, 움직이는 webp)·말티푸(19)·꿀됑(21)·꿀됑 움짤(14, 움직이는 webp)·우리(16, 둘이 같이 나옴)·포차코 우댕(4)·포차코 꼼이(6)·사랑 빠샤(9). 그런데 고르는 창은 아직 **예전 초록·회색 모양**(아래 「지금 고르는 창」 설명)이라 새로 만들어야 한다.
2. **사인**: 편지에 붙은 큰 이모티콘마다 **보낸 사람 이름을 영어 흘림체 사인으로** 얹는다. 꼼이가 보내면 `Kkomi`, 우댕이 보내면 `Kkuldang`(철자 그대로). 꼼톡(채팅)엔 없고 **편지에서만** 보이는 특별함 — 「이 사람이 직접 붙여 보낸 스티커」 느낌. 진짜 사인처럼 그림 **오른쪽 아래**에 살짝 걸치고, 약간 기울게(-6~-8도), 진한 코랄 잉크, 그림 위에서도 읽히게 얇은 흰 테두리 그림자. 그림 위쪽엔 글씨 배지(「사랑해」 같은 한글)가 있으니 위는 피하고 아래 오른쪽.
   - 글씨체는 내가 정해서 상수로 준다(아래 `SIGN_FONT`). 너는 그 값을 그대로 써(글씨체 이름을 코드에 직접 쓰지 마).
3. **움직이는 포차코**(mp4 영상 2개, 편지에 1개만) 고르는 창도 예전 보라·회색 모양이라 같은 결로 새로.

### 내가 주는 값
```ts
// import { SIGN_FONT } from '@/lib/letterSign';
export const SIGN_FONT = { family: "'Great Vibes', cursive", weight: 400, scale: 1 };
// fontSize = 그림 한 변(px) × 0.22 × SIGN_FONT.scale  을 기준으로 해(작은 그림에서도 14px 밑으로는 내리지 마).
```

## 만들 파일 (5개)

### ① `src/components/letter/SignedSticker.tsx` (새로)
큰 이모티콘 한 장 + 사인. 편지 읽기·쓰기·미리보기에서 같이 쓴다.
```ts
export interface SignedStickerProps {
  src: string;        // 그림(움짤 webp 면 <img> 가 알아서 움직인다)
  alt: string;
  sign?: string;      // 'Kkomi' | 'Kkuldang' | '' — 비면 사인 없이 그림만
  size: number;       // 그림 한 변 px
  tilt?: number;      // 사인 기울기(도), 기본 -7
}
```
- 그림은 `object-contain`, 둘레 여백 없이 투명 그대로(카드·테두리 씌우지 마 — 스티커는 투명 배경 그림이다). 사인이 그림 밖으로 조금 삐져나가도 잘리지 않게.

### ② `src/components/letter/LetterEmoticonSheet.tsx` (새로) — 큰 이모티콘 고르는 창
```ts
export interface LetterEmoticonSheetItem { id: string; label: string; thumbUrl: string }
export interface LetterEmoticonSheetSet { id: string; title: string; thumbUrl: string; animated?: boolean; items: LetterEmoticonSheetItem[] }
export interface LetterEmoticonSheetProps {
  open: boolean;
  sets: LetterEmoticonSheetSet[];        // 탭 순서 그대로(내 캐릭터 팩이 이미 앞에 와 있다)
  activeSetId: string;
  onSetChange: (id: string) => void;
  selected: LetterEmoticonSheetItem[];   // 담은 것(순서대로, 같은 것 두 번도 가능)
  max: number;                           // 3
  onAdd: (id: string) => void;           // 꽉 찼을 때 막기·안내는 내가 한다(그래도 꽉 찬 모양은 네가 보여 줘)
  onRemove: (index: number) => void;
  onClose: () => void;
  sign: string;                          // 내 사인(Kkomi/Kkuldang) — 「이렇게 붙어요」 작은 미리보기에 쓰고 싶으면
}
```
- 아래에서 올라오는 시트(지난번 `MiniEmoticonSheet` 와 같은 결 — 아래 첨부). 높이는 화면의 60% 안팎, 안쪽만 스크롤. 뒤 어둡게 깔고 누르면 닫힘.
- 위: 제목 + 닫기. 그 아래 **담은 줄**(n / 3, 담은 것 작은 그림, 누르면 빠짐). 비었으면 「누르면 여기 담겨요」.
- **팩 탭**: 8개라 가로로 넘기는 줄(대표 그림 + 이름). 지금 탭이 또렷하게.
- **그림 판**: 한 줄 4개 정도, 그림이 크게 보이게(썸네일은 정지 그림이다). 담은 개수 작은 동그라미. 꽉 차면 판을 흐리게 + 「3개 다 담았어요. 빼면 더 담을 수 있어요」.
- 그림 아래 이름(label)은 안 써도 된다 — 그림 안에 글씨가 이미 있는 게 많다. 대신 `aria-label`.
- 예전 초록(`emerald`)·`slate` 회색·보라 쓰지 말고 위 디자인 변수로.

### ③ `src/components/letter/LetterAnimSheet.tsx` (새로) — 움직이는 포차코 고르는 창
```ts
export interface LetterAnimSheetProps {
  open: boolean;
  items: { id: string; label: string; posterUrl: string; videoUrl: string }[];   // 지금 2개
  selectedId: string | null;
  onPick: (id: string | null) => void;   // 고른 걸 또 누르면 null(빼기). 고르면 내가 창을 닫는다.
  onClose: () => void;
}
```
- ②와 같은 결의 시트. 영상은 `<video autoPlay loop muted playsInline poster>`, 둥근 카드 2칸. 고른 것 표시. 아래 짧은 안내 「편지에 붙으면 상대 화면에서 움직여요」.

### ④ `src/components/letter/LetterEnclosures.tsx` (고치기 — 지금 코드 아래 첨부)
- props 에 `sign?: string` 추가(보낸 사람 사인). 나머지 props 는 그대로.
- 큰 이모티콘을 **크게 + 사인**(①). 지금은 64px 라 너무 작다. 1개면 가운데 크게(160px 안팎), 2개·3개면 편지지 폭(안쪽 약 300px) 안에서 나란히 — 줄이 넘치지 않게. 이름 글자(label)는 빼도 된다(그림 안에 글씨가 있다).
- 움직이는 포차코·음성·손글씨 자리는 지금처럼(손대지 않아도 됨).

### ⑤ `src/components/letter/LetterStickerPanel.tsx` (고치기 — 지금 코드 아래 첨부)
- props 에 `sign?: string` 추가(내 사인). 담은 큰 이모티콘을 ①로 보여 줘서 「이렇게 사인돼서 붙어요」가 보이게(크기는 칸에 맞게 작게, 빼기 X 단추는 그대로).
- 제목 줄 「큰 스티커 · 편지 아래에 붙어요」는 「큰 이모티콘 · 사인해서 붙여요」 정도로.

## 지금 고르는 창(바꿀 것, 참고만)
초록 「Emoticon Letter」 작은 글씨 + 「마음 하나 톡 붙이기」 제목, 초록 칸에 담은 것, 회색 알약 탭(팩 1개뿐이었음), 흰 칸 3열 판. 움직이는 포차코 창은 보라 「Moving Pochacco」 + 2칸.
