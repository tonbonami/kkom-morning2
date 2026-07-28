'use client'

import { useEffect, useRef } from 'react'
import { drawStrokes, strokeToPath } from './brush.js'

const TEMP_FADE_MS = 900

/**
 * 학생 화면용 렌더 전용 잉크 캔버스 (입력 없음).
 * - baked: 확정 획 (증분 베이크)
 * - live: 교사가 지금 그리는 중인 획 + 페이드아웃 중인 임시 획
 */
export default function StaticInkCanvas({ width, height, strokes, liveStroke, fadingStrokes }) {
  const bakedRef = useRef(null)
  const liveRef = useRef(null)
  const bakedCountRef = useRef(0)
  const rafRef = useRef(0)
  const propsRef = useRef({})
  propsRef.current = { width, height, liveStroke, fadingStrokes }
  const dpr = Math.min(window.devicePixelRatio || 1, 3)

  // 크기 변경 → 캔버스 재설정 + 전체 리베이크
  useEffect(() => {
    if (!width || !height) return
    for (const canvas of [bakedRef.current, liveRef.current]) {
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    drawStrokes(bakedRef.current.getContext('2d'), strokes, width, height)
    bakedCountRef.current = strokes.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, dpr])

  // 획 목록 변경 → 증분 or 전체 베이크
  useEffect(() => {
    if (!width || !height) return
    const ctx = bakedRef.current.getContext('2d')
    if (strokes.length >= bakedCountRef.current) {
      drawStrokes(ctx, strokes.slice(bakedCountRef.current), width, height)
    } else {
      ctx.clearRect(0, 0, width, height)
      drawStrokes(ctx, strokes, width, height)
    }
    bakedCountRef.current = strokes.length
  }, [strokes, width, height])

  // 라이브 획 + 페이드아웃 임시 획
  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    const draw = () => {
      const { width: w, height: h, liveStroke, fadingStrokes } = propsRef.current
      if (!w || !h) return
      const ctx = liveRef.current.getContext('2d')
      ctx.clearRect(0, 0, w, h)
      if (liveStroke && liveStroke.points?.length > 1) {
        ctx.fillStyle = liveStroke.color
        ctx.fill(strokeToPath(liveStroke, w, h))
      }
      const now = performance.now()
      let hasFading = false
      for (const f of fadingStrokes ?? []) {
        const alpha = 1 - (now - f.start) / TEMP_FADE_MS
        if (alpha <= 0) continue
        hasFading = true
        ctx.globalAlpha = alpha
        ctx.fillStyle = f.stroke.color
        ctx.fill(strokeToPath(f.stroke, w, h))
      }
      ctx.globalAlpha = 1
      if (hasFading) rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [liveStroke, fadingStrokes, width, height])

  return (
    <div className="ink-layer" style={{ pointerEvents: 'none' }}>
      <canvas ref={bakedRef} className="ink-baked" />
      <canvas ref={liveRef} className="ink-live" style={{ pointerEvents: 'none' }} />
    </div>
  )
}
