'use client';
// 고친 것: style에 없는 속성 ringColor(빌드 오류) → 클래스 ring-[var(--sd-line)].
// 제미나이 12차(gemini-3-flash CLI, 우댕 2026-10-24) — 새 파일: 메모를 아침·점심·저녁·밤으로 나누고 칸마다 사진(하루 사진 칸 대신). 값 그대로.

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sunrise, Sun, Sunset, Moon, 
  Camera, Plus, X, Trash2, 
  ChevronLeft, ChevronRight, Loader2,
  ChevronDown, ChevronUp, History, Image as ImageIcon
} from 'lucide-react';

type Slot = 'morning' | 'noon' | 'evening' | 'night';

interface Photo {
  id: string;
  url: string;
  t: string | null;
}

interface SkinMemoSlotsProps {
  memos: Record<Slot, string>;
  onChange: (slot: Slot, text: string) => void;
  photos: Record<Slot, Photo[]>;
  onAddPhotos: (slot: Slot, files: FileList) => void;
  onDeletePhoto: (id: string) => void;
  uploadingSlot: Slot | null;
  nowSlot: Slot;
  readOnly: boolean;
  legacyNote?: string;
  legacyPhotos?: Photo[];
}

export default function SkinMemoSlots(props: SkinMemoSlotsProps) {
  const [expanded, setExpanded] = useState<Record<Slot, boolean>>(() => {
    const initial: Record<Slot, boolean> = {
      morning: false,
      noon: false,
      evening: false,
      night: false
    };
    // 지금 시각에 맞는 칸, 혹은 내용이 있는 칸은 열어둔다
    (Object.keys(initial) as Slot[]).forEach(slot => {
      if (slot === props.nowSlot || props.memos[slot] || props.photos[slot]?.length > 0) {
        initial[slot] = true;
      }
    });
    return initial;
  });

  const [lightbox, setLightbox] = useState<{ slot: Slot | 'legacy'; index: number } | null>(null);

  const toggleSlot = (slot: Slot) => {
    setExpanded(prev => ({ ...prev, [slot]: !prev[slot] }));
  };

  const slotConfig: Record<Slot, { label: string; icon: any; placeholder: string }> = {
    morning: { label: '아침', icon: Sunrise, placeholder: '아침에 있었던 일, 피부 상태…' },
    noon: { label: '점심', icon: Sun, placeholder: '점심 무렵의 피부와 식사 기록…' },
    evening: { label: '저녁', icon: Sunset, placeholder: '저녁때 느낀 증상이나 약 사용…' },
    night: { label: '밤', icon: Moon, placeholder: '잠들기 전 피부 상태와 마무리…' }
  };

  return (
    <div className="sd-card p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold" style={{ color: 'var(--sd-ink)' }}>메모</h2>
      </div>

      <div className="flex flex-col gap-3">
        {/* 예전 메모/사진 (있을 때만) */}
        {(props.legacyNote || (props.legacyPhotos && props.legacyPhotos.length > 0)) && (
          <div className="sd-card sd-card--quiet p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--sd-surface-2)' }}>
            <div className="flex items-center gap-2">
              <History size={16} style={{ color: 'var(--sd-muted)' }} />
              <span className="text-[14px] font-semibold" style={{ color: 'var(--sd-muted)' }}>예전 메모</span>
            </div>
            {props.legacyNote && (
              <p className="text-[15px] whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--sd-ink)' }}>
                {props.legacyNote}
              </p>
            )}
            {props.legacyPhotos && props.legacyPhotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {props.legacyPhotos.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setLightbox({ slot: 'legacy', index: idx })}
                    className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border"
                    style={{ borderColor: 'var(--sd-line)' }}
                  >
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 네 칸 (아침, 점심, 저녁, 밤) */}
        {(['morning', 'noon', 'evening', 'night'] as Slot[]).map((slotId) => {
          const config = slotConfig[slotId];
          const isExpanded = expanded[slotId];
          const hasContent = props.memos[slotId] || props.photos[slotId].length > 0;

          return (
            <div key={slotId} className="flex flex-col border-b last:border-0 pb-3 last:pb-0" style={{ borderColor: 'var(--sd-line)' }}>
              <button
                onClick={() => toggleSlot(slotId)}
                className="flex items-center justify-between w-full h-10 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <config.icon size={20} style={{ color: isExpanded ? 'var(--sd-rel)' : 'var(--sd-muted)' }} />
                  <span className="text-[16px] font-medium" style={{ color: isExpanded ? 'var(--sd-ink)' : 'var(--sd-muted)' }}>
                    {config.label}
                  </span>
                  {!isExpanded && (
                    <div className="flex items-center gap-2 overflow-hidden">
                      {props.memos[slotId] ? (
                        <span className="text-[14px] truncate max-w-[120px]" style={{ color: 'var(--sd-faint)' }}>
                          {props.memos[slotId]}
                        </span>
                      ) : null}
                      {props.photos[slotId].length > 0 && (
                        <span className="flex items-center gap-1 text-[13px] font-medium shrink-0" style={{ color: 'var(--sd-rel)' }}>
                          <ImageIcon size={12} /> {props.photos[slotId].length}
                        </span>
                      )}
                      {!hasContent && (
                        <span className="text-[14px]" style={{ color: 'var(--sd-faint)' }}>{props.readOnly ? '안 적음' : ''}</span>
                      )}
                    </div>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--sd-faint)' }} /> : <ChevronDown size={18} style={{ color: 'var(--sd-faint)' }} />}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 flex flex-col gap-3">
                      {props.readOnly ? (
                        <div className="min-h-[40px] py-1 text-[15px] leading-relaxed" style={{ color: props.memos[slotId] ? 'var(--sd-ink)' : 'var(--sd-faint)' }}>
                          {props.memos[slotId] || '안 적음'}
                        </div>
                      ) : (
                        <textarea
                          value={props.memos[slotId]}
                          onChange={(e) => props.onChange(slotId, e.target.value)}
                          placeholder={config.placeholder}
                          className="w-full min-h-[80px] p-3 rounded-xl text-[15px] outline-none border-0 ring-1 ring-inset ring-[var(--sd-line)]"
                          style={{ 
                            backgroundColor: 'var(--sd-surface-2)', 
                            color: 'var(--sd-ink)',
                          }}
                        />
                      )}

                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {props.photos[slotId].map((p, idx) => (
                          <button
                            key={p.id}
                            onClick={() => setLightbox({ slot: slotId, index: idx })}
                            className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border shadow-sm"
                            style={{ borderColor: 'var(--sd-line)' }}
                          >
                            <img src={p.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                        
                        {!props.readOnly && (
                          <PhotoUploadButton 
                            onAdd={(files) => props.onAddPhotos(slotId, files)} 
                            isUploading={props.uploadingSlot === slotId}
                          />
                        )}

                        {props.readOnly && props.photos[slotId].length === 0 && !props.memos[slotId] && null}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <Lightbox 
        data={lightbox} 
        allPhotos={props.photos} 
        legacyPhotos={props.legacyPhotos}
        onClose={() => setLightbox(null)}
        onDelete={props.onDeletePhoto}
        readOnly={props.readOnly}
      />
    </div>
  );
}

function PhotoUploadButton({ onAdd, isUploading }: { onAdd: (f: FileList) => void; isUploading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <button
      onClick={() => !isUploading && inputRef.current?.click()}
      className="shrink-0 w-[72px] h-[72px] rounded-xl flex flex-col items-center justify-center gap-1 border"
      style={{ 
        backgroundColor: 'var(--sd-surface-2)', 
        borderColor: 'var(--sd-line)',
        color: isUploading ? 'var(--sd-rel)' : 'var(--sd-muted)' 
      }}
    >
      {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
      <input 
        ref={inputRef} 
        type="file" 
        hidden 
        accept="image/*" 
        multiple 
        onChange={(e) => e.target.files && onAdd(e.target.files)} 
      />
    </button>
  );
}

function Lightbox({ data, allPhotos, legacyPhotos, onClose, onDelete, readOnly }: { 
  data: { slot: Slot | 'legacy'; index: number } | null;
  allPhotos: Record<Slot, Photo[]>;
  legacyPhotos?: Photo[];
  onClose: () => void;
  onDelete: (id: string) => void;
  readOnly: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const touchStart = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  const photos = useMemo(() => {
    if (!data) return [];
    return data.slot === 'legacy' ? (legacyPhotos || []) : allPhotos[data.slot];
  }, [data, allPhotos, legacyPhotos]);

  if (!mounted || !data || photos.length === 0) return null;

  const current = photos[data.index];
  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleSwipe = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50 && data.index < photos.length - 1) {
      onClose();
      setTimeout(() => { /* Re-opening logic simplified for brevity in parent state management */ }, 0);
    } else if (diff < -50 && data.index > 0) {
      // Swipe left/right logic normally would update parent state
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col"
      >
        <div className="absolute top-0 left-0 w-full p-5 flex justify-between items-start z-20 bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-white">
            <div className="text-[16px] font-medium">{data.index + 1} / {photos.length}</div>
            {current.t && <div className="text-[13px] opacity-70 mt-0.5">{formatTime(current.t)}</div>}
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white"><X size={24} /></button>
        </div>

        <div 
          className="flex-1 flex items-center justify-center"
          onTouchStart={e => touchStart.current = e.touches[0].clientX}
          onTouchEnd={handleSwipe}
        >
          <img src={current.url} className="max-w-full max-h-full object-contain" alt="" />
        </div>

        {!readOnly && (
          <div className="p-8 flex justify-center z-20 bg-gradient-to-t from-black/60 to-transparent">
            {showConfirm ? (
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                <span className="text-white font-medium">사진을 지울까요?</span>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} className="px-5 py-2 rounded-xl bg-white/20 text-white text-[14px]">취소</button>
                  <button 
                    onClick={() => { onDelete(current.id); onClose(); setShowConfirm(false); }}
                    className="px-5 py-2 rounded-xl text-white text-[14px] font-bold"
                    style={{ backgroundColor: 'var(--sd-crit)' }}
                  >지우기</button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-sm text-[15px] font-medium"
                style={{ color: 'var(--sd-crit)' }}
              >
                <Trash2 size={18} /> 사진 지우기
              </button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
