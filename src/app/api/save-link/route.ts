// 공유 확장(KkomShare)용 — 유튜브 등에서 '공유 → 꼼모닝' 하면 URL이 여기로 온다.
//   메타(title/image/site)를 og-preview로 긁어서 '이거봐봐'(Firestore links)에 저장.
//   확장을 얇게 유지하려고 무거운 일(메타·저장)은 전부 서버가 한다. from은 앱그룹 pushUser 매핑.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function youTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host.endsWith('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(shorts|embed)\/([^/?]+)/);
      if (m) return m[2];
    }
    return null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  let body: { url?: string; from?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const raw = (body.url || '').trim();
  if (!raw) return NextResponse.json({ error: 'url required' }, { status: 400 });
  // 정상 http(s) URL만
  let url: string;
  try { const u = new URL(raw); if (!/^https?:$/.test(u.protocol)) throw new Error(); url = u.toString(); }
  catch { return NextResponse.json({ error: 'invalid url' }, { status: 400 }); }

  const from = body.from === '우댕' || body.from === '꼼이' ? body.from : '';

  // 메타 — 같은 서버의 og-preview 재사용(유튜브 oEmbed 포함). 실패해도 URL은 저장.
  const meta: { title?: string; image?: string; site?: string } = {};
  const yt = youTubeId(url);
  if (yt) meta.image = `https://img.youtube.com/vi/${yt}/hqdefault.jpg`; // 즉시 폴백 썸네일
  try {
    const r = await fetch(new URL(`/api/og-preview?url=${encodeURIComponent(url)}`, req.nextUrl.origin), {
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const j = (await r.json()) as { title?: string; image?: string; siteName?: string; error?: string };
      if (!j.error) {
        if (j.title) meta.title = j.title;
        if (j.image) meta.image = j.image;
        if (j.siteName) meta.site = j.siteName;
      }
    }
  } catch { /* 메타 실패 무시 */ }
  if (!meta.site) { try { meta.site = new URL(url).hostname.replace(/^www\./, ''); } catch {} }

  // undefined 필드는 Firestore 저장 안 됨 — 값 있을 때만.
  const payload: Record<string, unknown> = { url, from, createdAt: serverTimestamp() };
  if (meta.title) payload.title = meta.title;
  if (meta.image) payload.image = meta.image;
  if (meta.site) payload.site = meta.site;

  try {
    await addDoc(collection(db, 'links'), payload);
    return NextResponse.json({ ok: true, saved: { url, title: meta.title ?? null } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
