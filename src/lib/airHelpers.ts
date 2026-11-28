export function kstDate(offsetDays = 0): string {
  const ms = Date.now() + 9 * 3600 * 1000 + offsetDays * 24 * 3600 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

// 예보 통보 informGrade 문자열에서 권역 등급 추출
// 예: "서울 : 보통,인천 : 보통,경기북부 : 보통,경기남부 : 나쁨"
export function parseRegionGrade(informGrade: string | null, region: string): string {
  if (!informGrade) return '정보 없음';
  const part = informGrade.split(',').map((s) => s.trim()).find((s) => s.startsWith(region));
  if (!part) return '정보 없음';
  return part.split(':')[1]?.trim() || '정보 없음';
}
