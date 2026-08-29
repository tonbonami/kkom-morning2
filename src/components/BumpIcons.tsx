// 범프 손그림 아이콘 — 사이담 BumpIcons 그대로(miss/love/hug/kiss) + 꼼모닝 전용 whitening.
// 규칙(사이담 2차 개정): viewBox 24 / 화면 2.5px 선(=userSpace 2.3) / 한 캔버스=한 사물 /
//   선 사이 최소 3px / 26px에서 실제 렌더로 눈확인. 부가 요소는 먼지로 보인다.
const S = { fill: 'none', strokeWidth: 2.3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

type P = { size?: number };
const wrap = (size: number, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" {...S} aria-hidden>
    {children}
  </svg>
);

/** 보고싶어 — 쌍안경(너를 찾는다). */
export const IcMiss = ({ size = 26 }: P) => wrap(size, <>
  <circle cx="7" cy="14.6" r="3.4" />
  <circle cx="17" cy="14.6" r="3.4" />
  <path d="M10.4 14.6h3.2" />
  <path d="M5.2 12 6.2 6.7a1.4 1.4 0 0 1 1.6 0L8.8 12" />
  <path d="M15.2 12l1-5.3a1.4 1.4 0 0 1 1.6 0L18.8 12" />
</>);

/** 사랑해 — 하트 하나. */
export const IcLove = ({ size = 26 }: P) => wrap(size, <>
  <path d="M12 20.3c-.5-.4-7.5-4.8-8.6-9.1C2.5 7.7 4.9 4.8 7.9 4.8c1.8 0 3.2 1 4.1 2.5.9-1.5 2.3-2.5 4.1-2.5 3 0 5.4 2.9 4.5 6.4-1.1 4.3-8.1 8.7-8.6 9.1Z" />
</>);

/** 안아줘 — 양팔 벌린 상체. */
export const IcHug = ({ size = 26 }: P) => wrap(size, <>
  <circle cx="12" cy="6.1" r="2.9" />
  <path d="M8 20.4v-2.7a4 4 0 0 1 8 0v2.7" />
  <path d="M8.3 15.2C6 14.2 4.3 12.2 3.8 9.8" />
  <path d="M15.7 15.2c2.3-1 4-3 4.5-5.4" />
</>);

/** 뽀뽀 — 입술 하나. */
export const IcKiss = ({ size = 26 }: P) => wrap(size, <>
  <path d="M3.4 11.6c1.5-2.2 3.3-3.4 4.9-3.4 1.6 0 2.8.9 3.7 2.1.9-1.2 2.1-2.1 3.7-2.1 1.6 0 3.4 1.2 4.9 3.4Z" />
  <path d="M3.4 11.6c1.6 3.5 4.9 5.8 8.6 5.8s7-2.3 8.6-5.8Z" />
</>);

/** 화이트닝 — 반짝이는 이(둘만의 화이팅 구호). 어금니 한 알 + 좌상단 반짝임 하나.
 *  '반짝임'은 여기선 부가가 아니라 의미의 핵심(하얗게 빛난다)이라 딱 하나만 남긴다. */
export const IcWhitening = ({ size = 26 }: P) => wrap(size, <>
  {/* 어금니 — 둥근 크라운 + 가운데 홈으로 갈라지는 두 뿌리 */}
  <path d="M8.6 8.2a4.2 4.2 0 0 1 8.4 0c0 2.4-.8 3.9-1.4 6-.5 1.7-.5 4.2-1.8 4.2-1 0-1-2.6-2-2.6s-1 2.6-2 2.6c-1.3 0-1.3-2.5-1.8-4.2-.6-2.1-1.4-3.6-1.4-6Z" />
  {/* 반짝임 — 좌상단, 이와 3px 이상 떨어뜨림 */}
  <path d="M5 3.2c.25 1.3.7 1.75 2 2-1.3.25-1.75.7-2 2-.25-1.3-.7-1.75-2-2 1.3-.25 1.75-.7 2-2Z" />
</>);

/** kind → 그림. */
export const BUMP_ICON = {
  miss: IcMiss, love: IcLove, hug: IcHug, kiss: IcKiss, whitening: IcWhitening,
} as const;
