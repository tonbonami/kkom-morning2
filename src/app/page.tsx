'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getInitialData, getCacheInfo } from '@/lib/api';
import type { WeatherData, AirQualityData, OutfitGuide } from '@/types';
import DailyLetter from '@/components/daily-letter';

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
  const router = useRouter();

  const loadData = async (loc: 'home' | 'work', forceRefresh = false) => {
    if (!forceRefresh) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    try {
      const data = await getInitialData(loc, forceRefresh);
      setWeather(data.weather);
      setAirQuality(data.airQuality);
      setOutfit(data.outfit);
      
      if (!data.weather.isFallback) {
        const cacheInfo = getCacheInfo();
        setLastUpdate(cacheInfo.lastUpdate);
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
        const data = await res.json();
        
        if (!res.ok || data.result === 'fail' || data.result === 'error') {
          throw new Error(data.message || `서버 응답 오류: ${res.status}`);
        }
        
        setDailyMessage(data.message || '오늘의 편지를 아직 못 받았어요. 💌');
      } catch (error) {
        console.error('데이터 로드 실패 (daily message):', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류 발생';
        setDailyMessage(`오늘의 편지를 가져오는 데 실패했어요. 😢\n\n${errorMessage}`);
      } finally {
        setIsLoadingMessage(false);
      }
    };
    fetchMessage();

    const startDate = new Date('2023-09-28');
    const today = new Date();
    const timeDiff = today.getTime() - startDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
    setDDay(dayDiff);
  }, [router]);

  const handleLocationToggle = (newLocation: 'home' | 'work') => {
    if (location !== newLocation) {
      setLocation(newLocation);
      loadData(newLocation);
    }
  };

  const handleRefresh = () => {
    loadData(location, true);
  };

  const getUpdateTimeText = () => {
    if (!lastUpdate) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}시간 전`;
  };

  const getPochaccoImage = () => {
    if (!weather) return '/pochacco.png';
    const temp = weather.current.temperature;
    if (temp <= -1) {
      return '/pochacco_cold.png';
    }
    return '/pochacco.png';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-md mx-auto p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="text-center space-y-2 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </div>

          {/* Pochacco Skeleton */}
          <div className="flex justify-center px-4">
            <div className="relative w-full aspect-square max-w-md rounded-3xl overflow-hidden bg-gray-200 animate-pulse"></div>
          </div>
          
          {/* Daily Letter Skeleton */}
          <div className="px-4">
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>

          {/* Toggle Skeleton */}
          <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200 animate-pulse">
            <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Cards Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse h-40"></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse h-40"></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse h-40"></div>
        </div>
      </div>
    );
  }

  const getAirQualityBg = (grade: number) => {
    if (grade === 1) return 'bg-green-50 border-green-200';
    if (grade === 2) return 'bg-yellow-50 border-yellow-200';
    if (grade === 3) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showSuccessMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-out">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-medium">최신 정보로 업데이트!</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center relative">
          <h1 className="text-2xl font-bold">안녕, {userName}! 👋</h1>
          <p className="text-gray-600 text-sm mt-1">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="absolute top-0 right-0 opacity-30 hover:opacity-60 transition-opacity duration-200 disabled:opacity-20"
            aria-label="새로고침"
            title="새로고침"
          >
            <svg 
              className={`w-5 h-5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
          
          {weather?.isFallback ? (
            <div className="mt-1 flex justify-center items-center gap-1.5 text-xs text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span>실시간 정보 로딩 실패</span>
            </div>
          ) : lastUpdate && (
            <p className="text-xs text-gray-400 mt-1">
              {getUpdateTimeText()} 업데이트
            </p>
          )}
        </div>

        <div className="flex justify-center px-4">
          <div className="relative w-full aspect-square max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-200">
            <Image
              src={getPochaccoImage()}
              alt="포차코"
              fill
              className="object-cover"
              priority
            />
            
            {isRefreshing && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex flex-col items-center justify-center">
                <div className="animate-bounce text-4xl mb-2">🐶</div>
                <p className="text-emerald-600 font-medium text-sm animate-pulse">
                  새로고침 중...
                </p>
              </div>
            )}
          </div>
        </div>

        <DailyLetter message={dailyMessage} isLoading={isLoadingMessage} />

        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
          <button
            onClick={() => handleLocationToggle('home')}
            disabled={isRefreshing}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              location === 'home'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🏠 집 (호평동)
          </button>
          <button
            onClick={() => handleLocationToggle('work')}
            disabled={isRefreshing}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              location === 'work'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🏢 회사 (중구)
          </button>
        </div>

        {weather && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">☁️ 오늘의 날씨</h2>
            <div className="text-center">
              <div className="text-6xl mb-2">{weather.current.emoji}</div>
              <div className="text-3xl font-bold">{weather.current.temperature}°C</div>
              <div className="text-gray-600 text-sm mt-1">
                체감 {weather.current.feelsLike}°C
              </div>
              <div className="flex justify-center gap-4 mt-4 text-sm text-gray-600">
                <span>최고 {weather.today.high}°</span>
                <span>•</span>
                <span>최저 {weather.today.low}°</span>
              </div>
            </div>
          </div>
        )}

        {airQuality && (
          <div className={`rounded-xl shadow-sm border-2 p-6 ${getAirQualityBg(airQuality.overall.grade)}`}>
            <h2 className="text-lg font-semibold mb-4">💨 미세먼지</h2>
            <div className="text-center">
              <div className="text-5xl mb-2">{airQuality.overall.emoji}</div>
              <div className="text-2xl font-bold" style={{ color: airQuality.overall.color }}>
                {airQuality.overall.text}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                📍 {airQuality.stationName || '호평동'}
              </div>
              <div className="flex justify-center gap-4 mt-4 text-sm">
                <div>
                  <div className="font-semibold">PM10</div>
                  <div>{airQuality.pm10.value} ㎍/㎥</div>
                </div>
                <div>
                  <div className="font-semibold">PM2.5</div>
                  <div>{airQuality.pm25.value} ㎍/㎥</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-700">
                {airQuality.overall.message}
              </div>
            </div>
          </div>
        )}

        {outfit && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-200 p-6">
            <h2 className="text-lg font-semibold mb-4">👗 오늘의 착장 가이드</h2>
            <div className="text-center">
              <div className="text-5xl mb-2">{outfit.emoji}</div>
              <div className="text-xl font-bold">{outfit.mainOutfit}</div>
              <div className="text-sm text-gray-600 mt-2">{outfit.message}</div>
              {outfit.accessories.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {outfit.accessories.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {outfit.needMask && (
                <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-3">
                  <span className="text-red-700 font-semibold">😷 마스크 착용 권장</span>
                </div>
              )}
            </div>
          </div>
        )}

        {dDay > 0 && (
          <div className="pt-6 pb-2">
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">우리가 함께한지</p>
              
              <div className="flex justify-center items-center gap-2">
                <span className="text-2xl font-bold text-gray-700">+</span>
                {dDay.toString().split('').map((digit, index) => (
                  <div key={index} className="w-10 h-12 flex items-center justify-center border-2 border-emerald-300 rounded-lg bg-white shadow-sm">
                    <span className="text-3xl font-bold text-gray-800">{digit}</span>
                  </div>
                ))}
                <span className="text-2xl font-bold text-gray-700">일</span>
              </div>

              <p className="text-xl font-bold text-gray-800 pt-1">꼼이 ❤️ 우댕</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
