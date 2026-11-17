'use client';

// 이모티콘 관리 — 서랍에 띄울 팩 고르기·입력할 때 추천·탭 순서 처음대로(lib/emoPrefs.ts). 사이담 /settings/emoticons 를 옮김.
// 꼼톡 서랍 「관리」 단추와 **같은 화면**이다(components/EmoticonManager). 서랍을 안 열어 본 사람도
// 찾을 수 있게 홈 아래(「카드 배치 바꾸기」 옆)에 입구를 하나 더 둔다.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { honeyMe } from '@/lib/honeybrary';
import { defaultPacks, useEmoPrefs } from '@/lib/emoPrefs';
import EmoticonManager from '@/components/EmoticonManager';

export default function EmoticonSettings() {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => {
    const who = honeyMe();
    if (!who) { router.replace('/'); return; }
    setMe(who);
  }, [router]);
  const sets = useMemo(() => (me ? defaultPacks(me).map((t) => ({ id: t.id, title: t.name, thumbnailUrl: t.thumb })) : []), [me]);
  const { prefs, setShown, setSuggestions, resetOrder } = useEmoPrefs(me ?? '');
  // ⚠️ 이 화면이 앱에서 처음 연 화면이면 뒤로 갈 데가 없다 — 그땐 홈으로.
  const back = () => { if (window.history.length > 1) router.back(); else router.replace('/'); };

  return (
    <main className="sd-app min-h-screen px-5 pb-10" style={{ background: 'var(--sd-bg, #FCFAF7)', paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full max-w-[440px] mx-auto mt-8">
        <button onClick={back} className="inline-flex items-center gap-1.5 text-[13.5px] mb-6 min-h-[44px]"
                style={{ color: 'var(--sd-muted)' }}>
          <ArrowLeft size={15} /> 돌아가기
        </button>
        <h1 className="text-[24px] font-extrabold mb-3" style={{ color: 'var(--sd-ink)' }}>이모티콘 관리</h1>
        {me
          ? <EmoticonManager sets={sets} prefs={prefs} onShown={setShown} onSuggestions={setSuggestions} onResetOrder={resetOrder} />
          : <p className="text-[13.5px]" style={{ color: 'var(--sd-faint)' }}>불러오는 중…</p>}
      </div>
    </main>
  );
}
