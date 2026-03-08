'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Novel, CoverImage } from '@/types';
import BookTabs from './BookTabs';
import ChatView from './ChatView';
import InputForm from './InputForm';
import ReadingView from './ReadingView';
import Bookshelf from './Bookshelf';
import CreateModal from './CreateModal';
import { getAtelierAuthorName } from '@/lib/novelApi';
import { ArrowLeft, Plus } from 'lucide-react';

interface RelayNovelProps {
  activeNovels: Novel[];
  completedNovels: Novel[];
  coverLibrary: CoverImage[];
  userName: string;
  onDataRefresh: () => Promise<void>;
}

type TabType = 'active' | 'bookshelf';
type ViewMode = 'chat' | 'reading';

export default function RelayNovel({
  activeNovels,
  completedNovels,
  coverLibrary,
  userName,
  onDataRefresh,
}: RelayNovelProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<TabType>('active');
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const authorName = getAtelierAuthorName();

  // 초기 선택
  useEffect(() => {
    if (selectedNovelId === null && activeNovels.length > 0) {
      setSelectedNovelId(activeNovels[0].bookId);
    }
  }, [activeNovels, selectedNovelId]);

  // props에서 최신 데이터 참조
  const allNovels = [...activeNovels, ...completedNovels];
  const currentNovel = selectedNovelId
    ? allNovels.find(function(n) { return n.bookId === selectedNovelId; }) || null
    : null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onDataRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSentenceAdded = async () => {
    await onDataRefresh();
  };

  const handleNovelCreatedAndSelect = async () => {
    setShowCreateModal(false);
    await onDataRefresh();
    setCurrentTab('active');
  };

  const handleCompletedNovelSelect = (novel: Novel) => {
    setSelectedNovelId(novel.bookId);
    setViewMode('reading');
  };

  const handleActiveNovelSelect = (novel: Novel) => {
    setSelectedNovelId(novel.bookId);
    setViewMode('chat');
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    if (tab === 'active' && activeNovels.length > 0) {
      setSelectedNovelId(activeNovels[0].bookId);
      setViewMode('chat');
    } else if (tab === 'bookshelf') {
      setSelectedNovelId(null);
      setViewMode('reading');
    }
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(251,191,36,0.08) 0%, transparent 50%),' +
            'radial-gradient(circle at 80% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)',
        }}
      />

      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="w-full max-w-md mx-auto p-6 space-y-6"
      >
        {/* 헤더 */}
        <motion.header variants={itemVars} className="flex items-center justify-between pt-2">
          <button
            onClick={() => router.push('/')}
            className="p-2 bg-white/40 backdrop-blur-xl rounded-xl border border-white/60 text-slate-500 shadow-sm active:scale-90 transition-all"
            aria-label="홈으로"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center flex-1">
            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
              Atelier de Kkom & Teo
            </p>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              우리들의 서재
            </h1>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-white/40 backdrop-blur-xl rounded-xl border border-white/60 text-amber-600 shadow-sm active:scale-90 transition-all"
            aria-label="새 소설"
          >
            <Plus size={18} />
          </button>
        </motion.header>

        {/* 탭 */}
        <motion.div variants={itemVars}>
          <BookTabs
            currentTab={currentTab}
            onTabChange={handleTabChange}
            activeCount={activeNovels.length}
            completedCount={completedNovels.length}
          />
        </motion.div>

        {/* 탭별 콘텐츠 */}
        {currentTab === 'active' ? (
          <>
            {activeNovels.length > 1 && (
              <motion.div variants={itemVars} className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {activeNovels.map(function(novel) {
                  return (
                    <button
                      key={novel.bookId}
                      onClick={function() { handleActiveNovelSelect(novel); }}
                      className={
                        'flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all ' +
                        (currentNovel?.bookId === novel.bookId
                          ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm'
                          : 'bg-white/50 text-slate-500 border border-white/60')
                      }
                    >
                      {novel.title}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {activeNovels.length === 0 && (
              <motion.div variants={itemVars} className="text-center py-16 space-y-4">
                <div className="text-5xl">📝</div>
                <p className="text-sm font-bold text-slate-500">
                  아직 진행 중인 소설이 없어요
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-amber-500 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-lg active:scale-95 transition-all"
                >
                  첫 소설 시작하기
                </button>
              </motion.div>
            )}

            {currentNovel && currentNovel.status === 'active' && (
              <>
                <motion.div variants={itemVars} className="flex justify-center">
                  <div className="flex gap-1 p-1 bg-white/30 backdrop-blur-sm rounded-xl border border-white/50">
                    <button
                      onClick={() => setViewMode('chat')}
                      className={
                        'px-4 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ' +
                        (viewMode === 'chat'
                          ? 'bg-white text-slate-700 shadow-sm'
                          : 'text-slate-400')
                      }
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setViewMode('reading')}
                      className={
                        'px-4 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ' +
                        (viewMode === 'reading'
                          ? 'bg-white text-slate-700 shadow-sm'
                          : 'text-slate-400')
                      }
                    >
                      Read
                    </button>
                  </div>
                </motion.div>

                {viewMode === 'chat' ? (
                  <>
                    <motion.div variants={itemVars}>
                      <ChatView
                        novel={currentNovel}
                        authorName={authorName}
                        onRefresh={handleRefresh}
                      />
                    </motion.div>
                    <motion.div variants={itemVars}>
                      <InputForm
                        novel={currentNovel}
                        authorName={authorName}
                        onSentenceAdded={handleSentenceAdded}
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                      />
                    </motion.div>
                  </>
                ) : (
                  <motion.div variants={itemVars}>
                    <ReadingView novel={currentNovel} />
                  </motion.div>
                )}
              </>
            )}
          </>
        ) : (
          <motion.div variants={itemVars}>
            <Bookshelf
              novels={completedNovels}
              onNovelSelect={handleCompletedNovelSelect}
            />
            {currentNovel && currentNovel.status === 'completed' && (
              <div className="mt-6">
                <ReadingView novel={currentNovel} />
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ✅ 수정: AnimatePresence로 감싸서 exit 애니메이션 동작 */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateModal
            coverLibrary={coverLibrary}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleNovelCreatedAndSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
