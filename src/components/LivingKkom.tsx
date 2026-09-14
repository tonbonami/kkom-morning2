'use client';

// 살아있는 꼼이 — 홈 최상단 마스코트. 새 그림 없이 '지금 있는 움짤'을 기분으로 재활용한다.
// ⚠️ 절대 다그치지 않는다(오늘의 조각 철학): 스트릭·"N일째 조용" 없음.
//    그냥 지금 공간이 어떤 느낌인지 '존재'로만 말한다. 움짤이 계속 움직여 = 살아있음.
import { isTogetherNow, serverNow, type Presence } from '@/lib/presence';

const V = 4;   // sai-anim 캐시 버전(EMO_V와 맞춤)
const emo = (name: string) => `/emo/sai-anim/${name}.webp?v=${V}`;

type Mood = { name: string; caption: string };

// 우선순위: 함께 > 아침 > 밤 > 방금 다녀감 > 각자의 시간.
function moodFor(p: Presence, partner: string): Mood {
  if (isTogetherNow(p)) return { name: 'hug', caption: '지금 둘 다 여기 있어 💚' };
  const hour = new Date(serverNow() + 9 * 3600_000).getUTCHours();   // KST 시각
  if (hour >= 5 && hour < 10) return { name: 'sunrise', caption: '좋은 아침이야 ☀️' };
  if (hour >= 22 || hour < 5) return { name: 'night', caption: '고요한 밤이네' };
  const subj = partner === '우댕' ? '우댕이가' : '꼼이가';
  const lastMin = p.lastSeenAt ? (serverNow() - p.lastSeenAt.getTime()) / 60_000 : Infinity;
  if (lastMin < 120) return { name: 'peek', caption: `${subj} 방금 다녀갔어` };
  return { name: 'bed', caption: '지금은 각자의 시간' };
}

export default function LivingKkom({ presence, partner, tick }: { presence: Presence; partner: string; tick?: number }) {
  void tick;   // 부모 presenceTick(매분) → 재렌더로 기분 갱신
  const mood = moodFor(presence, partner);
  return (
    <div className="flex h-full items-center gap-4 rounded-[22px] px-5 py-4"
      style={{ background: 'linear-gradient(135deg, #FFF6F0 0%, #FCEEF3 100%)', boxShadow: '0 6px 18px -12px rgba(180,100,120,0.28)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={emo(mood.name)} alt="꼼이" className="h-[92px] w-[92px] shrink-0 object-contain drop-shadow-sm" />
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold uppercase tracking-[2px]" style={{ color: '#D98BA8' }}>살아있는 꼼이</div>
        <div className="mt-1 text-[16px] font-bold leading-snug" style={{ color: 'var(--sd-ink)' }}>{mood.caption}</div>
      </div>
    </div>
  );
}
