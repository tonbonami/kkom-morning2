'use client';

import { motion } from 'framer-motion';

type Grade = '좋음' | '보통' | '나쁨' | '매우 나쁨' | string | null | undefined;

interface Props {
  grade?: Grade;
  height?: number; // 카드 높이 px (기본 180)
}

// 등급별 비주얼 컨피그
function configFor(grade: Grade) {
  switch (grade) {
    case '좋음':
      return {
        sky: ['#A8E2EA', '#E4F6F4'],  // 청록 → 옅은 민트
        sunOpacity: 1,
        sunColor: '#FFE787',
        cloudColor: '#FFFFFF',
        cloudCount: 1,
        showWind: true,
        dustOpacity: 0,
      };
    case '보통':
      return {
        sky: ['#CDDBDB', '#EAF0F0'],  // 옅은 회청
        sunOpacity: 0.75,
        sunColor: '#FFE39A',
        cloudColor: '#F5F5F5',
        cloudCount: 2,
        showWind: true,
        dustOpacity: 0.15,
      };
    case '나쁨':
      return {
        sky: ['#CDB89C', '#E6D9C6'],  // 누런 회갈
        sunOpacity: 0.35,
        sunColor: '#F5C97C',
        cloudColor: '#D6CBB5',
        cloudCount: 2,
        showWind: false,
        dustOpacity: 0.55,
      };
    case '매우 나쁨':
      return {
        sky: ['#A89172', '#C6B496'],  // 짙은 갈
        sunOpacity: 0.15,
        sunColor: '#EAA764',
        cloudColor: '#A8967B',
        cloudCount: 3,
        showWind: false,
        dustOpacity: 0.9,
      };
    default:
      return {
        sky: ['#E5E5E5', '#F5F5F5'],
        sunOpacity: 0.4,
        sunColor: '#FFE787',
        cloudColor: '#FFFFFF',
        cloudCount: 1,
        showWind: false,
        dustOpacity: 0,
      };
  }
}

// SSR-safe 결정론적 먼지 좌표 (Math.random 금지 — 하이드레이션 깨짐)
const DUST = Array.from({ length: 18 }, (_, i) => ({
  x: ((i * 53) % 380) + 10,
  y: ((i * 37) % 140) + 20,
  r: 1.6 + (i % 3) * 0.5,
  delay: (i * 0.21) % 3,
  dur: 2.6 + (i % 4) * 0.6,
}));

// 결정론적 구름 좌표
const CLOUD_BASES = [
  { y: 50, startX: -120, dur: 38 },
  { y: 80, startX: -260, dur: 50 },
  { y: 35, startX: -200, dur: 60 },
];

function Cloud({ y, startX, dur, color }: { y: number; startX: number; dur: number; color: string }) {
  return (
    <motion.g
      initial={{ x: startX }}
      animate={{ x: 460 }}
      transition={{ duration: dur, repeat: Infinity, ease: 'linear' }}
    >
      <ellipse cx="40" cy={y} rx="34" ry="13" fill={color} />
      <ellipse cx="22" cy={y + 6} rx="20" ry="10" fill={color} />
      <ellipse cx="60" cy={y + 6} rx="22" ry="10" fill={color} />
    </motion.g>
  );
}

export default function AirSkyVisual({ grade, height = 180 }: Props) {
  const c = configFor(grade);

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg
        viewBox="0 0 400 180"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
        aria-hidden
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.sky[0]} />
            <stop offset="100%" stopColor={c.sky[1]} />
          </linearGradient>
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c.sunColor} stopOpacity={c.sunOpacity} />
            <stop offset="55%" stopColor={c.sunColor} stopOpacity={c.sunOpacity * 0.45} />
            <stop offset="100%" stopColor={c.sunColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 하늘 배경 */}
        <rect x="0" y="0" width="400" height="180" fill="url(#skyGrad)" />

        {/* 해 (등급 나쁠수록 흐려짐) */}
        <g>
          <circle cx="320" cy="55" r="55" fill="url(#sunGrad)" />
          <motion.circle
            cx="320"
            cy="55"
            r="18"
            fill={c.sunColor}
            opacity={c.sunOpacity * 0.9}
            animate={grade === '좋음' ? { r: [18, 20, 18], opacity: [0.9, 1, 0.9] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>

        {/* 구름 (개수/색 등급별) */}
        {CLOUD_BASES.slice(0, c.cloudCount).map((b, i) => (
          <Cloud key={i} y={b.y} startX={b.startX} dur={b.dur} color={c.cloudColor} />
        ))}

        {/* 바람 살랑살랑 (맑은 날만) */}
        {c.showWind && (
          <g>
            {[0, 1, 2].map((i) => (
              <motion.line
                key={i}
                x1="0"
                x2="36"
                y1={130 + i * 14}
                y2={130 + i * 14}
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.65"
                initial={{ x: -60 }}
                animate={{ x: 460 }}
                transition={{ duration: 6 + i * 0.8, repeat: Infinity, delay: i * 1.6, ease: 'linear' }}
              />
            ))}
          </g>
        )}

        {/* 먼지 떠다님 (나쁨/매우 나쁨) */}
        {c.dustOpacity > 0 && (
          <g opacity={c.dustOpacity}>
            {DUST.map((p, i) => (
              <motion.circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill="#7C6F58"
                animate={{
                  cy: [p.y - 4, p.y + 4, p.y - 4],
                  opacity: [0.35, 0.9, 0.35],
                }}
                transition={{
                  duration: p.dur,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </g>
        )}

        {/* 하단 살짝 그라데이션 — 카드 안 텍스트 가독성 보조 */}
        <rect x="0" y="120" width="400" height="60" fill="url(#skyGrad)" opacity="0.25" />
      </svg>
    </div>
  );
}
