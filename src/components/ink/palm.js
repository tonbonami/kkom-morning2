/**
 * 팜 리젝션 중재기 (Palm Arbiter)
 *
 * ⚠️ 설계 전제: iOS Safari는 접촉 면적(PointerEvent.width/height, Touch.radiusX)을
 *    제공하지 않는다. 따라서 "손바닥은 크다"는 판정은 웹에서 쓸 수 없다.
 *    → 크기 대신 아래 세 가지 신호로 판별한다. (굿노트의 "필기 자세 + 민감도" 방식과 동일한 접근)
 *
 *    ① 자세(posture): 오른손잡이는 손바닥이 펜 끝의 "아래/오른쪽"에 놓인다.
 *       → 현재 필기점 기준 손바닥 구역에 새로 닿는 접촉은 무시한다. (손목 가드)
 *    ② 행동(behavior): 손바닥은 먼저 닿고 거의 안 움직인다. 펜은 늦게 닿고 많이 움직인다.
 *       → 아직 확정 전이고 현재 필기 접촉이 정지 상태면, 나중에 온 접촉에게 양보한다.
 *    ③ 확정(commit): 필기 접촉이 충분히 움직이면 잠근다. 그 뒤엔 어떤 접촉도 뺏지 못한다.
 *
 * 접촉 크기를 "실제로 주는" 환경(안드로이드 등)이면 자동 감지해서 보조 신호로 함께 쓴다.
 *
 * 이 모듈은 DOM을 모르는 순수 상태 기계다. (테스트/이식 용이)
 */

const PRESET = {
  off: { switchMs: 0, guardDown: 0, guardSide: 0, lockDist: 0 },
  normal: { switchMs: 500, guardDown: 12, guardSide: 60, lockDist: 28 },
  strong: { switchMs: 900, guardDown: 4, guardSide: 120, lockDist: 40 },
}

const STATIONARY_PX = 14 // 이보다 덜 움직였으면 "얹어놓은 손"
const LOCK_MS = 600 // 이 시간 지나고도 움직였으면 확정
const OVERTAKE_PX = 18 // 다른 접촉이 현재 필기점보다 이만큼 더 움직이면 추월

/**
 * @param {() => {handedness:'right'|'left', sensitivity:'off'|'normal'|'strong', stylusOnly:boolean}} getOpts
 */
const PEN_SEEN_KEY = 'cn-pen-device'

export function createPalmArbiter(getOpts) {
  /** @type {Map<number, any>} */
  const touches = new Map()
  let writerId = null
  let locked = false
  let order = 0
  let sizeUsable = false // 접촉 크기가 실제로 의미 있는 값인지 (런타임 감지)
  const seenSizes = new Set()
  let lastReason = ''
  // 이 기기에서 pointerType==='pen' 이 관측된 적 있는가.
  // (애플펜슬 및 이를 흉내내는 액티브 스타일러스 → OS가 손가락과 구분해 준다)
  // 한번 확인되면 기억한다: 새로고침 후 첫 획부터 손바닥이 안 그려지도록.
  let penDevice = false
  // 펜이 지금 화면에 닿아 있는가 / 마지막으로 떨어진 시각
  // (핀치 오인식 방지용 — 펜이 붙어 있는 동안 손바닥이 움직여도 제스처가 아니다)
  let penActive = false
  let lastPenUpAt = 0
  // 마지막으로 손가락/손바닥 접촉이 있었던 시각.
  // Safari는 터치가 닿아 있는 동안 펜 입력을 차단하므로(WebKit 제약),
  // 획이 끊긴 구간에 터치 활동이 있었다면 "사용자가 뗀 것"이 아니라 "차단된 것"이다.
  let lastTouchAt = 0
  try {
    penDevice = localStorage.getItem(PEN_SEEN_KEY) === '1'
  } catch {
    /* 프라이빗 모드 등 */
  }
  function markPenDevice() {
    if (penDevice) return
    penDevice = true
    try {
      localStorage.setItem(PEN_SEEN_KEY, '1')
    } catch {
      /* noop */
    }
  }

  function opts() {
    const o = getOpts()
    return { ...o, p: PRESET[o.sensitivity] ?? PRESET.normal }
  }

  /** 접촉 크기가 기기에서 진짜로 제공되는지 학습 */
  function learnSize(contact) {
    if (contact === undefined || contact === null) return
    seenSizes.add(Math.round(contact))
    // 서로 다른 값이 2종류 이상 관측되면 "진짜 값"으로 간주
    if (seenSizes.size >= 2) sizeUsable = true
  }

  /** 새 접촉이 현재 필기점 기준 "손바닥 구역"에 있는가 */
  function inPalmZone(np, wp, o) {
    const dy = np.y - wp.y
    const dx = np.x - wp.x
    if (dy < o.p.guardDown) return false // 필기점보다 위쪽 → 펜 쪽
    // 오른손잡이: 손바닥은 아래 + (오른쪽이거나 거의 같은 x)
    return o.handedness === 'right' ? dx > -o.p.guardSide : dx < o.p.guardSide
  }

  function get(id) {
    return touches.get(id)
  }

  return {
    /**
     * @returns {'start'|'switch'|'ignore'} start=이 접촉으로 필기 시작,
     *   switch=기존 획 폐기하고 이 접촉으로 교체, ignore=무시
     */
    down(id, info) {
      const o = opts()
      learnSize(info.contact)
      if (info.type === 'touch') lastTouchAt = performance.now()
      const t = {
        id,
        type: info.type,
        contact: info.contact,
        x0: info.x, y0: info.y,
        x: info.x, y: info.y,
        dist: 0,
        t0: info.t,
        order: ++order,
        rejected: false,
      }
      touches.set(id, t)

      // 진짜 펜슬(애플펜슬/호환 액티브 스타일러스)은 OS가 이미 구분해준다
      // → 무조건 승리 + 즉시 확정. 그리고 이 기기를 "펜슬 기기"로 기억한다.
      if (info.type === 'pen') {
        markPenDevice()
        penActive = true
        const had = writerId !== null && writerId !== id
        writerId = id
        locked = true
        lastReason = '펜슬 즉시확정'
        return had ? 'switch' : 'start'
      }
      if (info.type === 'mouse') {
        const had = writerId !== null && writerId !== id
        writerId = id
        locked = true
        lastReason = 'mouse 즉시확정'
        return had ? 'switch' : 'start'
      }

      // ★ 펜슬 기기 모드: 펜슬이 확인된 기기에서는 손가락/손바닥으로 그리지 않는다.
      //   (굿노트 동작과 동일 — 손가락은 확대/이동 전용)
      //   손가락으로도 그리고 싶으면 팜 리젝션을 "끔"으로 두면 된다.
      if (penDevice && o.sensitivity !== 'off') {
        t.rejected = true
        lastReason = '펜슬 모드: 손가락 무시'
        return 'ignore'
      }

      // 스타일러스 모드: 접촉 크기가 "실제로 제공될 때만" 적용.
      // (크기를 안 주는 기기에서 이 필터를 켜면 모든 입력이 차단되므로 반드시 가드)
      if (o.stylusOnly && sizeUsable && info.contact > 22) {
        t.rejected = true
        lastReason = `스타일러스모드 차단 ${Math.round(info.contact)}px`
        return 'ignore'
      }

      if (o.sensitivity === 'off') {
        if (writerId === null) {
          writerId = id
          locked = true
          lastReason = '리젝션 꺼짐'
          return 'start'
        }
        t.rejected = true
        return 'ignore'
      }

      if (writerId === null) {
        writerId = id
        locked = false
        lastReason = `첫 접촉 #${t.order}`
        return 'start'
      }

      const w = get(writerId)
      if (!w) {
        writerId = id
        locked = false
        return 'start'
      }

      // ① 손목 가드: 현재 필기점 아래/오른쪽에 닿은 건 손바닥 → 항상 무시
      //    (펜이 먼저 닿고 손바닥이 나중에 닿는 정상 케이스를 여기서 지킨다)
      if (inPalmZone(t, w, o)) {
        t.rejected = true
        lastReason = `손목가드 무시 #${t.order}`
        return 'ignore'
      }

      // 확정된 필기는 아무도 못 뺏는다
      if (locked) {
        t.rejected = true
        lastReason = `확정됨, 무시 #${t.order}`
        return 'ignore'
      }

      // ② 행동 판별: 현재 필기 접촉이 가만히 있으면(=손바닥) 늦게 온 쪽에 양보
      const elapsed = info.t - w.t0
      const writerResting = w.dist < STATIONARY_PX
      const sizeSaysPen = sizeUsable && info.contact < w.contact - 8
      if ((writerResting && elapsed < o.p.switchMs) || sizeSaysPen) {
        w.rejected = true
        writerId = id
        locked = false
        lastReason = sizeSaysPen
          ? `크기양보 ${Math.round(w.contact)}→${Math.round(info.contact)}`
          : `정지손바닥 양보 #${w.order}→#${t.order}`
        return 'switch'
      }

      t.rejected = true
      lastReason = `추가접촉 무시 #${t.order}`
      return 'ignore'
    },

    /** @returns {'draw'|'switch'|'ignore'} */
    move(id, info) {
      const t = get(id)
      if (!t) return 'ignore'
      if (t.type === 'touch') lastTouchAt = performance.now()
      const o = opts()
      const d = Math.hypot(info.x - t.x, info.y - t.y)
      t.dist += d
      t.x = info.x
      t.y = info.y

      if (id === writerId) {
        // ③ 충분히 움직였으면 확정 — 이후 손바닥이 닿아도 흔들리지 않는다
        if (!locked && (t.dist > o.p.lockDist || (info.t - t.t0 > LOCK_MS && t.dist > STATIONARY_PX))) {
          locked = true
          lastReason = `확정 (이동 ${Math.round(t.dist)}px)`
        }
        return 'draw'
      }

      if (locked || t.rejected) return 'ignore'

      // 필기 중이던 접촉보다 이 접촉이 훨씬 많이 움직이면 추월 (손바닥이 먼저 잡은 경우)
      const w = get(writerId)
      if (w && t.dist > w.dist + OVERTAKE_PX && info.t - w.t0 < o.p.switchMs) {
        w.rejected = true
        writerId = id
        locked = false
        lastReason = `추월 #${w.order}→#${t.order}`
        return 'switch'
      }
      return 'ignore'
    },

    up(id) {
      const wasWriter = id === writerId
      const t = touches.get(id)
      if (t?.type === 'pen') {
        penActive = false
        lastPenUpAt = performance.now()
      }
      touches.delete(id)
      if (wasWriter) {
        writerId = null
        locked = false
        // 남아있는 접촉(손바닥)을 자동 승격시키지 않는다 — 펜을 뗐는데 손바닥이 그리면 안 되므로
        for (const t of touches.values()) t.rejected = true
      }
      return wasWriter
    },

    reset() {
      touches.clear()
      writerId = null
      locked = false
    },

    /** 핀치 판정에 쓰라고 노출 */
    state() {
      return {
        writerId,
        locked,
        count: touches.size,
        touches: [...touches.values()],
        sizeUsable,
        penDevice,
        penActive,
        lastPenUpAt,
        lastTouchAt,
        reason: lastReason,
      }
    },

    /** 손가락으로도 그리고 싶을 때 펜슬 모드 해제 */
    clearPenDevice() {
      penDevice = false
      try {
        localStorage.removeItem(PEN_SEEN_KEY)
      } catch {
        /* noop */
      }
    },
  }
}
