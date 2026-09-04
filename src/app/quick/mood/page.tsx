'use client';

// 오늘 기분 빠른 설정 — PWA 숏컷 + 홈 기분카드 탭 진입점.
// 레이아웃은 사이담 quick/mood 와 동일(sd-card 셀 · 68px 얼굴 · mood-* 애니메이션).
// 신원만 꼼모닝 방식(localStorage['kkom-user']) 그대로 둔다.
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
    // ⚠️ router.push 를 try 안에 둔다 — 저장 실패해도 화면이 넘어가면 저장된 줄 안다.
    try {
      await setMyMood(me, id);
      router.push('/');
    } catch (e) {
      console.error('기분 저장 실패:', e);
    }
  };

  if (!me) return <div className="sd-app min-h-app max-w-md mx-auto" />;

  return (
    <main
      className="sd-app min-h-app max-w-md mx-auto px-6 pb-6"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >
      <button
        onClick={() => router.push('/')}
        className="mb-6 p-2 -ml-2 active:scale-90 transition-transform"
        style={{ color: 'var(--sd-muted)' }}
        aria-label="홈으로"
      >
        <ArrowLeft size={22} />
      </button>

      {/* '오늘 기분'만 있으면 누구 기분인지 안 보인다 — 기분은 내 것만 남길 수 있다. */}
      <h1 className="text-[30px] font-extrabold tracking-[-0.03em] mb-1" style={{ color: 'var(--sd-ink)' }}>
        오늘 내 기분
      </h1>
      <p className="text-[14px] mb-8" style={{ color: 'var(--sd-muted)' }}>
        한 번 누르면 바로 저장돼요
      </p>

      <div className="grid grid-cols-3 gap-3">
        {MOOD_OPTIONS.map((opt) => (
          <motion.button
            key={opt.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => pickMood(opt.id)}
            className="sd-card aspect-square flex flex-col items-center justify-center gap-1 p-3"
          >
            <Image
              src={opt.image}
              alt={opt.label}
              width={68}
              height={68}
              className={opt.anim ? `mood-${opt.anim}` : undefined}
              style={{ maxWidth: 'none' }}
            />
            <span className="text-[12px] font-bold mt-1" style={{ color: 'var(--sd-muted)' }}>
              {opt.label}
            </span>
          </motion.button>
        ))}
      </div>
    </main>
  );
}
