// 피부 일지(/api/skin/*) 인증 — 서버 전용.
// 꼼모닝 로그인(로그인코드 → localStorage)은 누구나 흉내 낼 수 있어서 민감 데이터엔 못 쓴다.
// 대신 PIN을 한 번 넣으면 서버가 서명한 httpOnly 쿠키(180일)를 준다. 쿠키엔 역할이 들어 있다:
//   kkomi  = 쓰기·읽기(꼼이)        viewer = 읽기만(우댕 — 우댕 2026-10-21 "쓰는 건 꼼이만, 나는 열람만")
// 앱에 우댕으로 로그인한 폰은 꼼이 PIN을 넣어도 viewer로 열린다(SKIN_PIN_UDAENG를 따로 두면 그걸로도 viewer).
// PIN은 5번 틀리면 15분 잠금(skin/_auth 문서, Admin으로만 읽고 씀).
//
// env (Vercel, 서버 전용):
//   SKIN_SESSION_SECRET = 쿠키 서명용 긴 난수 (예: openssl rand -base64 48)
//   SKIN_PIN_KKOMI      = 꼼이 PIN
//   SKIN_PIN_UDAENG     = (선택) 우댕 보기 전용 PIN
//   FIREBASE_SERVICE_ACCOUNT_B64 = firebaseAdmin.ts 참고
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminDb } from './firebaseAdmin';

export type SkinRole = 'kkomi' | 'viewer';
const SESSION_V = 2; // 역할 들어간 쿠키(v2). 그 전 쿠키는 무효 → PIN 한 번 다시
export const SKIN_COOKIE = 'kk_skin';
export const SKIN_MAX_AGE = 60 * 60 * 24 * 180; // 180일
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

const secret = () => process.env.SKIN_SESSION_SECRET || '';

export function skinConfigured(): boolean {
  return !!(secret() && process.env.SKIN_PIN_KKOMI && process.env.FIREBASE_SERVICE_ACCOUNT_B64);
}

const sign = (body: string) => createHmac('sha256', secret()).update(body).digest('base64url');

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function makeSession(role: SkinRole): string {
  const body = Buffer.from(JSON.stringify({
    v: SESSION_V,
    r: role,
    e: Date.now() + SKIN_MAX_AGE * 1000,
    n: randomBytes(6).toString('base64url'),
  })).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function readSession(token?: string): SkinRole | null {
  if (!token || !secret()) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig || !safeEqual(sign(body), sig)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (p.v !== SESSION_V || !(p.e > Date.now())) return null;
    return p.r === 'kkomi' || p.r === 'viewer' ? p.r : null;
  } catch {
    return null;
  }
}

export async function currentRole(): Promise<SkinRole | null> {
  const jar = await cookies();
  return readSession(jar.get(SKIN_COOKIE)?.value);
}

// /api/skin/* 맨 앞에서: const who = await requireReader(); if (who instanceof NextResponse) return who;
export async function requireReader(): Promise<SkinRole | NextResponse> {
  if (!skinConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const who = await currentRole();
  return who ?? NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

// 쓰기(기록 저장·사진·상담 보내기)는 꼼이만
export async function requireWriter(): Promise<SkinRole | NextResponse> {
  const who = await requireReader();
  if (who instanceof NextResponse) return who;
  return who === 'kkomi' ? who : NextResponse.json({ error: 'read_only' }, { status: 403 });
}

export async function checkPin(pin: string): Promise<SkinRole | 'bad' | 'locked' | 'unconfigured'> {
  const want = process.env.SKIN_PIN_KKOMI;
  const db = adminDb();
  if (!want || !db || !secret()) return 'unconfigured';
  const ref = db.doc('skin/_auth');
  const d = (await ref.get()).data() || {};
  if ((d.lockUntil || 0) > Date.now()) return 'locked';
  const given = pin.normalize('NFC').trim();
  const viewerPin = process.env.SKIN_PIN_UDAENG;
  const role: SkinRole | null = safeEqual(given, want) ? 'kkomi' : viewerPin && safeEqual(given, viewerPin) ? 'viewer' : null;
  if (role) {
    await ref.set({ fails: 0, lockUntil: 0, lastOk: Date.now() }, { merge: true });
    return role;
  }
  const fails = (d.fails || 0) + 1;
  const lock = fails >= MAX_FAILS;
  await ref.set({ fails: lock ? 0 : fails, lockUntil: lock ? Date.now() + LOCK_MS : 0, lastFail: Date.now() }, { merge: true });
  return lock ? 'locked' : 'bad';
}
