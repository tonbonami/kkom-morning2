'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { subscribeAllLetters, nameFromCode, isLocked, type Letter } from '@/lib/letters';
import type { Timestamp } from 'firebase/firestore';

function fmt(t?: Timestamp | null): string {
  if (!t?.toDate) return '';
  const d = t.toDate();
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function LettersPage() {
  const router = useRouter();
  const [me, setMe] = useState('');
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setMe(nameFromCode(JSON.parse(userStr).로그인코드));
    const unsub = subscribeAllLetters((ls) => {
      setLetters(ls);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md mx-auto p-6 space-y-5">
        <header className="flex items-center gap-3 pt-2">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl bg-white/60 border border-white/60 text-slate-500 active:scale-90 transition-all"
            aria-label="홈"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-emerald-600">
            <Mail size={18} strokeWidth={2.5} />
            <h1 className="text-lg font-black tracking-tight text-slate-900">편지 보관함</h1>
          </div>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200/50 animate-pulse" />
            ))}
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Mail size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">아직 주고받은 편지가 없어요 💌</p>
          </div>
        ) : (
          <div className="space-y-3">
            {letters.map((l, idx) => {
              const locked = isLocked(l);
              const mine = l.from === me;
              return (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                >
                  <Card variant="glass" className={cn(locked && 'opacity-90')}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black tracking-widest uppercase text-emerald-600">
                          {mine ? `${me} → ${l.to}` : `${l.from} → 나`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{fmt(l.createdAt)}</span>
                      </div>

                      {locked ? (
                        <div className="flex items-center gap-2 text-slate-400 py-2">
                          <Lock size={14} />
                          <span className="text-sm font-medium">
                            {fmt(l.openAt)}에 도착하는 편지예요
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {l.body && (
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{l.body}</p>
                          )}
                          {l.voice && (
                            <audio
                              controls
                              src={`data:${l.voice.mime};base64,${l.voice.data}`}
                              className="w-full h-10 rounded-xl"
                            />
                          )}
                        </div>
                      )}

                      {!locked && l.openAt && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                          <Clock size={10} /> 예약 편지
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
