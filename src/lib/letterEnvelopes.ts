// src/lib/letterEnvelopes.ts

export type EnvelopePalette = {
  body: string; flap: string; lining: string;   // 봉투 몸통·덮개·안쪽 안감
  paperPreview: string;                          // 올라오는 내용 없는 종이 색(= 편지지 바탕과 같게)
  seal: string; sealInk: string;                 // 밀랍 도장(글자 없이 하트 압인)
  labelInk: string;                              // 봉투 앞 「From. 우댕」 글자색
};

export const ENVELOPE_BY_PAPER: Record<string, EnvelopePalette> = {
  // 살구 #F9E0D6
  peach: {
    body: '#F2D3C7',
    flap: '#E6C2B4',
    lining: '#FAF0EB',
    paperPreview: '#F9E0D6',
    seal: '#C55A4F',
    sealInk: '#7D2E24',
    labelInk: '#5C3E3A',
  },
  // 로즈 #F3D5DB
  rose: {
    body: '#ECC4CD',
    flap: '#DFB4BE',
    lining: '#FAF0F2',
    paperPreview: '#F3D5DB',
    seal: '#B85165',
    sealInk: '#782637',
    labelInk: '#57333B',
  },
  // 세이지 #D5E3D8
  sage: {
    body: '#C6D8CA',
    flap: '#B9CCBE',
    lining: '#EDF4EE',
    paperPreview: '#D5E3D8',
    seal: '#5B7966',
    sealInk: '#334D3D',
    labelInk: '#37453C',
  },
  // 코튼줄 #F6E6CA
  ruled: {
    body: '#EAD9BC',
    flap: '#DECBAA',
    lining: '#FAF5ED',
    paperPreview: '#F6E6CA',
    seal: '#A46944',
    sealInk: '#653B20',
    labelInk: '#4D3E33',
  },
  // 은하늘 #D5E2EC
  sky: {
    body: '#C4D5E2',
    flap: '#B6C8D6',
    lining: '#EEF4F8',
    paperPreview: '#D5E2EC',
    seal: '#516E87',
    sealInk: '#2C4254',
    labelInk: '#34404C',
  },
  // 꿀빛 #F8E7BE
  honey: {
    body: '#EEDAA8',
    flap: '#E1CC95',
    lining: '#FBF4E4',
    paperPreview: '#F8E7BE',
    seal: '#C47731',
    sealInk: '#7C4212',
    labelInk: '#52402A',
  },
};

export function envelopeFor(paperId?: string | null): EnvelopePalette {
  if (paperId && paperId in ENVELOPE_BY_PAPER) {
    return ENVELOPE_BY_PAPER[paperId];
  }
  return ENVELOPE_BY_PAPER.peach;
}
