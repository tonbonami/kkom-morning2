// 홈 요약 "오늘의 조각"이 무엇을 말할지 정하는 규칙. (사이담 digestRules 이식 — 꼼모닝 톤/모듈로 조정)
//
// 기준 한 줄: 상대가 오늘 공유 공간에 새로 남긴 것 중, 여기가 아니면 내가 놓치기 쉬운 흔적.
//   · 내가 한 일은 안 넣는다 — 내가 제일 잘 안다.
//   · 채팅은 안 넣는다 — 메시지는 이미 그 자체로 보인다.
//   · 날씨/미세먼지는 안 넣는다 — 상대가 만든 흔적이 아니다.
//
// 가장 중요한 원칙: **빈도 ≠ 중요도.** 보고싶어 12번보다 편지 한 통이 위다.
//   순서를 바꾸려면 TIER 표를 고쳐야 한다 (예전처럼 if를 위로 옮기는 식이 구조적으로 불가능).
//
// 숫자는 이 파일에서 끝난다 — 개수를 밖으로 내보내지 않고 강도만 말로 옮긴다.
// 애정 표현에 숫자를 붙이면 "나는 5번인데 쟤는 1번" 같은 셈이 생긴다.
import type { DailyStats } from './dailyStats';

type Sender = '우댕' | '꼼이';
export type DigestKind =
  | 'letter' | 'praise' | 'memory'      // tier 3 — 시간 들여 남긴 콘텐츠
  | 'wish'                              // tier 2 — 공유 공간의 변화
  | 'bump' | 'whitening' | 'praiseRequest'; // tier 1 — 가벼운 신호 (이미 푸시로 앎)

const TIER: Record<DigestKind, number> = {
  letter: 3, praise: 3, memory: 3,
  wish: 2,
  bump: 1, whitening: 1, praiseRequest: 1,
};

interface Phrase { first: string; join: string; also: string }

const LINES: Record<DigestKind, Phrase> = {
  letter:        { first: '{subj} 편지를 남겼어',        join: '{subj} 편지를 남겼고',        also: '편지도 한 통 남겼어' },
  praise:        { first: '{subj} 칭찬을 남겼어',        join: '{subj} 칭찬을 남겼고',        also: '칭찬도 남겨뒀어' },
  memory:        { first: '같이 볼 추억이 새로 생겼어',  join: '같이 볼 추억이 새로 생겼고',  also: '추억도 새로 생겼어' },
  wish:          { first: '갖고 싶은 게 하나 늘었어',    join: '갖고 싶은 게 하나 늘었고',    also: '위시리스트도 늘었어' },
  bump:          { first: '{subj} 네 생각이 났나 봐',    join: '{subj} 네 생각이 났고',       also: '틈틈이 네 생각도 했나 봐' },
  whitening:     { first: '{subj} 화이트닝을 외쳤어',    join: '{subj} 화이트닝을 외쳤고',    also: '화이트닝도 외쳤어' },
  praiseRequest: { first: '{subj} 칭찬을 기다리는 눈치야', join: '{subj} 칭찬을 기다리고 있고', also: '칭찬도 기다리는 눈치야' },
};

// 범프만 강도를 말로 옮긴다 (개수는 밖으로 안 나감). 꼼모닝은 연인 고정이라 분기 없음.
function bumpPhrase(n: number): Phrase {
  if (n >= 5) return { first: '오늘은 유난히 {subj} 네 생각을 많이 했나 봐', join: '오늘 {subj} 유난히 네 생각을 많이 했고', also: '하루 종일 네 생각도 했나 봐' };
  if (n >= 2) return { first: '{subj} 자꾸 네 생각이 났나 봐', join: '{subj} 자꾸 네 생각이 났고', also: '자꾸 네 생각도 났나 봐' };
  return LINES.bump;
}

export interface DigestItem { kind: DigestKind; tier: number; phrase: Phrase; emoji: string; short: string; href: string; }

const SHEET: Record<DigestKind, { emoji: string; short: string; href: string }> = {
  letter:        { emoji: '💌', short: '편지를 남겼어',       href: '/letters' },
  praise:        { emoji: '✨', short: '칭찬을 남겼어',       href: '/praise' },
  memory:        { emoji: '📸', short: '추억이 생겼어',       href: '/memories' },
  wish:          { emoji: '🎁', short: '갖고 싶은 게 늘었어', href: '/wishlist' },
  bump:          { emoji: '💭', short: '네 생각이 났나 봐',    href: '' },
  whitening:     { emoji: '😬', short: '화이트닝을 외쳤어',    href: '' },
  praiseRequest: { emoji: '🥺', short: '칭찬을 기다려',        href: '/praise' },
};

function subjOf(name: string): string {
  return name === '우댕' ? '우댕이가' : name === '꼼이' ? '꼼이가' : name + '가';
}

// 꼼모닝 DailyStats에서 상대(partner)의 오늘치 개수를 kind별로 뽑는다.
// 범프는 miss/love/hug/kiss를 하나로 합산 — 종류별 슬롯이 다시 생기는 걸 막는다.
// whitening은 둘만의 농담이라 tier 1의 별도 kind로 살려둔다 (night는 미사용).
function countOf(stats: DailyStats, kind: DigestKind, partner: Sender): number {
  switch (kind) {
    case 'letter': return stats.letters[partner] ?? 0;
    case 'praise': return stats.praiseStickers[partner] ?? 0;
    case 'memory': return stats.memories[partner] ?? 0;
    case 'wish': return stats.wishItems[partner] ?? 0;
    case 'whitening': return stats.bumps.whitening[partner] ?? 0;
    case 'praiseRequest': return stats.praiseRequests[partner] ?? 0;
    case 'bump':
      return (stats.bumps.miss[partner] ?? 0) + (stats.bumps.love[partner] ?? 0)
        + (stats.bumps.hug[partner] ?? 0) + (stats.bumps.kiss[partner] ?? 0);
  }
}

/** 상대가 오늘 남긴 것들을 '무엇을 말할지' 순서(tier 내림차순)로 정렬해 돌려준다. */
export function buildDigest(stats: DailyStats, partner: Sender): DigestItem[] {
  const subj = subjOf(partner);
  const items: DigestItem[] = [];
  for (const kind of Object.keys(TIER) as DigestKind[]) {
    const n = countOf(stats, kind, partner);
    if (n <= 0) continue;
    const p = kind === 'bump' ? bumpPhrase(n) : LINES[kind];
    items.push({
      kind,
      tier: TIER[kind],
      phrase: {
        first: p.first.replace(/\{subj\}/g, subj),
        join: p.join.replace(/\{subj\}/g, subj),
        also: p.also.replace(/\{subj\}/g, subj),
      },
      ...SHEET[kind],
    });
  }
  return items.sort((a, b) => b.tier - a.tier);
}

/** 앞 두 개로 문장을 만든다. 세 번째부터는 문장에 안 넣는다 — 넣으면 결국 칩 여섯 개로 돌아간다. */
export function composeSentence(items: DigestItem[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return `${items[0].phrase.first}.`;
  return `${items[0].phrase.join}, ${items[1].phrase.also}.`;
}
