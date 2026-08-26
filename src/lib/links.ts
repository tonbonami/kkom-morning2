// "이거봐봐" — 꼼톡에서 주고받은 링크를 따로 모아두는 보관함. Firestore 'links' 컬렉션.
// 링크를 보내면 저장할지 물어보고, 저장하면 여기 쌓여서 탭 한 번에 열린다(바로 연결).
import { db } from './firebase';
import {
  collection, addDoc, doc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';

export interface SavedLink {
  id: string;
  url: string;
  from: string;    // 저장한 사람 (우댕/꼼이)
  title?: string;
  image?: string;  // 썸네일
  site?: string;   // 사이트명/도메인 (YouTube 등)
  createdAt: Date | null;
}

// 텍스트에서 첫 http(s) URL 추출 — 끝의 문장부호는 떼어낸다.
const URL_RE = /https?:\/\/[^\s<]+/i;
export function firstUrl(text: string): string | null {
  const m = text.match(URL_RE);
  return m ? m[0].replace(/[),.\]]+$/, '') : null;
}

// 유튜브 videoId — og-preview 실패 시 썸네일 폴백용.
export function youTubeId(url: string): string | null {
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

// 링크 메타(title/image/site) — og-preview 서버 경유(유튜브 포함 처리됨). 실패해도 URL은 저장.
async function fetchLinkMeta(url: string): Promise<{ title?: string; image?: string; site?: string }> {
  const out: { title?: string; image?: string; site?: string } = {};
  const yt = youTubeId(url);
  if (yt) out.image = `https://img.youtube.com/vi/${yt}/hqdefault.jpg`; // 즉시 폴백 썸네일
  try {
    const r = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
    if (r.ok) {
      const j = (await r.json()) as { title?: string; image?: string; siteName?: string; error?: string };
      if (!j.error) {
        if (j.title) out.title = j.title;
        if (j.image) out.image = j.image;
        if (j.siteName) out.site = j.siteName;
      }
    }
  } catch { /* 메타 실패 무시 */ }
  if (!out.site) { try { out.site = new URL(url).hostname.replace(/^www\./, ''); } catch {} }
  return out;
}

// 링크 저장 — 메타 붙여서 'links'에. undefined 필드는 Firestore 저장 안 되므로 정리.
export async function saveLink(url: string, from: string): Promise<void> {
  const meta = await fetchLinkMeta(url);
  const payload: Record<string, unknown> = { url, from, createdAt: serverTimestamp() };
  if (meta.title) payload.title = meta.title;
  if (meta.image) payload.image = meta.image;
  if (meta.site) payload.site = meta.site;
  await addDoc(collection(db, 'links'), payload);
}

// 최신순 실시간 구독.
export function subscribeLinks(cb: (links: SavedLink[]) => void): () => void {
  const q = query(collection(db, 'links'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown> & { createdAt?: Timestamp };
      return {
        id: d.id, url: (data.url as string) ?? '', from: (data.from as string) ?? '',
        title: data.title as string | undefined, image: data.image as string | undefined,
        site: data.site as string | undefined, createdAt: data.createdAt?.toDate?.() ?? null,
      } as SavedLink;
    }));
  }, () => cb([]));
}

export async function deleteLink(id: string): Promise<void> {
  await deleteDoc(doc(db, 'links', id));
}
