'use client';
/**
 * 다이어리 필기 — 네이티브 「DiaryInk」 플러그인(ios/App/App/CanvasPlugin.swift)을 부른다.
 * 우댕 2026-11-18 「아이패드 필기 1단계 진행해」(계획: claude.ai/artifact/Bg7SJJFVUGxZpDLD3AGp6q GPT B안 (나)):
 *   낙서장 필기(펜슬 필압·손바닥 무시)를 그대로 쓰는 화면에서 그리고 → 그린 부분만 투명 PNG 로 받아 → 종이 위 물건 하나(type 'ink')로 붙인다.
 * ⚠️ 이 플러그인이 없는 옛 앱 빌드·웹 브라우저에선 inkAvailable() 가 false — 「그리기」 단추를 아예 안 보인다.
 * 자리(x·y·w·h)는 필기 보드(3:4)에 대한 0~1. 다이어리 종이도 3:4 라 그대로 같은 자리에 붙는다.
 */
export async function diaryInkAvailable(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('DiaryInk');
  } catch { return false; }
}

/**
 * 이 빌드가 열 수 있는 필기 형식 — 0 = 다시 그리기 못 함(빌드 66), 1 = 펜만(빌드 67~68), 2 = 연필·크레파스·형광펜·부분 지우개(11/21~).
 * ⚠️ 옛 빌드는 모르는 칸(b)을 버려 지우개 획을 색 선으로 그린다 — 그래서 형식 2 필기는 형식 2 빌드에서만 다시 연다.
 */
export async function diaryInkFormat(): Promise<number> {
  try {
    if (!(await diaryInkAvailable())) return 0;
    const { registerPlugin } = await import('@capacitor/core');
    const r = await (registerPlugin('DiaryInk') as { capabilities(): Promise<{ reedit?: boolean; inkFormat?: number }> }).capabilities();
    if (!r?.reedit) return 0;
    return typeof r.inkFormat === 'number' && r.inkFormat >= 2 ? Math.floor(r.inkFormat) : 1;
  } catch { return 0; }
}

/** 획 하나(보드 0~1) — 네이티브 NetStroke 와 같은 모양. b = 붓(없으면 펜 · pencil · crayon · hl · erase), sd = 질감 시드. */
export interface InkStroke { color: string; size: number; points: { x: number; y: number; p: number }[]; b?: string; sd?: number }
/** 그림과 함께 저장하는 다시 그리기용 파일: 획(보드 0~1) + 그때 잘린 자리(rect). 펜만 쓴 그림은 v1(옛 빌드도 열림), 새 붓·지우개가 있으면 v2. */
export interface InkSidecar { v: 1 | 2; rect: { x: number; y: number; w: number; h: number }; strokes: InkStroke[] }
/** 이 필기를 열려면 필요한 형식 — 저장된 v 와 획 안의 붓을 둘 다 본다(옛 파일 v 가 틀려도 안전하게). */
export const inkFormatOf = (side: InkSidecar): number => Math.max(side.v ?? 1, side.strokes.some((s) => !!s.b) ? 2 : 1);

export interface DiaryInkResult { png: Blob; x: number; y: number; w: number; h: number; strokes?: InkStroke[] }

export async function editDiaryInk(meKey: string, paperHex: string, initial?: InkStroke[]): Promise<DiaryInkResult | null> {
  const { registerPlugin } = await import('@capacitor/core');
  const plugin = registerPlugin('DiaryInk') as {
    edit(o: { me: string; paper: string; strokes?: string }): Promise<{ cancelled: boolean; pngBase64?: string; x?: number; y?: number; w?: number; h?: number; strokes?: string }>;
  };
  const r = await plugin.edit({ me: meKey, paper: paperHex, ...(initial?.length ? { strokes: JSON.stringify(initial) } : {}) });
  if (r.cancelled || !r.pngBase64) return null;
  const bin = atob(r.pngBase64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
  let strokes: InkStroke[] | undefined;
  try { const v = r.strokes ? JSON.parse(r.strokes) : null; if (Array.isArray(v)) strokes = v as InkStroke[]; } catch { /* 옛 빌드 — 획 없음 */ }
  return { png: new Blob([bytes], { type: 'image/png' }), x: n(r.x), y: n(r.y), w: n(r.w), h: n(r.h), ...(strokes ? { strokes } : {}) };
}

/**
 * 저장된 획을 「지금 놓인 자리」로 옮긴다 — 붙인 뒤 옮기거나 키웠으면 그 자리·크기로 필기 화면에 다시 연다.
 * 종이·보드 둘 다 3:4 라 상자 높이 = w × ratio × 3/4. 크기를 바꿨으면 선 굵기도 같은 배율로(그림에서 보이던 굵기 그대로).
 * 돌린 각도는 필기 화면에선 0° — 다 그리면 물건의 각도는 그대로 둔다.
 */
export function placeStrokes(side: InkSidecar, item: { x: number; y: number; w: number; ratio: number }): InkStroke[] {
  const o = side.rect;
  if (!(o.w > 0) || !(o.h > 0)) return side.strokes;
  const curH = item.w * item.ratio * 0.75;
  const cx = item.x - item.w / 2, cy = item.y - curH / 2;
  const sx = item.w / o.w, sy = curH / o.h;
  return side.strokes.map((st) => ({
    ...st,
    size: st.size * sx,
    points: st.points.map((pt) => ({ x: cx + (pt.x - o.x) * sx, y: cy + (pt.y - o.y) * sy, p: pt.p })),
  }));
}

/** 종이 테마 → 필기 화면 바탕색(DiaryPaper 의 바탕과 같게). */
export const PAPER_HEX: Record<string, string> = { cream: '#FAF6EE', plain: '#FFFFFF', lined: '#FAF8F5', grid: '#FAF8F5' };
