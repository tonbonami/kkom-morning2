'use client';

// '또 갈래' 페이지 — 위시리스트에서 ✓ 체크되어 옮겨진 / 직접 추가된 항목들의 단순 피드.
// 디자인 톤은 WishlistV1과 동일(같은 색/라운드/그림자), 단일 컬럼 리스트, 탭 없음.

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  ArrowLeft, MapPin, ExternalLink, Trash2, Utensils, Map, MonitorPlay,
  CheckCircle2, Camera, Undo2,
} from 'lucide-react';

export type Category = 'food' | 'place' | 'watch';

export interface AgainItem {
  id: string;
  category: Category;
  title: string;
  url?: string;
  preview?: { title?: string; description?: string; image?: string; siteName?: string };
  location?: string;
  memo?: string;
  by: '우댕' | '꼼이';
  sentBy: '우댕' | '꼼이';
  sentAt: Date;
}

interface Props {
  me: '우댕' | '꼼이';
  items: AgainItem[];
  onBack: () => void;
  onOpen?: (item: AgainItem) => void;       // URL 있을 때 미디어 모달
  onDelete: (id: string) => Promise<void>;
  onAddPhoto?: (item: AgainItem) => void;   // 갤러리로 점프
  onSendBack?: (item: AgainItem) => void;   // 위시리스트로 되돌리기
}

const CATEGORY_COLORS: Record<Category, string> = {
  food: 'bg-[#FCA5A5]',
  place: 'bg-[#10B981]',
  watch: 'bg-[#C4B5FD]',
};

function categoryIcon(c: Category, size = 22) {
  if (c === 'food') return <Utensils size={size} />;
  if (c === 'place') return <Map size={size} />;
  return <MonitorPlay size={size} />;
}

function relTime(d: Date) {
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return '방금 전';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const day = Math.floor(h / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function AgainCard({
  item, isFirst, onOpen, onDelete, onAddPhoto, onSendBack,
}: {
  item: AgainItem;
  isFirst: boolean;
  onOpen?: (i: AgainItem) => void;
  onDelete: (id: string) => void;
  onAddPhoto?: (i: AgainItem) => void;
  onSendBack?: (i: AgainItem) => void;
}) {
  const controls = useAnimation();
  const [showHint, setShowHint] = useState(isFirst);

  useEffect(() => {
    if (isFirst) {
      controls.start({
        x: [0, -28, 0],
        transition: { delay: 0.5, duration: 0.6, ease: 'easeInOut' },
      });
      const t = setTimeout(() => setShowHint(false), 2500);
      return () => clearTimeout(t);
    }
  }, [isFirst, controls]);

  return (
    <div className="relative w-full rounded-[28px] overflow-hidden bg-red-50 mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center text-red-500 bg-red-100">
        <Trash2 size={24} />
      </div>

      <motion.div
        animate={controls}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => { if (info.offset.x < -60) onDelete(item.id); }}
        onClick={() => item.url && onOpen?.(item)}
        className="w-full bg-white rounded-[28px] relative z-10 flex gap-4 p-4 cursor-pointer"
      >
        {/* Left: image or icon */}
        <div className="shrink-0">
          {item.preview?.image ? (
            <img src={item.preview.image} alt="" className="w-14 h-14 rounded-2xl object-cover shadow-sm" draggable={false} />
          ) : (
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm ${CATEGORY_COLORS[item.category]}`}>
              {categoryIcon(item.category)}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="text-[16px] font-bold text-slate-800 truncate">{item.title}</h3>
          {item.location && (
            <div className="flex items-center gap-1 mt-1 text-[13px] font-medium text-slate-500">
              <MapPin size={12} /> <span className="truncate">{item.location}</span>
            </div>
          )}
          {item.memo && (
            <p className="mt-1.5 text-[13px] leading-snug text-slate-400 line-clamp-2">{item.memo}</p>
          )}

          <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1 text-[#10B981]">
              <CheckCircle2 size={12} /> {item.sentBy}이(가) 보냄 · {relTime(item.sentAt)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            {item.url && (
              <a
                href={item.url}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen?.(item); }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#10B981]"
              >
                사이트 보기 <ExternalLink size={12} />
              </a>
            )}
            {onAddPhoto && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddPhoto(item); }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md"
              >
                <Camera size={12} /> 사진 추가
              </button>
            )}
            {onSendBack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('위시리스트로 되돌릴까요?')) onSendBack(item);
                }}
                title="위시리스트로 되돌리기"
                className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md transition-colors"
              >
                <Undo2 size={12} /> 위시리스트로
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFirst && showHint && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 right-6 -translate-y-1/2 z-20 pointer-events-none bg-slate-800/90 text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-lg"
          >
            ← 밀어서 삭제
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AgainListV1({ me, items, onBack, onOpen, onDelete, onAddPhoto, onSendBack }: Props) {
  const sorted = useMemo(() => [...items].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime()), [items]);

  return (
    <div className="relative min-h-screen bg-[#F7F9F9] max-w-md mx-auto overflow-hidden font-sans text-slate-900 pb-20">
      <header className="sticky top-0 z-30 bg-[#F7F9F9]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2 -ml-2 text-slate-800">
            <ArrowLeft size={24} />
          </motion.button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tight">또 갈래</h1>
            <p className="text-[12px] font-bold text-slate-400 mt-0.5">총 {sorted.length}개 · 또 가고 싶은 곳</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-5 mt-2 flex flex-col">
        <AnimatePresence mode="popLayout">
          {sorted.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-32 pb-12 text-center"
            >
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center text-[#10B981] mb-5">
                <CheckCircle2 size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">아직 또 가고 싶은 곳이 없어요</h3>
              <p className="text-[14px] font-medium text-slate-500 leading-relaxed">
                위시리스트에서 ✓ 체크하면<br />여기로 자동 이동돼요
              </p>
            </motion.div>
          )}
          {sorted.map((item, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              key={item.id}
            >
              <AgainCard
                item={item}
                isFirst={i === 0}
                onOpen={onOpen}
                onDelete={(id) => { if (confirm('삭제할까요?')) onDelete(id); }}
                onAddPhoto={onAddPhoto}
                onSendBack={onSendBack}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
    </div>
  );
}
