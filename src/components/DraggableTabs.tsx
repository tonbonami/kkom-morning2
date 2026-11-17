'use client';
/**
 * 꾹 눌러서 좌우로 옮기는 탭 줄 — 이모티콘 서랍의 팩 탭(카카오톡 「이모티콘 탭」과 같은 손짓).
 *
 * 우댕님 2026-11-17: *「카톡처럼 탭을 꾹 눌러서 좌우로 이동시켜서 자주 사용하는 거 앞으로 끌어오는 거.」*
 * 사이담 src/components/DraggableTabs.tsx(3dd9b2b)를 그대로 옮김 — 고칠 땐 두 앱을 같이.
 *
 * 동작
 *  · 톡 → 그 탭을 연다(onPick).
 *  · 꾹(0.4초) → 탭이 살짝 들리고, 손가락을 따라 좌우로 움직인다. 옆 탭의 가운데를 넘으면 자리가 바뀐다.
 *    손을 떼면 onReorder(새 순서).
 *  · 꾹 누르기 전에 손가락이 움직이면(8px) **그냥 가로 스크롤**이다 — 탭 줄이 길어서 밀어 보는 사람이 많다.
 *
 * ⚠️⚠️ **끄는 동안 가로 스크롤을 막는 건 touchmove 의 preventDefault 뿐이다.** touch-action 은 손가락이 닿는
 *    순간 정해져서, 꾹 누른 뒤에 바꿔도 안 먹는다. 그래서 **passive:false** 로 단 touchmove 에서 막는다
 *    (React 의 onTouchMove 는 passive 라 preventDefault 가 무시된다).
 * ⚠️ 끈 뒤에 따라오는 click 은 삼킨다 — 안 그러면 옮기자마자 그 탭이 열린다.
 * ⚠️ 길게 누르면 iOS 가 글자 선택·미리보기를 띄운다 — `-webkit-touch-callout: none` + `user-select: none`.
 * ⚠️ 그리는 모양(색·크기)은 부르는 쪽이 정한다(renderTab). 여기는 손짓만 맡는다.
 * ⚠️⚠️ **scrollRef 의 줄은 `position: relative` 여야 한다.** 탭 자리를 offsetLeft 로 재는데, 그 기준이
 *    「가장 가까운 위치 잡힌 조상」이다. 줄이 기준이 아니면 손가락 위치와 탭 자리가 어긋나 한 칸만 움직였다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const HOLD_MS = 400;
const SLOP = 8;
const EDGE = 36;   // 가장자리 이만큼 안으로 들어오면 줄을 굴린다

export interface DragTab { id: string }

export default function DraggableTabs<T extends DragTab>({
  items, onReorder, onPick, renderTab, scrollRef, labelOf, pressedOf,
}: {
  /** 화면 읽기용 이름·눌림 상태 — 단추 자체에 붙인다. */
  labelOf: (item: T) => string;
  pressedOf: (item: T) => boolean;
  items: T[];
  onReorder: (ids: string[]) => void;
  onPick: (item: T) => void;
  /** 탭 하나의 겉모습. `dragging` 이면 들린 모양으로 그리면 된다. */
  renderTab: (item: T, state: { dragging: boolean }) => React.ReactNode;
  /** 가로로 굴러가는 바깥 줄(끌다가 가장자리에 닿으면 굴린다). */
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  // 끄는 동안의 임시 순서. 끝나면 비운다(그다음은 부르는 쪽의 items 를 따른다).
  const [live, setLive] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dx, setDx] = useState(0);
  const press = useRef<{ id: string; x: number; y: number; pid: number; timer: number } | null>(null);
  const dragging = useRef(false);
  const swallowClick = useRef(false);
  const btns = useRef(new Map<string, HTMLButtonElement>());

  const order = live ?? items.map((t) => t.id);
  const byId = new Map(items.map((t) => [t.id, t]));
  const shown = order.map((id) => byId.get(id)).filter((t): t is T => !!t);

  // 끄는 동안 가로 스크롤 막기 — passive:false 라야 preventDefault 가 먹는다(위 ⚠️).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const stop = (e: TouchEvent) => { if (dragging.current) e.preventDefault(); };
    el.addEventListener('touchmove', stop, { passive: false });
    return () => el.removeEventListener('touchmove', stop);
  }, [scrollRef]);

  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  };

  /** 끌던 탭의 「원래 자리 가운데」(transform 과 무관 — offsetLeft 는 transform 을 안 탄다). */
  const homeCenter = (id: string) => {
    const b = btns.current.get(id);
    return b ? b.offsetLeft + b.offsetWidth / 2 : 0;
  };

  const onMoveDrag = useCallback((clientX: number) => {
    const row = scrollRef.current;
    const id = dragId ?? press.current?.id;
    if (!row || !id) return;
    // 가장자리에 닿으면 줄을 굴린다.
    const r = row.getBoundingClientRect();
    if (clientX < r.left + EDGE) row.scrollLeft -= 8;
    else if (clientX > r.right - EDGE) row.scrollLeft += 8;
    // 손가락의 줄 안 위치.
    const x = clientX - r.left + row.scrollLeft;
    setDx(x - homeCenter(id));
    // 다른 탭들의 가운데와 비교해 들어갈 자리를 정한다.
    setLive((prev) => {
      const cur = prev ?? items.map((t) => t.id);
      const others = cur.filter((o) => o !== id);
      const at = others.filter((o) => homeCenter(o) < x).length;
      if (cur.indexOf(id) === at) return cur;
      const next = [...others];
      next.splice(at, 0, id);
      return next;
    });
  }, [dragId, items, scrollRef]);

  // 자리가 바뀌면 끌던 탭의 원래 자리도 바뀐다 — 손가락 위치는 그대로라 dx 를 다시 잰다.
  const lastX = useRef(0);
  useEffect(() => {
    if (!dragId) return;
    const row = scrollRef.current;
    if (!row) return;
    const r = row.getBoundingClientRect();
    setDx(lastX.current - r.left + row.scrollLeft - homeCenter(dragId));
  }, [live, dragId, scrollRef]);

  const finish = (commit: boolean) => {
    cancelPress();
    if (dragging.current) {
      dragging.current = false;
      swallowClick.current = true;
      window.setTimeout(() => { swallowClick.current = false; }, 350);
      if (commit && live && live.join() !== items.map((t) => t.id).join()) onReorder(live);
    }
    setDragId(null); setDx(0); setLive(null);
  };

  return (
    <>
      {shown.map((item) => {
        const isDrag = dragId === item.id;
        return (
          <button
            key={item.id}
            ref={(el) => { if (el) btns.current.set(item.id, el); else btns.current.delete(item.id); }}
            aria-label={`${labelOf(item)} — 꾹 눌러 옮기기`}
            aria-pressed={pressedOf(item)}
            onClick={() => { if (swallowClick.current) return; onPick(item); }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              cancelPress();
              const target = e.currentTarget;
              const pid = e.pointerId;
              press.current = {
                id: item.id, x: e.clientX, y: e.clientY, pid,
                timer: window.setTimeout(() => {
                  dragging.current = true;
                  setDragId(item.id);
                  setLive(items.map((t) => t.id));
                  try { target.setPointerCapture(pid); } catch { /* 이미 놓았다 */ }
                  navigator.vibrate?.(12);
                }, HOLD_MS),
              };
            }}
            onPointerMove={(e) => {
              lastX.current = e.clientX;
              if (dragging.current) { onMoveDrag(e.clientX); return; }
              const p = press.current;
              if (p && (Math.abs(e.clientX - p.x) > SLOP || Math.abs(e.clientY - p.y) > SLOP)) cancelPress();
            }}
            onPointerUp={() => finish(true)}
            onPointerCancel={() => finish(false)}
            className="shrink-0 select-none"
            style={{
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              transform: isDrag ? `translateX(${dx}px) scale(1.08)` : undefined,
              transition: isDrag ? 'none' : 'transform 120ms ease',
              zIndex: isDrag ? 2 : undefined,
              position: 'relative',
              filter: isDrag ? 'drop-shadow(0 6px 10px rgba(70,55,60,.25))' : undefined,
            }}
          >
            {renderTab(item, { dragging: isDrag })}
          </button>
        );
      })}
    </>
  );
}
