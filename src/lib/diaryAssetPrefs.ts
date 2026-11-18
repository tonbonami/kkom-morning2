'use client';
/**
 * 다이어리 스티커 서랍 설정 — **어느 팩 탭을 띄울지**, **탭 순서.**
 * 우댕 2026-11-18: 「여기 스티커도 꼼톡처럼 이모티콘 배치 설정에서 탭(종류)을 아예 끄거나, 드래그로 이동할 수 있어야 해.」
 * GPT 계획(claude.ai/artifact/Bg7SJJFVUGxZpDLD3AGp6q A): 꼼톡 설정(emoPrefs.ts)과 **따로** 둔다 —
 *   팩 id 가 서로 다르고(꼼톡 maltipoo ↔ 다이어리 kkom), 테이프·도장·다꾸 전용 팩은 꼼톡에 없어서.
 *
 *   userPrefs/{udaeng|kkomi}.diaryAssetPrefs = { hiddenPackIds, order }
 *
 * ⭐ 숨긴 id·옮긴 id 만 적는다 → 새로 생긴 팩은 저절로 보이고, 순서 목록에 없으면 원래 자리에 끼워진다(emoPrefs 와 같은 규칙).
 * ⭐ 「최근·즐겨찾기」는 팩이 아니다 — 늘 맨 앞, 끄거나 옮길 수 없다. 숨긴 팩의 그림은 최근·즐겨찾기에서도 빠지지만 기록은 안 지운다.
 * ⚠️⚠️ 이미 장·달력에 붙인 스티커는 **절대 안 바뀐다** — 붙인 물건은 그림 주소를 직접 갖고 있고, 불러올 때 이 설정을 보지 않는다.
 * ⚠️ 연습 모드(?practice=1)는 서버·기기 어디에도 안 적는다(화면에서만 바뀜).
 */
import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { isPractice } from './practice';

export interface DiaryAssetPrefs { hiddenPackIds: string[]; order: string[] }
export const DIARY_ASSET_PREFS_DEFAULT: DiaryAssetPrefs = { hiddenPackIds: [], order: [] };
const MAX = 60;
const PERSON_KEY: Record<string, string> = { '우댕': 'udaeng', '꼼이': 'kkomi' };

function parse(raw: unknown): DiaryAssetPrefs {
  const r = (raw ?? {}) as { hiddenPackIds?: unknown; order?: unknown };
  const strs = (v: unknown) => (Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length <= 40))].slice(0, MAX)
    : []);
  return { hiddenPackIds: strs(r.hiddenPackIds), order: strs(r.order) };
}

const ckey = (who: string) => `kkom-diary-asset-prefs:${who}`;
function readCache(who: string): DiaryAssetPrefs | null {
  try { const raw = localStorage.getItem(ckey(who)); return raw ? parse(JSON.parse(raw)) : null; } catch { return null; }
}
function writeCache(who: string, p: DiaryAssetPrefs) {
  try { localStorage.setItem(ckey(who), JSON.stringify(p)); } catch { /* 저장이 막힌 기기 — 없어도 된다 */ }
}

/** 보이는 팩만, 사용자 순서대로. 순서 목록에 없는 팩(새 팩)은 기본 자리 그대로(emoPrefs withOrder 와 같은 방식). */
export function visiblePacksOf<T extends { id: string }>(packs: T[], prefs: DiaryAssetPrefs): T[] {
  const shown = prefs.hiddenPackIds.length ? packs.filter((p) => !prefs.hiddenPackIds.includes(p.id)) : packs;
  if (!prefs.order.length) return shown;
  const rank = new Map(prefs.order.map((id, i) => [id, i]));
  const ordered = shown.filter((s) => rank.has(s.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  let k = 0;
  return shown.map((s) => (rank.has(s.id) ? ordered[k++] : s));
}

export function useDiaryAssetPrefs(me: string): {
  prefs: DiaryAssetPrefs;
  setShown: (packId: string, shown: boolean) => Promise<boolean>;
  /** 보이는 팩 id 를 새 순서대로. 숨긴 팩의 예전 자리는 뒤에 붙여 기억해 둔다. */
  setOrder: (visibleIds: string[]) => Promise<boolean>;
  resetOrder: () => Promise<boolean>;
} {
  const key = PERSON_KEY[me] ?? '';
  const [prefs, setPrefs] = useState<DiaryAssetPrefs>(DIARY_ASSET_PREFS_DEFAULT);

  useEffect(() => {
    if (!key) { setPrefs(DIARY_ASSET_PREFS_DEFAULT); return; }
    const cached = readCache(key);
    if (cached) setPrefs(cached);
    if (isPractice()) return;
    return onSnapshot(doc(db, 'userPrefs', key), (s) => {
      const p = parse(s.data()?.diaryAssetPrefs);
      setPrefs(p);
      writeCache(key, p);
    }, () => { /* 못 읽으면 기기에 적힌 값(또는 기본값)으로 둔다 */ });
  }, [key]);

  const save = useCallback(async (next: DiaryAssetPrefs, prev: DiaryAssetPrefs): Promise<boolean> => {
    if (!key) return false;
    setPrefs(next);
    if (isPractice()) return true;
    try {
      await setDoc(doc(db, 'userPrefs', key), { diaryAssetPrefs: next }, { merge: true });
      writeCache(key, next);
      return true;
    } catch {
      setPrefs(prev);
      return false;
    }
  }, [key]);

  const setShown = useCallback((packId: string, shown: boolean) => {
    const ids = prefs.hiddenPackIds.filter((x) => x !== packId);
    if (!shown) ids.push(packId);
    return save({ ...prefs, hiddenPackIds: ids.slice(0, MAX) }, prefs);
  }, [prefs, save]);

  const setOrder = useCallback((visibleIds: string[]) => {
    const rest = prefs.order.filter((id) => !visibleIds.includes(id));
    return save({ ...prefs, order: [...visibleIds, ...rest].slice(0, MAX) }, prefs);
  }, [prefs, save]);

  const resetOrder = useCallback(() => save({ ...prefs, order: [] }, prefs), [prefs, save]);

  return { prefs, setShown, setOrder, resetOrder };
}
