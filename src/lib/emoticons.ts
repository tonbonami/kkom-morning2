export type EmoticonAssetType = 'png' | 'webp' | 'gif';

export type EmoticonSet = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  emoticonIds: string[];
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

export const EMOTICON_SETS: EmoticonSet[] = [
  {
    id: 'pochacco_daily',
    title: '사랑 빠샤',
    description: '사랑 고백과 응원을 또렷하게 보내요.',
    thumbnailUrl: '/imoticon/pochacco-love/1.png',
    emoticonIds: POCHACCO_LOVE_SET_IDS,
  },
];

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
