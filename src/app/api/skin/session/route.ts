// 피부 일지 세션 — GET: 상태, POST {pin}: 로그인(쿠키 발급), DELETE: 로그아웃.
import { NextRequest, NextResponse } from 'next/server';
import { SKIN_COOKIE, SKIN_MAX_AGE, checkPin, currentRole, makeSession, skinConfigured } from '@/lib/skinAuth';

export const dynamic = 'force-dynamic';

const cookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/api/skin',
};

export async function GET() {
  const role = await currentRole();
  return NextResponse.json({ configured: skinConfigured(), authed: !!role, role });
}

export async function POST(req: NextRequest) {
  if (!skinConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const { pin, as } = await req.json().catch(() => ({ pin: '', as: '' }));
  const r = await checkPin(String(pin || ''));
  if (r === 'unconfigured') return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (r === 'locked') return NextResponse.json({ error: 'locked' }, { status: 429 });
  if (r === 'bad') return NextResponse.json({ error: 'bad_pin' }, { status: 401 });
  // 앱에 우댕으로 로그인한 폰은 꼼이 PIN이어도 보기 전용
  const role = r === 'kkomi' && as === '우댕' ? 'viewer' : r;
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SKIN_COOKIE, makeSession(role), { ...cookieOpts, maxAge: SKIN_MAX_AGE });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SKIN_COOKIE, '', { ...cookieOpts, maxAge: 0 });
  return res;
}
