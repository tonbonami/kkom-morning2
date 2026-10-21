'use client';
// 제미나이 시안(2026-10-21, 우댕 전달) — 피부 일지 사진 칸. 값 그대로.
// Aside 검수 고침(2026-10-21): 빈 상태 안내가 nowrap이라 잘림 → 줄바꿈 허용.
// Aside 2차 고침(2026-10-21): 보기 전용(우댕 폰)인데 「추가」·카메라 칸·지우기가 살아 있어 파일 고르기 창이 열림 → readOnly면 숨김.
// 보기 전용 + 사진 0장이면 「이 날 올린 사진이 없어요」(빈 상자만 보이던 것).

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, X, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface SkinPhotoStripProps {
  dateLabel: string;
  photos: { id: string; url: string; t: string | null }[];
  uploading: boolean;
  onAdd: (files: FileList) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export default function SkinPhotoStrip(props: SkinPhotoStripProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 전체화면(라이트박스) 상태
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 스와이프를 위한 터치 상태
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      props.onAdd(e.target.files);
    }
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = '';
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setShowDeleteConfirm(false);
  };

  const goPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
      setShowDeleteConfirm(false);
    }
  };

  const goNext = () => {
    if (lightboxIndex !== null && lightboxIndex < props.photos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
      setShowDeleteConfirm(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) goNext(); // 왼쪽으로 스와이프 (다음 사진)
    else if (diff < -50) goPrev(); // 오른쪽으로 스와이프 (이전 사진)
  };

  // 라이트박스 렌더링 (포탈)
  const renderLightbox = () => {
    if (lightboxIndex === null || !mounted || typeof document === 'undefined') return null;
    const currentPhoto = props.photos[lightboxIndex];
    if (!currentPhoto) {
      closeLightbox();
      return null;
    }

    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col"
        >
          {/* 상단 헤더 */}
          <div className="absolute top-0 left-0 w-full flex items-start justify-between p-4 z-10 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex flex-col text-white">
              <span className="text-[16px] font-medium">
                {lightboxIndex + 1} / {props.photos.length}
              </span>
              {currentPhoto.t && (
                <span className="text-[14px] text-white/80 mt-1">
                  {formatTime(currentPhoto.t)}
                </span>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={closeLightbox}
              className="p-2 text-white bg-black/30 rounded-full"
            >
              <X size={24} />
            </motion.button>
          </div>

          {/* 사진 영역 (스와이프 지원) */}
          <div
            className="flex-1 relative flex items-center justify-center w-full h-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {lightboxIndex > 0 && (
              <button onClick={goPrev} className="absolute left-4 p-3 text-white bg-black/40 rounded-full z-10 hidden sm:block">
                <ChevronLeft size={28} />
              </button>
            )}

            <img
              key={currentPhoto.id}
              src={currentPhoto.url}
              alt="피부 일지 기록"
              className="w-full h-full object-contain"
            />

            {lightboxIndex < props.photos.length - 1 && (
              <button onClick={goNext} className="absolute right-4 p-3 text-white bg-black/40 rounded-full z-10 hidden sm:block">
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* 하단 제어 영역 */}
          <div className="absolute bottom-0 left-0 w-full p-6 flex justify-center z-10 bg-gradient-to-t from-black/80 to-transparent pb-8">
            {props.readOnly ? null : showDeleteConfirm ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center gap-4 bg-gray-900/90 px-6 py-4 rounded-2xl"
              >
                <span className="text-[16px] text-white font-medium">사진을 지울까요?</span>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-5 py-2.5 rounded-xl bg-gray-700 text-white text-[14px]"
                  >
                    취소
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      props.onDelete(currentPhoto.id);
                      closeLightbox();
                    }}
                    className="px-5 py-2.5 rounded-xl text-white text-[14px] font-medium"
                    style={{ backgroundColor: 'var(--sd-crit)' }}
                  >
                    지우기
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900/60 backdrop-blur-sm"
                style={{ color: 'var(--sd-crit)' }}
              >
                <Trash2 size={20} />
                <span className="text-[15px] font-medium">사진 지우기</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <div className="sd-card p-5 flex flex-col gap-4">
      {/* 숨겨진 파일 인풋 */}
      <input
        type="file"
        hidden
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* 카드 상단 */}
      <div className="flex justify-between items-center">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-bold" style={{ color: 'var(--sd-ink)' }}>
            사진
          </h2>
          <span className="text-[14px]" style={{ color: 'var(--sd-muted)' }}>
            {props.dateLabel}
          </span>
        </div>
        {!props.readOnly && <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[14px] font-medium"
          style={{ backgroundColor: 'var(--sd-surface-2)', color: 'var(--sd-ink)' }}
        >
          <Plus size={16} /> 추가
        </motion.button>}
      </div>

      {/* 사진 가로 스크롤 영역 */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">

        {props.photos.map((p, idx) => (
          <motion.button
            key={p.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setLightboxIndex(idx)}
            className="shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden relative shadow-sm"
            style={{ border: '1px solid var(--sd-line)' }}
          >
            <img
              src={p.url}
              alt="피부 일지 썸네일"
              className="w-full h-full object-cover"
            />
          </motion.button>
        ))}

        {/* 추가/업로드 버튼 (맨 끝 고정) */}
        {!props.readOnly && <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => !props.uploading && fileInputRef.current?.click()}
          className="shrink-0 w-[88px] h-[88px] rounded-xl flex flex-col items-center justify-center gap-1"
          style={{
            backgroundColor: 'var(--sd-surface-2)',
            color: props.uploading ? 'var(--sd-faint)' : 'var(--sd-muted)',
            border: '1px solid var(--sd-line)'
          }}
          disabled={props.uploading}
        >
          {props.uploading ? (
            <Loader2 className="animate-spin" size={24} style={{ color: 'var(--sd-rel)' }} />
          ) : (
            <Camera size={24} />
          )}
        </motion.button>}

        {/* 사진이 1장도 없을 때 안내 문구 */}
        {/* 보기 전용인데 사진이 없으면 빈 상자만 보여 「안 올린 건지 안 보이는 건지」 헷갈렸다(우댕) → 한 줄 */}
        {props.photos.length === 0 && props.readOnly && (
          <span className="text-[14px] ml-1 leading-snug" style={{ color: 'var(--sd-faint)' }}>
            이 날 올린 사진이 없어요
          </span>
        )}
        {props.photos.length === 0 && !props.uploading && !props.readOnly && (
          <span
            className="text-[14px] ml-1 flex-1 min-w-[150px] leading-snug"
            style={{ color: 'var(--sd-faint)' }}
          >
            같은 자리를 같은 구도로 찍어 두면 비교하기 좋아요
          </span>
        )}
      </div>

      {/* 포탈로 띄워지는 라이트박스 */}
      {renderLightbox()}
    </div>
  );
}
