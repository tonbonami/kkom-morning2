import { db } from './firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { partnerOf } from './letters';

export type PraiseUser = '우댕' | '꼼이';
export type PraiseKind = 'praise' | 'request';

export interface PraiseSticker {
  emoji: string;
  label: string;
  color: string;
}

// Claude 참고:
// 지금은 emoji 스티커로 MVP를 만들고, 나중에 직접 그린 에셋을 넣을 때
// 이 배열에 asset 경로나 imageKey만 추가하면 화면/저장 구조를 크게 바꾸지 않아도 됩니다.
export const PRAISE_STICKERS: PraiseSticker[] = [
  { emoji: '⭐', label: '반짝별', color: 'bg-amber-100 text-amber-700' },
  { emoji: '💚', label: '초록하트', color: 'bg-emerald-100 text-emerald-700' },
  { emoji: '🌷', label: '꽃송이', color: 'bg-rose-100 text-rose-700' },
  { emoji: '🍀', label: '행운잎', color: 'bg-lime-100 text-lime-700' },
  { emoji: '🫧', label: '몽글버블', color: 'bg-cyan-100 text-cyan-700' },
  { emoji: '🍯', label: '달콤꿀', color: 'bg-yellow-100 text-yellow-700' },
  { emoji: '🎀', label: '리본', color: 'bg-pink-100 text-pink-700' },
  { emoji: '🏅', label: '잘했장', color: 'bg-orange-100 text-orange-700' },
];

export interface PraiseDoc {
  kind: PraiseKind;
  from: PraiseUser;
  to: PraiseUser;
  reason: string;
  stickerEmoji?: string;
  stickerLabel?: string;
  stickerCount: number;
  createdAt?: Timestamp | null;
}

export interface PraiseItemView {
  id: string;
  kind: PraiseKind;
  from: PraiseUser;
  to: PraiseUser;
  reason: string;
  stickerEmoji: string;
  stickerLabel: string;
  stickerCount: number;
  createdAt: Date;
}

export interface PraiseMonthSummary {
  key: string;
  label: string;
  count: number;
  royalCount: number;
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
    stickerCount: Math.max(0, d.stickerCount || 0),
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  };
}

export function subscribePraise(cb: (items: PraiseItemView[]) => void): () => void {
  return onSnapshot(
    collection(db, 'praiseStickers'),
    (snap) => {
      const items = snap.docs.map((d) => toView(d.id, d.data() as PraiseDoc));
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      cb(items);
    },
    (err) => {
      console.error('칭찬 구독 오류:', err);
      cb([]);
    }
  );
}

export async function addPraise(input: {
  from: PraiseUser;
  reason: string;
  sticker: PraiseSticker;
  stickerCount: number;
}): Promise<string> {
  const count = Math.min(10, Math.max(1, Math.floor(input.stickerCount)));
  const to = partnerOf(input.from) as PraiseUser;
  const payload: DocumentData = {
    kind: 'praise',
    from: input.from,
    to,
    reason: input.reason.trim(),
    stickerEmoji: input.sticker.emoji,
    stickerLabel: input.sticker.label,
    stickerCount: count,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'praiseStickers'), payload);

  // 기존 편지/퀵메시지처럼 저장 후 푸시 API만 호출합니다.
  // Firestore 저장과 알림 전송을 분리해두면 알림 실패가 칭찬 기록을 망치지 않습니다.
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
