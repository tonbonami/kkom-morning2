import type { User, WeatherData, AirQualityData, OutfitGuide } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

// ✅ 캐시 키 버전 업 (구캐시가 UI를 망치는 문제 방지)
const CACHE_KEY = 'kkom-weather-cache:v10.1';
const CACHE_DURATION = 5 * 60 * 1000; // 5분

type Location = 'home' | 'work';

interface CachedData {
  weather: WeatherData;
  air: AirQualityData;
  outfit: OutfitGuide;
  timestamp: number;
  location: Location;
}

/**
 * ✅ 구버전/신버전 응답을 v10.1 형태로 강제 통일
 * - v10.1: { weather, air, outfit, ... }
 * - 구버전: { weather, airQuality, outfit, ... }
 */
function normalizeInitialData(raw: any): { weather: WeatherData; air: AirQualityData; outfit: OutfitGuide } {
  const weather: WeatherData = raw?.weather ?? {
    current: { temp: null, feelsLike: null, sky: null, precipitation: null, tempSource: 'N/A' },
    today: { high: null, low: null },
  };

  // ✅ 핵심: air vs airQuality 둘 다 받되, 최종은 air로 통일
  const air: AirQualityData =
    raw?.air ??
    raw?.airQuality ?? {
      pm10: null,
      pm25: null,
      grade: '정보 없음',
    };

  const outfit: OutfitGuide =
    raw?.outfit ?? {
      text: '옷차림 정보를 가져올 수 없어요',
      icon: '🤷',
    };

  return { weather, air, outfit };
}

export async function loginUser(code: string): Promise<User | null> {
  if (!API_URL) {
    console.error('❌ NEXT_PUBLIC_APPS_SCRIPT_URL이 설정되어 있지 않습니다.');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}?action=login&code=${encodeURIComponent(code)}`);
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      return null;
    }

    const data = await response.json();

    // ✅ Apps Script가 {success:true}만 주는 경우도 허용 (지금 서버가 이 형태)
    if (data?.success) {
      const user: User = data.user ?? { 로그인코드: code, 이름: '꼼' };
      localStorage.setItem('kkom-user', JSON.stringify(user));
      return user;
    }

    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function getInitialData(
  location: Location,
  forceRefresh = false
): Promise<{ weather: WeatherData; air: AirQualityData; outfit: OutfitGuide }> {
  if (!API_URL) {
    throw new Error('❌ NEXT_PUBLIC_APPS_SCRIPT_URL이 설정되어 있지 않습니다.');
  }

  // ✅ (중요) 지금 배포가 어떤 URL을 쓰는지 콘솔로 바로 보이게
  console.log('🌐 API_URL =', API_URL);

  try {
    // 1) 캐시 사용
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
          return { weather: parsed.weather, air: parsed.air, outfit: parsed.outfit };
        }
      }
    }

    console.log('🔄 새로운 데이터 가져오는 중...');

    // 2) API 호출
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
        return { weather: parsed.weather, air: parsed.air, outfit: parsed.outfit };
      }

      throw new Error('API가 JSON 형식으로 응답하지 않았습니다');
    }

    const raw = await response.json();

    // ✅ 여기서 형태 통일(구버전/신버전 자동 대응)
    const { weather, air, outfit } = normalizeInitialData(raw);

    // ✅ 디버그: 내일/강수 구조가 실제로 오는지 바로 확인
    console.log('[normalized.weather.today]', weather?.today);
    console.log('[normalized.weather.tomorrow]', (raw?.weather?.tomorrow ?? weather?.tomorrow));
    console.log('[normalized.weather.today.precip]', weather?.today?.precipitation);
    console.log('[normalized.weather.tomorrow.precip]', (raw?.weather?.tomorrow?.precipitation ?? weather?.tomorrow?.precipitation));

    // 3) 캐시 저장(실시간 정상일 때만)
    if (weather && !weather.isFallback) {
      const cacheData: CachedData = {
        weather,
        air,
        outfit,
        timestamp: Date.now(),
        location,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 캐시 저장 완료');
    }

    return { weather, air, outfit };
  } catch (error) {
    console.error('API error:', error);

    // 캐시 폴백
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedData = JSON.parse(cached);
      console.warn('⚠️ API 오류, 캐시된 데이터 사용');
      return { weather: parsed.weather, air: parsed.air, outfit: parsed.outfit };
    }

    throw error;
  }
}

export function getCacheInfo(): { lastUpdate: Date | null; location: string | null } {
  if (typeof window === 'undefined') return { lastUpdate: null, location: null };

  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return { lastUpdate: null, location: null };

  try {
    const parsed: CachedData = JSON.parse(cached);
    return { lastUpdate: new Date(parsed.timestamp), location: parsed.location };
  } catch {
    return { lastUpdate: null, location: null };
  }
}