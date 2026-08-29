'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, useAnimation, Reorder, useDragControls } from 'framer-motion';
import {
  Wind, Heart, PenLine, BookOpen, ChefHat, BookText,
  RefreshCcw, ChevronRight, Shirt, Smile, Camera, Sparkles, Home, Building2, CheckCircle2, Award, CalendarDays,
  Library, ExternalLink, Link2, MapPin, CloudSun, Mail, LayoutGrid, GripVertical, Check, LoaderCircle,
  type LucideIcon,
} from 'lucide-react';

// 화면에서 보는 위치 (알림 cron과 별개로 사용자가 선택)
const LOCATIONS = {
  home: { label: '호평동', station: '금곡동', region: '경기북부', nx: 64, ny: 128 },
  work: { label: '서울 중구', station: '중구', region: '서울', nx: 60, ny: 127 },
} as const;
type LocKey = keyof typeof LOCATIONS;
import TodayTomorrowWeather from '@/components/TodayTomorrowWeather';
import SkyArt from '@/components/SkyArt';
import { getInitialData } from '@/lib/api';
import { subscribeLatestLetterTo, nameFromCode, partnerOf, vocativeOf, type Voice } from '@/lib/letters';
import { getEmoticonsByIds } from '@/lib/emoticons';
import { formatKstTime, formatKstMonthDay, kstDayKey } from '@/lib/kst';
import { subscribeLatestMemory, fetchMemoryCount, type Memory } from '@/lib/memories';
import { subscribeShareList, type ShareItemView } from '@/lib/share';
import { subscribeWishlist } from '@/lib/wishlist';
import { subscribeAgain } from '@/lib/again';
import { subscribeRecipes, type RecipeItemView } from '@/lib/recipes';
import { subscribePoems, countNewPoems, readPoemsLastSeen, type PoemItemView } from '@/lib/poems';
import VoicePlayer from '@/components/VoicePlayer';
// ⏱ 임시 — D-day 카드 어텐션 (테두리 펄스 + Tap! 뱃지 + 리플). 24h 후 자동 안 뜸.
import DdayAttentionV2 from '@/components/DdayAttentionV2';
import QuickReplyBar from '@/components/QuickReplyBar';
import TodayDigest from '@/components/TodayDigest';
import { subscribeTodayStats } from '@/lib/dailyStats';
import LiveHeartLayer from '@/components/LiveHeartLayer';
import { subscribeTodayMoods, setMyMood, moodFromKey, MOOD_OPTIONS, type MoodMap, type MoodOption } from '@/lib/moods';
import { touchPresence, subscribePresence, formatPresenceRelative, isTogetherNow, type Presence } from '@/lib/presence';
import { subscribeLive, liveKey, DEFAULT_BOARD, DEFAULT_BOOK, subscribeCurrentPage, subscribeStrokes, type BoardStroke } from '@/lib/canvasBoard';
import DoodleThumb from '@/components/DoodleThumb';
import { pushWidgetSnapshot } from '@/lib/widget';
import { registerNativePush } from '@/lib/nativePush';
import { subscribeCalendar } from '@/lib/calendar';
import { todayYmd } from '@/lib/calendarLayout';
import { getPushState, enablePush, disablePush, type PushState } from '@/lib/push';
import AirSkyVisual from '@/components/AirSkyVisual';
import { subscribeHomeLayout, saveHomeLayout, type HomeLayout } from '@/lib/homeLayout';
import { Bell, BellOff, MessageCircle } from 'lucide-react';
import ChatPanel, { preview } from '@/components/ChatPanel';
import { subscribeMessages, sendMessage, sendCapsule, type ChatMessage } from '@/lib/chat';
import type { WeatherData, OutfitGuide } from '@/types';

// 등급별 테마 (배경 그라데이션·텍스트·막대 색을 한 색으로 통일)
const getAirTheme = (grade?: string) => {
  switch (grade) {
    case '좋음': return { text: 'text-[#10B981]', bar: 'bg-[#10B981]', gradient: 'from-[#EAF8F5]' };
    case '보통': return { text: 'text-[#0ea5b7]', bar: 'bg-[#22b8cf]', gradient: 'from-[#E7F7FA]' };
    case '나쁨': return { text: 'text-[#F97316]', bar: 'bg-[#F97316]', gradient: 'from-[#FFF7ED]' };
    case '매우 나쁨': return { text: 'text-[#EF4444]', bar: 'bg-[#EF4444]', gradient: 'from-[#FEF2F2]' };
    default: return { text: 'text-slate-500', bar: 'bg-slate-400', gradient: 'from-[#EAF8F5]' };
  }
};

// 기분별 미세 모션 (framer-motion). 여기 없는 기분은 정지 — 행복·평온·슬픔·보고싶음·미안·고마워.
// 값은 사이담 세션과 공유해 맞춤. 신남은 예전 '동동' 이중 바운스 순정 복원.
const MOOD_ANIM: Record<string, { animate: Record<string, number[]>; transition: Record<string, unknown> }> = {
  excited: { animate: { y: [0, -8, 0, -4, 0] },            transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
  love:    { animate: { scale: [1, 1.14, 1, 1.14, 1] },    transition: { duration: 1.1, times: [0, 0.14, 0.28, 0.42, 0.62], repeat: Infinity, ease: 'easeInOut' } },
  sleepy:  { animate: { y: [0, 4, 0] },                    transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  sulky:   { animate: { rotate: [0, -9, 0] },              transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } },
  angry:   { animate: { x: [0, -1.5, 1.5, -1.5, 0] },      transition: { duration: 0.32, repeat: Infinity, ease: 'easeInOut' } },
  sick:    { animate: { rotate: [0, 4, -2, 3, 0] },        transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
};

// ── 홈 모듈 시스템 (사이담 space/[id]/page.tsx 구조 그대로) ───────────────
// 카드는 1x1 / 2x1 / 2x2 를 섞는다. 순서·크기·on-off는 settings/home 에 저장(둘이 같은 배치).
type CardSize = '1x1' | '2x1' | '2x2';
interface ModuleDef { id: string; name: string }
// 순서 = 기본 배치. 상단은 '지금'(낙서장/꼼톡/미세먼지/날씨 풀폭) → 조각 → 짝지은 1칸들 → 추억 → 보관 리스트.
// ⚠️ 1칸(1x1) 카드는 반드시 짝수쌍으로 이웃하게 둔다(2x1이 더 높아 옆에 1칸이 오면 반칸이 빈다 — 사이담 함정).
const MODULES: ModuleDef[] = [
  { id: 'doodle',   name: '낙서장' },
  { id: 'chat',     name: '꼼톡' },
  { id: 'air',      name: '미세먼지' },
  { id: 'weather',  name: '오늘 밖' },
  { id: 'mood',     name: '오늘의 기분' },
  { id: 'dday',     name: '함께한 지' },
  { id: 'calendar', name: '달력' },
  { id: 'letter',   name: '편지' },
  { id: 'memories', name: '추억' },
  { id: 'praise',   name: '칭찬' },
  { id: 'share',    name: '공유 리스트' },
  { id: 'wishlist', name: '위시리스트' },
  { id: 'again',    name: '또 갈래' },
  { id: 'recipes',  name: '레시피' },
  { id: 'poems',    name: '시집' },
];
// ⚠️ 2x1 이 1x1 보다 높다(핵심). 풀폭 카드 = 2x1, 짝지은 1칸 = 1x1.
const DEFAULT_SIZE: Record<string, CardSize> = {
  doodle: '2x1', chat: '2x1', air: '2x1', weather: '2x1', memories: '2x1',
  mood: '1x1', dday: '1x1', calendar: '1x1', letter: '1x1',
  praise: '1x1', share: '1x1', wishlist: '1x1', again: '1x1', recipes: '1x1', poems: '1x1',
};
const SIZE_CLASS: Record<CardSize, string> = {
  '1x1': 'col-span-1 row-span-1 min-h-[104px]',
  '2x1': 'col-span-2 row-span-1 min-h-[140px]',
  '2x2': 'col-span-2 row-span-2 min-h-[220px]',
};
const SIZE_CYCLE: CardSize[] = ['1x1', '2x1', '2x2'];
// 순백으로 둘 카드(눈 쉬는 자리). 나머지는 --m-{id} 옅은 틴트.
const WHITE_CARDS = new Set(['chat', 'weather', 'mood', 'air', 'letter']);
// enabledModules 저장 뒤 '나중에' 추가할 모듈 id를 여기 넣으면 기존 사용자도 기본 켬(사이담 함정 대응).
// 지금은 첫 배포라 저장된 배치가 없음(=전부 켬) → 비워둠. 향후 카드 추가 시 그 id를 넣을 것.
const ADDED_LATER: string[] = [];
// 저장된 순서를 적용하되 그 뒤 추가된 모듈은 기본 순서상 '제자리'에 끼운다(맨 밑 밀림 방지).
function applyModuleOrder(order: string[] | undefined): ModuleDef[] {
  if (!order?.length) return MODULES;
  const byId = new Map(MODULES.map((m) => [m.id, m]));
  const result = order.map((id) => byId.get(id)).filter((m): m is ModuleDef => !!m);
  const present = new Set(result.map((m) => m.id));
  MODULES.forEach((m, i) => {
    if (present.has(m.id)) return;
    let insertAt = result.length;
    for (let j = i - 1; j >= 0; j--) {
      const idx = result.findIndex((r) => r.id === MODULES[j].id);
      if (idx >= 0) { insertAt = idx + 1; break; }
    }
    result.splice(insertAt, 0, m);
    present.add(m.id);
  });
  return result;
}

// 편집모드 한 줄 — 끌기핸들 + 크기순환 + on/off. (Reorder.Item은 훅을 쓰므로 컴포넌트로 분리)
function EditRow({ module, size, enabled, onCycleSize, onToggle }: {
  module: ModuleDef; size: CardSize; enabled: boolean; onCycleSize: () => void; onToggle: () => void;
}) {
  const controls = useDragControls();
  const sizeLabel = size === '1x1' ? '작게' : size === '2x1' ? '넓게' : '크게';
  return (
    <Reorder.Item value={module} dragListener={false} dragControls={controls}
      className="sd-card flex items-center gap-2.5 px-3 py-2.5" style={{ background: 'var(--sd-card-solid)' }}>
      <button onPointerDown={(e) => controls.start(e)} className="cursor-grab touch-none p-1 -ml-1" style={{ color: 'var(--sd-faint)' }} aria-label="끌어서 이동">
        <GripVertical size={18} />
      </button>
      <span className="flex-1 text-[14px] font-bold truncate" style={{ color: enabled ? 'var(--sd-ink)' : 'var(--sd-faint)' }}>{module.name}</span>
      <button onClick={onCycleSize} disabled={!enabled}
        className="px-2.5 py-1 rounded-full text-[12px] font-bold transition-opacity"
        style={{ background: 'var(--sd-surface-2)', color: 'var(--sd-muted)', opacity: enabled ? 1 : 0.35 }}>
        {sizeLabel}
      </button>
      <button onClick={onToggle} role="switch" aria-checked={enabled} aria-label={`${module.name} 표시`}
        className="relative w-10 h-6 rounded-full transition-colors shrink-0"
        style={{ backgroundColor: enabled ? 'var(--sd-rel)' : '#CBD5E1' }}>
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }} />
      </button>
    </Reorder.Item>
  );
}

export default function KkomMorningHome() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // ── 홈 모듈 배치 (settings/home 실시간 구독) ──
  const [layout, setLayout] = useState<HomeLayout>({});
  useEffect(() => subscribeHomeLayout(setLayout), []);
  const ordered = useMemo(() => applyModuleOrder(layout.moduleOrder), [layout.moduleOrder]);
  const sizes = useMemo<Record<string, CardSize>>(() => ({ ...DEFAULT_SIZE, ...(layout.moduleSizes || {}) }), [layout.moduleSizes]);
  const enabledSet = useMemo(() => {
    const saved = layout.enabledModules;
    if (!saved) return new Set(MODULES.map((m) => m.id)); // 이전 배치 = 전부 켬(사이담 함정: undefined vs [])
    return new Set([...saved, ...ADDED_LATER.filter((id) => !saved.includes(id))]);
  }, [layout.enabledModules]);
  const shownModules = useMemo(() => ordered.filter((m) => enabledSet.has(m.id)), [ordered, enabledSet]);
  const [editing, setEditing] = useState(false);
  const [draftOrder, setDraftOrder] = useState<ModuleDef[]>(MODULES);
  const [draftSizes, setDraftSizes] = useState<Record<string, CardSize>>(DEFAULT_SIZE);
  const [draftEnabled, setDraftEnabled] = useState<Set<string>>(new Set());
  const [savingLayout, setSavingLayout] = useState(false);
  useEffect(() => {
    if (editing) { setDraftOrder(ordered); setDraftSizes(sizes); setDraftEnabled(new Set(enabledSet)); }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps
  const finishEditing = async () => {
    setSavingLayout(true);
    try {
      await saveHomeLayout({ moduleOrder: draftOrder.map((m) => m.id), moduleSizes: draftSizes, enabledModules: [...draftEnabled] });
      setEditing(false);
    } catch (e) { console.error('배치 저장 실패', e); alert('배치를 저장하지 못했어요.'); }
    finally { setSavingLayout(false); }
  };
  const cycleDraftSize = (id: string) => setDraftSizes((s) => {
    const cur = s[id] ?? DEFAULT_SIZE[id] ?? '1x1';
    const next = SIZE_CYCLE[(SIZE_CYCLE.indexOf(cur) + 1) % SIZE_CYCLE.length];
    return { ...s, [id]: next };
  });
  const toggleDraftEnabled = (id: string) => setDraftEnabled((prev) => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [air, setAir] = useState<any>(null);
  const [outfit, setOutfit] = useState<OutfitGuide | null>(null);
  const [dailyMessage, setDailyMessage] = useState<string>('');
  const [latestVoice, setLatestVoice] = useState<Voice | null>(null);
  const [latestLetterAt, setLatestLetterAt] = useState<Date | null>(null);
  const [latestLetterId, setLatestLetterId] = useState<string | null>(null);
  const [latestLetterHasDoodle, setLatestLetterHasDoodle] = useState(false);
  const [latestLetterEmoticonIds, setLatestLetterEmoticonIds] = useState<string[]>([]);
  const [hasLetter, setHasLetter] = useState(false);
  const [moods, setMoods] = useState<MoodMap>({});
  // 홈은 커버 1장 + 개수만 필요 (전체 배열 X — 코드리뷰 #8)
  const [latestMemory, setLatestMemory] = useState<Memory | null>(null);
  const [memoryCount, setMemoryCount] = useState(0);
  const [moodOpen, setMoodOpen] = useState(false);
  const [userName, setUserName] = useState('');   // 빈값이어야 [userName] 이펙트 가드가 로그인 확정 전 실행을 막음(잘못된 상대·푸시토큰 방지)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dDay, setDDay] = useState(0);
  const [dateText, setDateText] = useState('');
  const [partnerPresence, setPartnerPresence] = useState<Presence>({ lastSeenAt: null, active: false });
  const [partnerDrawing, setPartnerDrawing] = useState(false); // 상대가 낙서장에서 실시간 필기 중 (RTDB live)
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatUnread, setChatUnread] = useState(false);
  const [msgLimit, setMsgLimit] = useState(40);
  const wasOnlineRef = useRef(false);
  const homeTouch = useRef<{ x: number; y: number } | null>(null);
  const autoOpenedRef = useRef(false);
  const lastReadIdRef = useRef<string | null>(null);
  const [nextEvent, setNextEvent] = useState<{ title: string; date: string } | null>(null); // 위젯용 다음 일정
  const [heroStrokes, setHeroStrokes] = useState<BoardStroke[]>([]); // 홈 히어로 미니 썸네일용 현재 페이지 획
  const [presenceTick, setPresenceTick] = useState(0); // 매분 재계산용
  const [pushState, setPushState] = useState<PushState>('unknown');
  const [locKey, setLocKey] = useState<LocKey>('home'); // 화면 위치 선택
  const [shares, setShares] = useState<ShareItemView[]>([]);
  const [wishes, setWishes] = useState<{ id: string; title: string; createdAt: Date }[]>([]);
  const [agains, setAgains] = useState<{ id: string; title: string; createdAt: Date }[]>([]);
  const [recipes, setRecipes] = useState<RecipeItemView[]>([]);
  // 시집 — 카드 총편수 배지 + 안읽은 새 시 숫자 배지
  const [poems, setPoems] = useState<PoemItemView[]>([]);
  const [poemsLastSeen, setPoemsLastSeen] = useState(0);
  // 칭찬 다이어리 카드 — 오늘 partner가 칭찬 보냈는지 (스마일 배지용)
  const [praiseCount, setPraiseCount] = useState(0);   // 오늘 partner가 준 칭찬(스티커+졸랐어) 실시간 카운트
  const [praiseSeen, setPraiseSeen] = useState(0);     // /praise를 마지막으로 연 시점의 카운트 (localStorage)
  // 날씨 카드 onboarding 힌트 (디바이스당 한 번)
  const [showWeatherHint, setShowWeatherHint] = useState(false);
  const weatherShake = useAnimation();

  const loadData = async (forceRefresh = false) => {
    setIsRefreshing(true);
    try {
      const data = await getInitialData('home', forceRefresh);
      // 날씨는 GAS(죽음) 대신 /api/weather(기상청)에서 별도로 받음
      setOutfit(data.outfit);
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    const me = nameFromCode(JSON.parse(userStr).로그인코드);
    setUserName(me);

    loadData();
    const unsubLetter = subscribeLatestLetterTo(me, (letter) => {
      setHasLetter(!!letter);
      setDailyMessage(letter?.body || '');
      setLatestVoice(letter?.voice ?? null);
      setLatestLetterAt(letter?.createdAt?.toDate?.() ?? null);
      setLatestLetterId(letter?.id || null);
      setLatestLetterHasDoodle(!!letter?.doodle);
      setLatestLetterEmoticonIds(Array.isArray(letter?.emoticonIds) ? letter.emoticonIds : []);
    });
    const unsubMoods = subscribeTodayMoods(setMoods);
    // 최신 1장만 실시간, 개수는 getCountFromServer(문서 다운로드 없음). 새 사진 오면 개수 재조회.
    const unsubMemories = subscribeLatestMemory((m) => {
      setLatestMemory(m);
      fetchMemoryCount().then(setMemoryCount);
    });
    const unsubShares = subscribeShareList(setShares);
    // 위시리스트 — 카드 배지 + 매일매일 꼼모닝 헤더 정확한 오늘 카운트용 (dailyStats 대신)
    const unsubWishes = subscribeWishlist((items) => {
      setWishes(items.filter((i) => !i.done).map((i) => ({ id: i.id, title: i.title, createdAt: i.createdAt })));
    });
    // 또갈래 — 카드 배지용
    const unsubAgains = subscribeAgain((items) => {
      setAgains(items.map((i) => ({ id: i.id, title: i.title, createdAt: i.createdAt })));
    });
    // 레시피 — 카드 NEW 배지 + 매일매일 꼼모닝 헤더 정확한 오늘 카운트용
    const unsubRecipes = subscribeRecipes(setRecipes);
    // 시집 — 새 시 배지. lastSeen은 /poems를 열 때 갱신되므로, 볼 때까지 배지가 남음
    setPoemsLastSeen(readPoemsLastSeen());
    const unsubPoems = subscribePoems(setPoems);

    // 칭찬 — 오늘 partner가 준 칭찬(스티커+졸랐어)을 실시간 구독. 안읽음 숫자 배지용.
    // (지역변수 me 사용 — userName은 setUserName 직후라 클로저에서 초기값 고정되는 이슈 회피)
    // 안읽음 = 지금 카운트 − 내가 /praise를 마지막으로 연 시점의 카운트(localStorage, 날짜별).
    const praisePartner = (me === '우댕' ? '꼼이' : '우댕') as '우댕' | '꼼이';
    setPraiseSeen(Number(localStorage.getItem(`praiseSeen:${kstDayKey(new Date())}`) || 0));
    const unsubPraise = subscribeTodayStats((s) => {
      setPraiseCount(((s.praiseStickers as any)[praisePartner] || 0) + ((s.praiseRequests as any)[praisePartner] || 0));
    });

    const start = new Date('2023-09-28');
    const today = new Date();
    start.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
    setDDay(Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
    setDateText(new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' }));

    // 저장된 위치 선택 복구
    const savedLoc = localStorage.getItem('kkom-loc');
    if (savedLoc === 'home' || savedLoc === 'work') setLocKey(savedLoc);

    // 날씨 카드 onboarding — 처음 한 번만
    // Claude 참고(코드리뷰 #4): 예전엔 여기서 return () => clearTimeout(t)로 조기 반환해서
    // 아래 구독 7개 cleanup이 등록 안 됐음 (첫 방문·StrictMode마다 리스너 누수). hintTimer도 같은 cleanup에서 정리.
    let hintTimer: ReturnType<typeof setTimeout> | null = null;
    const hintShown = localStorage.getItem('kkom-weather-hint-shown');
    if (!hintShown) {
      hintTimer = setTimeout(() => {
        setShowWeatherHint(true);
        weatherShake.start({
          x: [0, -6, 6, -4, 4, 0],
          transition: { duration: 0.8, ease: 'easeInOut' },
        });
        localStorage.setItem('kkom-weather-hint-shown', '1');
        setTimeout(() => setShowWeatherHint(false), 3500);
      }, 1500);
    }

    return () => {
      if (hintTimer) clearTimeout(hintTimer);
      unsubLetter(); unsubMoods(); unsubMemories(); unsubShares();
      unsubWishes(); unsubAgains(); unsubRecipes(); unsubPoems(); unsubPraise();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // 접속 — 내 presence (active/inactive 명시) + 상대 구독
  useEffect(() => {
    if (!userName) return;
    const partner = partnerOf(userName);
    // presence 쓰기(heartbeat)는 전역 PresenceHeartbeat가 담당 → 여기선 구독만.
    const unsub = subscribePresence(partner, setPartnerPresence);
    // 상대가 낙서장에서 실시간 필기 중인지 (RTDB live)
    const unsubLive = subscribeLive(DEFAULT_BOARD, liveKey(partner as '우댕' | '꼼이'), (s) => {
      setPartnerDrawing(!!s && Array.isArray(s.points) && s.points.length > 0);
    });
    // "N분 전" 표시 매 1분마다 재계산
    const tick = setInterval(() => setPresenceTick((x) => x + 1), 60_000);
    getPushState(userName).then(setPushState);
    registerNativePush(liveKey(userName as '우댕' | '꼼이'));   // 네이티브 앱 APNs 푸시 등록
    return () => { clearInterval(tick); unsub(); unsubLive(); };
  }, [userName]);

  // Live Activity — 내가 접속 중이면 상대 activity에 "나 접속 💚" 실시간 푸시(앱 닫혀 있어도 잠금화면에 뜸).
  // mount + 80초 주기 + 앱 복귀 시. 서버 쿨다운 25초로 스팸 방지.
  useEffect(() => {
    if (!userName) return;
    const ping = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetch('/api/live-activity/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: userName }),
      }).catch(() => {});
    };
    ping();
    const iv = setInterval(ping, 80_000);
    const onVis = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [userName]);

  // 위젯용 다음 일정 (가장 가까운 미래 일정)
  useEffect(() => {
    const unsub = subscribeCalendar((events) => {
      const today = todayYmd();
      const up = events
        .filter((e) => e.endDate >= today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
      setNextEvent(up ? { title: up.title, date: up.startDate } : null);
    });
    return () => unsub();
  }, []);

  // 홈 히어로 썸네일 — 현재 페이지 획 구독 (페이지 바뀌면 재구독)
  useEffect(() => {
    let unsubStrokes: (() => void) | undefined;
    const unsubPage = subscribeCurrentPage(DEFAULT_BOOK, (pageId) => {
      unsubStrokes?.();
      if (pageId) unsubStrokes = subscribeStrokes(pageId, setHeroStrokes);
      else setHeroStrokes([]);
    });
    return () => { unsubPage(); unsubStrokes?.(); };
  }, []);

  // 홈 위젯 스냅샷 push (네이티브만) — 접속·D-day·일정·미세·기분
  useEffect(() => {
    if (!userName) return;
    const partnerName = partnerOf(userName) as '우댕' | '꼼이';
    const grade = air?.grade;
    const rainEmoji = (() => {
      const wx = weather as any;
      const pty = String(wx?.current?.pty ?? wx?.today?.pty ?? '0');
      const prob = wx?.today?.precipitation?.probability as number | null | undefined;
      if (pty === '3') return '🌨️';                              // 눈
      if (pty === '1' || pty === '2' || pty === '4') return '☔'; // 비/비눈/소나기
      if (prob != null && prob >= 60) return '☔';                // 강수확률 높음
      return undefined;
    })();
    pushWidgetSnapshot({
      partnerName,
      partnerLastSeenMs: partnerPresence.lastSeenAt ? partnerPresence.lastSeenAt.getTime() : 0,
      partnerActive: partnerPresence.active,
      nextEventTitle: nextEvent?.title,
      nextEventDate: nextEvent?.date,
      airGrade: grade && grade !== '정보 없음' && grade !== '조회 실패' ? grade : undefined,
      airPm10: air?.pm10 ?? undefined,
      airPm25: air?.pm25 ?? undefined,
      airLoc: air?.location ?? undefined,
      weatherTemp: weather?.current?.temp ?? undefined,
      weatherSky: weather?.current?.sky ?? undefined,
      weatherRainEmoji: rainEmoji,
      partnerMood: moods[partnerName]?.emoji,
    });
  }, [userName, partnerPresence, partnerDrawing, nextEvent, air, weather, moods]);

  // 채팅 — 실시간 메시지 구독 (msgLimit 늘리면 지난 대화 더 불러옴)
  // 타임캡슐: 도착 전(createdAt 미래)엔 상대 것은 숨김, 내 예약분만 보임.
  useEffect(() => {
    const unsub = subscribeMessages((msgs) => {
      const now = Date.now();
      setMessages(msgs.filter((m) => !m.capsule || m.from === userName || (m.createdAt != null && m.createdAt.getTime() <= now)));
    }, msgLimit);
    return () => unsub();
  }, [msgLimit, userName]);

  // 안 읽음 표시 — 채팅 열려있으면 읽음 처리, 닫혀있고 상대 새 메시지면 뱃지
  useEffect(() => {
    if (!userName || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (chatOpen) {
      lastReadIdRef.current = last.id;
      if (chatUnread) setChatUnread(false);
    } else if (last.from !== userName && last.id !== lastReadIdRef.current) {
      setChatUnread(true);
    }
  }, [messages, chatOpen, userName, chatUnread]);

  // 둘 다 접속하면 대화창 자동 오픈 (접속 세션당 1회 — 닫으면 다시 안 뜸, 오프라인 됐다 다시 접속하면 또 열림)
  useEffect(() => {
    if (!userName) return;
    const online = isTogetherNow(partnerPresence);
    if (online && !wasOnlineRef.current && !autoOpenedRef.current) {
      setChatOpen(true);
      autoOpenedRef.current = true;
    }
    if (!online) autoOpenedRef.current = false;
    wasOnlineRef.current = online;
  }, [userName, partnerPresence]);

  const togglePush = async () => {
    if (pushState === 'on') {
      await disablePush(userName);
      setPushState('off');
      return;
    }
    if (pushState === 'denied') {
      alert('알림 권한이 차단돼있어요. 폰 설정 > Safari/브라우저 > 알림 에서 허용해주세요.');
      return;
    }
    const r = await enablePush(userName);
    if (r.ok) setPushState('on');
    else alert(r.error || '알림을 켤 수 없어요.');
  };

  // 미세먼지: locKey 바뀔 때마다 재구독 (5분 갱신)
  useEffect(() => {
    const loc = LOCATIONS[locKey];
    let active = true;
    const url = `/api/air?station=${encodeURIComponent(loc.station)}&region=${encodeURIComponent(loc.region)}`;
    const load = () => fetch(url).then((r) => r.json()).then((a) => { if (active) setAir(a); }).catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, [locKey]);

  // 날씨: locKey 바뀔 때마다 재구독 (10분 갱신)
  useEffect(() => {
    const loc = LOCATIONS[locKey];
    let active = true;
    const url = `/api/weather?nx=${loc.nx}&ny=${loc.ny}`;
    const load = () =>
      fetch(url)
        .then((r) => r.json())
        .then((w) => { if (active && w && (w.current || w.today)) setWeather(w as any); })
        .catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, [locKey]);

  const changeLoc = (k: LocKey) => {
    setLocKey(k);
    try { localStorage.setItem('kkom-loc', k); } catch {}
  };

  const getPochacco = () => {
    // 사이담 말티푸 8종. 우선순위: 미세먼지 > 더위/추위 > 강수 > 기본
    if (air?.grade === '나쁨' || air?.grade === '매우 나쁨') {
      return '/pochacco/sai_cloudy.png'; // 나쁜 공기 = 우중충 (전용 마스크 포즈는 없음)
    }
    const t = weather?.current?.temp ?? 0;
    // /api/weather의 current엔 pty가 있으나 WeatherData 타입엔 없어 캐스팅으로 읽음
    const pty = (weather?.current as { pty?: string | null } | null | undefined)?.pty;
    if (t >= 28) return '/pochacco/sai_hot.png';   // 아주 더움
    if (t <= -1) return '/pochacco/sai_cold.png';  // 아주 추움
    if (pty === '1' || pty === '2' || pty === '4') return '/pochacco/sai_rain.png'; // 비
    if (pty === '3') return '/pochacco/sai_snow.png'; // 눈
    if (t >= 10) return '/pochacco/sai_sunny.png';  // 따뜻·맑음
    return '/pochacco/sai_partly.png';              // 선선한 기본
  };

  const partner = partnerOf(userName);
  const theme = getAirTheme(air?.grade);
  const hasGrade = air && air.grade && air.grade !== '정보 없음' && air.grade !== '조회 실패';
  const hasWeather = weather?.current?.temp != null;
  const allHourly = (air?.hourly || []).filter((h: any) => h.pm10 != null);
  const trend = allHourly.slice(-6);
  const maxPm = Math.max(50, ...allHourly.map((h: any) => h.pm10 || 0));

  const pickMood = async (opt: MoodOption) => {
    setMoodOpen(false);
    try { await setMyMood(userName, opt.id); } catch (e) { console.error(e); }
  };

  // 저장된 키(신규 id 또는 옛날 이모지) → 화면 표시. 표시 사이즈 = 69. 피커 셀(40)과는 무관.
  // 기분별 미세 모션(MOOD_ANIM) — 홈엔 내/상대 각 1개뿐이라 시끄럽지 않음. 없는 기분은 정지.
  const renderMoodFace = (key: string | undefined, size = 69) => {
    const m = moodFromKey(key);
    if (m) {
      const img = (
        <Image src={m.image} alt={m.label} width={size} height={size} className="drop-shadow-sm" />
      );
      const anim = MOOD_ANIM[m.id];
      if (anim) {
        return (
          <motion.div animate={anim.animate} transition={anim.transition} style={{ width: size, height: size }}>
            {img}
          </motion.div>
        );
      }
      return img;
    }
    // 매칭 실패 — 레거시 이모지든 빈 값이든
    return <span className="text-4xl drop-shadow-sm">{key || '…'}</span>;
  };

  if (!mounted) return <div className="sd-app min-h-screen max-w-md mx-auto" />;

  // 홈에서 왼쪽으로 스와이프 → 꼼톡 열기. 가로 스크롤 요소(미니 이모티콘 줄 등) 위에선 무시.
  const onHomeTouchStart = (e: any) => {
    if (chatOpen || e.touches.length !== 1) { homeTouch.current = null; return; }
    const t = e.touches[0]; homeTouch.current = { x: t.clientX, y: t.clientY };
  };
  const onHomeTouchEnd = (e: any) => {
    const s = homeTouch.current; homeTouch.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (!(dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.5)) return;
    let el = e.target as HTMLElement | null;
    while (el && el !== e.currentTarget) {
      if (el.scrollWidth > el.clientWidth + 4) {
        const ov = getComputedStyle(el).overflowX;
        if (ov === 'auto' || ov === 'scroll') return;
      }
      el = el.parentElement;
    }
    setChatOpen(true); setChatUnread(false);
  };

  // 낙서장 열기 — 네이티브면 KkomCanvas, 웹이면 /canvas (doodle 노드·편집모드 공용)
  const openDoodle = async () => {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      try {
        await (registerPlugin('Canvas') as { open(o: { me: string }): Promise<void> })
          .open({ me: userName === '우댕' ? 'udaeng' : 'kkomi' });
      } catch { router.push('/canvas'); }
    } else {
      router.push('/canvas');
    }
  };

  // ── 리스트 카드 '알림' = 숫자 뱃지 대신 사이담식 최근 항목 제목 + 개수 노출 ──
  const shareTop = shares[0];
  const shareText = shareTop
    ? (shareTop.preview?.title?.trim() || shareTop.memo?.trim() || shareTop.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])
    : '';
  const wishText = wishes[0]?.title ?? '';
  const againText = agains[0]?.title ?? '';
  const recipeText = recipes[0]?.title ?? '';
  const poemText = poems[0]?.title ?? '';
  const newPoemN = countNewPoems(poems, poemsLastSeen);
  const newRecipe = (() => { const now = Date.now(); const DAY = 864e5; return recipes.some((r) => r.by !== userName && (now - r.createdAt.getTime() < DAY)); })();
  const praiseUnread = praiseCount - praiseSeen;

  // 리스트 카드 한 장(사이담식): 라벨 → 최근 제목(굵게) → 개수(새 글이면 강조색). 코너 숫자뱃지 제거.
  const renderListCard = (o: {
    Icon: LucideIcon; name: string; onClick: () => void; bg: string; ac: string;
    recent: string; empty: string; count: number; unit: string; newText?: string;
  }) => (
    <button onClick={o.onClick}
      className="sd-card w-full h-full px-4 py-4 flex flex-col relative text-left transition-transform active:scale-[.98]"
      style={{ background: o.bg }}>
      <div className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
        <o.Icon size={16} strokeWidth={2.2} /> {o.name}
      </div>
      <div className="mt-auto pt-2">
        {o.recent ? (
          <p className="text-[13.5px] font-bold line-clamp-1" style={{ color: 'var(--sd-ink)' }}>{o.recent}</p>
        ) : (
          <p className="text-[12.5px] font-semibold leading-snug break-keep" style={{ color: 'var(--sd-faint)' }}>{o.empty}</p>
        )}
        {o.count > 0 && (
          <p className="text-[12px] font-bold mt-0.5 tabular-nums" style={{ color: o.newText ? o.ac : 'var(--sd-faint)' }}>
            {o.count}{o.unit}{o.newText ? ` · ${o.newText}` : ''}
          </p>
        )}
      </div>
    </button>
  );

  // ── 모듈 카드 본문 — 틀만 사이담식, 안의 데이터·onClick·이모티콘 전부 그대로. 각 카드는 h-full로 격자칸을 채운다.
  const moduleNodes: Record<string, React.ReactNode> = {
    doodle: (
      <button
        onClick={openDoodle}
        className="sd-card relative w-full h-full min-h-[150px] px-4 py-4 flex flex-col text-left active:scale-[.98] transition-transform"
        style={{ background: 'var(--m-doodle)' }}
        aria-label="우리 낙서장 열기"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
            <PenLine size={16} /> 낙서장
          </span>
          <span className="font-handwriting text-[26px] leading-none shrink-0" style={{ color: 'var(--sd-muted)' }}>우리 낙서장 ✏️</span>
        </div>
        <div className="relative flex-1 min-h-[100px] rounded-2xl overflow-hidden" style={{ background: '#FFFCF5', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.05)' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(200,190,185,.55) 1.4px, transparent 1.4px)', backgroundSize: '22px 22px' }} />
          <DoodleThumb strokes={heroStrokes} />
          <span className="absolute bottom-2 right-2 h-9 px-3.5 rounded-[18px] inline-flex items-center shadow-[0_4px_12px_rgba(0,0,0,.12)]" style={{ background: 'var(--m-doodle-ac)' }}>
            <span className="font-handwriting text-[22px] leading-none text-white">종이 펼치기</span>
          </span>
        </div>
      </button>
    ),
    chat: (
      <button
        onClick={() => { setChatOpen(true); setChatUnread(false); }}
        className="sd-card relative w-full h-full min-h-[140px] px-4 py-4 flex flex-col text-left active:scale-[.98] transition-transform"
        style={{ background: 'var(--sd-card-solid)' }}
        aria-label="꼼톡 열기"
      >
        <span className="sd-tape -top-[7px] left-7 w-[52px] h-[17px] rounded-[2px] -rotate-[7deg]" />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
            <MessageCircle size={16} /> 꼼톡
            {chatUnread && <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
          </span>
          <ChevronRight size={14} style={{ color: 'var(--sd-faint)' }} />
        </div>
        {messages.length > 0 ? (() => {
          const recent = messages.slice(-3);
          const last = recent[recent.length - 1];
          const rel = (() => {
            const d = last?.createdAt;
            if (!d) return '';
            const s = Math.floor((Date.now() - d.getTime()) / 1000);
            if (s < 60) return '방금';
            if (s < 3600) return `${Math.floor(s / 60)}분 전`;
            if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
            return `${Math.floor(s / 86400)}일 전`;
          })();
          return (
            <div className="mt-2.5 flex-1 flex flex-col justify-end gap-1.5">
              {recent.map((m, i) => {
                const mine = m.from === userName;
                return (
                  <div key={m.id ?? i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <span className="max-w-[82%] rounded-2xl px-3 py-1.5 text-[12.5px] font-semibold leading-snug line-clamp-2"
                      style={mine ? { background: 'var(--sd-ink-btn)', color: 'var(--sd-card-solid)' } : { background: 'var(--sd-rel-soft)', color: 'var(--sd-ink)' }}>
                      {preview(m)}
                    </span>
                  </div>
                );
              })}
              {rel && <p suppressHydrationWarning className="text-[12.5px] mt-0.5" style={{ color: 'var(--sd-faint)' }}>{rel}</p>}
            </div>
          );
        })() : (
          <p className="mt-auto text-[12.5px]" style={{ color: 'var(--sd-faint)' }}>탭해서 대화를 시작해요</p>
        )}
      </button>
    ),
    air: (
      <div className="sd-card overflow-hidden w-full h-full flex flex-col" style={{ background: 'var(--sd-card-solid)' }}>
        <button onClick={() => router.push('/weather')} className="block w-full text-left px-4 pt-4 pb-1 active:opacity-90" aria-label="미세먼지 상세">
          <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
            <Wind size={16} /> {air?.location || '금곡동'} 미세먼지
          </span>
          <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
            <span className={`text-[34px] font-extrabold leading-none tracking-tight ${theme.text}`}>{hasGrade ? air.grade : '불러오는 중'}</span>
            {air && (
              <span className="text-[12.5px]" style={{ color: 'var(--sd-muted)' }}>
                PM10 <b style={{ color: 'var(--sd-ink)' }}>{air.pm10 ?? '--'}</b> · PM2.5 <b style={{ color: 'var(--sd-ink)' }}>{air.pm25 ?? '--'}</b>
              </span>
            )}
          </div>
        </button>
        <div className="mt-3 overflow-hidden flex-1">
          <AirSkyVisual grade={air?.grade} height={132} />
          <div className="px-4 py-3 flex items-center justify-between text-[12.5px]" style={{ borderTop: '1px solid rgba(0,0,0,.06)' }}>
            <span className="font-bold" style={{ color: 'var(--sd-muted)' }}>내일 예보</span>
            <span style={{ color: 'var(--sd-faint)' }}>{air?.tomorrow?.summary || (air?.tomorrow?.grade ? `${air.tomorrow.grade} 예상` : '준비 중')}</span>
          </div>
          {pushState !== 'unknown' && pushState !== 'unsupported' && (
            <div className="px-4 py-3 flex items-center justify-between text-[12.5px]" style={{ borderTop: '1px solid rgba(0,0,0,.06)' }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--sd-muted)' }}>
                {pushState === 'on' ? <Bell size={14} strokeWidth={2.5} style={{ color: 'var(--m-air-ac)' }} /> : <BellOff size={14} strokeWidth={2.5} style={{ color: 'var(--sd-faint)' }} />}
                <span className="font-bold">미세먼지 알림</span>
                <span className="text-[11px]" style={{ color: 'var(--sd-faint)' }}>매일 아침 7시</span>
              </div>
              {pushState === 'denied' ? (
                <span className="text-[11px] font-bold" style={{ color: 'var(--sd-faint)' }}>권한 차단됨</span>
              ) : (
                <button onClick={togglePush} role="switch" aria-checked={pushState === 'on'} aria-label="미세먼지 알림 토글"
                  className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
                  style={{ backgroundColor: pushState === 'on' ? 'var(--m-air-ac)' : '#CBD5E1' }}>
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: pushState === 'on' ? 'translateX(16px)' : 'translateX(0)' }} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    weather: (
      <motion.button
        animate={weatherShake}
        onClick={() => router.push('/weather')}
        className="sd-card w-full h-full min-h-[140px] px-4 py-4 flex flex-col text-left active:scale-[0.99] transition-transform relative"
        style={{ background: 'var(--sd-card-solid)' }}
        aria-label="날씨 상세 보기"
      >
        {(() => {
          const w = (weather as any)?.current as { temp: number | null; sky: string | null; pty: string | null; humidity: number | null } | undefined;
          const td = (weather as any)?.today as { high: number | null; low: number | null; precipProb: number | null } | undefined;
          const tm = (weather as any)?.tomorrow as { high: number | null; low: number | null; precipProb: number | null } | undefined;
          const skyText = (w?.pty === '1' || w?.pty === '2') ? '비' : w?.pty === '3' ? '눈'
            : w?.sky === '1' ? '맑음' : w?.sky === '3' ? '구름많음' : w?.sky === '4' ? '흐림' : '';
          const chip = 'text-[11.5px] rounded-full px-2.5 py-1 whitespace-nowrap';
          return (
            <div className="flex-1 flex flex-col" style={{ ['--m-ac' as string]: 'var(--m-weather-ac)', ['--m-tile' as string]: 'var(--m-weather-tile)' } as React.CSSProperties}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
                  <CloudSun size={16} /> 오늘 밖
                </span>
                <ChevronRight size={14} style={{ color: 'var(--sd-faint)' }} />
              </div>
              {w ? (
                <>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="flex items-end gap-2.5">
                      <p className="text-[38px] font-extrabold leading-none tabular-nums" style={{ color: 'var(--sd-ink)' }}>{w.temp ?? '—'}°</p>
                      <p className="text-[13.5px] font-bold pb-1" style={{ color: 'var(--sd-muted)' }}>{skyText}</p>
                    </div>
                    <SkyArt sky={w.sky} pty={w.pty} size={64} className="shrink-0 -my-1" />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {td?.high != null && <span className={chip} style={{ background: 'var(--m-tile)', color: 'var(--sd-ink)' }}>최고 <b>{td.high}°</b>{td.low != null ? <> · 최저 <b>{td.low}°</b></> : null}</span>}
                    {td?.precipProb != null && <span className={chip} style={{ background: 'var(--m-tile)', color: 'var(--sd-ink)' }}>비 <b>{td.precipProb}%</b></span>}
                    {w.humidity != null && <span className={chip} style={{ background: 'var(--m-tile)', color: 'var(--sd-ink)' }}>습도 <b>{w.humidity}%</b></span>}
                  </div>
                  {(tm?.high != null || tm?.precipProb != null) && (
                    <p className="mt-2.5 pt-2.5 text-[12.5px] font-semibold flex items-center gap-1.5 flex-wrap" style={{ borderTop: '1px solid rgba(0,0,0,.06)', color: 'var(--sd-muted)' }}>
                      <span style={{ color: 'var(--m-ac)' }}>내일</span>
                      {tm?.high != null && <span>↑{tm.high}° ↓{tm.low}°</span>}
                      {tm?.precipProb != null && <span>· 비 {tm.precipProb}%</span>}
                      {(tm?.precipProb ?? 0) >= 50 && <span className="rounded-full px-2 py-0.5 text-[11.5px] font-extrabold" style={{ background: 'var(--m-tile)', color: 'var(--m-ac)' }}>우산 챙겨!</span>}
                    </p>
                  )}
                </>
              ) : <p className="mt-2.5 text-[12.5px]" style={{ color: 'var(--sd-faint)' }}>불러오는 중…</p>}
            </div>
          );
        })()}
        <AnimatePresence>
          {showWeatherHint && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.2)] whitespace-nowrap z-10">
              💡 탭하면 시간대별 날씨가 나와!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    ),
    calendar: (
      <button
        onClick={() => router.push('/calendar')}
        aria-label="달력 보기"
        className="sd-card w-full h-full px-4 py-4 flex flex-col relative text-left transition-transform active:scale-[.98]"
        style={{ background: 'var(--m-calendar)' }}
      >
        <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
          <CalendarDays size={16} /> 달력
        </span>
        {nextEvent ? (
          <div className="mt-auto">
            <p className="text-[14px] font-semibold line-clamp-1" style={{ color: 'var(--sd-ink)' }}>{nextEvent.title}</p>
            <span className="text-[12.5px]" style={{ color: 'var(--sd-faint)' }}>{(() => { const p = nextEvent.date.split('-'); return `${+p[1]}월 ${+p[2]}일`; })()}</span>
          </div>
        ) : (
          <p className="mt-2.5 text-[12.5px]" style={{ color: 'var(--sd-faint)' }}>다가오는 일정이 없어요</p>
        )}
      </button>
    ),
    mood: (
      <div className="sd-card w-full h-full px-4 py-4 flex flex-col" style={{ background: 'var(--sd-card-solid)' }}>
        <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
          <Smile size={16} /> 오늘의 기분
        </span>
        {moodOpen ? (
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {MOOD_OPTIONS.map((opt) => (
              <button key={opt.id} onClick={() => pickMood(opt)} title={opt.label} aria-label={opt.label}
                className="aspect-square rounded-xl bg-black/[0.03] active:scale-90 transition-all flex items-center justify-center p-1">
                <Image src={opt.image} alt={opt.label} width={30} height={30} className="drop-shadow-sm" />
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-center gap-5">
            <div className="flex flex-col items-center gap-1">
              {renderMoodFace(moods[partner]?.emoji, 54)}
              <span className="text-[11px] font-bold" style={{ color: 'var(--sd-faint)' }}>{partner}</span>
            </div>
            <button onClick={() => setMoodOpen(true)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              {moods[userName]?.emoji ? renderMoodFace(moods[userName]?.emoji, 54) : (
                <span className="w-[54px] h-[54px] flex items-end justify-center gap-[6px] pb-3" aria-label="아직 기분을 안 골랐어요">
                  {[0, 1, 2].map((i) => (<span key={i} className="w-[7px] h-[7px] rounded-full" style={{ background: 'var(--sd-faint)', opacity: 0.55 }} />))}
                </span>
              )}
              <span className="text-[11px] font-bold" style={{ color: 'var(--sd-faint)' }}>{userName}</span>
            </button>
          </div>
        )}
      </div>
    ),
    dday: (
      <button
        onClick={() => router.push('/dday')}
        aria-label="우리 D-day 상세 보기"
        className="sd-card w-full h-full px-4 py-4 flex flex-col justify-center relative text-left transition-transform active:scale-[.98]"
        style={{ background: 'var(--sd-card-solid)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-rose-300">
            <Heart size={16} strokeWidth={2.5} fill="currentColor" />
            <span className="text-xs font-bold">함께한 지</span>
          </div>
          <ChevronRight size={14} className="text-slate-300" />
        </div>
        <p className="text-2xl font-extrabold text-slate-800 tracking-tight">D+{dDay}</p>
      </button>
    ),
    letter: (
      <button
        onClick={() => router.push(latestLetterId ? `/letters?open=${latestLetterId}` : '/letters')}
        aria-label="편지"
        className="sd-card w-full h-full px-4 py-4 flex flex-col relative text-left transition-transform active:scale-[.98]"
        style={{ background: 'var(--sd-card-solid)', ['--m-ac' as string]: 'var(--m-letter-ac)' } as React.CSSProperties}
      >
        <span className="sd-tape -top-[7px] left-6 w-[52px] h-[17px] rounded-[2px] rotate-[9deg]" />
        {hasLetter && <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
        <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
          <Mail size={16} /> 편지
        </span>
        {hasLetter ? (
          <p className="mt-auto text-[13.5px] font-semibold" style={{ color: 'var(--m-ac)' }}>💌 {partner}에게서 새 편지</p>
        ) : (
          <p className="mt-2.5 text-[12.5px]" style={{ color: 'var(--sd-faint)' }}>마음이 생기면 천천히</p>
        )}
      </button>
    ),
    memories: (
      <button
        onClick={() => router.push('/memories')}
        aria-label="추억"
        className="sd-card w-full h-full min-h-[140px] px-4 py-4 flex flex-col relative text-left transition-transform active:scale-[.98]"
        style={{ background: 'var(--m-memories)', ['--m-ac' as string]: 'var(--m-memories-ac)' } as React.CSSProperties}
      >
        <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
          <Camera size={16} /> 추억
        </span>
        {latestMemory ? (
          <div className="relative flex-1 min-h-[92px] mt-2 rounded-2xl overflow-hidden" style={{ background: 'var(--sd-card)' }}>
            <img src={latestMemory.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 px-3 pt-6 pb-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.55), transparent)' }}>
              <p className="text-[12.5px] font-bold text-white line-clamp-1">{latestMemory.title || '추억'}</p>
            </div>
            {memoryCount > 0 && (
              <span className="absolute top-2 right-2 text-[11px] font-extrabold px-2 py-0.5 rounded-full tabular-nums" style={{ background: 'rgba(255,255,255,.9)', color: 'var(--m-ac)' }}>
                {memoryCount > 99 ? '99+' : memoryCount}장
              </span>
            )}
          </div>
        ) : (
          <p className="mt-2.5 text-[12.5px]" style={{ color: 'var(--sd-faint)' }}>같이 찍은 사진을 모아요</p>
        )}
      </button>
    ),
    praise: (
      <button
        onClick={() => { localStorage.setItem(`praiseSeen:${kstDayKey(new Date())}`, String(praiseCount)); setPraiseSeen(praiseCount); router.push('/praise'); }}
        className="sd-card w-full h-full px-4 py-4 flex flex-col relative text-left transition-transform active:scale-[.98]"
        style={{ background: 'var(--m-praise)' }}
      >
        <div className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
          <Award size={16} strokeWidth={2.2} /> 칭찬
        </div>
        <div className="mt-auto pt-2">
          {praiseCount > 0 ? (
            <p className="text-[13.5px] font-bold line-clamp-1" style={{ color: 'var(--sd-ink)' }}>오늘 받은 칭찬</p>
          ) : (
            <p className="text-[12.5px] font-semibold leading-snug" style={{ color: 'var(--sd-faint)' }}>칭찬 다이어리</p>
          )}
          {praiseCount > 0 && (
            <p className="text-[12px] font-bold mt-0.5 tabular-nums" style={{ color: praiseUnread > 0 ? 'var(--m-praise-ac)' : 'var(--sd-faint)' }}>
              {praiseCount}개{praiseUnread > 0 ? ` · 새 ${praiseUnread}` : ''}
            </p>
          )}
        </div>
      </button>
    ),
    share: renderListCard({
      Icon: Link2, name: '공유 리스트', onClick: () => router.push('/share'),
      bg: 'var(--m-share)', ac: 'var(--m-share-ac)',
      recent: shareText, empty: `${vocativeOf(userName)} 이거 봐봐 💚`,
      count: shares.length, unit: '개',
      newText: (() => { const u = shares.filter((s) => !s.seenBy.includes(userName as '우댕' | '꼼이')).length; return u > 0 ? `새 ${u}` : undefined; })(),
    }),
    wishlist: renderListCard({
      Icon: Heart, name: '위시리스트', onClick: () => router.push('/wishlist'),
      bg: 'var(--m-wishlist)', ac: 'var(--m-wishlist-ac)',
      recent: wishText, empty: '먹고싶은 곳 · 가고싶은 곳',
      count: wishes.length, unit: '개',
    }),
    again: renderListCard({
      Icon: MapPin, name: '또 갈래', onClick: () => router.push('/again'),
      bg: 'var(--m-again)', ac: 'var(--m-again-ac)',
      recent: againText, empty: '또 가고 싶은 곳 · 단골',
      count: agains.length, unit: '개',
    }),
    recipes: renderListCard({
      Icon: ChefHat, name: '레시피', onClick: () => router.push('/recipes'),
      bg: 'var(--m-recipes)', ac: 'var(--m-recipes-ac)',
      recent: recipeText, empty: '같이 해먹은 걸 적어요',
      count: recipes.length, unit: '개',
      newText: newRecipe ? '새 글' : undefined,
    }),
    poems: renderListCard({
      Icon: BookText, name: '시집', onClick: () => router.push('/poems'),
      bg: 'var(--m-poems)', ac: 'var(--m-poems-ac)',
      recent: poemText, empty: '오늘 마음은 어떤 시',
      count: poems.length, unit: '편',
      newText: newPoemN > 0 ? `새 ${newPoemN}편` : undefined,
    }),
  };

  // 위치 토글은 미세먼지 카드 위(없으면 날씨 위)에 작게. 둘 다 꺼져 있으면 안 띄움.
  const locAnchorId = shownModules.some((m) => m.id === 'air') ? 'air'
    : shownModules.some((m) => m.id === 'weather') ? 'weather' : null;
  const locToggleEl = (
    <div key="__loc" className="col-span-2 flex justify-start -mb-2">
      <div className="inline-flex bg-white/70 backdrop-blur-md rounded-full p-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {(['home', 'work'] as const).map((k) => {
          const active = locKey === k;
          const loc = LOCATIONS[k];
          const Icon = k === 'home' ? Home : Building2;
          return (
            <button key={k} onClick={() => changeLoc(k)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                active ? 'bg-[#E4685E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={11} strokeWidth={2.5} />
              {loc.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="sd-app w-full max-w-md mx-auto min-h-screen text-slate-800 relative overflow-x-hidden pb-[calc(110px+env(safe-area-inset-bottom))] selection:bg-[#99E6D9]/40"
      onTouchStart={onHomeTouchStart} onTouchEnd={onHomeTouchEnd}>
      {/* 상단 등급색 그라데이션 — 전체를 하나의 흐름으로 */}
      {/* 사이담은 페이지 바탕이 .sd-app 그라디언트 하나뿐 — 여분 상단 wash 제거(더 진해 보이던 원인) */}

      {/* 1. Header */}
      <header className="relative z-10 px-6 pt-12 pb-4 flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1 opacity-80">{dateText}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">안녕, {userName} 👋</h1>
          {/* 상대 접속 시각 — presenceTick으로 매 1분 재계산 */}
          <p className="text-xs font-bold text-slate-500 mt-1.5">
            <span className="text-[#E4685E]">{partner}</span>
            <span className="text-slate-400"> · </span>
            <span suppressHydrationWarning>{formatPresenceRelative(partnerPresence)}</span>
            {/* presenceTick 참조로 매분 리렌더 */}
            <span className="hidden">{presenceTick}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 공유 캘린더 진입 (새로고침 왼쪽) */}
          <button
            onClick={() => { setChatOpen(true); setChatUnread(false); }}
            className="relative p-2 bg-white/50 backdrop-blur-md rounded-full text-[#FB7BA8] hover:text-[#e0568f] transition-colors"
            aria-label="대화"
          >
            <MessageCircle size={20} />
            {chatUnread && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />}
          </button>
          <button
            onClick={() => router.push('/calendar')}
            className="p-2 bg-white/50 backdrop-blur-md rounded-full text-purple-500 hover:text-purple-600 transition-colors"
            aria-label="공유 캘린더"
          >
            <CalendarDays size={20} />
          </button>
          <button
            onClick={() => loadData(true)}
            className="p-2 bg-white/50 backdrop-blur-md rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="새로고침"
          >
            <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>


      {/* Share List 알림 바 — 미확인 카드 있을 때만 (홈 only) */}
      {(() => {
        const unseen = shares.filter((s) => !s.seenBy.includes(userName as '우댕' | '꼼이')).length;
        if (unseen <= 0) return null;
        return (
          <button
            onClick={() => router.push('/share')}
            className="relative z-10 mx-6 mt-2 w-[calc(100%-3rem)] bg-[#FCD34D]/95 hover:bg-[#FCD34D] text-yellow-900 rounded-full px-4 py-2.5 flex items-center justify-between gap-2 shadow-[0_4px_16px_rgba(252,211,77,0.35)] active:scale-[0.98] transition-all"
          >
            <span className="flex items-center gap-1.5 text-[13px] font-bold">
              <Sparkles size={14} fill="currentColor" /> 새로운 Share List {unseen}개 있어요
            </span>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        );
      })()}

      {/* 위치 토글(호평동/중구)은 미세먼지 카드 바로 위로 이동 — 아래 그리드 안에서 렌더 */}

      {/* 3. 대시보드 본문 — 사이담식 모듈 그리드 (순서·크기·표시 = settings/home, 둘이 같은 배치) */}
      <main className="relative z-10 px-5 flex flex-col gap-4">
        {editing ? (
          /* ── 편집 모드: 끌어서 순서 · 칩으로 크기 · 스위치로 표시 ── */
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1 pb-0.5">
              <p className="text-[12.5px] font-semibold" style={{ color: 'var(--sd-muted)' }}>끌어서 순서 · 칩으로 크기 · 스위치로 표시</p>
              <button onClick={finishEditing} disabled={savingLayout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-bold text-white active:scale-95 transition-transform"
                style={{ background: 'var(--sd-ink-btn)' }}>
                {savingLayout ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2.5} />}
                완료
              </button>
            </div>
            <Reorder.Group axis="y" values={draftOrder} onReorder={setDraftOrder} className="flex flex-col gap-2.5">
              {draftOrder.map((m) => (
                <EditRow key={m.id} module={m}
                  size={draftSizes[m.id] ?? DEFAULT_SIZE[m.id] ?? '1x1'}
                  enabled={draftEnabled.has(m.id)}
                  onCycleSize={() => cycleDraftSize(m.id)}
                  onToggle={() => toggleDraftEnabled(m.id)} />
              ))}
            </Reorder.Group>
          </div>
        ) : (
          <>
            {/* 오늘의 조각 — 헤더 바로 아래(옛 위치토글 자리). 오늘 새로 생긴 것부터 */}
            {(userName === '우댕' || userName === '꼼이') && (
              <TodayDigest me={userName as '우댕' | '꼼이'} />
            )}
            <div className="grid grid-cols-2 gap-4 auto-rows-min">
              {shownModules.flatMap((m) => {
                const cell = (
                  <div key={m.id} className={SIZE_CLASS[sizes[m.id] ?? DEFAULT_SIZE[m.id] ?? '1x1']}>
                    {moduleNodes[m.id]}
                  </div>
                );
                // 위치 토글(호평동/중구)을 미세먼지(없으면 날씨) 카드 바로 위에 작게 띄운다
                if (m.id === locAnchorId) return [locToggleEl, cell];
                return [cell];
              })}
            </div>
            {/* 카드 배치 바꾸기 — 사이담과 동일 위치(그리드 하단) */}
            <button onClick={() => setEditing(true)}
              className="mt-1 inline-flex items-center justify-center gap-2 self-center px-4 py-2.5 rounded-full text-[13px] font-bold active:scale-95 transition-transform"
              style={{ background: 'var(--sd-surface-2)', color: 'var(--sd-muted)' }}>
              <LayoutGrid size={15} strokeWidth={2.3} /> 카드 배치 바꾸기
            </button>
          </>
        )}

        {!editing && (<>
        {/* 댕's 서재 — 외부 영어 원서 읽기 사이트(새 탭). 시집 아래, 옛 서재 자리 */}
        <a
          href="https://dang-s-library.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full bg-emerald-50/60 rounded-2xl p-4 shadow-[2px_3px_0px_rgba(0,0,0,0.05)] border border-emerald-100/60 flex items-center gap-4 text-left active:scale-[0.98] transition-all"
        >
          <div className="tape absolute -top-2 right-6 w-14 -rotate-3 z-10" />
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
            <Library size={22} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
              <span className="text-xs font-bold tracking-wider uppercase">Dang&apos;s Library</span>
            </div>
            <p className="text-sm font-bold text-emerald-900">댕's 서재 · 영어 원서 읽기</p>
          </div>
          <ExternalLink size={18} className="text-emerald-400 shrink-0" />
        </a>

        {/* 우리들의 서재 — memory project-novel-hidden.md 참고. 코드 유지, 카드만 숨김 */}
        {false && (<button onClick={() => router.push('/novel')} className="relative w-full flex items-center justify-between p-6 rounded-2xl bg-slate-800 text-white shadow-[2px_3px_0px_rgba(0,0,0,0.12)] border border-slate-700 active:scale-[0.98] transition-transform text-left -rotate-[0.5deg]">
          <div className="tape absolute -top-2 left-8 w-12 rotate-3 z-10" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl"><BookOpen size={22} className="text-[#99E6D9]" strokeWidth={2} /></div>
            <div>
              <p className="text-[11px] font-bold text-[#99E6D9] mb-1 tracking-wider uppercase">Relay Novel</p>
              <p className="text-[16px] font-bold">우리들의 서재</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-400" />
        </button>)}

        {/* 로그아웃 — 페이지 맨 아래 우측에 작고 옅게 (실수로 꼼이 계정 들어갔을 때만 쓰는 안전망) */}
        <div className="flex justify-end pt-2 pb-1">
          <button
            onClick={() => {
              if (!confirm(`현재 ${userName} 계정으로 로그인됨. 로그아웃할까?`)) return;
              try { localStorage.removeItem('kkom-user'); } catch {}
              router.push('/login');
            }}
            className="text-[10px] font-bold text-slate-300 hover:text-slate-500 active:text-slate-600 transition-colors px-2 py-1"
            aria-label="로그아웃"
          >
            {userName} 로그아웃
          </button>
        </div>
        </>)}
      </main>

      {/* 라이브 하트 — 둘 다 접속 중일 때만 중앙 큰 하트 + 양방향 폭탄 */}
      {(userName === '우댕' || userName === '꼼이') && (
        // isTogetherNow = active + 최근 90초 (serverNow 시계보정). 접속 뱃지와 동일 판정으로 통일
        // — 이전엔 여기만 Date.now()라 기기 시계 어긋나면 왕하트가 안 떴음.
        <LiveHeartLayer me={userName} partnerActive={isTogetherNow(partnerPresence)} onOpenChat={() => { setChatOpen(true); setChatUnread(false); }} />
      )}

      {/* 하단 고정 퀵메세지 바 — 한 탭 푸시 (보고싶어/사랑해/뽀뽀/잘 자) */}
      <QuickReplyBar me={userName} partner={partner} />

      {/* 실시간 대화창 — 둘 다 접속하면 자동으로 뜸. 기록은 Firestore에 쌓임 */}
      {(userName === '우댕' || userName === '꼼이') && (
        <ChatPanel
          me={userName}
          partner={partner}
          messages={messages}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          onSend={(text, imageUrl, sticker, replyTo, audio, video) => sendMessage(userName, text, isTogetherNow(partnerPresence), imageUrl, sticker, replyTo, audio, video)}
          partnerOnline={isTogetherNow(partnerPresence)}
          onLoadMore={() => setMsgLimit((l) => l + 40)}
          hasMore={messages.length >= msgLimit}
          onSendCapsule={(text, deliverAt) => sendCapsule(userName, text, deliverAt)}
        />
      )}
    </div>
  );
}
