/** 홈 달력 단추·알림·꼼톡 일정 카드가 모두 거치는 꼼캘 주소. 서버 라우트에서도 쓰므로 순수 함수만 둔다. */
export function calendarHref(date?: string | null, eventId?: string | null): string {
  const q = new URLSearchParams();
  if (date && /^\d{4}-\d\d-\d\d$/.test(date)) q.set('date', date);
  if (eventId && /^[A-Za-z0-9_-]{1,64}$/.test(eventId)) q.set('event', eventId);
  const tail = q.toString();
  return tail ? `/calendar?${tail}` : '/calendar';
}
