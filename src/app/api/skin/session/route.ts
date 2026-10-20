// 피부 일지 세션 — GET: 상태, POST {pin}: 로그인(쿠키 발급), DELETE: 로그아웃.
import { NextRequest, NextResponse } from 'next/server';
import { SKIN_COOKIE, SKIN_MAX_AGE, checkPin, currentOwner, makeSession, skinConfigured } from '@/lib/skinAuth';

export const dynamic = 'force-dynamic';

const cookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/api/skin',
};

export async function GET() {
  return NextResponse.json({ configured: skinConfigured(), authed: !!(await currentOwner()) });
}

export async function POST(req: NextRequest) {
  if (!skinConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const { pin } = await req.json().catch(() => ({ pin: '' }));
  const r = await checkPin(String(pin || ''));
  if (r === 'unconfigured') return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (r === 'locked') return NextResponse.json({ error: 'locked' }, { status: 429 });
  if (r === 'bad') return NextResponse.json({ error: 'bad_pin' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SKIN_COOKIE, makeSession('kkomi'), { ...cookieOpts, maxAge: SKIN_MAX_AGE });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SKIN_COOKIE, '', { ...cookieOpts, maxAge: 0 });
  return res;
}
