// 저장 충돌 때 이 기기에서 쓴 장을 잠시 보관한다. 서버에는 올리지 않고 이 기기의 localStorage 만 쓴다.
import type { DiaryPageVM, Person } from './diaryTypes';

const PREFIX = 'kk-diary-conflict:';
const KEEP_PER_PAGE = 5;
const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

export interface DiaryConflictStash {
  key: string;
  savedAt: number;
  page: DiaryPageVM;
}

const pageId = (date: string, owner: Person) => `${date}_${owner === '우댕' ? 'udaeng' : 'kkomi'}`;
const prefixOf = (date: string, owner: Person) => `${PREFIX}${pageId(date, owner)}:`;

function keys(): string[] {
  if (typeof localStorage === 'undefined') return [];
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) out.push(key);
    }
  } catch { /* 보관함을 못 읽는 브라우저 */ }
  return out;
}

function read(key: string): DiaryConflictStash | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const page = JSON.parse(raw) as Partial<DiaryPageVM>;
    const savedAt = Number(key.slice(key.lastIndexOf(':') + 1));
    if (!Number.isFinite(savedAt) || typeof page.date !== 'string' || (page.owner !== '우댕' && page.owner !== '꼼이') || typeof page.text !== 'string' || !Array.isArray(page.items)) return null;
    return { key, savedAt, page: page as DiaryPageVM };
  } catch { return null; }
}

/** 한 장의 보관본. 최신 것이 먼저 온다. */
export function readDiaryConflictStashes(date: string, owner: Person): DiaryConflictStash[] {
  return keys().filter((key) => key.startsWith(prefixOf(date, owner))).map(read).filter((v): v is DiaryConflictStash => !!v).sort((a, b) => b.savedAt - a.savedAt);
}

/** 한 장을 최근 keep 개만 남긴다. preserveKeys 는 복구 중 꼭 지켜야 할 보관본이다. */
export function pruneDiaryConflictStashes(date: string, owner: Person, keep = KEEP_PER_PAGE, preserveKeys: string[] = []): void {
  const list = readDiaryConflictStashes(date, owner);
  let removeCount = Math.max(0, list.length - keep);
  const preserve = new Set(preserveKeys);
  [...list].reverse().forEach((old) => {
    if (removeCount > 0 && !preserve.has(old.key)) { removeDiaryConflictStash(old.key); removeCount -= 1; }
  });
}

/** 보관하고, 보통은 같은 장의 최근 5개만 남긴다. trim=false 는 복구 저장이 끝날 때까지 기존 보관본을 지키는 용도다. */
export function stashDiaryConflictPage(page: DiaryPageVM, now = Date.now(), trim = true): DiaryConflictStash | null {
  try {
    let savedAt = now;
    let key = `${prefixOf(page.date, page.owner)}${savedAt}`;
    while (localStorage.getItem(key) !== null) { savedAt += 1; key = `${prefixOf(page.date, page.owner)}${savedAt}`; }
    // 다시 열 수 없는 blob: 그림은 저장하지 않는다. 이미 올라간 사진·필기의 path/src 는 그대로 지킨다.
    const stored = { ...page, items: page.items.filter((item) => !(item.src ?? '').startsWith('blob:')) };
    localStorage.setItem(key, JSON.stringify(stored));
    if (trim) pruneDiaryConflictStashes(page.date, page.owner);
    return read(key);
  } catch { return null; }
}

export function removeDiaryConflictStash(key: string): void {
  if (!key.startsWith(PREFIX)) return;
  try { localStorage.removeItem(key); } catch { /* */ }
}

/** 앱을 열 때 30일 지난 보관본과 읽을 수 없는 보관본을 조용히 치운다. */
export function cleanupDiaryConflictStashes(now = Date.now()): void {
  keys().forEach((key) => {
    const item = read(key);
    if (!item || now - item.savedAt > KEEP_MS) removeDiaryConflictStash(key);
  });
  const byPage = new Map<string, DiaryConflictStash[]>();
  keys().map(read).filter((v): v is DiaryConflictStash => !!v).forEach((item) => {
    const id = pageId(item.page.date, item.page.owner);
    byPage.set(id, [...(byPage.get(id) ?? []), item]);
  });
  byPage.forEach((list) => list.sort((a, b) => b.savedAt - a.savedAt).slice(KEEP_PER_PAGE).forEach((old) => removeDiaryConflictStash(old.key)));
}

/** 보관본이 쓰는 Storage 파일. 이 목록은 장 저장 뒤 파일 정리에서 빼서 사진·필기를 되살릴 수 있게 한다. */
export function diaryConflictProtectedPaths(): Set<string> {
  const paths = new Set<string>();
  keys().map(read).filter((v): v is DiaryConflictStash => !!v).forEach(({ page }) => {
    page.items.forEach((item) => {
      if (item.path) paths.add(item.path);
      if (item.strokePath) paths.add(item.strokePath);
    });
  });
  return paths;
}
