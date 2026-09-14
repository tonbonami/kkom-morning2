// 우연(Serendipity) — 둘이 '모르고' 같은 순간에 한 일만 건져 올린다.
//   빈도를 세지 않는다(오늘의 조각 철학). 오직 드문 겹침만 카드로.
//   v1 세 종류: 동시 입장 / 오랜만에 딱 맞춰 / 같은 걸 동시에.
//
// 저장: serendipity/{id}. id = `${type}_${5분버킷}` 이라, 같은 순간을 감지한
//   두 기기가 같은 문서에 써도 하나로 합쳐진다(멱등). seen 은 사람별로 따로 닫음.
import { db } from './firebase';
import {
  collection, doc, setDoc, updateDoc, onSnapshot,
  query, orderBy, limit, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { serverNow } from './presence';

export type SerendipityType = 'sync-entry' | 'reunion' | 'sync-action';

export interface Serendipity {
  id: string;
  type: SerendipityType;
  at: Date | null;
  gapSec: number;      // 두 사람 사이의 시간차(초)
  detail: string;      // sync-action 이면 이모지 등
  seen: Record<string, boolean>;
}

const BUCKET_MS = 5 * 60_000;   // 5분 버킷 — 양쪽 기기가 같은 순간을 같은 id 로

// 감지 시 1회 기록. 같은 (타입,버킷)이면 한 문서로 합쳐짐.
export async function recordSerendipity(
  type: SerendipityType,
  opts: { gapSec?: number; detail?: string } = {},
): Promise<void> {
  const id = `${type}_${Math.floor(serverNow() / BUCKET_MS)}`;
  try {
    await setDoc(
      doc(db, 'serendipity', id),
      { type, at: serverTimestamp(), gapSec: Math.round(opts.gapSec ?? 0), detail: opts.detail ?? '' },
      { merge: true },   // 양쪽이 같은 id 로 써도 하나. seen 은 건드리지 않음.
    );
  } catch (e) {
    console.warn('우연 기록 실패:', e);
  }
}

// 최근 우연 구독(최신순). 홈 카드가 '아직 안 본 것'만 골라 쓴다.
export function subscribeSerendipity(cb: (items: Serendipity[]) => void, max = 12): () => void {
  return onSnapshot(
    query(collection(db, 'serendipity'), orderBy('at', 'desc'), limit(max)),
    (snap) => {
      cb(snap.docs.map((d) => {
        const x = d.data() as {
          type?: SerendipityType; at?: Timestamp; gapSec?: number; detail?: string; seen?: Record<string, boolean>;
        };
        return {
          id: d.id,
          type: x.type ?? 'sync-entry',
          at: x.at?.toDate?.() ?? null,
          gapSec: x.gapSec ?? 0,
          detail: x.detail ?? '',
          seen: x.seen ?? {},
        };
      }));
    },
    (e) => console.warn('우연 구독 오류:', e),
  );
}

// 내가 이 우연을 봤다(카드 닫기). 사람별로 따로.
export async function markSerendipitySeen(id: string, me: string): Promise<void> {
  if (!me) return;
  try { await updateDoc(doc(db, 'serendipity', id), { [`seen.${me}`]: true }); } catch { /* 방금 만들어진 문서면 다음에 */ }
}

// 카드 문구 — 숫자는 최소, 애정은 말로.
export function serendipityLine(s: Serendipity): { icon: string; text: string } {
  const near = s.gapSec <= 1;
  switch (s.type) {
    case 'reunion':
      return { icon: '🍀', text: '한참 만이었는데 — 둘 다, 딱 지금 이 순간에 들어왔어.' };
    case 'sync-action':
      return {
        icon: s.detail || '💌',
        text: near
          ? `방금 거의 동시에, 둘 다 ${s.detail || '하트'} 를 보냈어.`
          : `방금 ${s.gapSec}초 차이로, 둘 다 ${s.detail || '하트'} 를 보냈어.`,
      };
    case 'sync-entry':
    default:
      return {
        icon: '✨',
        text: near
          ? '방금 거의 동시에, 둘 다 들어왔어.'
          : `방금 ${s.gapSec}초 차이로, 둘 다 들어왔어.`,
      };
  }
}
