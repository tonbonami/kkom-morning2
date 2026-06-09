// 새 레시피 푸시. 추가한 사람의 partner에게 즉시 알림.

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

function clip(text: string, max = 50): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
}

export async function POST(req: NextRequest) {
  let body: { from?: string; to?: string; title?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }
  const { from, to, title = '' } = body;
  if (!to || !from) return NextResponse.json({ error: 'to/from required' }, { status: 400 });

  const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
  if (!subSnap.exists()) return NextResponse.json({ ok: false, skipped: 'no subscription for ' + to });
  const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

  const payload = JSON.stringify({
    title: `🍳 ${withSubjectParticle(from)} 새 레시피를 올렸어`,
    body: clip(title, 60) || '우리의 레시피에서 확인해줘 ✨',
    url: '/recipes',
  });

  try {
    await webpush.sendNotification(s as any, payload);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.statusCode;
    if (status === 404 || status === 410) { try { await deleteDoc(subSnap.ref); } catch {} }
    return NextResponse.json({ ok: false, status, err: String(e?.body || e) }, { status: 200 });
  }
}
