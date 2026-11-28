import { NextRequest, NextResponse } from 'next/server';
import { kstDate, parseRegionGrade } from '@/lib/airHelpers';

const KEY = process.env.AIRKOREA_SERVICE_KEY;
const DEFAULT_STATION = process.env.AIRKOREA_STATION || '금곡동';
const DEFAULT_REGION = process.env.AIRKOREA_REGION || '경기북부'; // 예보 권역 (남양주=경기북부)
const SVC = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc';

function num(v?: string | null): number | null {
  if (v == null) return null;
  const t = String(v).trim();
  if (t === '' || t === '-' || t === '통신장애' || t === '점검중') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
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

export async function GET(req: NextRequest) {
  // 쿼리로 station/region 받으면 우선, 없으면 env 기본값(금곡동/경기북부)
  const url = new URL(req.url);
  const STATION = url.searchParams.get('station') || DEFAULT_STATION;
  const REGION = url.searchParams.get('region') || DEFAULT_REGION;

  const fallback = {
    grade: '정보 없음',
    pm10: null,
    pm25: null,
    location: STATION,
    hourly: [] as { time: string; pm10: number | null; pm25: number | null }[],
    tomorrow: null as null | { grade: string; summary: string },
  };

  if (!KEY) return NextResponse.json({ ...fallback, error: 'AIRKOREA_SERVICE_KEY 미설정' });

  try {
    const rtUrl =
      `${SVC}/getMsrstnAcctoRltmMesureDnsty?serviceKey=${KEY}&returnType=json` +
      `&stationName=${encodeURIComponent(STATION)}&dataTerm=DAILY&ver=1.3&numOfRows=24&pageNo=1`;
    const fcUrl =
      `${SVC}/getMinuDustFrcstDspth?serviceKey=${KEY}&returnType=json` +
      `&searchDate=${kstDate(0)}&informCode=PM10&numOfRows=10&pageNo=1&ver=1.0`;

    const [rtRes, fcRes] = await Promise.all([
      fetch(rtUrl, { next: { revalidate: 300 } }),
      fetch(fcUrl, { next: { revalidate: 1800 } }), // 예보는 30분 캐시
    ]);
    const rtText = await rtRes.text();
    let rt: any = null;
    try { rt = JSON.parse(rtText); } catch { return NextResponse.json({ ...fallback, error: 'data.go.kr 비JSON 응답' }); }
    const items: any[] = rt?.response?.body?.items ?? [];

    if (!items.length) return NextResponse.json(fallback);

    const cur = items[0];
    // 현재값이 통신장애(null)면 최근 정상값으로 폴백 ('--' 방지)
    const latest = (field: string): number | null => {
      for (const it of items) {
        const v = num(it[field]);
        if (v != null) return v;
      }
      return null;
    };
    const pm10 = latest('pm10Value');
    const pm25 = latest('pm25Value');
    const worst = Math.max(gradePm10(pm10), gradePm25(pm25));

    // 시간별(오래된→최신)
    const hourly = items
      .map((i) => ({ time: i.dataTime, pm10: num(i.pm10Value), pm25: num(i.pm25Value) }))
      .reverse();

    // 내일 예보
    let tomorrow: { grade: string; summary: string } | null = null;
    try {
      const fc = await fcRes.json();
      let fcItems: any[] = fc?.response?.body?.items ?? [];
      const tmrw = kstDate(1);
      // ⚠️ 에어코리아는 하루 첫 예보를 05시쯤 낸다 — 자정~05시엔 「오늘 날짜」 조회가 비어 「준비 중」만 떴다.
      //    그땐 어젯밤(17·23시) 발표분에서 내일 날짜를 찾는다(그 발표가 내일·모레까지 담는다).
      if (!fcItems.some((f) => f.informData === tmrw)) {
        try {
          const prevUrl =
            `${SVC}/getMinuDustFrcstDspth?serviceKey=${KEY}&returnType=json` +
            `&searchDate=${kstDate(-1)}&informCode=PM10&numOfRows=10&pageNo=1&ver=1.0`;
          const prev = await (await fetch(prevUrl, { next: { revalidate: 1800 } })).json();
          const prevItems: any[] = prev?.response?.body?.items ?? [];
          if (prevItems.some((f) => f.informData === tmrw)) fcItems = prevItems;
        } catch (_) {}
      }
      const hit = fcItems.find((f) => f.informData === tmrw) ?? fcItems[fcItems.length - 1];
      if (hit) {
        tomorrow = {
          grade: parseRegionGrade(hit.informGrade, REGION),
          summary: (hit.informOverall || '').replace(/^○\s*/, '').trim(),
        };
      }
    } catch (_) {}

    return NextResponse.json({
      grade: GRADE_TEXT[worst],
      pm10,
      pm25,
      location: STATION,
      dataTime: cur.dataTime ?? null,
      hourly,
      tomorrow,
    });
  } catch (e) {
    console.error('[/api/air] 조회 실패:', e);
    return NextResponse.json({ ...fallback, grade: '조회 실패', error: String(e) });
  }
}
