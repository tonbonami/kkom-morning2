// APNs 발송 — 네이티브 앱(꼼모닝)에 푸시. Firebase/FCM 없이 node:crypto로 JWT(ES256) 직접 서명 + HTTP/2.
// 토큰은 네이티브 PushBridge가 RTDB pushTokens/{userKey}에 저장(userKey='udaeng'|'kkomi').
// 환경변수(Vercel): APNS_KEY(.p8 PEM 내용), APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID.
import crypto from 'node:crypto';
import http2 from 'node:http2';

const RTDB =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app';
// 개행 이스케이프 복원 + 앞뒤 잡문자(zsh % 등) 제거 — BEGIN~END PEM 블록만 추출
const APNS_KEY = (() => {
  const raw = (process.env.APNS_KEY || '').replace(/\\n/g, '\n');
  const m = raw.match(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/);
  return m ? m[0] + '\n' : raw;
})();
const KEY_ID = process.env.APNS_KEY_ID || '';
const TEAM_ID = process.env.APNS_TEAM_ID || '';
const BUNDLE = process.env.APNS_BUNDLE_ID || 'com.tonbonami.kkommorning';

// 이름(우댕/꼼이) → 토큰 저장 키(udaeng/kkomi)
export function keyForName(name: string): 'udaeng' | 'kkomi' {
  return name === '우댕' ? 'udaeng' : 'kkomi';
}

// APNs provider JWT — 30분 캐시(50분 한도 안, iat 갱신).
let cachedJwt = '';
let cachedAt = 0;
function apnsJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedAt < 30 * 60) return cachedJwt;
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const signingInput = `${b64({ alg: 'ES256', kid: KEY_ID })}.${b64({ iss: TEAM_ID, iat: now })}`;
  const sig = crypto
    .createSign('SHA256')
    .update(signingInput)
    .sign({ key: APNS_KEY, dsaEncoding: 'ieee-p1363' }); // JOSE(R||S) 형식
  cachedJwt = `${signingInput}.${sig.toString('base64url')}`;
  cachedAt = now;
  return cachedJwt;
}

async function post(host: string, token: string, payload: string,
                    headers: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  return new Promise((resolve) => {
    const client = http2.connect(`https://${host}`);
    client.on('error', () => resolve({ status: 0, body: 'connect error' }));
    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${token}`,
      authorization: `bearer ${apnsJwt()}`,
      'apns-topic': BUNDLE,
      'apns-push-type': 'alert',
      'content-type': 'application/json',
      ...headers,
    });
    let status = 0;
    let data = '';
    req.on('response', (h) => { status = Number(h[':status']) || 0; });
    req.on('data', (d) => { data += d; });
    req.on('end', () => { client.close(); resolve({ status, body: data }); });
    req.on('error', () => resolve({ status: 0, body: 'request error' }));
    req.write(payload);
    req.end();
  });
}

// 커뮤니케이션 알림(상대 아바타+이름) + 답장 액션용 옵션.
//   category: UNNotificationCategory 식별자 → 알림 꾹 누르면 답장 버튼.
//   sender:  보낸 사람 한글 이름(우댕/꼼이) → mutable-content 켜서 NSE가 아바타 입힘.
export interface ApnsOpts { category?: string; sender?: string; threadId?: string }

// userKey('udaeng'|'kkomi')에게 알림 발송. 프로덕션 실패 시 샌드박스 폴백(dev/prod 토큰 환경 불확실성 대응).
export async function sendApns(userKey: string, title: string, body: string, opts?: ApnsOpts): Promise<boolean> {
  if (!APNS_KEY || !KEY_ID || !TEAM_ID) return false; // env 없으면 조용히 no-op

  let token: string | null = null;
  try {
    const r = await fetch(`${RTDB}/pushTokens/${userKey}.json`);
    const j = (await r.json()) as { token?: string } | null;
    token = j?.token || null;
  } catch {
    return false;
  }
  if (!token) return false;

  const aps: Record<string, unknown> = { alert: { title, body }, sound: 'default' };
  if (opts?.category) aps.category = opts.category;
  if (opts?.threadId) aps['thread-id'] = opts.threadId;
  if (opts?.sender) aps['mutable-content'] = 1; // NSE 실행 트리거 → 아바타/이름 입힘
  const payloadObj: Record<string, unknown> = { aps };
  if (opts?.sender) payloadObj.sender = opts.sender; // NSE가 읽어 아바타 선택
  const payload = JSON.stringify(payloadObj);
  let res = await post('api.push.apple.com', token, payload);
  // 프로덕션에서 토큰 환경 불일치면 샌드박스 재시도
  if (res.status === 400 && res.body.includes('BadDeviceToken')) {
    res = await post('api.sandbox.push.apple.com', token, payload);
  }
  // 만료/무효 토큰 정리
  if (res.status === 410 || (res.status === 400 && res.body.includes('BadDeviceToken'))) {
    try { await fetch(`${RTDB}/pushTokens/${userKey}.json`, { method: 'DELETE' }); } catch {}
  }
  return res.status === 200;
}

// Live Activity 갱신 푸시 — content-state 전체 교체(부분 병합 아님). 토큰은 liveActivityTokens/{userKey}.
// aps.content-state 키는 iOS ContentState(Codable) 프로퍼티명과 정확히 일치해야 함.
export async function sendLiveActivity(
  userKey: string,
  state: Record<string, unknown>,
  opts?: { event?: 'update' | 'end'; staleInSec?: number },
): Promise<boolean> {
  if (!APNS_KEY || !KEY_ID || !TEAM_ID) return false;

  let token: string | null = null;
  try {
    const r = await fetch(`${RTDB}/liveActivityTokens/${userKey}.json`, { cache: 'no-store' });
    const j = (await r.json()) as { token?: string } | null;
    token = j?.token || null;
  } catch {
    return false;
  }
  if (!token) return false;

  const now = Math.floor(Date.now() / 1000);
  const aps: Record<string, unknown> = {
    timestamp: now,
    event: opts?.event ?? 'update',
    'content-state': state,
  };
  if (opts?.staleInSec) aps['stale-date'] = now + opts.staleInSec;
  const payload = JSON.stringify({ aps });

  const laHeaders: Record<string, string> = {
    'apns-topic': `${BUNDLE}.push-type.liveactivity`,
    'apns-push-type': 'liveactivity',
    'apns-priority': '10',
  };
  let res = await post('api.push.apple.com', token, payload, laHeaders);
  if (res.status === 400 && res.body.includes('BadDeviceToken')) {
    res = await post('api.sandbox.push.apple.com', token, payload, laHeaders);
  }
  if (res.status === 410 || (res.status === 400 && res.body.includes('BadDeviceToken'))) {
    try { await fetch(`${RTDB}/liveActivityTokens/${userKey}.json`, { method: 'DELETE' }); } catch {}
  }
  return res.status === 200;
}
