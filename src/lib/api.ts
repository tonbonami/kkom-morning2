// src/lib/api.ts

import type { User, WeatherData, AirQualityData, OutfitGuide } from '@/types';

const API_URL = 'https://script.google.com/macros/s/AKfycbzRkRFH9xxCDWBxrc9SSM_YCUqwOoolM6-YqOK2haf7metCMDUr5Khw19uibXpYJLvp/exec';

export async function loginUser(code: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}?action=login&code=${code}`);
    const data = await response.json();
    
    if (data.success) {
      // LocalStorage에 유저 정보 저장
      localStorage.setItem('kkom-user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('로그인 에러:', error);
    return null;
  }
}

export async function getInitialData(location: 'home' | 'work' = 'home') {
  try {
    const response = await fetch(`${API_URL}?action=getInitialData&location=${location}`);
    const data = await response.json();
    
    if (data.success) {
      // 캐시 저장 (1시간 유효)
      localStorage.setItem('kkom-weather-cache', JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
      
      console.log('✅ 데이터 로드 성공:', data.airQuality.stationName);
      
      return {
        weather: data.weather,
        airQuality: data.airQuality,
        outfit: data.outfit,
        stationName: data.airQuality.stationName
      };
    }
    
    throw new Error('API 실패');
  } catch (error) {
    console.error('데이터 로드 에러:', error);
    
    // 캐시 확인 (1시간 이내)
    const cached = localStorage.getItem('kkom-weather-cache');
    if (cached) {
      const cacheData = JSON.parse(cached);
      const isValid = (Date.now() - cacheData.timestamp) < 3600000; // 1시간
      
      if (isValid) {
        console.log('✅ 캐시 사용');
        return {
          weather: cacheData.weather,
          airQuality: cacheData.airQuality,
          outfit: cacheData.outfit,
          stationName: cacheData.airQuality?.stationName
        };
      }
    }
    
    throw error;
  }
}
