'use client';

// 하늘 그림 — 기상청 SKY/PTY 코드에 따라 해·구름·비·눈을 그린다.
//
// AirSkyVisual 이 이미 있지만 그건 **미세먼지 등급**용이라 하늘 상태를 모른다.
// 숫자만 있는 날씨 카드는 정보는 주지만 아무 기분도 안 준다.
//
// SKY 1=맑음 3=구름많음 4=흐림 / PTY 0=없음 1=비 2=비눈 3=눈 4=소나기

interface Props {
  sky?: string | null;
  pty?: string | null;
  size?: number;
  className?: string;
}

export default function SkyArt({ sky, pty, size = 72, className = '' }: Props) {
  const rain = pty === '1' || pty === '2' || pty === '4';
  const snow = pty === '2' || pty === '3';
  const wet = rain || snow;
  // 비/눈이면 해는 숨긴다. 흐림(4)도 해가 안 보인다.
  const showSun = !wet && sky !== '4';
  const showCloud = wet || sky === '3' || sky === '4';
  const heavy = sky === '4' || wet;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id="sa-sun" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="100%" stopColor="#FFC94D" />
        </radialGradient>
        <linearGradient id="sa-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={heavy ? '#DFE4EA' : '#F1F4F8'} />
        </linearGradient>
      </defs>

      {showSun && (
        <g>
          {/* 광선 — 맑을 때만. 구름에 가리면 산만하다 */}
          {sky === '1' && [0, 45, 90, 135].map((deg) => (
            <line key={deg} x1="50" y1="10" x2="50" y2="18"
                  stroke="#FFD874" strokeWidth="3.5" strokeLinecap="round"
                  transform={`rotate(${deg} 50 42)`} opacity=".85" />
          ))}
          <circle cx={showCloud ? 62 : 50} cy={showCloud ? 34 : 42}
                  r={showCloud ? 15 : 19} fill="url(#sa-sun)" />
        </g>
      )}

      {showCloud && (
        <g>
          <ellipse cx="38" cy="56" rx="20" ry="15" fill="url(#sa-cloud)" />
          <ellipse cx="57" cy="59" rx="15" ry="12" fill="url(#sa-cloud)" />
          <ellipse cx="47" cy="49" rx="14" ry="12" fill="url(#sa-cloud)" />
          {sky === '4' && <ellipse cx="66" cy="52" rx="11" ry="9" fill="url(#sa-cloud)" opacity=".85" />}
        </g>
      )}

      {rain && [0, 1, 2].map((i) => (
        <line key={i} x1={36 + i * 12} y1={74} x2={32 + i * 12} y2={86}
              stroke="#7FB3E0" strokeWidth="3.5" strokeLinecap="round" opacity=".9" />
      ))}
      {snow && [0, 1, 2].map((i) => (
        <circle key={i} cx={36 + i * 12} cy={78 + (i % 2) * 6} r="3.2" fill="#CFE4F5" />
      ))}
    </svg>
  );
}
