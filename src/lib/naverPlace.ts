// 네이버 지도/플레이스 링크 판정 + 보낸 말에서 가게 이름 뽑기.
//
// ⚠️ 왜 '보낸 말'에서 이름을 가져오나(사이담 교훈): 네이버 플레이스는 SPA라 서버 머리말(og)이 텅 비어 있다.
//    map.naver.com → og:title "네이버지도", m.place.naver.com → og 없음. 그대로 담으면 목록에
//    「네이버지도」라는 항목이 쌓인다. 사람들은 "어글리스토브 ⏎ https://naver.me/…" 처럼 보내니,
//    링크를 걷어낸 '첫 줄'이 곧 가게 이름이다 — 공짜로 있는 신호.
// ⚠️ naver.me 단축링크는 지도 전용이 아니다(뉴스·블로그도 있음). 반드시 finalUrl 로 '풀어서' 판정할 것.
//    (og-preview 응답의 finalUrl 을 넘겨라. 이 함수는 풀린 주소만 place 로 인정한다.)

// 이미 풀린(최종) 주소가 네이버 '장소'인지. naver.me(단축)는 여기서 false — 먼저 finalUrl 로 풀 것.
export function isNaverPlaceUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  const host = u.hostname.replace(/^www\./, '');
  const path = u.pathname;
  if (host === 'm.place.naver.com' || host === 'place.naver.com') return true;
  if (host === 'map.naver.com') {
    return /\/(entry\/)?place\//.test(path) || /\/restaurant\//.test(path) || /place/i.test(path);
  }
  return false;
}

// naver.me 단축 — 판정 전에 finalUrl 로 풀어야 하는 주소.
export function isNaverShort(url: string | undefined | null): boolean {
  return /(^|\/\/)(naver\.me)\//i.test(url || '');
}

// 아무 네이버 링크라도(단축 포함) 후보로 볼지 — 이걸로 og-preview 를 부를지 결정.
export function looksNaver(url: string | undefined | null): boolean {
  return isNaverShort(url) || /naver\.com\//i.test(url || '');
}

// 보낸 메시지에서 가게 이름 추정 — URL 걷어낸 뒤 첫 비어있지 않은 줄.
export function storeNameFromText(text: string | undefined | null): string {
  if (!text) return '';
  const noUrl = text.replace(/https?:\/\/[^\s]+/gi, ' ');
  const firstLine = noUrl.split(/\n/).map((s) => s.trim()).find((s) => s.length > 0) || '';
  return firstLine.replace(/\s+/g, ' ').slice(0, 40);
}
