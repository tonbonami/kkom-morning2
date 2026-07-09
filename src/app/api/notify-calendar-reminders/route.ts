// 매일 KST 08:00 — 캘린더 일정 알림 배치.
// remindDaysBefore(예: [1,7])에 맞춰 '1일 전 / 1주일 전' 일정을 양쪽에게 push.
// 즉 오늘로부터 D일 뒤(D ∈ remindDaysBefore)에 시작하는 일정을 알림.
// Vercel cron: 매일 23:00 UTC = KST 08:00.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
const CRON_SECRET = process.env.CRON_SECRET || '';
webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

function authorized(req: NextRequest): boolean {
  const h = req.headers.get('authorization') || '';
  if (h === `Bearer ${CRON_SECRET}`) return true;
  const key = new URL(req.url).searchParams.get('key');
  return !!(key && CRON_SECRET && key === CRON_SECRET);
}

// KST 오늘 'YYYY-MM-DD'
function kstToday(): string {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}-${String(kst.getUTCDate()).padStart(2, '0')}`;
}
function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
const OWNER_LABEL: Record<string, string> = { kkomi: '꼼이', udaeng: '우댕', together: '함께' };

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest) { return run(req); }

async function run(req: NextRequest) {
  const force = new URL(req.url).searchParams.get('force') === '1';
  if (!authorized(req) && !force) {
    // Vercel cron은 Authorization 헤더로 오므로 authorized 통과. 그 외는 차단.
    if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = kstToday();
  const snap = await getDocs(collection(db, 'calendarEvents'));

  // 오늘로부터 1일 뒤 / 7일 뒤에 시작하는 일정 찾기
  const targets: { title: string; owner: string; when: string; daysBefore: number }[] = [];
  snap.forEach((docSnap) => {
    const e = docSnap.data() as { title?: string; owner?: string; startDate?: string; remindDaysBefore?: number[] };
    if (!e.startDate || !Array.isArray(e.remindDaysBefore)) return;
    for (const d of e.remindDaysBefore) {
      if (addDays(today, d) === e.startDate) {
        targets.push({ title: e.title || '일정', owner: e.owner || 'together', when: d === 1 ? '내일' : `${d}일 뒤`, daysBefore: d });
      }
    }
  });

  if (targets.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  // 양쪽(우댕/꼼이) 구독으로 발송
  const results: any[] = [];
  for (const to of ['우댕', '꼼이']) {
    const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
    if (!subSnap.exists()) continue;
    const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };
    for (const t of targets) {
      const payload = JSON.stringify({
        title: `🔔 ${t.when} 일정 있어`,
        body: `${OWNER_LABEL[t.owner] || ''} · ${t.title}`,
        url: '/calendar',
      });
      try {
        await webpush.sendNotification(s as any, payload);
        results.push({ to, title: t.title, ok: true });
      } catch (e: any) {
        const status = e?.statusCode;
        if (status === 404 || status === 410) { try { await deleteDoc(subSnap.ref); } catch {} }
        results.push({ to, title: t.title, ok: false, status });
      }
    }
  }
  return NextResponse.json({ ok: true, sent: results.filter((r) => r.ok).length, results });
}
