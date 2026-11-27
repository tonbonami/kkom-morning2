'use client';

// 커플 공유 캘린더 — 월뷰 일정 제목 띠 + 날짜 탭 바텀시트 + 추가/편집 모달.
// 색: 꼼이(로즈) / 우댕(블루) / 함께(보라). 알림: 1일·1주일 전 아침 8시(cron).
// Gemini UX: 월뷰에선 개별 일정 탭 X → 날짜 칸 탭하면 그날 일정 바텀시트.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, X, Trash2, Bell, MapPin, Loader2 } from 'lucide-react';
import {
  subscribeCalendar, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  OWNER_META, type CalendarEvent, type EventOwner,
} from '@/lib/calendar';
import {
  buildMonthGrid, todayYmd, eventsOnDate, parseYmd, upcomingEvents, shortDateLabel,
  type CalendarWeek, type UpcomingEvent,
} from '@/lib/calendarLayout';
import { nameFromCode } from '@/lib/letters';
import { feedback } from '@/lib/feedback';
import { holidayName } from '@/lib/holidays';
import { EventTitleBand } from '@/components/calendar/EventTitleBand';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_DAY_BANDS = 2;

function CalendarWeekRow({ week, events, weekIndex, onSelectDate }: {
  week: CalendarWeek;
  events: CalendarEvent[];
  weekIndex: number;
  onSelectDate: (date: string) => void;
}) {
  const visibleBars = week.bars.filter((bar) => bar.slot < MAX_DAY_BANDS);
  const singleBands: Array<{ event: CalendarEvent; column: number; slot: number }> = [];
  const moreByColumn = Array(7).fill(0) as number[];

  week.cells.forEach((cell, column) => {
    const occupiedSlots = new Set(
      visibleBars
        .filter((bar) => column >= bar.colStart && column < bar.colStart + bar.span)
        .map((bar) => bar.slot),
    );
    const hiddenMultiDayCount = week.bars.filter(
      (bar) => bar.slot >= MAX_DAY_BANDS
        && column >= bar.colStart
        && column < bar.colStart + bar.span,
    ).length;
    const availableSlots = Array.from({ length: MAX_DAY_BANDS }, (_, slot) => slot)
      .filter((slot) => !occupiedSlots.has(slot));
    // 기존 칩과 같은 시간순을 지킨다(멀티데이만 위의 이어진 띠가 맡는다).
    const singleDayEvents = eventsOnDate(cell.date, events)
      .filter((event) => event.startDate === event.endDate);

    singleDayEvents.slice(0, availableSlots.length).forEach((event, index) => {
      singleBands.push({ event, column, slot: availableSlots[index] });
    });
    moreByColumn[column] = hiddenMultiDayCount
      + Math.max(0, singleDayEvents.length - availableSlots.length);
  });

  return (
    <div
      className={`relative grid grid-cols-7 ${weekIndex > 0 ? 'border-t border-dashed border-slate-200/70' : ''}`}
      style={{ minHeight: 82 }}
    >
      {/* 날짜 칸은 그대로 탭하고, 일정은 위에 겹쳐 그려도 손짓을 가로채지 않는다. */}
      {week.cells.map((cell, column) => {
        const hol = holidayName(cell.date);
        const isSun = column === 0;
        return (
          <button
            key={cell.date}
            onClick={() => onSelectDate(cell.date)}
            className={`relative min-w-0 overflow-hidden flex flex-col items-center pt-1.5 ${column > 0 ? 'border-l border-dashed border-slate-200/70' : ''} active:bg-purple-50/50 transition-colors ${!cell.inMonth ? 'opacity-40' : ''}`}
          >
            <span className={`text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full z-10 ${
              cell.isToday ? 'bg-emerald-500 text-white shadow-sm' : !cell.inMonth ? 'text-slate-300' : (hol || isSun) ? 'text-rose-500' : 'text-slate-700'
            }`}>{cell.day}</span>
            {/* 공휴일 이름 (한국 공휴일 자동 표시) */}
            {hol && cell.inMonth && (
              <span className="max-w-full px-0.5 -mt-0.5 text-[8px] font-black text-rose-500 leading-none truncate z-10">{hol}</span>
            )}
            {moreByColumn[column] > 0 && (
              <span className="absolute inset-x-0 top-[68px] pr-1 text-right text-[8px] leading-[9px] font-black text-slate-400 z-20">
                +{moreByColumn[column]}
              </span>
            )}
          </button>
        );
      })}

      {/* 왜 한 레이어에서 그리나: 여러 날짜 칸 안에 각각 넣으면 띠가 칸 경계마다 끊겨 보인다. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[38px] h-[29px] grid grid-cols-7 grid-rows-2 gap-y-px z-10"
        aria-hidden="true"
      >
        {visibleBars.map((bar) => (
          <EventTitleBand
            key={bar.event.id}
            owner={bar.event.owner}
            title={bar.event.title}
            roundLeft={!bar.continuesLeft}
            roundRight={!bar.continuesRight}
            className="h-[14px] px-0.5"
            textClassName="text-[10px] font-bold"
            style={{
              gridColumn: `${bar.colStart + 1} / span ${bar.span}`,
              gridRow: bar.slot + 1,
              borderLeftWidth: bar.continuesLeft ? 0 : 3,
            }}
          />
        ))}
        {singleBands.map(({ event, column, slot }) => (
          <EventTitleBand
            key={event.id}
            owner={event.owner}
            title={event.title}
            className="mx-0.5 h-[14px] pl-0.5 pr-px"
            textClassName="text-[10px] font-bold"
            style={{ gridColumn: column + 1, gridRow: slot + 1 }}
          />
        ))}
      </div>
    </div>
  );
}

function fmtRange(e: CalendarEvent): string {
  const s = parseYmd(e.startDate);
  if (e.startDate === e.endDate) {
    return `${s.m}월 ${s.d}일${!e.allDay && e.startTime ? ` ${e.startTime}` : ''}`;
  }
  const en = parseYmd(e.endDate);
  return `${s.m}월 ${s.d}일 ~ ${en.m}월 ${en.d}일`;
}

export default function CalendarPage() {
  const router = useRouter();
  const [me, setMe] = useState<'우댕' | '꼼이' | ''>('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarReady, setCalendarReady] = useState(false);
  const deepLinkDone = useRef(false);

  const today = todayYmd();
  const t = parseYmd(today);
  const [year, setYear] = useState(t.y);
  const [month, setMonth] = useState(t.m);

  const [daySheet, setDaySheet] = useState<string | null>(null);   // 선택된 날짜 (바텀시트)
  const [editing, setEditing] = useState<CalendarEvent | null>(null); // 편집 대상
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드) as '우댕' | '꼼이');
    const unsub = subscribeCalendar((next) => { setEvents(next); setCalendarReady(true); });
    return () => unsub();
  }, [router]);

  // 알림·꼼톡 카드의 date/event를 구독 목록이 준비된 뒤 한 번만 연다.
  // event가 남아 있으면 일정의 실제 시작일이 이긴다. 지워졌으면 date, date도 없으면 오늘을 연다.
  useEffect(() => {
    if (!calendarReady || deepLinkDone.current) return;
    deepLinkDone.current = true;

    const q = new URLSearchParams(window.location.search);
    const rawDate = q.get('date');
    const rawEvent = q.get('event');
    const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
    const eventId = rawEvent && /^[A-Za-z0-9_-]{1,64}$/.test(rawEvent) ? rawEvent : null;
    if (!date && !eventId) return;

    const event = eventId ? events.find((item) => item.id === eventId) : null;
    const targetDate = event?.startDate || date || today;
    const target = parseYmd(targetDate);
    setYear(target.y);
    setMonth(target.m);
    setDaySheet(targetDate);
    // date·event 만 지운다(에뮬레이터 ?emu=1&as=… 같은 다른 쿼리는 남긴다).
    q.delete('date'); q.delete('event');
    const rest = q.toString();
    router.replace(rest ? `/calendar?${rest}` : '/calendar', { scroll: false });
  }, [calendarReady, events, router, today]);

  const weeks = useMemo(() => buildMonthGrid(year, month, events), [year, month, events]);
  const upcoming = useMemo(() => upcomingEvents(events, 15), [events]);

  const prevMonth = () => { const m = month - 1; if (m < 1) { setYear(year - 1); setMonth(12); } else setMonth(m); };
  const nextMonth = () => { const m = month + 1; if (m > 12) { setYear(year + 1); setMonth(1); } else setMonth(m); };

  const openAdd = (presetDate?: string) => {
    setEditing(null);
    setFormDate(presetDate || today);
    setShowForm(true);
  };
  const openEdit = (e: CalendarEvent) => {
    setEditing(e);
    setShowForm(true);
  };

  // 폼 초기 날짜 (추가 시 프리셋용)
  const [formDate, setFormDate] = useState(today);

  if (!me) return <div className="min-h-app bg-[#FFFCF5] max-w-md mx-auto" />;

  return (
    <div className="min-h-app bg-[#FFFCF5] text-slate-800">
      <main className="max-w-md mx-auto px-4 pt-6 pb-28">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-4 px-1">
          <button
            onClick={() => router.push('/')}
            className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-white/70 flex items-center justify-center text-slate-500 active:scale-95"
            aria-label="홈으로"
          ><ArrowLeft size={18} /></button>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 text-slate-400 active:scale-90" aria-label="이전 달"><ChevronLeft size={20} /></button>
              <h1 className="font-handwriting text-[30px] leading-none text-slate-800 min-w-[104px] text-center">
                {year}년 {month}월
              </h1>
              <button onClick={nextMonth} className="p-1.5 text-slate-400 active:scale-90" aria-label="다음 달"><ChevronRight size={20} /></button>
            </div>
            {/* 범례 — 유리 캡슐 (월 밑) */}
            <div className="flex items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white/80 rounded-full px-3 py-1 shadow-sm text-[10px] font-black">
              <span className="flex items-center gap-1 text-rose-500"><span className="w-2 h-2 bg-rose-400 rotate-45 rounded-[1px]" /> 꼼이</span>
              <span className="flex items-center gap-1 text-blue-500"><span className="w-2 h-2 bg-blue-400 rounded-full" /> 우댕</span>
              <span className="flex items-center gap-1 text-purple-600"><span className="w-2 h-2 bg-purple-500 rounded-full ring-1 ring-purple-600" /> 함께</span>
            </div>
          </div>
          <button
            onClick={() => openAdd()}
            className="h-10 w-10 rounded-2xl bg-purple-500 text-white shadow-[2px_3px_0px_rgba(168,85,247,0.3)] flex items-center justify-center active:scale-95"
            aria-label="일정 추가"
          ><Plus size={20} /></button>
        </header>

        {/* 다가오는 일정 요약 — 슬림 2줄 (D-15 이내만) */}
        {upcoming.length > 0 && (
          <div className="mb-3">
            <h2 className="text-[13px] font-black text-slate-500 mb-1.5 px-1">다가오는 일정</h2>
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 px-1">
              {upcoming.map((u) => <UpcomingCard key={u.event.id} u={u} onTap={() => setDaySheet(u.ongoing ? today : u.event.startDate)} />)}
            </div>
          </div>
        )}

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 text-center mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`text-[11px] font-black ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{d}</div>
          ))}
        </div>

        {/* 캘린더 그리드 — 흰 컨테이너 + 점선 모눈 (다이어리 속지 톤) */}
        <div className="rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-1.5">
          {weeks.map((week, wi) => (
            <CalendarWeekRow
              key={week.cells[0].date}
              week={week}
              events={events}
              weekIndex={wi}
              onSelectDate={setDaySheet}
            />
          ))}
        </div>

        <p className="text-center text-[11px] font-bold text-slate-400 mt-3">날짜를 탭하면 그날 일정이 보여요</p>
      </main>

      {/* 날짜별 일정 바텀시트 */}
      <AnimatePresence>
        {daySheet && (
          <DaySheet
            date={daySheet}
            events={eventsOnDate(daySheet, events)}
            me={me}
            onClose={() => setDaySheet(null)}
            onAdd={() => { const d = daySheet; setDaySheet(null); openAdd(d); }}
            onEdit={(e) => { setDaySheet(null); openEdit(e); }}
          />
        )}
      </AnimatePresence>

      {/* 추가/편집 폼 */}
      <AnimatePresence>
        {showForm && (
          <EventForm
            me={me}
            initial={editing}
            presetDate={formDate}
            onClose={() => setShowForm(false)}
            onSaved={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 다가오는 일정 요약 카드 (슬림 2줄) ──
function UpcomingCard({ u, onTap }: { u: UpcomingEvent; onTap: () => void }) {
  const meta = OWNER_META[u.event.owner];
  const badge = u.ongoing ? '진행중' : u.dday === 0 ? 'D-DAY' : `D-${u.dday}`;
  const bg = u.event.owner === 'kkomi' ? 'bg-rose-50 border-rose-100' : u.event.owner === 'udaeng' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100';
  return (
    <button onClick={onTap} className={`shrink-0 text-left rounded-xl px-3 py-2 border ${bg} active:scale-[0.97] transition`}>
      {/* 1줄: D-day 배지 + 날짜 */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`${meta.solid} text-white font-black text-[9px] px-1.5 py-[1px] rounded-full leading-none`}>{badge}</span>
        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
          {shortDateLabel(u.event.startDate)}{u.event.startDate !== u.event.endDate ? `~${shortDateLabel(u.event.endDate)}` : ''}
        </span>
      </div>
      {/* 2줄: 제목 */}
      <p className="text-[13px] font-black text-slate-700 truncate max-w-[150px]">{u.event.title}</p>
    </button>
  );
}

// ── 날짜별 바텀시트 (시간순 타임라인) ──
function DaySheet({ date, events, me, onClose, onAdd, onEdit }: {
  date: string; events: CalendarEvent[]; me: '우댕' | '꼼이';
  onClose: () => void; onAdd: () => void; onEdit: (e: CalendarEvent) => void;
}) {
  const p = parseYmd(date);
  const hol = holidayName(date);
  // 종일/멀티데이(위 고정) vs 시간 있는 일정(타임라인)
  const allDayish = events.filter((e) => e.allDay || e.startDate !== e.endDate || !e.startTime);
  const timed = events.filter((e) => !e.allDay && e.startDate === e.endDate && e.startTime);
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 max-w-md mx-auto" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md bg-[#FFFCF5] rounded-t-[28px] p-6 pb-safe-bottom max-h-[80dvh] overflow-y-auto">
        <div className="tape absolute -top-2 left-1/2 -translate-x-1/2 w-14 -rotate-2 z-10" />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2 min-w-0">
            <h2 className="font-handwriting text-[26px] text-slate-800">{p.m}월 {p.d}일</h2>
            {hol && <span className="text-[13px] font-black text-rose-500 truncate">{hol}</span>}
          </div>
          <button onClick={onAdd} className="shrink-0 inline-flex items-center gap-1 bg-purple-500 text-white text-[12px] font-black px-3 py-2 rounded-full active:scale-95"><Plus size={14} /> 추가</button>
        </div>
        {events.length === 0 ? (
          <p className="text-center text-sm font-bold text-slate-400 py-8">이 날은 아직 비어있어요</p>
        ) : (
          <div className="space-y-4">
            {/* 종일/여행 — 위 고정 */}
            {allDayish.length > 0 && (
              <div className="space-y-2">
                {allDayish.map((e) => <EventRow key={e.id} e={e} onEdit={onEdit} />)}
              </div>
            )}
            {/* 시간순 타임라인 */}
            {timed.length > 0 && (
              <div className="relative pl-14">
                {/* 세로 타임라인 선 */}
                <div className="absolute left-[42px] top-1 bottom-1 w-px bg-slate-200" />
                <div className="space-y-2.5">
                  {timed.map((e) => (
                    <div key={e.id} className="relative">
                      <span className="absolute -left-14 top-2 text-[12px] font-black text-slate-500 tabular-nums w-10 text-right">{e.startTime}</span>
                      <span className={`absolute -left-[26px] top-2.5 w-2.5 h-2.5 rounded-full ${OWNER_META[e.owner].solid} ring-2 ring-[#FFFCF5]`} />
                      <EventRow e={e} onEdit={onEdit} compact />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}

function EventRow({ e, onEdit, compact }: { e: CalendarEvent; onEdit: (e: CalendarEvent) => void; compact?: boolean }) {
  const meta = OWNER_META[e.owner];
  return (
    <button onClick={() => onEdit(e)} className={`w-full text-left rounded-2xl px-4 py-3 border ${meta.chip} active:scale-[0.99] transition`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-black truncate">{e.title}</span>
        <span className="text-[10px] font-black shrink-0">{meta.label}</span>
      </div>
      {!compact && <p className="text-[12px] font-bold opacity-80 mt-0.5">{fmtRange(e)}</p>}
      {e.location && <p className="text-[11px] font-medium opacity-70 mt-0.5 flex items-center gap-1"><MapPin size={11} /> {e.location}</p>}
      {e.memo && <p className="text-[12px] font-medium opacity-70 mt-1 whitespace-pre-wrap">{e.memo}</p>}
      {e.remindDaysBefore.length > 0 && (
        <p className="text-[10px] font-bold opacity-70 mt-1 flex items-center gap-1"><Bell size={10} /> {e.remindDaysBefore.map((d) => d === 1 ? '1일 전' : `${d}일 전`).join(', ')} 알림</p>
      )}
    </button>
  );
}

// ── 추가/편집 폼 ──
function EventForm({ me, initial, presetDate, onClose, onSaved }: {
  me: '우댕' | '꼼이'; initial: CalendarEvent | null; presetDate: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [owner, setOwner] = useState<EventOwner>(initial?.owner ?? (me === '우댕' ? 'udaeng' : 'kkomi'));
  const [startDate, setStartDate] = useState(initial?.startDate ?? presetDate);
  const [endDate, setEndDate] = useState(initial?.endDate ?? presetDate);
  const [allDay, setAllDay] = useState(initial?.allDay ?? true);
  const [startTime, setStartTime] = useState(initial?.startTime ?? '');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [reminds, setReminds] = useState<number[]>(initial?.remindDaysBefore ?? []);
  const [saving, setSaving] = useState(false);

  const toggleRemind = (d: number) => setReminds((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b));

  const save = async () => {
    if (!title.trim()) { feedback('일정 이름을 적어줘', 'error'); return; }
    // endDate가 startDate보다 빠르면 보정
    const fixedEnd = endDate < startDate ? startDate : endDate;
    setSaving(true);
    try {
      if (initial) {
        await updateCalendarEvent(initial.id, {
          title: title.trim(), owner, startDate, endDate: fixedEnd, allDay,
          // 비운 칸은 null = 지우기(undefined 면 예전 값이 남는다)
          startTime: !allDay && startTime ? startTime : null,
          memo: memo.trim() || null, location: location.trim() || null,
          remindDaysBefore: reminds,
        });
        feedback('✏️ 일정 고쳤어');
      } else {
        await addCalendarEvent({
          title, owner, startDate, endDate: fixedEnd, allDay,
          startTime: !allDay ? startTime : undefined,
          memo, location, remindDaysBefore: reminds, createdBy: me,
        });
        feedback('📌 일정 붙였어');
      }
      onSaved();
    } catch (e) {
      console.error(e);
      feedback('저장 실패. 다시 해보자', 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!initial) return;
    if (!confirm('이 일정을 지울까?')) return;
    try { await deleteCalendarEvent(initial.id); feedback('🗑️ 일정 지웠어'); onSaved(); }
    catch { feedback('삭제 실패', 'error'); }
  };

  const OWNERS: { id: EventOwner; label: string; on: string; off: string }[] = [
    { id: 'kkomi', label: '꼼이', on: 'bg-rose-100 border-rose-300 text-rose-600', off: 'bg-white border-slate-200 text-slate-400' },
    { id: 'udaeng', label: '우댕', on: 'bg-blue-100 border-blue-300 text-blue-600', off: 'bg-white border-slate-200 text-slate-400' },
    { id: 'together', label: '함께', on: 'bg-purple-100 border-purple-300 text-purple-700', off: 'bg-white border-slate-200 text-slate-400' },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => !saving && onClose()} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 max-w-md mx-auto" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md bg-[#FFFCF5] rounded-t-[32px] p-6 pb-safe-bottom max-h-[92dvh] overflow-y-auto">
        <div className="tape absolute -top-3 left-1/2 -translate-x-1/2 w-16 -rotate-2 z-10" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-handwriting text-[28px] text-slate-800">{initial ? '일정 고치기' : '새 일정'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center active:scale-95"><X size={17} /></button>
        </div>

        {/* 종류 칩 */}
        <div className="flex justify-center gap-2.5 mb-4">
          {OWNERS.map((o) => (
            <button key={o.id} onClick={() => setOwner(o.id)}
              className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${owner === o.id ? o.on + ' shadow-[2px_3px_0px_rgba(0,0,0,0.06)]' : o.off}`}>
              {o.label}
            </button>
          ))}
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="어떤 일정인가요?"
          className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl mb-3 text-[15px] font-bold shadow-sm focus:ring-2 focus:ring-purple-100 focus:outline-none" />

        {/* 날짜 범위 */}
        <div className="flex items-center gap-2 mb-3">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 bg-white border border-slate-200 p-3 rounded-2xl text-sm font-bold text-slate-600 shadow-sm" />
          <span className="font-black text-slate-300">~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 bg-white border border-slate-200 p-3 rounded-2xl text-sm font-bold text-slate-600 shadow-sm" />
        </div>

        {/* 하루종일 / 시간 */}
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setAllDay((v) => !v)}
            className={`px-3 py-2.5 rounded-2xl text-[13px] font-black border ${allDay ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400'}`}>
            하루 종일
          </button>
          {!allDay && (
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 bg-white border border-slate-200 p-2.5 rounded-2xl text-sm font-bold text-slate-600 shadow-sm" />
          )}
        </div>

        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="장소 (선택)"
          className="w-full bg-white border border-slate-200 p-3 rounded-2xl mb-3 text-[14px] font-medium shadow-sm focus:ring-2 focus:ring-purple-100 focus:outline-none" />

        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (선택)"
          className="w-full bg-white border border-slate-200 p-3 rounded-2xl mb-3 min-h-[70px] resize-none text-[14px] font-medium shadow-sm focus:ring-2 focus:ring-purple-100 focus:outline-none" />

        {/* 알림 */}
        <div className="mb-4">
          <p className="text-[13px] font-bold text-slate-500 mb-1.5 ml-1 flex items-center gap-1"><Bell size={13} /> 알림 (아침 8시)</p>
          <div className="flex gap-2">
            {[{ d: 1, label: '1일 전' }, { d: 7, label: '1주일 전' }].map((r) => (
              <button key={r.d} onClick={() => toggleRemind(r.d)}
                className={`flex-1 py-2.5 rounded-2xl text-[13px] font-black border transition-all ${reminds.includes(r.d) ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {initial && (
            <button onClick={del} className="w-14 h-14 rounded-2xl bg-white border border-rose-100 text-rose-400 flex items-center justify-center active:scale-95 shrink-0"><Trash2 size={18} /></button>
          )}
          <button onClick={save} disabled={saving}
            className="flex-1 h-14 rounded-2xl bg-purple-500 text-white font-black text-[15px] flex items-center justify-center gap-2 shadow-[2px_4px_0px_rgba(168,85,247,0.35)] active:translate-y-0.5 active:shadow-none disabled:opacity-50 transition-all">
            {saving ? <Loader2 size={18} className="animate-spin" /> : (initial ? '고치기' : '다이어리에 붙이기 📌')}
          </button>
        </div>
      </motion.div>
    </>
  );
}
