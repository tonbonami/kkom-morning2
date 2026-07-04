// KST(Asia/Seoul) 고정 시간 표시 유틸.
// 배경: 편지/칭찬 시간이 디바이스 타임존(getHours 등)으로 표시돼서
// 폰 시간대 설정이 서울이 아니면 전부 틀어짐 (꼼이 새 디바이스에서 실제 발생).
// 우댕·꼼이 둘 다 한국 거주라 앱은 항상 KST로 보여주는 게 맞다.

const KST = 'Asia/Seoul';

// Date → KST 기준 년/월/일/시/분 부품
export function kstParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  // hour12: false여도 자정이 24로 나오는 브라우저가 있어 % 24 보정
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute') };
}

// 'YYYY-M-D' — 같은 날인지 비교용 키 (KST 자정 기준)
export function kstDayKey(d: Date): string {
  const p = kstParts(d);
  return `${p.year}-${p.month}-${p.day}`;
}

// '오후 4:02'
export function formatKstTime(d: Date): string {
  const p = kstParts(d);
  const ampm = p.hour < 12 ? '오전' : '오후';
  const h12 = p.hour % 12 || 12;
  return `${ampm} ${h12}:${p.minute.toString().padStart(2, '0')}`;
}

// '7월 4일'
export function formatKstMonthDay(d: Date): string {
  const p = kstParts(d);
  return `${p.month}월 ${p.day}일`;
}

// '2026년 7월 4일 오후 4:02'
export function formatKstFull(d: Date): string {
  const p = kstParts(d);
  return `${p.year}년 ${p.month}월 ${p.day}일 ${formatKstTime(d)}`;
}

// toLocaleDateString('ko-KR', opts) 대체 — timeZone만 KST로 고정
export function formatKstLocale(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return d.toLocaleDateString('ko-KR', { ...opts, timeZone: KST });
}
