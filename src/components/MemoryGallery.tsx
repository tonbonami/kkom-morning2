'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import type { MemoryPhoto } from '@/types';

// ✅ 디자인 포인트 1: 아날로그 감성을 더하는 마스킹 테이프
const WashiTape = () => (
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-7 bg-white/30 backdrop-blur-sm border border-white/20 -rotate-1 shadow-sm z-30 flex items-center justify-center">
    <div className="w-full h-[1px] bg-white/10" />
  </div>
);

interface MemoryGalleryProps {
  photos: MemoryPhoto[];
}

export default function MemoryGallery({ photos }: MemoryGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const current = photos[currentIndex];

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm mx-auto px-2 py-6 relative"
    >
      <WashiTape />

      {/* ✅ 디자인 포인트 2: 종이 질감이 느껴지는 폴라로이드 카드 */}
      <div className="relative bg-[#fdfdfd] p-4 pb-12 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-[0.5px] border-slate-200 group">
        
        {/* 이미지 영역 (인화 구역) */}
        <div className="relative w-full aspect-[4/5] bg-slate-100 shadow-inner overflow-hidden border border-slate-100/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full"
            >
              <Image
                src={current.imageUrl}
                alt={current.title}
                fill
                className="object-cover sepia-[0.1] contrast-[1.05]"
                sizes="(max-width: 768px) 100vw, 400px"
                priority={currentIndex === 0}
              />
            </motion.div>
          </AnimatePresence>

          {/* 컨트롤 버튼 (반투명 처리) */}
          {photos.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handlePrev} 
                className="p-1 bg-white/60 backdrop-blur-md rounded-full shadow-md hover:bg-white transition-all"
                aria-label="이전 사진"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNext} 
                className="p-1 bg-white/60 backdrop-blur-md rounded-full shadow-md hover:bg-white transition-all"
                aria-label="다음 사진"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* ✅ 디자인 포인트 3: 손글씨 텍스트 영역 */}
        <div className="mt-8 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-pink-400 mb-1">
            <Heart size={12} className="fill-pink-400" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Our Memory</span>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight italic">
            {current.title}
          </h3>
          
          <p className="text-xs text-slate-500 font-medium px-4">
            {current.description}
          </p>
          
          <div className="pt-4 flex justify-center items-center gap-2">
            <div className="h-[1px] w-4 bg-slate-200" />
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              {current.date}
            </p>
            <div className="h-[1px] w-4 bg-slate-200" />
          </div>
        </div>

        {/* 인디케이터 (미니멀 디자인) */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
            {photos.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all ${
                  i === currentIndex ? "w-4 bg-pink-300" : "w-1 bg-slate-100"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 카운터 */}
      <p className="text-center text-[9px] font-black text-slate-400/50 mt-4 tracking-[0.2em] uppercase">
        Memories Archive {currentIndex + 1} of {photos.length}
      </p>
    </motion.div>
  );
}