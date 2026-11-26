// ⚠️ 'use client' 붙이지 말 것 — 서버 경로(/api/bump 등)도 이 파일을 거쳐 불러온다. 함수마다 window 확인으로 막아 둠.
const DEMO_KEY = 'kk-demo';
const DEMO_AS_KEY = 'kk-demo-as';
const DEMO_BADGE_KEY = 'kk-demo-badge';

export type DemoPerson = '우댕' | '꼼이';

function queryValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return new URLSearchParams(window.location.search).get(key); } catch { return null; }
}

export function isDemo(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const q = queryValue('demo');
    if (q === '1') sessionStorage.setItem(DEMO_KEY, '1');
    if (q === '0') sessionStorage.removeItem(DEMO_KEY);
    return sessionStorage.getItem(DEMO_KEY) === '1';
  } catch { return false; }
}

export function demoAs(): DemoPerson {
  if (typeof window === 'undefined') return '우댕';
  try {
    const q = queryValue('as');
    if (q === '우댕' || q === '꼼이') sessionStorage.setItem(DEMO_AS_KEY, q);
    const saved = sessionStorage.getItem(DEMO_AS_KEY);
    return saved === '꼼이' ? '꼼이' : '우댕';
  } catch { return '우댕'; }
}

export function demoBadgeHidden(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const q = queryValue('badge');
    if (q === '0') sessionStorage.setItem(DEMO_BADGE_KEY, '0');
    if (q === '1') sessionStorage.removeItem(DEMO_BADGE_KEY);
    return sessionStorage.getItem(DEMO_BADGE_KEY) === '0';
  } catch { return false; }
}

export function demoUser() {
  const name = demoAs();
  return {
    로그인코드: name === '우댕' ? '0319' : '0928',
    이름: name === '꼼이' ? '꼼✌️' : '우댕',
    name,
  };
}

let installed = false;

/**
 * 시연 탭의 가장 바깥 안전망.
 * - 실제 로그인 키는 읽기·쓰기·삭제 모두 가로챈다.
 * - 같은 출처 /api 쓰기와 개인정보성 읽기는 브라우저 밖으로 보내지 않는다.
 */
export function installDemoRuntime(): void {
  if (installed || typeof window === 'undefined' || !isDemo()) return;
  installed = true;

  const originalGet = Storage.prototype.getItem;
  const originalSet = Storage.prototype.setItem;
  const originalRemove = Storage.prototype.removeItem;
  Storage.prototype.getItem = function (key: string): string | null {
    if (this === window.localStorage && key === 'kkom-user') return JSON.stringify(demoUser());
    return originalGet.call(this, key);
  };
  Storage.prototype.setItem = function (key: string, value: string): void {
    if (this === window.localStorage && key === 'kkom-user') return;
    originalSet.call(this, key, value);
  };
  Storage.prototype.removeItem = function (key: string): void {
    if (this === window.localStorage && key === 'kkom-user') return;
    originalRemove.call(this, key);
  };

  const nativeFetch = window.fetch.bind(window);
  const allowedGet = new Set(['/api/air', '/api/weather', '/api/og-preview', '/api/ig-thumb']);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url: URL;
    try {
      const raw = input instanceof Request ? input.url : input instanceof URL ? input.href : String(input);
      url = new URL(raw, window.location.href);
    } catch {
      return nativeFetch(input, init);
    }
    const method = String(init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
      if (method === 'GET' && allowedGet.has(url.pathname)) return nativeFetch(input, init);
      return new Response(JSON.stringify({ ok: true, success: true, demo: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Kkom-Demo': '1' },
      });
    }
    return nativeFetch(input, init);
  };
}

// firebase.ts보다 먼저 직접 불린 화면도 안전하게 만든다.
if (typeof window !== 'undefined' && isDemo()) installDemoRuntime();

export function enterDemo(as: DemoPerson = '우댕'): void {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  u.pathname = '/';
  u.search = '';
  u.searchParams.set('demo', '1');
  u.searchParams.set('as', as);
  window.location.assign(u.toString());
}

/** 촬영용 — 위쪽 「시연 모드」 표시만 숨긴다(이 탭이 닫힐 때까지). 나가기는 홈 맨 아래 「시연 끝내기」. */
export function hideDemoBadge(): void {
  try { sessionStorage.setItem(DEMO_BADGE_KEY, '0'); } catch {}
}

export function leaveDemo(): void {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  u.pathname = '/';
  u.search = '';
  u.searchParams.set('demo', '0');
  window.location.assign(u.toString());
}

/** Firestore 오프라인 쓰기는 서버 확인 전까지 Promise가 끝나지 않는다. 시연에선 로컬 반영만 기다리고 UI를 풀어 준다. */
export async function settleDemoWrite<T>(pending: Promise<T>, fallback?: T): Promise<T> {
  if (!isDemo()) return pending;
  void pending.catch((e) => console.error('[demo local write]', e));
  await Promise.resolve();
  return fallback as T;
}

