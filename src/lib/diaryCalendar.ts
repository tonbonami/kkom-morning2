/**
 * 달력 합치기 — 일정(calendarEvents)을 다이어리 월간 달력에 그릴 모양으로 바꾸는 계산. 순수 함수뿐(저장 없음).
 * 설계: docs/gpt-diary-merge-answer.md (우댕 2026-11-17 「합치는 쪽으로」「추천대로 해봐」).
 *
 * ⚠️ 일정의 원본은 calendarEvents 하나(src/lib/calendar.ts) — 아침 알림·꼼톡 카드가 거기에 물려 있다. 여기서 사본을 만들지 않는다.
 * ⚠️ 띠는 두 종류: 일정 띠(진짜 일정) / 장식 띠(diaryMonths.spans). 지우개는 장식 띠만 지운다.
 */
import type { CalendarEvent, EventOwner } from './calendar';
import { addDaysYmd, diffDays } from './calendarLayout';
import type {
  DiaryEventDraft, DiaryEventVM, MonthBandSegVM, MonthCellEventsVM, MonthOwner, MonthSpanVM, MonthSpecialVM, SpecialDateVM, UpcomingItemVM,
} from './diaryTypes';

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const dateLabelOf = (d: string) => { const t = new Date(d + 'T00:00:00'); return `${t.getMonth() + 1}월 ${t.getDate()}일 (${WD[t.getDay()]})`; };
const whenOf = (days: number) => (days <= 0 ? '오늘' : days === 1 ? '내일' : `${days}일 뒤`);

export const ownerKeyOf = (o: MonthOwner): EventOwner => (o === 'together' ? 'together' : o === '우댕' ? 'udaeng' : 'kkomi');

/** 달력 주인에 따라 보일 일정 — 「같이」 = 전부, 각자 = 자기 것 + 함께(상대의 개인 일정은 「같이」에서만). 숨기는 기능이 아니라 보기 거르기다. */
export function eventsForOwner(events: CalendarEvent[], owner: MonthOwner): CalendarEvent[] {
  if (owner === 'together') return events;
  const key = ownerKeyOf(owner);
  return events.filter((e) => e.owner === key || e.owner === 'together');
}

/** 월 격자(6주 42칸, 일요일 시작)의 첫 날. */
export const monthGridStart = (ym: string): string => { const first = `${ym}-01`; return addDaysYmd(first, -new Date(first + 'T00:00:00').getDay()); };

/** 그 날짜의 기념일을 달력 칸 모양으로(「3주년」의 3 포함). */
export function specialsOn(date: string, specials: SpecialDateVM[]): MonthSpecialVM[] {
  const md = date.slice(5), year = Number(date.slice(0, 4));
  return specials.filter((s) => s.monthDay === md && (!s.startYear || year >= s.startYear)).map((s) => ({
    id: s.id, label: s.label, kind: s.kind, sticker: s.sticker,
    years: s.startYear && year > s.startYear ? year - s.startYear : undefined,
  }));
}

/**
 * 한 달의 띠 조각과 칸별 일정 요약.
 *   · 여러 날 일정 = 일정 띠: 주마다 **윗줄 한 줄**만. 겹쳐서 못 그린 것은 그 날짜들의 「+N」으로.
 *   · 장식 띠: 빈 데로(윗줄 → 아랫줄). 두 줄이 다 차 있으면 안 그린다(꾸미기라 「+N」에 안 센다).
 *   · 하루짜리 일정 = 칸의 주인 색 점(최대 2) + 나머지는 「+N」.
 *   · 제목은 띠의 첫 조각에만(첫 조각이 한 칸뿐이고 다음 주로 이어지면 다음 조각에).
 */
export function buildMonthBands(ym: string, events: CalendarEvent[], spans: MonthSpanVM[]): { bands: MonthBandSegVM[]; cellEvents: Record<string, MonthCellEventsVM> } {
  const gridStart = monthGridStart(ym), gridEnd = addDaysYmd(gridStart, 41);
  type Raw = { id: string; kind: 'event' | 'decor'; start: string; end: string; label: string; owner?: EventOwner; decorId?: string };
  const inGrid = (start: string, end: string) => end >= gridStart && start <= gridEnd;
  const multi: Raw[] = events
    .filter((e) => e.startDate !== e.endDate && inGrid(e.startDate, e.endDate))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || b.endDate.localeCompare(a.endDate))
    .map((e) => ({ id: e.id, kind: 'event' as const, start: e.startDate, end: e.endDate, label: e.title, owner: e.owner, decorId: e.decorId }));
  const decor: Raw[] = spans
    .filter((s) => s.startDate <= s.endDate && inGrid(s.startDate, s.endDate))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((s) => ({ id: s.id, kind: 'decor' as const, start: s.startDate, end: s.endDate, label: s.label, decorId: s.decorId }));

  const bands: MonthBandSegVM[] = [];
  const hidden: Record<string, number> = {};
  for (let w = 0; w < 6; w++) {
    const ws = addDaysYmd(gridStart, w * 7), we = addDaysYmd(ws, 6);
    const used = [Array<boolean>(7).fill(false), Array<boolean>(7).fill(false)];
    const place = (r: Raw, rows: (0 | 1)[]) => {
      if (r.end < ws || r.start > we) return;
      const col = Math.max(0, diffDays(ws, r.start)), endCol = Math.min(6, diffDays(ws, r.end));
      for (const row of rows) {
        let free = true;
        for (let c = col; c <= endCol; c++) if (used[row][c]) { free = false; break; }
        if (!free) continue;
        for (let c = col; c <= endCol; c++) used[row][c] = true;
        bands.push({
          key: `${r.kind}-${r.id}-${w}`, id: r.id, kind: r.kind, week: w, col, span: endCol - col + 1, row,
          label: r.label, showLabel: false, continuesLeft: r.start < ws, continuesRight: r.end > we,
          ...(r.owner ? { owner: r.owner } : {}), ...(r.decorId ? { decorId: r.decorId } : {}),
        });
        return;
      }
      if (r.kind === 'event') for (let c = col; c <= endCol; c++) { const d = addDaysYmd(ws, c); hidden[d] = (hidden[d] ?? 0) + 1; }
    };
    for (const r of multi) place(r, [0]);
    for (const r of decor) place(r, [0, 1]);
  }
  // 제목 자리
  const byBand = new Map<string, MonthBandSegVM[]>();
  for (const b of bands) { const k = `${b.kind}-${b.id}`; byBand.set(k, [...(byBand.get(k) ?? []), b]); }
  for (const segs of byBand.values()) {
    segs.sort((a, b) => a.week - b.week);
    (segs[0].span === 1 && segs[1] && segs[1].span >= 2 ? segs[1] : segs[0]).showLabel = true;
  }

  const singles: Record<string, CalendarEvent[]> = {};
  for (const e of events) if (e.startDate === e.endDate && inGrid(e.startDate, e.endDate)) (singles[e.startDate] ??= []).push(e);
  const cellEvents: Record<string, MonthCellEventsVM> = {};
  for (let i = 0; i < 42; i++) {
    const d = addDaysYmd(gridStart, i);
    const list = (singles[d] ?? []).sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'));
    const more = Math.max(0, list.length - 2) + (hidden[d] ?? 0);
    if (list.length || more) cellEvents[d] = { owners: list.slice(0, 2).map((e) => e.owner), more };
  }
  return { bands, cellEvents };
}

export const toEventVM = (e: CalendarEvent): DiaryEventVM => ({
  id: e.id, title: e.title, owner: e.owner, startDate: e.startDate, endDate: e.endDate, allDay: e.allDay,
  startTime: e.startTime, location: e.location, memo: e.memo, remindDaysBefore: e.remindDaysBefore, decorId: e.decorId,
});

/** 새 일정의 처음 값 — 누른 날짜 · 보고 있는 달력의 주인(「같이」면 함께) · 하루 종일 · 알림 없음(원치 않는 푸시가 늘지 않게). */
export const blankEventDraft = (date: string, owner: MonthOwner, endDate = date): DiaryEventDraft => ({
  title: '', owner: ownerKeyOf(owner), startDate: date, endDate, allDay: true, startTime: '', location: '', memo: '', remindDaysBefore: [], decorId: null,
});
export const draftOfEvent = (e: CalendarEvent): DiaryEventDraft => ({
  title: e.title, owner: e.owner, startDate: e.startDate, endDate: e.endDate, allDay: e.allDay, startTime: e.startTime ?? '',
  location: e.location ?? '', memo: e.memo ?? '', remindDaysBefore: e.remindDaysBefore, decorId: e.decorId ?? null,
});
/** 저장 전 손질 — 제목이 비었거나 날짜가 이상하면 null. 끝이 시작보다 앞서면 끝을 시작에 맞춘다. */
export function normalizeEventDraft(d: DiaryEventDraft): DiaryEventDraft | null {
  const ok = (s: string) => /^\d{4}-\d\d-\d\d$/.test(s);
  const title = d.title.trim();
  if (!title || !ok(d.startDate)) return null;
  const endDate = ok(d.endDate) && d.endDate >= d.startDate ? d.endDate : d.startDate;
  const startTime = !d.allDay && /^\d\d:\d\d$/.test(d.startTime) ? d.startTime : '';
  return {
    ...d, title, endDate, startTime, allDay: d.allDay || !startTime,
    location: d.location.trim(), memo: d.memo.trim(),
    remindDaysBefore: [...new Set(d.remindDaysBefore.filter((n) => n === 1 || n === 7))].sort((a, b) => a - b),
  };
}

/** 다가오는 것 — 진행 중인 일정 + 보름 안 일정 + 이레 안 기념일. 가까운 순, 최대 10줄. */
export function buildUpcoming(today: string, events: CalendarEvent[], specials: SpecialDateVM[]): UpcomingItemVM[] {
  const out: (UpcomingItemVM & { ongoing: boolean })[] = [];
  for (const e of events) {
    if (e.endDate < today) continue;
    const days = diffDays(today, e.startDate);
    if (days > 15) continue;
    const ongoing = e.startDate < today;
    out.push({
      id: e.id, kind: 'event', title: e.title, owner: e.owner, ongoing,
      whenLabel: ongoing ? '진행 중' : whenOf(days),
      dateLabel: e.startDate === e.endDate ? dateLabelOf(e.startDate) : `${dateLabelOf(e.startDate)} ~ ${dateLabelOf(e.endDate)}`,
      ...(!e.allDay && e.startTime ? { timeLabel: e.startTime } : {}),
      date: ongoing ? today : e.startDate,
    });
  }
  for (let n = 0; n <= 7; n++) {
    const d = addDaysYmd(today, n);
    for (const s of specialsOn(d, specials)) {
      out.push({ id: s.id, kind: 'special', title: s.years ? `${s.label} ${s.years}주년` : s.label, whenLabel: whenOf(n), dateLabel: dateLabelOf(d), date: d, ongoing: false });
    }
  }
  out.sort((a, b) => Number(b.ongoing) - Number(a.ongoing) || a.date.localeCompare(b.date) || (a.timeLabel ?? '').localeCompare(b.timeLabel ?? ''));
  return out.slice(0, 10).map(({ ongoing: _ongoing, ...item }) => item);
}
