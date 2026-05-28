// src/types/index.ts

// ========== 사용자 타입 ==========
export interface User {
  로그인코드: string;
  이름: string;
  name?: string; // 일부 컴포넌트 호환
  특별한날_설명?: string;
}

// ========== 날씨 관련 타입 ==========
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
  // 기존 홈 구조
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

  // 대시보드/기존 컴포넌트 호환용 평면 필드
  temperature?: number | null;
  feelsLike?: number | null;
  condition?: string | null;
  high?: number | null;
  low?: number | null;
}

// ========== 대기질 타입 ==========
export type AirGrade =
  | 1
  | 2
  | 3
  | 4
  | '좋음'
  | '보통'
  | '나쁨'
  | '매우 나쁨'
  | '정보 없음'
  | '조회 실패';

export interface AirQualityData {
  pm10: number | null;
  pm25: number | null;
  grade: any; // 숫자형/문자형 혼용 복구용
  location?: string;
  dataTime?: string;
  error?: string;
  aqi?: number | null;
}

// ========== 옷차림 ==========
export interface OutfitGuide {
  // 기존 구조
  text: string;
  icon: string;

  // 일부 컴포넌트 호환
  emoji?: string;
  recommendation?: string;
}

// ========== 포차코 ==========
export type PochaccoImageKey = 'cold' | 'hot' | 'normal';

// ========== 편지 / 퀴즈 ==========
export interface DailyMessage {
  hasMessage: boolean;
  message: string;
  error?: string;

  // 일부 홈 응답/컴포넌트 호환
  author?: string;
  timestamp?: string;
}

export interface TodayQuiz {
  hasQuiz: boolean;
  question: string;
  error?: string;

  // 일부 홈 응답/컴포넌트 호환
  correctAnswer?: string;
  userAnswer?: string | null;
  isCorrect?: boolean | null;
}

export interface QuizData {
  id: string;
  question: string;
  type: 'text';
}

export interface QuizResult {
  // 구버전
  correct?: boolean;
  message?: string;
  memory?: string;
  error?: string;

  // 신버전 UI 호환
  isCorrect?: boolean;
  explanation?: string;
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

// ========== 아뜰리에 공통 타입 ==========
export type AtelierAuthor = '테오' | '꼼이';

// ========== 소설 타입 ==========
export type NovelSentenceType = 'normal' | 'paragraph' | 'chapter';
export type NovelStatus = 'active' | 'completed';

export interface NovelSentence {
  bookId: string;
  order: number;
  author: AtelierAuthor | string;
  text: string;
  type: NovelSentenceType;
  timestamp: string; // 'YYYY-MM-DD HH:mm:ss'
  likes: number;
}

export interface Novel {
  bookId: string;
  title: string;
  status: NovelStatus;
  createdAt: string; // 백엔드/기존 혼용 수용
  coverColor: string;
  fontStyle: string;
  sentences: NovelSentence[];

  // v10.8 대응
  nextTurn?: AtelierAuthor | '';
  firstTurnOpen?: boolean;
}

export interface CoverImage {
  category: string;

  // 기존 UI 계약
  fileName?: string;
  displayName?: string;

  // 신규 백엔드 계약
  id?: string;
  url?: string;
  title?: string;
}

export interface NovelDataResponse {
  activeNovels: Novel[];
  completedNovels: Novel[];
  coverLibrary: CoverImage[];
}

export interface CreateNovelResponse {
  success: boolean;
  bookId?: string;
  title?: string;
  status?: NovelStatus;
  createdAt?: string;
  coverColor?: string;
  fontStyle?: string;
  error?: string;
}

export interface AddSentenceResponse {
  success: boolean;
  bookId?: string;
  order?: number;
  author?: AtelierAuthor | string;
  text?: string;
  type?: NovelSentenceType;
  timestamp?: string;
  likes?: number;
  error?: string;
}

export interface CompleteNovelResponse {
  success: boolean;
  bookId?: string;
  status?: NovelStatus;
  error?: string;
}

export interface LikeSentenceResponse {
  success: boolean;
  bookId?: string;
  order?: number;
  likes?: number;
  error?: string;
}

// ========== 홈 초기 데이터 응답 ==========
// 기존 구조 유지 + 확장 필드 허용
export interface InitialDataResponse {
  weather: WeatherData;
  air: AirQualityData;
  outfit: OutfitGuide | string;
  pochaccoImage?: PochaccoImageKey;
  dailyMessage: DailyMessage;
  todayQuiz: TodayQuiz;
  memoryPhotos?: MemoryPhotosData | Array<{
    id: string;
    url: string;
    date: string;
    caption: string;
    location: string;
    uploadedBy: string;
  }>;

  // 아뜰리에 데이터
  activeNovels?: Novel[];
  completedNovels?: Novel[];
  coverLibrary?: CoverImage[];
}

// ========== 시 관련 타입 ==========
export interface PoetryTheme {
  weekId: string;
  theme: string;
  setBy: AtelierAuthor;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
}

export interface Poem {
  poemId: string;
  weekId: string;
  author: AtelierAuthor;
  title: string;
  body: string;
  status: 'writing' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface PoetryWeekArchive {
  theme: PoetryTheme;
  poems: Poem[];
}

export interface PoetryNextWeekInfo {
  nextAuthor: AtelierAuthor;
  lastTheme: string;
  lastWeekId: string;
}

export interface PoetryDataResponse {
  activeTheme: PoetryTheme | null;
  teoPoem: Poem | null;
  kkomiPoem: Poem | null;
  pastWeeks: PoetryWeekArchive[];

  // 신버전
  nextWeekInfo?: PoetryNextWeekInfo;

  // 구버전 호환
  nextSetBy?: AtelierAuthor;
}

export interface SavePoemResponse {
  success: boolean;
  poemId?: string;
  title?: string;
  body?: string;
  status?: string;
  updatedAt?: string;
  error?: string;
}

export interface CompletePoemResponse {
  success: boolean;
  poemId?: string;
  status?: string;
  completedAt?: string;
  error?: string;
}

export interface CompletePoetryThemeResponse {
  success: boolean;
  weekId?: string;
  status?: string;
  error?: string;
}

export interface CreatePoetryThemeResponse {
  success: boolean;
  weekId?: string;
  theme?: string;
  setBy?: AtelierAuthor;
  startDate?: string;
  error?: string;
}