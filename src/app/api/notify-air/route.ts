// 매일 아침 KST 07:30에 Vercel Cron으로 호출됨.
// AirKorea 현재/예보 등급을 보고 '나쁨' 이상이면 두 사람에게 푸시.
// 'force' 쿼리(=수동 테스트)는 등급 무시하고 무조건 발송 — CRON_SECRET 으로 보호.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
const CRON_SECRET = process.env.CRON_SECRET || '';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

// 등급별 알림 문구 — grade별로 톤·이모지 다르게
function makePayload(grade: string, tomorrowSummary?: string | null) {
  let title: string;
  let advice: string;
  switch (grade) {
    case '매우 나쁨':
      title = '🚨 미세먼지 매우 나쁨';
      advice = '외출 줄이고 KF94 꼭!';
      break;
    case '나쁨':
      title = '😷 미세먼지 나쁨';
      advice = '마스크 꼭 챙겨!';
      break;
    case '보통':
      title = '🌤 미세먼지 보통';
      advice = '평소대로 외출 OK 👌';
      break;
    case '좋음':
      title = '🌿 미세먼지 좋음';
      advice = '오늘 공기 깨끗해 ☘️';
      break;
    default:
      title = `미세먼지 ${grade}`;
      advice = '';
  }
  const lines = [
    `오늘 ${grade}${advice ? ` — ${advice}` : ''}`,
    tomorrowSummary ? `내일: ${tomorrowSummary}` : null,
  ].filter(Boolean) as string[];
  return { title, body: lines.join(' · '), url: '/' };
}

function authorized(req: NextRequest): boolean {
  // Vercel Cron이 자동으로 'Authorization: Bearer <CRON_SECRET>' 헤더를 붙임
  const h = req.headers.get('authorization') || '';
  if (h === `Bearer ${CRON_SECRET}`) return true;
  // 수동 테스트용: ?key=...
  const key = new URL(req.url).searchParams.get('key');
  if (key && CRON_SECRET && key === CRON_SECRET) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  // 현재 등급 가져오기 — 우리 자체 /api/air 호출
  const origin = url.origin;
  const airRes = await fetch(`${origin}/api/air`, { cache: 'no-store' });
  const air = await airRes.json();
  const grade = air?.grade as string | undefined;
  const tomorrow = air?.tomorrow?.summary || (air?.tomorrow?.grade ? `${air.tomorrow.grade} 예상` : null);

  // 등급 판정 — 나쁨/매우 나쁨 또는 force
  // B안: 좋음/보통도 매일 발송. 단 '정보 없음' / '조회 실패' 같은 무효 등급은 건너뜀.
  const validGrades = ['좋음', '보통', '나쁨', '매우 나쁨'];
  const shouldSend = force || (!!grade && validGrades.includes(grade));
  if (!shouldSend) {
    return NextResponse.json({ sent: 0, reason: 'no valid grade', grade });
  }

  const payload = makePayload(grade || '나쁨', tomorrow);
  const payloadStr = JSON.stringify(payload);

  // Firestore에서 구독 목록 가져오기
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
        // 410 Gone = 구독 만료 → 자동 정리
        const status = e?.statusCode;
        if (status === 404 || status === 410) {
          try { await (await import('firebase/firestore')).deleteDoc(d.ref); } catch {}
        }
        results.push({ name: s.name, ok: false, status, err: String(e?.body || e) });
      }
    })
  );

  return NextResponse.json({ sent: results.filter((r) => r.ok).length, total: results.length, grade, force, results });
}
