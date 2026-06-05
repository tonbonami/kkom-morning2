'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { setMyMood, MOOD_OPTIONS } from '@/lib/moods';
import { nameFromCode } from '@/lib/letters';

export default function QuickMoodPage() {
  const router = useRouter();
  const [me, setMe] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드));
  }, [router]);

  const pickMood = async (id: string) => {
    if (!me) return;
    try { await setMyMood(me, id); } catch {}
    router.push('/');
  };

  if (!me) return <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto" />;

  return (
    <div className="min-h-screen bg-[#F7F9F9] max-w-md mx-auto px-6 py-6">
      <button
        onClick={() => router.push('/')}
        className="mb-6 p-2 -ml-2 text-slate-600 active:scale-90 transition-transform"
        aria-label="홈으로"
      >
        <ArrowLeft size={22} />
      </button>

      <h1 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">오늘 기분</h1>
      <p className="text-[14px] font-medium text-slate-500 mb-8">
        한 번 누르면 바로 저장돼요
      </p>

      <div className="grid grid-cols-3 gap-3">
        {MOOD_OPTIONS.map(opt => (
          <motion.button
            key={opt.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => pickMood(opt.id)}
            className="aspect-square rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-1 p-3 hover:bg-emerald-50/40 transition-colors"
          >
            <Image src={opt.image} alt={opt.label} width={56} height={56} className="drop-shadow-sm" />
            <span className="text-[12px] font-bold text-slate-600 mt-1">{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
