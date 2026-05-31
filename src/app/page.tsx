'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Wind, Heart, PenLine, BookOpen,
  RefreshCcw, ChevronRight, Shirt, Smile, Camera,
} from 'lucide-react';
import TodayTomorrowWeather from '@/components/TodayTomorrowWeather';
import { getInitialData } from '@/lib/api';
import { subscribeLatestLetterTo, nameFromCode, partnerOf, type Voice } from '@/lib/letters';
import { subscribeMemories, type Memory } from '@/lib/memories';
import VoicePlayer from '@/components/VoicePlayer';
import { subscribeTodayMoods, setMyMood, moodFromKey, MOOD_OPTIONS, type MoodMap, type MoodOption } from '@/lib/moods';
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
  const [hasLetter, setHasLetter] = useState(false);
  const [moods, setMoods] = useState<MoodMap>({});
  const [memories, setMemories] = useState<Memory[]>([]);
  const [moodOpen, setMoodOpen] = useState(false);
  const [userName, setUserName] = useState('꼼이');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dDay, setDDay] = useState(0);
  const [dateText, setDateText] = useState('');

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
    });
    const unsubMoods = subscribeTodayMoods(setMoods);
    const unsubMemories = subscribeMemories(setMemories);

    const start = new Date('2023-09-28');
    const today = new Date();
    start.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
    setDDay(Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
    setDateText(new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }));

    return () => { unsubLetter(); unsubMoods(); unsubMemories(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    let active = true;
    const load = () => fetch('/api/air').then((r) => r.json()).then((a) => { if (active) setAir(a); }).catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // 날씨: /api/weather (기상청 단기예보) 10분 갱신
  useEffect(() => {
    let active = true;
    const load = () =>
      fetch('/api/weather')
        .then((r) => r.json())
        .then((w) => { if (active && w && (w.current || w.today)) setWeather(w as any); })
        .catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, []);

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
  const renderMoodFace = (key: string | undefined, size = 36) => {
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
    return <span className="text-2xl drop-shadow-sm">{key || '…'}</span>;
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
        </div>
        <button
          onClick={() => loadData(true)}
          className="p-2 bg-white/50 backdrop-blur-md rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="새로고침"
        >
          <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </header>

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

          {/* 24시간 추세 + 내일 예보 */}
          <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-5 shadow-[0_2px_24px_rgba(0,0,0,0.03)] border border-white/40">
            {allHourly.length > 0 ? (
              <div className="mb-4">
                <div className="flex items-end justify-between h-12 gap-[2px]">
                  {allHourly.map((h: any, i: number) => {
                    const height = Math.max(16, Math.min(100, (h.pm10 / maxPm) * 100));
                    const isNow = i === allHourly.length - 1;
                    return (
                      <div key={i} className="flex-1 flex items-end h-full" title={`${(h.time || '').slice(11, 16)} · ${h.pm10}㎍/㎥`}>
                        <div className={`w-full rounded-[2px] ${theme.bar} ${isNow ? 'opacity-100' : 'opacity-50'}`} style={{ height: `${height}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1.5">
                  <span>24시간 전</span>
                  <span>지금 <strong className="text-slate-600">{allHourly[allHourly.length - 1]?.pm10}</strong></span>
                </div>
              </div>
            ) : (
              <div className="h-12 flex items-center justify-center text-xs text-slate-300 mb-4">추세 불러오는 중</div>
            )}
            <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">내일 예보</span>
              <span className="text-slate-500">{air?.tomorrow?.summary || (air?.tomorrow?.grade ? `${air.tomorrow.grade} 예상` : '준비 중')}</span>
            </div>
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
                    className="aspect-square rounded-xl bg-slate-50 hover:bg-emerald-50 active:scale-90 transition-all flex items-center justify-center p-1"
                  >
                    <Image src={opt.image} alt={opt.label} width={40} height={40} className="drop-shadow-sm" />
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
                    : <span className="text-2xl drop-shadow-sm text-[#10B981]">＋</span>}
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
            <div className="flex items-center gap-2 text-[#10B981]">
              <div className="p-1.5 bg-[#EAF8F5] rounded-xl"><PenLine size={16} strokeWidth={2.5} /></div>
              <span className="text-sm font-bold">{partner}에게서 온 편지</span>
            </div>
            <button onClick={() => router.push('/letters')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full transition-colors">지난 편지</button>
          </div>
          {hasLetter ? (
            <div className="mb-5 px-1 space-y-3">
              {dailyMessage.trim() && (
                <p className="text-[15px] font-medium text-slate-700 leading-relaxed tracking-tight whitespace-pre-wrap">&ldquo;{dailyMessage}&rdquo;</p>
              )}
              {latestVoice && (
                <VoicePlayer
                  src={`data:${latestVoice.mime};base64,${latestVoice.data}`}
                  mime={latestVoice.mime}
                  durationHint={latestVoice.duration}
                  accent="emerald"
                  compact
                />
              )}
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
