import { db } from './firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs,
  type DocumentData,
} from 'firebase/firestore';
import { partnerOf } from './letters';
import { addCommentAt } from './reactions';

export type PraiseUser = '우댕' | '꼼이';
// Phase 4: 'memo' — 칭찬/조르기와 별개 짧은 자유 메모. 영감 자료의 노란 포스트잇 패턴.
export type PraiseKind = 'praise' | 'request' | 'memo';
export type PraiseStickerSheet = 'classic' | 'pochacco';
// Claude 참고: 'line' = 줄지어 N개 깔기 좋은 단순/작은 스티커, 'stamp' = 크게 1장 박는 일러스트형.
// 다만 강제 분류가 아니라 정렬 힌트일 뿐 — 사용자가 어떤 스티커든 1개(도장)~20개(줄)로 자유롭게 씁니다.
export type PraiseStickerCategory = 'line' | 'stamp';

export interface PraiseSticker {
  emoji: string;
  /** @deprecated v2에서 폐기 — 옛 doc 표시 호환용으로만 유지 */
  label: string;
  /** @deprecated v2에서 폐기 — 옛 picker 카드 배경색이었음. 새 picker는 안 씀 */
  color: string;
  sheet: PraiseStickerSheet;
  image: string;
  category: PraiseStickerCategory;
}

// Claude 참고:
// 18종 다 살림. 라벨은 v3에서 화면에 안 표시하지만 옛 doc 호환과 alt 텍스트용으로 남김.
// image는 WebP (v3 성능 가드 — 75KB PNG → 24KB WebP, 68% 감소).
// 옛 doc의 .png 경로는 normalizeStickerImage가 .webp로 자동 매핑.
export const PRAISE_STICKERS: PraiseSticker[] = [
  // 클래식 — 작은/단순 = line, 메달/왕관 = stamp
  { emoji: '⭐', label: '반짝별',   color: 'bg-amber-100 text-amber-700',     sheet: 'classic', category: 'line',  image: '/praise/classic/1.webp' },
  { emoji: '💚', label: '초록하트', color: 'bg-emerald-100 text-emerald-700', sheet: 'classic', category: 'line',  image: '/praise/classic/2.webp' },
  { emoji: '🌷', label: '꽃송이',   color: 'bg-rose-100 text-rose-700',       sheet: 'classic', category: 'line',  image: '/praise/classic/3.webp' },
  { emoji: '🍀', label: '행운잎',   color: 'bg-lime-100 text-lime-700',       sheet: 'classic', category: 'line',  image: '/praise/classic/4.webp' },
  { emoji: '🫧', label: '몽글버블', color: 'bg-cyan-100 text-cyan-700',       sheet: 'classic', category: 'line',  image: '/praise/classic/5.webp' },
  { emoji: '🍯', label: '달콤꿀',   color: 'bg-yellow-100 text-yellow-700',   sheet: 'classic', category: 'line',  image: '/praise/classic/6.webp' },
  { emoji: '🎀', label: '리본하트', color: 'bg-pink-100 text-pink-700',       sheet: 'classic', category: 'line',  image: '/praise/classic/7.webp' },
  { emoji: '🏅', label: '잘했장',   color: 'bg-orange-100 text-orange-700',   sheet: 'classic', category: 'stamp', image: '/praise/classic/8.webp' },
  { emoji: '👑', label: '왕칭찬',   color: 'bg-yellow-100 text-yellow-700',   sheet: 'classic', category: 'stamp', image: '/praise/classic/9.webp' },
  // 포차코 — 큰 일러스트는 stamp, 작은 표정은 line
  { emoji: '⭐', label: '별안은 포차코', color: 'bg-amber-100 text-amber-700',     sheet: 'pochacco', category: 'stamp', image: '/praise/pochacco/1.webp' },
  { emoji: '💚', label: '하트 포차코',   color: 'bg-emerald-100 text-emerald-700', sheet: 'pochacco', category: 'stamp', image: '/praise/pochacco/2.webp' },
  { emoji: '👏', label: '박수 포차코',   color: 'bg-rose-100 text-rose-700',       sheet: 'pochacco', category: 'line',  image: '/praise/pochacco/3.webp' },
  { emoji: '🏅', label: '메달 포차코',   color: 'bg-orange-100 text-orange-700',   sheet: 'pochacco', category: 'stamp', image: '/praise/pochacco/4.webp' },
  { emoji: '🌷', label: '꽃다발 포차코', color: 'bg-pink-100 text-pink-700',       sheet: 'pochacco', category: 'stamp', image: '/praise/pochacco/5.webp' },
  { emoji: '🥺', label: '칭찬조름 포차코', color: 'bg-cyan-100 text-cyan-700',     sheet: 'pochacco', category: 'line',  image: '/praise/pochacco/6.webp' },
  { emoji: '✨', label: '폴짝 포차코',   color: 'bg-lime-100 text-lime-700',       sheet: 'pochacco', category: 'line',  image: '/praise/pochacco/7.webp' },
  { emoji: '👑', label: '왕 포차코',     color: 'bg-yellow-100 text-yellow-700',   sheet: 'pochacco', category: 'stamp', image: '/praise/pochacco/8.webp' },
  { emoji: '🤗', label: '꼬옥 포차코',   color: 'bg-amber-100 text-amber-700',     sheet: 'pochacco', category: 'stamp', image: '/praise/pochacco/9.webp' },
];

export interface PraiseDoc {
  kind: PraiseKind;
  from: PraiseUser;
  to: PraiseUser;
  reason: string;
  stickerEmoji?: string;
  stickerLabel?: string;
  stickerImage?: string;
  stickerImageIndex?: number;
  stickerCount: number;
  createdAt?: Timestamp | null;
  // Phase 3 답글 — reactions.ts가 addCommentAt 시 commentCount를 자동 ++.
  // latestReply는 헤더 미리보기용 (인라인 한 줄). reactions.ts에 별도 update가 필요 (현재는 캐시 안 함).
  commentCount?: number;
  latestReply?: string;
}

export interface PraiseItemView {
  id: string;
  kind: PraiseKind;
  from: PraiseUser;
  to: PraiseUser;
  reason: string;
  stickerEmoji: string;
  stickerLabel: string;
  stickerImage?: string;
  stickerImageIndex?: number;
  stickerCount: number;
  createdAt: Date;
  commentCount?: number;
  latestReply?: string;
}

export interface PraiseMonthSummary {
  key: string;
  label: string;
  count: number;
  royalCount: number;
}

// Claude 참고: 옛 doc 호환의 핵심.
// v2 시절 .png 경로로 저장된 stickerImage를 .webp로 자동 매핑.
// 옛날 스프라이트 경로(`/praise-classic.png` 등)도 imageIndex로 개별 webp로 보정.
function normalizeStickerImage(image?: string, imageIndex?: number): string | undefined {
  if (!image) return undefined;
  // v2 스프라이트 시트 경로 보정
  if (image === '/praise%201.png' || image === '/praise 1.png' || image === '/praise-classic.png') {
    return `/praise/classic/${(imageIndex ?? 0) + 1}.webp`;
  }
  if (image === '/prase%202.png' || image === '/prase 2.png' || image === '/praise-pochacco.png') {
    return `/praise/pochacco/${(imageIndex ?? 0) + 1}.webp`;
  }
  // v2 개별 .png → .webp
  if (image.endsWith('.png') && (image.startsWith('/praise/classic/') || image.startsWith('/praise/pochacco/'))) {
    return image.replace(/\.png$/, '.webp');
  }
  return image;
}

function toView(id: string, d: PraiseDoc): PraiseItemView {
  return {
    id,
    kind: d.kind,
    from: d.from,
    to: d.to,
    reason: d.reason || '',
    stickerEmoji: d.stickerEmoji || '⭐',
    stickerLabel: d.stickerLabel || '칭찬',
    stickerImage: normalizeStickerImage(d.stickerImage, d.stickerImageIndex),
    stickerImageIndex: undefined,
    stickerCount: Math.max(0, d.stickerCount || 0),
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
    commentCount: d.commentCount,
    latestReply: d.latestReply,
  };
}

// Claude 참고: v3 성능 가드 — 피드용 실시간 구독은 최신 30개만.
// KPI/총합/월별은 별도 fetchPraiseTotals()로 1회 read.
// 칭찬 양이 1000개를 넘기 전까지는 이 패턴으로 충분. 그 이상은 counts doc 도입.
const FEED_LIMIT = 30;

export function subscribePraise(cb: (items: PraiseItemView[]) => void): () => void {
  const q = query(
    collection(db, 'praiseStickers'),
    orderBy('createdAt', 'desc'),
    limit(FEED_LIMIT)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => toView(d.id, d.data() as PraiseDoc));
      cb(items);
    },
    (err) => {
      console.error('칭찬 피드 구독 오류:', err);
      cb([]);
    }
  );
}

// Claude 참고: 페이지 진입 시 1회만 호출. 총합/월별/스티커북 집계용.
// onSnapshot 아닌 1회 getDocs이므로 부담 적음. 칭찬 보낼 때 로컬 state로 낙관적 갱신.
export async function fetchPraiseTotals(): Promise<PraiseItemView[]> {
  try {
    const snap = await getDocs(collection(db, 'praiseStickers'));
    return snap.docs.map((d) => toView(d.id, d.data() as PraiseDoc));
  } catch (e) {
    console.error('칭찬 총합 fetch 오류:', e);
    return [];
  }
}

export async function addPraise(input: {
  from: PraiseUser;
  reason: string;
  sticker: PraiseSticker;
  stickerCount: number;
}): Promise<string> {
  const count = Math.min(20, Math.max(1, Math.floor(input.stickerCount)));
  const to = partnerOf(input.from) as PraiseUser;
  const payload: DocumentData = {
    kind: 'praise',
    from: input.from,
    to,
    reason: input.reason.trim(),
    stickerEmoji: input.sticker.emoji,
    stickerLabel: input.sticker.label,
    stickerImage: input.sticker.image,
    stickerCount: count,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'praiseStickers'), payload);

  // 매일매일 꼼모닝 헤더 카운트
  import('./dailyStats').then(({ incrementPraiseStickers }) =>
    incrementPraiseStickers(input.from, count)
  ).catch(() => {});

  fetch('/api/notify-praise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'praise',
      from: input.from,
      to,
      reason: input.reason.trim(),
      stickerEmoji: input.sticker.emoji,
      stickerCount: count,
    }),
  }).catch(() => {});

  return ref.id;
}

// Phase 4: 자유 메모 추가 — 칭찬과 별개로 다이어리에 떠다니는 노란 포스트잇.
// from = 본인. 메모는 to 개념 없지만 partner를 to에 박아 호환성 유지 (피드 filter용).
export async function addMemo(input: {
  from: PraiseUser;
  text: string;
}): Promise<string> {
  const to = partnerOf(input.from) as PraiseUser;
  const payload: DocumentData = {
    kind: 'memo',
    from: input.from,
    to,
    reason: input.text.trim(),
    stickerCount: 0,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'praiseStickers'), payload);
  return ref.id;
}

export async function requestPraise(input: {
  from: PraiseUser;
  reason: string;
}): Promise<string> {
  const to = partnerOf(input.from) as PraiseUser;
  const payload: DocumentData = {
    kind: 'request',
    from: input.from,
    to,
    reason: input.reason.trim(),
    stickerCount: 0,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'praiseStickers'), payload);

  import('./dailyStats').then(({ incrementPraiseRequest }) =>
    incrementPraiseRequest(input.from)
  ).catch(() => {});

  fetch('/api/notify-praise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'request',
      from: input.from,
      to,
      reason: input.reason.trim(),
    }),
  }).catch(() => {});

  return ref.id;
}

export function totalPraiseCount(items: PraiseItemView[], to?: PraiseUser): number {
  return items
    .filter((item) => item.kind === 'praise' && (!to || item.to === to))
    .reduce((sum, item) => sum + item.stickerCount, 0);
}

// Phase 3 답글 — reactions.ts의 일반 comment 패턴 위에 latestReply 캐시까지 박는 wrapper.
// 영감 자료의 '→ 답글 한 줄 미리보기' 인라인 표시를 위해 *마지막 답글*을 praise doc에 캐시.
// 답글 N개여도 카드에선 *가장 최근 한 줄*만 인라인, 더 보려면 시트 열기.
export async function addPraiseReply(praiseId: string, by: PraiseUser, text: string): Promise<void> {
  const t = text.trim();
  if (!t || !praiseId) return;
  await addCommentAt('praiseStickers', praiseId, by, t);
  try {
    await updateDoc(doc(db, 'praiseStickers', praiseId), {
      latestReply: t.length > 60 ? t.slice(0, 60) + '…' : t,
    });
  } catch (e) {
    console.warn('latestReply 캐시 실패:', e);
  }
  // 답글 푸시 — 답글 단 사람의 partner에게
  const to = partnerOf(by) as PraiseUser;
  fetch('/api/notify-praise-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: by, to, reply: t }),
  }).catch(() => {});
}

export function monthlyPraiseSummary(items: PraiseItemView[], to?: PraiseUser): PraiseMonthSummary[] {
  const byMonth = new Map<string, number>();
  items
    .filter((item) => item.kind === 'praise' && (!to || item.to === to))
    .forEach((item) => {
      const key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) || 0) + item.stickerCount);
    });

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      return {
        key,
        label: `${year}년 ${Number(month)}월`,
        count,
        royalCount: Math.floor(count / 100),
      };
    });
}
