'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getInitialData } from '@/lib/api';
import { subscribeLatestLetterTo, nameFromCode, partnerOf } from '@/lib/letters';
import { subscribeTodayMoods, setMyMood, MOOD_OPTIONS, type MoodMap } from '@/lib/moods';
import type { WeatherData, OutfitGuide } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  RefreshCw, Wind, CloudSun, ThermometerSun, Umbrella,
  Heart, BookOpen, PenLine, ChevronRight, Smile,
} from 'lucide-react';

// 등급별 풀컬러 스타일 (미세먼지 Hero 카드)
const getAirStyle = (grade?: string) => {
  switch (grade) {
    case '좋음': return 'bg-emerald-400 text-white shadow-emerald-200/60';
    case '보통': return 'bg-sky-400 text-white shadow-sky-200/60';
    case '나쁨': return 'bg-orange-400 text-white shadow-orange-200/60';
    case '매우 나쁨': return 'bg-red-500 text-white shadow-red-200/60';
    default: return 'bg-slate-300 text-white shadow-slate-200/60';
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

    return () => {
      unsubLetter();
      unsubMoods();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // 미세먼지: /api/air 5분 갱신
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

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center text-slate-800 selection:bg-[#99E6D9]/40">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative overflow-hidden pb-12">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#99E6D9]/30 to-transparent -z-0" />

        <div className="relative px-5 pt-10 pb-4 z-10">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{dateText}</p>
              <h1 className="text-2xl font-bold tracking-tight">안녕, {userName} 👋</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData(true)}
                className={cn('p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-[#45b5a3] transition-colors', isRefreshing && 'animate-spin')}
                aria-label="새로고침"
              >
                <RefreshCw size={18} />
              </button>
              <div className="relative w-12 h-12 bg-white rounded-full p-1 shadow-sm border border-[#99E6D9]/40">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-emerald-50">
                  <Image src={getPochacco()} alt="포차코" fill className="object-cover" priority />
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-4">
            {/* 1. 미세먼지 Hero */}
            <Card className={cn('rounded-[28px] border-none shadow-lg overflow-hidden', getAirStyle(air?.grade))}>
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wind size={18} className="opacity-80" />
                      <span className="text-sm font-medium opacity-90">
                        {air?.location || '금곡동'} 미세먼지
                      </span>
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2">
                      {hasGrade ? air.grade : '불러오는 중'}
                    </h2>
                    <p className="text-sm opacity-90">
                      PM10 {air?.pm10 ?? '--'} · PM2.5 {air?.pm25 ?? '--'}
                    </p>
                  </div>
                  {air?.tomorrow?.grade && air.tomorrow.grade !== '정보 없음' && (
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/20 shrink-0">
                      내일 {air.tomorrow.grade}
                    </div>
                  )}
                </div>

                {hourly.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-end justify-between h-12 gap-[3px] mb-2">
                      {hourly.map((h: any, i: number) => (
                        <div key={i} className="flex-1 flex items-end h-full" title={`${(h.time || '').slice(11, 16)} · ${h.pm10}㎍/㎥`}>
                          <div
                            className="w-full bg-white/45 rounded-t-sm"
                            style={{ height: `${Math.max(8, Math.min((h.pm10 / maxPm) * 100, 100))}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] opacity-70 px-0.5">
                      <span>24시간 전</span>
                      <span>지금 {hourly[hourly.length - 1]?.pm10}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. 날씨 & 옷차림 */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <CloudSun size={16} />
                    <span className="text-sm font-medium">오늘 날씨</span>
                  </div>
                  {hasWeather ? (
                    <>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-3xl font-bold">{weather!.current!.temp}°</span>
                        <span className="text-sm text-slate-400 mb-1">체감 {weather!.current!.feelsLike ?? '--'}°</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><ThermometerSun size={12} /> {weather!.today?.high ?? '--'}°/{weather!.today?.low ?? '--'}°</span>
                        <span className="flex items-center gap-1"><Umbrella size={12} /> {(weather!.today?.precipitation as any)?.probability ?? 0}%</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center text-sm text-slate-300 font-medium">곧 연결돼요</div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white h-full">
                <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[120px] text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-2xl mb-2">
                    {outfit?.icon || '👕'}
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-snug line-clamp-3">
                    {outfit?.text || '오늘 옷차림 추천 준비 중'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 3. 기분 & D-Day */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white">
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-3 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><Smile size={15} className="text-[#45b5a3]" /> 오늘의 기분</span>
                  </div>
                  <div className="flex justify-around items-center bg-slate-50 p-2 rounded-2xl">
                    <button onClick={() => setMoodOpen((v) => !v)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                      <span className="text-2xl">{moods[userName]?.emoji || '＋'}</span>
                      <span className="text-[10px] text-slate-400">{userName} (나)</span>
                    </button>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{moods[partner]?.emoji || '…'}</span>
                      <span className="text-[10px] text-slate-400">{partner}</span>
                    </div>
                  </div>
                  {moodOpen && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      {MOOD_OPTIONS.map((e) => (
                        <button key={e} onClick={() => pickMood(e)} className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-lg active:scale-90 hover:bg-emerald-50 transition-all">
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-gradient-to-br from-white to-[#99E6D9]/10 h-full">
                <CardContent className="p-5 h-full flex flex-col justify-center items-center text-center">
                  <Heart className="text-rose-400 mb-2" size={24} fill="currentColor" />
                  <p className="text-sm text-slate-500 mb-1">함께한 지</p>
                  <p className="text-xl font-bold text-slate-800">D+{dDay}</p>
                </CardContent>
              </Card>
            </div>

            {/* 4. 오늘의 편지 */}
            <Card className="rounded-[24px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#99E6D9]" />
              <CardContent className="p-6 pl-8">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-[#45b5a3] font-medium">
                    <PenLine size={16} />
                    <span className="text-sm">{partner}에게서 온 편지</span>
                  </div>
                  <button onClick={() => router.push('/letters')} className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 bg-slate-50 rounded-lg">
                    지난 편지
                  </button>
                </div>
                {hasLetter ? (
                  <p className="text-slate-700 leading-relaxed font-medium mb-4 whitespace-pre-wrap">&ldquo;{dailyMessage}&rdquo;</p>
                ) : (
                  <p className="text-center py-3 text-slate-400 text-sm mb-2">아직 도착한 편지가 없어요 💌</p>
                )}
                <button onClick={() => router.push('/letter/new')} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                  <PenLine size={14} /> 편지 쓰기
                </button>
              </CardContent>
            </Card>

            {/* 5. 우리들의 서재 */}
            <button onClick={() => router.push('/novel')} className="w-full flex items-center justify-between p-5 rounded-[24px] bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-colors active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <BookOpen size={20} className="text-[#99E6D9]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">우리들의 서재</p>
                  <p className="text-xs text-slate-300">릴레이 소설 이어쓰기</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>

            <p className="text-center text-[10px] font-medium tracking-widest uppercase text-slate-300 pt-1">
              꼼이 💚 우댕
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
