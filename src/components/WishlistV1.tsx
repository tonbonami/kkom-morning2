'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, MapPin, ExternalLink, Check,
  Trash2, Camera, X, Utensils, Map, MonitorPlay, CheckCircle2,
  Loader2, MessageCircle
} from 'lucide-react';
import HeartButton from '@/components/HeartButton';
import { useObjectUrls } from '@/lib/useObjectUrl';

export type Category = 'food' | 'place' | 'watch' | 'done';

export interface WishItem {
  id: string;
  category: 'food' | 'place' | 'watch';
  title: string;
  url?: string;
  preview?: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };
  location?: string;
  memo?: string;
  photoUrls?: string[];
  by: '우댕' | '꼼이';
  done: boolean;
  doneAt?: Date | null;
  doneBy?: '우댕' | '꼼이' | null;
  createdAt: Date;
  updatedAt?: Date | null;
  hearts?: number;
  commentCount?: number;
}

interface Props {
  me: '우댕' | '꼼이';
  items: WishItem[];
  onAdd: (draft: { category: 'food' | 'place' | 'watch'; title: string; url?: string; location?: string; memo?: string; photos?: File[] }) => Promise<void>;
  onToggleDone: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddPhoto?: (item: WishItem) => void;
  onViewPhotos?: (item: WishItem, startIndex?: number) => void;
  onBack: () => void;
  fetchPreview: (url: string) => Promise<{ title?: string; description?: string; image?: string; siteName?: string } | null>;
  // (통합 wiring) 사이트 보기 클릭 인터셉트 — YouTube/Instagram은 인앱 모달, 그 외는 외부
  onOpenLink?: (item: WishItem) => void;
  onHeart?: (id: string) => void;
  onOpenComments?: (item: WishItem) => void;
}

const CATEGORY_COLORS = {
  food: 'bg-[#FCA5A5]',
  place: 'bg-[#10B981]',
  watch: 'bg-[#C4B5FD]',
  done: 'bg-slate-800'
};

const CATEGORY_TEXT_COLORS = {
  food: 'text-[#FCA5A5]',
  place: 'text-[#10B981]',
  watch: 'text-[#C4B5FD]',
  done: 'text-slate-800'
};

// '다녀온 곳' 탭은 별도 페이지(또 갈래)로 분리됨 — 여기선 미래형 3탭만
const TABS: { id: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'food', label: '먹을곳', icon: <Utensils size={14} />, color: CATEGORY_COLORS.food },
  { id: 'place', label: '갈곳', icon: <Map size={14} />, color: CATEGORY_COLORS.place },
  { id: 'watch', label: '볼것', icon: <MonitorPlay size={14} />, color: CATEGORY_COLORS.watch },
];

export default function WishlistV1({ me, items, onAdd, onToggleDone, onDelete, onAddPhoto, onViewPhotos, onBack, fetchPreview, onOpenLink, onHeart, onOpenComments }: Props) {
  const [activeTab, setActiveTab] = useState<Category>('place');

  // Bottom Sheet State
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftCategory, setDraftCategory] = useState<'food' | 'place' | 'watch'>('place');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftUrl, setDraftUrl] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftMemo, setDraftMemo] = useState('');
  // 신규 위시 생성 시 같이 올릴 사진 (선택)
  const [draftPhotos, setDraftPhotos] = useState<File[]>([]);
  const draftPhotoUrls = useObjectUrls(draftPhotos);

  // URL Preview State
  const [previewData, setPreviewData] = useState<{ title?: string; description?: string; image?: string; siteName?: string } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const doneCount = items.filter(i => i.done).length;

  const filteredItems = useMemo(() => {
    return items
      .filter(item => activeTab === 'done' ? item.done : (!item.done && item.category === activeTab))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [items, activeTab]);

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
    setDraftCategory(activeTab === 'done' ? 'place' : activeTab);
    setDraftTitle('');
    setDraftUrl('');
    setDraftLocation('');
    setDraftMemo('');
    setDraftPhotos([]);
    setPreviewData(null);
    setIsAdding(true);
  };

  const handleAddSubmit = async () => {
    if (!draftTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd({
        category: draftCategory,
        title: draftTitle,
        url: draftUrl || undefined,
        location: draftLocation || undefined,
        memo: draftMemo || undefined,
        photos: draftPhotos.length > 0 ? draftPhotos : undefined,
      });
      setDraftPhotos([]);
      setIsAdding(false);
    } catch (e) {
      alert('추가에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F7F9F9] max-w-md mx-auto overflow-hidden font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#F7F9F9]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2 -ml-2 text-slate-800">
            <ArrowLeft size={24} />
          </motion.button>
          <div className="text-center">
            <h1 className="text-lg font-bold">우리의 위시리스트</h1>
            <p className="text-[12px] font-medium text-slate-400 mt-0.5">
              총 {items.length}개 · 다녀온 곳 {doneCount}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleOpenSheet} className="p-2 -mr-2 text-[#10B981]">
            <Plus size={24} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? `${tab.color} text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]`
                    : 'bg-white text-slate-400 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                }`}
              >
                {tab.icon} {tab.label}
              </motion.button>
            );
          })}
        </div>
      </header>

      {/* List */}
      <main className="px-5 mt-2 flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-24 pb-12 text-center"
            >
              <div className={`w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 ${CATEGORY_TEXT_COLORS[activeTab]}`}>
                {React.isValidElement(TABS.find(t => t.id === activeTab)?.icon)
                  ? React.cloneElement(TABS.find(t => t.id === activeTab)!.icon as React.ReactElement<any>, { size: 36, strokeWidth: 1.5 })
                  : null}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">아직 비어있어요</h3>
              <p className="text-[14px] text-slate-500 mb-8">우리 같이 해보고 싶은 것을 적어볼까요?</p>
              {activeTab !== 'done' && (
                <motion.button
                  whileTap={{ scale: 0.96 }} onClick={handleOpenSheet}
                  className="px-8 py-3.5 bg-[#10B981] text-white font-bold rounded-full shadow-[0_4px_16px_rgba(16,185,129,0.25)] flex items-center gap-2"
                >
                  <Plus size={18} /> 첫 항목 추가하기
                </motion.button>
              )}
            </motion.div>
          )}

          {filteredItems.map((item) => {
            const isDone = item.done;
            const categoryColor = CATEGORY_COLORS[item.category];
            const coverImage = item.photoUrls?.[0] || item.preview?.image;
            const photoCount = item.photoUrls?.length || 0;

            // NEW 배지 — 상대가 24시간 이내에 추가/수정한 항목
            const now = Date.now();
            const DAY_MS = 24 * 60 * 60 * 1000;
            const isNewCard = item.by !== me && (now - item.createdAt.getTime() < DAY_MS);
            // 사진 추가됨 NEW — updatedAt이 createdAt보다 1분 이상 늦고 24시간 이내 + 카드를 안 만든 내가 보는 경우
            const isPhotosUpdated =
              !!item.updatedAt &&
              item.photoUrls && item.photoUrls.length > 0 &&
              (item.updatedAt.getTime() - item.createdAt.getTime() > 60 * 1000) &&
              (now - item.updatedAt.getTime() < DAY_MS);

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                key={item.id}
                className="relative w-full rounded-[28px] overflow-hidden bg-red-50 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
              >
                {/* Delete background — swipe로 드러남 */}
                <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center text-red-500 bg-red-100">
                  <Trash2 size={24} />
                </div>

                {/* 드래그 가능한 카드 본체 */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -80, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => { if (info.offset.x < -60 && confirm('이 위시를 지울까요?')) onDelete(item.id); }}
                  className={`relative z-10 bg-white rounded-[28px] p-4 flex gap-4 cursor-pointer transition-opacity ${
                    isDone ? 'opacity-75 bg-slate-50/50' : ''
                  }`}
                >
                {/* NEW 배지 — 상대가 24h 이내 추가한 카드 */}
                {isNewCard && !isDone && (
                  <span className="absolute -top-2 -right-1 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md rotate-[8deg] shadow-[2px_2px_0px_rgba(0,0,0,0.08)] z-20 ring-2 ring-white">
                    ✨ NEW
                  </span>
                )}
                {/* Left: Image or Icon — 사진 있으면 클릭으로 갤러리 모달 열림 */}
                <div className="shrink-0 flex flex-col items-center">
                  {coverImage ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (photoCount > 0 && onViewPhotos) onViewPhotos(item, 0);
                      }}
                      className="relative active:scale-95 transition-transform"
                      aria-label={`사진 ${photoCount}장 보기`}
                    >
                      <img src={coverImage} alt="" className={`w-16 h-16 rounded-2xl object-cover shadow-sm ${isDone ? 'grayscale opacity-80' : ''}`} draggable={false} />
                      {photoCount > 1 && (
                        <span className="absolute -right-1 -bottom-1 rounded-full bg-slate-900 text-white text-[10px] font-black px-1.5 py-0.5 shadow-sm">
                          +{photoCount - 1}
                        </span>
                      )}
                      {/* 사진 새로 추가됐을 때 빨간 점 */}
                      {isPhotosUpdated && !isDone && (
                        <span className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                      )}
                    </button>
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-sm ${isDone ? 'bg-slate-300' : categoryColor}`}>
                      {item.category === 'food' ? <Utensils size={24} /> : item.category === 'place' ? <Map size={24} /> : <MonitorPlay size={24} />}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-[16px] font-bold truncate ${isDone ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                      {item.title}
                    </h3>

                    {/* '또 갈래로!' 체크 버튼 — 휴지통은 제거(스와이프로 대체) */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => onToggleDone(item.id, !isDone)}
                        aria-label="또 갈래로 보내기"
                        title="또 갈래로 보내기"
                        className={`shrink-0 flex items-center gap-1 px-2.5 h-8 rounded-full transition-colors shadow-sm text-[11px] font-bold ${
                          isDone ? 'bg-[#10B981] text-white' : 'bg-emerald-50 text-[#10B981] hover:bg-emerald-100'
                        }`}
                      >
                        <Check size={13} strokeWidth={3} />
                        또 갈래
                      </motion.button>
                    </div>
                  </div>

                  {item.location && (
                    <div className={`flex items-center gap-1 mt-1 text-[13px] font-medium ${isDone ? 'text-slate-400' : 'text-slate-500'}`}>
                      <MapPin size={12} /> <span className="truncate">{item.location}</span>
                    </div>
                  )}
                  {item.memo && (
                    <p className={`mt-1.5 text-[13px] leading-snug line-clamp-2 ${isDone ? 'text-slate-400' : 'text-slate-400'}`}>
                      {item.memo}
                    </p>
                  )}

                  {/* Actions Area */}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { if (onOpenLink) { e.preventDefault(); onOpenLink(item); } }}
                          className={`inline-flex items-center gap-1 text-[12px] font-bold ${isDone ? 'text-slate-400' : 'text-[#10B981]'}`}
                        >
                          사이트 보기 <ExternalLink size={12} />
                        </a>
                      )}
                      {onAddPhoto && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddPhoto(item); }}
                          className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md active:scale-95 transition-transform"
                        >
                          <Camera size={12} /> {photoCount > 0 ? '사진 더하기' : '사진 추가'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {onHeart && (
                        <HeartButton count={item.hearts} onHeart={() => onHeart(item.id)} />
                      )}
                      {onOpenComments && (
                        <button
                          onClick={() => onOpenComments(item)}
                          aria-label="댓글"
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors active:scale-90"
                        >
                          <MessageCircle size={14} />
                          <span className="text-[12px] font-bold tabular-nums">{item.commentCount || 0}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                </motion.div>
              </motion.div>
            );
          })}
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
                <h2 className="text-xl font-bold text-slate-800">새로운 위시 추가</h2>
                <button onClick={() => !isSubmitting && setIsAdding(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 pb-8 overflow-y-auto custom-scrollbar">
                {/* Category Selection */}
                <div className="flex gap-3 mb-6">
                  {(['food', 'place', 'watch'] as const).map((cat) => {
                    const isSel = draftCategory === cat;
                    const catObj = TABS.find(t => t.id === cat)!;
                    return (
                      <button
                        key={cat}
                        onClick={() => setDraftCategory(cat)}
                        className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-colors border-2 ${
                          isSel ? `border-transparent ${catObj.color} text-white shadow-md` : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {catObj.icon}
                        <span className="text-[13px] font-bold">{catObj.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">제목 (필수)</label>
                    <input
                      autoFocus
                      type="text"
                      placeholder="어떤 걸 해볼까요?"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-shadow"
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">링크 (선택)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={draftUrl}
                      onChange={(e) => setDraftUrl(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-shadow"
                    />

                    {/* URL Preview Area */}
                    <AnimatePresence>
                      {draftUrl.startsWith('http') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-white border border-slate-100 rounded-2xl p-3 flex gap-3 shadow-sm items-center">
                            {isPreviewLoading ? (
                              <div className="flex-1 flex items-center justify-center py-4 text-slate-400 gap-2">
                                <Loader2 size={16} className="animate-spin" /> 미리보기 불러오는 중...
                              </div>
                            ) : previewData ? (
                              <>
                                {previewData.image && <img src={previewData.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-50" />}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[13px] font-bold text-slate-700 truncate">{previewData.title || draftUrl}</h4>
                                  {previewData.description && <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{previewData.description}</p>}
                                </div>
                              </>
                            ) : (
                              <div className="flex-1 text-[12px] text-slate-400 text-center py-2">
                                링크 정보를 가져올 수 없어요
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">위치 (선택)</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><MapPin size={18} /></div>
                      <input
                        type="text"
                        placeholder="어디에 있나요?"
                        value={draftLocation}
                        onChange={(e) => setDraftLocation(e.target.value)}
                        className="w-full bg-[#F7F9F9] rounded-[20px] py-4 pl-12 pr-5 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Memo */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">메모 (선택)</label>
                    <textarea
                      placeholder="기억하고 싶은 내용을 적어주세요."
                      value={draftMemo}
                      onChange={(e) => setDraftMemo(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] px-5 py-4 min-h-[100px] resize-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-shadow"
                    />
                  </div>

                  {/* Photos (선택) — 신규 위시에 사진 같이 올리기 */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-1.5 ml-1">사진 (선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {draftPhotos.map((file, i) => {
                        const url = draftPhotoUrls[i];
                        return (
                          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                            {url && <img src={url} alt="" className="w-full h-full object-cover" />}
                            <button
                              type="button"
                              onClick={() => setDraftPhotos((prev) => prev.filter((_, j) => j !== i))}
                              className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 text-white text-xs leading-none flex items-center justify-center active:scale-90"
                              aria-label="사진 빼기"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      <label className="w-20 h-20 rounded-xl bg-[#F7F9F9] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer active:scale-95 transition-transform">
                        <Camera size={20} />
                        <span className="text-[10px] font-bold mt-1">사진 추가</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
                            if (files.length > 0) setDraftPhotos((prev) => [...prev, ...files]);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                    </div>
                    {draftPhotos.length > 0 && (
                      <p className="text-[11px] text-slate-400 mt-1.5 ml-1">사진 {draftPhotos.length}장 — 추가하기 누르면 같이 올라가요</p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: draftTitle.trim() && !isSubmitting ? 0.98 : 1 }}
                  onClick={handleAddSubmit}
                  disabled={!draftTitle.trim() || isSubmitting}
                  className="w-full mt-8 py-4 bg-[#10B981] text-white rounded-[24px] font-bold text-[16px] shadow-[0_8px_24px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center transition-all"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : '추가하기'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
