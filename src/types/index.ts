export interface User {
  로그인코드: string;
  이름: string;
  특별한날_설명?: string;
}

export type TempSource = 'TMP' | 'T1H' | 'N/A' | 'ERROR';
export type PrecipitationType = 'rain' | 'snow' | 'sleet' | null;

export interface PrecipitationSummary {
  type: PrecipitationType;
  typeText: string;
  emoji: string;
  probability: number | null;
  startTime: string | null;
  startTimeKor: string | null;
}

export interface WeatherData {
  current: {
    temp: number | null;
    feelsLike: number | null;
    tempSource?: TempSource;
    sky: string | null;
    precipitation: string | null;
  };
  today: {
    high: number | null;
    low: number | null;
    precipitation?: PrecipitationSummary;
  };
  tomorrow?: {
    precipitation?: PrecipitationSummary;
  };
  location?: string;
  timestamp?: string;
  isFallback?: boolean;
  error?: string;
}

export type AirGrade = '좋음' | '보통' | '나쁨' | '매우 나쁨' | '정보 없음' | '조회 실패';

export interface AirQualityData {
  pm10: number | null;
  pm25: number | null;
  grade: AirGrade;
  location?: string;
  dataTime?: string;
  error?: string;
}

export interface OutfitGuide {
  text: string;
  icon: string;
}

export type PochaccoImageKey = 'cold' | 'hot' | 'normal';

export interface DailyMessage {
  hasMessage: boolean;
  message: string;
  error?: string;
}

export interface TodayQuiz {
  hasQuiz: boolean;
  question: string;
  error?: string;
}

export interface QuizResult {
  correct: boolean;
  message: string;
  memory?: string;
  error?: string;
}

// ✅ ========== 추억 사진 타입 (신규 추가) ========== ✅
export interface MemoryPhoto {
  date: string;        // 'YYYY-MM-DD'
  title: string;       // 사진 제목
  imageUrl: string;    // Google Drive 이미지 URL
  description: string; // 사진 설명
}

export interface MemoryPhotosData {
  hasPhotos: boolean;
  photos: MemoryPhoto[];
}
// ✅ ============================================== ✅

export interface InitialDataResponse {
  weather: WeatherData;
  air: AirQualityData;
  outfit: OutfitGuide;
  pochaccoImage: PochaccoImageKey;
  dailyMessage: DailyMessage;
  todayQuiz: TodayQuiz;
  memoryPhotos?: MemoryPhotosData;  // ✅ 신규 필드 추가
}
