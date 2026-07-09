// 커플 공유 캘린더 — Firestore 'calendarEvents' 컬렉션.
// 우댕/꼼이가 같이 보는 일정. 종류로 색 구분: 꼼이(로즈) / 우댕(블루) / 함께(보라).
// 멀티데이 일정(여행 등)은 startDate~endDate로 저장, 캘린더에서 선형 바로 렌더.
// 알림: remindDaysBefore(예: [1,7]) — cron이 매일 아침 08:00 KST에 해당 일정 push.

import { db } from './firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  serverTimestamp, Timestamp, type DocumentData,
} from 'firebase/firestore';
import { partnerOf } from './letters';

export type EventOwner = 'kkomi' | 'udaeng' | 'together';

export interface CalendarEventDoc {
  title: string;
  owner: EventOwner;
  startDate: string;    // 'YYYY-MM-DD' (KST 기준 날짜)
  endDate: string;      // 하루면 start===end
  allDay: boolean;
  startTime?: string;   // 'HH:mm' (allDay=false일 때)
  memo?: string;
  location?: string;
  remindDaysBefore?: number[]; // [1] / [1,7] / [] (알림 없음)
  createdBy: '우댕' | '꼼이';
  createdAt?: Timestamp | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  owner: EventOwner;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string;
  memo?: string;
  location?: string;
  remindDaysBefore: number[];
  createdBy: '우댕' | '꼼이';
  createdAt: Date | null;
}

// 종류별 표시 메타 (색/라벨/도형) — 접근성 위해 색 외에 도형/패턴도 병행
// hl = 형광펜 톤(mix-blend-multiply용 반투명). barBg는 레거시(안 씀).
export const OWNER_META: Record<EventOwner, { label: string; barBg: string; hl: string; barText: string; dot: string; chip: string; solid: string }> = {
  kkomi:    { label: '꼼이', barBg: 'bg-rose-100 border border-rose-300',       hl: 'bg-rose-300/60',   barText: 'text-rose-800',   dot: 'bg-rose-400',   chip: 'bg-rose-50 text-rose-600 border-rose-200',    solid: 'bg-rose-400' },
  udaeng:   { label: '우댕', barBg: 'bg-blue-100 border border-blue-300',       hl: 'bg-blue-300/55',   barText: 'text-blue-800',   dot: 'bg-blue-400',   chip: 'bg-blue-50 text-blue-600 border-blue-200',    solid: 'bg-blue-400' },
  together: { label: '함께', barBg: 'bg-purple-200 border-2 border-purple-400', hl: 'bg-purple-300/60', barText: 'text-purple-900', dot: 'bg-purple-500', chip: 'bg-purple-100 text-purple-700 border-purple-300', solid: 'bg-purple-500' },
};

function toEvent(id: string, d: CalendarEventDoc): CalendarEvent {
  return {
    id,
    title: d.title || '',
    owner: d.owner || 'together',
    startDate: d.startDate,
    endDate: d.endDate || d.startDate,
    allDay: d.allDay !== false,
    startTime: d.startTime,
    memo: d.memo,
    location: d.location,
    remindDaysBefore: Array.isArray(d.remindDaysBefore) ? d.remindDaysBefore : [],
    createdBy: d.createdBy,
    createdAt: d.createdAt?.toDate?.() ?? null,
  };
}

export function subscribeCalendar(cb: (events: CalendarEvent[]) => void): () => void {
  return onSnapshot(
    collection(db, 'calendarEvents'),
    (snap) => {
      const events = snap.docs.map((d) => toEvent(d.id, d.data() as CalendarEventDoc));
      events.sort((a, b) => a.startDate.localeCompare(b.startDate));
      cb(events);
    },
    (err) => { console.error('calendar 구독 오류:', err); cb([]); }
  );
}

export async function addCalendarEvent(input: {
  title: string;
  owner: EventOwner;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string;
  memo?: string;
  location?: string;
  remindDaysBefore?: number[];
  createdBy: '우댕' | '꼼이';
}): Promise<string> {
  const payload: DocumentData = {
    title: input.title.trim(),
    owner: input.owner,
    startDate: input.startDate,
    endDate: input.endDate || input.startDate,
    allDay: input.allDay,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  };
  if (!input.allDay && input.startTime) payload.startTime = input.startTime;
  if (input.memo?.trim()) payload.memo = input.memo.trim();
  if (input.location?.trim()) payload.location = input.location.trim();
  if (input.remindDaysBefore && input.remindDaysBefore.length > 0) payload.remindDaysBefore = input.remindDaysBefore;

  const ref = await addDoc(collection(db, 'calendarEvents'), payload);

  // 상대에게 '일정 추가됨' 알림 (즉시 push)
  const to = partnerOf(input.createdBy) as '우댕' | '꼼이';
  fetch('/api/notify-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'new', from: input.createdBy, to, title: input.title.trim(), owner: input.owner }),
  }).catch(() => {});

  return ref.id;
}

export async function updateCalendarEvent(id: string, patch: Partial<CalendarEventDoc>): Promise<void> {
  const clean: DocumentData = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) clean[k] = v;
  }
  if (Object.keys(clean).length === 0) return;
  await updateDoc(doc(db, 'calendarEvents', id), clean);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, 'calendarEvents', id));
}
