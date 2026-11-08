/**
 * 허니브러리 — 둘의 책장 데이터. 화면 모양·상수는 honeybraryTypes.ts.
 *
 *   honeyBooks/{bookId}                      책 한 권(둘이 같이) + 사람마다 진행 readers.{udaeng|kkomi}
 *   honeyBooks/{bookId}/notes/{noteId}       읽는 중 기록(+ parentNoteId 로 한 줄 잇기, 한 단계)
 *   honeyBooks/{bookId}/reviews/{udaeng|kkomi}  감상 — 책 × 사람 하나(문서 id 가 곧 사람)
 *   Storage honeybrary/books/{bookId}/...    표지·기록·감상 사진 — 원본(긴 변 1600) + 작은 판 _t(480)
 *
 * 사이담 사이브러리(saidam/src/lib/library.ts)를 옮긴 것. GPT 회의(docs/gpt-honeybrary-answer.md)와 다른 점:
 *   - 최상위 컬렉션 셋 대신 **책 아래 하위 컬렉션** — 정렬·개수 제한에 복합 색인이 필요 없고, 책 하나를 지울 때 범위가 분명하다.
 *   - 사진은 **책 폴더 하나 아래**에 모은다 → 책을 지울 때 폴더째(listAll) 지워 표지 교체 전 옛 파일 같은 고아까지 정리.
 *
 * ⚠️⚠️ 장부가 되면 안 된다 — 진행 문서에 **시각을 안 남긴다**(「어제 이후 안 읽었네」 금지). 권수·평균·연속은 셈하지 않는다.
 * ⚠️ 신원은 이름 문자열(우댕·꼼이). 규칙이 열려 있어(firestore.rules) 위조를 막지는 못한다 — 둘만 쓰는 앱 전제.
 * ⚠️ 연습 모드(?practice=1)에서는 쓰기를 전부 막는다(practice.ts) — 검수자가 눌러 봐도 실제 책장이 안 바뀐다.
 */
import {
  collection, doc, query, orderBy, limit, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, getDocs,
  serverTimestamp, deleteField, writeBatch, FieldPath, type DocumentData,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll, type StorageReference } from 'firebase/storage';
import { db, storage } from './firebase';
import { nameFromCode } from './letters';
import { isPractice, practiceBlocked } from './practice';
import {
  LIMITS, type BookVM, type NoteVM, type Person, type PhotoVM, type Rating, type ReadingVM, type ReviewDraft, type ReviewVM,
} from './honeybraryTypes';

const BOOKS = 'honeyBooks';
const PAGE = 30;                                    // 책장·기록 한 번에 30개씩(GPT 회의 6번)

/** 문서 안 사람 열쇠 — 필드 이름·문서 id 는 영어로 둔다(한글 점 경로 함정 피하기). */
export const PERSON_KEY: Record<Person, string> = { '우댕': 'udaeng', '꼼이': 'kkomi' };
const KEY_PERSON: Record<string, Person> = { udaeng: '우댕', kkomi: '꼼이' };
const isPerson = (v: unknown): v is Person => v === '우댕' || v === '꼼이';

/** 이 폰에 꼼모닝으로 로그인한 사람(로그인코드 → 이름). 모르면 null. */
export function honeyMe(): Person | null {
  try {
    const code = JSON.parse(localStorage.getItem('kkom-user') || '{}').로그인코드;
    const n = code ? nameFromCode(code) : '';
    return isPerson(n) ? n : null;
  } catch { return null; }
}

/** 연습 모드면 막고 true. */
function blocked(what: string): boolean {
  if (!isPractice()) return false;
  practiceBlocked(what);
  return true;
}
export class PracticeBlocked extends Error { constructor() { super('practice'); } }

const posInt = (n: unknown): number | undefined => {
  const v = typeof n === 'number' ? Math.floor(n) : NaN;
  return Number.isFinite(v) && v > 0 && v < 100000 ? v : undefined;
};

// ── 사진 ─────────────────────────────────────────────────────────────────
/** 저장해 두는 사진 한 장(경로까지 — 교체·삭제가 확실하게). */
export interface StoredPhoto { id: string; url: string; thumbUrl: string; path: string; thumbPath: string; w?: number; h?: number }

async function resize(file: File, maxSide: number, quality: number): Promise<{ blob: Blob; w: number; h: number }> {
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
    if (long > maxSide) { const r = maxSide / long; w = Math.round(w * r); h = Math.round(h * r); }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', quality));
    return { blob, w, h };
  } finally { URL.revokeObjectURL(url); }
}

/** 사진 하나 → 원본(1600, q.8) + 작은 판(480, q.7). 밑줄 사진은 글자가 중요해서 1600(GPT 회의 2번). */
async function uploadPhoto(base: string, file: File): Promise<StoredPhoto> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 올릴 수 있어요.');
  const [full, thumb] = await Promise.all([resize(file, 1600, 0.8), resize(file, 480, 0.7)]);
  const path = `${base}.jpg`, thumbPath = `${base}_t.jpg`;
  const put = async (p: string, b: Blob) => {
    const r = storageRef(storage, p);
    await uploadBytes(r, b, { contentType: 'image/jpeg' });
    return getDownloadURL(r);
  };
  const [url, thumbUrl] = await Promise.all([put(path, full.blob), put(thumbPath, thumb.blob)]);
  return { id: base.split('/').pop() || String(Date.now()), url, thumbUrl, path, thumbPath, w: full.w, h: full.h };
}

/** 지우기 — 「이미 없음」은 성공으로 본다. */
async function removeFile(path?: string): Promise<void> {
  if (!path) return;
  try { await deleteObject(storageRef(storage, path)); }
  catch (e) { if ((e as { code?: string })?.code !== 'storage/object-not-found') throw e; }
}
async function removePhoto(p?: Pick<StoredPhoto, 'path' | 'thumbPath'> | null): Promise<void> {
  if (!p) return;
  await Promise.all([removeFile(p.path), removeFile(p.thumbPath)]);
}
async function removeFolder(r: StorageReference): Promise<void> {
  const res = await listAll(r);
  await Promise.all(res.items.map((it) => removeFile(it.fullPath)));
  for (const p of res.prefixes) await removeFolder(p);
}

const photoBase = (bookId: string) => `honeybrary/books/${bookId}`;
const stamp = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const toPhotoVM = (p: StoredPhoto): PhotoVM => ({ id: p.id, url: p.url, thumbUrl: p.thumbUrl || p.url, width: p.w, height: p.h });

function readStored(v: unknown): StoredPhoto | null {
  const o = v as Partial<StoredPhoto> | null;
  if (!o || typeof o.url !== 'string') return null;
  return { id: String(o.id ?? o.path ?? o.url), url: o.url, thumbUrl: o.thumbUrl || o.url, path: o.path || '', thumbPath: o.thumbPath || '', w: o.w, h: o.h };
}

// ── 책 ───────────────────────────────────────────────────────────────────
interface BookDoc { title: string; placedBy: Person; readers: Partial<Record<Person, ReadingVM>>; cover?: StoredPhoto | null }
export type HoneyBook = BookVM & { cover?: StoredPhoto | null };

function readReading(v: unknown): ReadingVM | null {
  const o = v as Partial<ReadingVM> | null;
  if (!o || (o.status !== 'reading' && o.status !== 'done' && o.status !== 'shelved')) return null;
  return { status: o.status, current: posInt(o.current), total: posInt(o.total) };
}
function readBook(id: string, d: DocumentData): HoneyBook {
  const readers: Partial<Record<Person, ReadingVM>> = {};
  for (const [k, v] of Object.entries((d.readers ?? {}) as Record<string, unknown>)) {
    const p = KEY_PERSON[k]; const r = readReading(v);
    if (p && r) readers[p] = r;
  }
  const cover = readStored(d.cover);
  return {
    id, title: String(d.title ?? ''), placedBy: isPerson(d.placedBy) ? d.placedBy : '우댕', readers,
    coverUrl: cover?.url, coverThumb: cover?.thumbUrl, cover,
  };
}
function cleanReading(r: ReadingVM): DocumentData {
  const out: DocumentData = { status: r.status };
  if (r.status === 'reading') {
    const c = posInt(r.current), t = posInt(r.total);
    if (c) out.current = c;
    if (t) out.total = t;
  }
  return out;
}

/** 책장 — 놓은 순(최근 먼저) n권. */
export function subscribeHoneyBooks(n: number, cb: (books: HoneyBook[], full: boolean) => void, onErr?: (e: unknown) => void) {
  const q = query(collection(db, BOOKS), orderBy('createdAt', 'desc'), limit(n));
  return onSnapshot(q, (s) => cb(s.docs.map((x) => readBook(x.id, x.data())), s.size >= n), (e) => onErr?.(e));
}
export const HONEY_PAGE = PAGE;

export function subscribeHoneyBook(id: string, cb: (b: HoneyBook | null) => void, onErr?: (e: unknown) => void) {
  return onSnapshot(doc(db, BOOKS, id), (s) => cb(s.exists() ? readBook(s.id, s.data()) : null), (e) => onErr?.(e));
}

/** 책 놓기 — 표지는 문서를 만든 뒤 올린다(경로에 책 id 가 필요하다). 표지 올리기가 실패해도 책은 남는다. */
export async function addHoneyBook(input: {
  title: string; by: Person; readerMode: 'me' | 'partner' | 'both'; current?: number; total?: number; cover?: File | null;
}): Promise<string> {
  if (blocked('책 놓기')) throw new PracticeBlocked();
  const title = input.title.trim().slice(0, LIMITS.title);
  if (!title) throw new Error('제목이 비었어요');
  const partner: Person = input.by === '우댕' ? '꼼이' : '우댕';
  const first: Person = input.readerMode === 'partner' ? partner : input.by;
  const readers: DocumentData = { [PERSON_KEY[first]]: cleanReading({ status: 'reading', current: input.current, total: input.total }) };
  if (input.readerMode === 'both') readers[PERSON_KEY[partner]] = { status: 'reading' };   // 쪽수는 각자 판본이 달라 내 것만
  const ref = await addDoc(collection(db, BOOKS), { title, placedBy: input.by, readers, createdAt: serverTimestamp() });
  if (input.cover) {
    try {
      const cover = await uploadPhoto(`${photoBase(ref.id)}/cover_${stamp()}`, input.cover);
      await updateDoc(ref, { cover });
    } catch (e) { console.error('표지 올리기 실패(책은 놓임):', e); }
  }
  return ref.id;
}

export async function renameHoneyBook(id: string, title: string): Promise<void> {
  if (blocked('제목 고치기')) throw new PracticeBlocked();
  const t = title.trim().slice(0, LIMITS.title);
  if (t) await updateDoc(doc(db, BOOKS, id), { title: t });
}

/** 표지 바꾸기 — 새것을 올리고 문서를 바꾼 **뒤** 옛 파일을 지운다(문서 저장이 실패하면 새 파일을 되지운다). */
export async function setHoneyCover(book: HoneyBook, file: File): Promise<void> {
  if (blocked('표지 바꾸기')) throw new PracticeBlocked();
  const next = await uploadPhoto(`${photoBase(book.id)}/cover_${stamp()}`, file);
  try { await updateDoc(doc(db, BOOKS, book.id), { cover: next }); }
  catch (e) { await removePhoto(next).catch(() => {}); throw e; }
  await removePhoto(book.cover).catch((e) => console.warn('옛 표지 지우기 실패:', e));
}

/** 내 진행 — 나만 고친다(남의 줄엔 고치기 단추가 없다). ⚠️ 시각을 남기지 않는다. */
export async function setMyHoneyReading(bookId: string, me: Person, r: ReadingVM): Promise<void> {
  if (blocked('진행 고치기')) throw new PracticeBlocked();
  await updateDoc(doc(db, BOOKS, bookId), new FieldPath('readers', PERSON_KEY[me]), cleanReading(r));
}

/** 책 지우기 — 사진(폴더째) → 기록 → 감상 → 책. 파일 지우기가 실패하면 문서는 남겨 두고 멈춘다(다시 하면 이어서). */
export async function deleteHoneyBook(bookId: string): Promise<void> {
  if (blocked('책 지우기')) throw new PracticeBlocked();
  await removeFolder(storageRef(storage, photoBase(bookId)));
  for (const sub of ['notes', 'reviews']) {
    const snap = await getDocs(collection(db, BOOKS, bookId, sub));
    for (let i = 0; i < snap.docs.length; i += 450) {
      const b = writeBatch(db);
      snap.docs.slice(i, i + 450).forEach((d) => b.delete(d.ref));
      await b.commit();
    }
  }
  await deleteDoc(doc(db, BOOKS, bookId));
}

// ── 기록 ─────────────────────────────────────────────────────────────────
export type HoneyNote = NoteVM & { stored?: StoredPhoto | null };

function readNote(id: string, d: DocumentData): HoneyNote | null {
  if (!isPerson(d.by)) return null;
  const stored = readStored(d.photo);
  return {
    id, by: d.by,
    text: typeof d.text === 'string' && d.text ? d.text : undefined,
    page: posInt(d.page),
    photo: stored ? toPhotoVM(stored) : undefined, stored,
    parentNoteId: typeof d.parentNoteId === 'string' ? d.parentNoteId : undefined,
  };
}

/** 최신 n개를 받아 **오래된 순**으로 돌려준다(위에서 아래로 읽는 흐름). full = 더 오래된 게 남았을 수 있음. */
export function subscribeHoneyNotes(bookId: string, n: number, cb: (notes: HoneyNote[], full: boolean) => void, onErr?: (e: unknown) => void) {
  const q = query(collection(db, BOOKS, bookId, 'notes'), orderBy('createdAt', 'desc'), limit(n));
  return onSnapshot(q, (s) => {
    const out = s.docs.map((x) => readNote(x.id, x.data())).filter((x): x is HoneyNote => !!x).reverse();
    cb(out, s.size >= n);
  }, (e) => onErr?.(e));
}

export async function addHoneyNote(bookId: string, input: { by: Person; text?: string; page?: number; photo?: File | null; parentNoteId?: string }): Promise<void> {
  if (blocked(input.parentNoteId ? '한 줄 잇기' : '기록 남기기')) throw new PracticeBlocked();
  const text = (input.text ?? '').trim().slice(0, input.parentNoteId ? LIMITS.reply : LIMITS.note);
  if (!text && !input.photo) return;
  const ref = doc(collection(db, BOOKS, bookId, 'notes'));
  const data: DocumentData = { by: input.by, createdAt: serverTimestamp() };
  if (text) data.text = text;
  const page = posInt(input.page);
  if (page && !input.parentNoteId) data.page = page;
  if (input.parentNoteId) data.parentNoteId = input.parentNoteId;
  let photo: StoredPhoto | null = null;
  if (input.photo && !input.parentNoteId) {
    photo = await uploadPhoto(`${photoBase(bookId)}/notes/${ref.id}_${stamp()}`, input.photo);
    data.photo = photo;
  }
  try { await setDoc(ref, data); }
  catch (e) { await removePhoto(photo).catch(() => {}); throw e; }
}

/** 기록 지우기 — 원 기록이면 **이어진 한 줄도 같이**(사이담은 남겨서 답이 위로 올라왔다 — GPT 회의 1번). */
export async function deleteHoneyNote(bookId: string, note: HoneyNote, replies: HoneyNote[] = []): Promise<void> {
  if (blocked('기록 지우기')) throw new PracticeBlocked();
  await removePhoto(note.stored);
  const b = writeBatch(db);
  b.delete(doc(db, BOOKS, bookId, 'notes', note.id));
  if (!note.parentNoteId) replies.forEach((r) => b.delete(doc(db, BOOKS, bookId, 'notes', r.id)));
  await b.commit();
}

// ── 감상 ─────────────────────────────────────────────────────────────────
export type HoneyReview = ReviewVM & { stored: StoredPhoto[] };

function readReview(id: string, d: DocumentData): HoneyReview | null {
  const by = KEY_PERSON[id];
  if (!by) return null;
  const stored = (Array.isArray(d.photos) ? d.photos : []).map(readStored).filter((x: StoredPhoto | null): x is StoredPhoto => !!x);
  const r = Number(d.rating);
  const reply = d.reply && isPerson(d.reply.by) && typeof d.reply.text === 'string' && d.reply.text ? { by: d.reply.by as Person, text: d.reply.text as string } : undefined;
  return {
    id, by,
    rating: r >= 1 && r <= 5 ? (Math.round(r) as Rating) : undefined,
    keywords: (Array.isArray(d.keywords) ? d.keywords : []).filter((k: unknown) => typeof k === 'string').slice(0, LIMITS.keywords),
    headline: typeof d.headline === 'string' && d.headline ? d.headline : undefined,
    body: typeof d.body === 'string' && d.body ? d.body : undefined,
    photos: stored.map(toPhotoVM), stored,
    hasSpoiler: d.hasSpoiler === true,
    reply,
  };
}

/** 이 책의 감상(많아야 둘). 우댕 → 꼼이 순이 아니라 **나 먼저**는 화면이 정한다. */
export function subscribeHoneyReviews(bookId: string, cb: (rs: HoneyReview[]) => void, onErr?: (e: unknown) => void) {
  return onSnapshot(collection(db, BOOKS, bookId, 'reviews'), (s) => {
    cb(s.docs.map((x) => readReview(x.id, x.data())).filter((x): x is HoneyReview => !!x));
  }, (e) => onErr?.(e));
}

/** 감상 쓰기·고치기. 사진: keep = 남길 저장된 사진(순서대로), add = 새로 고른 파일(2장씩 올림).
 *  빠진 옛 사진은 문서를 저장한 **뒤** 지운다. 상대의 한마디(reply)는 건드리지 않는다(merge). */
export async function saveHoneyReview(bookId: string, by: Person, draft: ReviewDraft, photos: { keep: StoredPhoto[]; add: File[]; prev: StoredPhoto[] },
  opts: { isNew: boolean; onProgress?: (done: number) => void }): Promise<void> {
  const { onProgress } = opts;
  if (blocked('감상 남기기')) throw new PracticeBlocked();
  const key = PERSON_KEY[by];
  const added: StoredPhoto[] = [];
  const room = Math.max(0, LIMITS.photos - photos.keep.length);
  const files = photos.add.slice(0, room);
  try {
    for (let i = 0; i < files.length; i += 2) {                  // 동시에 두 장까지(GPT 회의 6번)
      const got = await Promise.all(files.slice(i, i + 2).map((f) => uploadPhoto(`${photoBase(bookId)}/reviews/${key}_${stamp()}`, f)));
      added.push(...got);
      onProgress?.(added.length);
    }
    const rating = draft.rating && draft.rating >= 1 && draft.rating <= 5 ? draft.rating : null;
    const data: DocumentData = {
      by,
      rating: rating ?? deleteField(),
      keywords: draft.keywords.slice(0, LIMITS.keywords),
      headline: draft.headline.trim().slice(0, LIMITS.headline) || deleteField(),
      body: draft.body.trim().slice(0, LIMITS.body) || deleteField(),
      photos: [...photos.keep, ...added],
      hasSpoiler: !!draft.hasSpoiler,
    };
    if (opts.isNew) data.createdAt = serverTimestamp();
    await setDoc(doc(db, BOOKS, bookId, 'reviews', key), data, { merge: true });
  } catch (e) {
    await Promise.all(added.map((p) => removePhoto(p).catch(() => {})));
    throw e;
  }
  const keepIds = new Set(photos.keep.map((p) => p.path));
  await Promise.all(photos.prev.filter((p) => !keepIds.has(p.path)).map((p) => removePhoto(p).catch(() => {})));
}

export async function deleteHoneyReview(bookId: string, review: HoneyReview): Promise<void> {
  if (blocked('감상 지우기')) throw new PracticeBlocked();
  await Promise.all(review.stored.map((p) => removePhoto(p)));
  await deleteDoc(doc(db, BOOKS, bookId, 'reviews', PERSON_KEY[review.by]));
}

/** 상대의 한마디 — 리뷰당 하나, 고칠 수 있음, 빈 글이면 지움. 감상 쓴 사람은 자기 감상에 못 단다(화면이 막음). */
export async function setHoneyReply(bookId: string, reviewBy: Person, replier: Person, text: string): Promise<void> {
  if (blocked('한마디')) throw new PracticeBlocked();
  if (replier === reviewBy) return;
  const t = text.trim().slice(0, LIMITS.partnerReply);
  await updateDoc(doc(db, BOOKS, bookId, 'reviews', PERSON_KEY[reviewBy]), { reply: t ? { by: replier, text: t } : deleteField() });
}
