'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Trash2, ChevronLeft, ChevronRight, Calendar, Type, AlignLeft, Pencil } from 'lucide-react';
import { subscribeMemories, addMemory, updateMemory, deleteMemory, compressImage, type Memory } from '@/lib/memories';

export default function MemoryGalleryV2() {
  const [isMounted, setIsMounted] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Upload Form State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadDesc, setUploadDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // editingId가 set되면 sheet는 '수정' 모드로 동작 (사진 변경 X, title/date/desc만 업데이트)
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = subscribeMemories((mems) => setMemories(mems));
    return () => unsubscribe();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPreviewUrl(compressed);
    } catch (error) {
      alert('이미지 처리 중 오류가 발생했어요.');
    }
  };

  const handleUpload = async () => {
    if (editingId) {
      // 수정 모드 — title/date/description만 patch
      if (!uploadTitle || !uploadDate) {
        alert('제목과 날짜는 비울 수 없어요!');
        return;
      }
      setIsUploading(true);
      try {
        await updateMemory(editingId, {
          title: uploadTitle,
          date: uploadDate,
          description: uploadDesc,
        });
        closeUploadSheet();
      } catch (error) {
        alert('수정에 실패했어요. 다시 시도해주세요.');
      } finally {
        setIsUploading(false);
      }
      return;
    }
    // 신규 업로드 모드
    if (!previewUrl || !uploadTitle || !uploadDate) {
      alert('사진과 제목, 날짜를 모두 입력해주세요!');
      return;
    }
    setIsUploading(true);
    try {
      await addMemory({
        id: crypto.randomUUID(), // Optimistic or ignored by DB
        imageUrl: previewUrl,
        title: uploadTitle,
        date: uploadDate,
        description: uploadDesc,
        by: '우댕', // Default fallback
      });
      closeUploadSheet();
    } catch (error) {
      alert('업로드에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  // 라이트박스에서 ✏️ 누르면 호출 — 폼 채워서 sheet 열기
  const handleOpenEdit = (mem: Memory) => {
    if (mem.id.startsWith('seed-')) {
      alert('시드 사진은 수정할 수 없어요.');
      return;
    }
    setEditingId(mem.id);
    setUploadTitle(mem.title || '');
    setUploadDate(mem.date || new Date().toISOString().split('T')[0]);
    setUploadDesc(mem.description || '');
    setPreviewUrl(mem.imageUrl); // 미리보기엔 기존 이미지 표시
    setSelectedPhotoIndex(null); // 라이트박스 닫고
    setIsAdding(true);            // sheet 열기
  };

  const closeUploadSheet = () => {
    setIsAdding(false);
    setTimeout(() => {
      setPreviewUrl(null);
      setUploadTitle('');
      setUploadDesc('');
      setUploadDate(new Date().toISOString().split('T')[0]);
      setEditingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 300);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 소중한 추억을 지울까요?')) return;
    try {
      await deleteMemory(id);
      setSelectedPhotoIndex(null);
    } catch (error) {
      alert('앗! 기본 제공되는 시드 사진은 지울 수 없어요 🥲');
    }
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex < memories.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  const hasMemories = memories.length > 0;
  const selectedMemory = selectedPhotoIndex !== null ? memories[selectedPhotoIndex] : null;

  return (
    <div className="relative min-h-screen bg-[#F7F9F9] max-w-md mx-auto overflow-hidden font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 bg-[#F7F9F9]/80 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">우리의 추억</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-[#10B981]"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>
      </header>

      {/* Main Gallery */}
      <main className="px-5 mt-2">
        {!hasMemories ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center mt-20 text-center"
          >
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-center mb-6">
              <ImageIcon className="w-10 h-10 text-[#99E6D9]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">아직 기록된 추억이 없어요</h3>
            <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">꼬미와 우댕의 첫 번째<br />소중한 순간을 남겨보세요 💚</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdding(true)}
              className="px-8 py-4 bg-[#10B981] text-white rounded-[28px] font-semibold text-[15px] shadow-[0_8px_24px_rgba(16,185,129,0.25)]"
            >
              첫 사진 올리기
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {memories.map((memory, i) => {
              const isHero = i === 0;
              return (
                <motion.div
                  key={memory.id}
                  layoutId={`memory-${memory.id}`}
                  onClick={() => setSelectedPhotoIndex(i)}
                  whileTap={{ scale: 0.97 }}
                  className={`group relative overflow-hidden bg-white cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
                    isHero ? 'col-span-2 aspect-[4/5] rounded-[32px]' : 'col-span-1 aspect-square rounded-[28px]'
                  }`}
                >
                  <img
                    src={memory.imageUrl}
                    alt={memory.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    {isHero && <p className="text-sm font-semibold text-[#99E6D9] drop-shadow-sm mb-1.5">{memory.date}</p>}
                    <h3 className={`font-bold text-white leading-tight drop-shadow-sm line-clamp-2 ${isHero ? 'text-2xl' : 'text-base'}`}>
                      {memory.title}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Photo Sheet */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeUploadSheet}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 pt-5 pb-3 flex items-center justify-between bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">{editingId ? '추억 수정' : '새로운 추억 기록'}</h2>
                <button onClick={closeUploadSheet} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pb-8 overflow-y-auto custom-scrollbar">
                {/* Photo Select — 수정 모드에선 사진 변경 잠금 (이미지만 표시) */}
                <div
                  onClick={() => { if (!editingId) fileInputRef.current?.click(); }}
                  className={`w-full aspect-[4/3] rounded-[28px] overflow-hidden flex items-center justify-center transition-colors relative ${
                    previewUrl ? 'bg-black' : 'bg-[#F7F9F9] border-2 border-dashed border-[#99E6D9]'
                  } ${editingId ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      {!editingId && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold">사진 변경</span>
                        </div>
                      )}
                      {editingId && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                          사진은 수정 불가
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-[#10B981]">
                      <Plus className="w-8 h-8 mb-2" strokeWidth={2.5} />
                      <span className="font-semibold text-[15px]">사진 선택하기</span>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Type className="w-5 h-5" /></div>
                    <input
                      type="text" placeholder="어떤 추억인가요? (제목)" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] py-4 pl-12 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Calendar className="w-5 h-5" /></div>
                    <input
                      type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] py-4 pl-12 pr-4 text-[15px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all appearance-none"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-4 text-gray-400"><AlignLeft className="w-5 h-5" /></div>
                    <textarea
                      placeholder="이날의 이야기를 짧게 남겨주세요." value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] py-4 pl-12 pr-4 min-h-[100px] resize-none text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all"
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: isUploading ? 1 : 0.98 }}
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full mt-8 py-4 bg-[#10B981] text-white rounded-[24px] font-bold text-lg shadow-[0_8px_24px_rgba(16,185,129,0.25)] disabled:opacity-70 flex items-center justify-center"
                >
                  {isUploading ? (
                    <span className="animate-pulse">{editingId ? '저장 중...' : '올리는 중...'}</span>
                  ) : (
                    editingId ? '수정 저장' : '추억 저장하기'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 max-w-md mx-auto flex flex-col"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-5 text-white">
              <button onClick={() => setSelectedPhotoIndex(null)} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedMemory)}
                  className="p-2 bg-white/10 rounded-full backdrop-blur-md text-white/90 hover:text-white"
                  aria-label="수정"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(selectedMemory.id)} className="p-2 bg-white/10 rounded-full backdrop-blur-md text-red-400 hover:text-red-300">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Image */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden touch-pan-y"
                 onPointerDown={(e) => e.stopPropagation()}>
              <motion.img
                layoutId={`memory-${selectedMemory.id}`}
                src={selectedMemory.imageUrl}
                alt={selectedMemory.title}
                className="w-full max-h-full object-contain"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) showNext({ stopPropagation: () => {} } as any);
                  if (info.offset.x > 50) showPrev({ stopPropagation: () => {} } as any);
                }}
              />

              {selectedPhotoIndex > 0 && (
                <button onClick={showPrev} className="absolute left-4 p-3 bg-black/50 text-white rounded-full backdrop-blur-md">
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {selectedPhotoIndex < memories.length - 1 && (
                <button onClick={showNext} className="absolute right-4 p-3 bg-black/50 text-white rounded-full backdrop-blur-md">
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Footer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent"
            >
              <div className="flex items-end justify-between mb-3">
                <h2 className="text-2xl font-bold text-white drop-shadow-md">{selectedMemory.title}</h2>
                <span className="text-[#99E6D9] font-medium tracking-wide text-sm drop-shadow-sm">{selectedMemory.date}</span>
              </div>
              {selectedMemory.description && (
                <p className="text-gray-300 text-[15px] leading-relaxed mb-4">{selectedMemory.description}</p>
              )}
              {selectedMemory.by && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {selectedMemory.by.substring(0, 1)}
                  </div>
                  <span className="text-sm text-gray-400">{selectedMemory.by}님이 올림</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
