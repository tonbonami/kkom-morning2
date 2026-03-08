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

// ========== 추억 사진 타입 ==========
export interface MemoryPhoto {
  date: string;
  title: string;
  imageUrl: string;
  description: string;
}

export interface MemoryPhotosData {
  hasPhotos: boolean;
  photos: MemoryPhoto[];
}

// ========== 아뜰리에 드 꼼 & 테오 타입 ==========

/** 문장 타입: 일반 / 문단 시작 / 챕터 구분 */
export type NovelSentenceType = 'normal' | 'paragraph' | 'chapter';

/** 소설 상태 */
export type NovelStatus = 'active' | 'completed';

/** 작성자 표준 이름 (Apps Script normalizeAuthor와 일치) */
export type NovelAuthor = '테오' | '꼼이';

/** 소설 문장 한 줄 */
export interface NovelSentence {
  bookId: string;
  author: NovelAuthor | string;
  text: string;
  type: NovelSentenceType;
  timestamp: string;       // 'YYYY-MM-DD HH:mm:ss'
  order: number;
  likes: number;
}

/** 소설 한 권 */
export interface Novel {
  bookId: string;
  title: string;
  status: NovelStatus;
  createdAt: string;       // 'YYYY-MM-DD'
  coverColor: string;      // hex color (예: '#FFF5E1')
  fontStyle: string;       // 'serif' | 'sans-serif' 등
  sentences: NovelSentence[];
}

/** 표지 이미지 */
export interface CoverImage {
  fileName: string;        // '/covers/autumn.jpg'
  displayName: string;     // '🍂 가을'
  category: string;        // 'novel' | 'poem'
}

/** getNovelData / getInitialData 아뜰리에 응답 */
export interface NovelDataResponse {
  activeNovels: Novel[];
  completedNovels: Novel[];
  coverLibrary: CoverImage[];
}

/** createNovel 성공 응답 */
export interface CreateNovelResponse {
  success: boolean;
  bookId?: string;
  title?: string;
  status?: NovelStatus;
  createdAt?: string;
  coverColor?: string;
  fontStyle?: string;
  sentences?: NovelSentence[];
  error?: string;
}

/** addSentence 성공 응답 */
export interface AddSentenceResponse {
  success: boolean;
  bookId?: string;
  author?: string;
  text?: string;
  type?: NovelSentenceType;
  timestamp?: string;
  order?: number;
  likes?: number;
  error?: string;
}

/** completeNovel 응답 */
export interface CompleteNovelResponse {
  success: boolean;
  bookId?: string;
  status?: string;
  error?: string;
}

/** likeSentence 응답 */
export interface LikeSentenceResponse {
  success: boolean;
  bookId?: string;
  order?: number;
  likes?: number;
  error?: string;
}

// ========== InitialData 응답 (아뜰리에 포함) ==========

export interface InitialDataResponse {
  weather: WeatherData;
  air: AirQualityData;
  outfit: OutfitGuide;
  pochaccoImage: PochaccoImageKey;
  dailyMessage: DailyMessage;
  todayQuiz: TodayQuiz;
  memoryPhotos?: MemoryPhotosData;
  activeNovels?: Novel[];
  completedNovels?: Novel[];
  coverLibrary?: CoverImage[];
}
