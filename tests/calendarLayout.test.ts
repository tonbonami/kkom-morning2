import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '../src/lib/calendar';
import { buildMonthGrid } from '../src/lib/calendarLayout';

function event(id: string, startDate: string, endDate: string): CalendarEvent {
  return {
    id,
    title: id,
    owner: 'together',
    startDate,
    endDate,
    allDay: true,
    remindDaysBefore: [],
    createdBy: '우댕',
    createdAt: null,
  };
}

describe('buildMonthGrid', () => {
  it('한 달을 일요일부터 7일씩 6주로 나눈다', () => {
    const weeks = buildMonthGrid(2026, 11, []);

    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.cells.length === 7)).toBe(true);
    expect(weeks[0].cells[0].date).toBe('2026-11-01');
    expect(weeks[5].cells[6].date).toBe('2026-12-12');
  });

  it('겹치는 여러 날 일정을 다른 레인에 놓고 다음 주 조각을 잇는다', () => {
    const weeks = buildMonthGrid(2026, 11, [
      event('long', '2026-11-02', '2026-11-05'),
      event('overlap', '2026-11-03', '2026-11-04'),
      event('cross-week', '2026-11-06', '2026-11-09'),
    ]);

    const firstWeek = weeks[0].bars;
    expect(firstWeek.find((bar) => bar.event.id === 'long')).toMatchObject({ slot: 0, colStart: 1, span: 4 });
    expect(firstWeek.find((bar) => bar.event.id === 'overlap')).toMatchObject({ slot: 1, colStart: 2, span: 2 });
    expect(firstWeek.find((bar) => bar.event.id === 'cross-week')).toMatchObject({
      slot: 0,
      colStart: 5,
      span: 2,
      continuesRight: true,
    });
    expect(weeks[1].bars.find((bar) => bar.event.id === 'cross-week')).toMatchObject({
      colStart: 0,
      span: 2,
      continuesLeft: true,
    });
  });
});
