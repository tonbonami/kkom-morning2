너는 모바일 앱 UI 디자이너 겸 React 개발자야. 아래 요구대로 **React 컴포넌트 2개의 완성 코드**를 만들어 줘. 파일을 열거나 명령을 실행하지 말고, 답에 코드만 써 줘.

## 앱
- 「꼼모닝」: 연인 둘(우댕·꼼이)만 쓰는 커플 앱. 한국어. 아이폰 앱(웹뷰) 안에서 돈다. 라이트 전용.
- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, `framer-motion` 11, `lucide-react` 아이콘만. 다른 라이브러리 금지.
- 디자인 시스템(이미 전역 CSS에 있는 변수 — 이름 그대로 `var(--…)`로 써):
  - 바탕 그라디언트 `.sd-app`(따뜻한 회백 #FCFAF7→#F7F6F7)
  - 카드 `.sd-card`(흰 반투명 rgba(255,255,255,.74), 모서리 28px, 그림자 `var(--sd-shadow-card)`), `--sd-card-solid:#FFFFFF`
  - 글자: `--sd-ink:#2E1D26`(본문), `--sd-muted:#6E5457`, `--sd-faint:#806668`, `--sd-cardlabel:#9C8A8C`(카드 이름), 선 `--sd-line:#E4D2D2`, 면2 `--sd-surface-2:#F1EBEA`
  - 강조(관계색 코랄): `--sd-rel:#E4685E`, `--sd-rel-2:#EE7C6C`, `--sd-rel-soft:#FDEBE6`, 그림자 `--sd-rel-shadow`
  - 버튼 그림자 `--sd-shadow-btn`. 숫자는 `tabular-nums`. 굵기 대비(이름 bold, 큰 숫자 extrabold).
- 홈 화면은 2열 카드 격자. 다른 카드 예(이 모양에 맞춰): `<button className="sd-card w-full h-full px-4 py-4 flex flex-col relative text-left transition-transform active:scale-[.98]">` + 왼쪽 위 카드 이름 줄 `flex items-center gap-1.5 text-[13.5px] font-bold` 색 `var(--sd-cardlabel)` + 아이콘 16px.

## 만들 기능: 잠잘 때 듣는 소리(백색소음)
꼼이가 매일 밤 유튜브 빗소리를 틀어 놓고 자는데, 화면이 꺼지면 멈추고 광고가 떠서 앱 안에 넣는다. 소리는 앱(아이폰 쪽)이 내고, 이 화면들은 고르고·켜고·끄는 것만 한다. **밤에 침대에서 불 끄고 보는 화면**이라 눈부시지 않아야 하고, 반쯤 졸린 상태에서도 한 번에 누를 수 있어야 한다.

### 컴포넌트 1 — `SleepSoundCard` (홈 격자 카드, 가로 2칸 크기, 높이는 부모가 정함 → `h-full`)
```ts
export interface SleepSoundCardProps {
  playing: boolean;          // 지금 소리가 나는 중
  soundName: string;         // 예: '포근한 빗소리'
  endText: string;           // 예: '아침 7:00까지' | '계속 재생' | '6시간 12분 남음'
  available: boolean;        // false = 아이폰 앱이 아님(웹 브라우저) → 재생 단추 대신 '꼼모닝 앱에서 들을 수 있어요'
  onToggle: () => void;      // 오른쪽 큰 재생/정지 단추
  onOpen: () => void;        // 카드 나머지를 누르면 자세한 화면으로
}
```
- 카드 이름 줄: 달(Moon) 아이콘 + 「잠 소리」.
- 오른쪽에 엄지로 누르기 쉬운 큰 둥근 재생/정지 단추(최소 56px). 재생 중이면 은은하게 살아 있는 느낌(작은 물결·숨 쉬는 링 등, `prefers-reduced-motion`이면 멈춤). 단추 누를 때 카드의 onOpen이 같이 불리면 안 됨(stopPropagation).
- 재생 중일 때와 아닐 때 카드가 한눈에 구분되게.

### 컴포넌트 2 — `SleepSoundScreen` (전체 화면 페이지 `/sleep`)
```ts
export interface SleepSoundOption { id: string; name: string; desc: string }   // 3개: 포근한 빗소리 / 분홍 소음 / 갈색 소음
export interface SleepSoundScreenProps {
  sounds: SleepSoundOption[];
  selectedId: string;
  onSelect: (id: string) => void;            // 재생 중에 바꾸면 그 소리로 바로 바뀜(부모가 처리)
  endMode: 'morning' | 'forever';            // 아침 몇 시까지 / 끌 때까지 계속
  onEndModeChange: (m: 'morning' | 'forever') => void;
  morningTime: string;                       // 'HH:MM' 24시간, 기본 '07:00'
  onMorningTimeChange: (t: string) => void;
  volume: number;                            // 0~1
  onVolumeChange: (v: number) => void;       // 끌어서 조절, 바로바로 반영
  playing: boolean;
  remainingText?: string;                    // 재생 중일 때 '6시간 12분 남음' / '계속 재생 중'
  available: boolean;                        // false면 재생 단추 막고 '꼼모닝 아이폰 앱에서만 재생돼요' 안내
  onPlay: () => void;
  onStop: () => void;
  onBack: () => void;                        // 왼쪽 위 뒤로
}
```
- 화면 구성(위→아래): 뒤로 단추 + 제목 「잠 소리」 → **크게 가운데 재생/정지 단추**(가장 중요, 최소 96px) + 그 아래 지금 소리 이름·남은 시간 → 소리 고르기 3개(카드나 알약, 고른 것이 확실히 보이게) → 끄는 때(「아침까지」 + 시각, 「계속」) → 볼륨 막대 → 맨 아래 작은 안내 한 줄: 「화면을 잠가도 계속 나와요 · 아침 알람은 그대로 울려요」.
- 시각 고르기는 `<input type="time">` 같은 기본 입력을 예쁘게 감싸도 되고 직접 만들어도 됨(아이폰에서 잘 되게).
- 볼륨 막대는 손가락으로 끌기 쉽게(높이 넉넉히), 0~1 값.
- **밤 화면 톤**: 앱의 따뜻한 색 계열 안에서 어둡고 차분하게 해도 좋고(예: 깊은 밤 자주·남색 + 코랄 포인트), 앱 바탕 그대로 밝게 하되 강한 흰색을 줄여도 됨. 네가 판단해. 단 형광 그라디언트·보라/핑크 남발·네온 금지. 글자 대비는 읽히게.
- 상단·하단 아이폰 안전영역(`env(safe-area-inset-top/bottom)`) 고려, `max-w-md mx-auto`.
- 재생 중에는 화면 전체가 은은하게 살아 있는 느낌 하나(빗방울·느린 물결·별 등 — 가볍게, CPU 적게, reduced-motion이면 멈춤).

## 규칙
- 두 파일 각각 `'use client';`로 시작하는 완성 코드. 파일 이름 주석을 맨 위에(`// src/components/SleepSoundCard.tsx`, `// src/components/SleepSoundScreen.tsx`).
- props 이름·타입은 위와 **정확히 같게**(내가 데이터만 꽂는다). 컴포넌트 안에 가짜 데이터·상태 저장·타이머 로직 넣지 말 것(애니메이션용 상태만 허용).
- 문구는 전부 한국어, 짧고 다정하게. 이모지는 쓰지 말고 lucide 아이콘으로.
- 버튼은 `motion.button` + `whileTap`. 누르는 영역 44px 이상.
- 코드 블록 두 개만 답해 줘(설명은 맨 끝에 3줄 이내).
