/**
 * 다꾸 다이어리 — 저장(Firestore · Storage). 화면이 쓰는 모양은 diaryTypes.ts.
 * 설계: docs/gpt-diary-answer.md 6번 · docs/gpt-diary-calendar-answer.md 6번.
 *
 *   diaryPages/{날짜_사람}                가벼운 표지(달력 점·홈 카드용) — 한 달에 많아야 62개
 *   diaryPages/{날짜_사람}/content/main   그 장의 글·물건(하루를 열 때만 읽는다)
 *   diaryMonths/{연-월_주인}              월간 꾸미기(주인 = together | udaeng | kkomi)
 *   specialDates/{id}                     생일·기념일(매년 되풀이)
 *   Storage diary/{사람}/{연}/{월}/{장 id}/{사진 id}.jpg
 *
 * ⚠️ 하루 장은 주인만 고친다(쓰는 사람이 하나) → 장 전체를 한 번에 덮어쓴다.
 * ⚠️ 「같이」 달력은 둘이 동시에 만질 수 있다 → 문서 전체를 덮지 않고 **만진 칸만** merge 로 쓴다.
 * ⚠️ 연습 모드(?practice=1)에서는 아무것도 쓰지 않는다(PracticeBlocked).
 * ⚠️ 장부·감시 금지 — 연속 기록·작성 횟수 같은 필드를 만들지 않는다.
 */
import { db, storage, usingEmulator } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, startAfter, writeBatch, runTransaction,
  serverTimestamp, deleteField, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { isPractice, practiceBlocked } from './practice';
import { PERSON_KEY, PracticeBlocked } from './honeybrary';
import { addCalendarEvent, deleteCalendarEvent } from './calendar';
import {
  DIARY_LIMITS, DIARY_PROMPTS, MONTH_LIMITS, type DiaryEventDraft, type DiaryItemVM, type DiaryPageVM, type DiaryPaperTheme, type MonthOwner, type MonthSpanVM,
  type MonthStickerVM, type MonthTitleStyle, type Person, type SpecialDateVM,
} from './diaryTypes';

export { PracticeBlocked };

const blocked = (what: string): boolean => { if (!isPractice()) return false; practiceBlocked(what); return true; };
/** undefined 를 걷어 낸다 — Firestore 는 undefined 값을 거절한다(스티커의 src·decorId 가 선택 필드). */
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const THEMES: DiaryPaperTheme[] = ['cream', 'plain', 'lined', 'grid'];
const num = (v: unknown, d: number, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

// ── 하루 장 ──────────────────────────────────────────────────────────────
export const diaryPageId = (date: string, owner: Person) => `${date}_${PERSON_KEY[owner]}`;
export const blankDiaryPage = (date: string, owner: Person): DiaryPageVM => ({ date, owner, theme: 'cream', text: '', items: [] });
export const diaryPageHasContent = (p: Pick<DiaryPageVM, 'text' | 'items'>) => p.text.trim().length > 0 || p.items.length > 0;

/** 달력 점·홈 카드가 읽는 가벼운 표지. photos 는 사진 모아 보기용 앞쪽 4장. */
export interface DiaryMeta { id: string; date: string; owner: Person; excerpt: string; thumb?: string; photos?: string[]; itemCount: number; hasPhoto: boolean }

function toItems(raw: unknown): DiaryItemVM[] {
  if (!Array.isArray(raw)) return [];
  const out: DiaryItemVM[] = [];
  for (const r of raw as DocumentData[]) {
    if (!r || typeof r.id !== 'string') continue;
    const type = r.type === 'photo' || r.type === 'tape' || r.type === 'stamp' || r.type === 'ink' ? r.type : 'sticker';
    out.push({
      id: r.id, type,
      ...(typeof r.src === 'string' ? { src: r.src } : {}),
      ...(typeof r.decorId === 'string' ? { decorId: r.decorId } : {}),
      ...(typeof r.path === 'string' ? { path: r.path } : {}),
      ...(type === 'photo' && (r.frame === 'none' || r.frame === 'polaroid' || r.frame === 'circle' || r.frame === 'white') ? { frame: r.frame } : {}),
      ...(type === 'photo' && typeof r.caption === 'string' && r.caption.trim() ? { caption: r.caption.slice(0, DIARY_LIMITS.caption) } : {}),
      ...(type === 'photo' && (r.source === 'library' || r.source === 'chat' || r.source === 'memories') ? { source: r.source } : {}),
      ...(type === 'ink' && typeof r.strokePath === 'string' ? { strokePath: r.strokePath } : {}),
      ...(type === 'ink' && typeof r.strokeSrc === 'string' ? { strokeSrc: r.strokeSrc } : {}),
      x: num(r.x, 0.5, 0, 1), y: num(r.y, 0.5, 0, 1), w: num(r.w, 0.3, 0.05, 1), ratio: num(r.ratio, 1, 0.05, 10),
      rotation: num(r.rotation, 0, -3600, 3600), z: num(r.z, 1, 0, 100000),
    });
  }
  return out.slice(0, DIARY_LIMITS.items);
}
function toPage(date: string, owner: Person, d: DocumentData | undefined): DiaryPageVM {
  let text = typeof d?.text === 'string' ? d.text.slice(0, DIARY_LIMITS.text) : '';
  let question = typeof d?.question === 'string' && d.question.trim() ? d.question.trim().slice(0, 60) : undefined;
  if (!question) {
    // 처음엔 질문을 누르면 글 맨 앞에 그냥 섞여 들어갔다 — 그런 장은 맨 앞 질문을 알아봐서 따로 뗀다(주인이 다음에 고칠 때 그렇게 저장된다).
    const hit = DIARY_PROMPTS.find((q) => text.startsWith(q));
    if (hit) { question = hit; text = text.slice(hit.length).replace(/^[ \t]*\n?/, ''); }
  }
  return {
    date, owner,
    theme: THEMES.includes(d?.theme) ? d!.theme : 'cream',
    text, items: toItems(d?.items),
    ...(question ? { question } : {}),
  };
}
const contentRef = (id: string) => doc(db, 'diaryPages', id, 'content', 'main');

/** 한 장 읽기(내 장을 열 때 한 번). 없으면 null. 못 읽으면(오프라인) 던진다 — 빈 장으로 착각해 덮어쓰면 안 되니까. */
export async function loadDiaryPage(date: string, owner: Person): Promise<{ page: DiaryPageVM; revision: number } | null> {
  const snap = await getDoc(contentRef(diaryPageId(date, owner)));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { page: toPage(date, owner, d), revision: num(d.revision, 0, 0, 1e9) };
}

/**
 * 내 장의 서버 판 번호를 듣는다(없으면 0) — 다른 기기(아이패드↔폰)가 저장하면 열어 둔 장을 새로 불러오려고(11/19 저장 충돌 막기).
 * 본문은 안 넘긴다: 판이 바뀐 걸 알면 부르는 쪽이 loadDiaryPage 로 다시 읽는다(고치는 중이면 안 읽는다).
 */
export function subscribeDiaryRevision(date: string, owner: Person, cb: (revision: number) => void): () => void {
  return onSnapshot(contentRef(diaryPageId(date, owner)),
    (s) => { if (!s.metadata.hasPendingWrites) cb(s.exists() ? num(s.data().revision, 0, 0, 1e9) : 0); },
    () => { /* 못 들으면 그만 — 저장 때 트랜잭션이 막는다 */ });
}

/** 상대 장은 켜 둔 채로 본다(상대가 고치면 바로 바뀐다). 없으면 null. */
export function subscribeDiaryPage(date: string, owner: Person, cb: (p: DiaryPageVM | null) => void): () => void {
  return onSnapshot(contentRef(diaryPageId(date, owner)),
    (s) => cb(s.exists() ? toPage(date, owner, s.data()) : null),
    (e) => { console.error('diary page 구독 오류:', e); cb(null); });
}

const toMeta = (id: string, d: DocumentData): DiaryMeta | null => {
  if (d.owner !== '우댕' && d.owner !== '꼼이') return null;
  const photos = Array.isArray(d.photos) ? d.photos.filter((x: unknown): x is string => typeof x === 'string' && !!x).slice(0, 4) : [];
  return {
    id, date: String(d.date || ''), owner: d.owner, excerpt: typeof d.excerpt === 'string' ? d.excerpt : '',
    ...(typeof d.thumb === 'string' && d.thumb ? { thumb: d.thumb } : {}),
    ...(photos.length ? { photos } : {}),
    itemCount: num(d.itemCount, 0, 0, 1000), hasPhoto: !!d.hasPhoto,
  };
};

/** 한 달의 표지들(두 사람 것 다) — id → 표지. */
export function subscribeDiaryMonthMeta(ym: string, cb: (m: Record<string, DiaryMeta>) => void): () => void {
  return onSnapshot(query(collection(db, 'diaryPages'), where('ym', '==', ym)),
    (snap) => {
      const out: Record<string, DiaryMeta> = {};
      snap.forEach((s) => {
        const m = toMeta(s.id, s.data());
        if (m) out[s.id] = m;
      });
      cb(out);
    },
    (e) => { console.error('diary 표지 구독 오류:', e); cb({}); });
}

let allMetaCache: Promise<DiaryMeta[]> | null = null;
/** 장이 저장·이동되면 다음 검색 때 표지를 새로 받게 한다(받은 표지는 앱이 켜져 있는 동안 남아서 새 장·지운 장이 어긋나던 것). */
export function forgetAllDiaryMeta(): void { allMetaCache = null; }
/** 첫 줄 찾기용 표지 전체. 처음 한 번만 받고 이후 검색은 화면에서 거른다(본문은 읽지 않는다). */
export function fetchAllDiaryMeta(): Promise<DiaryMeta[]> {
  if (allMetaCache) return allMetaCache;
  allMetaCache = getDocs(collection(db, 'diaryPages')).then((snap) => {
    const out: DiaryMeta[] = [];
    snap.forEach((s) => { const m = toMeta(s.id, s.data()); if (m) out.push(m); });
    return out;
  }).catch((e) => {
    allMetaCache = null;
    console.error('diary 전체 표지 읽기 오류:', e);
    throw e;
  });
  return allMetaCache;
}

/** 저장할 수 있는 물건만 — 아직 올리는 중인 사진(blob:)은 뺀다(다 올라오면 다시 저장된다). */
export const storableItems = (items: DiaryItemVM[]) => items.filter((i) => !(i.src ?? '').startsWith('blob:')).slice(0, DIARY_LIMITS.items);

/** 저장하려는데 서버 판이 내가 알던 판과 다르다 — 다른 기기(아이패드↔폰)가 먼저 고쳤다. */
export class DiaryConflict extends Error {
  constructor(public serverRevision: number) { super('다른 기기에서 먼저 고친 장'); this.name = 'DiaryConflict'; }
}

/**
 * 한 장 저장(전체 덮어쓰기). 글도 물건도 없으면 장을 지운다(빈 장이 달력에 점으로 남지 않게).
 * ⚠️ 2026-11-19 **트랜잭션으로 판 번호를 대조한다**(우댕 「저장 충돌 막기부터 해」 — 사이담 설계 docs/gpt-sairy-switch-answer.md §3 「중요한 반박」).
 *   예전엔 baseRevision+1 을 적기만 해서, 아이패드에서 쓴 뒤 옛 장을 열어 둔 폰이 저장하면 아이패드 글이 통째로 덮였다.
 *   서버 판 ≠ baseRevision 이면 저장하지 않고 DiaryConflict — 부르는 쪽이 서버 장을 다시 읽고 이 기기 것은 따로 보관한다.
 * @returns 새 revision(장을 지웠으면 0 — 서버에 장이 없으니 다음 저장의 기준도 0)
 */
export async function saveDiaryPage(page: DiaryPageVM, baseRevision: number): Promise<number> {
  if (blocked('다이어리 저장')) throw new PracticeBlocked();
  const id = diaryPageId(page.date, page.owner);
  const items = clean(storableItems(page.items));
  const text = page.text.slice(0, DIARY_LIMITS.text);
  const empty = !text.trim() && items.length === 0;
  const firstLine = text.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  const photos = items.filter((i) => i.type === 'photo' && i.src).map((i) => i.src!).slice(0, 4);
  const thumb = photos[0] ?? items.find((i) => i.type === 'sticker' && i.src)?.src;
  return runTransaction(db, async (tx) => {
    const cur = await tx.get(contentRef(id));
    const serverRev = cur.exists() ? num(cur.data()?.revision, 0, 0, 1e9) : 0;
    if (serverRev !== baseRevision) throw new DiaryConflict(serverRev);
    if (empty) {
      tx.delete(contentRef(id));
      tx.delete(doc(db, 'diaryPages', id));
      return 0;
    }
    const revision = serverRev + 1;
    tx.set(contentRef(id), { text, items, theme: page.theme, ...(page.question ? { question: page.question.slice(0, 60) } : {}), revision, updatedAt: serverTimestamp() });
    tx.set(doc(db, 'diaryPages', id), {
      date: page.date, ym: page.date.slice(0, 7), owner: page.owner, theme: page.theme,
      itemCount: items.length, hasPhoto: photos.length > 0,
      excerpt: firstLine.slice(0, 40), thumb: thumb ?? deleteField(), photos: photos.length ? photos : deleteField(),
      schemaVersion: 1, revision, updatedAt: serverTimestamp(),
      ...(serverRev === 0 ? { createdAt: serverTimestamp() } : {}),
    }, { merge: true });
    return revision;
  }).then((r) => { forgetAllDiaryMeta(); return r; });
}

// ── 마음(♥)·한마디 ─────────────────────────────────────────────────────────
// 우댕 2026-11-17 (꼼이 장을 보며): 「이거 내가 답글 남기거나 하트는 못해?」
//   diaryPages/{장 id}/notes/{id}   { by, kind: 'heart'|'text', text, at }
//   ♥ 는 사람마다 하나(문서 id heart_{udaeng|kkomi}) — 눌렀다 떼면 지운다. 한마디는 여러 개.
// ⚠️ 장 주인이 아니어도 쓴다 — 장(content/main)은 건드리지 않고 아래 notes 에만 쓴다(주인의 장 저장과 안 부딪힌다).
// ⚠️ 주인이 장을 비워서 장이 지워져도 notes 는 남는다 — 다시 쓰면 그대로 돌아온다.
export interface DiaryNoteVM { id: string; by: Person; kind: 'heart' | 'text'; text: string; at: number }
export const DIARY_NOTE_MAX = 300;
const notesCol = (pageId: string) => collection(db, 'diaryPages', pageId, 'notes');
const otherOf = (p: Person): Person => (p === '우댕' ? '꼼이' : '우댕');

/** 그 장의 ♥·한마디(오래된 것 먼저). */
export function subscribeDiaryNotes(date: string, owner: Person, cb: (n: DiaryNoteVM[]) => void): () => void {
  return onSnapshot(notesCol(diaryPageId(date, owner)),
    (snap) => {
      const out: DiaryNoteVM[] = [];
      snap.forEach((s) => {
        const d = s.data({ serverTimestamps: 'estimate' });
        if (d.by !== '우댕' && d.by !== '꼼이') return;
        const kind = d.kind === 'heart' ? 'heart' : 'text';
        const text = typeof d.text === 'string' ? d.text.slice(0, DIARY_NOTE_MAX) : '';
        if (kind === 'text' && !text.trim()) return;
        const at = typeof d.at?.toMillis === 'function' ? d.at.toMillis() : 0;
        out.push({ id: s.id, by: d.by, kind, text, at });
      });
      cb(out.sort((a, b) => a.at - b.at));
    },
    (e) => { console.error('diary notes 구독 오류:', e); cb([]); });
}

/** 상대에게 알림(진짜 앱에서만 — 에뮬레이터·연습 모드는 안 보낸다). */
function notifyDiary(body: { kind: 'heart' | 'text'; from: Person; date: string; owner: Person; text?: string }) {
  if (usingEmulator || isPractice()) return;
  fetch('/api/notify-diary', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, to: otherOf(body.from) }),
  }).catch(() => {});
}

export async function setDiaryHeart(date: string, owner: Person, me: Person, on: boolean): Promise<void> {
  if (blocked('다이어리 마음')) throw new PracticeBlocked();
  const ref = doc(notesCol(diaryPageId(date, owner)), `heart_${PERSON_KEY[me]}`);
  if (!on) { await deleteDoc(ref); return; }
  await setDoc(ref, { by: me, kind: 'heart', text: '', at: serverTimestamp() });
  notifyDiary({ kind: 'heart', from: me, date, owner });
}

export async function addDiaryNote(date: string, owner: Person, me: Person, text: string): Promise<void> {
  const t = text.trim().slice(0, DIARY_NOTE_MAX);
  if (!t) return;
  if (blocked('다이어리 한마디')) throw new PracticeBlocked();
  await setDoc(doc(notesCol(diaryPageId(date, owner))), { by: me, kind: 'text', text: t, at: serverTimestamp() });
  notifyDiary({ kind: 'text', from: me, date, owner, text: t });
}

export async function deleteDiaryNote(date: string, owner: Person, id: string): Promise<void> {
  if (blocked('다이어리 한마디 지우기')) throw new PracticeBlocked();
  await deleteDoc(doc(notesCol(diaryPageId(date, owner)), id));
}

// ── 사진 ─────────────────────────────────────────────────────────────────
/** 고른 사진을 종이에 올릴 크기(긴 변 1280, JPEG)로 줄인다 — 올리기 전에 화면에 먼저 보여 주려고 따로 뺐다. */
export async function prepareDiaryPhoto(file: File): Promise<{ blob: Blob; ratio: number }> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 올릴 수 있어요.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('이미지를 읽지 못했어요.'));
      i.src = url;
    });
    let w = img.naturalWidth, h = img.naturalHeight;
    const long = Math.max(w, h);
    if (long > 1280) { const r = 1280 / long; w = Math.round(w * r); h = Math.round(h * r); }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('canvas');
    // JPEG 는 투명을 못 담는다 — 흰 바탕을 먼저 깔아야 투명 PNG·WebP 가 검은 바탕이 되지 않는다.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', 0.8));
    return { blob, ratio: h / w };
  } finally { URL.revokeObjectURL(url); }
}

export async function uploadDiaryPhoto(date: string, owner: Person, blob: Blob): Promise<{ src: string; path: string }> {
  if (blocked('다이어리 사진 올리기')) throw new PracticeBlocked();
  const photoId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const path = `diary/${PERSON_KEY[owner]}/${date.slice(0, 4)}/${date.slice(5, 7)}/${diaryPageId(date, owner)}/${photoId}.jpg`;
  const r = storageRef(storage, path);
  await uploadBytes(r, blob, { contentType: 'image/jpeg' });
  return { src: await getDownloadURL(r), path };
}

// ── 앱 안 사진 가져오기(꼼톡·추억) ──────────────────────────────────────────
// 우댕 2026-11-18 「사진 먼저 하고, 다음 1까지 하자」 — 회의록의 「다음 ①: 꼼톡·추억에서 사진 가져오기(복사본)」.
// ⚠️ 원본 주소를 그대로 걸지 않는다 — 꼼톡 메시지를 지우면 그 사진 파일도 지워져서(chat.ts deleteMessage) 장이 깨진다.
//    골라 온 사진은 받아서(fetch → 줄이기) 다이어리 자리에 새로 올린다. Storage 다운로드 주소는 CORS(*)라 받을 수 있다(saveMedia.ts).
export interface AppPhotoVM { id: string; url: string; thumb: string; at: number; source: 'chat' | 'memories' }

let chatPhotoCache: { list: AppPhotoVM[]; cursor: QueryDocumentSnapshot | null; done: boolean } | null = null;
/**
 * 꼼톡에서 주고받은 사진(최근순). 한 번에 메시지 200개씩 거슬러 올라가며 사진만 모은다 — 사진만 따로 묻는 색인이 없어서.
 * more=true 면 이어서 더 오래된 것. 지운 메시지·타임캡슐(아직 안 온 것)은 뺀다.
 */
export async function fetchChatPhotos(more = false): Promise<{ list: AppPhotoVM[]; done: boolean }> {
  if (chatPhotoCache && !more) return { list: chatPhotoCache.list, done: chatPhotoCache.done };
  const cache = chatPhotoCache ?? { list: [], cursor: null, done: false };
  const want = cache.list.length + 30;
  let scanned = 0;
  while (!cache.done && cache.list.length < want && scanned < 800) {
    const q = cache.cursor
      ? query(collection(db, 'messages'), orderBy('createdAt', 'desc'), startAfter(cache.cursor), limit(200))
      : query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(200));
    const snap = await getDocs(q);
    scanned += snap.size;
    if (snap.size < 200) cache.done = true;
    if (snap.size) cache.cursor = snap.docs[snap.docs.length - 1];
    snap.forEach((s) => {
      const d = s.data();
      if (d.deleted || d.capsule) return;
      const at = d.createdAt?.toMillis?.() ?? 0;
      const urls: string[] = Array.isArray(d.imageUrls) && d.imageUrls.length ? d.imageUrls : typeof d.imageUrl === 'string' && d.imageUrl ? [d.imageUrl] : [];
      const thumbs: unknown[] = Array.isArray(d.imageThumbs) ? d.imageThumbs : [];
      urls.forEach((u, i) => {
        if (typeof u !== 'string' || !u) return;
        cache.list.push({ id: `chat-${s.id}-${i}`, url: u, thumb: typeof thumbs[i] === 'string' ? (thumbs[i] as string) : u, at, source: 'chat' });
      });
    });
  }
  chatPhotoCache = cache;
  return { list: cache.list, done: cache.done };
}

/** 추억(사진 모음)에 올린 사진(최근순). 추억은 수가 적어서 한 번에 다 읽는다. */
export async function fetchMemoryPhotos(): Promise<AppPhotoVM[]> {
  const snap = await getDocs(collection(db, 'memories'));
  const out: AppPhotoVM[] = [];
  snap.forEach((s) => {
    const d = s.data();
    if (typeof d.imageUrl !== 'string' || !d.imageUrl) return;
    const at = d.createdAt?.toMillis?.() ?? (Date.parse(String(d.date || '')) || 0);
    out.push({ id: `mem-${s.id}`, url: d.imageUrl, thumb: d.imageUrl, at, source: 'memories' });
  });
  return out.sort((a, b) => b.at - a.at);
}

/** 앱 안 사진 주소 → 파일(다이어리 자리로 복사해 올리려고). data: 주소·같은 사이트 주소·Storage 주소 모두. */
export async function appPhotoFile(p: AppPhotoVM): Promise<File> {
  const res = await fetch(p.url);
  if (!res.ok) throw new Error(`사진을 받지 못했어요 (${res.status})`);
  const blob = await res.blob();
  return new File([blob], `${p.id}.jpg`, { type: blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg' });
}

/** 손으로 그린 필기(투명 PNG) 올리기 — 사진과 같은 자리(diary/…/{장 id}/ink-…png). JPEG 로 바꾸면 투명이 사라져서 따로 둔다. */
export async function uploadDiaryInk(date: string, owner: Person, png: Blob, sidecarJson?: string): Promise<{ src: string; path: string; strokeSrc?: string; strokePath?: string }> {
  if (blocked('다이어리 필기 올리기')) throw new PracticeBlocked();
  const inkId = `ink-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const base = `diary/${PERSON_KEY[owner]}/${date.slice(0, 4)}/${date.slice(5, 7)}/${diaryPageId(date, owner)}/${inkId}`;
  const r = storageRef(storage, `${base}.png`);
  await uploadBytes(r, png, { contentType: 'image/png' });
  const out: { src: string; path: string; strokeSrc?: string; strokePath?: string } = { src: await getDownloadURL(r), path: `${base}.png` };
  // 다시 그리기용 획(필기 2단계) — 장 문서에 넣으면 장이 무거워지고 통째 저장이 커져서 옆 파일로(GPT 계획 B-2).
  if (sidecarJson) {
    try {
      const j = storageRef(storage, `${base}.json`);
      await uploadBytes(j, new Blob([sidecarJson], { type: 'application/json' }), { contentType: 'application/json' });
      out.strokeSrc = await getDownloadURL(j); out.strokePath = `${base}.json`;
    } catch { /* 획 파일을 못 올려도 그림은 붙는다 — 다시 그리기만 안 될 뿐 */ }
  }
  return out;
}

/** 장에서 빠진 사진 파일 지우기 — 「이미 없음」은 성공으로 본다. 실패해도 장 저장은 이미 끝난 뒤라 조용히 넘긴다. */
export async function deleteDiaryPhotos(paths: string[]): Promise<void> {
  if (isPractice()) return;
  await Promise.all(paths.filter((p) => p.startsWith('diary/')).map((p) => deleteObject(storageRef(storage, p)).catch(() => {})));
}

// ── 꺼져도 되살리기(이 폰에만) ────────────────────────────────────────────
// 편집할 때마다 여기에 먼저 적어 두고, 서버 저장이 끝나면 지운다. 앱이 꺼졌다 켜지면 남아 있는 것을 되살려 다시 저장한다.
const DRAFT = 'kk-diary-draft:';
export function saveDiaryDraft(page: DiaryPageVM, baseRevision: number): void {
  try { localStorage.setItem(DRAFT + diaryPageId(page.date, page.owner), JSON.stringify({ page: { ...page, items: storableItems(page.items) }, baseRevision })); } catch { /* 가득 참 */ }
}
export function readDiaryDraft(date: string, owner: Person): { page: DiaryPageVM; baseRevision: number } | null {
  try {
    const raw = localStorage.getItem(DRAFT + diaryPageId(date, owner));
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { page: toPage(date, owner, d.page), baseRevision: num(d.baseRevision, 0, 0, 1e9) };
  } catch { return null; }
}
export function clearDiaryDraft(date: string, owner: Person): void {
  try { localStorage.removeItem(DRAFT + diaryPageId(date, owner)); } catch { /* */ }
}

// ── 월간 꾸미기 ──────────────────────────────────────────────────────────
export interface MonthDeco {
  stickers: Record<string, MonthStickerVM[]>; memos: Record<string, string>; spans: MonthSpanVM[];
  hero: MonthStickerVM | null; margin: MonthStickerVM[]; title: MonthTitleStyle;
}
export const emptyMonthDeco = (): MonthDeco => ({ stickers: {}, memos: {}, spans: [], hero: null, margin: [], title: 'plain' });
/** 한 번 만진 것 — 화면 상태에도, 저장에도, 되돌리기에도 같은 모양을 쓴다. */
export type MonthPatch =
  | { kind: 'stickers'; date: string; list: MonthStickerVM[] }
  | { kind: 'memo'; date: string; text: string | null }
  | { kind: 'span'; id: string; span: MonthSpanVM | null }
  | { kind: 'hero'; hero: MonthStickerVM | null }
  | { kind: 'margin'; list: MonthStickerVM[] }
  | { kind: 'title'; title: MonthTitleStyle };

export function applyMonthPatch(d: MonthDeco, p: MonthPatch): MonthDeco {
  switch (p.kind) {
    case 'stickers': { const s = { ...d.stickers }; if (p.list.length) s[p.date] = p.list.slice(0, MONTH_LIMITS.cellStickers); else delete s[p.date]; return { ...d, stickers: s }; }
    case 'memo': { const m = { ...d.memos }; if (p.text) m[p.date] = p.text.slice(0, MONTH_LIMITS.memo); else delete m[p.date]; return { ...d, memos: m }; }
    case 'span': { const rest = d.spans.filter((k) => k.id !== p.id); return { ...d, spans: p.span ? [...rest, p.span].sort((a, b) => a.startDate.localeCompare(b.startDate)) : rest }; }
    case 'hero': return { ...d, hero: p.hero };
    case 'margin': return { ...d, margin: p.list.slice(0, MONTH_LIMITS.margin) };
    case 'title': return { ...d, title: p.title };
  }
}
/** 그 변경을 되돌리는 변경(바꾸기 **전** 상태에서 만든다). */
export function invertMonthPatch(d: MonthDeco, p: MonthPatch): MonthPatch {
  switch (p.kind) {
    case 'stickers': return { kind: 'stickers', date: p.date, list: d.stickers[p.date] ?? [] };
    case 'memo': return { kind: 'memo', date: p.date, text: d.memos[p.date] ?? null };
    case 'span': return { kind: 'span', id: p.id, span: d.spans.find((k) => k.id === p.id) ?? null };
    case 'hero': return { kind: 'hero', hero: d.hero };
    case 'margin': return { kind: 'margin', list: d.margin };
    case 'title': return { kind: 'title', title: d.title };
  }
}

const OWNER_KEY: Record<MonthOwner, string> = { together: 'together', '우댕': 'udaeng', '꼼이': 'kkomi' };
const monthRef = (ym: string, owner: MonthOwner) => doc(db, 'diaryMonths', `${ym}_${OWNER_KEY[owner]}`);
const toSticker = (r: DocumentData | null | undefined): MonthStickerVM | null => {
  if (!r || typeof r.id !== 'string') return null;
  return {
    id: r.id,
    ...(typeof r.src === 'string' ? { src: r.src } : {}),
    ...(typeof r.decorId === 'string' ? { decorId: r.decorId } : {}),
    ...(r.by === '우댕' || r.by === '꼼이' ? { by: r.by as Person } : {}),
  };
};
const toStickers = (raw: unknown, max: number): MonthStickerVM[] =>
  (Array.isArray(raw) ? raw.map(toSticker).filter((s): s is MonthStickerVM => !!s) : []).slice(0, max);

function toDeco(d: DocumentData | undefined): MonthDeco {
  const out = emptyMonthDeco();
  if (!d) return out;
  for (const [date, list] of Object.entries((d.stickers ?? {}) as Record<string, unknown>)) {
    const l = toStickers(list, MONTH_LIMITS.cellStickers);
    if (l.length) out.stickers[date] = l;
  }
  for (const [date, t] of Object.entries((d.memos ?? {}) as Record<string, unknown>)) if (typeof t === 'string' && t) out.memos[date] = t.slice(0, MONTH_LIMITS.memo);
  for (const [id, s] of Object.entries((d.spans ?? {}) as Record<string, DocumentData>)) {
    if (!s || typeof s.startDate !== 'string' || typeof s.endDate !== 'string') continue;
    out.spans.push({ id, startDate: s.startDate, endDate: s.endDate, label: typeof s.label === 'string' ? s.label : '', decorId: typeof s.decorId === 'string' ? s.decorId : 'tape-honey' });
  }
  out.spans.sort((a, b) => a.startDate.localeCompare(b.startDate));
  out.hero = toSticker(d.hero);
  out.margin = toStickers(d.margin, MONTH_LIMITS.margin);
  out.title = d.title === 'brush' || d.title === 'round' ? d.title : 'plain';
  return out;
}

export function subscribeDiaryMonth(ym: string, owner: MonthOwner, cb: (d: MonthDeco) => void): () => void {
  return onSnapshot(monthRef(ym, owner), (s) => cb(toDeco(s.data())), (e) => { console.error('diary 달력 구독 오류:', e); });
}

/** 만진 칸만 쓴다(merge) — 「같이」 달력을 둘이 동시에 만져도 서로의 다른 칸을 덮지 않는다. */
export async function writeDiaryMonthPatch(ym: string, owner: MonthOwner, p: MonthPatch): Promise<void> {
  if (blocked('달력 꾸미기 저장')) throw new PracticeBlocked();
  let body: DocumentData;
  switch (p.kind) {
    case 'stickers': body = { stickers: { [p.date]: p.list.length ? clean(p.list.slice(0, MONTH_LIMITS.cellStickers)) : deleteField() } }; break;
    case 'memo': body = { memos: { [p.date]: p.text ? p.text.slice(0, MONTH_LIMITS.memo) : deleteField() } }; break;
    case 'span': body = { spans: { [p.id]: p.span ? { startDate: p.span.startDate, endDate: p.span.endDate, label: p.span.label, decorId: p.span.decorId } : deleteField() } }; break;
    case 'hero': body = { hero: p.hero ? clean(p.hero) : null }; break;
    case 'margin': body = { margin: clean(p.list.slice(0, MONTH_LIMITS.margin)) }; break;
    case 'title': body = { title: p.title }; break;
  }
  await setDoc(monthRef(ym, owner), { ...body, ym, owner: OWNER_KEY[owner], updatedAt: serverTimestamp() }, { merge: true });
}

// ── 생일·기념일 ──────────────────────────────────────────────────────────
function toSpecial(id: string, d: DocumentData): SpecialDateVM | null {
  if (typeof d.label !== 'string' || !/^\d\d-\d\d$/.test(String(d.monthDay))) return null;
  const sticker = toSticker(d.sticker);
  return {
    id, label: d.label, monthDay: d.monthDay,
    kind: d.kind === 'birthday' || d.kind === 'anniversary' ? d.kind : 'custom',
    owner: d.owner === '우댕' || d.owner === '꼼이' ? d.owner : 'together',
    ...(typeof d.startYear === 'number' ? { startYear: d.startYear } : {}),
    ...(sticker ? { sticker } : {}),
  };
}
export function subscribeSpecialDates(cb: (list: SpecialDateVM[]) => void): () => void {
  return onSnapshot(collection(db, 'specialDates'),
    (snap) => {
      const out: SpecialDateVM[] = [];
      snap.forEach((s) => { const v = toSpecial(s.id, s.data()); if (v) out.push(v); });
      out.sort((a, b) => a.monthDay.localeCompare(b.monthDay) || a.label.localeCompare(b.label));
      cb(out);
    },
    (e) => { console.error('기념일 구독 오류:', e); cb([]); });
}
export async function addSpecialDate(v: Omit<SpecialDateVM, 'id'>): Promise<void> {
  if (blocked('기념일 추가')) throw new PracticeBlocked();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await setDoc(doc(db, 'specialDates', id), { ...clean(v), repeat: 'yearly', createdAt: serverTimestamp() });
}
export async function deleteSpecialDate(id: string): Promise<void> {
  if (blocked('기념일 지우기')) throw new PracticeBlocked();
  await deleteDoc(doc(db, 'specialDates', id));
}

/** 처음부터 들어 있는 날 — 두 사람 생일과 처음 만난 날(코드에 박혀 있던 것: birthday.ts · 홈의 2023-09-28). */
export const BUILTIN_SPECIALS: SpecialDateVM[] = [
  { id: 'builtin-udaeng-birthday', label: '우댕 생일', kind: 'birthday', monthDay: '03-19', owner: '우댕' },
  { id: 'builtin-kkomi-birthday', label: '꼼이 생일', kind: 'birthday', monthDay: '09-28', owner: '꼼이' },
  { id: 'builtin-first-day', label: '우리 처음 만난 날', kind: 'anniversary', monthDay: '09-28', startYear: 2023, owner: 'together' },
];
/** 한 번만 심는다(settings/diary.specialSeeded) — 그 뒤로는 지워도 다시 안 생긴다. id 가 고정이라 두 폰이 동시에 해도 같은 문서. */
export async function seedSpecialDates(): Promise<void> {
  if (isPractice()) return;
  const flag = doc(db, 'settings', 'diary');
  const cur = await getDoc(flag);
  if (cur.exists() && cur.data().specialSeeded) return;
  const batch = writeBatch(db);
  for (const { id, ...rest } of BUILTIN_SPECIALS) batch.set(doc(db, 'specialDates', id), { ...rest, repeat: 'yearly', createdAt: serverTimestamp() });
  batch.set(flag, { specialSeeded: true }, { merge: true });
  await batch.commit();
}

export { specialsOn } from './diaryCalendar';

// ── 일정(달력 합치기) — 원본은 calendarEvents(src/lib/calendar.ts) 그대로, 여기선 연습 모드만 막고 넘긴다 ──
/** 일정 추가(id 없음)·수정(id 있음). 값은 normalizeEventDraft 를 거친 것. 수정에서 비운 칸은 필드를 지운다. */
export async function saveDiaryEvent(d: DiaryEventDraft, me: Person, id?: string): Promise<string> {
  if (blocked(id ? '일정 고치기' : '일정 추가')) throw new PracticeBlocked();
  if (!id) {
    return addCalendarEvent({
      title: d.title, owner: d.owner, startDate: d.startDate, endDate: d.endDate, allDay: d.allDay,
      startTime: d.startTime || undefined, memo: d.memo, location: d.location, remindDaysBefore: d.remindDaysBefore, decorId: d.decorId, createdBy: me,
    });
  }
  await updateDoc(doc(db, 'calendarEvents', id), {
    title: d.title, owner: d.owner, startDate: d.startDate, endDate: d.endDate, allDay: d.allDay,
    startTime: !d.allDay && d.startTime ? d.startTime : deleteField(),
    location: d.location || deleteField(), memo: d.memo || deleteField(),
    remindDaysBefore: d.remindDaysBefore.length ? d.remindDaysBefore : deleteField(),
    decorId: d.decorId || deleteField(), updatedAt: serverTimestamp(),
  });
  return id;
}
/** 일정 지우기 — 알림도 같이 없어진다(크론이 이 문서를 보고 보낸다). 일정 창 안에서 한 번 더 확인한 뒤에만 부른다. */
export async function removeDiaryEvent(id: string): Promise<void> {
  if (blocked('일정 지우기')) throw new PracticeBlocked();
  await deleteCalendarEvent(id);
}
