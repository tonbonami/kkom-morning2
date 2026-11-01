'use client';

// 잠 소리 — 자세한 화면(제미나이 시안 SleepSoundScreen 그대로, 여기선 데이터만 꽂는다).
//   소리는 아이폰 앱이 낸다(src/lib/sleepSound.ts → SleepSound.swift). 웹 브라우저·옛 빌드에선 available=false.
import { useRouter } from 'next/navigation';
import { SleepSoundScreen } from '@/components/SleepSoundScreen';
import { SLEEP_SOUNDS, useSleepSound } from '@/lib/sleepSound';

export default function SleepPage() {
  const router = useRouter();
  const s = useSleepSound();
  return (
    <SleepSoundScreen
      sounds={SLEEP_SOUNDS}
      selectedId={s.soundId}
      onSelect={s.select}
      endMode={s.prefs.endMode}
      onEndModeChange={s.setEndMode}
      morningTime={s.prefs.morningTime}
      onMorningTimeChange={s.setMorningTime}
      volume={s.prefs.volume}
      onVolumeChange={s.setVolume}
      playing={s.playing}
      remainingText={s.remainingText}
      available={s.available}
      onPlay={() => { void s.play(); }}
      onStop={() => { void s.stop(); }}
      onBack={() => router.push('/')}
    />
  );
}
