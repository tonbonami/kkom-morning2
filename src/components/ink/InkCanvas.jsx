'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { drawStrokes, strokeToPath, pseudoPressure, smoothVelocity } from './brush.js'
import { createPalmArbiter } from './palm.js'

/**
 * 필기 캔버스 (PDF 위 오버레이, 교사 전용 입력)
 *
 * 입력 판정은 전부 palm.js(중재기)에 위임한다. 이 컴포넌트는 렌더링과
 * 중재 결과("그려라 / 바꿔라 / 무시해라") 실행만 담당한다.
 *
 * - baked 캔버스: 확정된 획 비트맵
 * - live 캔버스: 그리는 중인 획 / 지우개 커서 / 사라지는 임시 획만 rAF 렌더
 * - getCoalescedEvents()로 프레임 사이 샘플 전부 사용
 * - pointercancel은 "확정"이 아니라 "폐기" (iOS가 제스처로 가로챌 때 잘못 남는 획 방지)
 */

const ERASER_R = 18
const LIVE_SEND_MS = 50
const LASER_SEND_MS = 33
const TEMP_FADE_MS = 900

/**
 * 획 이어붙이기 (stroke stitching)
 *
 * 빠르게 쓰면 스타일러스 접촉이 순간적으로 떨어졌다 붙으면서 하나의 획이
 * 여러 조각으로 쪼개진다(pointerup→pointerdown이 수십 ms 간격으로 발생).
 * 그 결과가 "글씨가 뚝뚝 끊김"이다.
 *
 * 판별: 획이 끝난 순간에도 펜이 "빠르게 움직이는 중"이었다면 의도한 끝이 아니다.
 *       (의도적으로 획을 마칠 땐 펜이 감속한다)
 * → 짧은 시간·짧은 거리 안에 다시 닿으면 같은 획으로 이어 붙인다.
 */
// 아주 짧게 끊겼다 붙으면(사람이 의도적으로 획을 바꾸기엔 너무 빠름) 무조건 이어붙인다.
const STITCH_FAST_MS = 70
const STITCH_FAST_PX = 70
// 조금 더 여유 있는 구간은 "끊긴 순간에도 펜이 움직이고 있었을 때"만 이어붙인다.
const STITCH_MS = 130
const STITCH_PX = 90
const STITCH_MIN_SPEED = 0.3 // px/ms
/**
 * ⚠️ WebKit 제약 대응
 * Safari/WKWebView는 터치(손바닥)가 닿아 있는 동안 펜 입력을 차단한다.
 * (Apple 개발자 포럼 FB16411500, W3C Pointer Events L3 — 개발자가 억제 불가)
 * 그래서 손바닥이 쓸릴 때마다 획이 강제로 끊긴다. 이건 사용자가 펜을 뗀 게 아니므로
 * "끊긴 구간에 터치 활동이 있었다면" 훨씬 넉넉한 창으로 이어붙인다.
 */
const STITCH_BLOCKED_MS = 320
const STITCH_BLOCKED_PX = 200
/**
 * 펜이 "거의 제자리"로 돌아왔으면 시간이 조금 걸렸어도 같은 획으로 본다.
 * 획을 끝낼 땐 펜이 항상 감속하므로 속도는 신뢰할 수 없는 신호다.
 * 반면 거리는 신뢰할 수 있다 — 25px 안쪽이면 이어붙여도 눈에 띄는 부작용이 없다.
 */
const STITCH_NEAR_PX = 25
const STITCH_NEAR_MS = 400

let strokeSeq = 0
function newStrokeId() {
  return `s${Date.now().toString(36)}_${strokeSeq++}`
}

export function isLaserTool(tool) {
  return tool === 'laser' || tool === 'laser-trail'
}

export default function InkCanvas({
  width,
  height,
  strokes,
  tool, // 'pen' | 'temp' | 'eraser' | 'laser' | 'laser-trail'
  color,
  size,
  stylusOnly,
  handedness = 'right',
  palmSensitivity = 'normal',
  onAddStroke,
  onEraseStrokes,
  onLiveStroke,
  onLaser,
  onTempEnd,
  gestureRef, // 부모(핀치)의 { active } — 제스처 중이면 입력 무시
  bridgeRef, // 부모가 쓸 { cancel(), palmState() }
  onDebug,
  onPenDetected, // 이 기기가 "펜슬 기기"로 확인되면 알림
}) {
  const penNotifiedRef = useRef(false)
  const maxCoalescedRef = useRef(0) // 실제로 몇 개의 샘플이 들어오는지 (진단용)
  const bakedRef = useRef(null)
  const liveRef = useRef(null)

  const drawingRef = useRef(null)
  const pendingRef = useRef(null) // 이어붙이기 대기 중인 방금 끝난 획
  const eraserPosRef = useRef(null)
  const fadingRef = useRef([])
  const rafRef = useRef(0)
  const bakedCountRef = useRef(0)

  const stateRef = useRef({})
  stateRef.current = {
    strokes, tool, color, size, stylusOnly, handedness, palmSensitivity,
    onAddStroke, onEraseStrokes, onLiveStroke, onLaser, onTempEnd, onDebug,
    onPenDetected, width, height,
  }

  // 중재기는 컴포넌트 수명 동안 하나만 유지하고, 옵션은 ref에서 최신값을 읽는다
  const arbiter = useMemo(
    () =>
      createPalmArbiter(() => ({
        handedness: stateRef.current.handedness,
        sensitivity: stateRef.current.palmSensitivity,
        stylusOnly: stateRef.current.stylusOnly,
      })),
    [],
  )

  const dpr = Math.min(window.devicePixelRatio || 1, 3)

  const setupCanvas = useCallback(
    (canvas) => {
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return ctx
    },
    [width, height, dpr],
  )

  useEffect(() => {
    if (!width || !height) return
    const bctx = setupCanvas(bakedRef.current)
    setupCanvas(liveRef.current)
    drawStrokes(bctx, strokes, width, height)
    bakedCountRef.current = strokes.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, setupCanvas])

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

  /** 화면 좌표 → 캔버스 css-px (확대 transform 중에도 정확) */
  function toLocal(clientX, clientY) {
    const rect = liveRef.current.getBoundingClientRect()
    const { width: w, height: h } = stateRef.current
    return {
      x: ((clientX - rect.left) / rect.width) * w,
      y: ((clientY - rect.top) / rect.height) * h,
    }
  }

  const renderLive = useCallback(() => {
    const { width: w, height: h } = stateRef.current
    const ctx = liveRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)

    const now = performance.now()
    const d = drawingRef.current

    if (d && (d.stroke.tool === 'pen' || d.stroke.tool === 'temp')) {
      ctx.fillStyle = d.stroke.color
      ctx.fill(strokeToPath(d.stroke, w, h))
    }
    // 이어붙이기 대기 중인 획도 계속 보여준다 (깜빡임 방지)
    const pend = pendingRef.current
    if (pend) {
      ctx.fillStyle = pend.stroke.color
      ctx.fill(strokeToPath(pend.stroke, w, h))
    }
    fadingRef.current = fadingRef.current.filter((f) => now - f.start < TEMP_FADE_MS)
    for (const f of fadingRef.current) {
      ctx.globalAlpha = 1 - (now - f.start) / TEMP_FADE_MS
      ctx.fillStyle = f.stroke.color
      ctx.fill(strokeToPath(f.stroke, w, h))
    }
    ctx.globalAlpha = 1
    const ep = eraserPosRef.current
    if (ep) {
      ctx.strokeStyle = 'rgba(120,120,120,0.9)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(ep.x, ep.y, ERASER_R, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (d || ep || pend || fadingRef.current.length) {
      rafRef.current = requestAnimationFrame(renderLive)
    } else {
      rafRef.current = 0
    }
  }, [])

  function kickRaf() {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(renderLive)
  }

  /** 대기 중이던 획을 실제로 확정한다 */
  const commitPending = useCallback(() => {
    const p = pendingRef.current
    if (!p) return
    clearTimeout(p.timer)
    pendingRef.current = null
    stateRef.current.onAddStroke(p.stroke)
    stateRef.current.onLiveStroke?.(null)
  }, [])

  /** 진행 중인 획을 폐기 (확정하지 않음) — 손바닥 오인식·제스처·취소 공용 */
  const discardCurrent = useCallback(() => {
    const d = drawingRef.current
    if (!d) return
    drawingRef.current = null
    eraserPosRef.current = null
    if (isLaserTool(d.stroke.tool)) stateRef.current.onLaser?.(null)
    else stateRef.current.onLiveStroke?.(null)
    const { width: w, height: h } = stateRef.current
    liveRef.current?.getContext('2d').clearRect(0, 0, w, h)
  }, [])

  // 부모(핀치 컨트롤러)에게 제어권/상태 제공
  useEffect(() => {
    if (!bridgeRef) return
    bridgeRef.current = {
      /**
       * 제스처(핀치)가 시작될 때 호출.
       * ⚠️ 그리던 획을 절대 버리지 않는다 — 제스처 오인식 한 번이 잉크 손실이 되면 안 된다.
       *    지금까지 그린 건 저장하고 입력만 멈춘다.
       */
      commitNow: () => {
        const d = drawingRef.current
        if (d && d.stroke.tool === 'pen' && d.stroke.points.length > 1) {
          drawingRef.current = null
          stateRef.current.onAddStroke(d.stroke)
          stateRef.current.onLiveStroke?.(null)
        } else {
          discardCurrent()
        }
        commitPending()
        arbiter.reset()
        const { width: w, height: h } = stateRef.current
        liveRef.current?.getContext('2d').clearRect(0, 0, w, h)
      },
      palmState: () => arbiter.state(),
    }
  }, [bridgeRef, discardCurrent, commitPending, arbiter])

  function eraseAt(x, y) {
    const { strokes, width: w, height: h, onEraseStrokes } = stateRef.current
    const hits = []
    for (const s of strokes) {
      for (const pt of s.points) {
        const dx = pt.x * w - x
        const dy = pt.y * h - y
        if (dx * dx + dy * dy < ERASER_R * ERASER_R) {
          hits.push(s.id)
          break
        }
      }
    }
    if (hits.length) onEraseStrokes(hits)
  }

  function beginStroke(e) {
    const { tool, color, size, onLaser } = stateRef.current
    const { x, y } = toLocal(e.clientX, e.clientY)
    const { width: w, height: h } = stateRef.current

    if (tool === 'eraser') {
      drawingRef.current = { pointerId: e.pointerId, stroke: { tool: 'eraser' } }
      eraserPosRef.current = { x, y }
      eraseAt(x, y)
      kickRaf()
      return
    }

    if (isLaserTool(tool)) {
      drawingRef.current = {
        pointerId: e.pointerId,
        laserSentAt: 0,
        laserQueue: [],
        stroke: { tool },
      }
      onLaser?.({ mode: tool === 'laser' ? 'dot' : 'trail', points: [{ x: x / w, y: y / h }] })
      return
    }

    drawingRef.current = {
      pointerId: e.pointerId,
      isPen: e.pointerType === 'pen',
      vSmooth: 0,
      lastX: x,
      lastY: y,
      lastT: e.timeStamp,
      liveSentAt: 0,
      liveSentIdx: 0,
      stroke: {
        id: newStrokeId(),
        tool, // 'pen' | 'temp'
        color,
        size,
        points: [{ x: x / w, y: y / h, p: pseudoPressure(0) }],
      },
    }
    kickRaf()
  }

  function handleDown(e) {
    e.preventDefault()
    try {
      liveRef.current.setPointerCapture(e.pointerId)
    } catch {
      /* 캡처 불가 상황 무시 */
    }
    if (gestureRef?.current?.active) return

    const local = toLocal(e.clientX, e.clientY)
    const action = arbiter.down(e.pointerId, {
      type: e.pointerType,
      contact: Math.max(e.width || 0, e.height || 0),
      x: local.x,
      y: local.y,
      t: e.timeStamp,
    })
    const st = arbiter.state()
    stateRef.current.onDebug?.(`▼ ${e.pointerType} → ${action} · ${st.reason}`)
    if (st.penDevice && !penNotifiedRef.current) {
      penNotifiedRef.current = true
      stateRef.current.onPenDetected?.()
    }

    if (action === 'ignore') return
    if (action === 'switch') discardCurrent()

    // ---- 끊긴 획 이어붙이기 판정 ----
    const pend = pendingRef.current
    if (pend && stateRef.current.tool === 'pen') {
      const { width: w, height: h } = stateRef.current
      const local = toLocal(e.clientX, e.clientY)
      const gapMs = Math.round(performance.now() - pend.endT)
      const gapPx = Math.round(Math.hypot(local.x - pend.endX, local.y - pend.endY))
      const veryQuick = gapMs <= STITCH_FAST_MS && gapPx <= STITCH_FAST_PX
      // 펜이 거의 제자리로 돌아옴 → 속도와 무관하게 같은 획 (가장 신뢰도 높은 신호)
      const nearlySamePlace = gapPx <= STITCH_NEAR_PX && gapMs <= STITCH_NEAR_MS
      const movingWhenBroken =
        gapMs <= STITCH_MS && gapPx <= STITCH_PX && pend.endSpeed >= STITCH_MIN_SPEED
      // 끊긴 구간에 손바닥 접촉이 있었나? → Safari가 펜을 차단한 것으로 본다
      const touchedDuringGap = arbiter.state().lastTouchAt >= pend.endT - 40
      const blockedByPalm =
        touchedDuringGap && gapMs <= STITCH_BLOCKED_MS && gapPx <= STITCH_BLOCKED_PX

      if (veryQuick || nearlySamePlace || movingWhenBroken || blockedByPalm) {
        clearTimeout(pend.timer)
        pendingRef.current = null
        pend.stroke.points.push({
          x: local.x / w,
          y: local.y / h,
          p: pseudoPressure(pend.endSpeed),
        })
        drawingRef.current = {
          pointerId: e.pointerId,
          isPen: e.pointerType === 'pen',
          vSmooth: pend.endSpeed,
          lastX: local.x,
          lastY: local.y,
          lastT: e.timeStamp,
          liveSentAt: 0,
          liveSentIdx: pend.stroke.points.length,
          stroke: pend.stroke,
        }
        stateRef.current.onDebug?.(
          `↳ 이어붙임 ${gapMs}ms ${gapPx}px${blockedByPalm && !veryQuick ? ' (손바닥 차단)' : ''}`,
        )
        kickRaf()
        return
      }
      stateRef.current.onDebug?.(
        `↳ 새 획 (간격 ${gapMs}ms ${gapPx}px 속도 ${pend.endSpeed.toFixed(2)})`,
      )
      commitPending()
    }

    beginStroke(e)
  }

  function handleMove(e) {
    if (gestureRef?.current?.active) return
    const local = toLocal(e.clientX, e.clientY)
    const verdict = arbiter.move(e.pointerId, { x: local.x, y: local.y, t: e.timeStamp })
    if (verdict === 'ignore') return
    if (verdict === 'switch') {
      stateRef.current.onDebug?.(`↔ ${arbiter.state().reason}`)
      discardCurrent()
      beginStroke(e)
      return
    }

    const d = drawingRef.current
    if (!d || e.pointerId !== d.pointerId) return
    e.preventDefault()
    const { width: w, height: h, onLaser } = stateRef.current

    if (d.stroke.tool === 'eraser') {
      eraserPosRef.current = local
      eraseAt(local.x, local.y)
      return
    }

    if (isLaserTool(d.stroke.tool)) {
      d.laserQueue.push({ x: local.x / w, y: local.y / h })
      if (e.timeStamp - d.laserSentAt >= LASER_SEND_MS) {
        d.laserSentAt = e.timeStamp
        onLaser?.({
          mode: d.stroke.tool === 'laser' ? 'dot' : 'trail',
          points: d.laserQueue.splice(0),
        })
      }
      return
    }

    // pen/temp: 프레임 사이 원본 샘플을 전부 사용한다.
    // ⚠️ React의 합성 이벤트(SyntheticPointerEvent)에는 getCoalescedEvents가 없다.
    //    반드시 nativeEvent에서 가져와야 고주사율 샘플을 쓸 수 있다.
    //    (이걸 놓치면 이벤트당 점 1개만 남아 빠른 필기가 각지고 끊겨 보인다)
    const native = e.nativeEvent ?? e
    const coalesced =
      typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : null
    const events = coalesced && coalesced.length ? coalesced : [e]
    if (events.length > maxCoalescedRef.current) {
      maxCoalescedRef.current = events.length
      if (events.length > 1) {
        stateRef.current.onDebug?.(`✓ 고주사율 샘플 ${events.length}개/이벤트`)
      }
    }
    const rect = liveRef.current.getBoundingClientRect()
    for (const ev of events) {
      const x = ((ev.clientX - rect.left) / rect.width) * w
      const y = ((ev.clientY - rect.top) / rect.height) * h
      const dt = ev.timeStamp - d.lastT
      d.vSmooth = smoothVelocity(d.vSmooth, x - d.lastX, y - d.lastY, dt)
      d.lastX = x
      d.lastY = y
      if (dt > 0) d.lastT = ev.timeStamp
      d.stroke.points.push({
        x: x / w,
        y: y / h,
        p: pseudoPressure(
          d.vSmooth,
          ev.pressure > 0 && ev.pointerType === 'pen' ? ev.pressure : null,
        ),
      })
    }

    const onLive = stateRef.current.onLiveStroke
    if (onLive && e.timeStamp - d.liveSentAt >= LIVE_SEND_MS) {
      d.liveSentAt = e.timeStamp
      const s = d.stroke
      onLive({
        id: s.id,
        color: s.color,
        size: s.size,
        points: s.points.slice(d.liveSentIdx),
      })
      d.liveSentIdx = s.points.length
    }
  }

  function handleUp(e) {
    const wasWriter = arbiter.up(e.pointerId)
    const d = drawingRef.current
    if (!d || e.pointerId !== d.pointerId) return
    if (!wasWriter) return

    drawingRef.current = null
    eraserPosRef.current = null
    const { width: w, height: h } = stateRef.current

    if (isLaserTool(d.stroke.tool)) {
      stateRef.current.onLaser?.(null)
      return
    }
    if (d.stroke.tool === 'pen') {
      // 바로 확정하지 않고 잠깐 대기 — 접촉이 순간 끊긴 거라면 곧 이어붙인다
      commitPending() // 그 전에 대기 중이던 게 있으면 먼저 확정
      const lastPt = d.stroke.points[d.stroke.points.length - 1]
      pendingRef.current = {
        stroke: d.stroke,
        endT: performance.now(),
        endX: lastPt.x * w,
        endY: lastPt.y * h,
        endSpeed: d.vSmooth ?? 0,
        timer: setTimeout(() => commitPending(), STITCH_MS),
      }
      kickRaf()
      return
    } else if (d.stroke.tool === 'temp') {
      fadingRef.current.push({ stroke: d.stroke, start: performance.now() })
      stateRef.current.onTempEnd?.(d.stroke.id)
      kickRaf()
      return
    }
    liveRef.current.getContext('2d').clearRect(0, 0, w, h)
  }

  /**
   * iOS가 포인터를 취소한 경우.
   * - 펜슬로 그리던 획이면: 여기까지 그린 걸 살린다 (버리면 "획이 뚝 끊긴" 것처럼 보임)
   * - 그 외(손가락/손바닥 잠정 획)면: 폐기
   */
  function handleCancel(e) {
    arbiter.up(e.pointerId)
    const d = drawingRef.current
    if (!d || e.pointerId !== d.pointerId) return

    if (d.isPen && d.stroke.tool === 'pen' && d.stroke.points.length > 1) {
      // 취소된 획도 이어붙이기 대상 — 여기서 버리면 그것도 "끊김"이 된다
      stateRef.current.onDebug?.('✕ pointercancel → 이어붙이기 대기')
      drawingRef.current = null
      commitPending()
      const { width: w, height: h } = stateRef.current
      const lastPt = d.stroke.points[d.stroke.points.length - 1]
      pendingRef.current = {
        stroke: d.stroke,
        endT: performance.now(),
        endX: lastPt.x * w,
        endY: lastPt.y * h,
        endSpeed: d.vSmooth ?? 0,
        timer: setTimeout(() => commitPending(), STITCH_MS),
      }
      kickRaf()
      return
    }
    stateRef.current.onDebug?.('✕ pointercancel → 폐기')
    discardCurrent()
  }

  // 언마운트 시 대기 중인 획이 사라지지 않도록 확정
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      commitPending()
    },
    [commitPending],
  )

  return (
    <div className="ink-layer">
      <canvas ref={bakedRef} className="ink-baked" />
      <canvas
        ref={liveRef}
        className="ink-live"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleCancel}
      />
    </div>
  )
}
