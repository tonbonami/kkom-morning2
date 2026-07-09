import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { PwaRegister } from '@/components/pwa-register';
import './globals.css';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Kkom-Morning Companion',
  description: '꼬미의 아침을 여는 따뜻한 보살핌',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Kkom-Morning' },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=PT+Sans:wght@400;700&family=Dongle:wght@400;700&display=swap" rel="stylesheet" />
        {/* Pretendard — 애플 SD 산돌고딕 대체 무료 폰트 (가변·동적 서브셋: 쓴 글자만 로드) */}
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
