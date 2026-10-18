// 달력 일정 → 꼼톡 카드 (우댕 선택 2026-10-19, 「우리 쓰임새로 본 기능」 — 달력 하루 전 알림을 꼼톡에).
//   매일 KST 20:00(vercel.json 크론). 내일 시작하는 일정은 모두 「내일」 카드, '같이' 일정은 3일 전·2일 전에도 하루 한 장.
//   카드 = messages 문서 { from: '꼼모닝', kind: 'calendar', text } — 꼼톡이 가운데 작은 카드로 그린다(ChatPanel).
//   멱등: 문서 id = cal-{일정id}-{오늘} — 크론이 두 번 돌아도 한 장. 둘 다 폰 알림(APNs)도 한 번.
//   왜 따로: 기존 notify-calendar-reminders(아침 8시)는 웹 푸시뿐인데 둘 다 웹 구독이 없어 사실상 안 가고 있었다.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendApns } from '@/lib/apns';

const CRON_SECRET = process.env.CRON_SECRET || '';

function authorized(req: NextRequest): boolean {
  const h = req.headers.get('authorization') || '';
  if (h === `Bearer ${CRON_SECRET}`) return true;
  const key = new URL(req.url).searchParams.get('key');
  return !!(key && CRON_SECRET && key === CRON_SECRET);
}

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
const WHO: Record<string, string> = { kkomi: '꼼이', udaeng: '우댕', together: '우리' };

type Ev = { title?: string; owner?: string; startDate?: string; startTime?: string | null; location?: string | null };

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const dry = sp.get('dry') === '1';   // 확인용: 쓰지도 보내지도 않고 무엇을 할지만
  // 시험용 날짜 바꾸기는 dry일 때만(실제로 쓰는 실행은 늘 오늘 기준)
  const today = dry && /^\d{4}-\d{2}-\d{2}$/.test(sp.get('today') || '') ? (sp.get('today') as string) : kstToday();

  const snap = await getDocs(collection(db, 'calendarEvents'));
  const cards: { id: string; text: string; title: string; body: string }[] = [];
  snap.forEach((s) => {
    const e = s.data() as Ev;
    if (!e.startDate) return;
    let d = 0;
    if (e.startDate === addDays(today, 1)) d = 1;
    else if (e.owner === 'together' && (e.startDate === addDays(today, 2) || e.startDate === addDays(today, 3))) {
      d = e.startDate === addDays(today, 2) ? 2 : 3;
    }
    if (!d) return;
    const when = d === 1 ? '내일' : `${d}일 뒤`;
    const who = WHO[e.owner || 'together'] || '';
    const title = (e.title || '일정').trim();
    const extra = [e.startTime || '', e.location || ''].filter(Boolean).join(' · ');
    const named = !who || title.includes(who) ? title : `${who} ${title}`;   // 「꼼이 꼼이 머리하는날」 같은 겹침 방지
    cards.push({
      id: `cal-${s.id}-${today}`,
      text: `📅 ${when} · ${named}${extra ? ` (${extra})` : ''}`,
      title: `📅 ${when} 일정`,
      body: `${named}${extra ? ` · ${extra}` : ''}`,
    });
  });

  if (dry) return NextResponse.json({ ok: true, today, dry: true, cards });

  const results: { id: string; written: boolean; pushed?: boolean[] }[] = [];
  for (const c of cards) {
    const ref = doc(db, 'messages', c.id);
    if ((await getDoc(ref)).exists()) { results.push({ id: c.id, written: false }); continue; }
    await setDoc(ref, { from: '꼼모닝', kind: 'calendar', text: c.text, createdAt: serverTimestamp() });
    const pushed = await Promise.all(['udaeng', 'kkomi'].map((k) => sendApns(k, c.title, c.body).catch(() => false)));
    results.push({ id: c.id, written: true, pushed });
  }
  return NextResponse.json({ ok: true, today, results });
}
