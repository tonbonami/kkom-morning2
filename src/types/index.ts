export interface User {
  id: string;
  name: string;
  pin: string;
}

export interface WeatherData {
  condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy';
  temperature: number;
  feelsLike: number;
  high: number;
  low: number;
}

export interface AirQualityData {
  grade: 1 | 2 | 3 | 4;
  pm10: number;
  pm25: number;
}

export interface OutfitGuide {
  recommendation: string;
  emoji: string;
}
