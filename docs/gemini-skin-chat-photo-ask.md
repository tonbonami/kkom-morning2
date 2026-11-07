너는 모바일 앱 UI 디자이너 겸 React 개발자야. 파일을 열거나 명령을 실행하지 말고, 고친 완성 코드를 답에 바로 써 줘.

## 앱
- 「꼼모닝」 안의 「꿀닥터」: 꼼이(여자친구)의 피부 가려움 일지 + Claude 상담 화면. 한국어, 아이폰 웹뷰, 라이트 전용.
- Next.js 15 · React 19 · TypeScript · Tailwind **3.4**(투명도 숫자는 5 단위만 — 그 밖은 `/[0.92]` 꼴, 변수로 조립한 클래스는 CSS가 안 생긴다) · framer-motion 11 · lucide-react 아이콘만.
- 색은 지금 코드처럼 `var(--sd-…)` 변수만(`--sd-ink` `--sd-muted` `--sd-faint` `--sd-line` `--sd-surface-2` `--sd-card-solid` `--sd-rel`(코랄) `--sd-rel-soft` `--sd-crit`). 이모지 대신 lucide.
- 성능: 움직임은 transform·opacity 만, 무한 반복 금지.

## 이번 일 — 상담에 사진 보내기
지금 상담 Claude 는 사진을 못 본다(글만 받는다). 우댕(남자친구, 앱 주인)이 「상담 화면에 사진 올리기 단추 — 꼼이가 『이거 봐 줘』 하며 그 자리에서 사진을 보내고, 보낸 사진만 상담사가 본다」로 정했다. 사진 고르기는 두 군데:
1. **일지에 이미 올린 최근 사진**(최근 7일, 아침·점심·저녁·밤 메모 칸마다 올린 것) 중에서 고르기 — 꼼이가 이미 매일 올리고 있어서 다시 올릴 필요 없게.
2. **새로 찍기·앨범에서** — `<input type="file" accept="image/*">` 하나(아이폰이 카메라/사진 보관함을 고르게 해 준다). 받은 파일은 내가 줄여서 올린다(이 사진은 오늘 일지에도 같이 남는다).
- 한 번에 최대 3장. 글 없이 사진만 보내도 된다.

`src/components/skin/SkinChat.tsx` **완성본 하나만** 다시 줘(아래 지금 코드에 덧붙이는 방식으로, 나머지 — 머리 줄·경고 띠·사용량 카드·추천 질문·상담 정리 알약 단추·흘려 받기 — 는 그대로).

### 바뀌는 props (이름·타입 정확히 이대로)
```ts
messages: { id: string; role: 'user' | 'assistant'; text: string; at: string; photos?: { url: string }[] }[];
onSend: (text: string) => void;   // 사진만 보낼 땐 text 가 '' 일 수 있다(보낼 사진은 attach.pending 에 있고 내가 같이 보낸다)
attach?: {
  pending: { key: string; url: string; uploading?: boolean }[];   // 보낼 사진(입력 막대 위에 작게). uploading 이면 올리는 중 표시
  max: number;                                                    // 3
  recent: { key: string; url: string; label: string }[];          // 일지에 올린 최근 사진, label 예: '오늘 아침' '어제 밤' '11/5 저녁'
  loadingRecent?: boolean;
  onOpen: () => void;                                             // 사진 칸을 열 때(내가 recent 를 불러온다)
  onAddNew: (file: File) => void;
  onPickRecent: (key: string) => void;                            // 고른 걸 또 누르면 빼기는 onRemove 로 — 이미 pending 에 있으면 표시만
  onRemove: (key: string) => void;
} | null;                                                         // 보기 전용(우댕 폰)이면 null — 사진 단추 안 보임
```

### 화면
- 입력 막대 왼쪽에 사진 단추(44px 이상, lucide 아이콘). 누르면 아래에서 올라오는 시트: 위에 짧은 안내(「보낸 사진만 Claude가 봐요 · 진단은 못 해요」 정도), 「일지에 올린 사진」 격자(정사각 썸네일 + 아래 작은 label, 고른 것 표시), 「새로 찍기·앨범에서」 단추. 다 찼으면(3장) 더 못 고르게 흐리게 + 안내. 시트 닫기.
- 보낼 사진이 있으면 입력 막대 **안 위쪽**에 작은 썸네일 줄(지우기 X). 보내기 단추는 글이나 사진이 있으면 켜진다.
- ⚠️ 입력 막대가 사진 줄만큼 높아지면, 그 위에 떠 있는 「✨ 상담 정리하기」 알약(지금 `fixed bottom-[88px]`)이 막대에 가려지지 않게 같이 올라가야 한다.
- 대화 속: 꼼이 말풍선에 `photos` 가 있으면 글 위에 썸네일(1~3장 나란히, 둥근 모서리). 누르면 전체 화면으로 크게(닫기 단추). 글이 비면 사진만.
- 사진은 전부 `<img>` (`loading="lazy"`), 썸네일은 `object-cover`. 개인 사진이라 `alt` 는 「보낸 사진」 정도로만.

## 지금 코드
