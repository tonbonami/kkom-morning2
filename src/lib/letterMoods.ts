// 편지 분위기 — 사람이 직접 고른 값만 저장한다. 본문을 읽어 자동 추측하지 않는다.
export const LETTER_MOODS = [
  {
    id: 'default',
    label: '기본',
    emoji: '💌',
    kkulSrc: '/emo/kkuldaeng/mood/calm.png',
    kkomSrc: '/emo/saidami/calm.webp',
    envelopeAccent: null,
  },
  {
    id: 'love',
    label: '사랑해',
    emoji: '❤️',
    kkulSrc: '/emo/kkuldaeng/mood/love.png',
    kkomSrc: '/emo/saidami/love.webp',
    envelopeAccent: 'rose',
  },
  {
    id: 'thanks',
    label: '고마워',
    emoji: '🙏',
    kkulSrc: '/emo/kkuldaeng/mood/thanks.png',
    kkomSrc: '/emo/saidami/thanks.webp',
    envelopeAccent: 'honey',
  },
  {
    id: 'sorry',
    label: '미안해',
    emoji: '🥺',
    kkulSrc: '/emo/kkuldaeng/mood/sorry.png',
    kkomSrc: '/emo/saidami/sorry.webp',
    envelopeAccent: 'sky',
  },
  {
    id: 'cheer',
    label: '힘내',
    emoji: '💪',
    kkulSrc: '/emo/kkuldaeng/mood/happy.png',
    kkomSrc: '/emo/saidami/happy.webp',
    envelopeAccent: 'sage',
  },
  {
    id: 'missing',
    label: '보고싶어',
    emoji: '🫶',
    kkulSrc: '/emo/kkuldaeng/mood/missing.png',
    kkomSrc: '/emo/saidami/missing.webp',
    envelopeAccent: 'ruled',
  },
  {
    id: 'celebrate',
    label: '축하해',
    emoji: '🎉',
    kkulSrc: '/emo/kkuldaeng/mood/excited.png',
    kkomSrc: '/emo/saidami/excited.webp',
    envelopeAccent: 'honey',
  },
] as const;

export type LetterMood = (typeof LETTER_MOODS)[number]['id'];
export type LetterMoodConfig = (typeof LETTER_MOODS)[number];
export type LetterMoodEnvelopeAccent = Exclude<LetterMoodConfig['envelopeAccent'], null>;

export function isLetterMood(value: unknown): value is LetterMood {
  return typeof value === 'string' && LETTER_MOODS.some((mood) => mood.id === value);
}

export function letterMoodById(value?: string | null): LetterMoodConfig {
  return LETTER_MOODS.find((mood) => mood.id === value) ?? LETTER_MOODS[0];
}

export function letterMoodImage(value: string | null | undefined, from: '우댕' | '꼼이'): string {
  const mood = letterMoodById(value);
  return from === '우댕' ? mood.kkulSrc : mood.kkomSrc;
}

const preloadedMoodImages = new Map<string, HTMLImageElement>();

export function preloadLetterMoodImage(src: string): void {
  if (typeof Image === 'undefined' || preloadedMoodImages.has(src)) return;
  const image = new Image();
  preloadedMoodImages.set(src, image); // 참조를 잡아 둬 봉투를 누르기 전에 디코딩 결과가 버려지지 않게 한다.
  image.src = src;
  void image.decode?.().catch(() => {});
}
