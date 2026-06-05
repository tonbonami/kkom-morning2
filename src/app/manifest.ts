import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kkom-Morning',
    short_name: 'Kkom',
    description: '꼬미의 아침을 여는 따뜻한 보살핌',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ecfdf5',
    theme_color: '#10b981',
    lang: 'ko',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // PWA 숏컷 — iOS 16.4+ iPad/iPhone에서 앱 아이콘 길게 누르면 메뉴
    shortcuts: [
      {
        name: '💚 보고싶어',
        short_name: '보고싶어',
        description: '상대에게 보고싶다고 한 번에 전하기',
        url: '/quick/bump',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: '💌 편지 쓰기',
        short_name: '편지',
        description: '새 편지 작성',
        url: '/letter/new',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: '😊 기분 바꾸기',
        short_name: '기분',
        description: '오늘의 기분 빠른 설정',
        url: '/quick/mood',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: '✨ Share List',
        short_name: '공유',
        description: '공유한 거 둘러보기',
        url: '/share',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
