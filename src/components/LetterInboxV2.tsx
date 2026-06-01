'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Pencil, Lock, MailOpen, Clock, X, Mail } from 'lucide-react';
import VoicePlayer from '@/components/VoicePlayer';

export type Letter = {
  id: string;
  from: '우댕' | '꼼이';
  to: '우댕' | '꼼이';
  body: string;
  createdAt: Date;
  openAt?: Date | null;
  voice?: { src: string; mime?: string; duration?: number } | null;
};

interface LetterInboxProps {
  me: '우댕' | '꼼이';
  letters: Letter[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading: boolean;
  onWriteLetter: () => void;
  onBack?: () => void; // (통합 wiring) 헤더 ← 클릭
}

type FilterType = 'all' | 'received' | 'sent' | 'scheduled';

const formatRelative = (d: Date) => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = (h % 12) || 12;
  const time = `${ampm} ${h12}:${m.toString().padStart(2, '0')}`;
  if (diffDays === 0) return `오늘 ${time}`;
  if (diffDays === 1) return `어제 ${time}`;
  if (diffDays <= 3) return `${diffDays}일 전 ${time}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
};

const formatFullDate = (d: Date) => {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours() < 12 ? '오전' : '오후'} ${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export default function LetterInboxV2({
  me,
  letters,
  hasMore,
  onLoadMore,
  loading,
  onWriteLetter,
  onBack,
}: LetterInboxProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const now = new Date();

  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      const isReceived = l.to === me;
      const isSent = l.from === me;
      const isScheduled = l.openAt && l.openAt > now;

      if (filter === 'received') return isReceived && !isScheduled;
      if (filter === 'sent') return isSent && !isScheduled;
      if (filter === 'scheduled') return isScheduled;
      return true; // all
    });
  }, [letters, filter, me, now]);

  const avatarColor = (person: string) => person === '우댕' ? 'bg-[#10B981]' : 'bg-[#FCA5A5]';

  return (
    <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto relative font-sans text-slate-900 pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-[#F7F9F9]/90 backdrop-blur-md pt-safe">
        <div className="flex items-center justify-between px-6 py-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="p-2 -ml-2 text-slate-800">
            <ArrowLeft size={24} />
          </motion.button>
          <div className="text-center">
            <h1 className="text-lg font-bold">우리의 편지</h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              총 {letters.length}통 · 우댕 ↔ 꼼이
            </p>
          </div>
          <div className="w-10" /> {/* Balance for back button */}
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: '전체' },
            { id: 'received', label: '받은 편지' },
            { id: 'sent', label: '보낸 편지' },
            { id: 'scheduled', label: '예약 중' },
          ].map((f) => (
            <motion.button
              key={f.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f.id as FilterType)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-500 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>
      </header>

      {/* List */}
      <main className="px-5 mt-2 flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {filteredLetters.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center pt-24 pb-12 text-center"
            >
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center text-[#99E6D9] mb-5">
                <MailOpen size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">아직 주고받은 편지가 없어요</h3>
              <p className="text-[14px] text-slate-500 mb-8">서로의 진심을 담은 첫 편지를 써볼까요?</p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onWriteLetter}
                className="px-8 py-3.5 bg-[#10B981] text-white font-bold rounded-full shadow-[0_4px_16px_rgba(16,185,129,0.25)] flex items-center gap-2"
              >
                <Pencil size={18} /> 편지 쓰기
              </motion.button>
            </motion.div>
          )}

          {filteredLetters.map((letter, i) => {
            const isMeReceiving = letter.to === me;
            const isLocked = isMeReceiving && letter.openAt && letter.openAt > now;
            const isScheduledSent = !isMeReceiving && letter.openAt && letter.openAt > now;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                key={letter.id}
                onClick={() => !isLocked && setSelectedLetter(letter)}
                className={`relative bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden ${
                  isLocked ? 'bg-white/60' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${avatarColor(letter.from)}`} />
                    <span className="text-[13px] font-bold text-slate-600">
                      {letter.from} → {letter.to === me ? '나' : letter.to}
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-slate-400">
                    {formatRelative(letter.createdAt)}
                  </span>
                </div>

                {isLocked ? (
                  <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                    <Lock size={24} className="text-slate-300" />
                    <p className="text-[14px] font-bold text-slate-500">
                      {letter.openAt?.getMonth()! + 1}월 {letter.openAt?.getDate()}일 {letter.openAt?.getHours()}시에 도착해요
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[15px] leading-relaxed text-slate-700 line-clamp-2 mb-3">
                      {letter.body}
                    </p>
                    {letter.voice && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <VoicePlayer src={letter.voice.src} mime={letter.voice.mime} durationHint={letter.voice.duration} compact accent="emerald" />
                      </div>
                    )}
                  </>
                )}

                {isScheduledSent && (
                  <div className="absolute top-4 right-4 bg-[#FCA5A5]/10 text-[#FCA5A5] px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <Clock size={12} /> 예약됨
                  </div>
                )}
              </motion.div>
            );
          })}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="bg-white/60 h-32 rounded-[28px] animate-pulse" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {hasMore && !loading && filteredLetters.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onLoadMore}
            className="w-full py-4 mt-2 mb-8 rounded-[24px] border-2 border-dashed border-slate-200 text-[14px] font-bold text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
          >
            예전 편지 더 보기
          </motion.button>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md pointer-events-none z-30">
        <div className="relative w-full h-full">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onWriteLetter}
            className="absolute right-6 bottom-6 w-14 h-14 bg-[#10B981] rounded-full shadow-[0_8px_24px_rgba(16,185,129,0.35)] flex items-center justify-center text-white pointer-events-auto"
          >
            <Pencil size={24} fill="currentColor" strokeWidth={1} className="ml-0.5" />
          </motion.button>
        </div>
      </div>

      {/* Full Letter Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedLetter(null)}
                className="absolute top-5 right-5 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6 pr-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-inner ${avatarColor(selectedLetter.from)}`}>
                  <Mail size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">
                    {selectedLetter.from}의 편지
                  </h2>
                  <p className="text-[13px] font-medium text-slate-400 mt-0.5">
                    {formatFullDate(selectedLetter.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pb-6 text-[16px] text-slate-700 leading-[1.7] whitespace-pre-wrap">
                {selectedLetter.body}
              </div>

              {selectedLetter.voice && (
                <div className="pt-5 mt-auto border-t border-slate-100">
                  <VoicePlayer src={selectedLetter.voice.src} mime={selectedLetter.voice.mime} durationHint={selectedLetter.voice.duration} />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
