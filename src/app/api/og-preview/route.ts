// URL을 받아서 OG(Open Graph) 메타 + title 을 긁어서 반환.
// 위시리스트 추가 시트에서 사용자가 URL 붙여넣으면 호출됨.

import { NextRequest, NextResponse } from 'next/server';
import { igPost, igThumbPath, fetchInstagramMeta, decodeHtml } from '@/lib/instagram';

// 짧은 캐시 (같은 URL 반복 요청 절약)
export const revalidate = 3600;

function extractMeta(html: string, key: string): string | undefined {
  // <meta property="og:title" content="..."> 형태 + content 가 앞에 있는 경우 둘 다 처리
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return decodeHtml(m[1]);
  }
  return undefined;
}

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/** 네이버 지도·플레이스 주소에서 장소 번호. map.naver.com/p/entry/place/123 · /p/search/…/place/123 · m.place.naver.com/restaurant/123 */
function naverPlaceId(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^www\./, '');
  if (host !== 'map.naver.com' && host !== 'm.place.naver.com' && host !== 'place.naver.com' && host !== 'pcmap.place.naver.com') return null;
  const m = u.pathname.match(/\/(?:place|restaurant|cafe|hairshop|accommodation|hospital|attraction)\/(\d{5,})/);
  return m ? m[1] : null;
}

async function resolveFinal(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': IPHONE_UA }, signal: AbortSignal.timeout(6000) });
    return r.url || null;
  } catch { return null; }
}

/** 페이지 안 JSON 에서 "키":"값" 하나 — 첫 번째(가게 본문이 먼저 나온다). */
function jsonStr(html: string, key: string): string | undefined {
  const m = html.match(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`));
  if (!m) return undefined;
  try { return JSON.parse(`"${m[1]}"`) as string; } catch { return m[1]; }
}

/**
 * 네이버 장소 페이지 → 미리보기. kind 'place' + place{…} 를 같이 준다(카드가 가게 카드로 그린다).
 * 이름을 못 찾으면 null(일반 처리로 넘김) — 「네이버지도」·지도 로고를 다시 저장하지 않으려고.
 */
async function fetchNaverPlace(id: string) {
  const res = await fetch(`https://m.place.naver.com/place/${id}/home`, {
    headers: { 'User-Agent': IPHONE_UA, 'Accept': 'text/html', 'Accept-Language': 'ko,en;q=0.9' },
    redirect: 'follow', signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const html = new TextDecoder('utf-8').decode((await res.arrayBuffer()).slice(0, 900 * 1024));
  const ogTitle = extractMeta(html, 'og:title')?.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s*:\s*네이버\s*$/, '').trim();
  const name = (ogTitle && !/^네이버\s*지도$/.test(ogTitle) ? ogTitle : undefined) || jsonStr(html, 'name');
  if (!name) return null;
  const image = extractMeta(html, 'og:image');
  const category = jsonStr(html, 'category');
  const roadAddress = jsonStr(html, 'roadAddress');
  const address = jsonStr(html, 'address');
  const phone = jsonStr(html, 'virtualPhone') || jsonStr(html, 'phone');
  const vr = html.match(/"visitorReviewsTotal":(\d+)/)?.[1];
  // 동네 = 주소의 구·동(「서울 동대문구 고산자로…」 → 「동대문구」, 지번 주소의 동이 있으면 「동대문구 용두동」)
  const gu = (roadAddress || address || '').split(/\s+/).find((w) => /(구|군|시)$/.test(w) && !/^(서울|부산|대구|인천|광주|대전|울산|세종)/.test(w));
  const dong = (address || '').split(/\s+/).find((w) => /(동|읍|면|가)$/.test(w));
  const area = [gu, dong].filter(Boolean).join(' ') || undefined;
  return {
    kind: 'place' as const,
    title: decodeHtml(name),
    description: [category?.split(',')[0], area].filter(Boolean).join(' · ') || undefined,
    image: image && !/og-map/i.test(image) ? decodeHtml(image) : undefined,
    siteName: '네이버 지도',
    finalUrl: `https://m.place.naver.com/place/${id}/home`,
    place: {
      id, name: decodeHtml(name),
      ...(category ? { category } : {}),
      ...(area ? { area } : {}),
      ...(roadAddress || address ? { address: roadAddress || address } : {}),
      ...(phone ? { phone } : {}),
      ...(vr ? { reviews: Number(vr) } : {}),
    },
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  // 보안: 정상 URL만 허용
  let target: URL;
  try {
    target = new URL(url);
    if (!/^https?:$/.test(target.protocol)) throw new Error('invalid protocol');
    // 안쪽 주소(localhost·사설망·메타데이터)는 받지 않는다 — 이 서버가 대신 열어 주는 통로가 되지 않게(GPT 회의 11/18).
    const h = target.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || h === '[::1]' || h === '0.0.0.0'
      || /^(127|10)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) throw new Error('private host');
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  // YouTube 전용 분기 (SPA라 OG 부실 → oEmbed + 직접 썸네일)
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    try {
      const oe = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oe.ok) {
        const d = await oe.json();
        return NextResponse.json({
          kind: 'youtube',
          title: d.title,
          description: d.author_name,
          image: thumb,
          siteName: 'YouTube',
        });
      }
    } catch {}
    return NextResponse.json({ kind: 'youtube', title: 'YouTube 영상', image: thumb, siteName: 'YouTube' });
  }

  // Instagram 분기 — 로그인 벽이라 미리보기 봇으로 요청해야 og 를 준다(lib/instagram).
  //   이미지는 만료되는 CDN 주소 대신 고정 주소(/api/ig-thumb)로 — 공유 리스트에 저장돼도 안 깨진다.
  //   못 긁으면 예전처럼 글자 카드. (게시물 모달은 여전히 공식 embed.js)
  const ig = igPost(url);
  if (ig) {
    const meta = await fetchInstagramMeta(url).catch(() => null);
    return NextResponse.json({
      kind: 'instagram',
      title: meta?.caption || 'Instagram 게시물',
      description: meta?.user ? `@${meta.user}` : '카드를 누르면 인스타그램 게시물이 떠요',
      image: meta?.image ? igThumbPath(ig) : undefined,
      siteName: meta?.user ? `Instagram · @${meta.user}` : 'Instagram',
    });
  }

  // 네이버 지도 장소 — map.naver.com/p/entry/place/{번호} 는 지도 앱 화면이라 og 가 「네이버지도」·지도 로고뿐이다
  //   (우댕 2026-11-18 공유 리스트: 「저 긴 의미 없는 주소 보여 주고. 사진도 네이버 지도 사진…」).
  //   장소 번호로 휴대폰 장소 페이지(m.place.naver.com/place/{번호}/home)를 받으면 가게 이름·분류·주소·리뷰 수·대표 사진이 있다.
  //   naver.me 단축은 먼저 풀어서(리다이렉트 끝 주소) 번호를 찾는다.
  const placeId = naverPlaceId(url) ?? (/^naver\.me$/i.test(target.hostname) ? naverPlaceId(await resolveFinal(url)) : null);
  if (placeId) {
    const place = await fetchNaverPlace(placeId).catch(() => null);
    if (place) return NextResponse.json(place);
  }

  // 네이버(naver.me 단축·naver.com) — PC로 요청하면 지도 앱 화면(map.naver.com, og 제목 비어 있음)으로 가고,
  //   휴대폰으로 요청하면 장소 페이지(m.place.naver.com)로 가서 og:title "가게 : 네이버"·대표 사진·리뷰 수를 준다.
  //   채팅 카드에 주소 글자만 뜨던 것(Aside 1부 → 2부에서 리다이렉트 끝 HTML 확인). 블로그·뉴스도 모바일 페이지에 og가 있다.
  const tHost = target.hostname.replace(/^www\./, '');
  const isNaver = tHost === 'naver.me' || /(^|\.)naver\.com$/.test(tHost);

  try {
    const res = await fetch(target.toString(), {
      headers: {
        // 일부 사이트는 봇 차단 → 일반 브라우저 UA 흉내
        'User-Agent': isNaver
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    // 리다이렉트 푼 최종 주소 — naver.me 같은 단축링크 판정에 쓴다(사이담: 반드시 풀어 판정).
    const finalUrl = res.url || target.toString();

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'not html', finalUrl });
    }

    // HTML 너무 크면 앞부분만 (head 안에 og 다 있음, ~256KB)
    const buf = await res.arrayBuffer();
    const slice = new TextDecoder('utf-8').decode(buf.slice(0, 256 * 1024));

    // og:image 가 상대경로면 절대경로로
    let image = extractMeta(slice, 'og:image') || extractMeta(slice, 'twitter:image');
    if (image && !/^https?:\/\//i.test(image)) {
      try { image = new URL(image, target.origin).toString(); } catch {}
    }

    let title =
      extractMeta(slice, 'og:title') ||
      extractMeta(slice, 'twitter:title') ||
      slice.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    if (title && isNaver) {
      // 네이버는 제목 끝에 보이지 않는 제어 문자(\u001c)를 붙여 보낸다 → 먼저 지워야 접미사가 떨어진다.
      title = title.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s*:\s*네이버(\s*블로그)?\s*$/, '').trim();   // "에이직 피자 : 네이버" → "에이직 피자"
      if (/^네이버\s*지도$/.test(title)) title = undefined;           // 지도 앱 화면의 일반 제목은 가게 이름이 아니다
    }

    const fHost = (() => { try { return new URL(finalUrl).hostname.replace(/^(www|m)\./, ''); } catch { return tHost; } })();
    const kind = /^blog\.naver\.com$|\.tistory\.com$|^brunch\.co\.kr$|^velog\.io$/.test(fHost) ? 'blog' : 'web';
    return NextResponse.json({
      kind,
      title: title ? decodeHtml(title) : undefined,
      description: extractMeta(slice, 'og:description') || extractMeta(slice, 'description'),
      image,
      siteName: extractMeta(slice, 'og:site_name'),
      finalUrl,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
