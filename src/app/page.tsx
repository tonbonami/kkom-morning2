'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getInitialData } from '@/lib/api';
import type { WeatherData, AirQualityData, OutfitGuide } from '@/types';

export default function HomePage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [outfit, setOutfit] = useState<OutfitGuide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('꼼');
  const [location, setLocation] = useState<'home' | 'work'>('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async (loc: 'home' | 'work') => {
    setIsRefreshing(true);
    try {
      const data = await getInitialData(loc);
      setWeather(data.weather);
      setAirQuality(data.airQuality);
      setOutfit(data.outfit);
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
  }, [router]);

  const handleLocationToggle = (newLocation: 'home' | 'work') => {
    if (location !== newLocation) {
      setLocation(newLocation);
      loadData(newLocation);
    }
  };

  // ⭐ 포차코 이미지 선택 (온도별)
  const getPochaccoImage = () => {
    if (!weather) return '/pochacco.png';
    
    const temp = weather.current.temperature;
    
    // -1도 이하: 추운 버전
    if (temp <= -1) {
      return '/pochacco_cold.png';
    }
    
    // 나머지: 기본 버전
    return '/pochacco.png';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-6">
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
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
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">안녕, {userName}! 👋</h1>
          <p className="text-gray-600 text-sm mt-1">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>

        {/* ⭐ 포차코 크게! 정사각형 꽉차게 + 둥글게 + 온도별 이미지 */}
        <div className="flex justify-center px-4">
          <div className="relative w-full aspect-square max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-200">
            <Image
              src={getPochaccoImage()}
              alt="포차코"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* 집/회사 토글 */}
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

        {/* 로딩 중 표시 */}
        {isRefreshing && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-emerald-600">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">데이터 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* 날씨 카드 */}
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

        {/* 미세먼지 카드 */}
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

        {/* 착장 가이드 카드 */}
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
      </div>
    </div>
  );
}
