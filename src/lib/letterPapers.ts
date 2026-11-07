// src/lib/letterPapers.ts
// 편지지 2탄 v2 — 첫 6장(점·발바닥·체크 전면 무늬)이 우댕 「넘 촌스럽다」 → Antigravity(Pro 지정) 새 시안 그대로(docs/gemini-letter-paper-v2-*.md).
import type React from 'react';

export interface LetterPaperTheme {
  id: string;
  name: string; // 2~4글자 짧은 한국어
  className: string; // '!bg-[#…] sd-card-paper' (호환용)
  style: React.CSSProperties; // 실제 바탕 및 무늬 스타일
  ink: string; // 본문 글자색
  muted: string; // 날짜, 안내문 등 흐린 글자색
  stamp: {
    bg: string; // From 도장 배경색
    fg: string; // From 도장 글자색
    border: string; // From 도장 테두리선
  };
}

export const DEFAULT_PAPER_ID = 'peach';

export const LETTER_PAPERS: LetterPaperTheme[] = [
  // 1. 살구 (기본 편지지: 우댕이 고른 시그니처 톤 그대로 유지)
  {
    id: 'peach',
    name: '살구',
    className: '!bg-[#F9E0D6] sd-card-paper',
    style: {
      backgroundColor: '#F9E0D6',
    },
    ink: '#2E1D26',
    muted: '#856A74',
    stamp: {
      bg: '#F2CEBF',
      fg: '#7D443B',
      border: '#E3B5A2',
    },
  },

  // 2. 로즈 (프랑스 전통 레터세트의 더스티 로즈 & 섬세한 이중 압인 프레임)
  // AI 타일 프롬프트: "Seamless repeating tile texture of dusty rose French cotton paper, extremely subtle fibers, soft matte finish, minimal elegant vintage stationery, high resolution, uniform flat lighting --no lines --no watermark"
  {
    id: 'rose',
    name: '로즈',
    className: '!bg-[#F3D5DB] sd-card-paper',
    style: {
      backgroundColor: '#F3D5DB',
      // 안쪽에 섬세하게 둘러진 이중 실선 테두리(인셋 보더)로 격식 있는 편지지 느낌
      boxShadow:
        'inset 0 0 0 1px #E5B8C1, inset 0 0 0 6px #F3D5DB, inset 0 0 0 7px #E5B8C1',
    },
    ink: '#2E1D26',
    muted: '#875C68',
    stamp: {
      bg: '#E7BDC6',
      fg: '#6B313F',
      border: '#D6A4AF',
    },
  },

  // 3. 세이지 (허브 잎을 빻아 만든 듯 차분하고 싱그러운 유럽풍 정원 편지지)
  // AI 타일 프롬프트: "Seamless repeating tile texture of light sage green handmade herbal paper, delicate specks of botanical fibers, warm natural lighting, subtle tactile paper grain --no patterns"
  {
    id: 'sage',
    name: '세이지',
    className: '!bg-[#D5E3D8] sd-card-paper',
    style: {
      backgroundColor: '#D5E3D8',
      // 가장자리가 부드럽게 눌려 들어간 듯한 압인(Embossing) 음영 효과
      boxShadow:
        'inset 0 0 24px rgba(132, 160, 137, 0.32), inset 0 0 0 1px rgba(132, 160, 137, 0.45)',
    },
    ink: '#2E1D26',
    muted: '#58735E',
    stamp: {
      bg: '#C2D6C7',
      fg: '#2C4933',
      border: '#A9C2AF',
    },
  },

  // 4. 코튼줄 (28.8px 글줄 간격에 정확히 맞춘 미도리 MD 스타일 만년필 줄노트)
  // AI 타일 프롬프트: "Seamless repeating tile of warm ivory cream heavy cotton stationery paper, smooth fine tooth texture for fountain pen ink, premium minimalist aesthetic --no lines"
  {
    id: 'ruled',
    name: '코튼줄',
    className: '!bg-[#F6E6CA] sd-card-paper',
    style: {
      backgroundColor: '#F6E6CA',
      // 16px 글자 + 줄간격 1.8 = 28.8px 높이에 칼같이 일치하는 은은한 실선
      backgroundImage:
        'repeating-linear-gradient(to bottom, transparent, transparent 27.8px, rgba(160, 126, 90, 0.24) 27.8px, rgba(160, 126, 90, 0.24) 28.8px)',
      backgroundPosition: '0 4px',
      boxShadow: 'inset 0 0 0 1px rgba(160, 126, 90, 0.22)',
    },
    ink: '#2E1D26',
    muted: '#7A6046',
    stamp: {
      bg: '#E8D2AD',
      fg: '#5C4121',
      border: '#D9BC8E',
    },
  },

  // 5. 은하늘 (안개 낀 새벽 호수처럼 차분하게 가라앉은 블루그레이 레터지)
  // AI 타일 프롬프트: "Seamless repeating pattern of muted slate powder-blue laid paper, very faint horizontal laid lines texture, antique Italian letter sheet, soft diffused light --no text"
  {
    id: 'sky',
    name: '은하늘',
    className: '!bg-[#D5E2EC] sd-card-paper',
    style: {
      backgroundColor: '#D5E2EC',
      // 상하단에 얇은 클래식 괘선(Rule)을 두어 정돈된 우아함 강조
      boxShadow:
        'inset 0 12px 0 0 #D5E2EC, inset 0 13px 0 0 #B5C8D8, inset 0 -12px 0 0 #D5E2EC, inset 0 -13px 0 0 #B5C8D8, inset 0 0 0 1px rgba(181, 200, 216, 0.5)',
    },
    ink: '#2E1D26',
    muted: '#52697E',
    stamp: {
      bg: '#C1D3E3',
      fg: '#26425C',
      border: '#A7C0D4',
    },
  },

  // 6. 꿀빛 (꿀됑 조끼의 따뜻함을 닮은 차분한 밀랍 씰 레터지)
  // AI 타일 프롬프트: "Seamless repeating tile of natural warm beeswax yellow parchment paper, organic mottled vellum texture, gentle antique aesthetic, ultra clean --no vignette --no border"
  {
    id: 'honey',
    name: '꿀빛',
    className: '!bg-[#F8E7BE] sd-card-paper',
    style: {
      backgroundColor: '#F8E7BE',
      // 모서리에 꿀처럼 부드러운 앰버 톤 비네팅을 주어 도톰한 종이 질감 연출
      boxShadow:
        'inset 0 0 28px rgba(186, 142, 60, 0.25), inset 0 0 0 1px rgba(186, 142, 60, 0.35)',
    },
    ink: '#2E1D26',
    muted: '#7E612B',
    stamp: {
      bg: '#EDD19A',
      fg: '#61400A',
      border: '#DFBC78',
    },
  },
];

export function paperById(id?: string | null): LetterPaperTheme {
  const found = LETTER_PAPERS.find((p) => p.id === id);
  return found ?? LETTER_PAPERS[0];
}
