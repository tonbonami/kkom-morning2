// 다이어리 ♥·한마디 알림 — 상대 장에 마음을 누르거나 한마디를 남기면(주인이 답글을 달아도) 상대에게 바로 알린다.
// 우댕 2026-11-17: 「이거 내가 답글 남기거나 하트는 못해?」
// 앱(네이티브)은 APNs, 웹은 웹푸시. ♥ 는 눌렀다 뗐다 해도 20초에 한 번만 알린다.
// 알림을 눌러도 앱은 홈으로 열린다(APNs 에 주소가 없다) — 그래서 본문에 날짜를 넣는다.
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendApns, keyForName } from '@/lib/apns';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

const RTDB =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app';
const HEART_COOLDOWN_MS = 20_000;
const PEOPLE = ['우댕', '꼼이'];

function clip(t: string, max = 60): string { const s = t.trim().replace(/\s+/g, ' '); return s.length > max ? s.slice(0, max) + '…' : s; }

export async function POST(req: NextRequest) {
  let body: { kind?: string; from?: string; to?: string; date?: string; owner?: string; text?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }
  const { from, to, owner } = body;
  const kind = body.kind === 'heart' ? 'heart' : 'text';
  const date = typeof body.date === 'string' && /^\d{4}-\d\d-\d\d$/.test(body.date) ? body.date : null;
  if (!from || !to || !owner || !date || !PEOPLE.includes(from) || !PEOPLE.includes(to) || !PEOPLE.includes(owner) || from === to) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const toKey = keyForName(to);

  if (kind === 'heart') {
    const metaUrl = `${RTDB}/pushMeta/${toKey}/lastDiaryHeart.json`;
    try {
      const last = (await (await fetch(metaUrl, { cache: 'no-store' })).json()) as number | null;
      if (last && Date.now() - last < HEART_COOLDOWN_MS) return NextResponse.json({ ok: true, throttled: true });
      await fetch(metaUrl, { method: 'PUT', body: JSON.stringify(Date.now()) });
    } catch { /* 못 재도 보낸다 */ }
  }

  const [, m, d] = date.split('-').map(Number);
  const day = `${m}월 ${d}일`;
  const whose = owner === to ? '네' : '내';                 // 받는 사람 장이면 「네 일기」, 보낸 사람 장이면 「내 일기」
  const text = clip(String(body.text ?? ''));
  const line = kind === 'heart'
    ? `${day} ${whose} 일기에 ♥ 남겼어`
    : `${day} ${whose} 일기에 ${owner === to ? '한마디' : '답글'}: ${text}`;

  const apnsOk = await sendApns(toKey, from, line, { sender: from, threadId: 'diary' }).catch(() => false);

  // 웹(PWA)으로 보는 경우 — 누르면 그 장으로 간다.
  let web: unknown = 'no sub';
  try {
    const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
    if (subSnap.exists()) {
      const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const url = `/diary?d=${date}&who=${keyForName(owner)}`;
      try {
        await webpush.sendNotification(s as never, JSON.stringify({ title: `📔 ${from}`, body: line, url }));
        web = true;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) { try { await deleteDoc(subSnap.ref); } catch {} }
        web = status ?? false;
      }
    }
  } catch { web = false; }

  return NextResponse.json({ ok: true, apns: apnsOk, web });
}
