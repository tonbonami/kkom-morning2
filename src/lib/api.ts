import type { User, WeatherData, AirQualityData, OutfitGuide } from '@/types';

// MOCK DATA
export const MOCK_USER: User = {
  id: 'user_kkomi',
  name: '꼬미',
  pin: '1225',
};

const MOCK_WEATHER: WeatherData = {
  condition: 'Sunny',
  temperature: 22,
  feelsLike: 23,
  high: 25,
  low: 15,
};

const MOCK_AIR_QUALITY: AirQualityData = {
  grade: 2,
  pm10: 45,
  pm25: 20,
};

// API FUNCTIONS
export const authenticateUser = async (pin: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (pin === MOCK_USER.pin) {
        resolve(MOCK_USER);
      } else {
        resolve(null);
      }
    }, 500);
  });
};

export const fetchWeatherData = async (): Promise<WeatherData> => {
  const CACHE_KEY = 'weather_data';
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  const cachedData = localStorage.getItem(CACHE_KEY);
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const dataToCache = { data: MOCK_WEATHER, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
      resolve(MOCK_WEATHER);
    }, 700);
  });
};

export const fetchAirQualityData = async (): Promise<AirQualityData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_AIR_QUALITY);
    }, 900);
  });
};

export const getOutfitGuide = (temp: number): OutfitGuide => {
  if (temp < 0) return { recommendation: "패딩과 목도리는 필수! 아주 추워요.", emoji: "🧣" };
  if (temp < 5) return { recommendation: "따뜻한 겨울 코트와 장갑을 챙기세요.", emoji: "🧤" };
  if (temp < 10) return { recommendation: "트렌치 코트나 가죽 자켓이 좋겠어요.", emoji: "🧥" };
  if (temp < 15) return { recommendation: "가디건이나 얇은 스웨터를 입으세요.", emoji: "🧥" };
  if (temp < 20) return { recommendation: "긴팔 셔츠나 맨투맨이 적당해요.", emoji: "👕" };
  return { recommendation: "반팔과 가벼운 옷차림이 좋아요!", emoji: "👚" };
};
