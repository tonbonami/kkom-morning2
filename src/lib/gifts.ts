// 두고 가기 — 상대 홈 마스코트(살아있는 꼼이)에 소품을 살짝 얹어 두고 온다. 쓰다듬기의 '주는' 짝.
//   gifts/{받는이} doc 의 items[] 에 '쌓는다'(최대 3개, 넘치면 오래된 것부터 밀어냄). 받는 쪽이
//   톡 누르면 전부 지워진다(고마워). 캡션 메시지는 '가장 최근' 선물 것만 보여준다(우댕 요청).
import { db } from './firebase';
import { doc, setDoc, getDoc, onSnapshot, deleteDoc, Timestamp } from 'firebase/firestore';
import { partnerOf } from './letters';

// 소품 — 공통(보살핌, 누구든 서로에게) + 받는 사람 최애. 이미지 /emo/gifts/{id}.png.
// 2026-11-22 사이담 선물함 개편을 옮겨 칸 6개 + 추천 탭으로 정리했다.
// ⚠️ 받은 선물이 id로 그림을 찾으므로 안 쓰는 항목도 지우지 않고 hidden으로만 숨긴다.
// ⚠️ 꼼모닝의 for 값은 받는 사람 최애를 가르는 기존 규칙이라 그대로 둔다.
export type GiftCat = 'fridge' | 'care' | 'drawer' | 'dolls' | 'charm' | 'coupon';
export type GiftItem = {
  id: string;
  label: string;
  for: 'all' | '우댕' | '꼼이';
  msg: string;
  cat: GiftCat;
  hidden?: true;
};
export const GIFT_ITEMS: GiftItem[] = [
  // 🧊 냉장고 — 먹을거·음료
  { id: 'chicken',     label: '치킨',          for: '꼼이', msg: '맛있는 거 먹어 🍗',        cat: 'fridge' },
  { id: 'watermelon',  label: '수박',          for: '꼼이', msg: '시원하게 한 입',           cat: 'fridge' },
  { id: 'pizza',       label: '피자',          for: '꼼이', msg: '오늘은 좀 시켜먹자',       cat: 'fridge' },
  { id: 'cake',        label: '딸기케이크',     for: '꼼이', msg: '달달한 거 먹고 기분 풀어', cat: 'fridge' },
  { id: 'tiramisu',    label: '티라미수',      for: 'all',  msg: '달콤하게 쉬어',            cat: 'fridge' },
  { id: 'icecream',    label: '아이스크림',    for: 'all',  msg: '시원한 거 하나',           cat: 'fridge' },
  { id: 'saltbread',   label: '소금빵',        for: 'all',  msg: '겉바속촉 하나',            cat: 'fridge' },
  { id: 'popcorn',     label: '팝콘',          for: 'all',  msg: '같이 영화 볼까',           cat: 'fridge' },
  { id: 'bagel',       label: '베이글',        for: 'all',  msg: '아침 거르지 마',           cat: 'fridge' },
  { id: 'nurungji',    label: '누룽지',        for: '우댕', msg: '속 편한 거 먹어',          cat: 'fridge' },
  { id: 'cookie',      label: '과자',          for: '우댕', msg: '당 충전해',               cat: 'fridge' },
  { id: 'bread',       label: '빵',            for: '우댕', msg: '든든하게 챙겨먹어',        cat: 'fridge' },
  { id: 'coffee',      label: '커피',          for: '우댕', msg: '오늘도 힘내',             cat: 'fridge' },
  { id: 'cocoa',       label: '따뜻한 코코아',  for: 'all',  msg: '몸 좀 녹여',              cat: 'fridge' },
  { id: 'matchalatte', label: '말차라떼',      for: 'all',  msg: '나른할 때 한 잔',          cat: 'fridge' },
  { id: 'bungeoppang', label: '붕어빵',        for: 'all',  msg: '겨울 간식 하나 🐟',        cat: 'fridge' },
  { id: 'tteokbokki',  label: '떡볶이',        for: 'all',  msg: '매콤한 거 땡길 때',        cat: 'fridge' },
  { id: 'tangerine',   label: '귤',            for: 'all',  msg: '까먹으면서 쉬어 🍊',       cat: 'fridge' },
  { id: 'sweetpotato', label: '군고구마',      for: 'all',  msg: '호호 불면서',              cat: 'fridge' },
  { id: 'ramen',       label: '라면',          for: 'all',  msg: '야식 콜? 🍜',             cat: 'fridge' },
  { id: 'samgyeopsal', label: '삼겹살',        for: 'all',  msg: '구워먹자 🥓',              cat: 'fridge' },
  { id: 'hoppang',     label: '호빵',          for: 'all',  msg: '한입 베면 겨울이야',       cat: 'fridge' },
  { id: 'eomuk',       label: '어묵',          for: 'all',  msg: '뜨끈한 국물까지',          cat: 'fridge' },
  { id: 'hotteok',     label: '호떡',          for: 'all',  msg: '꿀 조심, 뜨거워',          cat: 'fridge' },
  { id: 'yujatea',     label: '유자차',        for: 'all',  msg: '따뜻하게 마셔',            cat: 'fridge' },
  { id: 'manduguk',    label: '만둣국',        for: 'all',  msg: '만두 하나 더 줄게',        cat: 'fridge' },
  { id: 'danpatjuk',   label: '단팥죽',        for: 'all',  msg: '새알심 같이 먹자',         cat: 'fridge' },
  { id: 'porridge',    label: '죽',            for: 'all',  msg: '아플 땐 속 편하게',        cat: 'fridge' },
  { id: 'samgak',      label: '삼각김밥',      for: 'all',  msg: '바빠도 한입 챙겨',         cat: 'fridge' },
  { id: 'chocolate',   label: '초콜릿',        for: 'all',  msg: '당 떨어질 때 하나',        cat: 'fridge' },
  { id: 'sandwich',    label: '샌드위치',      for: 'all',  msg: '끼니 거르지 마',           cat: 'fridge' },
  { id: 'malatang',    label: '마라탕',        for: 'all',  msg: '얼얼하게 풀고 가자',       cat: 'fridge' },
  // 🩹 구급상자 — 아플 때·추울 때
  { id: 'vitamin',        label: '비타민',       for: 'all', msg: '아프지 말고',             cat: 'care' },
  { id: 'bandaid',        label: '하트 반창고',  for: 'all', msg: '속상한 거 다 나아라',      cat: 'care' },
  { id: 'blanket',        label: '담요',         for: 'all', msg: '따뜻하게 있어',            cat: 'care' },
  { id: 'umbrella',       label: '우산',         for: 'all', msg: '비 안 맞게',              cat: 'care' },
  { id: 'handwarmer',     label: '핫팩',         for: 'all', msg: '손 시릴 때 꼭 쥐어',       cat: 'care' },
  { id: 'scarf',          label: '목도리',       for: 'all', msg: '목 따뜻하게',              cat: 'care' },
  { id: 'mittens',        label: '벙어리장갑',   for: 'all', msg: '내 손인 척 끼고 있어',     cat: 'care' },
  { id: 'sleepsocks',     label: '수면양말',     for: 'all', msg: '발끝까지 포근해져',        cat: 'care' },
  { id: 'hotwaterbottle', label: '보온물주머니', for: 'all', msg: '배 따뜻하게 하고 있어',    cat: 'care' },
  { id: 'tissue',         label: '휴지',         for: 'all', msg: '울어도 괜찮아',           cat: 'care' },
  { id: 'energydrink',    label: '에너지음료',   for: 'all', msg: '조금만 더 힘내 보자',      cat: 'care' },
  { id: 'painkiller',     label: '진통제',       for: 'all', msg: '아픈 건 빨리 지나가길',    cat: 'care' },
  { id: 'thermometer',    label: '체온계',       for: 'all', msg: '오늘은 푹 쉬어',           cat: 'care' },
  { id: 'mask',           label: '마스크',       for: 'all', msg: '감기 조심하고 다녀',       cat: 'care' },
  { id: 'coolingpatch',   label: '쿨링시트',     for: 'all', msg: '열부터 천천히 식히자',      cat: 'care' },
  { id: 'digestive',      label: '소화제',       for: 'all', msg: '속 편해지면 좋겠다',       cat: 'care' },
  // 🗄️ 마음서랍 — 마음·축하
  { id: 'flower',      label: '꽃',          for: 'all',  msg: '그냥 네 생각나서',         cat: 'drawer' },
  { id: 'giftbox',     label: '선물',        for: 'all',  msg: '깜짝 선물이야',            cat: 'drawer' },
  { id: 'star',        label: '별',          for: 'all',  msg: '소원 하나 빌어',           cat: 'drawer' },
  { id: 'clover',      label: '네잎클로버',  for: 'all',  msg: '오늘 행운 있길',           cat: 'drawer' },
  { id: 'lovebattery', label: '사랑 배터리', for: 'all',  msg: '사랑 가득 충전 ⚡',        cat: 'drawer' },
  { id: 'sunset',      label: '노을',        for: 'all',  msg: '오늘 같이 보고 싶어',      cat: 'drawer' },
  { id: 'plant',       label: '화분',        for: 'all',  msg: '무럭무럭 자라자',          cat: 'drawer' },
  { id: 'firstsnow',   label: '첫눈',        for: 'all',  msg: '첫눈은 너랑 볼래',         cat: 'drawer' },
  { id: 'snowman',     label: '눈사람',      for: 'all',  msg: '우리 마음은 안 녹아',      cat: 'drawer' },
  { id: 'snowglobe',   label: '스노우볼',    for: 'all',  msg: '우리 겨울 담아 뒀어',      cat: 'drawer' },
  { id: 'crown',       label: '파티왕관',    for: '꼼이', msg: '오늘 제일 빛난 건 너야',   cat: 'drawer' },
  { id: 'cheerflag',   label: '응원깃발',    for: 'all',  msg: '네 편 여기 있어',          cat: 'drawer' },
  { id: 'letter',      label: '편지봉투',    for: 'all',  msg: '네게 꼭 전하고 싶었어',    cat: 'drawer' },
  { id: 'goldmedal',   label: '금메달',      for: 'all',  msg: '오늘의 주인공은 너야',     cat: 'drawer' },
  { id: 'gradcap',     label: '졸업모',      for: 'all',  msg: '새로운 시작을 축하해',     cat: 'drawer' },
  { id: 'popper',      label: '축하폭죽',    for: 'all',  msg: '진짜 진짜 축하해',         cat: 'drawer' },
  { id: 'princecrown', label: '파란 왕관',   for: '우댕', msg: '오늘 제일 멋졌어 👑',      cat: 'drawer' },
  // 🧸 인형바구니
  { id: 'puppy',          label: '강아지 인형', for: '우댕', msg: '귀여운 거 보고 기분 풀어', cat: 'dolls' },
  { id: 'kkuldoll',       label: '꿀됑 인형',   for: '꼼이', msg: '나 대신 꼭 안고 자 🐷',    cat: 'dolls' },
  // 사이담의 꿀됑 인형 — 꼼모닝엔 원래 kkuldoll(같은 이름·거의 같은 그림, 꼼이 최애)이 있어 겹치므로 숨긴다(받은 선물 그림용으로 정의는 남김)
  { id: 'kkuldoengdoll',  label: '꿀됑 인형',   for: 'all',  msg: '나 대신 꼭 안고 자',         cat: 'dolls', hidden: true },
  { id: 'kkwagidoll',     label: '꽉이 인형',   for: 'all',  msg: '걱정은 내가 안고 있을게',     cat: 'dolls' },
  { id: 'bbeonidoll',     label: '뻐니 인형',   for: 'all',  msg: '오늘도 네 옆에 있을게',       cat: 'dolls' },
  { id: 'beardoll',       label: '곰 인형',     for: 'all',  msg: '꼭 안고 푹 쉬어',            cat: 'dolls' },
  { id: 'rabbitdoll',     label: '토끼 인형',   for: 'all',  msg: '말랑한 위로 하나',           cat: 'dolls' },
  { id: 'kkokadoll',      label: '꼬까 인형',   for: 'all',  msg: '웃는 얼굴 보고 힘내',         cat: 'dolls' },
  { id: 'kkapydoll',      label: '까삐 인형',   for: 'all',  msg: '느긋하게 쉬어 가자',          cat: 'dolls' },
  // 🐟 부적
  { id: 'charmkkwagi',    label: '꽉이 부적',     for: 'all', msg: '오늘 걱정은 꽉이가 맡을게', cat: 'charm' },
  { id: 'charmkkomi',     label: '꼼이 부적',     for: 'all', msg: '아프지 말고 튼튼하자',    cat: 'charm' },
  { id: 'charmkkoka',     label: '꼬까 부적',     for: 'all', msg: '좋은 결과가 찰싹 붙길',   cat: 'charm' },
  { id: 'charmkkuldoeng', label: '꿀됑 부적',     for: 'all', msg: '좋은 인연만 찾아오길',    cat: 'charm' },
  { id: 'charmkkapy',     label: '까삐 부적',     for: 'all', msg: '오늘도 무사히 돌아와',    cat: 'charm' },
  { id: 'charmpouch',     label: '복주머니 부적', for: 'all', msg: '좋은 운만 가득 담아',      cat: 'charm' },
  { id: 'charmtiger',     label: '호랑이 부적',   for: 'all', msg: '겁먹지 마 넌 할 수 있어', cat: 'charm' },
  { id: 'charmcoin',      label: '엽전 부적',     for: 'all', msg: '돈복이 술술 들어오길',    cat: 'charm' },
  // 🎟️ 쿠폰함
  { id: 'massagecoupon',   label: '안마쿠폰',       for: 'all', msg: '뭉친 데 풀어줄게',          cat: 'coupon' },
  { id: 'kisscoupon',      label: '뽀뽀쿠폰',       for: 'all', msg: '이거 쓰면 뽀뽀 한 번 💋', cat: 'coupon' },
  { id: 'piggybackcoupon', label: '업어주기쿠폰',   for: 'all', msg: '이거 쓰면 업어줄게',        cat: 'coupon' },
  { id: 'coffeecoupon',    label: '커피쿠폰',       for: 'all', msg: '다음 커피는 내가 살게',      cat: 'coupon' },
  { id: 'mealcoupon',      label: '밥 한 끼 쿠폰',  for: 'all', msg: '오늘 밥은 내가 살게',        cat: 'coupon' },
  { id: 'talkcoupon',      label: '고민 상담 쿠폰', for: 'all', msg: '오늘은 끝까지 들어줄게',      cat: 'coupon' },
  { id: 'walkcoupon',      label: '같이 산책 쿠폰', for: 'all', msg: '같이 걷고 바람 쐬자',        cat: 'coupon' },
  { id: 'moviecoupon',     label: '영화 보기 쿠폰', for: 'all', msg: '보고 싶던 영화 같이 보자',    cat: 'coupon' },
  // 숨김 — 고르는 화면에서만 뺀다. 꼼모닝 최애인 cookie·bread·princecrown은 위에서 보이게 유지했다.
  { id: 'injeolmi',  label: '인절미',     for: 'all', msg: '쫀득한 거 먹자',      cat: 'fridge', hidden: true },
  { id: 'icematcha', label: '아이스말차', for: 'all', msg: '시원한 말차 한 잔',   cat: 'fridge', hidden: true },
  { id: 'dakkochi',  label: '닭꼬치',     for: 'all', msg: '포장마차 가자',       cat: 'fridge', hidden: true },
  { id: 'guitar',    label: '기타',       for: 'all', msg: '노래 하나 불러줘',    cat: 'drawer', hidden: true },
  { id: 'book',      label: '책',         for: 'all', msg: '쉬면서 읽어',        cat: 'drawer', hidden: true },
];

/** 칸 — 고르는 화면의 위 가로 탭 순서(맨 앞 「추천」은 화면이 붙인다). */
export const GIFT_STORAGES: { id: GiftCat; title: string; icon: string }[] = [
  { id: 'fridge', title: '냉장고',     icon: '🧊' },
  { id: 'care',   title: '구급상자',   icon: '🩹' },
  { id: 'drawer', title: '마음서랍',   icon: '🗄️' },
  { id: 'dolls',  title: '인형바구니', icon: '🧸' },
  { id: 'charm',  title: '부적',       icon: '🐟' },
  { id: 'coupon', title: '쿠폰함',     icon: '🎟️' },
];
/** 「추천」 탭 — 아픔·끼니·속상함·피로·응원·위로·애정·약속. 순서는 한국 날짜마다 돌린다. */
export const GIFT_PICKS = ['vitamin', 'porridge', 'bandaid', 'chocolate', 'cheerflag', 'puppy', 'flower', 'coffeecoupon'];
export function giftPicksToday(now: Date = new Date()): string[] {
  const k = Math.floor((now.getTime() + 9 * 3600e3) / 86400e3) % GIFT_PICKS.length;
  return [...GIFT_PICKS.slice(k), ...GIFT_PICKS.slice(0, k)];
}
/** 추천의 강아지 인형 자리는 받는 사람 최애 짝으로 바꿔, 기존 for 규칙을 지키면서도 8개를 유지한다. */
export function giftPicksFor(receiver: string, now: Date = new Date()): string[] {
  return giftPicksToday(now).map((id) => (id === 'puppy' && receiver === '꼼이' ? 'kkuldoll' : id));
}
export const giftImg = (id: string) => `/emo/gifts/${id}.png`;
export const giftsFor = (receiver: string): GiftItem[] =>
  GIFT_ITEMS.filter((g) => !g.hidden && (g.for === 'all' || g.for === receiver));
export const giftById = (id: string): GiftItem | undefined => GIFT_ITEMS.find((g) => g.id === id);

export interface Gift { from: string; item: string; at: Date | null; nonce: string; }

export const MAX_GIFTS = 3;   // 한 번에 쌓을 수 있는 선물 수

type RawEntry = { from?: string; item?: string; at?: Timestamp | null; nonce?: string };
// 문서에서 목록 추출 — 신규 items[] 또는 레거시 단일({item,nonce}) 둘 다 읽는다(과거 데이터 호환).
function readItems(d: Record<string, unknown> | undefined): RawEntry[] {
  if (!d) return [];
  if (Array.isArray(d.items)) return (d.items as RawEntry[]).filter((x) => x?.item && x?.nonce);
  const legacy = d as RawEntry;
  return legacy.item && legacy.nonce ? [legacy] : [];
}

// 두고 가기 — 상대 gifts/{받는이}.items 에 쌓는다(최대 MAX_GIFTS, 오래된 것부터 밀어냄).
//   한 번에 여러 개(최대 3, 같은 것 여러 번 가능 — "인형 3개") 고른 걸 한 번에 쓴다(우댕 요청 2026-10-15).
// ⚠️ Firestore는 배열 '원소 안'에 serverTimestamp() sentinel을 못 넣는다 → 클라 Timestamp.now() 사용.
export async function giveGifts(from: string, itemIds: string[]): Promise<void> {
  if (!from || !itemIds.length) return;
  const to = partnerOf(from);
  const now = Date.now();
  const entries: RawEntry[] = itemIds.slice(0, MAX_GIFTS).map((item, i) => ({
    from, item, at: Timestamp.fromMillis(now + i),   // 순서 보존(같은 ms 방지)
    nonce: `${now + i}_${Math.random().toString(36).slice(2, 8)}`,
  }));
  const ref = doc(db, 'gifts', to);
  try {
    const snap = await getDoc(ref);
    const items = [...readItems(snap.data()), ...entries].slice(-MAX_GIFTS);   // 최근 3개만 유지
    await setDoc(ref, { items });
  } catch (e) { console.warn('두고 가기 실패:', e); }
}
export const giveGift = (from: string, itemId: string) => giveGifts(from, [itemId]);

// 고른 것들 한 줄 요약 — 같은 거면 "꿀됑 인형 3개", 섞이면 "치킨·꽃·담요".
export function giftSummary(itemIds: string[]): string {
  const labels = itemIds.map((id) => giftById(id)?.label ?? '선물');
  if (!labels.length) return '선물';
  return labels.every((l) => l === labels[0])
    ? (labels.length > 1 ? `${labels[0]} ${labels.length}개` : labels[0])
    : labels.join('·');
}

// 내가 받은 소품 목록 구독(오래된→최신 순, 마지막이 가장 최근).
export function subscribeGifts(me: string, cb: (gifts: Gift[]) => void): () => void {
  if (!me) { cb([]); return () => {}; }
  return onSnapshot(
    doc(db, 'gifts', me),
    (snap) => cb(readItems(snap.data() as Record<string, unknown> | undefined).map((x) => ({
      from: x.from ?? '', item: x.item as string, at: x.at?.toDate?.() ?? null, nonce: x.nonce as string,
    }))),
    () => cb([]),
  );
}

// 받았어(고마워) — 전부 지운다.
export async function clearGifts(me: string): Promise<void> {
  if (!me) return;
  try { await deleteDoc(doc(db, 'gifts', me)); } catch { /* noop */ }
}
