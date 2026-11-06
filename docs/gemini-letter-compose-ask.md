## 이번에 만들 것 — 편지 **쓰기** 묶음 (파일 6개, 폴더 `src/components/letter/`)

### 1) `LetterEditor.tsx` — 편지 본문 입력칸 (미니 낱말을 알약처럼 칠해 보이게)
```ts
import type { MiniPart } from '@/lib/miniEmoticons';
export interface LetterEditorProps {
  value: string;
  onChange: (v: string) => void;
  parts: MiniPart[];                 // value 를 미리 쪼갠 것 — 미니 조각 자리만 칠하는 데 쓴다
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;   // 커서 자리에 미니를 넣으려고 내가 쓴다
  placeholder: string;
  minRows?: number;                  // 기본 7
  autoFocus?: boolean;
  onFocus?: () => void;
}
```
- **textarea 는 그대로 글자칸**(contenteditable 금지 — 아이폰 한글 조합이 깨진다). 대신 textarea **뒤에** 같은 글을 똑같은 글꼴·크기·줄간격·여백·줄바꿈 규칙으로 깔고, `mini` 조각 자리(`(사랑해)` 글자 폭 그대로)만 연한 코랄 알약 배경(`--sd-rel-soft`, 둥근 모서리)으로 칠해. 깐 글자는 투명, textarea 는 배경 투명·글자는 보이게 — 그러면 커서는 그대로고 `(사랑해)` 만 「그림이 될 자리」로 보인다.
  - 높이는 **JS로 재지 말고** 두 겹을 같은 grid 칸에 겹쳐(`grid` + 둘 다 `[grid-area:1/1]`) 뒤에 깐 글이 높이를 정하게(맨 끝에 빈 줄 하나 더). textarea 는 `resize-none overflow-hidden`. 아이폰에서 JS로 높이를 바꾸면 커서가 튄다.
  - 두 겹의 글꼴·크기(16~17px)·줄간격·좌우 여백·`whitespace-pre-wrap`·`break-words` 가 **한 픽셀도 다르면 안 된다**(칠한 자리가 어긋난다).
- 편지지 위에 놓이므로 입력칸 자체에 테두리·배경 없이.

### 2) `MiniEmoticonSheet.tsx` — 미니 이모티콘 서랍(키보드 자리를 차지하는 아래 판)
```ts
export interface MiniEmoticonSheetProps {
  open: boolean;
  items: { word: string; src: string }[];   // 22~24개(말티푸 표정 + 보낸 사람 전용 2개). 그림은 정사각 투명 webp
  onPick: (word: string) => void;            // 커서 자리에 넣는 건 내가 한다. 서랍은 열린 채로(여러 개 연달아 넣기)
  onClose: () => void;                       // 「키보드로」 단추·바깥 누름
}
```
- 화면 아래에 붙는 판(높이 화면의 40% 안팎), 위쪽은 편지 글이 보이게 가리지 말 것(어두운 덮개 없이, 판만). 맨 위 줄: 「미니 이모티콘 · 글 속에 쏙」 같은 이름 + 오른쪽 「키보드로」(lucide `Keyboard`).
- 5칸 격자, 칸마다 그림(크게) + 아래 작은 낱말. 누르면 살짝 톡 튀는 반응.
- 열고 닫을 때 아래에서 올라오고 내려가게(AnimatePresence). 안전영역 아래 여백.

### 3) `LetterComposeScreen.tsx` — 편지 쓰기 화면 전체(`/letter/new`)
```ts
export type LetterTool = 'voice' | 'doodle' | 'sticker' | 'schedule';
export interface LetterComposeScreenProps {
  toName: string;                       // '꼼이'
  fromName: string;                     // '우댕'
  dateText: string;                     // '2026년 11월 6일 목요일'
  editor: React.ReactNode;              // <LetterEditor/> — 편지지 안 본문 자리에 그대로
  miniOpen: boolean;                    // 미니 서랍이 열려 있나(단추 모양이 바뀜)
  onToggleMini: () => void;             // 편지지 아래(또는 위) 미니 이모티콘 단추 — 미니 서랍 열기/키보드로
  previewOpen: boolean;
  onTogglePreview: () => void;          // 「편지로 보기」 — 글 속 미니가 그림으로 보이는 미리보기 여닫기
  preview: React.ReactNode;             // 미리보기 내용(내가 <LetterPaper preview/> 를 넣는다)
  activeTool: LetterTool | null;        // 아래 도구 줄에서 펼친 것
  onToolChange: (t: LetterTool | null) => void;
  toolBadges: Partial<Record<LetterTool, string>>;  // 붙인 것 표시. 예 { voice: '12초', doodle: '그림 있음', sticker: '2개', schedule: '11월 9일 오전 9:00' }
  toolPanel: React.ReactNode;           // 펼친 도구 내용(아래 4·5·6 컴포넌트나 손글씨 판) — 내가 넣는다
  miniSheet: React.ReactNode;           // <MiniEmoticonSheet/> — 화면 맨 아래에 그대로 둔다
  error?: string;
  canSend: boolean;
  sending: boolean;
  scheduled: boolean;                   // 보내기 단추 글자 「예약 편지 보내기」
  onSend: () => void;
  onBack: () => void;
}
```
- 「긴 설정 양식」이 아니라 「편지 한 장을 쓰는 화면」. 위→아래: 뒤로 + 작은 제목 → **편지지**(위에 `To. 꼼이` 와 날짜, 가운데 본문 `editor`, 아래 오른쪽 `From. 우댕`) → 편지지 바로 아래 한 줄: 미니 이모티콘 단추(글자 「미니」 + lucide `Smile`, 열려 있으면 `Keyboard` + 「키보드로」) · 「편지로 보기」 단추(`Eye`/`EyeOff`) → 미리보기가 열리면 그 자리에 `preview` → 도구 줄(아이콘 + 짧은 이름: 음성 `Mic`·손글씨 `PenLine`·큰 스티커 `Sticker`·예약 `Clock`, 붙인 게 있으면 `toolBadges` 를 작은 알약으로) → 펼친 도구의 `toolPanel` → 화면 아래 **고정** 보내기 단추(코랄, 안전영역 위, `canSend` 아니면 흐리게, `sending` 이면 「보내는 중…」).
- 도구 줄은 한 번에 하나만 펼친다(같은 걸 다시 누르면 접힘). 도구 4개가 본문만큼 크게 보이면 안 된다 — 작고 조용하게.
- 미니 서랍이 열리면 보내기 단추가 서랍 뒤로 숨지 않게(서랍이 열려 있을 땐 보내기 단추를 서랍 위로 올리거나 잠깐 숨겨도 됨 — 네가 판단).
- 빈 본문일 때 편지지 안 안내는 짧게(`placeholder` 는 내가 준다).

### 4) `LetterVoicePanel.tsx` — 30초 음성 편지 칸
```ts
export interface LetterVoicePanelProps {
  state: 'idle' | 'recording' | 'recorded';
  secLeft: number;          // 녹음 중 남은 초
  duration: number;         // 녹음된 길이(초)
  playing: boolean;         // 들어보기 재생 중
  onStart: () => void;
  onStop: () => void;
  onTogglePlay: () => void;
  onDelete: () => void;     // 지우고 다시
}
```
- idle: 「녹음 시작 · 30초까지」. recording: 눈에 띄는 녹음 중 표시 + 남은 초 + 멈춤. recorded: 들어보기/멈춤 + 길이 + 지우기.

### 5) `LetterSchedulePanel.tsx` — 예약 편지 칸
```ts
export interface LetterSchedulePanelProps {
  enabled: boolean;                       // 예약으로 보낼지
  onEnabledChange: (v: boolean) => void;
  value: string;                          // <input type="datetime-local"> 값 'YYYY-MM-DDTHH:MM'
  onChange: (v: string) => void;
  toName: string;                         // 안내 문구용
}
```
- 켜면 날짜·시각 고르기(`datetime-local` 을 예쁘게 감싸기, 아이폰에서 잘 되게) + 「이 시각에 꼼이에게 도착해요. 그 전엔 잠겨 있어요」 같은 한 줄(아이콘 `Lock`).

### 6) `LetterStickerPanel.tsx` — 편지 아래 붙는 **큰 스티커**(글 속 미니와 다른 것)
```ts
export interface LetterStickerPanelProps {
  emoticons: { id: string; label: string; imageUrl: string }[];   // 붙인 큰 이모티콘(최대 max개)
  max: number;                                                   // 3
  onAddEmoticon: () => void;          // 큰 이모티콘 고르는 판 열기(그 판은 내가 가진 걸 쓴다)
  onRemoveEmoticon: (index: number) => void;
  animated: { label: string; posterUrl: string; videoUrl: string } | null;   // 움직이는 포차코(하나)
  onPickAnimated: () => void;         // 움직이는 포차코 고르는 판 열기
  onRemoveAnimated: () => void;
}
```
- 이름은 「큰 스티커 · 편지 아래에 붙어요」처럼 글 속 미니와 헷갈리지 않게. 붙인 것은 작은 썸네일(탭하면 빼기 ×), 빈 자리는 「+ 이모티콘」, 포차코는 썸네일(영상은 `autoPlay muted loop playsInline`) 또는 「+ 움직이는 포차코」.
