'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RelayNovel from '@/components/novel/RelayNovel';
import { getNovelData } from '@/lib/novelApi';
import type { Novel, CoverImage } from '@/types';

export default function NovelPage() {
  const [activeNovels, setActiveNovels] = useState<Novel[]>([]);
  const [completedNovels, setCompletedNovels] = useState<Novel[]>([]);
  const [coverLibrary, setCoverLibrary] = useState<CoverImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setUserName(user.이름 || '꼼');

    loadNovelData();
  }, [router]);

  const loadNovelData = async () => {
    setIsLoading(true);
    try {
      const data = await getNovelData();
      setActiveNovels(data.activeNovels);
      setCompletedNovels(data.completedNovels);
      setCoverLibrary(data.coverLibrary);
    } catch (error) {
      console.error('소설 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // InkLoader가 구현되면 아래 주석을 해제하고 교체
  // import InkLoader from '@/components/novel/InkLoader';
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {/* TODO: InkLoader 구현 후 <InkLoader /> 로 교체 */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="text-4xl animate-bounce">📖</div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-200 rounded-full blur-sm" />
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
            서재를 여는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <RelayNovel
      activeNovels={activeNovels}
      completedNovels={completedNovels}
      coverLibrary={coverLibrary}
      userName={userName}
      onDataRefresh={loadNovelData}
    />
  );
}
