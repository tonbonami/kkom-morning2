export type EmoticonAssetType = 'png' | 'webp' | 'gif';

import { ANIM_STICKERS, DANG_STICKERS, KKOM_STICKERS, KKUL_STICKERS, KKUL_ANIM, URI_STICKERS, SAI_STICKERS } from './stickerPacks';

export type EmoticonSet = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  emoticonIds: string[];
  owner?: '우댕' | '꼼이';   // 그 사람 캐릭터 팩 — 고르는 창에서 내 것 먼저
  animated?: boolean;        // 움짤 팩
};

export type Emoticon = {
  id: string;
  setId: string;
  label: string;
  meaning: string;
  notificationPhrase: string;
  imageUrl: string;
  assetType: EmoticonAssetType;
  animated?: boolean;
  thumbUrl?: string;         // 고르는 창 썸네일(움짤은 정지컷 — 여러 개 동시 재생 방지)
};

const POCHACCO_LOVE_SET_IDS = [
  'pochacco_love',
  'pochacco_mine',
  'pochacco_hug',
  'pochacco_miss_you',
  'pochacco_cheer',
  'pochacco_can_do',
  'pochacco_charge',
  'pochacco_best',
  'pochacco_my_side',
];

// 원본 /imoticon/Pochacco_love.png는 3x3 시트라서 개별 칸을 잘라서 연결한다.
// Claude 참고: 시트 교체 시 public/imoticon/pochacco-love/{1..9}.png만 다시 생성하면 된다.
export const EMOTICONS: Emoticon[] = [
  {
    id: 'pochacco_love',
    setId: 'pochacco_daily',
    label: '사랑해',
    meaning: '사랑한다',
    notificationPhrase: '사랑한다고',
    imageUrl: '/imoticon/pochacco-love/1.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_mine',
    setId: 'pochacco_daily',
    label: '내꺼야',
    meaning: '내꺼라고',
    notificationPhrase: '내꺼라고',
    imageUrl: '/imoticon/pochacco-love/2.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_hug',
    setId: 'pochacco_daily',
    label: '안아줘',
    meaning: '안아달라',
    notificationPhrase: '안아달라고',
    imageUrl: '/imoticon/pochacco-love/3.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_miss_you',
    setId: 'pochacco_daily',
    label: '보고싶어',
    meaning: '보고싶다',
    notificationPhrase: '보고싶다고',
    imageUrl: '/imoticon/pochacco-love/4.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_cheer',
    setId: 'pochacco_daily',
    label: '빠샤',
    meaning: '응원한다',
    notificationPhrase: '빠샤 응원한다고',
    imageUrl: '/imoticon/pochacco-love/5.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_can_do',
    setId: 'pochacco_daily',
    label: '할수있어',
    meaning: '할 수 있다',
    notificationPhrase: '할 수 있다고',
    imageUrl: '/imoticon/pochacco-love/6.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_charge',
    setId: 'pochacco_daily',
    label: '충전완료',
    meaning: '충전 완료',
    notificationPhrase: '충전 완료됐다고',
    imageUrl: '/imoticon/pochacco-love/7.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_best',
    setId: 'pochacco_daily',
    label: '최고야',
    meaning: '최고다',
    notificationPhrase: '최고라고',
    imageUrl: '/imoticon/pochacco-love/8.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_my_side',
    setId: 'pochacco_daily',
    label: '내편',
    meaning: '내 편이다',
    notificationPhrase: '내 편이라고',
    imageUrl: '/imoticon/pochacco-love/9.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_thanks',
    setId: 'legacy_hidden',
    label: '고마워',
    meaning: '고맙다',
    notificationPhrase: '고맙다고',
    imageUrl: '/pochacco/face_thanks.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_pat',
    setId: 'legacy_hidden',
    label: '토닥토닥',
    meaning: '토닥토닥',
    notificationPhrase: '토닥토닥',
    imageUrl: '/pochacco/face_calm.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_sorry',
    setId: 'legacy_hidden',
    label: '미안해',
    meaning: '미안하다',
    notificationPhrase: '미안하다고',
    imageUrl: '/pochacco/face_sorry.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_sleep',
    setId: 'legacy_hidden',
    label: '잘자',
    meaning: '잘 자라고',
    notificationPhrase: '잘 자라고',
    imageUrl: '/pochacco/face_sleepy.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_sad',
    setId: 'legacy_hidden',
    label: '속상해',
    meaning: '속상하다',
    notificationPhrase: '속상하다고',
    imageUrl: '/pochacco/face_sad.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_sulky',
    setId: 'legacy_hidden',
    label: '삐짐',
    meaning: '삐졌다',
    notificationPhrase: '삐졌다고',
    imageUrl: '/pochacco/face_sulky.png',
    assetType: 'png',
  },
];

// ── 꼼톡 서랍 팩을 편지 큰 이모티콘으로도 (우댕 「이모티콘도 큰거 다양하게 추가하게 해줘」 2026-11-07) ──
//   id = '팩/파일이름'(확장자·?v 뺌) — 그림 주소가 안 바뀌는 한 그대로라 옛 편지도 계속 보인다.
//   ⚠️ 파일 이름을 바꾸면 그 그림을 붙인 옛 편지에서 그림이 빠진다(알 수 없는 id 는 조용히 건너뜀).
const fileKey = (src: string) => src.split('?')[0].replace(/^.*\//, '').replace(/\.[a-z0-9]+$/i, '');
const stillOf = (src: string) => src.replace(/\.webp(\?.*)?$/, '-still.png$1');
const phraseOf = (word: string) => word.replace(/[!?~.…]+$/u, '').trim() || word;

type PackDef = {
  set: Omit<EmoticonSet, 'emoticonIds' | 'thumbnailUrl'>;
  prefix: string;
  items: { word: string; image: string; still?: string }[];
  thumbOf?: (item: { word: string; image: string; still?: string }) => string;
  assetType: EmoticonAssetType;
};

const PACKS: PackDef[] = [
  { set: { id: 'kkom_anim', title: '꼼이 움짤', description: '움직이는 꼼이', owner: '꼼이', animated: true },
    prefix: 'anim', items: ANIM_STICKERS, thumbOf: (s) => s.still ?? stillOf(s.image), assetType: 'webp' },
  { set: { id: 'kkom_sai', title: '말티푸', description: '꼼이가 하루에 제일 많이 하는 말', owner: '꼼이' },
    prefix: 'sai', items: SAI_STICKERS, assetType: 'webp' },
  { set: { id: 'kkul', title: '꿀됑', description: '꿀벌 조끼 꿀됑', owner: '우댕' },
    prefix: 'kkul', items: KKUL_STICKERS, assetType: 'webp' },
  { set: { id: 'kkul_anim', title: '꿀됑 움짤', description: '움직이는 꿀됑', owner: '우댕', animated: true },
    prefix: 'kkulanim', items: KKUL_ANIM, thumbOf: (s) => stillOf(s.image), assetType: 'webp' },
  { set: { id: 'uri', title: '우리', description: '꿀됑이랑 꼼이랑' },
    prefix: 'uri', items: URI_STICKERS, assetType: 'webp' },
  { set: { id: 'pochacco_dang', title: '포차코 우댕', description: '우댕 포차코' },
    prefix: 'pdang', items: DANG_STICKERS, assetType: 'png' },
  { set: { id: 'pochacco_kkom', title: '포차코 꼼이', description: '꼼이 포차코' },
    prefix: 'pkkom', items: KKOM_STICKERS, assetType: 'png' },
];

const PACK_SETS: EmoticonSet[] = [];
for (const pack of PACKS) {
  const ids: string[] = [];
  for (const item of pack.items) {
    const id = `${pack.prefix}/${fileKey(item.image)}`;
    if (EMOTICONS.some((e) => e.id === id)) continue;   // 같은 그림이 팩에 두 번 — 한 번만
    const thumb = pack.thumbOf ? pack.thumbOf(item) : undefined;
    EMOTICONS.push({
      id,
      setId: pack.set.id,
      label: item.word,
      meaning: item.word,
      notificationPhrase: phraseOf(item.word),
      imageUrl: item.image,
      assetType: pack.assetType,
      ...(pack.set.animated ? { animated: true } : {}),
      ...(thumb ? { thumbUrl: thumb } : {}),
    });
    ids.push(id);
  }
  const first = EMOTICONS.find((e) => e.id === ids[0]);
  PACK_SETS.push({ ...pack.set, emoticonIds: ids, thumbnailUrl: first?.thumbUrl ?? first?.imageUrl ?? '' });
}

// 순서 = 고르는 창 탭 순서(내 캐릭터 팩은 창에서 앞으로 당긴다 — emoticonSetsFor).
export const EMOTICON_SETS: EmoticonSet[] = [
  ...PACK_SETS,
  {
    id: 'pochacco_daily',
    title: '사랑 빠샤',
    description: '사랑 고백과 응원을 또렷하게 보내요.',
    thumbnailUrl: '/imoticon/pochacco-love/1.png',
    emoticonIds: POCHACCO_LOVE_SET_IDS,
  },
];

/** 고르는 창 탭 순서 — 보내는 사람 캐릭터 팩 먼저, 나머지는 원래 순서. */
export function emoticonSetsFor(me: string): EmoticonSet[] {
  const own = EMOTICON_SETS.filter((s) => s.owner === me);
  return [...own, ...EMOTICON_SETS.filter((s) => s.owner !== me)];
}

const EMOTICON_BY_ID = new Map(EMOTICONS.map((item) => [item.id, item]));

export function getEmoticonById(id: string): Emoticon | null {
  return EMOTICON_BY_ID.get(id) ?? null;
}

export function getEmoticonsByIds(ids?: string[] | null): Emoticon[] {
  if (!ids?.length) return [];
  return ids.map((id) => getEmoticonById(id)).filter((item): item is Emoticon => !!item);
}

export function subjectName(name: string): string {
  if (!name) return '';
  const last = name.charCodeAt(name.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return `${name}가`;
  const hasFinal = (last - 0xac00) % 28 !== 0;
  return `${name}${hasFinal ? '이가' : '가'}`;
}

export function buildEmoticonNotificationTitle(from: string, body: string, emoticonIds?: string[]): string {
  const emoticons = getEmoticonsByIds(emoticonIds);
  const hasBody = body.trim().length > 0;
  const sender = subjectName(from);

  if (hasBody && emoticons.length > 0) {
    return `💌 ${sender} 편지와 이모티콘을 보냈어`;
  }

  if (emoticons.length === 1) {
    return `💌 ${sender} ${emoticons[0].notificationPhrase} 이모티콘 보냈어`;
  }

  if (emoticons.length > 1) {
    return `💌 ${sender} ${emoticons[0].label} 이모티콘 외 ${emoticons.length - 1}개를 보냈어`;
  }

  return `💌 ${sender} 편지를 보냈어`;
}
