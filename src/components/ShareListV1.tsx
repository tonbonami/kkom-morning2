'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  ArrowLeft, Plus, Sparkles, X, Loader2, Trash2, Link as LinkIcon, ExternalLink
} from 'lucide-react';

export interface ShareItem {
  id: string;
  url: string;
  preview?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };
  memo?: string;
  by: '우댕' | '꼼이';
  createdAt: Date;
  seenBy: ('우댕' | '꼼이')[];
}

interface Props {
  me: '우댕' | '꼼이';
  items: ShareItem[];
  onBack: () => void;
  onAdd: (draft: { url: string; memo?: string }) => Promise<void>;
  onOpen: (item: ShareItem) => void;
  onDelete: (id: string) => Promise<void>;
  fetchPreview: (url: string) => Promise<{ title?: string; description?: string; image?: string; siteName?: string } | null>;
}

// 상대시간 포맷팅 헬퍼
function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '어제';
  if (diffInDays < 7) return `${diffInDays}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 개별 카드 컴포넌트 (제스처, 힌트 로직 캡슐화)
function ShareCard({
  item, me, index, onOpen, onDelete
}: {
  item: ShareItem; me: '우댕' | '꼼이'; index: number; onOpen: (item: ShareItem) => void; onDelete: (id: string) => void;
}) {
  const isFirst = index === 0;
  const isNew = !item.seenBy.includes(me);
  const controls = useAnimation();
  const [showHint, setShowHint] = useState(isFirst);

  useEffect(() => {
    if (isFirst) {
      // 진입 시 살짝 흔들리는 애니메이션
      controls.start({
        x: [0, -30, 0],
        transition: { delay: 0.5, duration: 0.6, ease: "easeInOut" }
      });
      // 2.5초 후 힌트 숨김
      const timer = setTimeout(() => setShowHint(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isFirst, controls]);

  return (
    <div className="relative w-full rounded-[28px] overflow-hidden bg-red-50 mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {/* Background (Delete Area) */}
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center text-red-500 bg-red-100">
        <Trash2 size={24} />
      </div>

      {/* Foreground Card */}
      <motion.div
        animate={controls}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.x < -60) {
            onDelete(item.id);
          }
        }}
        onClick={() => onOpen(item)}
        className="w-full bg-white rounded-[28px] relative z-10 flex flex-col cursor-pointer"
      >
        {/* '새로 왔어요' 뱃지 */}
        {isNew && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-4 right-4 z-20 bg-[#FCD34D] text-yellow-900 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm"
          >
            <Sparkles size={12} fill="currentColor" /> 새로 왔어요
          </motion.div>
        )}

        {/* Thumbnail (OG Image) */}
        {item.preview?.image ? (
          <div className="w-full aspect-[2/1] relative overflow-hidden bg-slate-100">
            <img
              src={item.preview.image}
              alt={item.preview.title || "Preview"}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div className="w-full h-20 bg-slate-50 flex items-center justify-center text-slate-300">
            <LinkIcon size={32} />
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 flex flex-col">
          {item.preview?.siteName && (
            <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider mb-1">
              {item.preview.siteName}
            </span>
          )}

          <h3 className="text-[16px] font-bold text-slate-800 line-clamp-2 leading-snug">
            {item.preview?.title || item.url}
          </h3>

          {item.preview?.description && (
            <p className="text-[13px] text-slate-500 mt-1.5 line-clamp-1">
              {item.preview.description}
            </p>
          )}

          {/* Memo Box */}
          {item.memo && (
            <div className="mt-4 p-3 bg-[#F7F9F9] rounded-2xl flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 mb-0.5">{item.by}의 코멘트</span>
              <p className="text-[14px] font-medium text-slate-700 leading-relaxed">
                &quot;{item.memo}&quot;
              </p>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-4 flex items-center justify-between text-[12px] font-medium text-slate-400">
            <span>{item.by} · {formatRelativeTime(item.createdAt)}</span>
            <ExternalLink size={14} className="opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* Onboarding Hint */}
      <AnimatePresence>
        {isFirst && showHint && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 right-6 -translate-y-1/2 z-20 pointer-events-none bg-slate-800/90 text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-lg"
          >
            ← 밀어서 삭제
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShareListV1({
  me, items, onBack, onAdd, onOpen, onDelete, fetchPreview
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draftUrl, setDraftUrl] = useState('');
  const [draftMemo, setDraftMemo] = useState('');

  const [previewData, setPreviewData] = useState<{ title?: string; description?: string; image?: string; siteName?: string } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const newCount = useMemo(() => items.filter(item => !item.seenBy.includes(me)).length, [items, me]);

  // URL Auto Fetch Preview
  useEffect(() => {
    if (!draftUrl || !draftUrl.startsWith('http')) {
      setPreviewData(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const data = await fetchPreview(draftUrl);
        setPreviewData(data);
      } catch (error) {
        setPreviewData(null);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [draftUrl, fetchPreview]);

  const handleOpenSheet = () => {
    setDraftUrl('');
    setDraftMemo('');
    setPreviewData(null);
    setIsAdding(true);
  };

  const handleAddSubmit = async () => {
    if (!draftUrl.trim() || !draftUrl.startsWith('http')) {
      alert('올바른 링크(URL)를 입력해주세요!');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd({
        url: draftUrl,
        memo: draftMemo || undefined,
      });
      setIsAdding(false);
    } catch (e) {
      alert('공유에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F7F9F9] max-w-md mx-auto overflow-hidden font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#F7F9F9]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2 -ml-2 text-slate-800">
            <ArrowLeft size={24} />
          </motion.button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tight">Share List</h1>
            <p className="text-[12px] font-bold text-slate-400 mt-0.5">
              총 {items.length}개 <span className="mx-1">·</span>
              <span className={newCount > 0 ? "text-[#FCD34D]" : ""}>
                새로 {newCount}개
              </span>
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleOpenSheet} className="p-2 -mr-2 text-[#10B981]">
            <Plus size={24} strokeWidth={2.5} />
          </motion.button>
        </div>
      </header>

      {/* Feed List */}
      <main className="px-5 mt-2 flex flex-col">
        <AnimatePresence mode="popLayout">
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-32 pb-12 text-center"
            >
              <div className="w-20 h-20 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#99E6D9] mb-5">
                <Sparkles size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">아직 공유한 게 없어요</h3>
              <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed">
                같이 보고 싶은 재밌는 영상이나<br />가고 싶은 곳의 링크를 공유해볼까요?
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }} onClick={handleOpenSheet}
                className="px-8 py-3.5 bg-[#10B981] text-white font-bold rounded-full shadow-[0_4px_16px_rgba(16,185,129,0.25)] flex items-center gap-2"
              >
                <Plus size={18} /> 첫 공유 시작하기
              </motion.button>
            </motion.div>
          )}

          {items.map((item, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              key={item.id}
            >
              <ShareCard
                item={item}
                me={me}
                index={index}
                onOpen={onOpen}
                onDelete={onDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Add Bottom Sheet */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsAdding(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 pt-5 pb-3 flex items-center justify-between bg-white sticky top-0 z-10">
                <h2 className="text-xl font-black text-slate-800">
                  {me === '우댕' ? '꼼이야 이거 봐봐 💚' : '우댕아 이거 봐봐 💚'}
                </h2>
                <button onClick={() => !isSubmitting && setIsAdding(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 pb-8 overflow-y-auto custom-scrollbar">
                <div className="space-y-5 mt-4">
                  {/* URL Input */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">링크 붙여넣기 (필수)</label>
                    <input
                      autoFocus
                      type="url"
                      placeholder="https://youtube.com/..."
                      value={draftUrl}
                      onChange={(e) => setDraftUrl(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-shadow"
                    />

                    {/* Preview UI */}
                    <AnimatePresence>
                      {draftUrl.startsWith('http') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, mt: 0 }}
                          animate={{ opacity: 1, height: 'auto', mt: 12 }}
                          exit={{ opacity: 0, height: 0, mt: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-white border border-slate-100 rounded-[20px] p-3 flex gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] items-center">
                            {isPreviewLoading ? (
                              <div className="flex-1 flex items-center justify-center py-5 text-[#10B981] font-bold text-[13px] gap-2">
                                <Loader2 size={18} className="animate-spin" /> 불러오는 중...
                              </div>
                            ) : previewData ? (
                              <>
                                {previewData.image ? (
                                  <img src={previewData.image} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0 bg-slate-50" />
                                ) : (
                                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                                    <LinkIcon size={20} />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 pr-2">
                                  <h4 className="text-[14px] font-bold text-slate-800 truncate leading-snug">{previewData.title || draftUrl}</h4>
                                  {previewData.description && <p className="text-[12px] font-medium text-slate-400 line-clamp-1 mt-0.5">{previewData.description}</p>}
                                </div>
                              </>
                            ) : (
                              <div className="flex-1 text-[13px] font-medium text-slate-400 text-center py-4">
                                링크 정보를 가져올 수 없어요
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Memo Input */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">코멘트 달기 (선택)</label>
                    <textarea
                      placeholder="어떤 게 재밌었나요?"
                      value={draftMemo}
                      onChange={(e) => setDraftMemo(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 min-h-[100px] resize-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-shadow"
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: draftUrl.startsWith('http') && !isSubmitting ? 0.98 : 1 }}
                  onClick={handleAddSubmit}
                  disabled={!draftUrl.startsWith('http') || isSubmitting}
                  className="w-full mt-8 py-4 bg-[#10B981] text-white rounded-[24px] font-bold text-[16px] shadow-[0_8px_24px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center transition-all"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : '공유하기'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
