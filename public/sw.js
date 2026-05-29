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
  event.waitUntil(self.clients.openWindow(event.notification.data || '/'));
});
