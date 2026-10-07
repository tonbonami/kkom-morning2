// 인스타 게시물 썸네일·캡션.
//   인스타는 일반 브라우저 요청엔 og 메타를 안 준다(로그인 벽). 링크 미리보기 봇(facebookexternalhit)에게만
//   og:image / og:title / og:description 을 준다 — 카톡·아이메시지 미리보기가 쓰는 길과 같다.
//   ⚠️ og:image 는 서명된 CDN 주소라 며칠 뒤 만료된다(oe=). 저장하지 말고 /api/ig-thumb 로 매번 새로 받는다.
//   (공유 리스트·위시리스트는 preview.image 를 Firestore 에 저장하므로 만료 주소를 넣으면 며칠 뒤 깨진다.)

// instagram.com/p/CODE, /reel/CODE, /reels/CODE, /tv/CODE, /{아이디}/p/CODE 모두.
const IG_POST_RE = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reels?|tv)\/([A-Za-z0-9_-]+)/;

export type IgPost = { kind: 'p' | 'reel' | 'tv'; code: string; canonical: string };
export function igPost(url: string): IgPost | null {
  const m = url.match(IG_POST_RE);
  if (!m) return null;
  const kind = (m[1] === 'reels' ? 'reel' : m[1]) as IgPost['kind'];
  // ?igsh=·?stkn= 같은 공유 추적값은 떼고 표준 주소로(같은 게시물 = 같은 캐시 키).
  return { kind, code: m[2], canonical: `https://www.instagram.com/${kind}/${m[2]}/` };
}

export const igThumbPath = (post: IgPost) => `/api/ig-thumb?url=${encodeURIComponent(post.canonical)}`;

// HTML 엔티티 풀기 — 인스타는 한글을 &#xc758; 처럼 숫자 엔티티로, 그것도 자모 분해(NFD)로 준다 → NFC 로 합친다.
//   &amp; 는 맨 마지막(먼저 풀면 &amp;#x..; 가 두 번 풀린다).
export function decodeHtml(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .normalize('NFC');
}

function meta(html: string, key: string): string | undefined {
  const m =
    html.match(new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i')) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${key}["']`, 'i'));
  return m?.[1] ? decodeHtml(m[1]) : undefined;
}

const BOT_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

// 서버 전용. 실패하면 null(호출부가 글자 카드로 폴백).
export async function fetchInstagramMeta(url: string): Promise<{ image?: string; caption?: string; user?: string } | null> {
  const post = igPost(url);
  if (!post) return null;
  const res = await fetch(post.canonical, {
    // 영어 형식으로 받아야 제목·설명 모양이 일정하다: `이름 on Instagram: "캡션"`, `N likes, … - 아이디 on 날짜: …`
    headers: { 'User-Agent': BOT_UA, 'Accept-Language': 'en-US,en;q=0.9' },
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) return null;
  const html = await res.text();
  const image = meta(html, 'og:image');
  if (!image) return null;   // 로그인 페이지로 튕긴 경우 등

  const title = meta(html, 'og:title') ?? '';
  const quoted = title.match(/:\s*"([\s\S]*)"\s*$/)?.[1] ?? '';
  const firstLine = quoted.split('\n').map((l) => l.trim()).find(Boolean);
  const caption = firstLine ? (firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine) : undefined;
  const user = (meta(html, 'og:description') ?? '').match(/ - ([A-Za-z0-9_.]+) on /)?.[1];
  return { image, caption, user };
}
