// 매일 아침 KST 07:00에 Vercel Cron으로 호출됨.
// 각자 자기 지역 미세먼지를 개인화해서 발송 — 우댕=호평동, 꼼이=서울 중구.
// 웹푸시(PWA) + APNs(네이티브 앱·애플워치) 둘 다 태움 → 잠긴 폰/워치에도 뜸.
// 'force' 쿼리(=수동 테스트)는 등급 무시하고 무조건 발송 — CRON_SECRET 으로 보호.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { sendApns, keyForName } from '@/lib/apns';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
const CRON_SECRET = process.env.CRON_SECRET || '';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

// 각자 지역 (워치 AirView와 동일한 관측소/권역)
const USERS = [
  { key: 'udaeng', name: '우댕', label: '호평동',   station: '금곡동', region: '경기북부', partner: 'kkomi',  partnerLabel: '서울 중구' },
  { key: 'kkomi',  name: '꼼이', label: '서울 중구', station: '중구',   region: '서울',     partner: 'udaeng', partnerLabel: '호평동' },
] as const;

const VALID_GRADES = ['좋음', '보통', '나쁨', '매우 나쁨'];

// 등급별 이모지 + 한마디
function tone(grade: string): { emoji: string; advice: string } {
  switch (grade) {
    case '매우 나쁨': return { emoji: '🚨', advice: '외출 줄이고 KF94 꼭!' };
    case '나쁨':      return { emoji: '😷', advice: '마스크 꼭 챙겨!' };
    case '보통':      return { emoji: '🌤', advice: '평소대로 외출 OK 👌' };
    case '좋음':      return { emoji: '🌿', advice: '오늘 공기 깨끗해 ☘️' };
    default:          return { emoji: '🌫', advice: '' };
  }
}

type Air = { grade: string; pm10: number | null; pm25: number | null; tomorrow?: { grade: string; summary: string } | null };

async function airFor(origin: string, station: string, region: string): Promise<Air> {
  try {
    const r = await fetch(
      `${origin}/api/air?station=${encodeURIComponent(station)}&region=${encodeURIComponent(region)}`,
      { cache: 'no-store' }
    );
    const j = await r.json();
    return { grade: j?.grade ?? '정보 없음', pm10: j?.pm10 ?? null, pm25: j?.pm25 ?? null, tomorrow: j?.tomorrow ?? null };
  } catch {
    return { grade: '정보 없음', pm10: null, pm25: null, tomorrow: null };
  }
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
  const origin = url.origin;
  const force = url.searchParams.get('force') === '1';

  // 두 지역 공기 한 번씩만 조회 (서로의 지역도 브리핑에 넣으니 재사용)
  const airByKey: Record<string, Air> = {};
  await Promise.all(
    USERS.map(async (u) => { airByKey[u.key] = await airFor(origin, u.station, u.region); })
  );

  // 사용자별 개인화 메시지 — 내 지역 헤드라인 + 상대 지역 한 줄 + 내일 예보
  const payloadByKey: Record<string, { title: string; body: string; url: string } | null> = {};
  for (const u of USERS) {
    const mine = airByKey[u.key];
    const send = force || VALID_GRADES.includes(mine.grade);
    if (!send) { payloadByKey[u.key] = null; continue; }
    const t = tone(mine.grade);
    const partner = airByKey[u.partner];
    const lines: string[] = [];
    if (t.advice) lines.push(t.advice);
    if (partner && VALID_GRADES.includes(partner.grade)) {
      lines.push(`${u.partnerLabel} ${partner.grade}${tone(partner.grade).emoji}`);
    }
    if (mine.tomorrow?.grade && mine.tomorrow.grade !== '정보 없음') lines.push(`내일 ${mine.tomorrow.grade}`);
    payloadByKey[u.key] = {
      title: `${t.emoji} ${u.label} 미세먼지 ${mine.grade}`,
      body: lines.join(' · '),
      url: '/',
    };
  }

  // ── APNs (네이티브 앱 · 애플워치) ──
  const apns: Record<string, boolean> = {};
  await Promise.all(
    USERS.map(async (u) => {
      const p = payloadByKey[u.key];
      apns[u.key] = p ? await sendApns(u.key, p.title, p.body).catch(() => false) : false;
    })
  );

  // ── 웹푸시 (PWA) — 구독자 이름으로 개인 지역 매칭 ──
  const snap = await getDocs(collection(db, 'pushSubscriptions'));
  const web: { name: string; ok: boolean; status?: number }[] = [];
  await Promise.all(
    snap.docs.map(async (d) => {
      const s = d.data() as { name: string; endpoint: string; keys: { p256dh: string; auth: string } };
      const p = payloadByKey[keyForName(s.name)];
      if (!p) return;
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys } as any, JSON.stringify(p));
        web.push({ name: s.name, ok: true });
      } catch (e: any) {
        const status = e?.statusCode;
        if (status === 404 || status === 410) {
          try { await (await import('firebase/firestore')).deleteDoc(d.ref); } catch {}
        }
        web.push({ name: s.name, ok: false, status });
      }
    })
  );

  return NextResponse.json({
    force,
    grades: Object.fromEntries(USERS.map((u) => [u.key, airByKey[u.key]?.grade])),
    apns,
    web: { sent: web.filter((r) => r.ok).length, total: web.length, results: web },
  });
}
