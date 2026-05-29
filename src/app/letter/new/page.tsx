'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Mail, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { sendLetter, nameFromCode, partnerOf } from '@/lib/letters';

export default function NewLetterPage() {
  const router = useRouter();
  const [me, setMe] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [openAtStr, setOpenAtStr] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('kkom-user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setMe(nameFromCode(user.로그인코드));
  }, [router]);

  const partner = me ? partnerOf(me) : '';

  const handleSend = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await sendLetter(me, body, scheduled && openAtStr ? new Date(openAtStr) : null);
      router.push('/');
    } catch (e) {
      console.error('편지 전송 실패:', e);
      setError('편지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <header className="flex items-center gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/60 border border-white/60 text-slate-500 active:scale-90 transition-all"
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-emerald-600">
            <Mail size={18} strokeWidth={2.5} />
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              {partner ? `${partner}에게 편지 쓰기` : '편지 쓰기'}
            </h1>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass">
            <CardContent className="p-5 space-y-4">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`${partner || '상대'}에게 전할 마음을 적어보세요…`}
                rows={8}
                autoFocus
                className="w-full resize-none bg-transparent outline-none text-slate-700 leading-relaxed text-sm placeholder:text-slate-400"
              />
              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </CardContent>
          </Card>
        </motion.div>

        <div className="rounded-2xl bg-white/50 border border-white px-4 py-3 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <Clock size={15} /> 예약 편지로 보내기
            </span>
            <input
              type="checkbox"
              checked={scheduled}
              onChange={(e) => setScheduled(e.target.checked)}
              className="w-5 h-5 accent-emerald-500"
            />
          </label>
          {scheduled && (
            <input
              type="datetime-local"
              value={openAtStr}
              onChange={(e) => setOpenAtStr(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-300"
            />
          )}
          {scheduled && (
            <p className="text-[11px] text-slate-400 leading-tight">
              이 날짜·시각이 되면 {partner || '상대'}에게 도착해요. 그 전엔 잠겨 있어요 🔒
            </p>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!body.trim() || sending || (scheduled && !openAtStr)}
          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-200/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100"
        >
          <Send size={16} strokeWidth={2.5} />
          {sending ? '보내는 중…' : scheduled ? '예약 편지 보내기' : '편지 보내기'}
        </button>
      </div>
    </div>
  );
}
