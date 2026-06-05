'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Check, X } from 'lucide-react';
import { nameFromCode, partnerOf } from '@/lib/letters';

type Status = 'sending' | 'sent' | 'error';

export default function QuickBumpPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('sending');
  const [partner, setPartner] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) { router.push('/login'); return; }
    const me = nameFromCode(JSON.parse(userStr).로그인코드);
    const p = partnerOf(me);
    setPartner(p);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/bump', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: me, to: p }),
        });
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.ok ? 'sent' : 'error');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    const t = setTimeout(() => router.push('/'), 2400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-[#F7F9F9] max-w-md mx-auto flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={status === 'sent'
          ? { scale: [1, 1.2, 1], opacity: 1 }
          : status === 'error'
          ? { scale: 1, opacity: 1 }
          : { scale: [1, 1.1, 1], opacity: 1 }
        }
        transition={{ duration: status === 'sending' ? 1.2 : 0.5, repeat: status === 'sending' ? Infinity : 0 }}
        className="w-24 h-24 rounded-full bg-white shadow-[0_8px_30px_rgba(252,165,165,0.4)] flex items-center justify-center mb-6"
      >
        {status === 'error' ? (
          <X size={40} className="text-slate-400" />
        ) : (
          <Heart size={48} className="text-[#FCA5A5] fill-[#FCA5A5]" />
        )}
      </motion.div>

      <h1 className="text-2xl font-black text-slate-800 mb-2 leading-tight">
        {status === 'sending' && `${partner || '상대'}한테 마음 전하는 중...`}
        {status === 'sent' && (
          <span className="flex items-center gap-2 justify-center">
            <Check size={22} className="text-[#10B981]" strokeWidth={3} />
            보고싶다고 전했어요
          </span>
        )}
        {status === 'error' && '앗, 전송 실패'}
      </h1>
      <p className="text-sm text-slate-500">
        {status === 'sent' && `${partner}한테 도착했어요 💚`}
        {status === 'sending' && '잠깐만요'}
        {status === 'error' && '잠시 후 다시 시도해주세요'}
      </p>
      <button
        onClick={() => router.push('/')}
        className="mt-10 text-[13px] font-bold text-slate-400 underline-offset-2 hover:underline"
      >
        홈으로 바로 가기
      </button>
    </div>
  );
}
