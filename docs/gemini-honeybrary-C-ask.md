
## 이번 일 — 허니브러리 3/3: 감상(리뷰) 쓰기 · 감상 카드 · 상대의 한마디

이번이 우댕이 제일 기대하는 부분이다: **「리뷰를 좀 더 정교하게 — 네이버·배민 리뷰 참고, 별점도 줄 수 있도록 사진도 올리고, 편지기능 만든 거 참고해서 예쁘게.」**
1/3 에서 네가 만든 **토큰·부품을 그대로 import**(아래 「1/3 결과」에 코드 전문). 새 색 말고 `HONEY`. 시트는 `HoneySheet`(쓰기 창은 `tall`).

### 네이버·배민에서 가져오는 것 / 바꾸는 것
- 가져옴: 별점 한 줄(누르면 크게 반응) · 「이런 점이 좋았어요」 키워드 칩 고르기 · 사진 여러 장 가로 칸 · 한 줄 요약 · 본문(글자 수 표시) · 사장님 댓글 자리 → **상대의 한마디**(생각풍선).
- 바꿈: 「도움돼요」·좋아요·리뷰 수·평균 별점·별점순 **없음**. 메뉴별(맛·양) 점수 같은 여러 축 **없음** — 별 하나 + 키워드면 충분. 별은 「이 책 점수」가 아니라 **「이번 독서 경험」**.
- 감상 카드는 **꿀빛 종이 위의 짧은 편지**처럼: `HONEY.paperStyle` 바탕 · 끝에 작성자 영어 사인(`signFor(by)`, Alex Brush, 살짝 기울임) · 귀퉁이에 작은 밀랍 도장(CSS 도형, 벌집 육각 하나 압인). 벌집 반복 무늬 금지.

### 만들 파일 6개

#### ① `src/components/honeybrary/HoneyRating.tsx` — 별 다섯
```ts
export interface HoneyRatingProps { value?: Rating; onChange?: (v?: Rating) => void /*없으면 보기 전용*/; size?: number /*별 한 개 px, 기본 32*/ }
```
- 쓰기: 별 5개(각 44px 이상 누름 영역), 누른 별까지 채움, **같은 별을 다시 누르면 비움**(별은 선택이다). 고르면 그 별만 한 번 톡 커졌다 돌아옴(scale). 아래 작은 말 — 별마다 경험을 말하는 한 마디(예: 1 「조금 아쉬웠어요」 … 5 「오래 남을 것 같아요」 — 책·독서 경험에 맞는 다정한 말로 네가 다듬어), 안 골랐으면 「별은 안 줘도 괜찮아요」.
- 보기 전용: 작게, 채운 별만 진하게(`HONEY.star`), 빈 별은 `HONEY.starEmpty`. 숫자(4.0)·「/5」 쓰지 마. lucide `Star`(fill).

#### ② `src/components/honeybrary/ReviewKeywordPicker.tsx`
```ts
export interface ReviewKeywordPickerProps { items: string[]; selected: string[]; max: number; onChange: (selected: string[]) => void }
```
- 칩 여러 줄로 흐르게(가로 스크롤 아님). 고른 칩은 `accentSoft`. 다 고르면(3개) 나머지는 흐리게 + 「3개까지 고를 수 있어요」. 칩 높이 40 이상.

#### ③ `src/components/honeybrary/ReviewPhotoPicker.tsx`
```ts
export interface ReviewPhotoPickerProps { photos: PhotoVM[]; max: number; onAdd: (files: File[]) => void; onRemove: (photoId: string) => void; disabled?: boolean }
```
- 가로 한 줄: 맨 앞 「+ 사진」 칸(「2/5」 처럼 지금 장수/최대 — 이건 장부가 아니라 남은 칸 안내라 괜찮다) → 고른 사진 작은 판(72~80px 정사각, 모서리 둥글게, 오른쪽 위 ✕). `pending` 이면 사진 위에 옅은 덮개 + 작은 돌아가는 표시(정지 아이콘이어도 됨 — 무한 회전은 이 칸 안 작은 것 하나만 허용).
- `<input type="file" accept="image/*" multiple>` — 남은 칸보다 많이 고르면 앞에서부터 남은 칸만큼만 `onAdd`.
- 칸 아래 안내: 「표지 · 오래 남은 문장 · 함께 읽은 자리」.

#### ④ `src/components/honeybrary/HoneyReviewComposer.tsx` — 감상 쓰기 창(`HoneySheet tall` 안)
```ts
export interface HoneyReviewComposerProps {
  open: boolean;
  mode: 'create' | 'edit';
  bookTitle: string;
  initial?: ReviewDraft;            // 열 때마다 이 값으로 채운다(없으면 빈 칸)
  keywordOptions: string[];         // REVIEW_KEYWORDS
  photos: PhotoVM[];                // 사진은 내가 들고 있다(새로 고른 건 미리보기 url, 저장된 건 thumbUrl)
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (photoId: string) => void;
  busy: boolean;                    // 저장 중 — 입력 잠금 + 주 버튼 「남기는 중…」
  progressText?: string | null;     // 예: 「사진 올리는 중 2/3」
  error?: string | null;
  onSubmit: (d: ReviewDraft) => void;
  onDelete?: () => void;            // edit 일 때만 — 맨 아래 작은 「감상 지우기」 → 확인 한 번(시트 안에서)
  onClose: () => void;              // 쓰던 게 있으면 「쓰던 감상을 닫을까요?」 확인 한 번
}
```
- 배민처럼 여러 단계로 넘기지 말고 **한 화면 세 구획**(꿀빛 종이 결의 칸들):
  1. 「이번 독서 경험은 어땠어요?」 — `HoneyRating` + 「이런 점이 좋았어요 (3개까지)」 `ReviewKeywordPicker`
  2. 「남긴 장면」 — `ReviewPhotoPicker`(max `LIMITS.photos`)
  3. 「한 줄과 감상」 — 한 줄(40자, 「이 책을 한 줄로 말하면」) · 본문(600자, 여러 줄, 자라는 높이, 「기억에 남는 장면, 읽고 달라진 생각…」, 오른쪽 아래 `123/600` 작게) · 스포일러 토글(「줄거리·결말이 들어 있어요」 — 켜면 상대에겐 가려져 보여요).
- 별·키워드·한 줄·본문·사진 중 **하나라도** 있으면 주 버튼 「감상 남기기」(고칠 땐 「고친 감상 남기기」) 켜짐. 아래 고정(안전영역 위), 키보드가 올라와도 입력칸이 가리지 않게 시트 안 스크롤.
- 머리 제목 옆에 책 제목 작게.

#### ⑤ `src/components/honeybrary/HoneyReviewCard.tsx` — 감상 한 장(「둘의 감상」 칸에 세로로 쌓임)
```ts
export interface HoneyReviewCardProps {
  review: ReviewVM;
  me: Person;
  charSrc: Record<Person, string>;  // 생각풍선 캐릭터 그림(우댕=꿀됑, 꼼이=꼼이)
  onEdit?: () => void;              // 내 감상일 때만 — 오른쪽 위 작은 「고치기」
  onOpenPhoto: (index: number) => void;
  onSaveReply?: (text: string) => Promise<void>;   // 상대 감상일 때만(내가 한마디 쓰기·고치기·비우면 지우기)
}
```
- 머리: 「우댕의 감상」/「꼼이의 감상」(Dongle 짧게) · 별(보기 전용, 있을 때만) · 고른 키워드 칩(작게).
- 몸: 한 줄(굵게) · 본문(16px, 줄간격 1.8, 길면 6줄에서 「더 보기」로 펼침) · 사진 작은 판 가로 줄(누르면 `onOpenPhoto(i)`, 비율 상자).
- 끝: 오른쪽 아래 영어 사인 + 귀퉁이 밀랍 도장.
- **스포일러**: `review.hasSpoiler` 이고 **상대 감상**이면 머리(이름·별·키워드)만 보이고 한 줄·본문·사진은 꿀빛 덮개로 가림 — 「스포일러가 있어요 · 눌러서 보기」, 누르면 펼침(화면 상태만). 내 감상은 가리지 않고 작은 「스포일러 있음」 표시만.
- 아래 상대의 한마디 = `PartnerReplyBubble`.
- 비어 있는 칸(별 없음·키워드 없음·본문 없음)은 **그리지 마** — 빈 별·「아직 없음」 금지.

#### ⑥ `src/components/honeybrary/PartnerReplyBubble.tsx` — 배민 「사장님 댓글」 자리를 생각풍선으로
```ts
export interface PartnerReplyBubbleProps {
  reply?: { by: Person; text: string };
  replier: Person;                  // 한마디를 다는 사람(= 감상 쓴 사람의 상대)
  charSrc: string;                  // replier 의 캐릭터 그림
  canWrite: boolean;                // 내가 replier 일 때만 true
  onSave?: (text: string) => Promise<void>;
}
```
- 한마디가 있으면: 카드 아래 들여서 `ThoughtBubble`(size 56, 캐릭터) + 그 옆 둥근 흰 말칸(92%)에 글, 위에 작게 「꼼이의 한마디」. `canWrite` 면 눌러서 고치기.
- 없고 `canWrite` 면: 조용한 글자 단추 하나 「한마디 남기기」(재촉·빈 풍선 금지) → 그 자리에서 한 줄 입력(200자, 16px) + 「남기기」/「그만두기」. 없고 `canWrite` 가 아니면 **아무것도 안 그린다**.

### 답 형식
파일 6개 완성 코드(각각 맨 위 파일 이름 주석). 설명은 맨 끝 3줄 이내.
