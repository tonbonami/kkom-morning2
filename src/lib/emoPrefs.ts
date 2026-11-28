'use client';
/**
 * 이모티콘 서랍 설정 — **어느 팩을 서랍에 띄울지**, **입력할 때 추천을 받을지**, **탭 순서.**
 * 사이담 src/lib/emoPrefs.ts(02ac86b·8011711·3dd9b2b)를 꼼모닝으로 옮김.
 *
 * 우댕 2026-11-17: 「Saidam의 이모티콘 설정 기능 꼼모닝에도 그대로 이식해줘. 그리고 카톡처럼 탭을 꾹 눌러서
 *   좌우로 이동시켜서 자주 사용하는 거 앞으로 끌어오는 거 가능하도록.」
 *
 * ⭐ **숨김은 「고르는 자리」에서만 뺀다** — 꼼톡 서랍·찾기·추천(입력칸 그림)·짝 답장·★·자주·최근, 편지 큰 이모티콘 서랍·미니 서랍.
 *    ⚠️⚠️ 받은 이모티콘, 예전에 보낸 이모티콘, 글 속 `(사랑해)` 그림은 **절대 안 바뀐다.** 글 속 미니는 볼 때마다 그림이 되므로
 *    renderRich·splitMini 는 이 설정을 보지 않는다(보게 하면 지난 대화가 글자로 바뀐다).
 * ⭐ 사람마다 Firestore `userPrefs/{udaeng|kkomi}.emoticonPrefs` — 폰을 바꿔도 따라온다. ★·최근은 기기 저장(사용 기록)이지만 이건 환경설정.
 * ⭐ **숨긴 팩 id 만 적는다** → 새로 나온 팩은 저절로 보인다. 순서도 옮긴 id 만 — 목록에 없는 새 팩은 **원래 자리에** 끼워 들어간다.
 * ⚠️ ★·자주·최근 **기록은 지우지 않는다** — 화면에서만 빠지고, 다시 표시하면 돌아온다.
 * ⚠️ 연습 모드(?practice=1)에서는 서버에 안 적는다 — 검수자가 누른 것이 진짜 설정을 바꾸면 안 된다(화면에서만 바뀜).
 * 팩 id 는 꼼톡 서랍 탭 id(ChatPanel 의 StickerMode, 'recent' 제외). 편지 팩은 LETTER_SET_TO_PACK 으로 맞춘다.
 */
import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { isPractice } from './practice';

export interface EmoPrefs {
  hiddenSetIds: string[];
  suggestionsEnabled: boolean;
  /** 사용자가 정한 탭 순서(팩 id). 비어 있으면 기본 순서. */
  order: string[];
}
export const EMO_PREFS_DEFAULT: EmoPrefs = { hiddenSetIds: [], suggestionsEnabled: true, order: [] };
const MAX = 60;

/** 편지 큰 이모티콘 팩 id → 꼼톡 서랍 팩 id. 여기 없는 편지 팩(사랑 빠샤)은 꼼톡에 없어서 관리 대상이 아니다(늘 보임). */
export const LETTER_SET_TO_PACK: Record<string, string> = {
  kkom_anim: 'gif', kkom_sai: 'maltipoo', kkom_office: 'office', kkul: 'kkul', kkul_anim: 'kkulgif', kkul_glasses: 'kkulg', uri: 'uri', pochacco_dang: 'dang', pochacco_kkom: 'kkom',
};

const PERSON_KEY: Record<string, string> = { '우댕': 'udaeng', '꼼이': 'kkomi' };

/**
 * 꼼톡 서랍의 팩 탭(「최근·자주」 빼고) — 관리 화면 목록이자 서랍 탭의 기본. 꼼톡(ChatPanel)도 이걸 쓴다.
 * 순서 = 원래 탭 순서(꿀됑·꿀됑 움짤·우리가 끝인 건 우댕 지시). 실제 기본 순서는 defaultPacks(me) — 내 캐릭터 팩이 앞.
 */
export const CHAT_PACKS = [
  { id: 'gif',      name: '움짤',      thumb: '/emo/sai-anim/love-still.png' },
  { id: 'maltipoo', name: '말티푸',    thumb: '/emo/sai/kkk.webp' },
  { id: 'office',   name: '직장인 꼼이', thumb: '/emo/kkom/office/k04-salryeojwo.webp' }, // 찍찍이 출근길 꼼이 16종(2026-11-26 전면 교체)
  { id: 'basic',    name: '기분',      thumb: '/emo/kkuldaeng/mood/happy.png' }, // 기분 얼굴 12 — 우댕=꿀됑·꼼이=꼼이(2026-11-28 포차코에서 교체, 썸네일은 defaultPacks 가 사람별로)
  { id: 'dang',     name: '우댕',      thumb: '/pochacco_dang/cutekkomi.png' },
  { id: 'kkom',     name: '꼼이',      thumb: '/pochacco_kkom/kkomiyap.png' },
  { id: 'couple',   name: '커플',      thumb: '/pochacco_couple/love.png' },
  { id: 'mini',     name: '미니',      thumb: '/emo/saidami/love.webp' },
  { id: 'kkul',     name: '꿀됑',      thumb: '/emo/kkuldaeng/01-ggomsyun.webp' },   // 우댕 지시: 탭 맨 끝
  { id: 'kkulgif',  name: '꿀됑 움짤', thumb: '/emo/sai-anim/kkul-euak-still.png' },  // 우댕 지시: 움짤은 탭 따로
  { id: 'kkulg',    name: '안경 꿀됑', thumb: '/emo/kkuldaeng/glasses/g01-algesseo.webp' }, // 안경 쓴 지적인 꿀됑 12종(2026-11-25)
  { id: 'uri',      name: '우리',      thumb: '/emo/uri/03-love.webp' },               // 꿀됑+꼼이 커플 16종 — 맨 끝(2026-10-27)
] as const;
export type ChatPackId = (typeof CHAT_PACKS)[number]['id'];
/** 포차코(산리오) 그림 팩 — 시연 모드(공모전 영상)에선 서랍·관리 화면에서 뺀다. */
export const POCHACCO_PACKS: string[] = ['dang', 'kkom', 'couple'];
/** 내 캐릭터 팩 — 우댕은 꿀됑·꿀됑 움짤·우댕 포차코, 꼼이는 꼼이 움짤·꼼이 포차코·미니. 탭 앞자리 + 추천 가산점. */
export const OWN_PACKS: Record<string, ChatPackId[]> = { '우댕': ['kkul', 'kkulgif', 'kkulg', 'dang'], '꼼이': ['gif', 'office', 'kkom', 'mini'] };
/** 기본 탭 순서 — 내 캐릭터 팩 먼저, 나머지는 원래 순서. 사용자 순서(withOrder)는 이 위에 입힌다. */
export function defaultPacks(me: string): { id: ChatPackId; name: string; thumb: string }[] {
  const own = OWN_PACKS[me] ?? [];
  const rank = (id: ChatPackId) => (own.includes(id) ? own.indexOf(id) : 100 + CHAT_PACKS.findIndex((t) => t.id === id));
  return [...CHAT_PACKS].sort((a, b) => rank(a.id) - rank(b.id))
    .map((t) => (t.id === 'basic' && me !== '우댕' ? { ...t, thumb: '/emo/saidami/happy.webp' } : t));
}

function parse(raw: unknown): EmoPrefs {
  const r = (raw ?? {}) as { hiddenSetIds?: unknown; suggestionsEnabled?: unknown; order?: unknown };
  const strs = (v: unknown) => (Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length <= 40))].slice(0, MAX)
    : []);
  return { hiddenSetIds: strs(r.hiddenSetIds), suggestionsEnabled: r.suggestionsEnabled !== false, order: strs(r.order) };
}

/** 첫 그림에서 숨긴 팩이 잠깐 떴다 사라지지 않게, 마지막 값을 기기에도 적어 둔다. */
const ckey = (who: string) => `kkom-emo-prefs:${who}`;
function readCache(who: string): EmoPrefs | null {
  try { const raw = localStorage.getItem(ckey(who)); return raw ? parse(JSON.parse(raw)) : null; } catch { return null; }
}
function writeCache(who: string, p: EmoPrefs) {
  try { localStorage.setItem(ckey(who), JSON.stringify(p)); } catch { /* 저장이 막힌 기기 — 없어도 된다 */ }
}

/** 숨긴 팩을 뺀 목록. 서랍·추천·★ 가 전부 이 결과를 쓴다. */
export function withoutHidden<T extends { id: string }>(sets: T[], prefs: EmoPrefs): T[] {
  if (!prefs.hiddenSetIds.length) return sets;
  return sets.filter((s) => !prefs.hiddenSetIds.includes(s.id));
}

/**
 * 사용자 순서를 입힌다. 순서 목록에 있는 팩끼리는 그 순서로, **없는 팩(새 팩)은 기본 자리 그대로.**
 * 예) 기본 [a b c d], 순서 [c a] → [c b a d] — a·c 가 차지하던 자리(0·2)에 c·a 가 들어간다.
 */
export function withOrder<T extends { id: string }>(sets: T[], prefs: EmoPrefs): T[] {
  if (!prefs.order.length) return sets;
  const rank = new Map(prefs.order.map((id, i) => [id, i]));
  const ordered = sets.filter((s) => rank.has(s.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  let k = 0;
  return sets.map((s) => (rank.has(s.id) ? ordered[k++] : s));
}

export function useEmoPrefs(me: string): {
  prefs: EmoPrefs;
  /** 이 팩을 서랍에 띄울지. 저장에 실패하면 false 를 돌려주고 화면을 되돌린다. */
  setShown: (setId: string, shown: boolean) => Promise<boolean>;
  setSuggestions: (on: boolean) => Promise<boolean>;
  /** 탭 순서를 저장한다. 보이는 팩 id 를 새 순서대로. 숨긴 팩은 예전 순서 뒤에 붙여 기억해 둔다. */
  setOrder: (visibleIds: string[]) => Promise<boolean>;
  resetOrder: () => Promise<boolean>;
} {
  const key = PERSON_KEY[me] ?? '';
  const [prefs, setPrefs] = useState<EmoPrefs>(EMO_PREFS_DEFAULT);

  useEffect(() => {
    if (!key) { setPrefs(EMO_PREFS_DEFAULT); return; }
    const cached = readCache(key);
    if (cached) setPrefs(cached);
    if (isPractice()) return;           // 연습 모드 — 기기 사본만 보고, 서버 값을 따라 바꾸지 않는다
    return onSnapshot(doc(db, 'userPrefs', key), (s) => {
      const p = parse(s.data()?.emoticonPrefs);
      setPrefs(p);
      writeCache(key, p);
    }, () => { /* 못 읽으면 기기에 적힌 값(또는 기본값)으로 둔다 */ });
  }, [key]);

  const save = useCallback(async (next: EmoPrefs, prev: EmoPrefs): Promise<boolean> => {
    if (!key) return false;
    setPrefs(next);            // 먼저 그린다 — 스위치가 늦게 따라오면 두 번 누르게 된다
    if (isPractice()) return true;
    try {
      await setDoc(doc(db, 'userPrefs', key), { emoticonPrefs: next }, { merge: true });
      writeCache(key, next);
      return true;
    } catch {
      setPrefs(prev);
      return false;
    }
  }, [key]);

  const setShown = useCallback((setId: string, shown: boolean) => {
    const ids = prefs.hiddenSetIds.filter((x) => x !== setId);
    if (!shown) ids.push(setId);
    return save({ ...prefs, hiddenSetIds: ids.slice(0, MAX) }, prefs);
  }, [prefs, save]);

  const setSuggestions = useCallback(
    (on: boolean) => save({ ...prefs, suggestionsEnabled: on }, prefs), [prefs, save]);

  const setOrder = useCallback((visibleIds: string[]) => {
    const rest = prefs.order.filter((id) => !visibleIds.includes(id));
    return save({ ...prefs, order: [...visibleIds, ...rest].slice(0, MAX) }, prefs);
  }, [prefs, save]);

  const resetOrder = useCallback(() => save({ ...prefs, order: [] }, prefs), [prefs, save]);

  return { prefs, setShown, setSuggestions, setOrder, resetOrder };
}
