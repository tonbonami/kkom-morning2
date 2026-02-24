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