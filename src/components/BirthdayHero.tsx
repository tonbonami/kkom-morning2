'use client';

// 생일 히어로 — 9/20(KST)에 홈 최상단에 뜬다. 배너 + 파티모자 헐 + 케이크 + '함께 N번째' +
//   (생일 당사자) 우댕이 미리 써둔 편지 카드→모달. 꽃가루는 최초 1회 낙하.
//   ⚠️ 전체화면 오버레이(꽃가루·모달)는 반드시 body로 portal — 홈이 <main z-10> 안이라
//      안 그러면 하단 이모티콘 바(z-40)에 가린다. [[gotcha-home-overlay-portal]]
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  birthdayPersonToday, birthdayYear, nthTogether, subscribeBirthdayLetter, type BirthdayLetter,
} from '@/lib/birthday';

const subj = (n: string) => (n === '우댕' ? '우댕이' : '꼼이');

export default function BirthdayHero({ me, partner }: { me: string; partner: string }) {
  const who = birthdayPersonToday();
  const year = birthdayYear();
  const iAmBirthday = !!who && me === who;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [letter, setLetter] = useState<BirthdayLetter | null>(null);
  useEffect(() => {
    if (!who || !iAmBirthday) return;
    return subscribeBirthdayLetter(who, year, setLetter);
  }, [who, iAmBirthday, year]);

  const [open, setOpen] = useState(false);

  const confetti = useMemo(() => {
    const cols = ['#FB7BA8', '#FCD34D', '#7ED0BE', '#B9A6E6', '#FF9DC0', '#FFE08A'];
    return Array.from({ length: 32 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 0.7,
      dur: 2.4 + Math.random() * 1.8, col: cols[i % cols.length],
      rot: Math.random() * 360, round: i % 3 === 0,
    }));
  }, []);

  if (!who) return null;
  const nth = nthTogether(year);

  return (
    <>
      <div className="relative overflow-hidden rounded-[22px] px-5 pt-4 pb-4"
        style={{ background: 'linear-gradient(150deg,#FFF6F0,#FCEEF3)', boxShadow: '0 10px 26px -16px rgba(224,86,143,.55)' }}>
        {/* 배너 */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[15px] font-extrabold text-white"
            style={{ background: 'linear-gradient(180deg,#FB7BA8,#E0568F)', boxShadow: '0 8px 16px -8px rgba(224,86,143,.6)' }}>
            🎂 {subj(who)} 생일 축하해
          </div>
        </div>

        {/* 마스코트 + 케이크 */}
        <div className="relative mt-1 flex items-end justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img src="/emo/birthday/hul-party.webp" alt={`파티모자 쓴 ${subj(who)}`}
            className="h-40 w-40 object-contain"
            animate={{ y: [0, -5, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emo/birthday/cake.webp" alt="생일 케이크"
            className="absolute bottom-1 right-2 h-16 w-16 object-contain drop-shadow-md" />
        </div>

        {/* 함께 N번째 */}
        <div className="mt-1 text-center text-[12px] font-semibold" style={{ color: 'var(--sd-muted)' }}>
          우리가 함께 맞는 {nth}번째 {subj(who)} 생일 💗
        </div>

        {/* 편지 카드 — 생일 당사자 + 편지 있을 때 */}
        {iAmBirthday && letter && (
          <button onClick={() => setOpen(true)}
            className="mt-3 flex w-full items-center gap-3 rounded-[18px] border border-white/70 bg-white/85 px-4 py-3 text-left backdrop-blur-md transition active:scale-[0.99]">
            <span className="text-[26px] leading-none">💌</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-extrabold" style={{ color: '#E0568F' }}>{subj(letter.from)}가 보낸 편지가 도착했어</span>
              <span className="block text-[12px]" style={{ color: 'var(--sd-muted)' }}>톡 눌러서 열어보기</span>
            </span>
          </button>
        )}

        {/* 주는 쪽(상대) 확인용 */}
        {!iAmBirthday && (
          <div className="mt-3 text-center text-[12.5px] font-semibold" style={{ color: 'var(--sd-muted)' }}>
            오늘 {subj(who)} 생일이야 🎉 {letter ? '편지도 도착해 있어.' : ''}
          </div>
        )}
      </div>

      {/* 꽃가루 — body로 portal, 최초 1회 낙하 */}
      {mounted && createPortal(
        <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
          {confetti.map((c) => (
            <span key={c.id} className="absolute top-[-6%]"
              style={{
                left: `${c.left}%`, width: 9, height: c.round ? 9 : 13,
                borderRadius: c.round ? '50%' : 2, background: c.col, opacity: 0.9,
                animation: `bdayfall ${c.dur}s linear ${c.delay}s 1 forwards`,
              }} />
          ))}
          <style>{`@keyframes bdayfall{from{transform:translateY(-10vh) rotate(0)}to{transform:translateY(115vh) rotate(560deg);opacity:0}}
            @media (prefers-reduced-motion:reduce){[style*="bdayfall"]{animation:none!important;opacity:0!important}}`}</style>
        </div>,
        document.body,
      )}

      {/* 편지 모달 */}
      {mounted && createPortal(
        <AnimatePresence>
          {open && letter && (
            <>
              <motion.div className="fixed inset-0 z-[80] bg-black/40"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
              {/* ⚠️ 중앙정렬은 flex 래퍼로 — motion의 transform이 Tailwind -translate-x-1/2를 덮어써 어긋난다 */}
              <div className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center p-4">
                <motion.div
                  className="pointer-events-auto w-[min(90vw,400px)] rounded-[24px] bg-white p-6 shadow-2xl"
                  initial={{ scale: 0.9, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
                  <div className="text-center text-[28px]">💌</div>
                  <div className="mt-1 text-center text-[13px] font-extrabold" style={{ color: '#E0568F' }}>
                    {subj(letter.from)}가 {subj(who)}에게
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-[15.5px] leading-[1.85]" style={{ color: '#3B2D30' }}>{letter.text}</p>
                  <button onClick={() => setOpen(false)}
                    className="mt-6 h-12 w-full rounded-[16px] text-[14.5px] font-bold text-white active:scale-[0.98]"
                    style={{ background: 'linear-gradient(180deg,#FB7BA8,#E0568F)' }}>고마워 💗</button>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
