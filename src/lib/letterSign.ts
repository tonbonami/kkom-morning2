// 편지 큰 이모티콘 위 사인 — 보낸 사람 이름을 영어 흘림체로(우댕 「Kkomi, Kkuldang 영어 흘림체로」 2026-11-07).
//   철자는 우댕이 준 그대로. 꼼톡에는 없고 편지에서만 보인다.
//   글씨체는 견본(아티팩트 「편지 사인 글씨체」)에서 우댕이 고른 것 — 바꿀 땐 이 파일과 layout.tsx 의 글꼴 링크만.
export const SIGN_BY_SENDER: Record<string, string> = { '꼼이': 'Kkomi', '우댕': 'Kkuldang' };

// 8번 Alex Brush(붓펜 서명) — 우댕 「8번으로 해줘」(2026-11-07). 견본의 다른 후보: Great Vibes·Dancing Script·Sacramento·Allura·Pacifico·Parisienne·Mrs Saint Delafield
export const SIGN_FONT = {
  family: "'Alex Brush', cursive",
  weight: 400,
  scale: 1,   // 글씨체마다 눈에 보이는 크기가 달라서 맞추는 배율(1 = 그림 한 변의 약 22%)
};

export function signFor(from?: string | null): string {
  return (from && SIGN_BY_SENDER[from]) || '';
}
