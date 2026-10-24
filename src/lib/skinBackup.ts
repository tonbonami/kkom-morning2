// 피부 일지 통째 백업(서버 전용) — skin/kkomi 아래 컬렉션을 JSON 한 덩어리로.
// 저장할 때마다 쌓는 logs/{날짜}/versions 는 하루 백업 파일엔 안 넣는다(그건 Firestore 안의 되돌리기용, 날마다 파일이 그 몫을 한다).
import type { Firestore } from 'firebase-admin/firestore';
import { medOf } from './skinStats';
import { MEMO_SLOTS, MEMO_SLOT_LABEL, SKIN_OWNER, sevOf, type SkinLog } from './skinTypes';

export type SkinSnapshot = {
  kind: 'kkom-skin-backup'; v: 1; owner: string; exportedAt: string;
  collections: Record<string, Record<string, unknown>>;
};

export async function snapshotSkin(db: Firestore): Promise<SkinSnapshot> {
  const collections: SkinSnapshot['collections'] = {};
  for (const c of await db.doc(`skin/${SKIN_OWNER}`).listCollections()) {
    const qs = await c.get();
    collections[c.id] = Object.fromEntries(qs.docs.map((d) => [d.id, d.data()]));
  }
  return { kind: 'kkom-skin-backup', v: 1, owner: SKIN_OWNER, exportedAt: new Date().toISOString(), collections };
}

// ── Claude 상담 사용량(skin/kkomi/chatUsage/{날짜}) → 대략 비용. 정확한 청구는 Anthropic 콘솔 기준.
export type ChatUsageDay = { count?: number; inTok?: number; outTok?: number; cacheRead?: number; cacheWrite?: number; model?: string };

// 1M 토큰당 달러(입력·출력·캐시 읽기·5분 캐시 쓰기). 모르는 모델은 비싼 쪽으로 셈.
const PRICES: [RegExp, [number, number, number, number]][] = [
  [/opus-5-5/, [4, 20, 0.2, 5]],
  [/./, [5, 25, 0.5, 6.25]],
];

export function usageCost(u: ChatUsageDay): number {
  const [i, o, r, w] = PRICES.find(([re]) => re.test(u.model ?? ''))![1];
  return ((u.inTok ?? 0) * i + (u.outTok ?? 0) * o + (u.cacheRead ?? 0) * r + (u.cacheWrite ?? 0) * w) / 1e6;
}

export function sumUsage(days: ChatUsageDay[]): Required<Omit<ChatUsageDay, 'model'>> & { cost: number } {
  const z = { count: 0, inTok: 0, outTok: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
  for (const u of days) {
    z.count += u.count ?? 0; z.inTok += u.inTok ?? 0; z.outTok += u.outTok ?? 0;
    z.cacheRead += u.cacheRead ?? 0; z.cacheWrite += u.cacheWrite ?? 0; z.cost += usageCost(u);
  }
  return z;
}

// ── 메일 본문용 하루 한 줄
const WD = ['일', '월', '화', '수', '목', '금', '토'];
export const weekdayKo = (date: string) => WD[new Date(date + 'T00:00:00Z').getUTCDay()];
export const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

export function dayLine(l: SkinLog): string {
  const med = { taken: '약 먹음', missed: '약 거름', late: '약 늦게', none: '' }[medOf(l) ?? 'none'];
  const parts = [
    sevOf(l) != null ? `점수 ${sevOf(l)}/10${l.itch10 != null || l.redness != null ? ` (가려움 ${l.itch10 ?? '-'} · 붉어짐 ${l.redness ?? '-'})` : ''}` : '점수 안 적음',
    med,
    l.angioedema?.present ? `붓기${l.angioedema.areas.length ? ` ${l.angioedema.areas.join('·')}` : ''}` : '',
    l.triggers?.length ? `의심 ${l.triggers.join('·')}` : '',
    l.period ? `생리 중${l.cycleDay ? ` ${l.cycleDay}일째` : ''}` : '',
    l.photos?.length ? `사진 ${l.photos.length}장` : '',
    l.note ? `메모 「${l.note.replace(/\s+/g, ' ').slice(0, 60)}${l.note.length > 60 ? '…' : ''}」` : '',
    ...MEMO_SLOTS.map((k) => (l.memos?.[k]?.trim() ? `${MEMO_SLOT_LABEL[k]} 「${l.memos[k].replace(/\s+/g, ' ').slice(0, 40)}${l.memos[k].length > 40 ? '…' : ''}」` : '')),
  ].filter(Boolean);
  return `${md(l.date)}(${weekdayKo(l.date)}) ${parts.join(' · ')}`;
}
