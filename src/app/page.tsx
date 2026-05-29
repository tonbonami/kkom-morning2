'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getInitialData } from '@/lib/api';
import { subscribeLatestLetterTo, nameFromCode, partnerOf } from '@/lib/letters';
import { subscribeTodayMoods, setMyMood, MOOD_OPTIONS, type MoodMap } from '@/lib/moods';
import type { WeatherData, OutfitGuide } from '@/types';
import { cn } from '@/lib/utils';
import {
  RefreshCw, Wind, CloudSun, ThermometerSun, Umbrella,
  Heart, BookOpen, PenLine, ChevronRight, Smile, Shirt,
} from 'lucide-react';

// 등급별 풀컬러 스타일 (미세먼지 Hero)
const getAirStyle = (grade?: string) => {
  switch (grade) {
    case '좋음': return 'from-emerald-400 to-emerald-500 shadow-emerald-200/50';
    case '보통': return 'from-sky-400 to-sky-500 shadow-sky-200/50';
    case '나쁨': return 'from-orange-400 to-orange-500 shadow-orange-200/50';
    case '매우 나쁨': return 'from-red-400 to-red-500 shadow-red-200/50';
    default: return 'from-slate-300 to-slate-400 shadow-slate-200/50';
  }
};

export default function HomePage() {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [air, setAir] = useState<any>(null);
  const [outfit, setOutfit] = useState<OutfitGuide | null>(null);
  const [dailyMessage, setDailyMessage] = useState<string>('');
  const [hasLetter, setHasLetter] = useState(false);
  const [moods, setMoods] = useState<MoodMap>({});
  const [moodOpen, setMoodOpen] = useState(false);
  const [userName, setUserName] = useState('꼼이');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dDay, setDDay] = useState(0);
  const [dateText, setDateText] = useState('');

  const loadData = async (forceRefresh = false) => {
    setIsRefreshing(true);
    try {
      const data = await getInitialData('home', forceRefresh);
      setWeather(data.weather);
      setOutfit(data.outfit);
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const me = nameFromCode(JSON.parse(userStr).로그인코드);
    setUserName(me);

    loadData();

    const unsubLetter = subscribeLatestLetterTo(me, (letter) => {
      setHasLetter(!!letter);
      setDailyMessage(letter?.body || '');
    });
    const unsubMoods = subscribeTodayMoods(setMoods);

    const start = new Date('2023-09-28');
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    setDDay(Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
    setDateText(new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }));

    return () => { unsubLetter(); unsubMoods(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    let active = true;
    const load = () => fetch('/api/air').then((r) => r.json()).then((a) => { if (active) setAir(a); }).catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const getPochacco = () => {
    const t = weather?.current?.temp ?? 0;
    if (t >= 10) return '/pochacco_picnic.png';
    if (t <= -1) return '/pochacco_cold.png';
    return '/pochacco.png';
  };

  const partner = partnerOf(userName);
  const hasGrade = air && air.grade && air.grade !== '정보 없음' && air.grade !== '조회 실패';
  const hasWeather = weather?.current?.temp != null;
  const hourly = (air?.hourly || []).filter((h: any) => h.pm10 != null);
  const maxPm = Math.max(50, ...hourly.map((h: any) => h.pm10 || 0));

  const pickMood = async (emoji: string) => {
    setMoodOpen(false);
    try { await setMyMood(userName, emoji); } catch (e) { console.error(e); }
  };

  // 통합 패널 셀 라벨
  const cellLabel = (icon: React.ReactNode, text: string) => (
    <div className="flex items-center gap-1.5 text-slate-400 mb-2">
      {icon}
      <span className="text-[11px] font-bold tracking-tight">{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d6f2ec] via-[#eef8f5] to-[#f4f8f7] flex justify-center text-slate-800 selection:bg-[#99E6D9]/40">
      <div className="w-full max-w-md min-h-screen px-5 pt-10 pb-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-5">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-0.5">{dateText}</p>
            <h1 className="text-2xl font-bold tracking-tight">안녕, {userName} 👋</h1>
          </div>
          <button
            onClick={() => loadData(true)}
            className={cn('p-2.5 bg-white/70 rounded-full text-slate-400 hover:text-[#45b5a3] transition-colors', isRefreshing && 'animate-spin')}
            aria-label="새로고침"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        <div className="space-y-3">
          {/* 포차코 — 배경에 자연스럽게 녹아드는 큰 히어로 (하드 박스 X, 글로우+소프트 그림자) */}
          <div className="flex justify-center pt-1 pb-1">
            <div className="relative w-44 h-44">
              {/* 뒤쪽 민트 글로우 → 배경과 그라데이션으로 블렌딩 */}
              <div className="absolute -inset-5 rounded-full bg-emerald-300/30 blur-3xl" />
              {/* 이미지 자체의 그린 그라데이션 배경이 페이지 민트와 이어짐 + 부드러운 민트 그림자 */}
              <div className="relative w-full h-full rounded-[44px] overflow-hidden shadow-[0_22px_50px_-18px_rgba(16,185,129,0.5)]">
                <Image src={getPochacco()} alt="포차코" fill className="object-cover" priority />
              </div>
            </div>
          </div>

          {/* 미세먼지 Hero (축소) */}
          <div className={cn('rounded-3xl p-5 text-white bg-gradient-to-br shadow-lg', getAirStyle(air?.grade))}>
            <div className="flex justify-between items-center mb-2.5">
              <div className="flex items-center gap-1.5">
                <Wind size={15} className="opacity-80" />
                <span className="text-[13px] font-medium opacity-90">{air?.location || '금곡동'} 미세먼지</span>
              </div>
              {air?.tomorrow?.grade && air.tomorrow.grade !== '정보 없음' && (
                <span className="bg-white/20 px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/20">
                  내일 {air.tomorrow.grade}
                </span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight leading-none">{hasGrade ? air.grade : '불러오는 중'}</h2>
                <p className="text-[13px] opacity-90 mt-1.5">PM10 {air?.pm10 ?? '--'} · PM2.5 {air?.pm25 ?? '--'}</p>
              </div>
              {hourly.length > 0 && (
                <div className="flex items-end gap-[2px] h-9 w-[46%]">
                  {hourly.map((h: any, i: number) => (
                    <div key={i} className="flex-1 flex items-end h-full" title={`${(h.time || '').slice(11, 16)} · ${h.pm10}㎍/㎥`}>
                      <div className="w-full bg-white/45 rounded-t-sm" style={{ height: `${Math.max(8, Math.min((h.pm10 / maxPm) * 100, 100))}%` }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 통합 패널: 날씨 · 옷차림 · 기분 · D-day (한 블록) */}
          <div className="rounded-3xl bg-white border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-2">
              {/* 날씨 */}
              <div className="p-4 border-r border-b border-slate-100">
                {cellLabel(<CloudSun size={14} />, '오늘 날씨')}
                {hasWeather ? (
                  <>
                    <div className="flex items-end gap-1.5">
                      <span className="text-2xl font-bold leading-none">{weather!.current!.temp}°</span>
                      <span className="text-[11px] text-slate-400 mb-0.5">체감 {weather!.current!.feelsLike ?? '--'}°</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1.5">
                      <span className="flex items-center gap-0.5"><ThermometerSun size={11} /> {weather!.today?.high ?? '--'}°/{weather!.today?.low ?? '--'}°</span>
                      <span className="flex items-center gap-0.5"><Umbrella size={11} /> {(weather!.today?.precipitation as any)?.probability ?? 0}%</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-300 font-medium pt-1">곧 연결돼요</p>
                )}
              </div>

              {/* 옷차림 */}
              <div className="p-4 border-b border-slate-100">
                {cellLabel(<Shirt size={14} />, '오늘 옷차림')}
                <div className="flex items-center gap-2">
                  <span className="text-2xl shrink-0">{outfit?.icon || '👕'}</span>
                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{outfit?.text || '추천 준비 중'}</p>
                </div>
              </div>

              {/* 기분 */}
              <div className="p-4 border-r border-slate-100">
                {cellLabel(<Smile size={14} />, '오늘의 기분')}
                <div className="flex items-center justify-around">
                  <button onClick={() => setMoodOpen((v) => !v)} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
                    <span className="text-2xl">{moods[userName]?.emoji || '＋'}</span>
                    <span className="text-[9px] text-slate-400">{userName}(나)</span>
                  </button>
                  <div className="w-px h-7 bg-slate-100" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-2xl">{moods[partner]?.emoji || '…'}</span>
                    <span className="text-[9px] text-slate-400">{partner}</span>
                  </div>
                </div>
              </div>

              {/* D-day */}
              <div className="p-4 flex flex-col items-center justify-center text-center">
                <Heart className="text-rose-400 mb-1" size={20} fill="currentColor" />
                <p className="text-[10px] text-slate-400">함께한 지</p>
                <p className="text-lg font-bold text-slate-800 leading-tight">D+{dDay}</p>
              </div>
            </div>

            {/* 기분 선택 (패널 안에서 펼침) */}
            {moodOpen && (
              <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap justify-center gap-1.5">
                {MOOD_OPTIONS.map((e) => (
                  <button key={e} onClick={() => pickMood(e)} className="w-8 h-8 rounded-lg bg-slate-50 text-lg active:scale-90 hover:bg-emerald-50 transition-all">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 오늘의 편지 */}
          <div className="rounded-3xl bg-white border border-slate-100 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#99E6D9]" />
            <div className="flex justify-between items-center mb-3 pl-1">
              <div className="flex items-center gap-1.5 text-[#45b5a3] font-medium">
                <PenLine size={15} />
                <span className="text-[13px]">{partner}에게서 온 편지</span>
              </div>
              <button onClick={() => router.push('/letters')} className="text-[11px] text-slate-400 hover:text-slate-600 font-medium px-2 py-1 bg-slate-50 rounded-lg">
                지난 편지
              </button>
            </div>
            {hasLetter ? (
              <p className="text-[13px] text-slate-700 leading-relaxed font-medium mb-4 pl-1 whitespace-pre-wrap">&ldquo;{dailyMessage}&rdquo;</p>
            ) : (
              <p className="text-center py-2 text-slate-400 text-[13px] mb-2">아직 도착한 편지가 없어요 💌</p>
            )}
            <button onClick={() => router.push('/letter/new')} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]">
              <PenLine size={14} /> 편지 쓰기
            </button>
          </div>

          {/* 우리들의 서재 */}
          <button onClick={() => router.push('/novel')} className="w-full flex items-center justify-between p-4 rounded-3xl bg-slate-800 text-white hover:bg-slate-700 transition-colors active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <BookOpen size={18} className="text-[#99E6D9]" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold">우리들의 서재</p>
                <p className="text-[11px] text-slate-300">릴레이 소설 이어쓰기</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>

          <p className="text-center text-[10px] font-medium tracking-widest uppercase text-slate-300 pt-1">꼼이 💚 우댕</p>
        </div>
      </div>
    </div>
  );
}
