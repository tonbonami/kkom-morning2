# 제미나이에게 — 피부 일지 사진 칸 (SkinPhotoStrip)

> 우댕: 아래 Run 명령으로 클립보드에 넣고 제미나이(새 대화도 됨)에 ⌘V.
> `awk '/^## 보낼 글/{f=1;next} f' docs/gemini-skin-photos.md | pbcopy`
> 받아 온 코드는 꼼모닝 세션이 값 하나 안 바꾸고 넣어요.

## 보낼 글

커플 앱(Next.js 15 + React + Tailwind + framer-motion + lucide-react, 휴대폰 세로 375~430px)의 「꼼이 피부 일지」 기록 화면에 들어갈 **사진 칸 컴포넌트 하나**를 TSX로 만들어 줘. 꼼이가 두드러기 올라온 곳을 매일 같은 구도로 찍어 두고 나중에 병원에서 보여 주려는 용도야.

### 지금 앱 분위기 (그대로 따라가기)
- 카드: `className="sd-card"` (반투명 흰 카드, 둥근 28px, 그림자 — CSS에 이미 있음)
- 색은 CSS 변수로만: 글자 `var(--sd-ink)` / 보조 `var(--sd-muted)` / 흐린 `var(--sd-faint)` / 구분선 `var(--sd-line)` / 옅은 면 `var(--sd-surface-2)` / 강조(코랄) `var(--sd-rel)` / 위험 `var(--sd-crit)`
- 같은 화면의 다른 카드는 제목 `text-lg font-bold`, 안쪽 여백 `p-5`, 칩·버튼은 `rounded-xl`, 아이콘은 lucide-react, 눌리는 건 `motion.button` + `whileTap={{ scale: 0.96 }}`. 글씨 14px 이상.

### 시그니처 (이름·인자 그대로)
```ts
export default function SkinPhotoStrip(props: {
  dateLabel: string;                                      // '10월 21일' — 카드 제목 옆 작게
  photos: { id: string; url: string; t: string | null }[]; // t = 찍어 올린 시각 ISO, 오래된 것 → 최근
  uploading: boolean;                                     // 올리는 중이면 맨 끝에 진행 칸
  onAdd: (files: FileList) => void;                       // 숨긴 <input type="file" accept="image/*" multiple> 로 받기(아이폰에선 카메라·앨범 선택이 뜸)
  onDelete: (id: string) => void;
}): JSX.Element
```

### 원하는 것
- 카드 제목 「사진」 + dateLabel. 오른쪽 위에 작은 「+ 추가」 버튼.
- 사진은 가로로 넘기는 정사각 썸네일(약 88px, 둥근 모서리), 맨 끝에 「+」 추가 칸(카메라 아이콘). 올리는 중이면 그 자리에 빙글 도는 표시.
- 사진이 없을 때: 「+」 칸 하나와 안내 한 줄 — 「같은 자리를 같은 구도로 찍어 두면 비교하기 좋아요」.
- 썸네일을 누르면 **전체 화면 보기**: 검은 바탕에 사진 꽉 차게(object-contain), 좌우로 넘기기, 위에 「n / 전체」와 찍은 시각(오후 9:12 식), 닫기 ✕, 아래에 「사진 지우기」(한 번 더 묻고 onDelete).
- 전체 화면은 `createPortal(…, document.body)`로 띄워 줘(앱 홈 구조상 안 그러면 다른 막대에 가려져).
- 이미지 태그는 `<img>`(next/image 말고). 사진 주소는 15분짜리라 캐시 신경 안 써도 돼.

파일 하나(`SkinPhotoStrip.tsx`), 외부 라이브러리 추가 금지, 모든 글자는 한국어.
