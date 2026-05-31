// URL을 받아서 OG(Open Graph) 메타 + title 을 긁어서 반환.
// 위시리스트 추가 시트에서 사용자가 URL 붙여넣으면 호출됨.

import { NextRequest, NextResponse } from 'next/server';

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

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
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
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        // 일부 사이트는 봇 차단 → 일반 브라우저 UA 흉내
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'not html' });
    }

    // HTML 너무 크면 앞부분만 (head 안에 og 다 있음, ~256KB)
    const buf = await res.arrayBuffer();
    const slice = new TextDecoder('utf-8').decode(buf.slice(0, 256 * 1024));

    // og:image 가 상대경로면 절대경로로
    let image = extractMeta(slice, 'og:image') || extractMeta(slice, 'twitter:image');
    if (image && !/^https?:\/\//i.test(image)) {
      try { image = new URL(image, target.origin).toString(); } catch {}
    }

    const title =
      extractMeta(slice, 'og:title') ||
      extractMeta(slice, 'twitter:title') ||
      slice.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();

    return NextResponse.json({
      title: title ? decodeHtml(title) : undefined,
      description: extractMeta(slice, 'og:description') || extractMeta(slice, 'description'),
      image,
      siteName: extractMeta(slice, 'og:site_name'),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
