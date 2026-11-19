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
import { DiaryAssetDrawer, type DiaryPackVM } from './DiaryAssetDrawer';
import { useDiaryAssetPrefs, visiblePacksOf } from '@/lib/diaryAssetPrefs';
import { DiaryMonthScreen } from './DiaryMonthScreen';
import { DiaryMonthMemoSheet } from './DiaryMonthMemoSheet';
import { DiaryMonthSpanSheet } from './DiaryMonthSpanSheet';
import { DiarySpecialDatesSheet } from './DiarySpecialDatesSheet';
import { DiaryDayAgendaSheet } from './DiaryDayAgendaSheet';
import { DiaryEventSheet } from './DiaryEventSheet';
import { DiaryUpcomingSheet } from './DiaryUpcomingSheet';
import { DiaryStashSheet } from './DiaryStashSheet';
import { ARCHIVE_STEP, DiaryArchiveScreen, type ArchiveWho } from './DiaryArchiveScreen';
import { DiaryTrashPage, type RestoreResult } from './DiaryTrash';
import { DECOR_ASSETS } from './DiaryDecor';
import { KKUL_STICKERS, SAI_STICKERS, URI_STICKERS, KKWAGI_STICKERS } from '@/lib/stickerPacks';
import { DAKU_PACKS, dakuSrc } from '@/lib/dakuStickers';
import { diaryInkAvailable, diaryInkCanReedit, editDiaryInk, PAPER_HEX, placeStrokes, type DiaryInkResult, type InkSidecar } from '@/lib/diaryInk';
import { subscribeCalendar, type CalendarEvent } from '@/lib/calendar';
import { addDaysYmd, eventsOnDate, todayYmd } from '@/lib/calendarLayout';
import { holidayName } from '@/lib/holidays';
import { blankEventDraft, buildMonthBands, buildUpcoming, draftOfEvent, eventsForOwner, normalizeEventDraft, toEventVM } from '@/lib/diaryCalendar';
import { isPractice } from '@/lib/practice';
import {
  cleanupDiaryConflictStashes, diaryConflictProtectedPaths, pruneDiaryConflictStashes, readDiaryConflictStashes, removeDiaryConflictStash, stashDiaryConflictPage,
  type DiaryConflictStash,
} from '@/lib/diaryConflictStash';
import {
  BUILTIN_SPECIALS, DiaryConflict, DiaryRestoreOccupied, PracticeBlocked, subscribeDiaryRevision, addSpecialDate, applyMonthPatch, blankDiaryPage, clearDiaryDraft, deleteDiaryPhotos, deleteSpecialDate,
  diaryPageHasContent, diaryPageId, emptyMonthDeco, invertMonthPatch, loadDiaryPage, prepareDiaryPhoto, readDiaryDraft, saveDiaryDraft, saveDiaryPage,
  removeDiaryEvent, saveDiaryEvent, uploadDiaryInk, seedSpecialDates, specialsOn, subscribeDiaryMonth, subscribeDiaryMonthMeta, subscribeDiaryPage, subscribeSpecialDates, uploadDiaryPhoto,
  writeDiaryMonthPatch, addDiaryNote, deleteDiaryNote, setDiaryHeart, subscribeDiaryNotes, appPhotoFile, restoreDiaryTrash, subscribeDiaryTrash, trashDiaryPage,
  type AppPhotoVM, type DiaryMeta, type DiaryNoteVM, type DiaryTrashVM, type MonthDeco, type MonthPatch,
} from '@/lib/diary';
import {
  DIARY_LIMITS, DIARY_PROMPTS, MONTH_LIMITS, sendItemToBack, type DiaryAssetVM, type DiaryChipVM, type DiaryEventDraft, type DiaryItemAction, type DiaryItemVM, type DiaryMonthCellVM, type DiaryPageVM,
  type DiaryPaperTheme, type DiaryPhotoFrame, type DiaryPhotoSource, type MonthOwner, type MonthStickerVM, type MonthTool, type Person, type SpecialDateVM,
} from '@/lib/diaryTypes';

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const labelOf = (d: string) => { const t = new Date(d + 'T00:00:00'); return `${t.getMonth() + 1}월 ${t.getDate()}일 ${WD[t.getDay()]}요일`; };
const dayLabelShort = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일`;
const shiftMonth = (ym: string, n: number) => { const t = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; };
const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const STICKER = (pack: string, list: { word: string; image: string }[]): DiaryAssetVM[] =>
  list.map((s, i) => ({ id: `${pack}-${i}`, packId: pack, kind: 'sticker', src: s.image, label: s.word }));
const ASSETS: Record<string, DiaryAssetVM[]> = {
  // 다꾸 전용 팩(lib/dakuStickers.ts) — 탭 맨 앞
  ...Object.fromEntries(DAKU_PACKS.map((p) => [p.id, p.items.map((s): DiaryAssetVM => ({ id: `${p.id}-${s.id}`, packId: p.id, kind: 'sticker', src: dakuSrc(p.id, s.id), label: s.label, ratio: s.ratio, w: s.w }))])),
  kkom: STICKER('kkom', SAI_STICKERS),
  kkul: STICKER('kkul', KKUL_STICKERS),
  uri: STICKER('uri', URI_STICKERS),
  kkwagi: STICKER('kkwagi', KKWAGI_STICKERS),
  tape: DECOR_ASSETS.filter((d) => d.kind === 'tape').map((d) => ({ id: d.id, packId: 'tape', kind: 'tape', decorId: d.id, label: d.label })),
  stamp: DECOR_ASSETS.filter((d) => d.kind === 'stamp').map((d) => ({ id: d.id, packId: 'stamp', kind: 'stamp', decorId: d.id, label: d.label })),
};
const ALL_ASSETS = Object.values(ASSETS).flat();
/** 서랍 탭 — 「최근·즐겨찾기」는 늘 맨 앞(고정), 팩은 사람마다 끄고 옮긴다(lib/diaryAssetPrefs.ts). 새 팩은 PACKS 에 더하면 저절로 보인다. */
const FIXED_TABS = [{ id: 'recent', label: '최근' }, { id: 'favorite', label: '즐겨찾기' }];
const PACKS: DiaryPackVM[] = [
  ...DAKU_PACKS.map((p) => ({ id: p.id, label: p.label, thumbSrc: dakuSrc(p.id, p.items.find((s) => s.id.startsWith('tape'))?.id ?? p.items[0].id) })),
  { id: 'kkom', label: '꼼이', thumbSrc: SAI_STICKERS[0]?.image },
  { id: 'kkul', label: '꿀됑', thumbSrc: KKUL_STICKERS[0]?.image },
  { id: 'uri', label: '우리', thumbSrc: URI_STICKERS[2]?.image },
  { id: 'kkwagi', label: '꽉이', thumbSrc: KKWAGI_STICKERS[1]?.image },
  { id: 'tape', label: '테이프', thumbDecorId: ASSETS.tape[0]?.decorId },
  { id: 'stamp', label: '도장', thumbDecorId: ASSETS.stamp[0]?.decorId },
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
  me: Person; initialDate?: string; initialView?: 'day' | 'month' | 'archive';
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
  const [view, setView] = useState<'day' | 'month' | 'archive'>(initialView ?? 'day');
  // 달력(날짜 시트)·지난 일기에서 하루 장으로 왔으면 ← 는 거기로(Aside 검수 11/18: 손이 가는 ← 가 홈으로 나가 위험 — 홈 단추는 연습 모드에서도 진짜로 간다)
  const [backTo, setBackTo] = useState<null | 'month' | 'archive'>(null);
  // ── 지난 일기(모아보기, 11/18 「1단계 진행」) — 상태는 여기 두어서 장을 보고 돌아오면 그 달·거르기·「더 보기」·스크롤 그대로 ──
  const [arcYm, setArcYm] = useState(TODAY.slice(0, 7));
  const [arcWho, setArcWho] = useState<ArchiveWho>('both');
  const [arcPhoto, setArcPhoto] = useState(false);
  const [arcQuery, setArcQuery] = useState('');
  const [arcShown, setArcShown] = useState(ARCHIVE_STEP);
  const [arcBack, setArcBack] = useState<'day' | 'month' | 'exit'>(initialView === 'archive' ? 'exit' : 'day');
  const arcScroll = useRef(0);
  const [mYm, setMYm] = useState(date.slice(0, 7));
  const [sel, setSel] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [tabPick, setTab] = useState<string | null>(null);   // 고른 탭 — 숨긴 팩이면 아래 tab 이 다른 탭으로 바꿔 보여 준다
  const [special, setSpecial] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null);
  const toastSeq = useRef(0);
  const say = useCallback((t: string, action?: { label: string; onClick: () => void }) => {
    const seq = ++toastSeq.current;
    setNote(t); setToastAction(action ?? null);
    window.setTimeout(() => { if (toastSeq.current === seq) { setNote(null); setToastAction(null); } }, 3200);
  }, []);
  const [stashOpen, setStashOpen] = useState(false);
  const [stashVersion, setStashVersion] = useState(0);
  const refreshStashes = useCallback(() => setStashVersion((v) => v + 1), []);
  useEffect(() => { cleanupDiaryConflictStashes(); refreshStashes(); }, [refreshStashes]);
  useEffect(() => setStashOpen(false), [date]);
  const stashes = useMemo(() => readDiaryConflictStashes(date, me), [date, me, stashVersion]);

  // ── 같이 읽는 것: 한 달 표지(점), 기념일, 일정(읽기 전용 칩) ──
  const metaYm = view === 'month' ? mYm : view === 'archive' ? arcYm : date.slice(0, 7);
  const [metas, setMetas] = useState<Record<string, DiaryMeta>>({});
  const [metasYm, setMetasYm] = useState<string | null>(null);   // 지금 metas 가 어느 달 것인지(지난 일기의 「불러오는 중」)
  useEffect(() => subscribeDiaryMonthMeta(metaYm, (m) => { setMetas(m); setMetasYm(metaYm); }), [metaYm]);
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
  const conflictSeqRef = useRef(0);                                // 저장 충돌 횟수 — 지우는 사이 새 판을 불러왔는지 본다
  const busyRef = useRef(0);                                       // 사진 준비·업로드, 앱 사진 받기, 필기 화면·업로드
  const track = <T,>(p: Promise<T>): Promise<T> => { busyRef.current++; return p.finally(() => { busyRef.current--; }); };
  const pathsOf = (p: DiaryPageVM) => new Set(p.items.flatMap((i) => [i.path, i.strokePath]).filter((x): x is string => !!x));

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
        const protectedPaths = diaryConflictProtectedPaths();
        const gone = [...(pathsRef.current[d] ?? [])].filter((x) => !now.has(x) && !protectedPaths.has(x));
        if (gone.length) void deleteDiaryPhotos(gone);
        pathsRef.current[d] = now;
        // 이보다 새 편집이 남아 있으면 그 임시 보관의 기준 revision 을 올려 두고(되살릴 때 서버보다 낡았다고 버리지 않게), 없으면 지운다.
        const latest = lastRef.current[d];
        if (latest && latest !== page) saveDiaryDraft(latest, rev);
        else { clearDiaryDraft(d, me); if (mineRef.current.date === d && !dirtyRef.current) setSaveState('saved'); }
      } catch (e) {
        if (e instanceof PracticeBlocked) { if (mineRef.current.date === d) setSaveState('saved'); return; }
        if (e instanceof DiaryConflict) {
          conflictSeqRef.current++;
          // 다른 기기(아이패드↔폰)가 먼저 고쳤다 — 서버 장을 다시 읽어 보이고, 이 기기에서 쓴 장은 따로 보관한 뒤 알린다(11/19).
          //   ⚠️ 이 기기 장을 그대로 다시 저장하면 다른 기기 글이 통째로 덮인다 — 그게 막으려던 일이다.
          //   보관본의 사진·필기 파일은 아래 파일 정리에서도 빼서, 이 장을 꺼낼 때까지 남긴다.
          const mineNow = mineRef.current.date === d ? mineRef.current : (lastRef.current[d] ?? page);
          const stored = stashDiaryConflictPage(mineNow);
          if (stored) refreshStashes();
          clearDiaryDraft(d, me);
          const got = await loadDiaryPage(d, me).catch(() => undefined);
          if (got === undefined) { revsRef.current[d] = e.serverRevision; return; }   // 못 읽었다 — 다음 저장도 다시 부딪혀 여기로 온다
          const fresh = got?.page ?? blankDiaryPage(d, me);
          revsRef.current[d] = got?.revision ?? 0;
          pathsRef.current[d] = got ? pathsOf(got.page) : new Set();
          lastRef.current[d] = fresh;
          if (mineRef.current.date === d) {
            if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
            mineRef.current = fresh; setMine(fresh); dirtyRef.current = false; setSaveState('saved');
            say(
              stored ? '다른 기기에서 고친 장을 불러왔어요. 여기서 쓴 건 따로 보관했어요' : '다른 기기에서 고친 장을 불러왔지만, 여기서 쓴 건 보관하지 못했어요',
              stored ? { label: '보기', onClick: () => setStashOpen(true) } : undefined,
            );
          }
          return;
        }
        if (mineRef.current.date === d) {
          dirtyRef.current = true; setSaveState('offline');
          if (!timerRef.current) timerRef.current = window.setTimeout(() => void flush(), 5000);
        }
        // 다른 날로 넘어간 뒤 실패한 저장은 폰에 적어 둔 것이 남아 있어, 그 날짜를 다시 열 때 되살아난다.
      }
    });
    return chainRef.current;
  }, [me, refreshStashes, say]);
  const schedule = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setSaveState((s) => (s === 'offline' ? s : 'saving'));
    timerRef.current = window.setTimeout(() => void flush(), 1500);
  }, [flush]);

  // 날짜가 바뀌면 내 장을 읽는다(밀린 저장이 끝난 뒤에). 폰에 남은 편집이 서버보다 새것이면 되살려서 다시 저장.
  // reloadKey — 휴지통에서 되살리거나 지우기 충돌이 나면 같은 날짜도 서버 판을 다시 읽는다.
  const [reloadKey, setReloadKey] = useState(0);
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
  }, [date, me, schedule, reloadKey]);

  // 열어 둔 내 장 — 다른 기기가 저장해서 서버 판이 올라가면, 이 기기에서 고치는 중이 아닐 때 새로 불러온다(11/19 저장 충돌 막기).
  //   그래야 아이패드에서 쓴 뒤 폰을 열어 둔 채 스티커를 붙여도 옛 장 위에 붙이지 않는다(붙이기 전에 이미 새 장이다).
  //   ⚠️ 고치는 중(dirty·저장 대기)이면 안 바꾼다 — 그때 부딪히면 저장 쪽(DiaryConflict)이 받는다.
  useEffect(() => {
    if (!ready || isPractice()) return;
    const d = date;
    let alive = true;
    const off = subscribeDiaryRevision(d, me, (rev) => {
      if (rev <= (revsRef.current[d] ?? 0)) return;
      if (dirtyRef.current || timerRef.current || mineRef.current.date !== d) return;
      void loadDiaryPage(d, me).then((got) => {
        if (!alive || !got || got.revision <= (revsRef.current[d] ?? 0)) return;
        if (dirtyRef.current || timerRef.current || mineRef.current.date !== d) return;
        revsRef.current[d] = got.revision;
        pathsRef.current[d] = pathsOf(got.page);
        lastRef.current[d] = got.page;
        mineRef.current = got.page; setMine(got.page);
      }).catch(() => { /* 못 읽으면 다음 판 알림 때 다시 */ });
    });
    return () => { alive = false; off(); };
  }, [date, me, ready]);

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
    if (mineRef.current.date > todayYmd()) return;   // 아직 오지 않은 날은 안 쓴다(화면도 막지만 한 번 더)
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

  const restoreStash = async (stash: DiaryConflictStash): Promise<void> => {
    if (practice) { say('연습 모드라 장을 바꾸지 않았어요'); return; }
    await flush();
    if (!readyRef.current || dirtyRef.current) { say('지금 장을 먼저 저장하지 못해 바꾸지 않았어요'); return; }
    const d = stash.page.date;
    if (mineRef.current.date !== d || stash.page.owner !== me) return;
    const before = mineRef.current;
    // 저장 결과가 나기 전에는 임시로 6개를 허용한다. 실패했는데 기존 보관본까지 밀려 사라지면 안 된다.
    const rollback = stashDiaryConflictPage(before, Date.now(), false);
    if (!rollback) { say('바꾸기 전 장을 보관하지 못해 장을 바꾸지 않았어요'); return; }
    refreshStashes();
    setSaveState('saving');
    try {
      const rev = await saveDiaryPage(stash.page, revsRef.current[d] ?? 0);
      const now = pathsOf(stash.page);
      const protectedPaths = diaryConflictProtectedPaths();
      const gone = [...(pathsRef.current[d] ?? [])].filter((path) => !now.has(path) && !protectedPaths.has(path));
      if (gone.length) void deleteDiaryPhotos(gone);
      removeDiaryConflictStash(stash.key);
      pruneDiaryConflictStashes(d, me);
      refreshStashes();
      revsRef.current[d] = rev; pathsRef.current[d] = now; lastRef.current[d] = stash.page;
      mineRef.current = stash.page; setMine(stash.page); dirtyRef.current = false; clearDiaryDraft(d, me);
      setSel(null); setSaveState('saved');
      say('보관한 장으로 바꿨어요. 바꾸기 전 장도 따로 보관했어요');
    } catch (e) {
      if (e instanceof DiaryConflict) {
        pruneDiaryConflictStashes(d, me, 5, [rollback.key, stash.key]);
        refreshStashes();
        clearDiaryDraft(d, me);
        const got = await loadDiaryPage(d, me).catch(() => undefined);
        if (got === undefined) { revsRef.current[d] = e.serverRevision; setSaveState('offline'); say('다른 기기에서 먼저 고쳤어요. 새 장을 불러오지 못했어요'); return; }
        const fresh = got?.page ?? blankDiaryPage(d, me);
        revsRef.current[d] = got?.revision ?? 0; pathsRef.current[d] = got ? pathsOf(got.page) : new Set(); lastRef.current[d] = fresh;
        mineRef.current = fresh; setMine(fresh); dirtyRef.current = false; setSel(null); setSaveState('saved');
        say('다른 기기에서 고친 장을 불러왔어요. 보관본은 그대로 두었어요', { label: '보기', onClick: () => setStashOpen(true) });
        return;
      }
      removeDiaryConflictStash(rollback.key); refreshStashes();
      setSaveState('saved');
      if (e instanceof PracticeBlocked) say('연습 모드라 장을 바꾸지 않았어요');
      else say('장으로 바꾸지 못했어요. 잠시 뒤 다시 해 주세요');
    }
  };

  const deleteStash = (stash: DiaryConflictStash) => {
    removeDiaryConflictStash(stash.key); refreshStashes(); say('보관본을 지웠어요');
  };

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
  const selItem = isMine && sel ? mine.items.find((i) => i.id === sel) ?? null : null;

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
    const dupId = newId('i');
    if (a === 'duplicate' && inkSideRef.current[sel]) inkSideRef.current[dupId] = inkSideRef.current[sel];
    put((p) => {
      const cur = p.items.find((i) => i.id === sel);
      if (!cur) return p;
      const top = Math.max(0, ...p.items.map((i) => i.z));
      if (a === 'delete') return { ...p, items: p.items.filter((i) => i.id !== sel) };
      if (a === 'back') return { ...p, items: sendItemToBack(p.items, sel) };
      if (a === 'duplicate') {
        if (p.items.length >= DIARY_LIMITS.items) return p;
        if (cur.type === 'photo' && p.items.filter((i) => i.type === 'photo').length >= DIARY_LIMITS.photos) return p;
        return { ...p, items: [...p.items, { ...cur, id: dupId, x: Math.min(0.95, cur.x + 0.06), y: Math.min(0.95, cur.y + 0.05), z: top + 1 }] };
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
      try { prep = await track(prepareDiaryPhoto(f)); } catch { say('사진을 읽지 못했어요'); continue; }
      if (mineRef.current.date !== startDate) return;
      const local = URL.createObjectURL(prep.blob);
      const slot = mineRef.current.items.filter((i) => i.type === 'photo').length;
      const id = addItem({ type: 'photo', src: local, w: 0.42, ratio: prep.ratio, source }, newId('i'), lone ? undefined : PHOTO_SLOTS[slot % PHOTO_SLOTS.length]);
      if (!id) { URL.revokeObjectURL(local); return; }
      track(uploadDiaryPhoto(startDate, me, prep.blob)).then(({ src, path }) => {
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

  // 필기(아이패드·아이폰 앱 — 우댕 11/18 「아이패드 필기 1단계 진행해」). 네이티브 화면에서 그린 부분만 투명 PNG 로 받아
  //   그린 자리 그대로 종이에 붙인다(필기 보드도 3:4). 올리는 동안은 받은 그림을 먼저 보이고, 다 올라가면 진짜 주소로(사진과 같은 길).
  const [inkOk, setInkOk] = useState(false);
  const [inkRedo, setInkRedo] = useState(false);
  useEffect(() => { void diaryInkAvailable().then(setInkOk); void diaryInkCanReedit().then(setInkRedo); }, []);
  // 다시 그리기(필기 2단계, 11/18): 그릴 때 받은 획을 PNG 옆 JSON 파일로 둔다. 올라가기 전·연습 모드엔 여기(물건 id → 획)에서 꺼낸다.
  const inkSideRef = useRef<Record<string, InkSidecar>>({});
  const sideOf = (r: DiaryInkResult): InkSidecar | null => (r.strokes?.length ? { v: 1, rect: { x: r.x, y: r.y, w: r.w, h: r.h }, strokes: r.strokes } : null);
  const inkGeom = (r: DiaryInkResult) => ({ w: r.w, ratio: (r.h * 4 / 3) / r.w, x: r.x + r.w / 2, y: r.y + r.h / 2 });
  const meInk = me === '우댕' ? 'udaeng' : 'kkomi';
  const drawInk = async () => {
    if (!isMine || !readyRef.current) return;
    if (mineRef.current.items.length >= DIARY_LIMITS.items) { say(`한 장에 ${DIARY_LIMITS.items}개까지 붙일 수 있어요`); return; }
    const startDate = date;
    let r: Awaited<ReturnType<typeof editDiaryInk>>;
    try { r = await track(editDiaryInk(meInk, PAPER_HEX[mineRef.current.theme] ?? '#FAF6EE')); }
    catch { say('필기 화면을 열지 못했어요'); return; }
    if (!r || r.w <= 0 || r.h <= 0 || mineRef.current.date !== startDate) return;
    const local = URL.createObjectURL(r.png);
    const g = inkGeom(r);
    const id = addItem({ type: 'ink', src: local, w: g.w, ratio: g.ratio }, newId('i'), { x: g.x, y: g.y, rotation: 0 });
    if (!id) { URL.revokeObjectURL(local); return; }
    const side = sideOf(r);
    if (side) inkSideRef.current[id] = side;
    track(uploadDiaryInk(startDate, me, r.png, side ? JSON.stringify(side) : undefined)).then(({ src, path, strokeSrc, strokePath }) => {
      const here = mineRef.current.date === startDate && mineRef.current.items.some((i) => i.id === id);
      if (!here) { void deleteDiaryPhotos([path, ...(strokePath ? [strokePath] : [])]); return; }
      put((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, src, path, ...(strokeSrc && strokePath ? { strokeSrc, strokePath } : {}) } : i)) }));
      window.setTimeout(() => URL.revokeObjectURL(local), 4000);
    }).catch((e) => {
      if (e instanceof PracticeBlocked) return;
      if (mineRef.current.date === startDate) put((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));
      say('필기를 올리지 못했어요. 잠시 뒤에 다시 해 주세요');
    });
  };
  // 고른 필기를 다시 그리기 — 저장된 획을 「지금 놓인 자리·크기」로 옮겨 필기 화면에 다시 열고, 다 그리면 그 물건의 그림·자리만 바꾼다.
  //   ⚠️ 새 그림이 다 올라갈 때까지 옛 그림을 그대로 둔다 — 올리는 중 앱이 닫혀도 옛 필기는 남게(임시 blob 물건은 저장에서 빠진다).
  //   돌린 각도·앞뒤 순서는 그대로 둔다(필기 화면에선 0°로 그린다).
  const loadSide = async (it: DiaryItemVM): Promise<InkSidecar | null> => {
    const c = inkSideRef.current[it.id];
    if (c) return c;
    if (!it.strokeSrc) return null;
    try {
      const res = await fetch(it.strokeSrc);
      if (!res.ok) return null;
      const j = (await res.json()) as InkSidecar;
      return j && j.rect && Array.isArray(j.strokes) ? j : null;
    } catch { return null; }
  };
  const reEditInk = async () => {
    const it = mineRef.current.items.find((i) => i.id === sel);
    if (!it || it.type !== 'ink' || !isMine || !readyRef.current) return;
    const startDate = date, id = it.id;
    const side = await loadSide(it);
    if (!side) { say('이 필기는 다시 그릴 수 없어요 — 예전 앱으로 그린 그림이에요'); return; }
    let r: Awaited<ReturnType<typeof editDiaryInk>>;
    try { r = await track(editDiaryInk(meInk, PAPER_HEX[mineRef.current.theme] ?? '#FAF6EE', placeStrokes(side, it))); }
    catch { say('필기 화면을 열지 못했어요'); return; }
    if (!r || r.w <= 0 || r.h <= 0 || mineRef.current.date !== startDate) return;
    if (!mineRef.current.items.some((i) => i.id === id)) return;
    const g = inkGeom(r);
    const next = sideOf(r);
    if (next) inkSideRef.current[id] = next;
    const swap = (patch: Partial<DiaryItemVM>) => put((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...g, ...patch } : i)) }));
    track(uploadDiaryInk(startDate, me, r.png, next ? JSON.stringify(next) : undefined)).then(({ src, path, strokeSrc, strokePath }) => {
      const here = mineRef.current.date === startDate && mineRef.current.items.some((i) => i.id === id);
      if (!here) { void deleteDiaryPhotos([path, ...(strokePath ? [strokePath] : [])]); return; }
      // 옛 PNG·획 파일은 장에서 빠지면 저장(flush) 때 정리된다 — 복제해 둔 같은 그림이 있으면 그건 남는다.
      swap({ src, path, strokeSrc, strokePath });
    }).catch((e) => {
      if (e instanceof PracticeBlocked) {                              // 연습 모드 — 화면에만 바꿔 둔다
        if (mineRef.current.date === startDate && r) swap({ src: URL.createObjectURL(r.png), path: undefined, strokeSrc: undefined, strokePath: undefined });
        return;
      }
      say('다시 그린 필기를 올리지 못했어요. 잠시 뒤에 다시 해 주세요');
    });
  };
  const pickAppPhotos = async (list: AppPhotoVM[]) => {
    if (!isMine || !readyRef.current || list.length === 0) return;
    say(list.length > 1 ? `사진 ${list.length}장을 가져오는 중이에요` : '사진을 가져오는 중이에요');
    const got = await track(Promise.all(list.map((p) => appPhotoFile(p).then((file) => ({ file, source: p.source })).catch(() => null))));
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
  // 탭 끄기·옮기기(우댕 2026-11-18). 숨긴 팩의 그림은 최근·즐겨찾기에서도 빠진다(기록은 그대로 — 다시 켜면 돌아온다).
  const { prefs: assetPrefs, setShown: setPackShown, setOrder: setPackOrder, resetOrder: resetPackOrder } = useDiaryAssetPrefs(me);
  const visiblePacks = useMemo(() => visiblePacksOf(PACKS, assetPrefs), [assetPrefs]);
  const packShown = useCallback((a: DiaryAssetVM) => !a.packId || !assetPrefs.hiddenPackIds.includes(a.packId), [assetPrefs]);
  // 처음엔 다꾸 전용 팩(종이·테이프), 그걸 껐으면 내 캐릭터 팩(우댕 꿀됑·꼼이 꼼이), 그것도 껐으면 보이는 첫 팩, 다 껐으면 최근.
  const tab = tabPick && (tabPick === 'recent' || tabPick === 'favorite' || visiblePacks.some((p) => p.id === tabPick))
    ? tabPick
    : visiblePacks.find((p) => p.id === DAKU_PACKS[0]?.id)?.id ?? visiblePacks.find((p) => p.id === (me === '우댕' ? 'kkul' : 'kkom'))?.id ?? visiblePacks[0]?.id ?? 'recent';
  const assets = useMemo(() => {
    const byId = (ids: string[]) => ids.map((id) => ALL_ASSETS.find((x) => x.id === id)).filter((x): x is DiaryAssetVM => !!x && packShown(x));
    const base = tab === 'recent' ? byId(recentIds) : tab === 'favorite' ? byId(favIds) : ASSETS[tab] ?? [];
    return base.map((x) => ({ ...x, favorite: favIds.includes(x.id) }));
  }, [tab, recentIds, favIds, packShown]);
  const packFail = () => say('설정을 저장하지 못했어요. 잠시 뒤 다시 해 주세요');
  const drawerTabs = {
    fixedTabs: FIXED_TABS, packs: visiblePacks, tab,
    allPacks: PACKS.map((p) => ({ ...p, shown: !assetPrefs.hiddenPackIds.includes(p.id) })),
    onTabChange: setTab,
    onReorder: (ids: string[]) => { void setPackOrder(ids).then((ok) => { if (!ok) packFail(); }); },
    onToggleShown: (id: string, shown: boolean) => { void setPackShown(id, shown).then((ok) => { if (!ok) packFail(); }); },
    onResetOrder: () => { void resetPackOrder().then((ok) => { if (!ok) packFail(); }); },
  };

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
  const pickedNow = picked ?? ALL_ASSETS.find((x) => x.id === recentIds[0] && packShown(x)) ?? ALL_ASSETS.find(packShown) ?? null;
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
      {note && (
        <div className="max-w-[calc(100vw-24px)] px-4 py-2 rounded-2xl text-[13px] bg-[var(--sd-ink)] text-[var(--sd-bg)] shadow-lg flex items-center gap-3">
          <span>{note}</span>
          {toastAction && <button type="button" onClick={toastAction.onClick} className="pointer-events-auto shrink-0 min-h-[32px] px-3 rounded-full bg-[var(--sd-bg)] text-[var(--sd-ink)] text-xs font-medium">{toastAction.label}</button>}
        </div>
      )}
    </div>
  );

  // ── 휴지통(30일) ──
  // 지우기는 자동저장 줄 뒤에 세우고, 사진·필기 작업 중에는 막는다. 성공한 뒤 pathsRef 를 비워 파일 정리가 돌지 않게 한다.
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashItems, setTrashItems] = useState<DiaryTrashVM[]>([]);
  const [trashLoaded, setTrashLoaded] = useState(false);
  const [trashFailed, setTrashFailed] = useState(false);
  useEffect(() => {
    if (!trashOpen) return;
    setTrashLoaded(false); setTrashFailed(false);
    return subscribeDiaryTrash(me, (list) => { setTrashItems(list ?? []); setTrashFailed(list === null); setTrashLoaded(true); });
  }, [me, trashOpen]);
  const [trashUndo, setTrashUndo] = useState<{ id: string; date: string } | null>(null);
  useEffect(() => {
    if (!trashUndo) return;
    const t = window.setTimeout(() => setTrashUndo((u) => (u === trashUndo ? null : u)), 5000);
    return () => window.clearTimeout(t);
  }, [trashUndo]);

  const uploading = () => busyRef.current > 0 || mineRef.current.items.some((i) => (i.src ?? '').startsWith('blob:'));
  const trashMine = useCallback(async () => {
    if (!readyRef.current || !diaryPageHasContent(mineRef.current)) return;
    if (uploading()) { say('사진을 올리는 중이에요 — 다 올라간 뒤에 지워 주세요'); return; }
    const d = mineRef.current.date;
    setSel(null);
    const seq = conflictSeqRef.current;
    await flush();
    if (conflictSeqRef.current !== seq) { say('다른 기기에서 고친 장을 불러왔어요 — 확인한 뒤 다시 지워 주세요'); return; }
    if (dirtyRef.current || readDiaryDraft(d, me)) { say('아직 저장되지 않았어요 — 저장된 뒤에 다시 지워 주세요'); return; }
    if (mineRef.current.date !== d || !readyRef.current) return;
    readyRef.current = false; setReady(false);
    const job = chainRef.current.then(async () => {
      try {
        const { revision, trashId } = await trashDiaryPage(d, me, revsRef.current[d] ?? 0);
        revsRef.current[d] = revision;
        clearDiaryDraft(d, me);
        if (!trashId) return;
        const blank = { ...blankDiaryPage(d, me), theme: mineRef.current.theme };
        pathsRef.current[d] = new Set(); lastRef.current[d] = blank;
        if (mineRef.current.date === d) { mineRef.current = blank; setMine(blank); dirtyRef.current = false; setSaveState('saved'); }
        setTrashUndo({ id: trashId, date: d });
      } catch (e) {
        if (e instanceof PracticeBlocked) return;
        if (e instanceof DiaryConflict) {
          clearDiaryDraft(d, me); setReloadKey((k) => k + 1);
          say('다른 기기에서 고친 장이 있어 지우지 않았어요 — 새로 불러왔어요');
          return;
        }
        say('지우지 못했어요. 잠시 뒤에 다시 해 주세요');
      }
    });
    chainRef.current = job.catch(() => {});
    await job.catch(() => {});
    if (mineRef.current.date === d) { readyRef.current = true; setReady(true); }
  }, [me, flush, say]);

  // 되살릴 날짜의 로컬 초안이 남아 있으면 먼저 그 날짜를 열어 저장하게 한다. 덮어쓸 장이 있으면 화면에서 한 번 더 묻는다.
  const restoreTrash = useCallback(async (id: string, d: string, swap: boolean): Promise<RestoreResult> => {
    if (uploading()) { say('사진을 올리는 중이에요 — 다 올라간 뒤에 되살려 주세요'); return 'fail'; }
    await flush();
    if ((mineRef.current.date === d && dirtyRef.current) || readDiaryDraft(d, me)) {
      setTrashOpen(false); setTrashUndo(null); setSel(null); setBackTo(null); setOwner(me); setView('day');
      if (mineRef.current.date !== d) setDate(d);
      say('그 날에 아직 저장 안 된 글이 있어요 — 저장된 뒤에 휴지통에서 되살려 주세요');
      return 'fail';
    }
    const wasReady = readyRef.current;
    readyRef.current = false; setReady(false);
    let out: RestoreResult = 'fail';
    const job = chainRef.current.then(async () => {
      try {
        await restoreDiaryTrash(id, me, swap);
        clearDiaryDraft(d, me);
        const blank = blankDiaryPage(d, me);
        mineRef.current = blank; setMine(blank); dirtyRef.current = false;
        setTrashUndo(null); setTrashOpen(false); setSel(null); setBackTo(null); setOwner(me); setView('day');
        if (date === d) setReloadKey((k) => k + 1); else setDate(d);
        window.scrollTo(0, 0);
        say(swap ? '장을 되살렸어요 — 있던 장은 휴지통으로 옮겼어요' : '장을 되살렸어요');
        out = 'ok';
      } catch (e) {
        if (e instanceof DiaryRestoreOccupied) out = 'occupied';
        else if (!(e instanceof PracticeBlocked)) say('되살리지 못했어요. 잠시 뒤에 다시 해 주세요');
        if (wasReady && mineRef.current.date === date) { readyRef.current = true; setReady(true); }
      }
    });
    chainRef.current = job.catch(() => {});
    await job.catch(() => {});
    return out;
  }, [me, date, flush, say]);
  const openTrash = () => { void flush(); setSel(null); setTrashOpen(true); };

  const trashLayer = (
    <>
      {trashOpen && <DiaryTrashPage items={trashItems} loaded={trashLoaded} failed={trashFailed} onBack={() => setTrashOpen(false)} onRestore={restoreTrash} />}
      {trashUndo && (
        <div className="fixed inset-x-0 z-[85] flex justify-center px-4 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}>
          <div className="pointer-events-auto flex items-center gap-3 min-h-[44px] pl-4 pr-1.5 py-1.5 rounded-2xl bg-[var(--sd-card-solid)] border border-[var(--sd-line)] shadow-lg">
            <span className="text-[14px] text-[var(--sd-ink)]">휴지통으로 옮겼어요</span>
            <button type="button"
                    onClick={() => { const u = trashUndo; setTrashUndo(null); void restoreTrash(u.id, u.date, false).then((r) => { if (r === 'occupied') { setTrashOpen(true); say('그 날에 새로 쓴 장이 있어요 — 휴지통에서 골라 주세요'); } }); }}
                    className="min-h-[36px] px-3 rounded-xl text-[14px] font-semibold text-white active:scale-[0.98]"
                    style={{ background: '#B4546A' }}>
              되돌리기
            </button>
          </div>
        </div>
      )}
    </>
  );

  const openArchive = (from: 'day' | 'month', ym: string) => {
    void flush(); setSel(null); setArcBack(from);
    if (ym !== arcYm) { setArcYm(ym); setArcShown(ARCHIVE_STEP); arcScroll.current = 0; }
    setView('archive');
  };
  if (view === 'archive') {
    return (
      <>
        <DiaryArchiveScreen
          me={me} ym={arcYm} today={todayYmd()}
          metas={metasYm === arcYm ? Object.values(metas) : null}
          who={arcWho} photoOnly={arcPhoto} query={arcQuery} shown={arcShown}
          onWho={(w) => { setArcWho(w); setArcShown(ARCHIVE_STEP); }}
          onPhotoOnly={(v) => { setArcPhoto(v); setArcShown(ARCHIVE_STEP); }}
          onQuery={(v) => { setArcQuery(v); setArcShown(ARCHIVE_STEP); arcScroll.current = 0; window.scrollTo(0, 0); }}
          onMore={() => setArcShown((n) => n + ARCHIVE_STEP)}
          onYm={(ym) => { setArcYm(ym); setArcShown(ARCHIVE_STEP); arcScroll.current = 0; window.scrollTo(0, 0); }}
          onOpen={(d, o) => { arcScroll.current = window.scrollY; setOwner(o); goDate(d); setBackTo('archive'); setView('day'); window.scrollTo(0, 0); }}
          onBack={() => { if (arcBack === 'exit') { onExit(); return; } if (arcBack === 'month') setView('month'); else setView('day'); }}
        />
        <ArchiveScrollRestore y={arcScroll.current} />
        {toast}
        {trashLayer}
      </>
    );
  }

  if (view === 'month') {
    const ordered = (a: string, b: string) => (a <= b ? [a, b] : [b, a]);
    return (
      <>
        <DiaryMonthScreen
          me={me} owner={mOwner} canEdit={canEditMonth}
          monthLabel={`${mYm.slice(0, 4)}년 ${Number(mYm.slice(5, 7))}월`} monthNumber={Number(mYm.slice(5, 7))}
          yearNote={mYm.slice(0, 4) !== todayYmd().slice(0, 4) ? `${mYm.slice(0, 4)}년` : undefined}
          titleStyle={deco.title} hero={deco.hero} cells={cells} bands={bands} margin={deco.margin}
          upcoming={upcoming} onOpenUpcoming={() => setUpOpen(true)}
          onAddEvent={() => openNewEvent(mYm === TODAY.slice(0, 7) ? TODAY : `${mYm}-01`, null)}
          mode={canEditMonth ? mMode : 'view'} tool={tool} selectedAsset={pickedNow} spanStart={spanStart}
          undoText={undo?.text ?? null} saveState={mOffline ? 'offline' : mPending > 0 ? 'saving' : 'saved'}
          onBack={() => { setView('day'); }}
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
          onOpenArchive={() => openArchive('month', mYm)}
          onOpenTrash={openTrash}
          onOpenSpecialDates={() => setSpecial(true)}
        />
        <DiaryAssetDrawer
          open={drawer && canEditMonth} {...drawerTabs} assets={assets}
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
          onOpenPage={(o) => { const d = agendaDate; if (!d) return; setAgendaDate(null); setOwner(o); goDate(d); setBackTo('month'); setView('day'); }}
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
        {trashLayer}
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
        onBack={() => {
          if (backTo === 'month') { setBackTo(null); setSel(null); setMYm(date.slice(0, 7)); setView('month'); return; }
          if (backTo === 'archive') { void flush(); setBackTo(null); setSel(null); setView('archive'); return; }
          void flush(); onExit();
        }}
        backLabel={backTo === 'month' ? '달력' : backTo === 'archive' ? '지난 일기' : undefined}
        onOpenArchive={() => openArchive('day', date.slice(0, 7))}
        onOpenTrash={openTrash}
        onTrashPage={isMine && ready && diaryPageHasContent(mine) ? () => void trashMine() : undefined}
        stashCount={isMine ? stashes.length : 0}
        onOpenStashes={isMine ? () => setStashOpen(true) : undefined}
        onPrevDate={() => goDate(addDaysYmd(date, -1))} onNextDate={() => goDate(addDaysYmd(date, 1))}
        onGoToday={() => goDate(TODAY)} onOpenMonth={() => { setMYm(date.slice(0, 7)); setView('month'); }}
        onChangeOwner={(p) => { setSel(null); setStashOpen(false); setOwner(p); }}
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
        notes={diaryPageHasContent(page) ? notes : []}
        pageExists={isMine ? diaryPageHasContent(mine) : !!theirs}
        onToggleHeart={toggleHeart} onSendNote={sendNote} onDeleteNote={removeNote}
        photoCount={isMine ? mine.items.filter((i) => i.type === 'photo').length : 0}
        selectedItem={selItem}
        onPickAppPhotos={(list) => void pickAppPhotos(list)}
        onPhotoFull={() => say(`사진은 한 장에 ${DIARY_LIMITS.photos}장까지 넣을 수 있어요`)}
        onPhotoFrame={setPhotoFrame}
        onPhotoCaption={setPhotoCaption}
        future={date > todayYmd()}
        onDraw={inkOk ? () => void drawInk() : undefined}
        onRedraw={inkRedo && selItem?.type === 'ink' && (selItem.strokeSrc || inkSideRef.current[selItem.id]) ? () => void reEditInk() : undefined}
      />
      <DiaryAssetDrawer
        open={drawer && isMine} {...drawerTabs} assets={assets} full={mine.items.length >= DIARY_LIMITS.items}
        onPick={(a) => {
          addItem(a.kind === 'sticker' ? { type: 'sticker', src: a.src, w: a.w ?? 0.3, ratio: a.ratio ?? 1 } : { type: a.kind, decorId: a.decorId, w: a.kind === 'tape' ? 0.42 : 0.3, ratio: ratioOfDecor(a.decorId) });
          remember(a);
        }}
        onToggleFavorite={toggleFav}
        onClose={() => setDrawer(false)}
      />
      <DiaryStashSheet
        open={stashOpen && isMine} stashes={stashes} practice={practice}
        onRestore={restoreStash} onDelete={deleteStash} onClose={() => setStashOpen(false)}
      />
      {specialSheet}
      {toast}
      {trashLayer}
    </>
  );
}

/** 지난 일기로 돌아오면 보던 자리로 — 그려진 뒤 한 번만 굴린다. */
function ArchiveScrollRestore({ y }: { y: number }) {
  useEffect(() => { if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
