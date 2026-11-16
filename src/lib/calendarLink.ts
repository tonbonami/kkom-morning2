/**
 * 달력으로 가는 주소를 한 곳에서 — 달력 합치기 4단계(docs/gpt-diary-merge-answer.md 9번).
 * 일정은 이제 다이어리 월간 달력에서 본다: 홈 카드·홈 위 달력 단추·알림·꼼톡 일정 카드가 모두 여기를 거친다.
 * 문제가 생기면 CALENDAR_IN_DIARY 를 false 로 — 모든 길이 옛 /calendar 로 돌아간다(옛 화면은 5단계까지 그대로 둔다).
 * 서버 라우트(알림)에서도 쓰므로 순수 함수만.
 */
export const CALENDAR_IN_DIARY = true;

/** date 가 있으면 그 달을 열고 그날 시트를 띄운다. eventId 는 어떤 일정을 보러 왔는지(같은 제목이 둘일 수 있어 id 로). */
export function calendarHref(date?: string | null, eventId?: string | null): string {
  if (!CALENDAR_IN_DIARY) return '/calendar';
  const q = new URLSearchParams({ view: 'month' });
  if (date && /^\d{4}-\d\d-\d\d$/.test(date)) q.set('date', date);
  if (eventId && /^[A-Za-z0-9_-]{1,64}$/.test(eventId)) q.set('event', eventId);
  return `/diary?${q.toString()}`;
}
