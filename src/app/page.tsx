'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getInitialData, getCacheInfo } from '@/lib/api';
import { subscribeLatestLetterTo, nameFromCode } from '@/lib/letters';
import { AirExtra } from '@/components/air-extra';
import { MoodRow } from '@/components/mood-row';
import type { WeatherData, OutfitGuide, MemoryPhotosData } from '@/types';
import DailyLetter from '@/components/daily-letter';
import MemoryGallery from '@/components/MemoryGallery';
import { getSkyCondition, getAirQualityEmoji, getAirQualityBg, getAirQualityText } from '@/lib/weatherHelpers';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  CloudSun,
  Wind,
  CalendarHeart,
  AlertCircle,
  Sparkles,
  BookOpen,
  Mail,
  History,
} from 'lucide-react';

const UI_VERSION = 'v2026-05-29';

export default function HomePage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<any>(null);
  const [outfit, setOutfit] = useState<OutfitGuide | null>(null);
  const [memoryPhotos, setMemoryPhotos] = useState<MemoryPhotosData | null>(null);
  const [dailyMessage, setDailyMessage] = useState<string>('');
  const [isLoadingMessage, setIsLoadingMessage] = useState(true);
  const [userName, setUserName] = useState('꼼');
  const [location] = useState<'home' | 'work'>('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dDay, setDDay] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentDateText, setCurrentDateText] = useState('');
  const router = useRouter();

  const auroraStyle = useMemo(
    () => ({
      background:
        'radial-gradient(circle at 10% 8%, rgba(16,185,129,0.14) 0%, transparent 48%),' +
        'radial-gradient(circle at 90% 16%, rgba(20,184,166,0.12) 0%, transparent 48%),' +
        'radial-gradient(circle at 50% 92%, rgba(250,204,21,0.06) 0%, transparent 50%)',
    }),
    []
  );

  const loadData = async (loc: 'home' | 'work', forceRefresh = false) => {
    setIsRefreshing(true);
    try {
      const data = await getInitialData(loc, forceRefresh);
      setWeather(data.weather);
      // 미세먼지는 GAS(죽음) 대신 /api/air(에어코리아)에서 별도로 받음
      setOutfit(data.outfit);
      setMemoryPhotos(data.memoryPhotos);
      if (forceRefresh) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let unsubscribeLetter: (() => void) | undefined;

    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    const me = nameFromCode(user.로그인코드);
    setUserName(me);

    loadData(location);

    // 오늘의 편지: Firestore 실시간 구독 (to == 나)
    setIsLoadingMessage(true);
    unsubscribeLetter = subscribeLatestLetterTo(me, (letter) => {
      setDailyMessage(letter?.body || '아직 도착한 편지가 없어요 💌');
      setIsLoadingMessage(false);
    });

    const startDate = new Date('2023-09-28');
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    setDDay(diffDays + 1);

    setCurrentDateText(
      new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
    );

    return () => unsubscribeLetter?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // 미세먼지: 에어코리아(/api/air)에서 받아 5분마다 갱신 (GAS 미사용)
  useEffect(() => {
    let active = true;
    const loadAir = () =>
      fetch('/api/air')
        .then((r) => r.json())
        .then((a) => { if (active) setAirQuality(a); })
        .catch(() => {});
    loadAir();
    const id = setInterval(loadAir, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const getPochaccoImage = () => {
    const temp = weather?.current?.temp ?? 0;
    if (temp >= 10) return '/pochacco_picnic.png';
    if (temp <= -1) return '/pochacco_cold.png';
    return '/pochacco.png';
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVars = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
  };

  const todayPrecip = weather?.today?.precipitation as any;
  const isBadAir = airQuality?.grade === '나쁨' || airQuality?.grade === '매우 나쁨';

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10" style={auroraStyle} />

      {showSuccessMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2"
          >
            <Sparkles size={16} />
            <span className="font-bold text-xs">최신 정보로 업데이트했어요!</span>
          </motion.div>
        </div>
      )}

      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="w-full max-w-md mx-auto px-5 py-6 space-y-3.5"
      >
        {/* 헤더 */}
        <motion.header variants={itemVars} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-emerald-50 shrink-0">
              <Image src={getPochaccoImage()} alt="포차코" fill className="object-cover" priority />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-black text-slate-400 tracking-[0.15em] uppercase">
                {currentDateText}
              </p>
              <h1 className="text-xl font-black tracking-tight text-slate-900">안녕, {userName} 👋</h1>
            </div>
          </div>
          <button
            onClick={() => loadData(location, true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white/60 rounded-xl border border-white text-emerald-600 shadow-sm active:scale-90 transition-all"
            aria-label="새로고침"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </button>
        </motion.header>

        {/* 미세먼지 + 날씨 타일 */}
        <motion.div variants={itemVars} className="grid grid-cols-2 gap-3">
          {/* 미세먼지 */}
          <div
            className={cn(
              'rounded-3xl border-2 p-4 flex flex-col min-h-[112px]',
              airQuality ? getAirQualityBg(airQuality.grade) : 'bg-white/70 border-white'
            )}
          >
            <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
              <Wind size={13} strokeWidth={2.8} />
              <span className="text-[10px] font-black tracking-[0.12em] uppercase">미세먼지</span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'text-2xl font-black tracking-tight',
                  airQuality ? getAirQualityText(airQuality.grade) : 'text-slate-300'
                )}
              >
                {airQuality?.grade ?? '…'}
              </span>
              <span className="text-3xl leading-none">
                {airQuality ? getAirQualityEmoji(airQuality.grade) : '🫧'}
              </span>
            </div>
            <div className="mt-auto pt-2 flex items-center gap-2.5 text-[10px] font-bold text-slate-400">
              <span>PM10 <b className="text-slate-700">{airQuality?.pm10 ?? '--'}</b></span>
              <span>PM2.5 <b className="text-slate-700">{airQuality?.pm25 ?? '--'}</b></span>
            </div>
          </div>

          {/* 날씨 */}
          <div className="rounded-3xl border-2 border-white bg-white/70 p-4 flex flex-col min-h-[112px]">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
              <CloudSun size={13} strokeWidth={2.8} />
              <span className="text-[10px] font-black tracking-[0.12em] uppercase">날씨</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black tracking-tight text-slate-800">
                {weather?.current?.temp != null ? `${weather.current.temp}°` : '--°'}
              </span>
              <span className="text-3xl leading-none">{getSkyCondition(weather?.current?.sky ?? null).emoji}</span>
            </div>
            <div className="mt-auto pt-2 flex items-center gap-2.5 text-[10px] font-bold text-slate-400">
              <span>체감 <b className="text-slate-700">{weather?.current?.feelsLike ?? '--'}°</b></span>
              <span>
                강수 <b className="text-slate-700">
                  {typeof todayPrecip?.probability === 'number' ? `${todayPrecip.probability}%` : '0%'}
                </b>
              </span>
            </div>
          </div>
        </motion.div>

        {/* 미세먼지 나쁨 경고 */}
        {isBadAir && (
          <motion.div
            variants={itemVars}
            className="rounded-2xl bg-red-50 border border-red-100 px-4 py-2.5 flex items-center justify-center gap-2"
          >
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-[11px] font-black text-red-600">미세먼지 {airQuality.grade} — 마스크 챙기세요 😷</span>
          </motion.div>
        )}

        {/* 미세먼지 상세 (내일 예보 + 24시간 흐름) */}
        {airQuality && (airQuality.tomorrow || (airQuality.hourly && airQuality.hourly.length > 0)) && (
          <motion.div variants={itemVars}>
            <Card variant="glass">
              <CardContent className="px-4 pt-3 pb-4">
                <AirExtra air={airQuality} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 오늘의 편지 */}
        <motion.div variants={itemVars} className="space-y-2.5">
          <DailyLetter message={dailyMessage} isLoading={isLoadingMessage} />
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/letter/new')}
              className="flex-1 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <Mail size={14} strokeWidth={2.6} /> 편지 쓰기
            </button>
            <button
              onClick={() => router.push('/letters')}
              className="flex-1 py-2.5 rounded-2xl bg-white/70 border border-emerald-200 text-emerald-600 font-black text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <History size={14} strokeWidth={2.6} /> 지난 편지
            </button>
          </div>
        </motion.div>

        {/* 오늘의 기분 */}
        <motion.div variants={itemVars}>
          <MoodRow me={userName} />
        </motion.div>

        {/* 서재 + 함께한 날 칩 */}
        <motion.div variants={itemVars} className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/novel')}
            className="rounded-3xl border-2 border-white bg-gradient-to-br from-amber-50/70 to-purple-50/50 p-4 text-left active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-1.5 text-amber-500 mb-1.5">
              <BookOpen size={13} strokeWidth={2.8} />
              <span className="text-[10px] font-black tracking-[0.12em] uppercase">우리들의 서재</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-700">소설 이어쓰기</span>
              <span className="text-2xl">📖</span>
            </div>
          </button>

          <div className="rounded-3xl border-2 border-slate-800 bg-slate-900 p-4 text-left">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1.5">
              <CalendarHeart size={13} strokeWidth={2.8} />
              <span className="text-[10px] font-black tracking-[0.12em] uppercase">함께한 날</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-black text-white tracking-tight">D+{dDay}</span>
              <span className="text-base">💗</span>
            </div>
          </div>
        </motion.div>

        {/* 옷차림 (컴팩트) */}
        {outfit && (
          <motion.div variants={itemVars}>
            <Card variant="glass" className="bg-gradient-to-br from-white/50 to-emerald-50/30">
              <CardContent className="px-4 py-3 flex items-center gap-3">
                <span className="text-3xl shrink-0">{outfit.icon || '👕'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 tracking-[0.12em] uppercase mb-1">
                    오늘 옷차림
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {outfit?.text ? (
                      outfit.text
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white/70 rounded-full text-[10px] font-bold text-slate-500 border border-white"
                          >
                            {item}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs text-slate-400">정보 준비중이에요</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 추억 사진 */}
        {memoryPhotos?.hasPhotos && (
          <motion.div variants={itemVars}>
            <MemoryGallery photos={memoryPhotos.photos} />
          </motion.div>
        )}

        <p className="text-center text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300 pt-1">
          꼼이 💚 우댕 · {UI_VERSION}
        </p>
      </motion.div>
    </div>
  );
}
