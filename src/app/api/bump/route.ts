// '보고싶어/사랑해/뽀뽀/잘자' 한 번-탭 푸시 (Bump) — 상대 폰에 즉시 발송.
// body { from, to, kind?: 'miss' | 'love' | 'kiss' | 'night' }  (기본 miss)
// 방해 금지 시간(22-07) 적용 안 함 — 사용자가 명시적으로 누른 거라 즉시 전송.

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

// 한국어 주격 조사 — 받침 있으면 '이가', 없으면 '가' (우댕→우댕이가, 꼼이→꼼이가)
function withSubjectParticle(name: string): string {
  if (!name) return name;
  const last = name.charCodeAt(name.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return name + '이가';
  const hasFinal = (last - 0xAC00) % 28 !== 0;
  return name + (hasFinal ? '이가' : '가');
}

type BumpKind = 'miss' | 'love' | 'kiss' | 'night';

const VARIANTS: Record<BumpKind, { emoji: string; verb: string; body: string }> = {
  miss:  { emoji: '💚', verb: '보고싶대',   body: '꼼모닝에서 인사해줘 ✨' },
  love:  { emoji: '❤️', verb: '사랑한대',   body: '오늘도 너 덕분에 든든해 💕' },
  kiss:  { emoji: '😘', verb: '뽀뽀 보냈어', body: '쪽! 🩷' },
  night: { emoji: '🌙', verb: '잘 자래',    body: '좋은 꿈 꿔 ✨' },
};

export async function POST(req: NextRequest) {
  let body: { from?: string; to?: string; kind?: BumpKind };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const { from, to, kind = 'miss' } = body;
  if (!to || !from) {
    return NextResponse.json({ error: 'to/from required' }, { status: 400 });
  }
  const v = VARIANTS[kind] || VARIANTS.miss;

  const subSnap = await getDoc(doc(db, 'pushSubscriptions', to));
  if (!subSnap.exists()) {
    return NextResponse.json({ ok: false, skipped: 'no subscription for ' + to });
  }
  const s = subSnap.data() as { endpoint: string; keys: { p256dh: string; auth: string } };

  const payload = JSON.stringify({
    title: `${v.emoji} ${withSubjectParticle(from)} ${v.verb}`,
    body: v.body,
    url: '/',
  });

  try {
    await webpush.sendNotification(s as any, payload);
    // 매일매일 꼼모닝 헤더 카운트 — bump를 from별/kind별로 누적 (실패해도 푸시 성공은 유지)
    if (from === '우댕' || from === '꼼이') {
      try {
        const { incrementBump } = await import('@/lib/dailyStats');
        await incrementBump(from, kind);
      } catch {}
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.statusCode;
    if (status === 404 || status === 410) {
      try { await deleteDoc(subSnap.ref); } catch {}
    }
    return NextResponse.json({ ok: false, status, err: String(e?.body || e) }, { status: 200 });
  }
}
