import { NextResponse } from 'next/server';

// data.go.kr 키는 계정 단위로 공통 → AIRKOREA_SERVICE_KEY 그대로 사용 가능
const KEY = process.env.KMA_SERVICE_KEY || process.env.AIRKOREA_SERVICE_KEY;
const NX = Number(process.env.KMA_NX || '64'); // 호평동(남양주) 근처
const NY = Number(process.env.KMA_NY || '128');
const BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

const FCST_TIMES = [200, 500, 800, 1100, 1400, 1700, 2000, 2300]; // 단기예보 발표 시각(KST)

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const pad4 = (n: number) => {
  const s = `${n}`;
  return s.length >= 4 ? s : '0'.repeat(4 - s.length) + s;
};

function num(v: any): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function kstDate(offsetMs = 0): Date {
  return new Date(Date.now() + 9 * 3600 * 1000 + offsetMs);
}
function ymd(d: Date): string {
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
}

// 발표 후 15분 안전 마진을 두고 가장 최근 base_time
function getBase(): { baseDate: string; baseTime: string } {
  const adjusted = kstDate(-15 * 60 * 1000);
  const hmm = adjusted.getUTCHours() * 100 + adjusted.getUTCMinutes();
  let baseTimeNum: number | undefined = [...FCST_TIMES].reverse().find((t) => t <= hmm);
  if (baseTimeNum == null) {
    const y = kstDate(-24 * 3600 * 1000);
    return { baseDate: ymd(y), baseTime: '2300' };
  }
  return { baseDate: ymd(adjusted), baseTime: pad4(baseTimeNum) };
}

export async function GET() {
  const fallback = { current: null, today: null, tomorrow: null };
  if (!KEY) return NextResponse.json({ ...fallback, error: 'KMA/data.go.kr 키 미설정' });

  try {
    const { baseDate, baseTime } = getBase();
    const url =
      `${BASE}?serviceKey=${KEY}&numOfRows=1000&pageNo=1&dataType=JSON` +
      `&base_date=${baseDate}&base_time=${baseTime}&nx=${NX}&ny=${NY}`;
    const res = await fetch(url, { next: { revalidate: 600 } }); // 10분 캐시
    const data = await res.json();
    const items: any[] = data?.response?.body?.items?.item ?? [];
    if (!items.length) {
      return NextResponse.json({
        ...fallback,
        error: data?.response?.header?.resultMsg || '단기예보 응답 비어있음 (활용신청/승인 대기 가능성)',
      });
    }

    const now = kstDate();
    const todayStr = ymd(now);
    const tomorrowStr = ymd(kstDate(24 * 3600 * 1000));
    const nowHMM = now.getUTCHours() * 100;

    const todayItems = items.filter((i) => i.fcstDate === todayStr);
    const tomorrowItems = items.filter((i) => i.fcstDate === tomorrowStr);

    const pickNearest = (cat: string) => {
      const cs = todayItems.filter((i) => i.category === cat);
      if (!cs.length) return null;
      cs.sort((a, b) => Math.abs(Number(a.fcstTime) - nowHMM) - Math.abs(Number(b.fcstTime) - nowHMM));
      return cs[0]?.fcstValue;
    };

    const tmp = num(pickNearest('TMP'));
    const sky = pickNearest('SKY'); // 1=맑음, 3=구름많음, 4=흐림
    const pty = pickNearest('PTY'); // 0=없음, 1=비, 2=비/눈, 3=눈, ...
    const reh = num(pickNearest('REH')); // 습도

    const tmx = num(todayItems.find((i) => i.category === 'TMX')?.fcstValue);
    const tmn = num(todayItems.find((i) => i.category === 'TMN')?.fcstValue);
    const pops = todayItems
      .filter((i) => i.category === 'POP')
      .map((i) => num(i.fcstValue))
      .filter((v): v is number => v != null);
    const popMax = pops.length ? Math.max(...pops) : null;

    const tmx2 = num(tomorrowItems.find((i) => i.category === 'TMX')?.fcstValue);
    const tmn2 = num(tomorrowItems.find((i) => i.category === 'TMN')?.fcstValue);

    return NextResponse.json({
      current: { temp: tmp, feelsLike: tmp, sky, pty, humidity: reh },
      today: { high: tmx, low: tmn, precipitation: { probability: popMax } },
      tomorrow: { high: tmx2, low: tmn2 },
      baseDate,
      baseTime,
    });
  } catch (e) {
    console.error('[/api/weather]', e);
    return NextResponse.json({ ...fallback, error: String(e) });
  }
}
