// 커플 공유 캘린더 — Firestore 'calendarEvents' 컬렉션.
// 우댕/꼼이가 같이 보는 일정. 종류로 색 구분: 꼼이(로즈) / 우댕(블루) / 함께(보라).
// 멀티데이 일정(여행 등)은 startDate~endDate로 저장, 캘린더에서 선형 바로 렌더.
// 알림: remindDaysBefore(예: [1,7]) — cron이 매일 아침 08:00 KST에 해당 일정 push.

import { db, usingEmulator } from './firebase';
import {
  collection, addDoc, setDoc, updateDoc, deleteDoc, doc, onSnapshot,
  serverTimestamp, Timestamp, deleteField, type DocumentData,
} from 'firebase/firestore';
import { partnerOf } from './letters';
import { isDemo, settleDemoWrite } from './demo';

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
  decorId?: string;     // 다이어리 월간 달력에서 그릴 띠 무늬(선택) — 없으면 주인 색 기본 띠. 알림·꼼톡은 이 값을 몰라도 된다.
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
  decorId?: string;
  createdBy: '우댕' | '꼼이';
  createdAt: Date | null;
}

// 종류별 표시 메타 (색/라벨/도형) — 접근성 위해 색 외에 도형/패턴도 병행
// barFill = 멀티데이 선형 바 채움색(솔리드), barAccent = 바 시작쪽 왼쪽 액센트 보더.
export const OWNER_META: Record<EventOwner, { label: string; barFill: string; barAccent: string; barText: string; dot: string; chip: string; solid: string }> = {
  kkomi:    { label: '꼼이', barFill: 'bg-rose-100',   barAccent: 'border-rose-400',   barText: 'text-rose-700',   dot: 'bg-rose-400',   chip: 'bg-rose-50 text-rose-600 border-rose-200',    solid: 'bg-rose-400' },
  udaeng:   { label: '우댕', barFill: 'bg-blue-100',   barAccent: 'border-blue-400',   barText: 'text-blue-700',   dot: 'bg-blue-400',   chip: 'bg-blue-50 text-blue-600 border-blue-200',    solid: 'bg-blue-400' },
  together: { label: '함께', barFill: 'bg-purple-100', barAccent: 'border-purple-500', barText: 'text-purple-800', dot: 'bg-purple-500', chip: 'bg-purple-100 text-purple-700 border-purple-300', solid: 'bg-purple-500' },
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
    ...(typeof d.decorId === 'string' && d.decorId ? { decorId: d.decorId } : {}),
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
  decorId?: string | null;
  createdBy: '우댕' | '꼼이';
}): Promise<string> {
  const payload: DocumentData = {
    title: input.title.trim(),
    owner: input.owner,
    startDate: input.startDate,
    endDate: input.endDate || input.startDate,
    allDay: input.allDay,
    createdBy: input.createdBy,
    createdAt: isDemo() ? Timestamp.now() : serverTimestamp(),
  };
  if (!input.allDay && input.startTime) payload.startTime = input.startTime;
  if (input.memo?.trim()) payload.memo = input.memo.trim();
  if (input.location?.trim()) payload.location = input.location.trim();
  if (input.remindDaysBefore && input.remindDaysBefore.length > 0) payload.remindDaysBefore = input.remindDaysBefore;
  if (input.decorId) payload.decorId = input.decorId;

  const ref = isDemo() ? doc(collection(db, 'calendarEvents')) : null;
  const savedRef = ref
    ? (await settleDemoWrite(setDoc(ref, payload)), ref)
    : await addDoc(collection(db, 'calendarEvents'), payload);

  // 상대에게 '일정 추가됨' 알림 (즉시 push) — 로컬 에뮬레이터 시험(?emu=1) 중에는 진짜 푸시를 보내지 않는다.
  const to = partnerOf(input.createdBy) as '우댕' | '꼼이';
  if (!usingEmulator) fetch('/api/notify-calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'new', from: input.createdBy, to, title: input.title.trim(), owner: input.owner, date: input.startDate, id: savedRef.id }),
  }).catch(() => {});

  return savedRef.id;
}

/**
 * 일정 고치기. undefined = 그대로 두기, null = 그 칸 지우기(deleteField).
 * ⚠️ 비운 메모·장소·시간을 undefined 로 넘기면 건너뛰어서 예전 값이 그대로 남았다(사이담 8a6c061 과 같은 버그).
 */
export async function updateCalendarEvent(
  id: string,
  patch: { [K in keyof CalendarEventDoc]?: CalendarEventDoc[K] | null },
): Promise<void> {
  const clean: DocumentData = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) clean[k] = deleteField();
    else if (v !== undefined) clean[k] = v;
  }
  if (Object.keys(clean).length === 0) return;
  await settleDemoWrite(updateDoc(doc(db, 'calendarEvents', id), clean));
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await settleDemoWrite(deleteDoc(doc(db, 'calendarEvents', id)));
}
