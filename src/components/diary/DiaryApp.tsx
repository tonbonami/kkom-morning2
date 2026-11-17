'use client';

// 다꾸 다이어리 — 진짜 화면(저장 연결). Gemini 시안 부품(DiaryDayScreen·DiaryMonthScreen …)은 그대로 두고,
// 여기서 데이터(src/lib/diary.ts)와 잇는다. 시험 화면(app/diary/test)의 가짜 상태를 진짜 저장으로 바꾼 것.
//
//   내 장: 열 때 한 번 읽고 → 고칠 때마다 폰에 먼저 적고(되살리기용) → 1.5초 뒤 서버에 통째로 저장.
//   상대 장: 켜 둔 채로 보기만(상대가 고치면 바로 바뀜).
//   월간 꾸미기: 만진 칸만 바로 저장. 「같이」는 둘 다, 각자 달력은 주인만 고친다.
//
// ⚠️ 못 읽은 장(오프라인)은 고치지 못하게 막는다 — 빈 장인 줄 알고 저장하면 서버의 진짜 장을 덮는다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiaryDayScreen } from './DiaryDayScreen';
import { DiaryAssetDrawer } from './DiaryAssetDrawer';
import { DiaryMonthScreen } from './DiaryMonthScreen';
import { DiaryMonthMemoSheet } from './DiaryMonthMemoSheet';
import { DiaryMonthSpanSheet } from './DiaryMonthSpanSheet';
import { DiarySpecialDatesSheet } from './DiarySpecialDatesSheet';
import { DiaryDayAgendaSheet } from './DiaryDayAgendaSheet';
import { DiaryEventSheet } from './DiaryEventSheet';
import { DiaryUpcomingSheet } from './DiaryUpcomingSheet';
import { DECOR_ASSETS } from './DiaryDecor';
import { KKUL_STICKERS, SAI_STICKERS, URI_STICKERS } from '@/lib/stickerPacks';
import { subscribeCalendar, type CalendarEvent } from '@/lib/calendar';
import { addDaysYmd, eventsOnDate, todayYmd } from '@/lib/calendarLayout';
import { holidayName } from '@/lib/holidays';
import { blankEventDraft, buildMonthBands, buildUpcoming, draftOfEvent, eventsForOwner, normalizeEventDraft, toEventVM } from '@/lib/diaryCalendar';
import { isPractice } from '@/lib/practice';
import {
  BUILTIN_SPECIALS, PracticeBlocked, addSpecialDate, applyMonthPatch, blankDiaryPage, clearDiaryDraft, deleteDiaryPhotos, deleteSpecialDate,
  diaryPageHasContent, diaryPageId, emptyMonthDeco, invertMonthPatch, loadDiaryPage, prepareDiaryPhoto, readDiaryDraft, saveDiaryDraft, saveDiaryPage,
  removeDiaryEvent, saveDiaryEvent, seedSpecialDates, specialsOn, subscribeDiaryMonth, subscribeDiaryMonthMeta, subscribeDiaryPage, subscribeSpecialDates, uploadDiaryPhoto,
  writeDiaryMonthPatch, addDiaryNote, deleteDiaryNote, setDiaryHeart, subscribeDiaryNotes, appPhotoFile, type AppPhotoVM, type DiaryMeta, type DiaryNoteVM, type MonthDeco, type MonthPatch,
} from '@/lib/diary';
import {
  DIARY_LIMITS, DIARY_PROMPTS, MONTH_LIMITS, type DiaryAssetVM, type DiaryChipVM, type DiaryEventDraft, type DiaryItemAction, type DiaryItemVM, type DiaryMonthCellVM, type DiaryPageVM,
  type DiaryPaperTheme, type DiaryPhotoFrame, type DiaryPhotoSource, type MonthOwner, type MonthStickerVM, type MonthTool, type Person, type SpecialDateVM,
} from '@/lib/diaryTypes';

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const labelOf = (d: string) => { const t = new Date(d + 'T00:00:00'); return `${t.getMonth() + 1}월 ${t.getDate()}일 ${WD[t.getDay()]}요일`; };
const dayLabelShort = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일`;
const shiftMonth = (ym: string, n: number) => { const t = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; };
const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const STICKER = (pack: string, list: { word: string; image: string }[]): DiaryAssetVM[] =>
  list.map((s, i) => ({ id: `${pack}-${i}`, kind: 'sticker', src: s.image, label: s.word }));
const ASSETS: Record<string, DiaryAssetVM[]> = {
  kkom: STICKER('kkom', SAI_STICKERS),
  kkul: STICKER('kkul', KKUL_STICKERS),
  uri: STICKER('uri', URI_STICKERS),
  tape: DECOR_ASSETS.filter((d) => d.kind === 'tape').map((d) => ({ id: d.id, kind: 'tape', decorId: d.id, label: d.label })),
  stamp: DECOR_ASSETS.filter((d) => d.kind === 'stamp').map((d) => ({ id: d.id, kind: 'stamp', decorId: d.id, label: d.label })),
};
const ALL_ASSETS = Object.values(ASSETS).flat();
const TABS = [
  { id: 'recent', label: '최근' }, { id: 'favorite', label: '즐겨찾기' }, { id: 'kkom', label: '꼼이' },
  { id: 'kkul', label: '꿀됑' }, { id: 'uri', label: '우리' }, { id: 'tape', label: '테이프' }, { id: 'stamp', label: '도장' },
];
const SPECIAL_STICKERS = [...ASSETS.uri.slice(0, 6), ...ASSETS.kkul.slice(0, 4), ...ASSETS.kkom.slice(0, 2)];
const ratioOfDecor = (id?: string) => DECOR_ASSETS.find((d) => d.id === id)?.ratio ?? 1;
/** 사진 여러 장을 넣을 때 놓는 자리(가운데·기울기) — 글 칸 위쪽은 비워 두고 종이 아래쪽 반에 흩어 놓는다. */
const PHOTO_SLOTS = [
  { x: 0.34, y: 0.5, rotation: -4 }, { x: 0.67, y: 0.58, rotation: 3 },
  { x: 0.36, y: 0.78, rotation: 2 }, { x: 0.66, y: 0.84, rotation: -3 },
];
// 최근·즐겨찾기 스티커는 이 폰에만 둔다.
const LS_RECENT = 'kk-diary-recent', LS_FAV = 'kk-diary-fav';
const readIds = (k: string): string[] => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; } };
const writeIds = (k: string, ids: string[]) => { try { localStorage.setItem(k, JSON.stringify(ids)); } catch { /* */ } };

export function DiaryApp({ me, initialDate, initialOwner, initialView, openAgenda, initialEventId, onExit }: {
  me: Person; initialDate?: string; initialView?: 'day' | 'month';
  initialOwner?: Person;       // 누구 장부터 열지(다이어리 ♥·한마디 알림에서 올 때)
  openAgenda?: boolean;        // 월간으로 들어오면서 그날 시트까지 연다(알림·꼼톡 일정 카드에서 올 때)
  initialEventId?: string;     // 보러 온 일정 — 날짜가 안 왔으면 이 일정의 시작 날로 찾아간다
  onExit: () => void;
}) {
  const TODAY = useMemo(() => todayYmd(), []);
  const partner: Person = me === '우댕' ? '꼼이' : '우댕';
  const practice = useMemo(() => isPractice(), []);

  const [date, setDate] = useState(initialDate && /^\d{4}-\d\d-\d\d$/.test(initialDate) ? initialDate : TODAY);
  const [owner, setOwner] = useState<Person>(initialOwner ?? me);
  const [view, setView] = useState<'day' | 'month'>(initialView ?? 'day');
  const [mYm, setMYm] = useState(date.slice(0, 7));
  const [sel, setSel] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState('kkul');
  const [special, setSpecial] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const say = useCallback((t: string) => { setNote(t); window.setTimeout(() => setNote((n) => (n === t ? null : n)), 3200); }, []);

  // ── 같이 읽는 것: 한 달 표지(점), 기념일, 일정(읽기 전용 칩) ──
  const metaYm = view === 'month' ? mYm : date.slice(0, 7);
  const [metas, setMetas] = useState<Record<string, DiaryMeta>>({});
  useEffect(() => subscribeDiaryMonthMeta(metaYm, setMetas), [metaYm]);
  const [serverSpecials, setServerSpecials] = useState<SpecialDateVM[]>([]);
  useEffect(() => { void seedSpecialDates().catch(() => {}); return subscribeSpecialDates(setServerSpecials); }, []);
  const specials = practice && serverSpecials.length === 0 ? BUILTIN_SPECIALS : serverSpecials;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  useEffect(() => subscribeCalendar(setEvents), []);

  // ── 내 장 ──
  const [mine, setMine] = useState<DiaryPageVM>(() => blankDiaryPage(date, me));
  const [ready, setReady] = useState(false);            // 내 장을 서버에서 읽어 왔나(못 읽었으면 고치기 막음)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'offline'>('saved');
  const mineRef = useRef(mine);
  const readyRef = useRef(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  // 저장은 한 줄로 세운다(chain) — 저장 도중에 또 고치거나 날짜를 넘겨도 순서와 revision 이 안 꼬이게. 아래 셋은 날짜별.
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const revsRef = useRef<Record<string, number>>({});              // 서버에 저장된 revision
  const pathsRef = useRef<Record<string, Set<string>>>({});        // 마지막으로 저장된 장에 있던 사진 파일
  const lastRef = useRef<Record<string, DiaryPageVM>>({});         // 그 날짜의 가장 새 편집본(저장 대기 포함)
  const pathsOf = (p: DiaryPageVM) => new Set(p.items.map((i) => i.path).filter((x): x is string => !!x));

  const flush = useCallback((): Promise<void> => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    if (!dirtyRef.current || !readyRef.current) return chainRef.current;
    const page = mineRef.current, d = page.date;
    dirtyRef.current = false; setSaveState('saving');
    chainRef.current = chainRef.current.then(async () => {
      try {
        const rev = await saveDiaryPage(page, revsRef.current[d] ?? 0);
        revsRef.current[d] = rev;
        // 장에서 빠진 사진 파일 정리(같은 사진을 복제해 둔 게 남아 있으면 안 지운다)
        const now = pathsOf(page);
        const gone = [...(pathsRef.current[d] ?? [])].filter((x) => !now.has(x));
        if (gone.length) void deleteDiaryPhotos(gone);
        pathsRef.current[d] = now;
        // 이보다 새 편집이 남아 있으면 그 임시 보관의 기준 revision 을 올려 두고(되살릴 때 서버보다 낡았다고 버리지 않게), 없으면 지운다.
        const latest = lastRef.current[d];
        if (latest && latest !== page) saveDiaryDraft(latest, rev);
        else { clearDiaryDraft(d, me); if (mineRef.current.date === d && !dirtyRef.current) setSaveState('saved'); }
      } catch (e) {
        if (e instanceof PracticeBlocked) { if (mineRef.current.date === d) setSaveState('saved'); return; }
        if (mineRef.current.date === d) {
          dirtyRef.current = true; setSaveState('offline');
          if (!timerRef.current) timerRef.current = window.setTimeout(() => void flush(), 5000);
        }
        // 다른 날로 넘어간 뒤 실패한 저장은 폰에 적어 둔 것이 남아 있어, 그 날짜를 다시 열 때 되살아난다.
      }
    });
    return chainRef.current;
  }, [me]);
  const schedule = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setSaveState((s) => (s === 'offline' ? s : 'saving'));
    timerRef.current = window.setTimeout(() => void flush(), 1500);
  }, [flush]);

  // 날짜가 바뀌면 내 장을 읽는다(밀린 저장이 끝난 뒤에). 폰에 남은 편집이 서버보다 새것이면 되살려서 다시 저장.
  useEffect(() => {
    let alive = true, retry: number | null = null;
    readyRef.current = false; setReady(false);
    const fresh = blankDiaryPage(date, me);
    mineRef.current = fresh; setMine(fresh); dirtyRef.current = false;
    const load = async () => {
      await chainRef.current.catch(() => {});
      let got: Awaited<ReturnType<typeof loadDiaryPage>>;
      try { got = await loadDiaryPage(date, me); }
      catch { if (alive) { setSaveState('offline'); retry = window.setTimeout(() => void load(), 4000); } return; }
      if (!alive) return;
      const serverRev = got?.revision ?? 0;
      const draft = readDiaryDraft(date, me);
      const useDraft = !!draft && draft.baseRevision >= serverRev;
      if (draft && !useDraft) clearDiaryDraft(date, me);
      const page = useDraft ? draft!.page : got?.page ?? fresh;
      mineRef.current = page; setMine(page);
      revsRef.current[date] = serverRev;
      pathsRef.current[date] = got ? pathsOf(got.page) : new Set();
      lastRef.current[date] = page;
      readyRef.current = true; setReady(true); setSaveState('saved');
      if (useDraft) { dirtyRef.current = true; schedule(); }
    };
    void load();
    return () => { alive = false; if (retry) window.clearTimeout(retry); };
  }, [date, me, schedule]);

  // 화면을 내리거나 나갈 때 밀린 저장을 바로 보낸다.
  useEffect(() => {
    const now = () => { void flush(); };
    const onVis = () => { if (document.visibilityState === 'hidden') now(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', now);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', now); now(); };
  }, [flush]);

  const put = useCallback((fn: (p: DiaryPageVM) => DiaryPageVM) => {
    if (!readyRef.current) return;
    const next = fn(mineRef.current);
    if (next === mineRef.current) return;
    mineRef.current = next; setMine(next); lastRef.current[next.date] = next;
    dirtyRef.current = true; saveDiaryDraft(next, revsRef.current[next.date] ?? 0); schedule();
  }, [schedule]);
  const goDate = useCallback((d: string) => { void flush(); setSel(null); setDate(d); }, [flush]);

  // ── 상대 장(보기만) ──
  const [theirs, setTheirs] = useState<DiaryPageVM | null>(null);
  useEffect(() => { setTheirs(null); return subscribeDiaryPage(date, partner, setTheirs); }, [date, partner]);

  const isMine = owner === me;
  const page = isMine ? mine : theirs ?? blankDiaryPage(date, partner);

  // ── ♥·한마디(보고 있는 장 아래) ──
  const [notes, setNotes] = useState<DiaryNoteVM[]>([]);
  useEffect(() => { setNotes([]); return subscribeDiaryNotes(date, owner, setNotes); }, [date, owner]);
  const noteFail = (e: unknown, what: string) => { if (!(e instanceof PracticeBlocked)) say(`${what} 못했어요. 잠시 뒤 다시 해 주세요`); };
  const toggleHeart = () => {
    if (isMine) return;
    const on = !notes.some((n) => n.kind === 'heart' && n.by === me);
    setDiaryHeart(date, owner, me, on).catch((e) => noteFail(e, '마음을 남기지'));
  };
  const sendNote = async (text: string): Promise<boolean> => {
    try { await addDiaryNote(date, owner, me, text); return true; } catch (e) { noteFail(e, '한마디를 남기지'); return false; }
  };
  const removeNote = (id: string) => { deleteDiaryNote(date, owner, id).catch((e) => noteFail(e, '지우지')); };
  const topZ = Math.max(0, ...mine.items.map((i) => i.z));

  const addItem = (it: Omit<DiaryItemVM, 'id' | 'z' | 'x' | 'y' | 'rotation'>, id = newId('i'), at?: { x: number; y: number; rotation: number }) => {
    if (!isMine || !readyRef.current) return null;
    if (mineRef.current.items.length >= DIARY_LIMITS.items) { say(`한 장에 ${DIARY_LIMITS.items}개까지 붙일 수 있어요`); return null; }
    const pos = at ?? { x: 0.5, y: 0.5, rotation: 0 };
    put((p) => ({ ...p, items: [...p.items, { ...it, id, ...pos, z: Math.max(0, ...p.items.map((i) => i.z)) + 1 }] }));
    setSel(id);
    return id;
  };
  const act = (a: DiaryItemAction) => {
    if (!sel || !isMine) return;
    put((p) => {
      const cur = p.items.find((i) => i.id === sel);
      if (!cur) return p;
      const top = Math.max(0, ...p.items.map((i) => i.z));
      if (a === 'delete') return { ...p, items: p.items.filter((i) => i.id !== sel) };
      if (a === 'duplicate') {
        if (p.items.length >= DIARY_LIMITS.items) return p;
        if (cur.type === 'photo' && p.items.filter((i) => i.type === 'photo').length >= DIARY_LIMITS.photos) return p;
        return { ...p, items: [...p.items, { ...cur, id: newId('i'), x: Math.min(0.95, cur.x + 0.06), y: Math.min(0.95, cur.y + 0.05), z: top + 1 }] };
      }
      const next = { ...cur };
      if (a === 'smaller') next.w = Math.max(0.1, cur.w * 0.87);
      if (a === 'larger') next.w = Math.min(0.95, cur.w * 1.15);
      if (a === 'rotateLeft') next.rotation = cur.rotation - 15;
      if (a === 'rotateRight') next.rotation = cur.rotation + 15;
      if (a === 'front') next.z = top + 1;
      return { ...p, items: p.items.map((i) => (i.id === sel ? next : i)) };
    });
    if (a === 'delete') setSel(null);
  };

  // 사진: 줄인 그림을 먼저 종이에 올리고(blob), 다 올라가면 진짜 주소로 바꾼다.
  //   꼼톡·추억에서 고른 사진도 같은 길 — 받아서 파일로 만든 뒤 다이어리 자리에 복사본을 올린다(원본이 지워져도 안 깨지게).
  const placePhotos = async (picks: { file: File; source: DiaryPhotoSource }[]) => {
    if (!isMine || !readyRef.current) return;
    const room = DIARY_LIMITS.photos - mineRef.current.items.filter((i) => i.type === 'photo').length;
    if (room <= 0) { say(`사진은 한 장에 ${DIARY_LIMITS.photos}장까지예요`); return; }
    if (picks.length > room) say(`사진은 한 장에 ${DIARY_LIMITS.photos}장까지라 ${room}장만 넣어요`);
    const startDate = date;
    // 여러 장이면 한가운데 겹쳐 쌓지 않고 스크랩처럼 살짝 기울여 흩어 놓는다(사진 칸 번호 = 이미 있는 사진 수).
    const lone = picks.length === 1 && room === DIARY_LIMITS.photos;
    for (const { file: f, source } of picks.slice(0, room)) {
      let prep: Awaited<ReturnType<typeof prepareDiaryPhoto>>;
      try { prep = await prepareDiaryPhoto(f); } catch { say('사진을 읽지 못했어요'); continue; }
      if (mineRef.current.date !== startDate) return;
      const local = URL.createObjectURL(prep.blob);
      const slot = mineRef.current.items.filter((i) => i.type === 'photo').length;
      const id = addItem({ type: 'photo', src: local, w: 0.42, ratio: prep.ratio, source }, newId('i'), lone ? undefined : PHOTO_SLOTS[slot % PHOTO_SLOTS.length]);
      if (!id) { URL.revokeObjectURL(local); return; }
      uploadDiaryPhoto(startDate, me, prep.blob).then(({ src, path }) => {
        const here = mineRef.current.date === startDate && mineRef.current.items.some((i) => i.id === id);
        if (!here) { void deleteDiaryPhotos([path]); return; }       // 그새 지웠거나 다른 날로 갔다 — 올라간 파일만 치운다
        put((p) => ({ ...p, items: p.items.map((i) => (i.id === id || i.src === local ? { ...i, src, path } : i)) }));
        window.setTimeout(() => URL.revokeObjectURL(local), 4000);
      }).catch((e) => {
        if (e instanceof PracticeBlocked) return;                    // 연습 모드 — 화면에만 둔다
        if (mineRef.current.date === startDate) put((p) => ({ ...p, items: p.items.filter((i) => i.src !== local) }));
        say('사진을 올리지 못했어요. 잠시 뒤에 다시 해 주세요');
      });
    }
  };
  const pickPhotos = (files: File[]) => placePhotos(files.map((file) => ({ file, source: 'library' as const })));
  const pickAppPhotos = async (list: AppPhotoVM[]) => {
    if (!isMine || !readyRef.current || list.length === 0) return;
    say(list.length > 1 ? `사진 ${list.length}장을 가져오는 중이에요` : '사진을 가져오는 중이에요');
    const got = await Promise.all(list.map((p) => appPhotoFile(p).then((file) => ({ file, source: p.source })).catch(() => null)));
    const ok = got.filter((x): x is { file: File; source: 'chat' | 'memories' } => !!x);
    if (ok.length < list.length) say(ok.length ? `${list.length - ok.length}장은 가져오지 못했어요` : '사진을 가져오지 못했어요. 잠시 뒤에 다시 해 주세요');
    if (ok.length) await placePhotos(ok);
  };
  // 고른 사진의 모양·글귀. 없음·동그라미에 글귀를 넣으면 보이게 폴라로이드로 바꾼다.
  const setPhotoFrame = (frame: DiaryPhotoFrame) => {
    if (!sel || !isMine) return;
    put((p) => ({ ...p, items: p.items.map((i) => (i.id === sel && i.type === 'photo' ? { ...i, frame } : i)) }));
  };
  const setPhotoCaption = (text: string) => {
    if (!sel || !isMine) return;
    const t = text.trim().slice(0, DIARY_LIMITS.caption);
    put((p) => ({
      ...p,
      items: p.items.map((i) => {
        if (i.id !== sel || i.type !== 'photo') return i;
        if (!t) { const { caption: _c, ...rest } = i; return rest; }
        const f = i.frame ?? 'white';
        return { ...i, caption: t, frame: f === 'none' || f === 'circle' ? 'polaroid' : f };
      }),
    }));
  };

  // ── 스티커 서랍(최근·즐겨찾기는 이 폰에) ──
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  useEffect(() => { setRecentIds(readIds(LS_RECENT)); setFavIds(readIds(LS_FAV)); }, []);
  const remember = (a: DiaryAssetVM) => setRecentIds((r) => { const n = [a.id, ...r.filter((x) => x !== a.id)].slice(0, 12); writeIds(LS_RECENT, n); return n; });
  const toggleFav = (a: DiaryAssetVM) => setFavIds((f) => { const n = f.includes(a.id) ? f.filter((x) => x !== a.id) : [...f, a.id]; writeIds(LS_FAV, n); return n; });
  const assets = useMemo(() => {
    const byId = (ids: string[]) => ids.map((id) => ALL_ASSETS.find((x) => x.id === id)).filter((x): x is DiaryAssetVM => !!x);
    const base = tab === 'recent' ? byId(recentIds) : tab === 'favorite' ? byId(favIds) : ASSETS[tab] ?? [];
    return base.map((x) => ({ ...x, favorite: favIds.includes(x.id) }));
  }, [tab, recentIds, favIds]);

  // ── 월간 꾸미기 ──
  const [mOwner, setMOwner] = useState<MonthOwner>('together');
  const [mMode, setMMode] = useState<'view' | 'decorate'>('view');
  const [tool, setTool] = useState<MonthTool | null>(null);
  const [picked, setPicked] = useState<DiaryAssetVM | null>(null);
  const [spanStart, setSpanStart] = useState<string | null>(null);
  const [spanEdit, setSpanEdit] = useState<{ id?: string; start: string; end: string; label: string; decorId: string } | null>(null);
  const [memoDate, setMemoDate] = useState<string | null>(null);
  const [memoBack, setMemoBack] = useState<string | null>(null);   // 날짜 시트에서 「고치기」로 왔으면 닫을 때 그 시트로 돌아간다
  const closeMemo = () => { const back = memoBack; setMemoDate(null); setMemoBack(null); if (back) setAgendaDate(back); };
  const [deco, setDeco] = useState<MonthDeco>(emptyMonthDeco);
  const decoRef = useRef(deco);
  decoRef.current = deco;
  const [undo, setUndo] = useState<{ text: string; patch: MonthPatch } | null>(null);
  const [mPending, setMPending] = useState(0);
  const [mOffline, setMOffline] = useState(false);
  const monthOpen = view === 'month';
  useEffect(() => {
    if (!monthOpen) return;
    setDeco(emptyMonthDeco()); setUndo(null); setSpanStart(null);
    return subscribeDiaryMonth(mYm, mOwner, setDeco);
  }, [monthOpen, mYm, mOwner]);
  const canEditMonth = mOwner === 'together' || mOwner === me;
  const pickedNow = picked ?? ALL_ASSETS.find((x) => x.id === recentIds[0]) ?? ASSETS.kkul[1] ?? null;
  const stickerOf = (a: DiaryAssetVM): MonthStickerVM => ({ id: newId('ms'), src: a.src, decorId: a.decorId, by: me });

  // ── 일정(달력 합치기) — 원본은 calendarEvents. 「같이」 = 전부, 각자 달력 = 자기 것 + 함께 ──
  const monthEvents = useMemo(() => eventsForOwner(events, mOwner), [events, mOwner]);
  const { bands, cellEvents } = useMemo(() => buildMonthBands(mYm, monthEvents, deco.spans), [mYm, monthEvents, deco.spans]);
  const upcomingList = useMemo(() => buildUpcoming(TODAY, monthEvents, specials), [TODAY, monthEvents, specials]);
  const [agendaDate, setAgendaDate] = useState<string | null>(openAgenda && initialView === 'month' ? date : null);      // 날짜를 눌러 연 그날 시트
  // 일정 id 만 달고 온 경우(날짜 없음) — 일정이 내려오면 그 달·그날로 한 번만 찾아간다
  const soughtRef = useRef(!initialEventId || !!openAgenda);
  useEffect(() => {
    if (soughtRef.current) return;
    const e = events.find((k) => k.id === initialEventId);
    if (!e) return;
    soughtRef.current = true;
    setView('month'); setMYm(e.startDate.slice(0, 7)); setAgendaDate(e.startDate);
  }, [events, initialEventId]);
  const [upOpen, setUpOpen] = useState(false);
  // fromSpanId — 장식 띠를 일정으로 바꾸는 중(일정이 저장되면 그 장식 띠를 뗀다. 취소하면 띠는 그대로)
  const [evEdit, setEvEdit] = useState<{ id?: string; draft: DiaryEventDraft; backTo: string | null; fromSpanId?: string } | null>(null);
  const [evSaving, setEvSaving] = useState(false);
  const openNewEvent = (d: string, backTo: string | null) => { setAgendaDate(null); setEvEdit({ draft: blankEventDraft(d, mOwner), backTo }); };
  const openEvent = (id: string, backTo: string | null) => {
    const e = events.find((k) => k.id === id); if (!e) return;
    setAgendaDate(null); setUpOpen(false); setEvEdit({ id, draft: draftOfEvent(e), backTo });
  };
  const closeEvent = (text?: string) => { const back = evEdit?.backTo ?? null; setEvEdit(null); setEvSaving(false); if (back) setAgendaDate(back); if (text) say(text); };
  const saveEvent = () => {
    if (!evEdit || evSaving) return;
    const norm = normalizeEventDraft(evEdit.draft);
    if (!norm) { say('제목을 적어 주세요'); return; }
    setEvSaving(true);
    const fromSpan = evEdit.fromSpanId;
    saveDiaryEvent(norm, me, evEdit.id)
      .then(() => {
        if (fromSpan && deco.spans.some((k) => k.id === fromSpan)) patchMonth({ kind: 'span', id: fromSpan, span: null });
        closeEvent(evEdit.id ? '일정을 고쳤어요' : fromSpan ? '장식 띠를 일정으로 바꿨어요' : '일정을 넣었어요');
      })
      .catch((e) => { if (e instanceof PracticeBlocked) closeEvent('연습 모드라 저장하지 않았어요'); else { setEvSaving(false); say('저장하지 못했어요. 잠시 뒤에 다시 해 주세요'); } });
  };
  const deleteEvent = () => {
    if (!evEdit?.id || evSaving) return;
    setEvSaving(true);
    removeDiaryEvent(evEdit.id)
      .then(() => closeEvent('일정을 지웠어요'))
      .catch((e) => { if (e instanceof PracticeBlocked) closeEvent('연습 모드라 지우지 않았어요'); else { setEvSaving(false); say('지우지 못했어요. 잠시 뒤에 다시 해 주세요'); } });
  };

  const patchMonth = (p: MonthPatch, undoText?: string) => {
    if (!canEditMonth) return;
    const inverse = invertMonthPatch(decoRef.current, p);
    const next = applyMonthPatch(decoRef.current, p);
    decoRef.current = next; setDeco(next);
    setUndo(undoText ? { text: undoText, patch: inverse } : null);
    setMPending((n) => n + 1);
    writeDiaryMonthPatch(mYm, mOwner, p)
      .then(() => setMOffline(false))
      .catch((e) => { if (!(e instanceof PracticeBlocked)) setMOffline(true); })
      .finally(() => setMPending((n) => Math.max(0, n - 1)));
  };

  const cells = useMemo<DiaryMonthCellVM[]>(() => {
    const first = `${mYm}-01`;
    const start = addDaysYmd(first, -new Date(first + 'T00:00:00').getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDaysYmd(start, i);
      return {
        date: d, day: Number(d.slice(8)), inMonth: d.slice(0, 7) === mYm, isToday: d === TODAY, holiday: !!holidayName(d),
        stickers: deco.stickers[d] ?? [], memo: deco.memos[d], specials: specialsOn(d, specials), events: cellEvents[d],
        mine: d === mine.date ? diaryPageHasContent(mine) : !!metas[diaryPageId(d, me)],
        partner: !!metas[diaryPageId(d, partner)],
      };
    });
  }, [mYm, TODAY, deco, specials, metas, mine, me, partner, cellEvents]);
  const upcoming = mYm === TODAY.slice(0, 7) ? upcomingList[0] ?? null : null;

  const chips = useMemo<DiaryChipVM[]>(() => {
    const hol = holidayName(date);
    return [
      ...(hol ? [{ id: 'hol', kind: 'special' as const, label: hol }] : []),
      ...specialsOn(date, specials).map((s) => ({ id: `s-${s.id}`, kind: 'special' as const, label: s.years ? `${s.label} ${s.years}주년` : s.label, iconSrc: s.sticker?.src })),
      ...eventsOnDate(date, events).slice(0, 3).map((e) => ({ id: `e-${e.id}`, kind: 'event' as const, label: e.title })),
    ];
  }, [date, specials, events]);
  const pageInfo = (d: string | null, who: Person) => { const m = d ? metas[diaryPageId(d, who)] : undefined; return { has: !!m, excerpt: m?.excerpt || undefined, thumbSrc: m?.thumb }; };
  const promptOfDay = DIARY_PROMPTS[Math.abs(Math.floor(new Date(date + 'T00:00:00').getTime() / 86400000)) % DIARY_PROMPTS.length];

  const specialSheet = (
    <DiarySpecialDatesSheet
      open={special} items={specials} stickerAssets={SPECIAL_STICKERS}
      onAdd={(v) => { addSpecialDate(v).catch((e) => { if (!(e instanceof PracticeBlocked)) say('저장하지 못했어요. 잠시 뒤에 다시 해 주세요'); }); }}
      onDelete={(id) => { deleteSpecialDate(id).catch((e) => { if (!(e instanceof PracticeBlocked)) say('지우지 못했어요. 잠시 뒤에 다시 해 주세요'); }); }}
      onClose={() => setSpecial(false)}
    />
  );
  const toast = (note || practice) && (
    <div className="fixed left-1/2 -translate-x-1/2 z-[80] pointer-events-none flex flex-col items-center gap-1" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
      {practice && <div className="px-3 py-1 rounded-full text-[11px] bg-[var(--sd-surface-2)] text-[var(--sd-muted)] border border-[var(--sd-line)]">연습 모드 · 저장 안 함</div>}
      {note && <div className="px-4 py-2 rounded-full text-[13px] bg-[var(--sd-ink)] text-[var(--sd-bg)] shadow-lg">{note}</div>}
    </div>
  );

  if (view === 'month') {
    const ordered = (a: string, b: string) => (a <= b ? [a, b] : [b, a]);
    return (
      <>
        <DiaryMonthScreen
          me={me} owner={mOwner} canEdit={canEditMonth}
          monthLabel={`${mYm.slice(0, 4)}년 ${Number(mYm.slice(5, 7))}월`} monthNumber={Number(mYm.slice(5, 7))}
          titleStyle={deco.title} hero={deco.hero} cells={cells} bands={bands} margin={deco.margin}
          upcoming={upcoming} onOpenUpcoming={() => setUpOpen(true)}
          onAddEvent={() => openNewEvent(mYm === TODAY.slice(0, 7) ? TODAY : `${mYm}-01`, null)}
          mode={canEditMonth ? mMode : 'view'} tool={tool} selectedAsset={pickedNow} spanStart={spanStart}
          undoText={undo?.text ?? null} saveState={mOffline ? 'offline' : mPending > 0 ? 'saving' : 'saved'}
          onBack={() => setView('day')}
          onPrevMonth={() => setMYm((m) => shiftMonth(m, -1))}
          onNextMonth={() => setMYm((m) => shiftMonth(m, 1))}
          onGoThisMonth={() => setMYm(TODAY.slice(0, 7))}
          isCurrentMonth={mYm === TODAY.slice(0, 7)}
          onChangeOwner={(o) => { setMOwner(o); setSpanStart(null); setUndo(null); }}
          onToggleMode={() => { setMMode((m) => (m === 'view' ? 'decorate' : 'view')); setTool((t) => t ?? 'sticker'); setSpanStart(null); }}
          onPickTool={(t) => { setTool(t); setSpanStart(null); }}
          onOpenAssets={() => setDrawer(true)}
          onTapDay={(d) => {
            if (mMode === 'view' || !canEditMonth) { setAgendaDate(d); return; }
            if (tool === 'sticker' && pickedNow) {
              const cur = deco.stickers[d] ?? [];
              if (cur.length >= MONTH_LIMITS.cellStickers) { say(`한 칸에 ${MONTH_LIMITS.cellStickers}개까지 붙일 수 있어요`); return; }
              patchMonth({ kind: 'stickers', date: d, list: [...cur, stickerOf(pickedNow)] });
            } else if (tool === 'span') {
              if (!spanStart) setSpanStart(d);
              else { const [a, b] = ordered(spanStart, d); setSpanEdit({ start: a, end: b, label: '', decorId: 'tape-honey' }); setSpanStart(null); }
            } else if (tool === 'memo') setMemoDate(d);
          }}
          onRemoveSticker={(d, id) => patchMonth({ kind: 'stickers', date: d, list: (deco.stickers[d] ?? []).filter((k) => k.id !== id) }, '스티커를 지웠어요')}
          onRemoveMemo={(d) => patchMonth({ kind: 'memo', date: d, text: null }, '메모를 지웠어요')}
          onTapBand={(id, kind) => {
            if (kind === 'event') { openEvent(id, null); return; }          // 일정 띠 — 지우개로는 절대 안 지운다(알림까지 사라진다)
            const sp = deco.spans.find((k) => k.id === id); if (!sp || !canEditMonth) return;
            if (tool === 'erase') patchMonth({ kind: 'span', id, span: null }, '장식 띠를 뗐어요');
            else setSpanEdit({ id, start: sp.startDate, end: sp.endDate, label: sp.label, decorId: sp.decorId });
          }}
          onTapHero={() => {
            if (tool === 'erase') { if (deco.hero) patchMonth({ kind: 'hero', hero: null }, '머리 그림을 뺐어요'); }
            else if (pickedNow) patchMonth({ kind: 'hero', hero: stickerOf(pickedNow) });
          }}
          onTapMargin={(i) => {
            if (tool === 'erase') { if (i < deco.margin.length) patchMonth({ kind: 'margin', list: deco.margin.filter((_, k) => k !== i) }, '여백 스티커를 뗐어요'); }
            else if (pickedNow) {
              if (i < deco.margin.length) patchMonth({ kind: 'margin', list: deco.margin.map((k, n) => (n === i ? stickerOf(pickedNow) : k)) });
              else if (deco.margin.length < MONTH_LIMITS.margin) patchMonth({ kind: 'margin', list: [...deco.margin, stickerOf(pickedNow)] });
            }
          }}
          onCycleTitleStyle={() => patchMonth({ kind: 'title', title: deco.title === 'plain' ? 'brush' : deco.title === 'brush' ? 'round' : 'plain' })}
          onUndo={() => { if (undo) { const p = undo.patch; setUndo(null); patchMonth(p); } }}
          onOpenSpecialDates={() => setSpecial(true)}
        />
        <DiaryAssetDrawer
          open={drawer && canEditMonth} tabs={TABS} tab={tab} assets={assets}
          onTabChange={setTab}
          onPick={(a) => { setPicked(a); remember(a); setTool('sticker'); setDrawer(false); }}
          onToggleFavorite={toggleFav}
          onClose={() => setDrawer(false)}
        />
        <DiaryMonthMemoSheet
          open={!!memoDate} dateLabel={memoDate ? dayLabelShort(memoDate) : ''} value={memoDate ? deco.memos[memoDate] ?? '' : ''}
          onSave={(t) => { const d = memoDate!; const text = t.trim().slice(0, MONTH_LIMITS.memo); if (text !== (deco.memos[d] ?? '')) patchMonth({ kind: 'memo', date: d, text: text || null }); closeMemo(); }}
          onClose={closeMemo}
        />
        <DiaryMonthSpanSheet
          open={!!spanEdit} rangeLabel={spanEdit ? `${dayLabelShort(spanEdit.start)} ~ ${Number(spanEdit.end.slice(8))}일` : ''}
          value={{ label: spanEdit?.label ?? '', decorId: spanEdit?.decorId ?? 'tape-honey' }}
          tapeIds={DECOR_ASSETS.filter((k) => k.kind === 'tape').map((k) => k.id)} canDelete={!!spanEdit?.id}
          onSave={(val) => {
            const e = spanEdit!;
            if (!e.id && deco.spans.length >= MONTH_LIMITS.spans) say(`장식 띠는 한 달에 ${MONTH_LIMITS.spans}개까지예요`);
            else { const id = e.id ?? newId('sp'); patchMonth({ kind: 'span', id, span: { id, startDate: e.start, endDate: e.end, label: val.label, decorId: val.decorId } }); }
            setSpanEdit(null);
          }}
          onDelete={() => { const e = spanEdit!; if (e.id) patchMonth({ kind: 'span', id: e.id, span: null }, '장식 띠를 뗐어요'); setSpanEdit(null); }}
          onClose={() => setSpanEdit(null)}
          onMakeEvent={(val) => {
            const e = spanEdit!;
            setSpanEdit(null); setMMode('view'); setSpanStart(null);
            setEvEdit({ draft: { ...blankEventDraft(e.start, mOwner, e.end), title: val.label, decorId: val.decorId }, backTo: null, ...(e.id ? { fromSpanId: e.id } : {}) });
          }}
        />
        <DiaryDayAgendaSheet
          open={!!agendaDate} dateLabel={agendaDate ? labelOf(agendaDate) : ''} holiday={agendaDate ? holidayName(agendaDate) : null}
          specials={agendaDate ? specialsOn(agendaDate, specials) : []}
          events={agendaDate ? eventsOnDate(agendaDate, monthEvents).map(toEventVM) : []}
          me={me}
          pages={{
            [me]: agendaDate === mine.date ? { has: diaryPageHasContent(mine), excerpt: mine.text.split('\n').find((l) => l.trim())?.trim() } : pageInfo(agendaDate, me),
            [partner]: pageInfo(agendaDate, partner),
          } as Record<Person, { has: boolean; excerpt?: string; thumbSrc?: string }>}
          onAddEvent={() => { if (agendaDate) openNewEvent(agendaDate, agendaDate); }}
          onOpenEvent={(id) => openEvent(id, agendaDate)}
          onOpenPage={(o) => { const d = agendaDate; if (!d) return; setAgendaDate(null); setOwner(o); goDate(d); setView('day'); }}
          onClose={() => setAgendaDate(null)}
          decor={agendaDate ? { stickers: deco.stickers[agendaDate] ?? [], memo: deco.memos[agendaDate] } : undefined}
          onEditMemo={canEditMonth ? () => { const d = agendaDate; if (!d) return; setAgendaDate(null); setMemoBack(d); setMemoDate(d); } : undefined}
        />
        <DiaryUpcomingSheet
          open={upOpen} items={upcomingList}
          onOpenItem={(it) => { setUpOpen(false); setMYm(it.date.slice(0, 7)); setAgendaDate(it.date); }}
          onClose={() => setUpOpen(false)}
        />
        <DiaryEventSheet
          open={!!evEdit} mode={evEdit?.id ? 'edit' : 'create'} value={evEdit?.draft ?? blankEventDraft(TODAY, mOwner)} saving={evSaving}
          tapeIds={DECOR_ASSETS.filter((k) => k.kind === 'tape').map((k) => k.id)}
          onChange={(patch) => setEvEdit((cur) => (cur ? { ...cur, draft: { ...cur.draft, ...patch } } : cur))}
          onSave={saveEvent} onDelete={evEdit?.id ? deleteEvent : undefined}
          onClose={() => { if (!evSaving) closeEvent(); }}
        />
        {specialSheet}
        {toast}
      </>
    );
  }

  return (
    <>
      <DiaryDayScreen
        me={me} pageOwner={owner} page={page} dateLabel={labelOf(date)}
        chips={chips}
        materials={isMine && ready && date === TODAY && !mine.question ? [{ id: 'q', kind: 'prompt', label: promptOfDay }] : []}
        hasPage={{ [me]: diaryPageHasContent(mine), [partner]: !!theirs || !!metas[diaryPageId(date, partner)] } as Record<Person, boolean>}
        saveState={saveState} isToday={date === TODAY} selectedItemId={isMine ? sel : null}
        onBack={() => { void flush(); onExit(); }}
        onPrevDate={() => goDate(addDaysYmd(date, -1))} onNextDate={() => goDate(addDaysYmd(date, 1))}
        onGoToday={() => goDate(TODAY)} onOpenMonth={() => { setMYm(date.slice(0, 7)); setView('month'); }}
        onChangeOwner={(p) => { setSel(null); setOwner(p); }}
        onSelectItem={(id) => setSel(isMine ? id : null)}
        onMoveItem={(id, x, y) => { if (isMine) put((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, x, y } : i)) })); }}
        onItemAction={act}
        onTextChange={(text) => { if (isMine) put((p) => ({ ...p, text: text.slice(0, DIARY_LIMITS.text) })); }}
        onOpenAssets={() => setDrawer(true)}
        onPickPhotos={(files) => void pickPhotos(files)}
        onChangeTheme={(t: DiaryPaperTheme) => { if (isMine) put((p) => ({ ...p, theme: t })); }}
        onAddMaterial={(m) => { if (isMine && m.kind === 'prompt') put((p) => ({ ...p, question: m.label })); }}
        onClearQuestion={() => { if (isMine) put((p) => { const { question: _q, ...rest } = p; return rest; }); }}
        onOpenSpecialDates={() => setSpecial(true)}
        notes={notes}
        pageExists={isMine ? diaryPageHasContent(mine) : !!theirs}
        onToggleHeart={toggleHeart} onSendNote={sendNote} onDeleteNote={removeNote}
        photoCount={isMine ? mine.items.filter((i) => i.type === 'photo').length : 0}
        selectedItem={isMine && sel ? mine.items.find((i) => i.id === sel) ?? null : null}
        onPickAppPhotos={(list) => void pickAppPhotos(list)}
        onPhotoFull={() => say(`사진은 한 장에 ${DIARY_LIMITS.photos}장까지 넣을 수 있어요`)}
        onPhotoFrame={setPhotoFrame}
        onPhotoCaption={setPhotoCaption}
      />
      <DiaryAssetDrawer
        open={drawer && isMine} tabs={TABS} tab={tab} assets={assets} full={mine.items.length >= DIARY_LIMITS.items}
        onTabChange={setTab}
        onPick={(a) => {
          addItem(a.kind === 'sticker' ? { type: 'sticker', src: a.src, w: 0.3, ratio: 1 } : { type: a.kind, decorId: a.decorId, w: a.kind === 'tape' ? 0.42 : 0.3, ratio: ratioOfDecor(a.decorId) });
          remember(a);
        }}
        onToggleFavorite={toggleFav}
        onClose={() => setDrawer(false)}
      />
      {specialSheet}
      {toast}
    </>
  );
}
