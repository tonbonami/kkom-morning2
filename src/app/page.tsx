'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Wind, Heart, PenLine, BookOpen,
  RefreshCcw, ChevronRight, Shirt, Smile, Camera, Sparkles, Home, Building2, CheckCircle2,
} from 'lucide-react';

// 화면에서 보는 위치 (알림 cron과 별개로 사용자가 선택)
const LOCATIONS = {
  home: { label: '호평동', station: '금곡동', region: '경기북부', nx: 64, ny: 128 },
  work: { label: '서울 중구', station: '중구', region: '서울', nx: 60, ny: 127 },
} as const;
type LocKey = keyof typeof LOCATIONS;
import TodayTomorrowWeather from '@/components/TodayTomorrowWeather';
import { getInitialData } from '@/lib/api';
import { subscribeLatestLetterTo, nameFromCode, partnerOf, vocativeOf, type Voice } from '@/lib/letters';
import { subscribeMemories, type Memory } from '@/lib/memories';
import { subscribeShareList, type ShareItemView } from '@/lib/share';
import VoicePlayer from '@/components/VoicePlayer';
import { subscribeTodayMoods, setMyMood, moodFromKey, MOOD_OPTIONS, type MoodMap, type MoodOption } from '@/lib/moods';
import { touchPresence, subscribePresence, formatPresenceRelative, type Presence } from '@/lib/presence';
import { getPushState, enablePush, disablePush, type PushState } from '@/lib/push';
import AirSkyVisual from '@/components/AirSkyVisual';
import { Bell, BellOff } from 'lucide-react';
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

export default function KkomMorningHome() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [air, setAir] = useState<any>(null);
  const [outfit, setOutfit] = useState<OutfitGuide | null>(null);
  const [dailyMessage, setDailyMessage] = useState<string>('');
  const [latestVoice, setLatestVoice] = useState<Voice | null>(null);
  const [latestLetterAt, setLatestLetterAt] = useState<Date | null>(null);
  const [hasLetter, setHasLetter] = useState(false);
  const [moods, setMoods] = useState<MoodMap>({});
  const [memories, setMemories] = useState<Memory[]>([]);
  const [moodOpen, setMoodOpen] = useState(false);
  const [userName, setUserName] = useState('꼼이');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dDay, setDDay] = useState(0);
  const [dateText, setDateText] = useState('');
  const [partnerPresence, setPartnerPresence] = useState<Presence>({ lastSeenAt: null, active: false });
  const [presenceTick, setPresenceTick] = useState(0); // 매분 재계산용
  const [pushState, setPushState] = useState<PushState>('unknown');
  const [locKey, setLocKey] = useState<LocKey>('home'); // 화면 위치 선택
  const [shares, setShares] = useState<ShareItemView[]>([]);

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
    });
    const unsubMoods = subscribeTodayMoods(setMoods);
    const unsubMemories = subscribeMemories(setMemories);
    const unsubShares = subscribeShareList(setShares);

    const start = new Date('2023-09-28');
    const today = new Date();
    start.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
    setDDay(Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
    setDateText(new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }));

    // 저장된 위치 선택 복구
    const savedLoc = localStorage.getItem('kkom-loc');
    if (savedLoc === 'home' || savedLoc === 'work') setLocKey(savedLoc);

    return () => { unsubLetter(); unsubMoods(); unsubMemories(); unsubShares(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // 접속 — 내 presence (active/inactive 명시) + 상대 구독
  useEffect(() => {
    if (!userName) return;
    const partner = partnerOf(userName);
    // 마운트 시 active=true
    touchPresence(userName, true);
    // 1분마다 heartbeat (단, 페이지가 visible일 때만 active=true)
    // 더 자주 → background 가면 빠르게 stale로 빠짐 → '지금 함께' 오탐 줄음
    const heartbeat = setInterval(() => {
      const visible = document.visibilityState === 'visible';
      touchPresence(userName, visible);
    }, 60 * 1000);
    // 페이지 visible/hidden 전환마다 명시적으로 표시
    const onVis = () => {
      touchPresence(userName, document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVis);
    // 페이지/탭 닫을 때 inactive 표시 — 모바일에선 신뢰성 낮지만 데스크탑에선 유효
    const onUnload = () => { touchPresence(userName, false); };
    window.addEventListener('pagehide', onUnload);
    const unsub = subscribePresence(partner, setPartnerPresence);
    // "N분 전" 표시 매 1분마다 재계산
    const tick = setInterval(() => setPresenceTick((x) => x + 1), 60_000);
    // 푸시 구독 상태 1회 확인
    getPushState(userName).then(setPushState);
    return () => {
      // 언마운트 시도 active=false (라우트 이동 등)
      touchPresence(userName, false);
      clearInterval(heartbeat);
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onUnload);
      unsub();
    };
  }, [userName]);

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
    // 우선순위: 미세먼지 보호 > 더위/추위 > 기본
    if (air?.grade === '나쁨' || air?.grade === '매우 나쁨') {
      return '/pochacco/pochacco_dust.png'; // 마스크 + 후드 ver
    }
    const t = weather?.current?.temp ?? 0;
    if (t >= 28) return '/pochacco/pochacco_sohot.png'; // 아주 더움 — 땀 닦는 민소매 ver
    if (t >= 10) return '/pochacco_picnic.png';
    if (t <= -1) return '/pochacco_cold.png';
    return '/pochacco.png';
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

  // 저장된 키(신규 id 또는 옛날 이모지) → 화면 표시
  // 표시 사이즈는 크게 (구분이 잘 가도록), 피커 안에서 쓰는 사이즈와 무관
  const renderMoodFace = (key: string | undefined, size = 60) => {
    const m = moodFromKey(key);
    if (m) {
      return (
        <Image
          src={m.image}
          alt={m.label}
          width={size}
          height={size}
          className="drop-shadow-sm"
        />
      );
    }
    // 매칭 실패 — 레거시 이모지든 빈 값이든
    return <span className="text-4xl drop-shadow-sm">{key || '…'}</span>;
  };

  if (!mounted) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <div className="w-full max-w-md mx-auto bg-[#F7F9F9] min-h-screen text-slate-800 relative overflow-x-hidden pb-12 selection:bg-[#99E6D9]/40">
      {/* 상단 등급색 그라데이션 — 전체를 하나의 흐름으로 */}
      <div className={`absolute top-0 left-0 w-full h-80 bg-gradient-to-b ${theme.gradient} to-[#F7F9F9] -z-0`} />

      {/* 1. Header */}
      <header className="relative z-10 px-6 pt-12 pb-4 flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1 opacity-80">{dateText}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">안녕, {userName} 👋</h1>
          {/* 상대 접속 시각 — presenceTick으로 매 1분 재계산 */}
          <p className="text-xs font-bold text-slate-500 mt-1.5">
            <span className="text-[#10B981]">{partner}</span>
            <span className="text-slate-400"> · </span>
            <span suppressHydrationWarning>{formatPresenceRelative(partnerPresence)}</span>
            {/* presenceTick 참조로 매분 리렌더 */}
            <span className="hidden">{presenceTick}</span>
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="p-2 bg-white/50 backdrop-blur-md rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="새로고침"
        >
          <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
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
                  active ? 'bg-[#10B981] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
        {/* 날씨 V2 — 오늘 + 내일 통합 풀폭 카드 (Gemini) */}
        <TodayTomorrowWeather
          location={air?.location || '호평동'}
          current={(weather as any)?.current || { temp: null, sky: null, pty: null, humidity: null }}
          today={(weather as any)?.today || { high: null, low: null, sky: null, pty: null, precipProb: null }}
          tomorrow={(weather as any)?.tomorrow || { high: null, low: null, sky: null, pty: null, precipProb: null }}
        />

        {/* 옷차림 — 슬림 한 줄 (날씨 카드 아래) */}
        <div className="bg-white rounded-[32px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 text-2xl">
            {outfit?.icon || '👕'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <Shirt size={14} strokeWidth={2.5} />
              <span className="text-xs font-bold">오늘의 옷차림</span>
            </div>
            <p className="text-sm font-bold text-slate-700 leading-snug line-clamp-2">{outfit?.text || '추천 준비 중'}</p>
          </div>
        </div>

        {/* 기분 & D-Day */}
        <div className="bg-white rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-stretch overflow-hidden">
          <div className="flex-1 p-5 flex flex-col justify-center border-r border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 mb-3">
              <Smile size={16} strokeWidth={2.5} />
              <span className="text-xs font-bold">오늘의 기분</span>
            </div>
            {moodOpen ? (
              <div className="grid grid-cols-3 gap-1.5">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => pickMood(opt)}
                    title={opt.label}
                    aria-label={opt.label}
                    className="aspect-square rounded-xl bg-slate-50 hover:bg-emerald-50 active:scale-90 transition-all flex flex-col items-center justify-center gap-0.5 p-1"
                  >
                    <Image src={opt.image} alt={opt.label} width={36} height={36} className="drop-shadow-sm" />
                    <span className="text-[10px] font-bold text-slate-500 leading-none whitespace-nowrap">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-between px-2 items-center">
                <div className="flex flex-col items-center gap-1">
                  {renderMoodFace(moods[partner]?.emoji)}
                  <span className="text-[10px] font-bold text-slate-400">{partner}</span>
                </div>
                <div className="w-8 h-[1px] bg-slate-100" />
                <button onClick={() => setMoodOpen(true)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                  {moods[userName]?.emoji
                    ? renderMoodFace(moods[userName]?.emoji)
                    : <span className="text-5xl leading-none drop-shadow-sm text-[#10B981]">＋</span>}
                  <span className="text-[10px] font-bold text-[#10B981]">{userName}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-[0.8] p-5 flex flex-col justify-center bg-gradient-to-br from-white to-[#EAF8F5]/30">
            <div className="flex items-center gap-1.5 text-rose-300 mb-2">
              <Heart size={16} strokeWidth={2.5} fill="currentColor" />
              <span className="text-xs font-bold">함께한 지</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 tracking-tight">D+{dDay}</p>
          </div>
        </div>

        {/* 오늘의 편지 */}
        <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#99E6D9]" />
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-[#10B981]">
                <div className="p-1.5 bg-[#EAF8F5] rounded-xl"><PenLine size={16} strokeWidth={2.5} /></div>
                <span className="text-sm font-bold">{partner}에게서 온 편지</span>
              </div>
              {latestLetterAt && (
                <span className="text-[11px] font-medium text-slate-400 ml-10" suppressHydrationWarning>
                  {(() => {
                    const d = latestLetterAt;
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
                    const h = d.getHours();
                    const m = d.getMinutes();
                    const ampm = h < 12 ? '오전' : '오후';
                    const h12 = (h % 12) || 12;
                    const time = `${ampm} ${h12}:${m.toString().padStart(2, '0')}`;
                    if (diffDays === 0) return `오늘 ${time} 도착`;
                    if (diffDays === 1) return `어제 ${time} 도착`;
                    if (diffDays < 7) return `${diffDays}일 전 ${time} 도착`;
                    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${time} 도착`;
                  })()}
                </span>
              )}
            </div>
            <button onClick={() => router.push('/letters')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full transition-colors">지난 편지</button>
          </div>
          {hasLetter ? (
            <div className="mb-5 px-1 space-y-3">
              {dailyMessage.trim() && (
                <p className="text-[15px] font-medium text-slate-700 leading-relaxed tracking-tight whitespace-pre-wrap">&ldquo;{dailyMessage}&rdquo;</p>
              )}
              {latestVoice && (() => {
                // Storage URL이면 그대로, 옛날 base64면 data: URL로 감쌈
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
            </div>
          ) : (
            <p className="text-center text-[14px] text-slate-400 py-3 mb-2">아직 도착한 편지가 없어요 💌</p>
          )}
          <button onClick={() => router.push('/letter/new')} className="w-full py-3.5 bg-[#F7F9F9] hover:bg-[#EAF8F5] text-[#10B981] rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
            <PenLine size={15} /> 편지 쓰기
          </button>
        </div>

        {/* 우리의 추억 — 진입 카드 (전체 갤러리는 /memories) */}
        {memories.length > 0 && (
          <button
            onClick={() => router.push('/memories')}
            className="w-full bg-white rounded-[32px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 text-left active:scale-[0.98] transition-all"
          >
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
              <img src={memories[0].imageUrl} alt={memories[0].title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Camera size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold">우리의 추억</span>
              </div>
              <p className="text-sm font-bold text-slate-700 truncate">{memories[0].title || '소중한 순간'}</p>
              <p className="text-[11px] text-slate-400">총 {memories.length}장 · 모두 보기</p>
            </div>
            <ChevronRight size={20} className="text-slate-400 shrink-0" />
          </button>
        )}

        {/* Share List 진입 카드 */}
        <button
          onClick={() => router.push('/share')}
          className="w-full bg-white rounded-[32px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 text-left active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center shrink-0 text-[#FCD34D]">
            <Sparkles size={22} strokeWidth={2.5} fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <span className="text-xs font-bold">Share List</span>
            </div>
            <p className="text-sm font-bold text-slate-700">
              {shares.length === 0
                ? `${vocativeOf(partner)} 이거 봐봐 💚`
                : `${vocativeOf(partner)} 이거 봐봐 💚 · 총 ${shares.length}개`}
            </p>
          </div>
          <ChevronRight size={20} className="text-slate-400 shrink-0" />
        </button>

        {/* 위시리스트 진입 카드 */}
        <button
          onClick={() => router.push('/wishlist')}
          className="w-full bg-white rounded-[32px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 text-left active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 text-[#10B981]">
            <Sparkles size={22} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <span className="text-xs font-bold">우리의 위시리스트</span>
            </div>
            <p className="text-sm font-bold text-slate-700">먹고 싶은 곳 · 가고 싶은 곳 · 보고 싶은 거</p>
          </div>
          <ChevronRight size={20} className="text-slate-400 shrink-0" />
        </button>

        {/* 또 갈래 진입 카드 */}
        <button
          onClick={() => router.push('/again')}
          className="w-full bg-white rounded-[32px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 text-left active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 text-[#10B981]">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <span className="text-xs font-bold">또 갈래</span>
            </div>
            <p className="text-sm font-bold text-slate-700">또 가고 싶은 곳 · 단골</p>
          </div>
          <ChevronRight size={20} className="text-slate-400 shrink-0" />
        </button>

        {/* 우리들의 서재 */}
        <button onClick={() => router.push('/novel')} className="w-full flex items-center justify-between p-6 rounded-[32px] bg-slate-800 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] active:scale-[0.98] transition-transform text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl"><BookOpen size={22} className="text-[#99E6D9]" strokeWidth={2} /></div>
            <div>
              <p className="text-[11px] font-bold text-[#99E6D9] mb-1 tracking-wider uppercase">Relay Novel</p>
              <p className="text-[16px] font-bold">우리들의 서재</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-400" />
        </button>
      </main>
    </div>
  );
}
