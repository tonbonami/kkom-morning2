// 두고 가기 — 상대 홈 마스코트(살아있는 꼼이)에 소품을 살짝 얹어 두고 온다. 쓰다듬기의 '주는' 짝.
//   gifts/{받는이} 단일 doc(한 번에 하나, 최신으로 덮어씀). 받는 쪽이 톡 누르면 지워진다(고마워).
import { db } from './firebase';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { partnerOf } from './letters';

// 소품 — 공통(보살핌, 누구든 서로에게) + 받는 사람 최애. 이미지 /emo/gifts/{id}.png (투명 256, ChatGPT 그림).
//   msg = 그 소품이 대신 건네는 '짧은 말'. 굳이 메시지 안 써도 그림 하나가 한마디가 된다(부담 없는 작은 신호).
export type GiftItem = { id: string; label: string; for: 'all' | '우댕' | '꼼이'; msg: string };
export const GIFT_ITEMS: GiftItem[] = [
  { id: 'blanket',    label: '담요',       for: 'all',  msg: '따뜻하게 있어' },
  { id: 'flower',     label: '꽃',         for: 'all',  msg: '그냥 네 생각나서' },
  { id: 'cocoa',      label: '따뜻한 코코아', for: 'all', msg: '몸 좀 녹여' },
  { id: 'giftbox',    label: '선물',       for: 'all',  msg: '깜짝 선물이야' },
  { id: 'umbrella',   label: '우산',       for: 'all',  msg: '비 안 맞게' },
  { id: 'injeolmi',   label: '인절미',     for: 'all',  msg: '쫀득한 거 먹자' },   // 둘 다 좋아함
  { id: 'chicken',    label: '치킨',       for: '꼼이', msg: '맛있는 거 먹어 🍗' },
  { id: 'watermelon', label: '수박',       for: '꼼이', msg: '시원하게 한 입' },
  { id: 'pizza',      label: '피자',       for: '꼼이', msg: '오늘은 좀 시켜먹자' },
  { id: 'cake',       label: '딸기케이크',  for: '꼼이', msg: '달달한 거 먹고 기분 풀어' },
  { id: 'nurungji',   label: '누룽지',     for: '우댕', msg: '속 편한 거 먹어' },
  { id: 'cookie',     label: '과자',       for: '우댕', msg: '당 충전해' },
  { id: 'bread',      label: '빵',         for: '우댕', msg: '든든하게 챙겨먹어' },
  { id: 'coffee',     label: '커피',       for: '우댕', msg: '오늘도 힘내' },
  { id: 'puppy',      label: '강아지',     for: '우댕', msg: '귀여운 거 보고 기분 풀어' },
  // ── 추가분(2026-09-17, 우댕→꼼이 그림 12종). 대부분 '누구든'이라 공통, 왕관만 꼼이 전용 ──
  { id: 'tiramisu',     label: '티라미수',   for: 'all',  msg: '달콤하게 쉬어' },
  { id: 'icecream',     label: '아이스크림', for: 'all',  msg: '시원한 거 하나' },
  { id: 'saltbread',    label: '소금빵',     for: 'all',  msg: '겉바속촉 하나' },
  { id: 'matchalatte',  label: '말차라떼',   for: 'all',  msg: '나른할 때 한 잔' },
  { id: 'icematcha',    label: '아이스말차', for: 'all',  msg: '시원한 말차 한 잔' },
  { id: 'popcorn',      label: '팝콘',       for: 'all',  msg: '같이 영화 볼까' },
  { id: 'bagel',        label: '베이글',     for: 'all',  msg: '아침 거르지 마' },
  { id: 'book',         label: '책',         for: 'all',  msg: '쉬면서 읽어' },
  { id: 'vitamin',      label: '비타민',     for: 'all',  msg: '아프지 말고' },
  { id: 'massagecoupon', label: '안마쿠폰',  for: 'all',  msg: '뭉친 데 풀어줄게' },   // 강아지가 안마받고 쉬는 그림
  { id: 'crown',        label: '공주왕관',   for: '꼼이', msg: '오늘도 꼼이가 최고 👑' },
];
export const giftImg = (id: string) => `/emo/gifts/${id}.png`;
export const giftsFor = (receiver: string): GiftItem[] =>
  GIFT_ITEMS.filter((g) => g.for === 'all' || g.for === receiver);
export const giftById = (id: string): GiftItem | undefined => GIFT_ITEMS.find((g) => g.id === id);

export interface Gift { from: string; item: string; at: Date | null; nonce: string; }

// 두고 가기 — 상대 gifts/{받는이} 덮어씀.
export async function giveGift(from: string, itemId: string): Promise<void> {
  if (!from) return;
  const to = partnerOf(from);
  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await setDoc(doc(db, 'gifts', to), { from, item: itemId, at: serverTimestamp(), nonce });
  } catch (e) { console.warn('두고 가기 실패:', e); }
}

// 내가 받은 소품 구독.
export function subscribeGift(me: string, cb: (g: Gift | null) => void): () => void {
  if (!me) { cb(null); return () => {}; }
  return onSnapshot(
    doc(db, 'gifts', me),
    (snap) => {
      const d = snap.data() as { from?: string; item?: string; at?: Timestamp; nonce?: string } | undefined;
      if (!d?.item || !d?.nonce) { cb(null); return; }
      cb({ from: d.from ?? '', item: d.item, at: d.at?.toDate?.() ?? null, nonce: d.nonce });
    },
    () => cb(null),
  );
}

// 받았어(고마워) — 지운다.
export async function clearGift(me: string): Promise<void> {
  if (!me) return;
  try { await deleteDoc(doc(db, 'gifts', me)); } catch { /* noop */ }
}
