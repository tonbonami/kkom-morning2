'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Wind, Heart, PenLine, BookOpen, ChefHat, BookText,
  RefreshCcw, ChevronRight, Shirt, Smile, Camera, Sparkles, Home, Building2, CheckCircle2, Award, CalendarDays,
  Library, ExternalLink, Link2, MapPin, CloudSun,
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

export default function KkomMorningHome() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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
  const [wishes, setWishes] = useState<{ id: string; createdAt: Date }[]>([]);
  const [agains, setAgains] = useState<{ id: string; createdAt: Date }[]>([]);
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
      setWishes(items.filter((i) => !i.done).map((i) => ({ id: i.id, createdAt: i.createdAt })));
    });
    // 또갈래 — 카드 배지용
    const unsubAgains = subscribeAgain((items) => {
      setAgains(items.map((i) => ({ id: i.id, createdAt: i.createdAt })));
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

      {/* 우리 낙서장 — 홈 최상단 히어로 (실시간 대화 채널). 상대 접속·끄적임 연동. 디자인: Gemini */}
      <div className="relative z-10 px-6 pt-1 pb-2">
        {(() => {
          // 헤더 서브라인과 동일 기준(active+90초 이내)이라야 '지금 함께'가 서로 안 어긋남.
          // 상대가 네이티브 캔버스에서 필기 중이면(웹 presence는 stale해도) 무조건 온라인.
          const online = partnerDrawing || isTogetherNow(partnerPresence);
          const openDoodle = async () => {
            // 네이티브(Capacitor)면 끊김 없는 네이티브 캔버스, 웹이면 기존 /canvas
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
          return (
            <button
              onClick={openDoodle}
              className="sd-card relative w-full min-h-[150px] px-4 py-4 flex flex-col text-left active:scale-[.98] transition-transform"
              style={{ background: online ? 'var(--m-doodle)' : 'var(--m-doodle)' }}
              aria-label="우리 낙서장 열기"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
                  <PenLine size={16} /> 낙서장
                </span>
                <span className="font-handwriting text-[26px] leading-none shrink-0" style={{ color: 'var(--sd-muted)' }}>
                  우리 낙서장 ✏️
                </span>
              </div>
              {/* 캔버스 프리뷰 (도트그리드 종이) — 사이담과 동일 */}
              <div className="relative flex-1 min-h-[100px] rounded-2xl overflow-hidden"
                   style={{ background: '#FFFCF5', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.05)' }}>
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(rgba(200,190,185,.55) 1.4px, transparent 1.4px)',
                  backgroundSize: '22px 22px',
                }} />
                <DoodleThumb strokes={heroStrokes} />
                <span className="absolute bottom-2 right-2 h-9 px-3.5 rounded-[18px] inline-flex items-center shadow-[0_4px_12px_rgba(0,0,0,.12)]"
                      style={{ background: 'var(--m-doodle-ac)' }}>
                  <span className="font-handwriting text-[22px] leading-none text-white">종이 펼치기</span>
                </span>
              </div>
            </button>
          );
        })()}
      </div>

      {/* 꼼톡 미리보기 — 사이담식: 안읽음 '숫자'가 아니라 '최근에 쓴 말'을 보여준다. 탭하면 꼼톡 열림. */}
      {messages.length > 0 && (
        <div className="relative z-10 px-6 pt-1 pb-2">
          <button
            onClick={() => { setChatOpen(true); setChatUnread(false); }}
            className="sd-card relative w-full min-h-[140px] px-4 py-4 flex flex-col text-left active:scale-[.98] transition-transform"
            style={{ background: 'var(--sd-card-solid)' }}
            aria-label="꼼톡 열기"
          >
            {/* 주황 워시테이프 — 사이담 사이챗과 동일 */}
            <span className="sd-tape -top-[7px] left-7 w-[52px] h-[17px] rounded-[2px] -rotate-[7deg]" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
                <MessageCircle size={16} /> 꼼톡
                {chatUnread && <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
              </span>
              <ChevronRight size={14} style={{ color: 'var(--sd-faint)' }} />
            </div>
            {(() => {
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
                        <span
                          className="max-w-[82%] rounded-2xl px-3 py-1.5 text-[12.5px] font-semibold leading-snug line-clamp-2"
                          style={mine
                            ? { background: 'var(--sd-ink-btn)', color: 'var(--sd-card-solid)' }
                            : { background: 'var(--sd-rel-soft)', color: 'var(--sd-ink)' }}
                        >
                          {preview(m)}
                        </span>
                      </div>
                    );
                  })}
                  {rel && <p suppressHydrationWarning className="text-[12.5px] mt-0.5" style={{ color: 'var(--sd-faint)' }}>{rel}</p>}
                </div>
              );
            })()}
          </button>
        </div>
      )}

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

      {/* 위치 토글 — 화면 표시 위치 (알림 정책과 별개) */}
      <div className="relative z-10 px-6 pt-2 pb-1">
        <div className="inline-flex bg-white/70 backdrop-blur-md rounded-full p-1 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {(['home', 'work'] as const).map((k) => {
            const active = locKey === k;
            const loc = LOCATIONS[k];
            const Icon = k === 'home' ? Home : Building2;
            return (
              <button
                key={k}
                onClick={() => changeLoc(k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                  active ? 'bg-[#E4685E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={12} strokeWidth={2.5} />
                {loc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 포차코 + 미세먼지 (카드 아닌 공간으로 존재) */}
      <section className="relative z-10 px-6 pt-2 pb-8">
        {/* 배경에 블렌딩되는 포차코 */}
        <div className="absolute right-2 -top-12 w-32 h-32 z-0 rounded-[36px] overflow-hidden drop-shadow-[0_16px_28px_rgba(16,185,129,0.3)]">
          <Image src={getPochacco()} alt="포차코" fill className="object-cover" priority />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="pt-10">
            <div className="flex items-center gap-1.5 mb-2 opacity-80">
              <Wind size={16} className={theme.text} strokeWidth={2.5} />
              <span className="text-sm font-bold text-slate-600">{air?.location || '금곡동'} 미세먼지</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className={`text-5xl font-extrabold tracking-tight ${theme.text}`}>
                {hasGrade ? air.grade : '불러오는 중'}
              </h2>
              <span className="text-sm font-medium text-slate-500">
                PM10 <strong className="text-slate-700">{air?.pm10 ?? '--'}</strong> · PM2.5 <strong className="text-slate-700">{air?.pm25 ?? '--'}</strong>
              </span>
            </div>
          </div>

          {/* SVG 하늘 — 등급별 비주얼 (맑은하늘/뿌연하늘/먼지) + 내일 예보 + 알림 토글 */}
          <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.03)] border border-white/40">
            <AirSkyVisual grade={air?.grade} height={170} />
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">내일 예보</span>
              <span className="text-slate-500">{air?.tomorrow?.summary || (air?.tomorrow?.grade ? `${air.tomorrow.grade} 예상` : '준비 중')}</span>
            </div>
            {/* 미세먼지 알림 토글 — 폰 푸시 (매일 아침 7시, 나쁨 이상이면 알림) */}
            {pushState !== 'unknown' && pushState !== 'unsupported' && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  {pushState === 'on'
                    ? <Bell size={14} strokeWidth={2.5} className="text-[#10B981]" />
                    : <BellOff size={14} strokeWidth={2.5} className="text-slate-400" />}
                  <span className="font-semibold">미세먼지 알림</span>
                  <span className="text-[11px] font-medium text-slate-400">매일 아침 7시</span>
                </div>
                {pushState === 'denied' ? (
                  <span className="text-[11px] font-bold text-slate-400">권한 차단됨</span>
                ) : (
                  <button
                    onClick={togglePush}
                    role="switch"
                    aria-checked={pushState === 'on'}
                    aria-label="미세먼지 알림 토글"
                    className="relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0"
                    style={{ backgroundColor: pushState === 'on' ? '#10B981' : '#CBD5E1' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                      style={{ transform: pushState === 'on' ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. 대시보드 본문 — 하나의 일관된 그리드 */}
      <main className="relative z-10 px-5 flex flex-col gap-4">
        {/* 오늘의 조각 — 오늘 새로 생긴 콘텐츠를 놓치지 않는 2열 업데이트 보드 (GPT 스펙, 수정0) */}
        {(userName === '우댕' || userName === '꼼이') && (
          <TodayDigest me={userName as '우댕' | '꼼이'} />
        )}

        {/* 날씨 V2 — 탭하면 상세 페이지. 첫 진입 시 살짝 흔들리고 토스트로 알려줌 */}
        <motion.button
          animate={weatherShake}
          onClick={() => router.push('/weather')}
          className="sd-card w-full min-h-[140px] px-4 py-4 flex flex-col text-left active:scale-[0.99] transition-transform relative"
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
          {/* Onboarding 토스트 — 첫 진입 한 번만 */}
          <AnimatePresence>
            {showWeatherHint && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.2)] whitespace-nowrap z-10"
              >
                💡 탭하면 시간대별 날씨가 나와!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* 달력 — 사이담 calendar 카드. (옷차림/착장 추천은 사용자 요청으로 제거) */}
        <button
          onClick={() => router.push('/calendar')}
          aria-label="달력 보기"
          className="sd-card w-full min-h-[104px] px-4 py-4 flex flex-col relative text-left transition-transform active:scale-[.98]"
          style={{ background: 'var(--m-calendar)' }}
        >
          <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
            <CalendarDays size={16} /> 달력
          </span>
          {nextEvent ? (
            <div className="mt-auto">
              <p className="text-[14px] font-semibold line-clamp-1" style={{ color: 'var(--sd-ink)' }}>{nextEvent.title}</p>
              <span className="text-[12.5px]" style={{ color: 'var(--sd-faint)' }}>
                {(() => { const p = nextEvent.date.split('-'); return `${+p[1]}월 ${+p[2]}일`; })()}
              </span>
            </div>
          ) : (
            <p className="mt-2.5 text-[12.5px]" style={{ color: 'var(--sd-faint)' }}>다가오는 일정이 없어요</p>
          )}
        </button>

        {/* 기분 · D-day — 사이담식 1x1 나란히. 틀만 교체, pickMood·renderMoodFace·moods·dDay 그대로 */}
        <div className="grid grid-cols-2 gap-4 auto-rows-min">
          {/* 오늘의 기분 (1x1 흰 카드) */}
          <div className="sd-card col-span-1 min-h-[104px] px-4 py-4 flex flex-col" style={{ background: 'var(--sd-card-solid)' }}>
            <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
              <Smile size={16} /> 오늘의 기분
            </span>
            {moodOpen ? (
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => pickMood(opt)}
                    title={opt.label}
                    aria-label={opt.label}
                    className="aspect-square rounded-xl bg-black/[0.03] active:scale-90 transition-all flex items-center justify-center p-1"
                  >
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
                  {moods[userName]?.emoji ? (
                    renderMoodFace(moods[userName]?.emoji, 54)
                  ) : (
                    <span className="w-[54px] h-[54px] flex items-end justify-center gap-[6px] pb-3" aria-label="아직 기분을 안 골랐어요">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-[7px] h-[7px] rounded-full" style={{ background: 'var(--sd-faint)', opacity: 0.55 }} />
                      ))}
                    </span>
                  )}
                  <span className="text-[11px] font-bold" style={{ color: 'var(--sd-faint)' }}>{userName}</span>
                </button>
              </div>
            )}
          </div>

          {/* D-day (1x1 흰 카드) */}
          <button
            onClick={() => router.push('/dday')}
            aria-label="우리 D-day 상세 보기"
            className="sd-card col-span-1 min-h-[104px] px-4 py-4 flex flex-col justify-center relative text-left transition-transform active:scale-[.98]"
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
        </div>

        {/* 오늘의 편지 — 다이어리 핑크 메모지 톤 (Gemini 리뷰 P0) */}
        <div className="relative bg-[#FBEBF6] rounded-2xl p-6 shadow-[2px_3px_0px_rgba(0,0,0,0.04)] border border-[#F1E0EE] overflow-hidden">
          <div className="tape-mint absolute -top-2 left-8 w-14 rotate-2 z-10" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-[#10B981]">
                <div className="p-1.5 bg-[#EAF8F5] rounded-xl"><PenLine size={16} strokeWidth={2.5} /></div>
                <span className="text-sm font-bold">{partner}에게서 온 편지</span>
              </div>
              {latestLetterAt && (
                <span className="text-[11px] font-medium text-slate-400 ml-10" suppressHydrationWarning>
                  {(() => {
                    // KST 고정 표시 (디바이스 타임존 무관) — lib/kst.ts
                    const d = latestLetterAt;
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
                    const time = formatKstTime(d);
                    if (diffDays === 0) return `오늘 ${time} 도착`;
                    if (diffDays === 1) return `어제 ${time} 도착`;
                    if (diffDays < 7) return `${diffDays}일 전 ${time} 도착`;
                    return `${formatKstMonthDay(d)} ${time} 도착`;
                  })()}
                </span>
              )}
            </div>
            <button onClick={() => router.push('/letters')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full transition-colors">지난 편지</button>
          </div>
          {hasLetter ? (
            <button
              type="button"
              onClick={() => latestLetterId && router.push(`/letters?open=${latestLetterId}`)}
              className="block w-full text-left mb-5 px-1 space-y-3 active:scale-[0.99] transition-transform"
              aria-label="편지 자세히 보기"
            >
              {dailyMessage.trim() && (
                <p className="text-[15px] font-medium text-slate-700 leading-relaxed tracking-tight whitespace-pre-wrap">&ldquo;{dailyMessage}&rdquo;</p>
              )}
              {latestVoice && (() => {
                const isUrl = /^https?:\/\//i.test(latestVoice.data);
                const src = isUrl ? latestVoice.data : `data:${latestVoice.mime};base64,${latestVoice.data}`;
                return (
                  <VoicePlayer
                    src={src}
                    mime={latestVoice.mime}
                    durationHint={latestVoice.duration}
                    accent="emerald"
                    compact
                  />
                );
              })()}
              {/* 손글씨/이모티콘 미리보기 — 사용자 신고: 미리보기에 안 보여 포함 여부 몰랐음 */}
              {(latestLetterHasDoodle || latestLetterEmoticonIds.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {latestLetterHasDoodle && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-500 bg-white/70 px-2.5 py-1 rounded-full">
                      ✏️ 손글씨 포함
                    </span>
                  )}
                  {latestLetterEmoticonIds.length > 0 && (() => {
                    const items = getEmoticonsByIds(latestLetterEmoticonIds).slice(0, 3);
                    return items.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {items.map((it, i) => (
                          <img
                            key={`${it.id}-${i}`}
                            src={it.imageUrl}
                            alt={it.label}
                            className="w-9 h-9 object-contain drop-shadow-sm"
                          />
                        ))}
                        {latestLetterEmoticonIds.length > 3 && (
                          <span className="text-[11px] font-black text-slate-400 ml-0.5">
                            +{latestLetterEmoticonIds.length - 3}
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </button>
          ) : (
            <p className="text-center text-[14px] text-slate-400 py-3 mb-2">아직 도착한 편지가 없어요 💌</p>
          )}
          <button onClick={() => router.push('/letter/new')} className="w-full py-3.5 bg-[#F7F9F9] hover:bg-[#EAF8F5] text-[#10B981] rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
            <PenLine size={15} /> 편지 쓰기
          </button>
        </div>

        {/* 우리의 추억 — 폴라로이드 톤 (Gemini 리뷰 P0) */}
        {latestMemory && (
          <button
            onClick={() => router.push('/memories')}
            className="relative w-full bg-white rounded-2xl p-4 shadow-[2px_3px_0px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-4 text-left active:scale-[0.98] transition-all"
          >
            <div className="tape absolute -top-2 right-6 w-12 -rotate-6 z-10" />
            {/* 배지가 overflow-hidden에 잘리지 않게 relative wrapper로 빼냄 */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
                <img src={latestMemory.imageUrl} alt={latestMemory.title} className="w-full h-full object-cover" />
              </div>
              {memoryCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-slate-800 text-white text-[11px] font-black flex items-center justify-center shadow-md ring-2 ring-white z-10">
                  {memoryCount > 99 ? '99+' : memoryCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Camera size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold">우리의 추억</span>
              </div>
              <p className="text-sm font-bold text-slate-700 truncate">{latestMemory.title || '소중한 순간'}</p>
              <p className="text-[11px] text-slate-400">모두 보기</p>
            </div>
            <ChevronRight size={20} className="text-slate-400 shrink-0" />
          </button>
        )}

        {/* keep 카드 — 사이담식 2열 모듈 그리드. 틀만 교체, onClick·데이터·뱃지 전부 그대로 */}
        <div className="grid grid-cols-2 gap-4 auto-rows-min">
          {/* 칭찬 */}
          <button
            onClick={() => {
              localStorage.setItem(`praiseSeen:${kstDayKey(new Date())}`, String(praiseCount));
              setPraiseSeen(praiseCount);
              router.push('/praise');
            }}
            className="sd-card col-span-1 row-span-1 min-h-[104px] px-4 py-4 flex flex-col justify-between relative text-left transition-transform active:scale-[.98]"
            style={{ background: 'var(--m-praise)' }}
          >
            {praiseCount - praiseSeen > 0 && (
              <span className="absolute top-2.5 right-2.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--m-praise-ac)] text-white text-[10.5px] font-black flex items-center justify-center">
                {praiseCount - praiseSeen > 99 ? '99+' : praiseCount - praiseSeen}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
              <Award size={16} strokeWidth={2.2} /> 칭찬
            </div>
            <p className="text-[12.5px] font-semibold text-[var(--sd-faint)] leading-snug">칭찬 다이어리</p>
          </button>
          {/* 공유 리스트 */}
          <button
            onClick={() => router.push('/share')}
            className="sd-card col-span-1 row-span-1 min-h-[104px] px-4 py-4 flex flex-col justify-between relative text-left transition-transform active:scale-[.98]"
            style={{ background: 'var(--m-share)' }}
          >
            {shares.length > 0 && (
              <span className="absolute top-2.5 right-2.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--m-share-ac)] text-white text-[10.5px] font-black flex items-center justify-center">
                {shares.length > 99 ? '99+' : shares.length}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
              <Link2 size={16} strokeWidth={2.2} /> 공유 리스트
            </div>
            <p className="text-[12.5px] font-semibold text-[var(--sd-faint)] leading-snug break-keep">{`${vocativeOf(userName)} 이거 봐봐 💚`}</p>
          </button>

          {/* 위시리스트 */}
          <button
            onClick={() => router.push('/wishlist')}
            className="sd-card col-span-1 row-span-1 min-h-[104px] px-4 py-4 flex flex-col justify-between relative text-left transition-transform active:scale-[.98]"
            style={{ background: 'var(--m-wishlist)' }}
          >
            {wishes.length > 0 && (
              <span className="absolute top-2.5 right-2.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--m-wishlist-ac)] text-white text-[10.5px] font-black flex items-center justify-center">
                {wishes.length > 99 ? '99+' : wishes.length}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
              <Heart size={16} strokeWidth={2.2} /> 위시리스트
            </div>
            <p className="text-[12.5px] font-semibold text-[var(--sd-faint)] leading-snug break-keep">먹고싶은 곳 · 가고싶은 곳</p>
          </button>
          {/* 또 갈래 */}
          <button
            onClick={() => router.push('/again')}
            className="sd-card col-span-1 row-span-1 min-h-[104px] px-4 py-4 flex flex-col justify-between relative text-left transition-transform active:scale-[.98]"
            style={{ background: 'var(--m-again)' }}
          >
            {agains.length > 0 && (
              <span className="absolute top-2.5 right-2.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--m-again-ac)] text-white text-[10.5px] font-black flex items-center justify-center">
                {agains.length > 99 ? '99+' : agains.length}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
              <MapPin size={16} strokeWidth={2.2} /> 또 갈래
            </div>
            <p className="text-[12.5px] font-semibold text-[var(--sd-faint)] leading-snug break-keep">또 가고 싶은 곳 · 단골</p>
          </button>

          {/* 레시피 */}
          <button
            onClick={() => router.push('/recipes')}
            className="sd-card col-span-1 row-span-1 min-h-[104px] px-4 py-4 flex flex-col justify-between relative text-left transition-transform active:scale-[.98]"
            style={{ background: 'var(--m-recipes)' }}
          >
            {recipes.length > 0 && (
              <span className="absolute top-2.5 right-2.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--m-recipes-ac)] text-white text-[10.5px] font-black flex items-center justify-center">
                {recipes.length > 99 ? '99+' : recipes.length}
              </span>
            )}
            {(() => {
              const now = Date.now();
              const DAY = 24 * 60 * 60 * 1000;
              const hasNew = recipes.some((r) => r.by !== userName && (now - r.createdAt.getTime() < DAY));
              return hasNew ? (
                <span className="absolute top-2 left-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              ) : null;
            })()}
            <div className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
              <ChefHat size={16} strokeWidth={2.2} /> 레시피
            </div>
            <p className="text-[12.5px] font-semibold text-[var(--sd-faint)] leading-snug break-keep">같이 해먹은 걸 적어요</p>
          </button>
          {/* 시집 */}
          <button
            onClick={() => router.push('/poems')}
            className="sd-card col-span-1 row-span-1 min-h-[104px] px-4 py-4 flex flex-col justify-between relative text-left transition-transform active:scale-[.98]"
            style={{ background: 'var(--m-poems)' }}
          >
            {poems.length > 0 && (
              <span className="absolute top-2.5 right-2.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--m-poems-ac)] text-white text-[10.5px] font-black flex items-center justify-center">
                {poems.length > 99 ? '99+' : poems.length}
              </span>
            )}
            {(() => {
              const n = countNewPoems(poems, poemsLastSeen);
              return n > 0 ? (
                <span className="absolute top-2 left-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              ) : null;
            })()}
            <div className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--sd-cardlabel)' }}>
              <BookText size={16} strokeWidth={2.2} /> 시집
            </div>
            {(() => {
              const n = countNewPoems(poems, poemsLastSeen);
              return (
                <p className="text-[12.5px] font-semibold leading-snug break-keep" style={{ color: n > 0 ? 'var(--sd-rel)' : 'var(--sd-faint)' }}>
                  {n > 0 ? `✨ 새 시 ${n}편` : '오늘 마음은 어떤 시'}
                </p>
              );
            })()}
          </button>
        </div>

        {/* 우리 낙서장 카드는 홈 최상단 히어로로 이동 (헤더 바로 아래) */}

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
