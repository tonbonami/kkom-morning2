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

export interface DiaryInkResult { png: Blob; x: number; y: number; w: number; h: number }

export async function editDiaryInk(meKey: string, paperHex: string): Promise<DiaryInkResult | null> {
  const { registerPlugin } = await import('@capacitor/core');
  const plugin = registerPlugin('DiaryInk') as {
    edit(o: { me: string; paper: string }): Promise<{ cancelled: boolean; pngBase64?: string; x?: number; y?: number; w?: number; h?: number }>;
  };
  const r = await plugin.edit({ me: meKey, paper: paperHex });
  if (r.cancelled || !r.pngBase64) return null;
  const bin = atob(r.pngBase64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
  return { png: new Blob([bytes], { type: 'image/png' }), x: n(r.x), y: n(r.y), w: n(r.w), h: n(r.h) };
}

/** 종이 테마 → 필기 화면 바탕색(DiaryPaper 의 바탕과 같게). */
export const PAPER_HEX: Record<string, string> = { cream: '#FAF6EE', plain: '#FFFFFF', lined: '#FAF8F5', grid: '#FAF8F5' };
