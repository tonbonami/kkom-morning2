'use client';
/**
 * 이모티콘 관리 — 서랍에 띄울 팩을 고르고, 입력할 때 추천을 켜고 끈다(lib/emoPrefs.ts).
 * 꼼톡 서랍 안(「관리」 단추)과 홈 아래 「이모티콘 관리」(/settings/emoticons), 두 곳에서 같은 걸 그린다.
 * 사이담 src/components/EmoticonManager.tsx 를 옮김 — 2026-11-19 ≡ 순서 바꾸기·끄는 줄 들어 올리기·글자 선택 막기까지
 *   (사이담 b810b29·8a0053a·1816788, 우댕 「이모티콘 위치 수정 방식과 켜고 끄기 기능, 꼼모닝에도 만들자」).
 * ⚠️ 스위치 이름은 「서랍에 표시」다. 「켜기/끄기」는 받은 그림까지 꺼지는 것처럼 들린다.
 */
import { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { withOrder, type EmoPrefs } from '@/lib/emoPrefs';

export interface ManagedSet { id: string; title: string; thumbnailUrl: string }

export default function EmoticonManager({ sets: rawSets, prefs, onShown, onSuggestions, onResetOrder, onReorder, compact }: {
  sets: ManagedSet[];
  prefs: EmoPrefs;
  /** 순서 저장(보이는 팩 id 순서). 있으면 줄마다 손잡이(≡)가 생긴다 — 2026-11-19 우댕님:
   *  「탭을 꾹 눌렀는데도 안 움직여 — 설정 스위치 목록에서 순서를 바꾸는 게 더 편하지 않아?」 */
  onReorder?: (ids: string[]) => Promise<boolean>;
  onShown: (setId: string, shown: boolean) => Promise<boolean>;
  onSuggestions: (on: boolean) => Promise<boolean>;
  /** 탭 순서를 처음대로 되돌린다. 순서를 바꾼 적이 없으면 단추가 안 뜬다. */
  onResetOrder?: () => Promise<boolean>;
  /** 서랍 안에 들어갈 때 — 여백을 줄인다 */
  compact?: boolean;
}) {
  const [err, setErr] = useState('');
  const ordered = withOrder(rawSets, prefs);   // 서랍 탭과 같은 순서로 보여 준다
  // 끄는 동안은 내 목록을 쓴다 — 놓을 때 한 번만 저장(끌 때마다 저장하면 쓰기가 수십 번 나간다).
  const [draft, setDraft] = useState<ManagedSet[]>(ordered);
  const dragging = useRef(false);
  const key = ordered.map((x) => x.id).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!dragging.current) setDraft(ordered); }, [key]);
  const sets = onReorder ? draft : ordered;
  const commit = () => {
    dragging.current = false;
    if (!onReorder) return;
    const ids = draft.map((x) => x.id);
    if (ids.join(',') !== key) void run(onReorder(ids));
  };
  const run = async (p: Promise<boolean>) => {
    setErr('');
    if (!(await p)) setErr('저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
  };
  const row = 'flex items-center gap-3 rounded-2xl px-3 py-2';
  return (
    <div className={compact ? '' : 'flex flex-col gap-3'}>
      <p className="text-[12.5px] leading-relaxed mb-2 px-0.5" style={{ color: 'var(--sd-muted)' }}>
        내 서랍과 추천에 표시할 이모티콘을 골라요. 받은 이모티콘은 그대로 보여요.
        <br />{onReorder
          ? <>왼쪽 <b style={{ color: 'var(--sd-ink)' }}>≡ 를 잡고 위아래로 끌면</b> 서랍 탭 순서가 바뀌어요.</>
          : <>서랍 위 탭을 <b style={{ color: 'var(--sd-ink)' }}>꾹 눌러 좌우로 옮기면</b> 순서가 바뀌어요.</>}
      </p>
      {onReorder ? (
        // ⚠️ select-none + touch-callout none — 아이폰에서 손잡이를 꾹 누르면 **줄의 글자가 선택되고**
        //    복사·찾아보기 메뉴가 떠서 끌기가 시작되지 않았다(우댕님 2026-11-19 화면). 이 목록엔 고를 글자가 없다.
        <Reorder.Group axis="y" values={draft} onReorder={(v) => { dragging.current = true; setDraft(v); }}
                       className="flex flex-col gap-1.5 select-none"
                       style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}>
          {draft.map((s) => (
            <ManagerRow key={s.id} set={s} shown={!prefs.hiddenSetIds.includes(s.id)} cls={row}
                        onShown={(v) => run(onShown(s.id, v))} onDrop={commit} />
          ))}
        </Reorder.Group>
      ) : (
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
      )}
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

/** 순서를 바꿀 수 있는 한 줄 — **손잡이에서만** 끌린다(줄 전체를 잡게 하면 목록이 안 굴러간다. 홈 카드 배치와 같은 방식). */
function ManagerRow({ set: s, shown, cls, onShown, onDrop }: {
  set: ManagedSet; shown: boolean; cls: string; onShown: (v: boolean) => void; onDrop: () => void;
}) {
  const controls = useDragControls();
  return (
    // ⚠️ 끄는 줄은 **들려 보여야 한다**(크게·그림자·맨 위). 납작한 채로 끌면 비켜 올라오는 아래 줄만 눈에 띄어
    //    「1번을 잡았는데 2번이 움직인다」로 보였다(우댕님 2026-11-19).
    <Reorder.Item value={s} dragListener={false} dragControls={controls} onDragEnd={onDrop}
                  whileDrag={{ scale: 1.04, boxShadow: '0 10px 24px rgba(60,30,40,0.22)', zIndex: 20 }}
                  className={`${cls} relative`} style={{ background: 'var(--sd-card-solid)' }}>
      <span onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
            onContextMenu={(e) => e.preventDefault()}
            className="p-2 -ml-1.5 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
            role="button" aria-label={`${s.title} 순서 옮기기`}>
        <GripVertical className="w-[18px] h-[18px]" style={{ color: 'var(--sd-muted)' }} />
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.thumbnailUrl} alt="" draggable={false} className="w-9 h-9 object-contain shrink-0 pointer-events-none"
           style={{ opacity: shown ? 1 : 0.45 }} />
      <span className="flex-1 min-w-0 truncate text-[14px] font-bold"
            style={{ color: shown ? 'var(--sd-ink)' : 'var(--sd-faint)' }}>{s.title}</span>
      <Switch on={shown} label={`${s.title} 서랍에 표시`} onChange={onShown} />
    </Reorder.Item>
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
