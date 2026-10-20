커플 둘이 쓰는 앱(Next.js 15 + React 18 + Tailwind 3.4 + framer-motion + lucide-react, 아이폰 세로 390px)의 「꼼이 피부 일지」 화면 컴포넌트를 만들어 줘.
꼼이(여자친구)가 만성 두드러기 때문에 매일 기록하고, 우댕(남자친구)은 보기 전용으로 같이 본다. 전문적이되 무섭지 않은 느낌.

지켜 줄 것
- 파일 맨 위 'use client'. 데이터는 props로만 받고 직접 불러오지 않는다. 쓰는 라이브러리는 react, framer-motion, lucide-react(분석 화면만 recharts)뿐.
- 색은 CSS 변수로만: --sd-ink(글자) --sd-muted(보조 글자) --sd-faint(더 옅은 글자) --sd-line(선) --sd-card-solid(불투명 카드면) --sd-surface-2(화면 바탕·칩 바탕) --sd-rel(강조 파랑보라) --sd-rel-soft(옅은 강조) --sd-crit(빨강·경고). 다크 모드는 변수가 알아서 바꾼다.
  카드는 className "sd-card"(둥근 반투명 카드, 그림자 포함), 덜 튀는 카드는 "sd-card sd-card--quiet".
  ⚠️ `bg-[var(--x)] bg-opacity-10` 은 CSS 변수 색에 안 먹는다(글자가 배경에 묻혔던 사고). 옅은 배경은 `bg-[color-mix(in_srgb,var(--sd-crit)_12%,transparent)]` 처럼. `bg-white`·`text-gray-*` 같은 고정색 금지.
- 글은 전부 한국어, 쉬운 말. UAS·트리거 같은 외래어·약어를 화면에 쓰지 않는다. 점수는 「3 / 6」처럼.
- 기록 안 한 것(null·빈 배열)을 「없음」으로 쓰지 마라 — 안 적은 것과 증상 없음은 다르다. 안 적은 건 「안 적음」.
- 390px에서 가로로 넘치거나 글자가 잘리지 않게. 누르는 곳은 높이 40px 이상.
- 답은 파일마다 ```tsx 블록 하나, 블록 첫 줄은 `// 파일이름.tsx`. 파일 전체를 줘(생략·「…기존과 같음」 금지). 설명은 맨 끝에 3줄 이내.
