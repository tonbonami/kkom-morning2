/**
 * 달력으로 가는 주소를 한 곳에서 — 달력 합치기 4단계(docs/gpt-diary-merge-answer.md 9번)에서 만든 스위치.
 * 홈 위 달력 단추·알림·꼼톡 일정 카드가 모두 여기를 거친다.
 *
 * 2026-11-19 우댕 「달력 합치지 말자. 사이담처럼 둘 다 쓰자 … 꼼캘은 원래대로 살려주고」 → 합치기 취소(5단계 안 함).
 *   꼼캘(/calendar)과 다이어리(꼼이어리)를 사이담의 사이캘·사이어리처럼 따로 쓴다. 그래서 모든 길이 다시 /calendar 로 간다.
 *   다이어리 월간 달력의 일정 보기·추가(1~3단계)는 그대로 둔다 — 사이어리도 같은 일정을 달력에 보여 준다.
 * 다시 다이어리 달력으로 보내고 싶으면 CALENDAR_IN_DIARY 를 true 로.
 * 서버 라우트(알림)에서도 쓰므로 순수 함수만.
 */
export const CALENDAR_IN_DIARY = false;

/** date 가 있으면 그 달을 열고 그날 시트를 띄운다(다이어리 달력일 때만). eventId 는 어떤 일정을 보러 왔는지(같은 제목이 둘일 수 있어 id 로). */
export function calendarHref(date?: string | null, eventId?: string | null): string {
  if (!CALENDAR_IN_DIARY) return '/calendar';
  const q = new URLSearchParams({ view: 'month' });
  if (date && /^\d{4}-\d\d-\d\d$/.test(date)) q.set('date', date);
  if (eventId && /^[A-Za-z0-9_-]{1,64}$/.test(eventId)) q.set('event', eventId);
  return `/diary?${q.toString()}`;
}
