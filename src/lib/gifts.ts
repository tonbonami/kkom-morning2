// 두고 가기 — 상대 홈 마스코트(살아있는 꼼이)에 소품을 살짝 얹어 두고 온다. 쓰다듬기의 '주는' 짝.
//   gifts/{받는이} 단일 doc(한 번에 하나, 최신으로 덮어씀). 받는 쪽이 톡 누르면 지워진다(고마워).
import { db } from './firebase';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { partnerOf } from './letters';

// 소품 — 공통(보살핌, 누구든 서로에게) + 받는 사람 최애. 이미지 /emo/gifts/{id}.png (투명 256, ChatGPT 그림).
//   msg = 그 소품이 대신 건네는 '짧은 말'. 굳이 메시지 안 써도 그림 하나가 한마디가 된다(부담 없는 작은 신호).
// cat = 선물함 수납장(🧊냉장고 먹을거·음료 / 🗄️서랍 마음·보살핌 / 🎟️쿠폰 / 👑보물상자).
export type GiftCat = 'fridge' | 'drawer' | 'coupon' | 'special';
export type GiftItem = { id: string; label: string; for: 'all' | '우댕' | '꼼이'; msg: string; cat: GiftCat };
export const GIFT_ITEMS: GiftItem[] = [
  // 🧊 냉장고 — 먹을거·음료
  { id: 'chicken',     label: '치킨',       for: '꼼이', msg: '맛있는 거 먹어 🍗',        cat: 'fridge' },
  { id: 'watermelon',  label: '수박',       for: '꼼이', msg: '시원하게 한 입',           cat: 'fridge' },
  { id: 'pizza',       label: '피자',       for: '꼼이', msg: '오늘은 좀 시켜먹자',       cat: 'fridge' },
  { id: 'cake',        label: '딸기케이크',  for: '꼼이', msg: '달달한 거 먹고 기분 풀어', cat: 'fridge' },
  { id: 'injeolmi',    label: '인절미',     for: 'all',  msg: '쫀득한 거 먹자',           cat: 'fridge' },
  { id: 'tiramisu',    label: '티라미수',   for: 'all',  msg: '달콤하게 쉬어',            cat: 'fridge' },
  { id: 'icecream',    label: '아이스크림', for: 'all',  msg: '시원한 거 하나',           cat: 'fridge' },
  { id: 'saltbread',   label: '소금빵',     for: 'all',  msg: '겉바속촉 하나',            cat: 'fridge' },
  { id: 'popcorn',     label: '팝콘',       for: 'all',  msg: '같이 영화 볼까',           cat: 'fridge' },
  { id: 'bagel',       label: '베이글',     for: 'all',  msg: '아침 거르지 마',           cat: 'fridge' },
  { id: 'nurungji',    label: '누룽지',     for: '우댕', msg: '속 편한 거 먹어',          cat: 'fridge' },
  { id: 'cookie',      label: '과자',       for: '우댕', msg: '당 충전해',               cat: 'fridge' },
  { id: 'bread',       label: '빵',         for: '우댕', msg: '든든하게 챙겨먹어',        cat: 'fridge' },
  { id: 'coffee',      label: '커피',       for: '우댕', msg: '오늘도 힘내',             cat: 'fridge' },
  { id: 'cocoa',       label: '따뜻한 코코아', for: 'all', msg: '몸 좀 녹여',             cat: 'fridge' },
  { id: 'matchalatte', label: '말차라떼',   for: 'all',  msg: '나른할 때 한 잔',          cat: 'fridge' },
  { id: 'icematcha',   label: '아이스말차', for: 'all',  msg: '시원한 말차 한 잔',        cat: 'fridge' },
  // 🗄️ 서랍 — 마음·보살핌
  { id: 'blanket',     label: '담요',       for: 'all',  msg: '따뜻하게 있어',            cat: 'drawer' },
  { id: 'flower',      label: '꽃',         for: 'all',  msg: '그냥 네 생각나서',         cat: 'drawer' },
  { id: 'umbrella',    label: '우산',       for: 'all',  msg: '비 안 맞게',              cat: 'drawer' },
  { id: 'giftbox',     label: '선물',       for: 'all',  msg: '깜짝 선물이야',            cat: 'drawer' },
  { id: 'puppy',       label: '강아지',     for: '우댕', msg: '귀여운 거 보고 기분 풀어', cat: 'drawer' },
  { id: 'book',        label: '책',         for: 'all',  msg: '쉬면서 읽어',             cat: 'drawer' },
  { id: 'vitamin',     label: '비타민',     for: 'all',  msg: '아프지 말고',             cat: 'drawer' },
  { id: 'plant',       label: '화분',       for: 'all',  msg: '무럭무럭 자라자',          cat: 'drawer' },
  { id: 'star',        label: '별',         for: 'all',  msg: '소원 하나 빌어',           cat: 'drawer' },
  { id: 'clover',      label: '네잎클로버', for: 'all',  msg: '오늘 행운 있길',           cat: 'drawer' },
  { id: 'bandaid',     label: '하트 반창고', for: 'all', msg: '속상한 거 다 나아라',      cat: 'drawer' },
  { id: 'lovebattery', label: '사랑 배터리', for: 'all', msg: '사랑 가득 충전 ⚡',        cat: 'drawer' },
  { id: 'sunset',      label: '노을',       for: 'all',  msg: '오늘 같이 보고 싶어',      cat: 'drawer' },
  { id: 'guitar',      label: '기타',       for: 'all',  msg: '노래 하나 불러줘',         cat: 'drawer' },
  // 🎟️ 쿠폰
  { id: 'massagecoupon', label: '안마쿠폰', for: 'all',  msg: '뭉친 데 풀어줄게',         cat: 'coupon' },   // 강아지 안마
  { id: 'kisscoupon',  label: '뽀뽀쿠폰',   for: 'all',  msg: '이거 쓰면 뽀뽀 한 번 💋',  cat: 'coupon' },
  // 👑 보물상자
  { id: 'crown',       label: '공주왕관',   for: '꼼이', msg: '오늘도 꼼이가 최고 👑',    cat: 'special' },
];

export const GIFT_STORAGES: { id: GiftCat; title: string; icon: string }[] = [
  { id: 'fridge',  title: '먹을거 냉장고', icon: '🧊' },
  { id: 'drawer',  title: '마음 서랍',     icon: '🗄️' },
  { id: 'coupon',  title: '쿠폰함',        icon: '🎟️' },
  { id: 'special', title: '보물상자',      icon: '👑' },
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
