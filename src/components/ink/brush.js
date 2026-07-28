import { getStroke } from 'perfect-freehand'

/**
 * ---- 굵기(의사 필압) 계산 ----
 * 비정품 스타일러스에는 필압이 없으므로 "속도 기반 굵기"를 쓴다.
 * 빠르게 그으면 얇게, 천천히 그으면 두껍게.
 *
 * 나중에 정품 애플펜슬을 지원할 때는 pseudoPressure()에
 * rawPressure 항을 블렌드하면 된다 (이 함수만 고치면 전체 반영).
 */

const V_MAX = 3.0 // px/ms — 이 속도 이상이면 최소 굵기
const P_MIN = 0.58 // 최소 의사 필압 (빠르게 써도 획이 사라지듯 얇아지면 안 됨)
const EMA = 0.25 // 속도 지수이동평균 계수 (낮을수록 굵기 변화가 부드러움)

/**
 * @param {number} vSmooth 평활화된 속도 (css px/ms)
 * @param {number|null} rawPressure 하드웨어 필압 (0~1). 애플펜슬 대비 훅.
 * @returns {number} 0~1 의사 필압
 */
export function pseudoPressure(vSmooth, rawPressure = null) {
  // 추후: 실제 필압이 유효하면 (rawPressure > 0 && !== 0.5) 여기서 블렌드
  void rawPressure
  const t = Math.min(vSmooth / V_MAX, 1)
  return P_MIN + (1 - P_MIN) * (1 - t)
}

/**
 * 새 입력 샘플의 평활화 속도를 계산한다.
 * @returns {number} 새 vSmooth
 */
export function smoothVelocity(prevV, dx, dy, dt) {
  if (dt <= 0) return prevV
  const v = Math.hypot(dx, dy) / dt
  return prevV * (1 - EMA) + v * EMA
}

/** perfect-freehand 공통 옵션 */
export function freehandOptions(size) {
  return {
    size,
    thinning: 0.38, // 속도에 따른 굵기 변화 폭
    // ⚠️ streamline은 낮게 유지할 것.
    //    이 값이 높으면 입력 점이 듬성듬성해지는 "빠른 필기"에서 획이 실제 궤적을
    //    따라가지 못해 코너를 잘라먹는다(ㄱ·ㄴ·ㅁ이 뭉개지고 끊긴 것처럼 보임).
    //    펜슬은 coalesced 이벤트로 샘플이 충분하므로 손떨림 보정이 거의 필요 없다.
    smoothing: 0.45,
    streamline: 0.15,
    simulatePressure: false, // 필압은 우리가 직접 계산해서 넣는다
    last: true,
  }
}

/**
 * 스트로크(정규화 좌표 0~1)를 현재 캔버스 크기의 Path2D로 변환.
 * @param {{points: Array<{x:number,y:number,p:number}>, size: number}} stroke
 * @param {number} w 캔버스 CSS 폭
 * @param {number} h 캔버스 CSS 높이
 */
export function strokeToPath(stroke, w, h) {
  const pts = stroke.points.map((pt) => ({
    x: pt.x * w,
    y: pt.y * h,
    pressure: pt.p,
  }))
  // 획 굵기도 페이지 폭에 비례시켜 리사이즈/학생 화면에서 동일 비율 유지
  const scaledSize = stroke.size * (w / 1000)
  const outline = getStroke(pts, freehandOptions(scaledSize))
  return outlineToPath(outline)
}

/** perfect-freehand 외곽선 → 부드러운 Path2D */
export function outlineToPath(outline) {
  const path = new Path2D()
  if (outline.length < 2) return path
  path.moveTo(outline[0][0], outline[0][1])
  for (let i = 1; i < outline.length; i++) {
    const [x, y] = outline[i]
    const [nx, ny] = outline[(i + 1) % outline.length]
    path.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2)
  }
  path.closePath()
  return path
}

/** 확정된 스트로크 목록을 캔버스 컨텍스트에 그린다 (베이크). */
export function drawStrokes(ctx, strokes, w, h) {
  for (const s of strokes) {
    ctx.globalAlpha = s.opacity ?? 1
    ctx.fillStyle = s.color
    ctx.fill(strokeToPath(s, w, h))
  }
  ctx.globalAlpha = 1
}
