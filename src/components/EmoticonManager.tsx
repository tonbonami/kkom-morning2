'use client';
/**
 * 이모티콘 관리 — 서랍에 띄울 팩을 고르고, 입력할 때 추천을 켜고 끈다(lib/emoPrefs.ts).
 * 꼼톡 서랍 안(「관리」 단추)과 홈 아래 「이모티콘 관리」(/settings/emoticons), 두 곳에서 같은 걸 그린다.
 * 사이담 src/components/EmoticonManager.tsx 를 옮김.
 *
 * ⚠️ 스위치 이름은 「서랍에 표시」다. 「켜기/끄기」는 받은 그림까지 꺼지는 것처럼 들린다.
 */
import { useState } from 'react';
import { withOrder, type EmoPrefs } from '@/lib/emoPrefs';

export interface ManagedSet { id: string; title: string; thumbnailUrl: string }

export default function EmoticonManager({ sets: rawSets, prefs, onShown, onSuggestions, onResetOrder, compact }: {
  sets: ManagedSet[];
  prefs: EmoPrefs;
  onShown: (setId: string, shown: boolean) => Promise<boolean>;
  onSuggestions: (on: boolean) => Promise<boolean>;
  /** 탭 순서를 처음대로 되돌린다. 순서를 바꾼 적이 없으면 단추가 안 뜬다. */
  onResetOrder?: () => Promise<boolean>;
  /** 서랍 안에 들어갈 때 — 여백을 줄인다 */
  compact?: boolean;
}) {
  const [err, setErr] = useState('');
  const sets = withOrder(rawSets, prefs);   // 서랍 탭과 같은 순서로 보여 준다
  const run = async (p: Promise<boolean>) => {
    setErr('');
    if (!(await p)) setErr('저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
  };
  const row = 'flex items-center gap-3 rounded-2xl px-3 py-2';
  return (
    <div className={compact ? '' : 'flex flex-col gap-3'}>
      <p className="text-[12.5px] leading-relaxed mb-2 px-0.5" style={{ color: 'var(--sd-muted)' }}>
        내 서랍과 추천에 표시할 이모티콘을 골라요. 받은 이모티콘은 그대로 보여요.
        <br />서랍 위 탭을 <b style={{ color: 'var(--sd-ink)' }}>꾹 눌러 좌우로 옮기면</b> 순서가 바뀌어요.
      </p>
      <div className="flex flex-col gap-1.5">
        {sets.map((s) => {
          const shown = !prefs.hiddenSetIds.includes(s.id);
          return (
            <div key={s.id} className={row} style={{ background: 'var(--sd-card-solid)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.thumbnailUrl} alt="" className="w-9 h-9 object-contain shrink-0"
                   style={{ opacity: shown ? 1 : 0.45 }} />
              <span className="flex-1 min-w-0 truncate text-[14px] font-bold"
                    style={{ color: shown ? 'var(--sd-ink)' : 'var(--sd-faint)' }}>{s.title}</span>
              <Switch on={shown} label={`${s.title} 서랍에 표시`} onChange={(v) => run(onShown(s.id, v))} />
            </div>
          );
        })}
      </div>
      <div className={`${row} mt-3`} style={{ background: 'var(--sd-card-solid)' }}>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-bold" style={{ color: 'var(--sd-ink)' }}>입력할 때 이모티콘 추천</span>
          <span className="block text-[12px]" style={{ color: 'var(--sd-muted)' }}>
            글을 치면 어울리는 그림을 입력칸 옆에 띄워요
          </span>
        </span>
        <Switch on={prefs.suggestionsEnabled} label="입력할 때 이모티콘 추천"
                onChange={(v) => run(onSuggestions(v))} />
      </div>
      {onResetOrder && prefs.order.length > 0 && (
        <button onClick={() => run(onResetOrder())}
                className="mt-3 self-start px-0.5 text-[12.5px] underline underline-offset-2"
                style={{ color: 'var(--sd-muted)' }}>
          탭 순서 처음대로
        </button>
      )}
      {err && <p className="mt-2 px-0.5 text-[12.5px]" style={{ color: 'var(--sd-crit)' }}>{err}</p>}
    </div>
  );
}

export function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
            className="relative shrink-0 w-[44px] h-[26px] rounded-full transition-colors"
            style={{ background: on ? 'var(--sd-rel)' : 'var(--sd-line)' }}>
      <span className="absolute top-[3px] w-5 h-5 rounded-full transition-all"
            style={{ left: on ? 21 : 3, background: 'var(--sd-card-solid)', boxShadow: '0 1px 2px rgba(0,0,0,.18)' }} />
    </button>
  );
}
