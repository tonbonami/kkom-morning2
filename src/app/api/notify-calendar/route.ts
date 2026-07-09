// 캘린더 일정 추가 시 상대에게 즉시 알림.
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

function withSubjectParticle(name: string): string {
  if (!name) return name;
  const last = name.charCodeAt(name.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return name + '이가';
  const hasFinal = (last - 0xAC00) % 28 !== 0;
  return name + (hasFinal ? '이가' : '가');
}
function clip(t: string, max = 50): string { const s = t.trim(); return s.length > max ? s.slice(0, max) + '...' : s; }

export async function POST(req: NextRequest) {
  let body: { from?: string; to?: string; title?: string; owner?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }
  const { from, to, title = '' } = body;
  if (!to || !from) return NextResponse.json({ error: 'to/from required' }, { status: 400 });

  const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
  if (!subSnap.exists()) return NextResponse.json({ ok: false, skipped: 'no sub' });
  const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

  const payload = JSON.stringify({
    title: `📅 ${withSubjectParticle(from)} 일정을 추가했어`,
    body: clip(title, 60) || '캘린더에서 확인해줘 ✨',
    url: '/calendar',
  });
  try {
    await webpush.sendNotification(s as any, payload);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.statusCode;
    if (status === 404 || status === 410) { try { await deleteDoc(subSnap.ref); } catch {} }
    return NextResponse.json({ ok: false, status }, { status: 200 });
  }
}
