import SwiftUI
import UIKit

// 통일 캔버스. .pencil만 받기(팜리젝션), coalescedTouches, 진짜 touch.force(필압), 정규화 0~1.
// 확정 획은 전부 RTDB(canvas/{page}/strokes)에서 렌더 → 페이지 넘겼다 와도 "내 획"까지 복원됨.
// 획 포맷은 웹과 동일: { color, size, points:[{x,y,p}] }. 렌더 폭 = size*(W/1000)*(0.6+0.9p).

struct InkPoint { var location: CGPoint; var width: CGFloat }
struct RawPt { var loc: CGPoint; var p: Double }

// ── 도구 상태 ──
final class CanvasController: ObservableObject {
    @Published var colorIndex: Int = 2
    @Published var lineWidth: CGFloat = 7
    @Published var pencilOnly: Bool = true
    @Published var eraser: Bool = false
    @Published var partnerActive: Bool = false
    @Published var currentPage: String = ""
    @Published var pages: [String] = []
    @Published var passageUrl: String? = nil   // 공유 지문 (웹에서 설정, RTDB)
    weak var canvas: StrokeCanvasView?
    weak var sync: SyncClient?

    // 웹과 동일 4색: 꼼이 로즈 / 우댕 블루 / 먹 / 형광
    static let palette: [UIColor] = [
        UIColor(hex: "#f43f5e"),
        UIColor(hex: "#3b82f6"),
        UIColor(hex: "#334155"),
        UIColor(hex: "#facc15"),
    ]
    var color: UIColor { Self.palette[colorIndex] }

    var pageIndex: Int { pages.firstIndex(of: currentPage) ?? 0 }
    func undo() { canvas?.undo() }
    func clear() { canvas?.clear() }
    func newPage() { sync?.createPage() }
    func goPrev() { let i = pageIndex; if i > 0 { sync?.setCurrentPage(pages[i - 1]) } }
    func goNext() { let i = pageIndex; if i >= 0 && i < pages.count - 1 { sync?.setCurrentPage(pages[i + 1]) } }
}

// ── SwiftUI 래퍼 ──
struct InkCanvasRepresentable: UIViewRepresentable {
    @ObservedObject var controller: CanvasController
    let me: String

    func makeUIView(context: Context) -> StrokeCanvasView {
        let v = StrokeCanvasView()
        v.controller = controller
        controller.canvas = v
        let sync = SyncClient(me: me)
        v.sync = sync
        controller.sync = sync
        sync.onCommitted = { [weak v] list in v?.applyCommitted(list) }
        sync.onRemoteLive = { [weak v] s in v?.applyRemoteLive(s) }
        sync.onCurrentPage = { [weak controller] p in controller?.currentPage = p }
        sync.onPages = { [weak controller] ps in controller?.pages = ps }
        sync.onPassage = { [weak controller] url in controller?.passageUrl = url }
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

    private var committed: [(String, NetStroke)] = []   // key "user/id"
    private var myStack: [String] = []                  // 내가 이번 세션에 커밋한 id (되돌리기용)
    private var current: [RawPt] = []
    private var currentColor: UIColor = .black
    private var currentSize: CGFloat = 7
    private var currentId: String = ""
    private var activeTouch: UITouch?
    private var seenPencil = false
    private var lastLiveSent: CFTimeInterval = 0
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

    private func pressure(_ touch: UITouch) -> Double {
        if touch.type == .pencil, touch.maximumPossibleForce > 0 {
            return Double(touch.force / touch.maximumPossibleForce)
        }
        return 0.5
    }

    // 웹과 맞춘 렌더 폭
    private func widthPx(_ size: CGFloat, _ p: Double, _ W: CGFloat) -> CGFloat {
        size * (W / 1000) * CGFloat(0.6 + 0.9 * p)
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard activeTouch == nil, let t = touches.first(where: { accept($0) }) else { return }
        activeTouch = t
        if controller?.eraser == true { eraseAt(t.location(in: self)); return }
        currentColor = controller?.color ?? .black
        currentSize = controller?.lineWidth ?? 7
        currentId = UUID().uuidString
        current = [RawPt(loc: t.location(in: self), p: pressure(t))]
        setNeedsDisplay()
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = activeTouch, touches.contains(t) else { return }
        let samples = event?.coalescedTouches(for: t) ?? [t]
        if controller?.eraser == true { for s in samples { eraseAt(s.location(in: self)) }; return }
        for s in samples { current.append(RawPt(loc: s.location(in: self), p: pressure(s))) }
        let now = CACurrentMediaTime()
        if now - lastLiveSent > 0.05 {
            lastLiveSent = now
            sync?.publishLive(netStroke(current), id: currentId)
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
        if current.count > 1, let me = sync?.me {
            let net = netStroke(current)
            let key = "\(me)/\(currentId)"
            committed.append((key, net)); myStack.append(currentId)
            sync?.commit(id: currentId, net)
            rebuildBaked()
        }
        current = []; activeTouch = nil
        sync?.publishLive(nil, id: currentId)
        setNeedsDisplay()
    }

    func undo() {
        guard let me = sync?.me, let id = myStack.popLast() else { return }
        let key = "\(me)/\(id)"
        committed.removeAll { $0.0 == key }
        sync?.deleteMine(id: id)
        rebuildBaked(); setNeedsDisplay()
    }
    func clear() {
        guard let me = sync?.me else { return }
        committed.removeAll { $0.0.hasPrefix("\(me)/") }
        myStack.removeAll()
        sync?.clearMine()
        rebuildBaked(); setNeedsDisplay()   // 상대 획은 남음
    }

    private func eraseAt(_ point: CGPoint) {
        guard let me = sync?.me else { return }
        let r: CGFloat = 22
        var removed = false
        for (key, ns) in committed where key.hasPrefix("\(me)/") {
            let ip = inkPoints(ns)
            if ip.contains(where: { hypot($0.location.x - point.x, $0.location.y - point.y) < r + $0.width / 2 }) {
                let id = String(key.dropFirst(me.count + 1))
                sync?.deleteMine(id: id)
                committed.removeAll { $0.0 == key }
                myStack.removeAll { $0 == id }
                removed = true
            }
        }
        if removed { rebuildBaked(); setNeedsDisplay() }
    }

    // ── 원격 수신 (메인큐) ──
    func applyCommitted(_ list: [(String, NetStroke)]) {
        committed = list
        rebuildBaked(); setNeedsDisplay()
    }
    func applyRemoteLive(_ s: NetStroke?) {
        remoteLive = s
        controller?.partnerActive = (s != nil && !(s?.points.isEmpty ?? true))
        setNeedsDisplay()
    }

    // ── 정규화 ↔ 화면 ──
    private func netStroke(_ pts: [RawPt]) -> NetStroke {
        let W = max(bounds.width, 1), H = max(bounds.height, 1)
        let np = pts.map { NetPoint(x: Double($0.loc.x / W), y: Double($0.loc.y / H), p: $0.p) }
        return NetStroke(color: currentColor.toHex(), size: Double(currentSize), points: np)
    }
    private func inkPoints(_ s: NetStroke) -> [InkPoint] {
        let W = bounds.width, H = bounds.height
        return s.points.map { InkPoint(location: CGPoint(x: CGFloat($0.x) * W, y: CGFloat($0.y) * H),
                                       width: widthPx(CGFloat(s.size), $0.p, W)) }
    }
    private func currentInk() -> [InkPoint] {
        let W = bounds.width
        return current.map { InkPoint(location: $0.loc, width: widthPx(currentSize, $0.p, W)) }
    }

    // ── 베이크 ──
    private func rebuildBaked() {
        guard bounds.width > 0, bounds.height > 0 else { baked = nil; return }
        let r = UIGraphicsImageRenderer(size: bounds.size)
        baked = r.image { ctx in
            for (_, ns) in committed { drawStroke(inkPoints(ns), color: UIColor(hex: ns.color), in: ctx.cgContext) }
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
        let cur = currentInk()
        if cur.count > 1 { drawStroke(cur, color: currentColor, in: ctx) }
        else if cur.count == 1 { drawStroke([cur[0], cur[0]], color: currentColor, in: ctx) }
        if let rl = remoteLive {
            let ip = inkPoints(rl)
            if ip.count > 1 { drawStroke(ip, color: UIColor(hex: rl.color), in: ctx) }
            if let tip = ip.last {
                let c = UIColor(hex: rl.color)
                ctx.setFillColor(c.withAlphaComponent(0.22).cgColor)
                ctx.fillEllipse(in: CGRect(x: tip.location.x - 12, y: tip.location.y - 12, width: 24, height: 24))
                ctx.setFillColor(c.cgColor)
                ctx.fillEllipse(in: CGRect(x: tip.location.x - 5, y: tip.location.y - 5, width: 10, height: 10))
            }
        }
    }

    // ── 가변폭 획 — Catmull-Rom 스무딩 후 단일 외곽선 채움 ──
    private func drawStroke(_ raw: [InkPoint], color: UIColor, in ctx: CGContext) {
        let pts = smooth(raw)
        guard let first = pts.first else { return }
        ctx.setFillColor(color.cgColor)
        if pts.count == 1 {
            let r = first.width / 2
            ctx.fillEllipse(in: CGRect(x: first.location.x - r, y: first.location.y - r, width: first.width, height: first.width))
            return
        }
        var normals: [CGVector] = []; normals.reserveCapacity(pts.count)
        for i in 0 ..< pts.count {
            let p0 = pts[max(i - 1, 0)].location
            let p1 = pts[min(i + 1, pts.count - 1)].location
            let dx = p1.x - p0.x, dy = p1.y - p0.y
            let len = max(hypot(dx, dy), 0.0001)
            normals.append(CGVector(dx: -dy / len, dy: dx / len))
        }
        let path = CGMutablePath()
        for i in 0 ..< pts.count {
            let p = pts[i].location, r = pts[i].width / 2, n = normals[i]
            let pt = CGPoint(x: p.x + n.dx * r, y: p.y + n.dy * r)
            if i == 0 { path.move(to: pt) } else { path.addLine(to: pt) }
        }
        for i in stride(from: pts.count - 1, through: 0, by: -1) {
            let p = pts[i].location, r = pts[i].width / 2, n = normals[i]
            path.addLine(to: CGPoint(x: p.x - n.dx * r, y: p.y - n.dy * r))
        }
        path.closeSubpath()
        ctx.addPath(path)
        for cap in [first, pts[pts.count - 1]] {
            let r = cap.width / 2
            ctx.addEllipse(in: CGRect(x: cap.location.x - r, y: cap.location.y - r, width: cap.width, height: cap.width))
        }
        ctx.fillPath()
    }

    private func smooth(_ pts: [InkPoint]) -> [InkPoint] {
        guard pts.count >= 3 else { return pts }
        var out: [InkPoint] = []; let n = pts.count
        for i in 0 ..< n - 1 {
            let p0 = pts[max(i - 1, 0)].location
            let p1 = pts[i]; let p2 = pts[i + 1]
            let p3 = pts[min(i + 2, n - 1)].location
            let dist = hypot(p2.location.x - p1.location.x, p2.location.y - p1.location.y)
            let steps = max(1, min(24, Int(dist / 2)))
            for s in 0 ..< steps {
                let t = CGFloat(s) / CGFloat(steps)
                out.append(InkPoint(location: catmullRom(p0, p1.location, p2.location, p3, t),
                                    width: p1.width + (p2.width - p1.width) * t))
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
