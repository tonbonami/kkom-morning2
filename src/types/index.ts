// src/types/index.ts

export interface User {
  로그인코드: string;
  이름: string;
  특별한날_설명?: string;
}

export interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
    conditionText: string;
    emoji: string;
  };
  today: {
    high: number;
    low: number;
  };
}

export interface AirQualityData {
  pm10: {
    value: number;
    grade: 1 | 2 | 3 | 4;
  };
  pm25: {
    value: number;
    grade: 1 | 2 | 3 | 4;
  };
  overall: {
    grade: 1 | 2 | 3 | 4;
    text: '좋음' | '보통' | '나쁨' | '매우나쁨';
    emoji: string;
    color: string;
    message: string;
  };
  dataTime?: string;
  stationName?: string;
}

export interface OutfitGuide {
  mainOutfit: string;
  emoji: string;
  accessories: string[];
  message: string;
  needMask: boolean;
}
