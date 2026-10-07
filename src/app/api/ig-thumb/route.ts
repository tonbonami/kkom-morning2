// 인스타 게시물 썸네일 '고정 주소'. 열 때마다 최신 og:image(서명 CDN 주소)를 받아 그리로 넘긴다.
//   인스타 이미지 주소는 며칠 뒤 만료되므로 저장·표시엔 이 주소를 쓴다(공유 리스트에 저장돼도 안 깨짐).
//   CDN 이미지는 cross-origin 허용이라 <img> 로 바로 뜬다. 넘김(302)은 12시간 캐시 — 만료(약 4일)보다 짧게.
import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramMeta } from '@/lib/instagram';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || '';
  const meta = await fetchInstagramMeta(url).catch(() => null);
  if (!meta?.image) {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=600' } });
  }
  const res = NextResponse.redirect(meta.image, 302);
  res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=43200');
  return res;
}
