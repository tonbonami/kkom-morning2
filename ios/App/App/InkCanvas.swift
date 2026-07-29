import SwiftUI
import UIKit

// STEP 1(로컬 필감) + STEP 2(실시간 생중계) 캔버스.
// .pencil만 받기(팜리젝션), coalescedTouches(고주사율), 진짜 touch.force(필압), 정규화 0~1 좌표.
// 내 획은 로컬 즉시 렌더 + RTDB 송출. 상대 획은 RTDB 구독 → 정규화 해제해서 렌더.

struct InkPoint {
    var location: CGPoint
    var width: CGFloat
}

// ── 도구 상태 (SwiftUI ↔ UIView 다리) ──
final class CanvasController: ObservableObject {
    @Published var colorIndex: Int = 2
    @Published var lineWidth: CGFloat = 7
    @Published var pencilOnly: Bool = true
    @Published var eraser: Bool = false          // 지우개 모드
    @Published var partnerActive: Bool = false   // 상대가 지금 긋는 중 (presence 표시용)
    weak var canvas: StrokeCanvasView?

    static let palette: [UIColor] = [
        UIColor(red: 0.98, green: 0.48, blue: 0.66, alpha: 1), // 꼼이 로즈
        UIColor(red: 0.49, green: 0.83, blue: 0.99, alpha: 1), // 우댕 블루
        UIColor(red: 0.20, green: 0.25, blue: 0.33, alpha: 1), // 먹
    ]
    var color: UIColor { Self.palette[colorIndex] }

    func undo() { canvas?.undo() }
    func clear() { canvas?.clear() }
}

// ── SwiftUI 래퍼 ── (me = "udaeng" | "kkomi")
struct InkCanvasRepresentable: UIViewRepresentable {
    @ObservedObject var controller: CanvasController
    let me: String

    func makeUIView(context: Context) -> StrokeCanvasView {
        let v = StrokeCanvasView()
        v.controller = controller
        controller.canvas = v
        let sync = SyncClient(me: me)
        v.sync = sync
        sync.onRemoteLive = { [weak v] s in v?.applyRemoteLive(s) }
        sync.onRemoteCommit = { [weak v] id, s in v?.applyRemoteCommit(id: id, stroke: s) }
        sync.onRemoteReset = { [weak v] list in v?.applyRemoteReset(list) }
        sync.start()
        return v
    }
    func updateUIView(_ uiView: StrokeCanvasView, context: Context) {
        uiView.controller = controller
    }
}

// ── 핵심 캔버스 ──
final class StrokeCanvasView: UIView {
    weak var controller: CanvasController?
    var sync: SyncClient?

    private var finished: [[InkPoint]] = []
    private var finishedColors: [UIColor] = []
    private var finishedIds: [String] = []
    private var current: [InkPoint] = []
    private var currentColor: UIColor = .black
    private var activeTouch: UITouch?
    private var seenPencil = false
    private var lastLiveSent: CFTimeInterval = 0

    // 상대(원격) 상태
    private var remoteCommitted: [(String, NetStroke)] = []
    private var remoteLive: NetStroke?

    private var baked: UIImage?
    private var bakedSize: CGSize = .zero

    override init(frame: CGRect) {
        super.init(frame: frame)
        isMultipleTouchEnabled = true
        backgroundColor = .clear
        isOpaque = false
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    private func accept(_ touch: UITouch) -> Bool {
        if touch.type == .pencil { seenPencil = true; return true }
        let pencilOnly = controller?.pencilOnly ?? true
        if pencilOnly && seenPencil { return false }
        return true
    }

    private func width(for touch: UITouch) -> CGFloat {
        let base = controller?.lineWidth ?? 7
        if touch.type == .pencil, touch.maximumPossibleForce > 0 {
            let f = touch.force / touch.maximumPossibleForce
            return base * (0.35 + 1.3 * f)
        }
        return base
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard activeTouch == nil, let t = touches.first(where: { accept($0) }) else { return }
        activeTouch = t
        if controller?.eraser == true { eraseAt(t.location(in: self)); return }
        currentColor = controller?.color ?? .black
        current = [InkPoint(location: t.location(in: self), width: width(for: t))]
        setNeedsDisplay()
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = activeTouch, touches.contains(t) else { return }
        let samples = event?.coalescedTouches(for: t) ?? [t]
        if controller?.eraser == true {
            for s in samples { eraseAt(s.location(in: self)) }
            return
        }
        for s in samples {
            current.append(InkPoint(location: s.location(in: self), width: width(for: s)))
        }
        // 생중계 — 50ms 스로틀로 그리는 중 획 전체를 송출
        let now = CACurrentMediaTime()
        if now - lastLiveSent > 0.05 {
            lastLiveSent = now
            sync?.publishLive(netStroke(current, color: currentColor))
        }
        setNeedsDisplay()
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = activeTouch, touches.contains(t) else { return }
        commitCurrent()
    }
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = activeTouch, touches.contains(t) else { return }
        commitCurrent()
    }

    private func commitCurrent() {
        if current.count > 1 {
            let id = UUID().uuidString
            let net = netStroke(current, color: currentColor)
            finished.append(current); finishedColors.append(currentColor); finishedIds.append(id); bakeLast()
            sync?.commit(id: id, net)
        }
        current = []
        activeTouch = nil
        sync?.publishLive(nil)   // 라이브 노드 비우기
        setNeedsDisplay()
    }

    func undo() {
        guard !finished.isEmpty else { return }
        let id = finishedIds.removeLast()
        finished.removeLast(); finishedColors.removeLast()
        sync?.deleteMine(id: id)
        rebuildBaked(); setNeedsDisplay()
    }
    func clear() {
        finished.removeAll(); finishedColors.removeAll(); finishedIds.removeAll(); current.removeAll()
        sync?.clearMine()
        rebuildBaked(); setNeedsDisplay()   // 상대 획은 baked에 남음
    }

    // 지우개 — 접촉에 닿는 내 획 제거 (상대 획은 안 지움)
    private func eraseAt(_ p: CGPoint) {
        let r: CGFloat = 22
        var removed = false
        for i in stride(from: finished.count - 1, through: 0, by: -1) {
            if finished[i].contains(where: { hypot($0.location.x - p.x, $0.location.y - p.y) < r + $0.width / 2 }) {
                sync?.deleteMine(id: finishedIds[i])
                finished.remove(at: i); finishedColors.remove(at: i); finishedIds.remove(at: i)
                removed = true
            }
        }
        if removed { rebuildBaked(); setNeedsDisplay() }
    }

    // ── 원격 수신 (모두 메인큐에서 호출됨) ──
    func applyRemoteLive(_ s: NetStroke?) {
        remoteLive = s
        controller?.partnerActive = (s != nil && !(s?.pts.isEmpty ?? true))
        setNeedsDisplay()
    }
    func applyRemoteCommit(id: String, stroke: NetStroke?) {
        if let s = stroke {
            if !remoteCommitted.contains(where: { $0.0 == id }) { remoteCommitted.append((id, s)) }
        } else {
            remoteCommitted.removeAll { $0.0 == id }
        }
        rebuildBaked(); setNeedsDisplay()
    }
    func applyRemoteReset(_ list: [(String, NetStroke)]) {
        remoteCommitted = list
        rebuildBaked(); setNeedsDisplay()
    }

    // ── 정규화 ↔ 화면좌표 ──
    private func netStroke(_ pts: [InkPoint], color: UIColor) -> NetStroke {
        let W = max(bounds.width, 1), H = max(bounds.height, 1)
        let arr = pts.map { [Double($0.location.x / W), Double($0.location.y / H), Double($0.width / W)] }
        return NetStroke(color: color.toHex(), pts: arr)
    }
    private func inkPoints(_ s: NetStroke) -> [InkPoint] {
        let W = bounds.width, H = bounds.height
        return s.pts.compactMap { p in
            guard p.count >= 3 else { return nil }
            return InkPoint(location: CGPoint(x: CGFloat(p[0]) * W, y: CGFloat(p[1]) * H), width: CGFloat(p[2]) * W)
        }
    }

    // ── 베이크 ──
    private func bakeLast() {
        guard bounds.width > 0, bounds.height > 0, let s = finished.last, let c = finishedColors.last else { return }
        let r = UIGraphicsImageRenderer(size: bounds.size)
        baked = r.image { ctx in
            baked?.draw(at: .zero)
            drawStroke(s, color: c, in: ctx.cgContext)
        }
        bakedSize = bounds.size
    }
    private func rebuildBaked() {
        guard bounds.width > 0, bounds.height > 0 else { baked = nil; return }
        let r = UIGraphicsImageRenderer(size: bounds.size)
        baked = r.image { ctx in
            for (i, s) in finished.enumerated() { drawStroke(s, color: finishedColors[i], in: ctx.cgContext) }
            for (_, ns) in remoteCommitted { drawStroke(inkPoints(ns), color: UIColor(hex: ns.color), in: ctx.cgContext) }
        }
        bakedSize = bounds.size
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        if bakedSize != bounds.size { rebuildBaked() }
    }

    override func draw(_ rect: CGRect) {
        guard let ctx = UIGraphicsGetCurrentContext() else { return }
        baked?.draw(at: .zero)
        if current.count > 1 {
            drawStroke(current, color: currentColor, in: ctx)
        } else if current.count == 1 {
            drawStroke([current[0], current[0]], color: currentColor, in: ctx)
        }
        if let rl = remoteLive {
            let ip = inkPoints(rl)
            if ip.count > 1 { drawStroke(ip, color: UIColor(hex: rl.color), in: ctx) }
            // 라이브 커서 — 상대 펜촉 위치에 컬러 점(글로우 + 심)
            if let tip = ip.last {
                let c = UIColor(hex: rl.color)
                ctx.setFillColor(c.withAlphaComponent(0.22).cgColor)
                ctx.fillEllipse(in: CGRect(x: tip.location.x - 12, y: tip.location.y - 12, width: 24, height: 24))
                ctx.setFillColor(c.cgColor)
                ctx.fillEllipse(in: CGRect(x: tip.location.x - 5, y: tip.location.y - 5, width: 10, height: 10))
            }
        }
    }

    // ── 가변폭 획 — Catmull-Rom 스무딩 후 "하나의 외곽선"으로 채움(톱니 제거) ──
    private func drawStroke(_ raw: [InkPoint], color: UIColor, in ctx: CGContext) {
        let pts = smooth(raw)
        guard let first = pts.first else { return }
        ctx.setFillColor(color.cgColor)
        if pts.count == 1 {
            let r = first.width / 2
            ctx.fillEllipse(in: CGRect(x: first.location.x - r, y: first.location.y - r, width: first.width, height: first.width))
            return
        }
        // 점별 법선 = 이웃 평균 방향의 수직
        var normals: [CGVector] = []
        normals.reserveCapacity(pts.count)
        for i in 0 ..< pts.count {
            let p0 = pts[max(i - 1, 0)].location
            let p1 = pts[min(i + 1, pts.count - 1)].location
            let dx = p1.x - p0.x, dy = p1.y - p0.y
            let len = max(hypot(dx, dy), 0.0001)
            normals.append(CGVector(dx: -dy / len, dy: dx / len))
        }
        let path = CGMutablePath()
        for i in 0 ..< pts.count {           // 왼쪽 가장자리 전진
            let p = pts[i].location, r = pts[i].width / 2, n = normals[i]
            let pt = CGPoint(x: p.x + n.dx * r, y: p.y + n.dy * r)
            if i == 0 { path.move(to: pt) } else { path.addLine(to: pt) }
        }
        for i in stride(from: pts.count - 1, through: 0, by: -1) {  // 오른쪽 가장자리 후진
            let p = pts[i].location, r = pts[i].width / 2, n = normals[i]
            path.addLine(to: CGPoint(x: p.x - n.dx * r, y: p.y - n.dy * r))
        }
        path.closeSubpath()
        ctx.addPath(path)
        // 둥근 끝(양 끝 캡)
        for cap in [first, pts[pts.count - 1]] {
            let r = cap.width / 2
            ctx.addEllipse(in: CGRect(x: cap.location.x - r, y: cap.location.y - r, width: cap.width, height: cap.width))
        }
        ctx.fillPath()
    }

    private func smooth(_ pts: [InkPoint]) -> [InkPoint] {
        guard pts.count >= 3 else { return pts }
        var out: [InkPoint] = []
        let n = pts.count
        for i in 0 ..< n - 1 {
            let p0 = pts[max(i - 1, 0)].location
            let p1 = pts[i]
            let p2 = pts[i + 1]
            let p3 = pts[min(i + 2, n - 1)].location
            let dist = hypot(p2.location.x - p1.location.x, p2.location.y - p1.location.y)
            let steps = max(1, min(24, Int(dist / 2)))
            for s in 0 ..< steps {
                let t = CGFloat(s) / CGFloat(steps)
                out.append(InkPoint(
                    location: catmullRom(p0, p1.location, p2.location, p3, t),
                    width: p1.width + (p2.width - p1.width) * t
                ))
            }
        }
        out.append(pts[n - 1])
        return out
    }

    private func catmullRom(_ p0: CGPoint, _ p1: CGPoint, _ p2: CGPoint, _ p3: CGPoint, _ t: CGFloat) -> CGPoint {
        let t2 = t * t, t3 = t2 * t
        let x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3)
        let y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        return CGPoint(x: x, y: y)
    }
}
