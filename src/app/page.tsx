'use client';

import KkomQuiz from '@/components/QuizCard';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getInitialData, getCacheInfo } from '@/lib/api';
import type { WeatherData, AirQualityData, OutfitGuide } from '@/types';
import DailyLetter from '@/components/daily-letter';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  CloudSun,
  Wind,
  Shirt,
  CalendarHeart,
  Home,
  Building2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [outfit, setOutfit] = useState<OutfitGuide | null>(null);
  const [dailyMessage, setDailyMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessage, setIsLoadingMessage] = useState(true);
  const [userName, setUserName] = useState('꼼');
  const [location, setLocation] = useState<'home' | 'work'>('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dDay, setDDay] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentDateText, setCurrentDateText] = useState('');
  const router = useRouter();

  // ✅ 오로라 배경 (감성 유지)
  const auroraStyle = useMemo(
    () => ({
      background:
        'radial-gradient(circle at 10% 10%, rgba(16,185,129,0.12) 0%, transparent 50%),' +
        'radial-gradient(circle at 90% 20%, rgba(59,130,246,0.10) 0%, transparent 50%),' +
        'radial-gradient(circle at 50% 90%, rgba(250,204,21,0.06) 0%, transparent 50%)',
    }),
    []
  );

  const loadData = async (loc: 'home' | 'work', forceRefresh = false) => {
    if (!forceRefresh) setIsLoading(true);
    setIsRefreshing(true);

    try {
      const data = await getInitialData(loc, forceRefresh);

      setWeather(data.weather);
      setAirQuality(data.airQuality);
      setOutfit(data.outfit);

      // ✅ (4) fallback일 때 업데이트 잔상 제거
      if (data.weather && !data.weather.isFallback) {
        setLastUpdate(getCacheInfo()?.lastUpdate || null);
      } else {
        setLastUpdate(null);
      }

      if (forceRefresh) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setUserName(user.이름);

    loadData(location);

    const fetchMessage = async () => {
      setIsLoadingMessage(true);
      try {
        const res = await fetch('/api/daily-message');
        // ✅ 에러 처리 강화 유지
        if (!res.ok) throw new Error(`서버 응답 오류: ${res.status}`);
        const data = await res.json();
        setDailyMessage(data.message || '오늘의 편지를 아직 못 받았어요. 💌');
      } catch (error) {
        setDailyMessage('편지를 불러오는 중 오류가 발생했어요. 😢');
      } finally {
        setIsLoadingMessage(false);
      }
    };
    fetchMessage();

    const startDate = new Date('2023-09-28');
    setDDay(
      Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1
    );

    setCurrentDateText(
      new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    );
  }, [router]);

  const handleLocationToggle = (newLocation: 'home' | 'work') => {
    if (location !== newLocation) {
      setLocation(newLocation);
      loadData(newLocation);
    }
  };

  const getUpdateTimeText = () => {
    if (!lastUpdate) return '';
    const diffMins = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60));
    return diffMins < 1
      ? '방금 전'
      : diffMins < 60
      ? `${diffMins}분 전`
      : `${Math.floor(diffMins / 60)}시간 전`;
  };

  const getPochaccoImage = () => {
    const temp = weather?.current?.temperature ?? 0;
    return temp <= -1 ? '/pochacco_cold.png' : '/pochacco.png';
  };

  // ✅ 모션 배리언트
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  if (isLoading) return <div className="min-h-screen bg-white animate-pulse" />;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10" style={auroraStyle} />

      {showSuccessMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
          >
            <Sparkles size={18} />
            <span className="font-bold text-sm">최신 정보 업데이트 완료!</span>
          </motion.div>
        </div>
      )}

      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="w-full max-w-md mx-auto p-6 space-y-8"
      >
        {/* Header */}
        <motion.header variants={itemVars} className="flex justify-between items-start pt-2">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
              {currentDateText}
            </p>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">
              안녕, {userName}! 👋
            </h1>
            {weather?.isFallback && (
              <div className="flex items-center gap-1.5 text-[10px] text-orange-500 font-bold uppercase">
                <AlertCircle size={10} /> Real-time Data Error
              </div>
            )}
          </div>

          <button
            onClick={() => loadData(location, true)}
            disabled={isRefreshing}
            className="p-3 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 text-emerald-600 shadow-xl active:scale-90 transition-all"
            aria-label="새로고침"
            title="새로고침"
          >
            <RefreshCw className={cn('w-5 h-5', isRefreshing && 'animate-spin')} />
          </button>
        </motion.header>

        {/* Pochacco Hero */}
        <motion.div variants={itemVars} className="flex justify-center">
          <div className="relative w-full aspect-square max-w-[260px] group">
            <div className="absolute inset-[-8%] bg-emerald-400/10 blur-[40px] rounded-full animate-pulse" />
            <Card
              variant="glass"
              className="p-0 overflow-hidden relative w-full h-full rounded-[48px] border-[6px] border-white shadow-2xl"
            >
              <Image
                src={getPochaccoImage()}
                alt="포차코"
                fill
                className="object-cover"
                priority
              />
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-bounce text-4xl mb-1">🐶</div>
                    <p className="text-emerald-600 font-black text-[10px] tracking-widest uppercase">
                      Loading
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </motion.div>

        {/* Daily Letter */}
        <motion.div variants={itemVars}>
          <DailyLetter message={dailyMessage} isLoading={isLoadingMessage} />
        </motion.div>

        {/* Location Toggle */}
        <motion.div variants={itemVars}>
          <Card variant="glass" className="p-1.5 flex gap-2 bg-slate-200/20">
            <button
              onClick={() => handleLocationToggle('home')}
              className={cn(
                'flex-1 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2',
                location === 'home'
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              disabled={isRefreshing}
            >
              <Home size={14} /> HOME
            </button>
            <button
              onClick={() => handleLocationToggle('work')}
              className={cn(
                'flex-1 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2',
                location === 'work'
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'text-slate-400 hover:text-slate-600'
              )}
              disabled={isRefreshing}
            >
              <Building2 size={14} /> OFFICE
            </button>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-4">
          <motion.div variants={itemVars}>
            <KkomQuiz />
          </motion.div>

          {/* Weather Card */}
          {weather && (
            <motion.div variants={itemVars}>
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <CloudSun size={16} strokeWidth={2.5} />
                    <h2 className="text-[10px] font-black tracking-[0.2em] uppercase">
                      Current Weather
                    </h2>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="text-center flex-1">
                      <div className="text-6xl mb-1">{weather.current?.emoji}</div>
                      <div className="text-4xl font-black tracking-tighter text-slate-800">
                        {weather.current?.temperature}°
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 border-l border-slate-200 pl-6 py-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Feels
                        </span>
                        <span className="font-black text-slate-700">
                          {weather.current?.feelsLike}°
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          High
                        </span>
                        <span className="font-black text-rose-500">
                          {weather.today?.high}°
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Low
                        </span>
                        <span className="font-black text-blue-500">
                          {weather.today?.low}°
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ (4) Last Update는 lastUpdate 있을 때만 노출 */}
                  {lastUpdate && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <RefreshCw size={10} /> Last Update: {getUpdateTimeText()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Air Quality Card */}
          {airQuality && (
            <motion.div variants={itemVars}>
              <Card
                variant="glass"
                className={cn(
                  'border-l-4',
                  airQuality.overall?.grade === 1 ? 'border-l-emerald-400' : 'border-l-orange-400'
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Wind size={16} strokeWidth={2.5} />
                      <h2 className="text-[10px] font-black tracking-[0.2em] uppercase">
                        Air Quality
                      </h2>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      📍 {airQuality.stationName || '호평동'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-slate-800 tracking-tight">
                        {airQuality.overall?.text}
                      </p>
                      <p className="text-xs text-slate-500 font-medium leading-tight">
                        {airQuality.overall?.message}
                      </p>
                    </div>
                    <div className="text-5xl">{airQuality.overall?.emoji}</div>
                  </div>

                  {/* ✅ (3) 수치 안전 처리: undefined면 '--' */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        PM10
                      </p>
                      <p className="text-sm font-black text-slate-700">
                        {airQuality.pm10?.value ?? '--'}{' '}
                        <span className="text-[8px] opacity-50">㎍/㎥</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        PM2.5
                      </p>
                      <p className="text-sm font-black text-slate-700">
                        {airQuality.pm25?.value ?? '--'}{' '}
                        <span className="text-[8px] opacity-50">㎍/㎥</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Outfit Card */}
          {outfit && (
            <motion.div variants={itemVars}>
              <Card variant="glass" className="bg-gradient-to-br from-white/40 to-emerald-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <Shirt size={16} strokeWidth={2.5} />
                    <h2 className="text-[10px] font-black tracking-[0.2em] uppercase">
                      Outfit Guide
                    </h2>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="text-5xl mb-2">{outfit.emoji}</div>
                    <div className="space-y-1 px-4">
                      <p className="text-xl font-black text-slate-800 tracking-tight">
                        {outfit.mainOutfit}
                      </p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {outfit.message}
                      </p>
                    </div>

                    {/* ✅ (2) accessories 안전 처리 */}
                    {(outfit.accessories?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                        {outfit.accessories!.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-white/70 rounded-full text-[10px] font-bold text-slate-500 border border-white shadow-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 😷 마스크 경고 */}
                    {outfit.needMask && (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [0.9, 1, 0.9] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="mt-4 bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center justify-center gap-2"
                      >
                        <AlertCircle size={14} className="text-red-500" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                          Mask Recommended
                        </span>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* D-Day Footer */}
        {dDay > 0 && (
          <motion.footer variants={itemVars} className="pt-8 pb-10">
            <Card
              variant="glass"
              className="bg-slate-900 border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[40px] overflow-hidden"
            >
              <CardContent className="p-8 text-center space-y-6">
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <CalendarHeart size={18} />
                  <p className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60">
                    Memory Since 2023
                  </p>
                </div>

                <div className="flex justify-center items-center gap-3">
                  <span className="text-3xl font-black text-white/20">+</span>
                  {dDay
                    .toString()
                    .split('')
                    .map((digit, index) => (
                      <div
                        key={index}
                        className="w-12 h-16 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl shadow-inner"
                      >
                        <span className="text-4xl font-black text-white font-mono tracking-tighter">
                          {digit}
                        </span>
                      </div>
                    ))}
                  <span className="text-3xl font-black text-white/20">일</span>
                </div>

                <div className="pt-2">
                  <p className="text-xl font-black text-white tracking-widest">꼼이 ❤️ 우댕</p>
                  <div className="h-[3px] w-8 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mt-3 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </motion.footer>
        )}
      </motion.div>
    </div>
  );
}