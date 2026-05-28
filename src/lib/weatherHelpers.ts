export function getSkyCondition(sky: string | null): {
  text: string;
  emoji: string;
} {
  if (!sky) return { text: '알 수 없음', emoji: '🌤️' };
  
  const mapping: Record<string, { text: string; emoji: string }> = {
    '1': { text: '맑음', emoji: '☀️' },
    '3': { text: '구름많음', emoji: '🌤️' },
    '4': { text: '흐림', emoji: '☁️' },
  };
  
  return mapping[sky] || { text: '알 수 없음', emoji: '🌤️' };
}

export function getAirQualityEmoji(grade: string): string {
  const mapping: Record<string, string> = {
    '좋음': '😊',
    '보통': '😐',
    '나쁨': '😷',
    '매우 나쁨': '🤢',
    '정보 없음': '❓',
    '조회 실패': '⚠️',
  };
  
  return mapping[grade] || '❓';
}

export function getAirQualityColor(grade: string): string {
  const mapping: Record<string, string> = {
    '좋음': 'border-l-emerald-400',
    '보통': 'border-l-blue-400',
    '나쁨': 'border-l-orange-400',
    '매우 나쁨': 'border-l-red-500',
  };

  return mapping[grade] || 'border-l-gray-400';
}

// 등급별 카드 배경/테두리 (한눈에 보이는 색)
export function getAirQualityBg(grade: string): string {
  const mapping: Record<string, string> = {
    '좋음': 'bg-emerald-50/80 border-emerald-200',
    '보통': 'bg-sky-50/80 border-sky-200',
    '나쁨': 'bg-orange-50/80 border-orange-200',
    '매우 나쁨': 'bg-red-50/80 border-red-200',
  };

  return mapping[grade] || 'bg-slate-50/80 border-slate-200';
}

// 등급별 글자색 (큰 등급 텍스트용)
export function getAirQualityText(grade: string): string {
  const mapping: Record<string, string> = {
    '좋음': 'text-emerald-600',
    '보통': 'text-sky-600',
    '나쁨': 'text-orange-600',
    '매우 나쁨': 'text-red-600',
  };

  return mapping[grade] || 'text-slate-500';
}