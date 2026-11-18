/**
 * 링크 미리보기 — 공유 리스트·꼼톡 링크 카드가 같이 쓰는 모양과 도우미.
 *
 * 우댕 2026-11-18 (공유 리스트 화면 사진): 「정작 이 방법 밖에 없는 거야? 저 긴 의미 없는 주소 보여 주고. 사진도 네이버 지도 사진…」
 *   → GPT 회의(scratchpad gpt-share/answer.md): 긴 주소는 어디에도 안 보인다(제목이 없으면 사이트 이름만),
 *     네이버 장소는 「가게 카드」(대표 사진·이름·분류·동네·리뷰 수·지도에서 보기), 링크 종류별로 카드 모양을 나눈다.
 * ⭐ 모든 새 필드는 선택값 — 옛 문서(preview{title,description,image,siteName})와 섞여도 안 깨진다. 종류는 kind 가 없으면 주소로 추정.
 * ⚠️ 원본 url 은 그대로 둔다(누르면 여는 용도). canonicalUrl(단축 푼 주소·장소 페이지)은 화면에 안 보인다.
 */
export type LinkKind = 'youtube' | 'instagram' | 'place' | 'blog' | 'web';

export interface PlaceInfo {
  id?: string; name?: string; category?: string; area?: string; address?: string; reviews?: number; phone?: string;
}
export interface LinkPreview {
  version?: number;
  kind?: LinkKind;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  canonicalUrl?: string;
  place?: PlaceInfo;
}
export const LINK_PREVIEW_VERSION = 2;

/** 「www.」 뺀 호스트 — 제목이 없을 때 보이는 유일한 주소 조각. */
export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^(www|m)\./, ''); } catch { return ''; }
}

export function linkKindOf(url: string, p?: Pick<LinkPreview, 'kind'> | null): LinkKind {
  if (p?.kind) return p.kind;
  const h = hostOf(url);
  if (/(^|\.)youtube\.com$|^youtu\.be$/.test(h)) return 'youtube';
  if (/(^|\.)instagram\.com$/.test(h)) return 'instagram';
  if (/^(map|place|pcmap\.place)\.naver\.com$/.test(h) && /\/(place|restaurant|cafe)\//.test(url)) return 'place';
  if (/^place\.naver\.com$/.test(h)) return 'place';
  if (/^blog\.naver\.com$|\.tistory\.com$|^brunch\.co\.kr$|^velog\.io$/.test(h)) return 'blog';
  return 'web';
}

/** 카드 제목 — 미리보기 제목, 없으면 장소 이름, 없으면 사이트 이름/호스트. **긴 주소는 절대 안 쓴다.** */
export function linkTitle(url: string, p?: LinkPreview | null): string {
  return p?.title || p?.place?.name || p?.siteName || hostOf(url) || '링크';
}

const SITE_LABEL: Record<LinkKind, string> = { youtube: 'YouTube', instagram: 'Instagram', place: '네이버 지도', blog: '블로그', web: '' };
/** 카드의 작은 줄(누가 만든·어디). 장소는 「분류 · 동네」. */
export function linkSubline(url: string, p?: LinkPreview | null): string {
  const k = linkKindOf(url, p);
  if (k === 'place') return [p?.place?.category?.split(',')[0], p?.place?.area].filter(Boolean).join(' · ') || p?.description || '네이버 지도';
  if (k === 'youtube') return [p?.description, 'YouTube'].filter(Boolean).join(' · ');
  if (k === 'instagram') return p?.siteName?.startsWith('Instagram') ? p.siteName.replace(/^Instagram\s*·\s*/, '') + ' · Instagram' : 'Instagram';
  if (k === 'blog') return [p?.siteName && p.siteName !== hostOf(url) ? p.siteName : '', hostOf(url)].filter(Boolean).join(' · ');
  return p?.siteName && p.siteName !== hostOf(url) ? `${p.siteName} · ${hostOf(url)}` : hostOf(url) || SITE_LABEL[k];
}

export const LINK_ACTION: Record<LinkKind, string> = {
  youtube: 'YouTube에서 보기', instagram: 'Instagram에서 보기', place: '지도에서 보기', blog: '글 읽기', web: '사이트 열기',
};

/** /api/og-preview 응답 → 저장할 모양(알 수 없는 칸은 버림). 쓸 게 하나도 없으면 null. */
export function normalizePreview(j: unknown): LinkPreview | null {
  if (!j || typeof j !== 'object') return null;
  const r = j as Record<string, unknown>;
  if (r.error) return null;
  const s = (v: unknown, max = 300) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const kinds: LinkKind[] = ['youtube', 'instagram', 'place', 'blog', 'web'];
  const out: LinkPreview = {
    version: LINK_PREVIEW_VERSION,
    ...(kinds.includes(r.kind as LinkKind) ? { kind: r.kind as LinkKind } : {}),
    ...(s(r.title) ? { title: s(r.title) } : {}),
    ...(s(r.description) ? { description: s(r.description) } : {}),
    ...(s(r.image, 2000) ? { image: s(r.image, 2000) } : {}),
    ...(s(r.siteName, 80) ? { siteName: s(r.siteName, 80) } : {}),
    ...(s(r.finalUrl, 2000) ? { canonicalUrl: s(r.finalUrl, 2000) } : {}),
  };
  if (r.place && typeof r.place === 'object') {
    const p = r.place as Record<string, unknown>;
    const place: PlaceInfo = {
      ...(s(p.id, 30) ? { id: s(p.id, 30) } : {}),
      ...(s(p.name, 80) ? { name: s(p.name, 80) } : {}),
      ...(s(p.category, 80) ? { category: s(p.category, 80) } : {}),
      ...(s(p.area, 60) ? { area: s(p.area, 60) } : {}),
      ...(s(p.address, 160) ? { address: s(p.address, 160) } : {}),
      ...(s(p.phone, 30) ? { phone: s(p.phone, 30) } : {}),
      ...(typeof p.reviews === 'number' && Number.isFinite(p.reviews) ? { reviews: p.reviews } : {}),
    };
    if (Object.keys(place).length) out.place = place;
  }
  return out.title || out.image || out.place || out.siteName ? out : null;
}

/** 브라우저에서 미리보기 받기(공유 리스트 추가 시트·꼼톡 카드). */
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const r = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
    return normalizePreview(await r.json());
  } catch { return null; }
}
