// src/lib/api.ts
import type {
  User,
  WeatherData,
  AirQualityData,
  OutfitGuide,
  InitialDataResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

// ✅ 캐시 버전 올려서 “예전 캐시” 강제 폐기
const CACHE_KEY = 'kkom-initial-cache-v10.1';
const CACHE_DURATION = 5 * 60 * 1000; // 5분

interface CachedData {
  weather: WeatherData;
  air: AirQualityData;
  outfit: OutfitGuide;
  timestamp: number;
  location: string;
}

function normalizeToV101(raw: any): InitialDataResponse {
  // 1) 이미 v10.1이면 그대로
  if (raw?.weather && raw?.air && raw?.outfit) return raw as InitialDataResponse;

  // 2) 구버전(airQuality / weather.current.temperature 등) → v10.1로 변환
  const legacy = raw ?? {};

  const weather: WeatherData = legacy.weather
    ? {
        current: {
          temp: legacy.weather?.current?.temp ?? legacy.weather?.current?.temperature ?? null,
          feelsLike: legacy.weather?.current?.feelsLike ?? null,
          tempSource: legacy.weather?.current?.tempSource,
          sky: legacy.weather?.current?.sky ?? null,
          precipitation: legacy.weather?.current?.precipitation ?? null,
        },
        today: {
          high: legacy.weather?.today?.high ?? null,
          low: legacy.weather?.today?.low ?? null,
          precipitation: legacy.weather?.today?.precipitation, // 없으면 undefined OK
        },
        tomorrow: legacy.weather?.tomorrow
          ? { precipitation: legacy.weather?.tomorrow?.precipitation }
          : undefined,
        location: legacy.weather?.location,
        timestamp: legacy.weather?.timestamp,
        isFallback: legacy.weather?.isFallback,
        error: legacy.weather?.error,
      }
    : {
        current: { temp: null, feelsLike: null, sky: null, precipitation: null },
        today: { high: null, low: null },
      };

  // 구버전 airQuality 구조는 제각각이라 “최대한 안전하게” 변환
  const air: AirQualityData = legacy.air
    ? legacy.air
    : legacy.airQuality
      ? {
          pm10: legacy.airQuality?.pm10?.value ?? legacy.airQuality?.pm10 ?? null,
          pm25: legacy.airQuality?.pm25?.value ?? legacy.airQuality?.pm25 ?? null,
          grade: legacy.airQuality?.overall?.text ?? legacy.airQuality?.grade ?? '정보 없음',
          location: legacy.airQuality?.location ?? legacy.airQuality?.stationName,
          dataTime: legacy.airQuality?.dataTime,
          error: legacy.airQuality?.error,
        }
      : { pm10: null, pm25: null, grade: '정보 없음' };

  const outfit: OutfitGuide = legacy.outfit
    ? {
        text:
          legacy.outfit?.text ??
          legacy.outfit?.mainOutfit ??
          (Array.isArray(legacy.outfit?.accessories)
            ? [legacy.outfit?.mainOutfit, ...legacy.outfit.accessories].filter(Boolean).join(', ')
            : '옷차림 정보를 가져올 수 없어요'),
        icon: legacy.outfit?.icon ?? legacy.outfit?.emoji ?? '🤷',
      }
    : { text: '옷차림 정보를 가져올 수 없어요', icon: '🤷' };

  // dailyMessage / todayQuiz는 page.tsx에서 따로 fetch하니 “형태만 맞춰줌”
  return {
    weather,
    air,
    outfit,
    pochaccoImage: legacy.pochaccoImage ?? 'normal',
    dailyMessage: legacy.dailyMessage ?? { hasMessage: false, message: '' },
    todayQuiz: legacy.todayQuiz ?? { hasQuiz: false, question: '' },
  };
}

export async function loginUser(code: string): Promise<User | null> {
  if (!API_URL) {
    console.error('API URL is not configured in environment variables.');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}?action=login&code=${code}`);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('API가 JSON 형식으로 응답하지 않았습니다');
    }

    const data = await response.json();

    if (data.success && data.user) {
      localStorage.setItem('kkom-user', JSON.stringify(data.user));
      return data.user;
    }

    console.error('Login failed from API:', data.message);
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function getInitialData(
  location: 'home' | 'work',
  forceRefresh = false
): Promise<InitialDataResponse> {
  if (!API_URL) throw new Error('API URL is not configured in environment variables.');

  try {
    // 1) 캐시
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedData = JSON.parse(cached);

        if (
          parsed.location === location &&
          Date.now() - parsed.timestamp < CACHE_DURATION &&
          !parsed.weather?.isFallback
        ) {
          console.log('✅ 캐시된 데이터 사용 (5분 이내)');
          return {
            weather: parsed.weather,
            air: parsed.air,
            outfit: parsed.outfit,
            pochaccoImage: 'normal',
            dailyMessage: { hasMessage: false, message: '' },
            todayQuiz: { hasQuiz: false, question: '' },
          };
        }
      }
    }

    console.log('🔄 새로운 데이터 가져오는 중...');

    const response = await fetch(`${API_URL}?action=getInitialData&location=${location}`);
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);

      // 캐시 폴백
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedData = JSON.parse(cached);
        console.warn('⚠️ API 오류, 캐시된 데이터 사용');
        return {
          weather: parsed.weather,
          air: parsed.air,
          outfit: parsed.outfit,
          pochaccoImage: 'normal',
          dailyMessage: { hasMessage: false, message: '' },
          todayQuiz: { hasQuiz: false, question: '' },
        };
      }

      throw new Error('API가 JSON 형식으로 응답하지 않았습니다');
    }

    const raw = await response.json();
    const data = normalizeToV101(raw);

    // ✅ v10.1 정상 데이터만 캐싱
    if (data.weather && !data.weather.isFallback) {
      const cacheData: CachedData = {
        weather: data.weather,
        air: data.air,
        outfit: data.outfit,
        timestamp: Date.now(),
        location,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 캐시 저장 완료');
    }

    return data;
  } catch (error) {
    console.error('API error:', error);

    // 오류 시 캐시 폴백
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedData = JSON.parse(cached);
      console.warn('⚠️ API 오류, 캐시된 데이터 사용');
      return {
        weather: parsed.weather,
        air: parsed.air,
        outfit: parsed.outfit,
        pochaccoImage: 'normal',
        dailyMessage: { hasMessage: false, message: '' },
        todayQuiz: { hasQuiz: false, question: '' },
      };
    }

    throw error;
  }
}

export function getCacheInfo(): { lastUpdate: Date | null; location: string | null } {
  if (typeof window === 'undefined') return { lastUpdate: null, location: null };

  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return { lastUpdate: null, location: null };

  try {
    const { timestamp, location }: CachedData = JSON.parse(cached);
    return { lastUpdate: new Date(timestamp), location };
  } catch (error) {
    console.error('캐시 파싱 오류:', error);
    return { lastUpdate: null, location: null };
  }
}