// 칭찬 스티커/칭찬 조르기 푸시.
// 기존 /api/bump 구조를 그대로 따라 새 기능만 독립 API로 붙였습니다.
// Claude 참고: 방해 금지 시간은 적용하지 않습니다. 사용자가 직접 누르는 즉시성 액션이라 퀵메시지와 같은 UX입니다.

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

function clip(text: string, fallback: string): string {
  const trimmed = text.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}...` : trimmed;
}

type PraiseNotifyBody = {
  kind?: 'praise' | 'request';
  from?: string;
  to?: string;
  reason?: string;
  stickerEmoji?: string;
  stickerCount?: number;
};

export async function POST(req: NextRequest) {
  let body: PraiseNotifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { from, to, reason = '', kind = 'praise' } = body;
  if (!to || !from) {
    return NextResponse.json({ error: 'to/from required' }, { status: 400 });
  }

  const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
  if (!subSnap.exists()) {
    return NextResponse.json({ ok: false, skipped: 'no subscription for ' + to });
  }

  const stickerEmoji = body.stickerEmoji || '⭐';
  const stickerCount = Math.max(1, Math.min(10, Math.floor(body.stickerCount || 1)));
  const isRequest = kind === 'request';
  const payload = JSON.stringify({
    title: isRequest
      ? `🥺 ${withSubjectParticle(from)} 칭찬을 조르고 있어`
      : `${stickerEmoji} ${withSubjectParticle(from)} 칭찬 스티커 ${stickerCount}개를 붙였어`,
    body: isRequest
      ? clip(reason, '나 이거 했으니까 칭찬해주세요오')
      : clip(reason, '꼼모닝에서 칭찬장을 열어봐'),
    url: '/praise',
  });

  const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

  try {
    await webpush.sendNotification(s as any, payload);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.statusCode;
    if (status === 404 || status === 410) {
      try { await deleteDoc(subSnap.ref); } catch {}
    }
    return NextResponse.json({ ok: false, status, err: String(e?.body || e) }, { status: 200 });
  }
}
