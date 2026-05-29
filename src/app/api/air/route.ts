import { NextResponse } from 'next/server';

const KEY = process.env.AIRKOREA_SERVICE_KEY;
const STATION = process.env.AIRKOREA_STATION || '금곡동';
const BASE =
  'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty';

// 통신장애/점검중/'-' 등을 null로 정리
function num(v?: string | null): number | null {
  if (v == null) return null;
  const t = String(v).trim();
  if (t === '' || t === '-' || t === '통신장애' || t === '점검중') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// 환경부 한국 기준 등급 (미세미세와 동일 기준)
function gradePm10(v: number | null): number {
  if (v == null) return 0;
  if (v <= 30) return 1;
  if (v <= 80) return 2;
  if (v <= 150) return 3;
  return 4;
}
function gradePm25(v: number | null): number {
  if (v == null) return 0;
  if (v <= 15) return 1;
  if (v <= 35) return 2;
  if (v <= 75) return 3;
  return 4;
}
const GRADE_TEXT = ['정보 없음', '좋음', '보통', '나쁨', '매우 나쁨'];

export async function GET() {
  const fallback = { grade: '정보 없음', pm10: null, pm25: null, location: STATION };

  if (!KEY) {
    return NextResponse.json({ ...fallback, error: 'AIRKOREA_SERVICE_KEY 미설정' });
  }

  try {
    const url =
      `${BASE}?serviceKey=${KEY}&returnType=json` +
      `&stationName=${encodeURIComponent(STATION)}&dataTerm=DAILY&ver=1.3&numOfRows=1&pageNo=1`;

    // 에어코리아는 1시간 단위 갱신 → 5분 캐시
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();
    const item = data?.response?.body?.items?.[0];

    if (!item) return NextResponse.json(fallback);

    const pm10 = num(item.pm10Value);
    const pm25 = num(item.pm25Value);
    const worst = Math.max(gradePm10(pm10), gradePm25(pm25));

    return NextResponse.json({
      grade: GRADE_TEXT[worst],
      pm10,
      pm25,
      location: STATION,
      dataTime: item.dataTime ?? null,
    });
  } catch (e) {
    console.error('[/api/air] 에어코리아 조회 실패:', e);
    return NextResponse.json({ ...fallback, grade: '조회 실패', error: String(e) });
  }
}
