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

// MVP용 임시 세트. 나중에 카톡 이모티콘처럼 직접 그린 PNG/WebP/GIF를 넣으면
// imageUrl만 교체하고 id/meaning은 유지해서 예전 편지도 깨지지 않게 한다.
export const EMOTICONS: Emoticon[] = [
  {
    id: 'pochacco_miss_you',
    setId: 'pochacco_daily',
    label: '보고싶어',
    meaning: '보고싶다',
    notificationPhrase: '보고싶다고',
    imageUrl: '/pochacco/face_missing.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_love',
    setId: 'pochacco_daily',
    label: '사랑해',
    meaning: '사랑한다',
    notificationPhrase: '사랑한다고',
    imageUrl: '/pochacco/face_love.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_thanks',
    setId: 'pochacco_daily',
    label: '고마워',
    meaning: '고맙다',
    notificationPhrase: '고맙다고',
    imageUrl: '/pochacco/face_thanks.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_cheer',
    setId: 'pochacco_daily',
    label: '힘내',
    meaning: '응원한다',
    notificationPhrase: '응원한다고',
    imageUrl: '/pochacco/face_excited.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_pat',
    setId: 'pochacco_daily',
    label: '토닥토닥',
    meaning: '토닥토닥',
    notificationPhrase: '토닥토닥',
    imageUrl: '/pochacco/face_calm.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_sorry',
    setId: 'pochacco_daily',
    label: '미안해',
    meaning: '미안하다',
    notificationPhrase: '미안하다고',
    imageUrl: '/pochacco/face_sorry.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_sleep',
    setId: 'pochacco_daily',
    label: '잘자',
    meaning: '잘 자라고',
    notificationPhrase: '잘 자라고',
    imageUrl: '/pochacco/face_sleepy.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_sad',
    setId: 'pochacco_daily',
    label: '속상해',
    meaning: '속상하다',
    notificationPhrase: '속상하다고',
    imageUrl: '/pochacco/face_sad.png',
    assetType: 'png',
  },
  {
    id: 'pochacco_sulky',
    setId: 'pochacco_daily',
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
    title: '포차코 마음',
    description: '보고싶음, 고마움, 응원 같은 짧은 마음을 보내요.',
    thumbnailUrl: '/pochacco/face_love.png',
    emoticonIds: EMOTICONS.filter((item) => item.setId === 'pochacco_daily').map((item) => item.id),
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
