// src/lib/api.ts
import type { User, WeatherData, AirQualityData, OutfitGuide } from '@/types';

const API_URL = 'https://script.google.com/macros/s/AKfycbyvrzsVrCjrzIKDTfI_KNnxolc09qhUdwQKYd9dj3qCmUwlj9GxOh1mLFmsRouQ-MDY/exec'

const CACHE_KEY = 'kkom-weather-cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5분

interface CachedData {
  weather: WeatherData
  airQuality: AirQualityData
  outfit: OutfitGuide
  timestamp: number
  location: string
}

export async function loginUser(code: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}?action=login&code=${code}`)
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON response:', text)
      throw new Error('API가 JSON 형식으로 응답하지 않았습니다')
    }

    const data = await response.json();
    
    if (data.success && data.user) {
      localStorage.setItem('kkom-user', JSON.stringify(data.user));
      return data.user;
    } else {
      console.error('Login failed from API:', data.message);
      return null;
    }

  } catch (error) {
    console.error('Login error:', error)
    return null;
  }
}

export async function getInitialData(
  location: 'home' | 'work', 
  forceRefresh = false
): Promise<{ weather: WeatherData; airQuality: AirQualityData; outfit: OutfitGuide }> {
  try {
    // 강제 새로고침이 아니면 캐시 확인
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { weather, airQuality, outfit, timestamp, location: cachedLocation }: CachedData = JSON.parse(cached)
        
        // 같은 위치 && 5분 이내면 캐시 사용
        if (
          cachedLocation === location && 
          Date.now() - timestamp < CACHE_DURATION &&
          !weather.isFallback // fallback 데이터는 캐시 사용 안 함
        ) {
          console.log('✅ 캐시된 데이터 사용 (5분 이내)')
          return { weather, airQuality, outfit }
        }
      }
    }

    console.log('🔄 새로운 데이터 가져오는 중...')
    
    // API 호출
    const response = await fetch(`${API_URL}?action=getInitialData&location=${location}`)
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON response:', text)
      
      // 캐시 폴백
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { weather, airQuality, outfit }: CachedData = JSON.parse(cached)
        console.warn('⚠️ API 오류, 캐시된 데이터 사용')
        return { weather, airQuality, outfit }
      }
      
      throw new Error('API가 JSON 형식으로 응답하지 않았습니다')
    }

    const data = await response.json()

    if (data.weather && !data.weather.isFallback) {
      // isFallback이 아닐 때만 캐시 저장
      const cacheData: CachedData = {
        weather: data.weather,
        airQuality: data.airQuality,
        outfit: data.outfit,
        timestamp: Date.now(),
        location
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      console.log('💾 캐시 저장 완료')
    }
    
    return data
  } catch (error) {
    console.error('API error:', error)
    
    // 오류 발생 시 캐시 폴백
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { weather, airQuality, outfit }: CachedData = JSON.parse(cached)
      console.warn('⚠️ API 오류, 캐시된 데이터 사용')
      return { weather, airQuality, outfit }
    }
    
    throw error
  }
}

// ⭐ 캐시 정보 가져오기 (마지막 업데이트 시간)
export function getCacheInfo(): { lastUpdate: Date | null; location: string | null } {
  if (typeof window === 'undefined') {
    return { lastUpdate: null, location: null }
  }
  
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { timestamp, location }: CachedData = JSON.parse(cached)
      return {
        lastUpdate: new Date(timestamp),
        location
      }
    } catch (error) {
      console.error('캐시 파싱 오류:', error)
      return { lastUpdate: null, location: null }
    }
  }
  return { lastUpdate: null, location: null }
}
