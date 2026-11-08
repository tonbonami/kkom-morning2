
## 이번 일 — 허니브러리 2/3: 책 한 권 화면 + 진행 + 읽는 중 기록(한 줄 잇기) + 사진 크게 보기

1/3 에서 네가 만든 **토큰·부품을 그대로 import 해서** 같은 결로 이어 줘(아래 「1/3 결과」에 코드 전문). 새 색을 만들지 말고 `HONEY` 값을 써. 시트는 `HoneySheet`, 표지는 `HoneyBookCover`, 진행 줄은 `ReaderProgressLine`.

맨 아래에 사이담 사이브러리 **책 화면 실제 코드**를 붙인다. **짜임·문구·⚠️ 주의는 그대로**, 사이담 전용(uid·방·`useSpaceState`·`useEscClose`·`haptic`·`withSubjectParticle`·`var(--sd-star)` 등)은 빼고 꿀빛 결로. 사이담과 **바뀌는 점** 셋:
1. 아래에 늘 붙어 있던 기록 입력줄 → **아래 고정 단추 둘**: 「기록 남기기」(→ `NoteComposerSheet`) · 「감상 쓰기」(이미 썼으면 「내 감상 고치기」). 감상이 생겨 화면이 복잡해지지 않게.
2. 내 진행 줄이 없으면(상대만 읽는 책) 진행 칸에 **「나도 읽기」** 단추.
3. 원 기록을 지우면 이어진 한 줄도 같이 지워진다 → 확인 문구 「이어진 말도 같이 지워져요. 지울까요?」.

### 만들 파일 6개

#### ① `src/components/honeybrary/HoneyBookScreen.tsx` — 책 한 권 화면 전체
```ts
export interface HoneyBookScreenProps {
  book: BookVM;
  me: Person;
  notes: NoteVM[];                 // 오래된 순(위에서 아래로). parentNoteId 가 있는 건 그 기록 아래 「한 줄 잇기」.
  hasOlderNotes: boolean; loadingOlderNotes?: boolean; onLoadOlderNotes: () => void;  // 맨 위 「이전 기록 보기」
  reviewsSlot: React.ReactNode;    // 「둘의 감상」 칸 안 — 3/3 감상 카드들을 내가 꽂는다(그 안은 그리지 마)
  hasMyReview: boolean;
  toast?: string | null;           // 짧은 알림(「표지를 바꿨어요」 등) — 아래 단추 위에 잠깐
  onBack: () => void;
  onSaveMyReading: (r: ReadingVM) => void;
  onJoinReading: () => void;
  onAddNote: () => void;
  onWriteReview: () => void;
  onReplyNote: (noteId: string, text: string) => Promise<void>;
  onDeleteNote: (noteId: string) => void;          // 확인은 네가 화면 안에서 받고, 확정되면 부른다
  onOpenPhoto: (photos: PhotoVM[], index: number) => void;
  onRename: (title: string) => void;
  onChangeCover: (file: File) => void;
  onDeleteBook: () => void;                        // 확인 시트 통과 뒤
}
```
- 머리(위에 붙음, 불투명): ← 책장 · 가운데 작게 「허니브러리」 · ⋯ 메뉴(「제목 고치기」 / 「표지 사진 바꾸기」 / 「책 지우기」 빨강). 제목 고치기는 제목 자리에서 바로 입력(16px 이상).
- 표지(폭 132, `coverUrl` — 크게 보이는 한 장이라 원본) + 제목. 그 아래 「{놓은 사람}이 놓은 책」 같은 작은 줄은 넣어도 좋다(우댕**이**·꼼이**가** — 받침 주의).
- 진행 칸 = `ReadingProgressPanel`.
- 「읽으며 남긴 기록」 = `ReadingTimeline`. 비면 「마음에 남은 문장이나 밑줄 친 쪽을 남겨 보세요.」
- 「둘의 감상」 = `reviewsSlot`. 내 감상이 없고 **내 진행이 「다 읽음」**이면 그 칸 위에 조용한 한 줄 「다 읽었다면, 이번 독서 경험을 남겨 봐요」(상대에 대한 말·재촉 금지).
- 아래 고정 단추 둘(안전영역 위): 「기록 남기기」(보조) · 「감상 쓰기」/「내 감상 고치기」(주). 본문이 단추에 가리지 않게 아래 여백.
- 책 지우기 확인 = `HoneyConfirmSheet`: 「이 책을 지울까요?」 / 「둘이 남긴 기록·감상·사진도 같이 사라져요. 되돌릴 수 없어요.」 / 「지우기」 · 「그만두기」.

#### ② `src/components/honeybrary/ReadingProgressPanel.tsx`
```ts
export interface ReadingProgressPanelProps {
  readers: Partial<Record<Person, ReadingVM>>; me: Person;
  onSave: (r: ReadingVM) => void; onJoin: () => void;
}
```
- 나 먼저, 위아래 한 줄씩 `ReaderProgressLine`. 내 줄 옆에만 「고치기」 → 그 자리에서 펼치는 편집(사이담 ProgressEditor 그대로: 읽는 중/다 읽음/책장에 두기 세 칸 + 읽는 중일 때만 지금 쪽/전체 쪽 + 「그만두기」·「저장」 + 「쪽수는 비워 둬도 돼요. 바꿔도 상대에게 알림은 안 가요.」). ⚠️ 상대 줄엔 고치기 없음. 내 줄이 없으면 「나도 읽기」.

#### ③ `src/components/honeybrary/ReadingTimeline.tsx`
```ts
export interface ReadingTimelineProps {
  notes: NoteVM[]; me: Person;
  onReply: (noteId: string, text: string) => Promise<void>;
  onDelete: (noteId: string) => void;
  onOpenPhoto: (photos: PhotoVM[], index: number) => void;
}
```
- 사이담 NoteCard 그대로: 기록 카드(이름 · N쪽 / 글 / 사진 작은 판 — 누르면 크게) → 이어진 한 줄들은 들여서 아래에. **기록을 눌렀을 때만** 이어 남기기 입력(「여기에 한 줄 이어 남기기」, 내 기록이면 「이어서 한 줄 더」, 500자) + 내 것엔 「지우기」. ⚠️ 이어진 말이 없는 기록엔 아무것도 그리지 마.
- 이어진 한 줄은 **생각풍선 결**로(편지 귀퉁이 풍선처럼 둥글고 흰 92% + 작은 꼬리 동그라미 — 캐릭터 그림은 여기선 빼고 글만). 「꼼이가 이어 남김」처럼 받침 맞춰.
- 사진 자리는 `photo.width/height` 로 비율 상자를 미리 잡아(없으면 4:3), 작은 판 `thumbUrl` 만.

#### ④ `src/components/honeybrary/NoteComposerSheet.tsx` (`HoneySheet` 안)
```ts
export interface NoteComposerSheetProps {
  open: boolean; busy: boolean; error?: string | null;
  onSubmit: (v: { text: string; page?: number; photo: File | null }) => void;
  onClose: () => void;
}
```
- 글(여러 줄, 2000자, 「마음에 남은 문장, 밑줄 친 곳, 떠오른 생각」) · 「몇 쪽?」(숫자만, 안 적어도 돼요) · 사진 한 장(표지·밑줄·읽은 자리 — 미리보기와 빼기). 글이나 사진 하나만 있어도 「남기기」. 열릴 때마다 비운다.

#### ⑤ `src/components/honeybrary/HoneyPhotoViewer.tsx` — 사진 크게 보기(기록·감상 같이 씀)
```ts
export interface HoneyPhotoViewerProps { open: boolean; photos: PhotoVM[]; initialIndex: number; onClose: () => void }
```
- 검은 바탕 전체 화면, 여기서만 원본 `url`. 여러 장이면 좌우로 넘기기(framer-motion `drag="x"` — transform 만) + 아래 작은 점. ✕ 는 안전영역 아래. 바탕 누르면 닫힘, Esc 닫힘. 지금 장 양옆 한 장씩만 미리 그린다.

#### ⑥ `src/components/honeybrary/HoneyConfirmSheet.tsx`
```ts
export interface HoneyConfirmSheetProps { open: boolean; title: string; body?: string; confirmText: string; danger?: boolean; onConfirm: () => void; onClose: () => void }
```

### 답 형식
파일 6개 완성 코드(각각 맨 위 파일 이름 주석). 설명은 맨 끝 3줄 이내.
