import { db } from './firebase';
import { doc, setDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

export interface MoodOption {
  id: string;          // Firestore에 저장되는 키
  label: string;       // 사람이 읽는 이름 (툴팁/aria용)
  image: string;       // 포차코 표정 PNG 경로
  emojiFallback: string; // 이미지 못 띄울 때 / 레거시 호환
  // 이 기분만 움직인다(사이담과 동일 규칙). globals.css 의 .mood-* 클래스.
  // ⚠️ 전부 움직이면 고르는 화면이 시끄럽고 싸구려로 보인다 — 여섯뿐.
  anim?: 'bounce' | 'heartbeat' | 'doze' | 'sulk' | 'fume' | 'wobble';
}

// 12가지 표정 (3×4 그리드 — pochacco_faces.png + pochacco_faces2.png 마지막 줄)
export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'happy',   label: '행복',     image: '/pochacco/face_happy.png',   emojiFallback: '😊' },
  { id: 'love',    label: '사랑',     image: '/pochacco/face_love.png',    emojiFallback: '🥰', anim: 'heartbeat' },
  { id: 'excited', label: '신남',     image: '/pochacco/face_excited.png', emojiFallback: '😄', anim: 'bounce' },
  { id: 'calm',    label: '평온',     image: '/pochacco/face_calm.png',    emojiFallback: '😌' },
  { id: 'sleepy',  label: '졸림',     image: '/pochacco/face_sleepy.png',  emojiFallback: '😴', anim: 'doze' },
  { id: 'sad',     label: '슬픔',     image: '/pochacco/face_sad.png',     emojiFallback: '😢' },
  { id: 'angry',   label: '화남',     image: '/pochacco/face_angry.png',   emojiFallback: '😠', anim: 'fume' },
  { id: 'missing', label: '보고싶음',  image: '/pochacco/face_missing.png', emojiFallback: '🥺' },
  { id: 'sick',    label: '아픔',     image: '/pochacco/face_sick.png',    emojiFallback: '🤒', anim: 'wobble' },
  { id: 'sorry',   label: '미안',     image: '/pochacco/face_sorry.png',   emojiFallback: '🙏' },
  { id: 'thanks',  label: '고마워',   image: '/pochacco/face_thanks.png',  emojiFallback: '🙇' },
  { id: 'sulky',   label: '삐짐',     image: '/pochacco/face_sulky.png',   emojiFallback: '😤', anim: 'sulk' },
];

// key는 신규 'happy' 같은 id 또는 옛날 '😄' 같은 이모지 둘 다 받음
export function moodFromKey(key: string | undefined | null): MoodOption | null {
  if (!key) return null;
  return (
    MOOD_OPTIONS.find((m) => m.id === key) ||
    MOOD_OPTIONS.find((m) => m.emojiFallback === key) ||
    null
  );
}

function todayKst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export type MoodMap = Record<string, { emoji: string; note: string }>;

// 오늘 내 기분 저장 (사람+날짜당 1개)
export async function setMyMood(name: string, emoji: string, note = ''): Promise<void> {
  const day = todayKst();
  await setDoc(doc(db, 'moods', `${name}_${day}`), {
    name,
    day,
    emoji,
    note: note.trim(),
    updatedAt: serverTimestamp(),
  });
}

// 오늘 두 사람의 기분을 실시간 구독.
// ⚠️ 자정을 넘겨도 스스로 다시 건다. 예전엔 구독 시점에 day 를 한 번만 계산해서,
//    앱을 켜 둔 채 자정을 넘겨 기분을 고르면 setMyMood 는 '새 날짜' 문서에 쓰는데
//    구독은 어제 날짜를 계속 봐서 홈 기분 카드에 아무것도 안 떴다(앱 재시작해야 보임).
export function subscribeTodayMoods(cb: (moods: MoodMap) => void): () => void {
  const listen = (day: string) => onSnapshot(
    query(collection(db, 'moods'), where('day', '==', day)),
    (snap) => {
      const m: MoodMap = {};
      snap.forEach((d) => {
        const x = d.data() as { name: string; emoji: string; note?: string };
        m[x.name] = { emoji: x.emoji, note: x.note || '' };
      });
      cb(m);
    },
    () => cb({}),
  );

  let day = todayKst();
  let off = listen(day);

  // 1분마다 날짜만 확인한다. 화면 켜 둔 채 자정 넘기는 경우용이라 이 주기면 충분.
  const timer = setInterval(() => {
    const now = todayKst();
    if (now === day) return;
    day = now;
    off();
    cb({}); // ⚠️ 어제 얼굴이 '오늘의 기분' 자리에 남지 않게 새 스냅샷 전에 비운다
    off = listen(day);
  }, 60_000);

  return () => { clearInterval(timer); off(); };
}
