'use client';

// 생일 편지 미리 써두기 — 상대 생일이 14일 이내로 다가오면(오늘 제외) '준비하는 쪽'에게만 뜬다.
//   저장한 편지는 생일 당일 상대 홈(BirthdayHero)에 💌로 도착. 상대는 그 전엔 못 본다(서프라이즈).
//   ⚠️ 바텀시트는 body로 portal — [[gotcha-home-overlay-portal]]
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  birthdayPersonToday, birthdayYear, daysUntilBirthday,
  subscribeBirthdayLetter, saveBirthdayLetter, type BirthdayLetter,
} from '@/lib/birthday';

const subj = (n: string) => (n === '우댕' ? '우댕이' : '꼼이');

export default function BirthdayPrep({ me, partner }: { me: string; partner: string }) {
  const todayWho = birthdayPersonToday();
  const year = birthdayYear();
  const dleft = daysUntilBirthday(partner);
  // 상대 생일이 D-14 ~ D-1 사이 + 오늘은 아님(오늘이면 히어로가 담당)
  const show = !!me && dleft > 0 && dleft <= 14 && todayWho !== partner;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [existing, setExisting] = useState<BirthdayLetter | null>(null);
  useEffect(() => {
    if (!show) return;
    return subscribeBirthdayLetter(partner, year, setExisting);
  }, [show, partner, year]);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(() => { if (open && existing) setText(existing.text); }, [open, existing]);

  if (!show) return null;

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await saveBirthdayLetter(me, partner, year, text);
    setSaving(false); setOpen(false);
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2200);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="relative flex w-full items-center gap-3 overflow-hidden rounded-[20px] px-4 py-3.5 text-left transition active:scale-[0.99]"
        style={{ background: 'linear-gradient(135deg,#FFF1F6,#FCE8F0)', border: '1px solid rgba(224,86,143,.18)' }}>
        <span className="text-[26px] leading-none">🎁</span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white" style={{ background: '#FB7BA8' }}>D-{dleft}</span>
          <span className="block text-[15px] font-extrabold" style={{ color: '#E0568F' }}>{subj(partner)} 생일 준비</span>
          <span className="block text-[12.5px] font-semibold" style={{ color: 'var(--sd-muted)' }}>
            {savedFlash ? '편지 저장했어 💗' : existing ? '편지 준비 완료 ✅ · 다시 쓰기' : '✍️ 생일 편지 미리 써두기'}
          </span>
        </span>
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div className="fixed inset-0 z-[80] bg-black/35"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              <motion.div
                className="fixed inset-x-0 bottom-0 z-[81] rounded-t-[26px] bg-white px-5 pt-4"
                style={{ paddingBottom: 'max(1.2rem,env(safe-area-inset-bottom))' }}
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 34 }}>
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full" style={{ background: 'var(--sd-faint)' }} />
                <div className="text-[16px] font-extrabold" style={{ color: '#3B2D30' }}>💌 {subj(partner)}에게 생일 편지</div>
                <div className="mt-1 text-[12.5px] leading-[1.6]" style={{ color: 'var(--sd-muted)' }}>
                  생일 자정에 {subj(partner)} 홈에 딱 도착해. {subj(partner)}는 그 전엔 못 봐 — 비밀이야 🤫
                </div>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
                  placeholder={`${subj(partner)}에게 하고 싶은 말...`}
                  className="mt-3 w-full resize-none rounded-[16px] border p-3 text-[15px] leading-[1.75] outline-none focus:border-[#FB7BA8]"
                  style={{ borderColor: 'rgba(0,0,0,.1)', color: '#3B2D30' }} />
                <button onClick={save} disabled={!text.trim() || saving}
                  className="mt-3 h-12 w-full rounded-[16px] text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(180deg,#FB7BA8,#E0568F)' }}>
                  {saving ? '저장 중...' : existing ? '편지 다시 저장' : '편지 저장하기'}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
