// 매일 KST 17:50 — 저녁 미세먼지 알림 (퇴근/외출 전)
// 평일(월~금): 서울 중구 (직장 근처)
// 주말(토·일): 금곡동 (집)
//
// '나쁨' 이상이면 발송. 수동 테스트는 ?key=CRON_SECRET&force=1

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
const CRON_SECRET = process.env.CRON_SECRET || '';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

function authorized(req: NextRequest): boolean {
  const h = req.headers.get('authorization') || '';
  if (h === `Bearer ${CRON_SECRET}`) return true;
  const key = new URL(req.url).searchParams.get('key');
  if (key && CRON_SECRET && key === CRON_SECRET) return true;
  return false;
}

// 평일/주말 → 측정소/권역
function pickLocation(): { station: string; region: string; label: string; isWeekend: boolean } {
  // KST 기준 요일 (UTC + 9h)
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const day = kst.getUTCDay(); // 0=일, 1=월, ..., 6=토
  const isWeekend = day === 0 || day === 6;
  if (isWeekend) {
    return { station: '금곡동', region: '경기북부', label: '금곡동', isWeekend: true };
  }
  return { station: '중구', region: '서울', label: '서울 중구', isWeekend: false };
}

function makePayload(grade: string, locationLabel: string, isWeekend: boolean) {
  let emoji: string;
  let tip: string;
  switch (grade) {
    case '매우 나쁨':
      emoji = '🚨';
      tip = isWeekend ? '외출 줄이고 KF94 꼭!' : '퇴근길 외출 줄이고 KF94 꼭!';
      break;
    case '나쁨':
      emoji = '😷';
      tip = isWeekend ? '저녁 외출하면 마스크 꼭 챙겨!' : '퇴근길 마스크 꼭 챙겨!';
      break;
    case '보통':
      emoji = '🌤';
      tip = isWeekend ? '평소대로 외출 OK 👌' : '퇴근길 무난해 👌';
      break;
    case '좋음':
      emoji = '🌿';
      tip = isWeekend ? '공기 깨끗해 ☘️ 산책하기 좋아' : '퇴근길 공기 깨끗해 ☘️';
      break;
    default:
      emoji = '🌤';
      tip = '';
  }
  return {
    title: `${emoji} ${locationLabel} 미세먼지 ${grade}`,
    body: tip,
    url: '/',
  };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  const { station, region, label, isWeekend } = pickLocation();

  // /api/air 에 station/region 넘겨서 호출
  const airRes = await fetch(
    `${url.origin}/api/air?station=${encodeURIComponent(station)}&region=${encodeURIComponent(region)}`,
    { cache: 'no-store' }
  );
  const air = await airRes.json();
  const grade = air?.grade as string | undefined;

  // B안: 좋음/보통도 매일 발송.
  const validGrades = ['좋음', '보통', '나쁨', '매우 나쁨'];
  const shouldSend = force || (!!grade && validGrades.includes(grade));
  if (!shouldSend) {
    return NextResponse.json({ sent: 0, reason: 'no valid grade', station: label, grade });
  }

  const payload = makePayload(grade || '나쁨', label, isWeekend);
  const payloadStr = JSON.stringify(payload);

  const snap = await getDocs(collection(db, 'pushSubscriptions'));
  const results: { name: string; ok: boolean; status?: number; err?: string }[] = [];

  await Promise.all(
    snap.docs.map(async (d) => {
      const s = d.data() as { name: string; endpoint: string; keys: { p256dh: string; auth: string } };
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys } as any,
          payloadStr
        );
        results.push({ name: s.name, ok: true });
      } catch (e: any) {
        const status = e?.statusCode;
        if (status === 404 || status === 410) {
          try { await deleteDoc(d.ref); } catch {}
        }
        results.push({ name: s.name, ok: false, status, err: String(e?.body || e) });
      }
    })
  );

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    total: results.length,
    station: label,
    grade,
    force,
    results,
  });
}
