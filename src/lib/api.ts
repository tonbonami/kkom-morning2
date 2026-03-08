import type {
  User,
  WeatherData,
  AirQualityData,
  OutfitGuide,
  MemoryPhotosData,
  Novel,
  CoverImage,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

// 캐시 키 버전 업 (아뜰리에 데이터 포함)
const CACHE_KEY = 'kkom-weather-cache:v10.3';
const CACHE_DURATION = 5 * 60 * 1000; // 5분

type Location = 'home' | 'work';

interface CachedData {
  weather: WeatherData;
  air: AirQualityData;
  outfit: OutfitGuide;
  memoryPhotos: MemoryPhotosData;
  activeNovels: Novel[];
  completedNovels: Novel[];
  coverLibrary: CoverImage[];
  timestamp: number;
  location: Location;
}

/**
 * 구버전/신버전 응답을 v10.3 형태로 강제 통일
 */
function normalizeInitialData(raw: any): {
  weather: WeatherData;
  air: AirQualityData;
  outfit: OutfitGuide;
  memoryPhotos: MemoryPhotosData;
  activeNovels: Novel[];
  completedNovels: Novel[];
  coverLibrary: CoverImage[];
} {
  const weather: WeatherData = raw?.weather ?? {
    current: { temp: null, feelsLike: null, sky: null, precipitation: null, tempSource: 'N/A' },
    today: { high: null, low: null },
  };

  // air vs airQuality 둘 다 받되, 최종은 air로 통일
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

  const memoryPhotos: MemoryPhotosData =
    raw?.memoryPhotos ?? {
      hasPhotos: false,
      photos: [],
    };

  const activeNovels: Novel[] = raw?.activeNovels ?? [];
  const completedNovels: Novel[] = raw?.completedNovels ?? [];
  const coverLibrary: CoverImage[] = raw?.coverLibrary ?? [];

  return { weather, air, outfit, memoryPhotos, activeNovels, completedNovels, coverLibrary };
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

    // Apps Script가 {success:true}만 주는 경우도 허용
    if (data?.success) {
      const name = data.name || '꼼이';
      
      // 화면 표시용 이름
      const displayName = name === '꼼이' ? '꼼✌️' : name;
      
      const user: User = {
        로그인코드: code,
        이름: displayName,   // 토스트, UI 표시용 → "꼼✌️"
        name: name,          // 아뜰리에 작성자 식별용 → "꼼이" (원본 유지)
      };
    
      console.log('✅ 로그인 성공:', user);
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
): Promise<{
  weather: WeatherData;
  air: AirQualityData;
  outfit: OutfitGuide;
  memoryPhotos: MemoryPhotosData;
  activeNovels: Novel[];
  completedNovels: Novel[];
  coverLibrary: CoverImage[];
}> {
  if (!API_URL) {
    throw new Error('❌ NEXT_PUBLIC_APPS_SCRIPT_URL이 설정되어 있지 않습니다.');
  }

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
          return {
            weather: parsed.weather,
            air: parsed.air,
            outfit: parsed.outfit,
            memoryPhotos: parsed.memoryPhotos || { hasPhotos: false, photos: [] },
            activeNovels: parsed.activeNovels || [],
            completedNovels: parsed.completedNovels || [],
            coverLibrary: parsed.coverLibrary || [],
          };
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
        return {
          weather: parsed.weather,
          air: parsed.air,
          outfit: parsed.outfit,
          memoryPhotos: parsed.memoryPhotos || { hasPhotos: false, photos: [] },
          activeNovels: parsed.activeNovels || [],
          completedNovels: parsed.completedNovels || [],
          coverLibrary: parsed.coverLibrary || [],
        };
      }

      throw new Error('API가 JSON 형식으로 응답하지 않았습니다');
    }

    const raw = await response.json();

    // 형태 통일 (구버전/신버전 자동 대응)
    const { weather, air, outfit, memoryPhotos, activeNovels, completedNovels, coverLibrary } =
      normalizeInitialData(raw);

    // 디버그 로그
    console.log('[normalized.weather.today]', weather?.today);
    console.log('[normalized.weather.tomorrow]', raw?.weather?.tomorrow ?? weather?.tomorrow);
    console.log('[normalized.weather.today.precip]', weather?.today?.precipitation);
    console.log('[normalized.weather.tomorrow.precip]', raw?.weather?.tomorrow?.precipitation ?? weather?.tomorrow?.precipitation);
    console.log('[memoryPhotos]', memoryPhotos);
    console.log('[activeNovels]', activeNovels.length, '권');
    console.log('[completedNovels]', completedNovels.length, '권');
    console.log('[coverLibrary]', coverLibrary.length, '개');

    // 3) 캐시 저장 (실시간 정상일 때만)
    if (weather && !weather.isFallback) {
      const cacheData: CachedData = {
        weather,
        air,
        outfit,
        memoryPhotos,
        activeNovels,
        completedNovels,
        coverLibrary,
        timestamp: Date.now(),
        location,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 캐시 저장 완료 (v10.3)');
    }

    return { weather, air, outfit, memoryPhotos, activeNovels, completedNovels, coverLibrary };
  } catch (error) {
    console.error('API error:', error);

    // 캐시 폴백
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedData = JSON.parse(cached);
      console.warn('⚠️ API 오류, 캐시된 데이터 사용');
      return {
        weather: parsed.weather,
        air: parsed.air,
        outfit: parsed.outfit,
        memoryPhotos: parsed.memoryPhotos || { hasPhotos: false, photos: [] },
        activeNovels: parsed.activeNovels || [],
        completedNovels: parsed.completedNovels || [],
        coverLibrary: parsed.coverLibrary || [],
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
    const parsed: CachedData = JSON.parse(cached);
    return { lastUpdate: new Date(parsed.timestamp), location: parsed.location };
  } catch {
    return { lastUpdate: null, location: null };
  }
}
