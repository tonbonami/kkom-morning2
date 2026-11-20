// Kkom-Morning service worker — 설치 가능(PWA) + 웹푸시 수신용 최소 구성.
// 앱 코드를 캐시하지 않아(passthrough) 배포 시 stale 위험 없음. 오프라인 캐싱은 추후.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// fetch 핸들러 존재 = 설치 가능 요건 충족 (네트워크 그대로 통과)
self.addEventListener('fetch', () => {});

// 웹푸시 수신 (추후 #3에서 서버가 보냄)
self.addEventListener('push', (event) => {
  let data = { title: 'Kkom-Morning', body: '' };
  try { data = event.data ? event.data.json() : data; } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kkom-Morning', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = event.notification.data || '/';
  let target = '/';
  try {
    const url = new URL(raw, self.location.origin);
    if (url.origin === self.location.origin) target = `${url.pathname}${url.search}`;
  } catch (_) {}

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
      const opened = windows[0];
      if (opened) {
        // 이 서비스워커가 맡지 않은 창이면 navigate 가 실패한다 → 그때는 새 창으로(주소를 잃지 않게).
        const moved = 'navigate' in opened ? await opened.navigate(target).catch(() => null) : null;
        if (moved) return moved.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
