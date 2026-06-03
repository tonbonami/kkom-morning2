'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WeatherDetailV1, {
  type CurrentBlock,
  type DayBlock,
  type HourlyPoint,
} from '@/components/WeatherDetailV1';

// 화면용 위치 선택 (홈과 동일 구성, localStorage 동기화)
const LOCATIONS = {
  home: { label: '호평동', nx: 64, ny: 128 },
  work: { label: '서울 중구', nx: 60, ny: 127 },
} as const;
type LocKey = keyof typeof LOCATIONS;

// 날씨 등급 → 포차코 기상캐스터 이미지
function pickCaster(sky: string | null, pty: string | null, temp: number | null): string {
  if (pty === '1' || pty === '2') return '/pochacco/cast_rain.png';
  if (pty === '3') return '/pochacco/cast_snow.png';
  if (sky === '1') return '/pochacco/cast_sunny.png';
  if (sky === '3') return '/pochacco/cast_cloudy.png';
  return '/pochacco/cast_overcast.png';
}

// 날씨 → 캐릭터 한 마디
function pickMessage(
  sky: string | null,
  pty: string | null,
  temp: number | null,
  todayPrecip: number | null,
  tomorrowPrecip: number | null
): string {
  if (pty === '1' || pty === '2') return '비 와요 ☔ 우산 꼭 챙겨!';
  if (pty === '3') return '눈 와요 ❄️ 따뜻하게 챙겨 입어!';

  if (temp != null && temp >= 28) return '엄청 더워요 🥵 시원하게 보내요!';
  if (temp != null && temp <= 0) return '꽁꽁 추워요 🥶 따뜻하게!';

  if ((tomorrowPrecip ?? 0) >= 50) return '내일 비 와요 ☔ 미리 우산 챙겨두자!';

  if (sky === '1') return '오늘은 빨래하기 좋은 날 ☘️';
  if (sky === '3') return '구름 좀 있어 🌤 외출엔 무난해요!';
  return '종일 흐려요 ☁️ 우산 가볍게 챙겨도 좋아요';
}

export default function WeatherPage() {
  const router = useRouter();
  const [locKey, setLocKey] = useState<LocKey>('home');
  const [data, setData] = useState<any>(null);

  // 홈에서 선택한 위치 그대로 사용
  useEffect(() => {
    const saved = localStorage.getItem('kkom-loc');
    if (saved === 'home' || saved === 'work') setLocKey(saved);
  }, []);

  useEffect(() => {
    const loc = LOCATIONS[locKey];
    let active = true;
    const url = `/api/weather?nx=${loc.nx}&ny=${loc.ny}`;
    const load = () => fetch(url).then((r) => r.json()).then((w) => { if (active) setData(w); }).catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, [locKey]);

  const loc = LOCATIONS[locKey];

  // 데이터 없을 때도 컴포넌트는 placeholder로 띄움
  const current: CurrentBlock = data?.current || { temp: null, sky: null, pty: null, humidity: null };
  const today: DayBlock = data?.today || { high: null, low: null, sky: null, pty: null, precipProb: null };
  const tomorrow: DayBlock = data?.tomorrow || { high: null, low: null, sky: null, pty: null, precipProb: null };
  const dayAfter: DayBlock | undefined = data?.dayAfter;
  const hourly: HourlyPoint[] = data?.hourly || [];

  const casterSrc = pickCaster(current.sky, current.pty, current.temp);
  const message = pickMessage(
    current.sky,
    current.pty,
    current.temp,
    today.precipProb,
    tomorrow.precipProb
  );

  return (
    <WeatherDetailV1
      location={loc.label}
      current={current}
      today={today}
      tomorrow={tomorrow}
      dayAfter={dayAfter}
      hourly={hourly}
      pochaccoSrc={casterSrc}
      pochaccoMessage={message}
      onBack={() => router.push('/')}
    />
  );
}
