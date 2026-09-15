// 두고 가기 — 상대 홈 마스코트(살아있는 꼼이)에 소품을 살짝 얹어 두고 온다. 쓰다듬기의 '주는' 짝.
//   gifts/{받는이} 단일 doc(한 번에 하나, 최신으로 덮어씀). 받는 쪽이 톡 누르면 지워진다(고마워).
import { db } from './firebase';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { partnerOf } from './letters';

// 소품 — 공통(보살핌, 누구든 서로에게) + 받는 사람 최애. 이미지 /emo/gifts/{id}.png (투명 256, ChatGPT 그림).
export type GiftItem = { id: string; label: string; for: 'all' | '우댕' | '꼼이' };
export const GIFT_ITEMS: GiftItem[] = [
  { id: 'blanket',    label: '담요',       for: 'all' },
  { id: 'flower',     label: '꽃',         for: 'all' },
  { id: 'cocoa',      label: '따뜻한 코코아', for: 'all' },
  { id: 'giftbox',    label: '선물',       for: 'all' },
  { id: 'umbrella',   label: '우산',       for: 'all' },
  { id: 'injeolmi',   label: '인절미',     for: 'all' },   // 둘 다 좋아함
  { id: 'chicken',    label: '치킨',       for: '꼼이' },
  { id: 'watermelon', label: '수박',       for: '꼼이' },
  { id: 'pizza',      label: '피자',       for: '꼼이' },
  { id: 'cake',       label: '딸기케이크',  for: '꼼이' },
  // 우댕 최애(누룽지·과자·빵·강아지)는 소품 그려지면 추가 → { for: '우댕' }
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
