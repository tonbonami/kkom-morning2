import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  return new Intl.DateTimeFormat('ko-KR', options).format(date);
}

export function getAirQualityGrade(pm10: number): 1 | 2 | 3 | 4 {
  if (pm10 <= 30) return 1;
  if (pm10 <= 80) return 2;
  if (pm10 <= 150) return 3;
  return 4;
}

export function getAirQualityInfo(grade: 1 | 2 | 3 | 4) {
  switch (grade) {
    case 1:
      return {
        text: "좋음",
        emoji: "😄",
        message: "마음껏 외출하기 좋은 날씨예요!",
        colors: "bg-green-50 border-green-500 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300",
      };
    case 2:
      return {
        text: "보통",
        emoji: "🙂",
        message: "무난한 공기 질이에요.",
        colors: "bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-300",
      };
    case 3:
      return {
        text: "나쁨",
        emoji: "😷",
        message: "외출 시 마스크를 착용하세요.",
        colors: "bg-orange-50 border-orange-500 text-orange-800 dark:bg-orange-900/50 dark:border-orange-700 dark:text-orange-300",
      };
    case 4:
      return {
        text: "매우 나쁨",
        emoji: "😵",
        message: "가급적 외출을 삼가주세요.",
        colors: "bg-red-50 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300",
      };
  }
}

export function getWeatherIcon(condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Snowy') {
  switch (condition) {
    case 'Sunny': return '☀️';
    case 'Cloudy': return '☁️';
    case 'Rainy': return '🌧️';
    case 'Snowy': return '❄️';
  }
}
