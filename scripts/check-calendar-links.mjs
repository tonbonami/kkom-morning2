// 꼼캘 주소 결과 + iOS 알림 주소 허용 규칙을 짧게 고정한다.
// 실행: node scripts/check-calendar-links.mjs
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const linkSource = readFileSync('src/lib/calendarLink.ts', 'utf8');
const compiled = ts.transpileModule(linkSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { calendarHref } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const same = (actual, expected, label) => {
  if (actual !== expected) throw new Error(`${label}: ${String(actual)} (expected ${String(expected)})`);
};

same(calendarHref(), '/calendar', '기본 꼼캘');
same(calendarHref('2026-11-21', 'Ab_9-x'), '/calendar?date=2026-11-21&event=Ab_9-x', '날짜+일정');
same(calendarHref('2026/11/21', 'bad!'), '/calendar', '이상한 값 제거');

// MainViewController.DeepLink.path와 같은 규칙의 표본. Swift 원문의 핵심 가드도 아래에서 같이 확인한다.
const allowed = new Set(['/calendar', '/diary', '/letters']);
function safeNativePath(raw) {
  let url;
  try { url = new URL(raw, 'https://kkommorning-v2.vercel.app'); } catch { return null; }
  const relative = raw.startsWith('/') && !raw.startsWith('//');
  if (!relative && url.origin !== 'https://kkommorning-v2.vercel.app') return null;
  if (!allowed.has(url.pathname) || url.hash) return null;
  const out = new URLSearchParams();
  for (const key of ['date', 'event', 'who']) {
    const values = url.searchParams.getAll(key);
    if (values.length > 1) return null;
    if (!values.length) continue;
    const ok = key === 'date' ? /^\d{4}-\d{2}-\d{2}$/.test(values[0])
      : key === 'who' ? values[0] === 'udaeng' || values[0] === 'kkomi'
      : /^[A-Za-z0-9_-]{1,64}$/.test(values[0]);
    if (!ok) return null;
    out.set(key, values[0]);
  }
  return url.pathname + (out.size ? `?${out}` : '');
}

same(safeNativePath('/calendar?date=2026-11-21&event=Ab_9-x&junk=1'), '/calendar?date=2026-11-21&event=Ab_9-x', 'iOS 알림 쿼리');
same(safeNativePath('/diary?date=2026-11-21&who=kkomi'), '/diary?date=2026-11-21&who=kkomi', 'iOS 꼼이어리 날짜·장 주인');
same(safeNativePath('/diary?date=2026-11-21&who=evil'), null, '이상한 장 주인 차단');
same(safeNativePath('/'), null, '홈은 열지 않음(보던 화면 지킴)');
same(safeNativePath('https://kkommorning-v2.vercel.app/letters'), '/letters', '같은 출처');
same(safeNativePath('https://evil.example/calendar?date=2026-11-21'), null, '외부 주소 차단');
same(safeNativePath('/calendar?date=2026-1-2'), null, '잘못된 날짜 차단');
same(safeNativePath('/recipes'), null, '허용하지 않은 화면 차단');

const swift = readFileSync('ios/App/App/MainViewController.swift', 'utf8');
for (const marker of [
  'private static let allowed: Set<String> = ["/calendar", "/diary", "/letters"]',
  'parts.host == webBase.host',
  'value.count <= 64',
  '$0 == "_" || $0 == "-"',
  'DeepLink.attach(webView)',
  'UNUserNotificationCenter.current().delegate = PushManager.shared',
]) {
  if (!swift.includes(marker)) throw new Error(`iOS 주소 가드 누락: ${marker}`);
}

const apns = readFileSync('src/lib/apns.ts', 'utf8');
const pushBridge = readFileSync('ios/App/App/PushBridge.swift', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
if (!apns.includes('payloadObj.url = opts.url')) throw new Error('APNs payload url 누락');
if (!pushBridge.includes('DeepLink.open(response.notification.request.content.userInfo["url"] as? String)')) throw new Error('iOS 본문 탭 url 누락');
for (const marker of ['clients.matchAll', 'opened.navigate(target)', 'moved.focus()']) {
  if (!sw.includes(marker)) throw new Error(`웹 푸시 열린 창 재사용 누락: ${marker}`);
}

console.log('OK — 꼼캘 주소 3개 + iOS 허용/차단 8개');
