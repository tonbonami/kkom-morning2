# 제미나이에게 — 칭찬 다이어리 개선 3가지 (Aside 검수 결과)

> 우댕: 아래 "보낼 글"을 제미나이에 붙여 넣고, Aside 스크린샷 3장을 같이 첨부해 주세요.
> `~/.aside/u/0/sessions/2026-10-16_yWNncH4VIHSpHRLN/artifacts/` 의 `02-mobile-praise-first.png`(첫 화면), `12-mobile-history-expanded.png`(옛 칭찬 펼친 긴 목록), `07-mobile-memo-mode.png`(메모 모드).
> 받아 온 코드는 꼼모닝 세션이 **값 하나 안 바꾸고** 넣고 데이터만 연결해요.

---

## 보낼 글

커플 앱(Next.js + React + Tailwind + framer-motion + lucide-react, 휴대폰 세로 375px)의 「칭찬 다이어리」 화면에 넣을 **작은 컴포넌트 3개**를 TSX로 만들어 줘. 지금 화면 분위기(첨부 스크린샷: 노트·마스킹 테이프·손글씨 Gaegu 본문, 크림 배경, 둘의 색 = 우댕 초록 계열·꼼이 분홍 계열)를 그대로 따라가야 해. 이모지보다는 lucide 아이콘, 글씨는 12px 이상.

### 1. `PraiseMeta` — 칭찬 한 줄 아래 정보줄
지금은 "10월 15일 · 꼼이가 보낸 칭찬"만 있고, **스티커가 몇 장인지** 숫자가 없어 그림을 세야 한다. 날짜·보낸 사람 글씨도 너무 연하다(slate-400).
```ts
export default function PraiseMeta(props: {
  dateText: string;        // "10월 15일"
  whoText: string;         // "꼼이가 보낸 칭찬" / "꼼이에게 보낸 칭찬"
  stickerCount: number;    // 1~20 — "스티커 5장"처럼 작은 칩으로
  tone: 'udaeng' | 'kkomi';// 보낸 사람 색 살짝
}): JSX.Element
```

### 2. `DiaryNav` — 긴 목록 길찾기
"옛 칭찬 펼치기"를 누르면 목록이 두 배 넘게 길어지고(세로 13,000px), 위로 돌아가거나 특정 달을 찾을 방법이 없다. 다시 접는 버튼도 없다.
```ts
export default function DiaryNav(props: {
  months: { key: string; label: string; count: number }[];  // 최신 달부터, 예: {key:'2026-10', label:'10월', count:42}
  activeKey: string | null;            // 지금 보고 있는 달
  onJump: (key: string) => void;       // 그 달 첫 칭찬으로 스크롤
  showBackToTop: boolean;              // 목록을 꽤 내려왔을 때만 true
  onBackToTop: () => void;
  expanded: boolean;                   // 옛 칭찬 펼친 상태
  onCollapse: () => void;              // "옛 칭찬 접기"
}): JSX.Element
```
- 달 이동은 화면 위쪽에 붙는(sticky) 가로 칩 줄이든, 오른쪽 아래 작은 버튼이든 더 예쁜 쪽으로. 맨 위로 버튼은 엄지가 닿는 오른쪽 아래.
- 옛 칭찬 접기는 펼친 목록 끝과, 길찾기 안 둘 다에서 누를 수 있게.

### 3. `ComposerHint` — 칭찬/조르기/메모 한 줄 안내
작성 칸 위 세 칸 토글(💝 칭찬 · 🥺 조르기 · 📝 메모) 바로 아래 한 줄. 특히 **메모가 둘이 같이 보는 건지** 처음 쓰는 사람이 모른다.
```ts
export default function ComposerHint(props: { kind: 'praise' | 'request' | 'memo'; partner: string }): JSX.Element
```
- 칭찬: "{partner}에게 스티커와 함께 칭찬이 가요"
- 조르기: "{partner}에게 '나 칭찬해 줘' 부탁이 가요"
- 메모: "둘 다 보는 다이어리에 포스트잇을 붙여요"
- 문구는 다듬어도 됨. 바뀔 때 살짝 페이드.

세 파일 각각 따로, 외부 라이브러리 추가 금지.
