// 임시 APNs 진단 — 사용 후 삭제. GET /api/push-test
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import http2 from 'node:http2';

const RTDB =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app';
const APNS_KEY = (process.env.APNS_KEY || '').replace(/\\n/g, '\n');
const KEY_ID = process.env.APNS_KEY_ID || '';
const TEAM_ID = process.env.APNS_TEAM_ID || '';
const BUNDLE = process.env.APNS_BUNDLE_ID || 'com.tonbonami.kkommorning';

function send(host: string, token: string, jwt: string): Promise<unknown> {
  return new Promise((resolve) => {
    const c = http2.connect(`https://${host}`);
    c.on('error', (e) => resolve({ host, err: String(e) }));
    const req = c.request({
      ':method': 'POST', ':path': `/3/device/${token}`,
      authorization: `bearer ${jwt}`, 'apns-topic': BUNDLE,
      'apns-push-type': 'alert', 'content-type': 'application/json',
    });
    let st = 0; let d = '';
    req.on('response', (h) => { st = Number(h[':status']) || 0; });
    req.on('data', (x) => { d += x; });
    req.on('end', () => { c.close(); resolve({ host, status: st, body: d }); });
    req.on('error', (e) => resolve({ host, err: String(e) }));
    req.write(JSON.stringify({ aps: { alert: { title: '테스트', body: 'APNs 테스트' }, sound: 'default' } }));
    req.end();
  });
}

export async function GET() {
  const diag: Record<string, unknown> = {
    env: { hasKey: !!APNS_KEY, keyLen: APNS_KEY.length, keyHead: APNS_KEY.slice(0, 28), keyId: KEY_ID, teamId: TEAM_ID, bundle: BUNDLE },
  };
  let token: string | null = null;
  try {
    const r = await fetch(`${RTDB}/pushTokens/udaeng.json`);
    const j = (await r.json()) as { token?: string } | null;
    token = j?.token || null;
    diag.token = token ? token.slice(0, 12) + '…' : null;
  } catch (e) { diag.tokenErr = String(e); }
  if (!token) return NextResponse.json({ ...diag, error: 'no token' });

  let jwt = '';
  try {
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const si = `${b64({ alg: 'ES256', kid: KEY_ID })}.${b64({ iss: TEAM_ID, iat: Math.floor(Date.now() / 1000) })}`;
    const sig = crypto.createSign('SHA256').update(si).sign({ key: APNS_KEY, dsaEncoding: 'ieee-p1363' });
    jwt = `${si}.${sig.toString('base64url')}`;
    diag.jwtOk = true;
  } catch (e) { return NextResponse.json({ ...diag, jwtError: String(e) }); }

  diag.prod = await send('api.push.apple.com', token, jwt);
  diag.sandbox = await send('api.sandbox.push.apple.com', token, jwt);
  return NextResponse.json(diag);
}
