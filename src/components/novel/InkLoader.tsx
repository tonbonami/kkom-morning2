'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RelayNovel from '@/components/novel/RelayNovel';
import InkLoader from '@/components/novel/InkLoader';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <InkLoader />
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
