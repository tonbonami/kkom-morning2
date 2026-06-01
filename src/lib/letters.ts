import { db, storage } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// 2인 앱: 로그인 코드 → 이름 (정체성의 단일 출처)
export const CODE_TO_NAME: Record<string, string> = {
  '0319': '우댕',
  '0928': '꼼이',
};
export const COUPLE = ['우댕', '꼼이'] as const;

export function nameFromCode(code?: string | null): string {
  return (code && CODE_TO_NAME[code]) || '꼼이';
}

export function partnerOf(name: string): string {
  return COUPLE.find((u) => u !== name) ?? COUPLE[0];
}

export type Voice = { mime: string; data: string; duration?: number };

export type Letter = {
  id: string;
  from: string;
  to: string;
  body: string;
  createdAt: Timestamp | null;
  openAt?: Timestamp | null; // 예약 도착 시각 (없으면 즉시)
  voice?: Voice | null;      // 10초 보이스 편지 (base64 — Storage 없이 Firestore 직접)
};

function ms(t?: Timestamp | null): number {
  return t?.toMillis?.() ?? 0;
}

// 예약 편지가 아직 도착 전인지 (잠김)
export function isLocked(letter: Letter): boolean {
  if (!letter.openAt) return false;
  return ms(letter.openAt) > Date.now();
}

// to == 나 이고 '이미 도착한' 최신 편지 1건을 실시간 구독.
export function subscribeLatestLetterTo(
  name: string,
  cb: (letter: Letter | null) => void
): () => void {
  const q = query(collection(db, 'letters'), where('to', '==', name));

  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Letter, 'id'>) }))
        .filter((l) => !isLocked(l)); // 예약 미도착 편지는 제외
      docs.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
      cb(docs[0] ?? null);
    },
    (err) => {
      console.error('편지 구독 오류:', err);
      cb(null);
    }
  );
}

// 보관함: 두 사람 사이 모든 편지를 최신순으로 실시간 구독 (잠긴 것도 포함, UI에서 표시)
export function subscribeAllLetters(cb: (letters: Letter[]) => void): () => void {
  return onSnapshot(
    collection(db, 'letters'),
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Letter, 'id'>) }));
      docs.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
      cb(docs);
    },
    (err) => {
      console.error('편지 목록 구독 오류:', err);
      cb([]);
    }
  );
}

// 보관함 (페이지네이션 버전): 최신 N개만 구독 + 더 있는지 여부 반환.
// "더 보기" 누를 때마다 pageSize를 늘려서 재구독하면 됨.
// createdAt가 null(서버시간 막 저장된 직후) 인 문서는 orderBy에 포함되지 않을 수 있음 — 정상이고
// 잠시 후 서버 타임스탬프가 채워지면 다음 스냅샷에 자연스럽게 들어옴.
export function subscribeRecentLetters(
  pageSize: number,
  cb: (letters: Letter[], hasMore: boolean) => void
): () => void {
  const q = query(
    collection(db, 'letters'),
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1) // +1로 다음 페이지 존재 여부 확인
  );
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Letter, 'id'>) }));
      const hasMore = docs.length > pageSize;
      cb(hasMore ? docs.slice(0, pageSize) : docs, hasMore);
    },
    (err) => {
      console.error('편지 페이지 구독 오류:', err);
      cb([], false);
    }
  );
}

// Firestore Letter → LetterInboxV2 / VoicePlayer 가 기대하는 형태로 변환.
// - createdAt/openAt: Timestamp → Date
// - voice: { mime, data(base64) } → { src: data URL, mime, duration }
// from/to는 '우댕'|'꼼이' 외 값이 들어올 일이 없지만 타입은 string인 채로 들어와도 그대로 통과.
export type InboxLetter = {
  id: string;
  from: '우댕' | '꼼이';
  to: '우댕' | '꼼이';
  body: string;
  createdAt: Date;
  openAt?: Date | null;
  voice?: { src: string; mime?: string; duration?: number } | null;
};

export function toInboxLetter(l: Letter): InboxLetter {
  const createdAt = l.createdAt?.toDate?.() ?? new Date();
  const openAt = l.openAt?.toDate?.() ?? null;
  let voice: InboxLetter['voice'] = null;
  if (l.voice && l.voice.data) {
    // base64면 data URL로 감싸고, 이미 https URL(향후 Storage)이면 그대로 사용
    const isUrl = /^https?:\/\//i.test(l.voice.data);
    voice = {
      src: isUrl ? l.voice.data : `data:${l.voice.mime};base64,${l.voice.data}`,
      mime: l.voice.mime,
      duration: l.voice.duration,
    };
  }
  return {
    id: l.id,
    from: l.from as '우댕' | '꼼이',
    to: l.to as '우댕' | '꼼이',
    body: l.body || '',
    createdAt,
    openAt,
    voice,
  };
}

// 상대에게 편지 전송 (openAt 주면 예약 편지, voice 주면 음성 편지)
// voice.data 에는 base64(레거시) 또는 Storage URL(신규) 둘 다 가능.
export async function sendLetter(
  from: string,
  body: string,
  openAt?: Date | null,
  voice?: Voice | null
): Promise<void> {
  const to = partnerOf(from);
  const data: Record<string, unknown> = {
    from,
    to,
    body: body.trim(),
    createdAt: serverTimestamp(),
  };
  if (openAt) data.openAt = Timestamp.fromDate(openAt);
  if (voice && voice.data) data.voice = voice;
  await addDoc(collection(db, 'letters'), data);

  // 도착 푸시 — 즉시 편지면 곧바로, 예약 편지면 cron이 도착 시각에 보냄.
  // 푸시 실패는 편지 전송 자체엔 영향 주지 않음(.catch 흡수).
  const isScheduled = !!openAt;
  fetch('/api/notify-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      from,
      hasBody: !!body.trim(),
      hasVoice: !!(voice && voice.data),
      isScheduled,
    }),
  }).catch(() => {});
}

// 음성 Blob을 Firebase Storage에 올리고 다운로드 URL 반환.
// 경로: voices/{보낸사람}/{timestamp}.{ext}  (Storage 콘솔에서 정리해 보기 좋게)
export async function uploadVoice(blob: Blob, fromName: string): Promise<string> {
  const ext = blob.type.includes('mp4') ? 'm4a' : 'webm';
  const safeName = fromName.replace(/[^\w가-힣]/g, '_') || 'anon';
  const path = `voices/${safeName}/${Date.now()}.${ext}`;
  const r = storageRef(storage, path);
  await uploadBytes(r, blob, { contentType: blob.type || 'audio/webm' });
  return await getDownloadURL(r);
}
