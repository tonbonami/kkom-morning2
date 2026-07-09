// 월 캘린더 그리드 + 멀티데이 바 슬롯 배치 로직 (뷰와 분리).
// 전부 KST 기준 'YYYY-MM-DD' 문자열로 계산 — Date 타임존 함정 회피.

import type { CalendarEvent } from './calendar';

export interface DayCell {
  date: string;       // 'YYYY-MM-DD'
  day: number;        // 1~31
  inMonth: boolean;   // 이번 달 소속 (앞뒤 채움 칸이면 false)
  isToday: boolean;
}

// 한 주 안에서 멀티데이 바가 차지하는 조각 (그리드 좌표)
export interface WeekBar {
  event: CalendarEvent;
  slot: number;       // 세로 쌓임 위치 (0,1,2...)
  colStart: number;   // 0~6 (일~토)
  span: number;       // 몇 칸 차지 (1~7)
  continuesLeft: boolean;  // 이전 주에서 이어짐
  continuesRight: boolean; // 다음 주로 이어짐
}

export interface CalendarWeek {
  cells: DayCell[];   // 7칸
  bars: WeekBar[];
}

// ── 날짜 유틸 (KST 문자열 기반) ──
function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
export function parseYmd(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}
// 'YYYY-MM-DD'를 UTC 자정 Date로 (요일/일수 계산용, 타임존 영향 없음)
function ymdToUtc(s: string): Date {
  const { y, m, d } = parseYmd(s);
  return new Date(Date.UTC(y, m - 1, d));
}
export function addDaysYmd(s: string, n: number): string {
  const dt = ymdToUtc(s);
  dt.setUTCDate(dt.getUTCDate() + n);
  return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}
export function diffDays(a: string, b: string): number {
  return Math.round((ymdToUtc(b).getTime() - ymdToUtc(a).getTime()) / 86_400_000);
}
export function weekdayOf(s: string): number { // 0=일 ~ 6=토
  return ymdToUtc(s).getUTCDay();
}

// 오늘 (KST)
export function todayYmd(): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const kst = new Date(utcMs + 9 * 60 * 60_000);
  return ymd(kst.getFullYear(), kst.getMonth() + 1, kst.getDate());
}

// 월 그리드(주 배열) 생성 + 각 주에 멀티데이 바 슬롯 배치
export function buildMonthGrid(year: number, month: number, events: CalendarEvent[]): CalendarWeek[] {
  const today = todayYmd();
  const firstOfMonth = ymd(year, month, 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = weekdayOf(firstOfMonth); // 그리드 시작 offset

  // 그리드 첫 칸 = 이번 달 1일이 속한 주의 일요일
  const gridStart = addDaysYmd(firstOfMonth, -firstWeekday);
  // 6주(42칸) 고정 — 레이아웃 안정
  const totalCells = 42;

  const cells: DayCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = addDaysYmd(gridStart, i);
    const { y, m, d } = parseYmd(date);
    cells.push({
      date,
      day: d,
      inMonth: y === year && m === month,
      isToday: date === today,
    });
  }

  const weeks: CalendarWeek[] = [];
  for (let w = 0; w < 6; w++) {
    const weekCells = cells.slice(w * 7, w * 7 + 7);
    const weekStart = weekCells[0].date;
    const weekEnd = weekCells[6].date;

    // 이 주와 겹치는 멀티데이(그리고 하루짜리도 바로) 이벤트 추출
    // 하루짜리는 점(dot)으로 따로 그릴 거라 여기선 2일 이상만 바로. (원하면 1일도 바로 가능)
    const overlapping = events.filter(
      (e) => e.startDate <= weekEnd && e.endDate >= weekStart && diffDays(e.startDate, e.endDate) >= 1
    );
    // 정렬: 시작일 → 긴 기간 우선 (슬롯 배치 안정)
    overlapping.sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return diffDays(b.startDate, b.endDate) - diffDays(a.startDate, a.endDate);
    });

    // 슬롯 배치 — 각 슬롯이 [colStart, colEnd] 구간을 점유. 겹치면 다음 슬롯.
    const slots: Array<Array<[number, number]>> = []; // slots[slotIdx] = 점유 구간 목록
    const bars: WeekBar[] = [];

    for (const e of overlapping) {
      const visStart = e.startDate < weekStart ? weekStart : e.startDate;
      const visEnd = e.endDate > weekEnd ? weekEnd : e.endDate;
      const colStart = diffDays(weekStart, visStart); // 0~6
      const colEnd = diffDays(weekStart, visEnd);     // 0~6
      const span = colEnd - colStart + 1;

      // 빈 슬롯 찾기
      let slotIdx = 0;
      while (true) {
        const occupied = slots[slotIdx] || [];
        const clash = occupied.some(([s, en]) => !(colEnd < s || colStart > en));
        if (!clash) {
          if (!slots[slotIdx]) slots[slotIdx] = [];
          slots[slotIdx].push([colStart, colEnd]);
          break;
        }
        slotIdx++;
      }

      bars.push({
        event: e,
        slot: slotIdx,
        colStart,
        span,
        continuesLeft: e.startDate < weekStart,
        continuesRight: e.endDate > weekEnd,
      });
    }

    weeks.push({ cells: weekCells, bars });
  }

  return weeks;
}

// 특정 날짜의 하루짜리 이벤트 (점 표시용)
export function singleDayEventsOn(date: string, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((e) => e.startDate === e.endDate && e.startDate === date);
}

// 특정 날짜에 걸치는 모든 이벤트 (바텀시트용 — 멀티데이 포함)
export function eventsOnDate(date: string, events: CalendarEvent[]): CalendarEvent[] {
  return events
    .filter((e) => e.startDate <= date && e.endDate >= date)
    .sort((a, b) => {
      // 멀티데이 먼저, 그다음 시간순
      const aMulti = a.startDate !== a.endDate ? 0 : 1;
      const bMulti = b.startDate !== b.endDate ? 0 : 1;
      if (aMulti !== bMulti) return aMulti - bMulti;
      return (a.startTime || '99').localeCompare(b.startTime || '99');
    });
}
