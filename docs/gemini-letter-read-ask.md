## 이번에 만들 것 — 편지 **읽기** 묶음 (파일 2개, 폴더 `src/components/letter/`)

### 1) `LetterPaper.tsx` — 편지지 한 장(읽기 화면 본문 + 쓰기 화면 미리보기에 같이 쓴다)
```ts
import type { MiniPart } from '@/lib/miniEmoticons';
export interface LetterPaperProps {
  toName: string;                  // '꼼이'
  fromName: string;                // '우댕'
  dateText: string;                // '2026. 11. 6'  (날짜 도장)
  parts: MiniPart[];               // 본문 조각 — 글자 + 미니 그림
  preview?: boolean;               // 쓰는 중 미리보기 — 여백·도장 조금 작게, 그림자 약하게
  emptyText?: string;              // 본문이 비었을 때(미리보기) 「아직 쓴 말이 없어요」
  editing?: boolean;               // 보낸 사람이 본문을 고치는 중 → 본문 자리에 editorSlot
  editorSlot?: React.ReactNode;    // 고치기용 입력칸(내가 <LetterEditor/> 를 넣는다)
  headerAction?: React.ReactNode;  // 편지지 오른쪽 위 작은 단추 자리(「수정」 등 — 내가 넣는다)
  enclosures?: React.ReactNode;    // 「동봉한 것」 — 큰 이모티콘·보이스·손글씨·움직이는 포차코(내가 기존 것을 넣는다). 없으면 그 구역 안 보이게
}
```
- 위→아래: `To. 꼼이`(Dongle) → 본문(IBM Plex Sans KR 16~17px, 줄간격 1.8 전후, 좌우 24px 이상, `whitespace-pre-wrap`, 미니 그림은 글줄에 섞여 28~32px) → 오른쪽 아래 `From. 우댕` + 날짜 도장(동그랗거나 네모난 은은한 코랄 도장 느낌, Dongle) → `enclosures` 가 있으면 편지지 아래쪽에 얇은 구분선과 「동봉한 것」 작은 이름표 아래로.
- 편지지 = 따뜻한 아주 옅은 아이보리, 모서리 둥글게, 아주 은은한 종이 결(선택), 그림자 부드럽게. 글이 주인공.

### 2) `LetterReadSheet.tsx` — 편지 읽기 화면(편지함에서 편지를 누르면 뜨는 것)
```ts
export interface LetterCommentView { id: string; by: string; text: string; timeText: string; mine: boolean }
export interface LetterReadSheetProps {
  fromName: string;                 // 위 작은 제목용(「우댕이 보낸 편지」 등)
  fullDateText: string;             // '2026년 11월 6일 오후 9:12'
  paper: React.ReactNode;           // <LetterPaper/> — 가운데 주인공
  hearts: number;
  onHeart: () => void;              // 하트(여러 번 눌러도 됨 — 누를 때마다 톡 튀게)
  comments: LetterCommentView[];
  onDeleteComment: (id: string) => void;   // 내 댓글만(길게 누르거나 작은 휴지통 — 실수로 안 지워지게 한 번 묻는 건 내가 한다)
  commentText: string;
  onCommentTextChange: (v: string) => void;
  onSubmitComment: () => void;
  commentSending: boolean;
  onClose: () => void;
}
```
- **거의 화면 전체를 덮는** 판(아래에서 올라오는 시트 또는 전체 화면). 맨 위: 닫기(X) + 작은 제목·날짜. 가운데 `paper`(스크롤). **하트와 댓글은 편지지 바깥** 아래쪽에(편지와 대화가 섞이지 않게): 하트 단추 + 개수, 댓글 목록(작은 말풍선, 보낸 사람 이름·시간), 맨 아래 **고정** 댓글 입력칸(16px 이상, 보내기 단추는 코랄).
- 열릴 때 가벼운 펼침·페이드 0.25초 안팎(동작 줄이기면 바로).
- 바깥(덮개) 누르면 닫힘. 덮개는 어둡지 않게 은은하게.
