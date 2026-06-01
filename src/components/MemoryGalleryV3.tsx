'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Plus, X, Image as ImageIcon, Trash2, ChevronLeft, ChevronRight,
  Calendar, Type, AlignLeft, Heart, MessageCircle, Pencil, Send
} from 'lucide-react';

export interface Memory {
  id: string;
  imageUrl: string;
  title: string;
  date: string;
  description: string;
  by?: string;
  hearts?: number;
  commentCount?: number;
}

export interface Comment {
  id: string;
  by: '우댕' | '꼼이';
  text: string;
  createdAt: Date;
}

export interface Props {
  me: '우댕' | '꼼이';
  memories: Memory[];
  onUpload: (draft: { imageUrl: string; title: string; date: string; description: string; by: string }) => Promise<void>;
  onUpdate: (id: string, patch: Partial<Pick<Memory, 'title'|'date'|'description'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onHeart: (id: string) => Promise<void>;
  subscribeComments: (memoryId: string, cb: (comments: Comment[]) => void) => () => void;
  addComment: (memoryId: string, text: string) => Promise<void>;
  deleteComment: (memoryId: string, commentId: string) => Promise<void>;
  compressImage: (file: File) => Promise<string>;
}

// 헬퍼: 상대 시간 표시
const formatRelative = (d: Date) => {
  const diffSecs = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  if (diffSecs < 60) return '방금 전';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

// 헬퍼: 하트 카운트 포맷 — 999까지 풀 표시, 1000+ 부터만 압축
const formatCount = (n?: number) => {
  const cnt = n || 0;
  if (cnt >= 1000) return (cnt / 1000).toFixed(1) + 'k+';
  return cnt.toString();
};

// 헬퍼: 작성자 아바타 색상
const getAvatarColor = (name?: string) => name === '우댕' ? 'bg-[#10B981]' : 'bg-[#FCA5A5]';

// -------------------------------------------------------------
// Floating Heart Button Component
// -------------------------------------------------------------
function HeartButton({
  count, onHeart, isLarge = false, className = ''
}: {
  count?: number; onHeart: () => void; isLarge?: boolean; className?: string
}) {
  const [bursts, setBursts] = useState<{ id: number; x: number }[]>([]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 작은 하트 이펙트 추가
    setBursts(prev => [...prev, { id: Date.now() + Math.random(), x: (Math.random() - 0.5) * 40 }]);
    onHeart();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center gap-1.5 transition-transform active:scale-95 ${className}`}
    >
      <Heart
        size={isLarge ? 28 : 16}
        className={`${isLarge ? 'text-red-500 fill-red-500' : 'text-white fill-white drop-shadow-md'}`}
      />
      <span className={`font-bold drop-shadow-md ${isLarge ? 'text-lg text-slate-800' : 'text-[13px] text-white'}`}>
        {formatCount(count)}
      </span>

      <AnimatePresence>
        {bursts.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -60, x: b.x, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onAnimationComplete={() => setBursts(prev => prev.filter(p => p.id !== b.id))}
            className={`absolute ${isLarge ? 'text-red-500' : 'text-white'} pointer-events-none`}
            style={{ left: isLarge ? '5px' : '0px', top: '0px' }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>
    </button>
  );
}

// -------------------------------------------------------------
// Main Gallery Component
// -------------------------------------------------------------
export default function MemoryGalleryV3({
  me, memories, onUpload, onUpdate, onDelete, onHeart,
  subscribeComments, addComment, deleteComment, compressImage
}: Props) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Sheet States
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadDesc, setUploadDesc] = useState('');

  // -------------------------
  // Handlers
  // -------------------------
  const openAddSheet = () => {
    setPreviewUrl(null);
    setUploadTitle('');
    setUploadDesc('');
    setUploadDate(new Date().toISOString().split('T')[0]);
    setIsAdding(true);
  };

  const openEditSheet = (memory: Memory) => {
    setPreviewUrl(memory.imageUrl);
    setUploadTitle(memory.title);
    setUploadDate(memory.date);
    setUploadDesc(memory.description);
    setIsEditing(true);
  };

  const closeSheets = () => {
    setIsAdding(false);
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  const handleSubmit = async () => {
    if (!previewUrl || !uploadTitle || !uploadDate) return;
    setIsSubmitting(true);
    try {
      if (isEditing && selectedPhotoIndex !== null) {
        await onUpdate(memories[selectedPhotoIndex].id, {
          title: uploadTitle,
          date: uploadDate,
          description: uploadDesc,
        });
      } else {
        await onUpload({
          imageUrl: previewUrl,
          title: uploadTitle,
          date: uploadDate,
          description: uploadDesc,
          by: me,
        });
      }
      closeSheets();
    } catch (error) {
      alert('요청을 처리하지 못했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 소중한 추억을 지울까요?')) return;
    try {
      await onDelete(id);
      setSelectedPhotoIndex(null);
    } catch (error) {
      alert('앗! 삭제할 수 없는 사진이에요 🥲');
    }
  };

  const hasMemories = memories.length > 0;
  const selectedMemory = selectedPhotoIndex !== null ? memories[selectedPhotoIndex] : null;

  return (
    <div className="relative min-h-screen bg-[#F7F9F9] max-w-md mx-auto overflow-hidden font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 bg-[#F7F9F9]/90 backdrop-blur-md pt-safe">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">우리의 추억</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={openAddSheet}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-[#10B981]"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>
      </header>

      {/* Grid */}
      <main className="px-5 mt-2">
        {!hasMemories ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-24 pb-12 text-center"
          >
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-center mb-6">
              <ImageIcon className="w-10 h-10 text-[#99E6D9]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">아직 기록된 추억이 없어요</h3>
            <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">우리만의 소중한 첫 번째<br />순간을 남겨보세요 💚</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openAddSheet}
              className="px-8 py-4 bg-[#10B981] text-white rounded-[28px] font-bold text-[15px] shadow-[0_8px_24px_rgba(16,185,129,0.25)] flex items-center gap-2"
            >
              <Plus size={18} /> 첫 사진 올리기
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {memories.map((memory, i) => {
              const isHero = i === 0;
              return (
                <motion.div
                  key={memory.id}
                  layoutId={`memory-card-${memory.id}`}
                  onClick={() => setSelectedPhotoIndex(i)}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative overflow-hidden bg-white cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
                    isHero ? 'col-span-2 aspect-[4/5] rounded-[32px]' : 'col-span-1 aspect-square rounded-[28px]'
                  }`}
                >
                  <motion.img
                    layoutId={`memory-img-${memory.id}`}
                    src={memory.imageUrl}
                    alt={memory.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Overlays */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {isHero && <p className="text-[12px] font-bold text-[#99E6D9] drop-shadow-md mb-1">{memory.date}</p>}
                      <h3 className={`font-bold text-white drop-shadow-md truncate ${isHero ? 'text-2xl' : 'text-base'}`}>
                        {memory.title}
                      </h3>
                    </div>

                    {/* Tiny counters in corner */}
                    <div className="shrink-0 flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {(memory.commentCount || 0) > 0 && (
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={isHero ? 16 : 14} className="text-white fill-white/20 drop-shadow-md" />
                          <span className="text-[13px] font-bold text-white drop-shadow-md">{formatCount(memory.commentCount)}</span>
                        </div>
                      )}
                      <HeartButton
                        count={memory.hearts}
                        onHeart={() => onHeart(memory.id)}
                        className={!isHero && !(memory.commentCount || 0) && !(memory.hearts || 0) ? 'opacity-70' : ''}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Form Bottom Sheet (Add & Edit) */}
      <AnimatePresence>
        {(isAdding || isEditing) && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeSheets}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] z-50 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-[32px]">
                <h2 className="text-xl font-bold text-slate-800">{isEditing ? '추억 수정하기' : '새로운 추억 기록'}</h2>
                <button onClick={closeSheets} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pb-8 overflow-y-auto custom-scrollbar flex-1">
                {/* Photo Select */}
                <div
                  onClick={() => !isEditing && fileInputRef.current?.click()}
                  className={`w-full aspect-[4/3] rounded-[28px] overflow-hidden flex items-center justify-center transition-colors relative ${
                    previewUrl ? 'bg-black' : 'bg-[#F7F9F9] border-2 border-dashed border-[#99E6D9] cursor-pointer'
                  }`}
                >
                  {!isEditing && <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />}
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      {!isEditing && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <span className="bg-white/90 text-slate-800 px-4 py-2 rounded-full text-[13px] font-bold">사진 변경</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-[#10B981]">
                      <Plus className="w-8 h-8 mb-2" strokeWidth={2.5} />
                      <span className="font-bold text-[14px]">사진 선택하기</span>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Type className="w-5 h-5" /></div>
                    <input
                      type="text" placeholder="어떤 추억인가요? (제목)" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] py-4 pl-12 pr-4 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar className="w-5 h-5" /></div>
                    <input
                      type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] py-4 pl-12 pr-4 text-[15px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all appearance-none"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-4 text-slate-400"><AlignLeft className="w-5 h-5" /></div>
                    <textarea
                      placeholder="이날의 이야기를 짧게 남겨주세요." value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)}
                      className="w-full bg-[#F7F9F9] rounded-[20px] py-4 pl-12 pr-4 min-h-[100px] resize-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all"
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: (!previewUrl || !uploadTitle || isSubmitting) ? 1 : 0.98 }}
                  onClick={handleSubmit}
                  disabled={!previewUrl || !uploadTitle || isSubmitting}
                  className="w-full mt-8 py-4 bg-[#10B981] text-white rounded-[24px] font-bold text-[16px] shadow-[0_8px_24px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center transition-all"
                >
                  {isSubmitting ? '저장 중...' : (isEditing ? '수정 완료' : '추억 저장하기')}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && selectedMemory && (
          <LightboxOverlay
            me={me}
            memory={selectedMemory}
            memories={memories}
            currentIndex={selectedPhotoIndex}
            onClose={() => setSelectedPhotoIndex(null)}
            onNext={() => setSelectedPhotoIndex(Math.min(selectedPhotoIndex + 1, memories.length - 1))}
            onPrev={() => setSelectedPhotoIndex(Math.max(selectedPhotoIndex - 1, 0))}
            onDelete={handleDelete}
            onEdit={openEditSheet}
            onHeart={() => onHeart(selectedMemory.id)}
            subscribeComments={subscribeComments}
            addComment={addComment}
            deleteComment={deleteComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// -------------------------------------------------------------
// Lightbox Sub-Component (Handles internal comment state/scroll)
// -------------------------------------------------------------
function LightboxOverlay({
  me, memory, memories, currentIndex, onClose, onNext, onPrev,
  onDelete, onEdit, onHeart, subscribeComments, addComment, deleteComment
}: {
  me: '우댕' | '꼼이', memory: Memory, memories: Memory[], currentIndex: number,
  onClose: () => void, onNext: () => void, onPrev: () => void,
  onDelete: (id: string) => void, onEdit: (memory: Memory) => void,
  onHeart: () => void,
  subscribeComments: Props['subscribeComments'], addComment: Props['addComment'], deleteComment: Props['deleteComment']
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to comments
  useEffect(() => {
    const unsubscribe = subscribeComments(memory.id, (newComments) => {
      setComments(newComments);
      // 부드러운 자동 스크롤
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [memory.id, subscribeComments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSending(true);
    try {
      await addComment(memory.id, commentText);
      setCommentText('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950 flex flex-col z-50 max-w-md mx-auto"
    >
      {/* Lightbox Header */}
      <div className="shrink-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent z-10 pt-safe text-white absolute top-0 left-0 right-0">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(memory)} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20">
            <Pencil className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(memory.id)} className="p-2 bg-white/10 rounded-full backdrop-blur-md text-red-400 hover:text-red-300 hover:bg-white/20">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative pb-4">

        {/* Swipeable Image Viewer */}
        <div className="w-full shrink-0 relative bg-black flex items-center justify-center min-h-[50vh] md:min-h-[60vh] touch-pan-y"
             onPointerDown={(e) => e.stopPropagation()}>
          <motion.img
            key={memory.id}
            layoutId={`memory-img-${memory.id}`}
            src={memory.imageUrl}
            alt={memory.title}
            className="w-full max-h-full object-contain"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 && currentIndex < memories.length - 1) onNext();
              if (info.offset.x > 60 && currentIndex > 0) onPrev();
            }}
          />
          {currentIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 p-3 bg-black/40 text-white rounded-full backdrop-blur-md">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < memories.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 p-3 bg-black/40 text-white rounded-full backdrop-blur-md">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Details & Comments Area (Attached directly below image) */}
        <div className="flex-1 bg-white rounded-t-[32px] -mt-6 z-10 p-6 flex flex-col">
          {/* Header Info */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-bold text-[#10B981]">{memory.date}</span>
              <h2 className="text-2xl font-black text-slate-800 leading-snug mt-0.5">{memory.title}</h2>
            </div>
            <HeartButton count={memory.hearts} onHeart={onHeart} isLarge />
          </div>

          {memory.description && (
            <p className="text-[15px] font-medium text-slate-600 leading-relaxed mb-6">
              {memory.description}
            </p>
          )}

          <div className="h-px bg-slate-100 w-full mb-6" />

          {/* Comment List */}
          <div className="flex-1 flex flex-col gap-5">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageCircle size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-[14px] font-bold">첫 번째 댓글을 남겨보세요!</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex items-start gap-3 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 mt-0.5 shadow-inner ${getAvatarColor(comment.by)}`}>
                    {comment.by.substring(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-slate-700">{comment.by}</span>
                      <span className="text-[11px] font-medium text-slate-400">{formatRelative(comment.createdAt)}</span>
                    </div>
                    <p className="text-[14px] font-medium text-slate-600 break-words leading-snug">
                      {comment.text}
                    </p>
                  </div>
                  {comment.by === me && (
                    <button
                      onClick={() => { if(confirm('삭제할까요?')) deleteComment(memory.id, comment.id); }}
                      className="shrink-0 p-2 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Comment Input */}
      <div className="shrink-0 bg-white border-t border-slate-100 p-4 pb-safe">
        <form onSubmit={handleSendComment} className="flex items-center gap-3 bg-[#F7F9F9] p-1.5 pl-4 rounded-full">
          <input
            type="text"
            placeholder="댓글 달기..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-transparent text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSending}
            className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-300 transition-colors shrink-0"
          >
            <Send size={16} className="-ml-0.5 mt-0.5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
