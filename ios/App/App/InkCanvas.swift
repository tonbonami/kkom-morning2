import SwiftUI
import UIKit

// 통일 캔버스. .pencil만 받기(팜리젝션), coalescedTouches, 진짜 touch.force(필압), 정규화 0~1.
// 확정 획은 전부 RTDB(canvas/{page}/strokes)에서 렌더 → 페이지 넘겼다 와도 "내 획"까지 복원됨.
// 획 포맷은 웹과 동일: { color, size, points:[{x,y,p}] }. 렌더 폭 = size*(W/1000)*(0.6+0.9p).

struct InkPoint { var location: CGPoint; var width: CGFloat }
struct RawPt { var loc: CGPoint; var p: Double }
struct CanvasCommentItem: Identifiable { let id: String; let by: String; let text: String }

// ── 도구 상태 ──
final class CanvasController: ObservableObject {
    @Published var colorIndex: Int = 2
    @Published var lineWidth: CGFloat = 7
    @Published var pencilOnly: Bool = true
    @Published var eraser: Bool = false
    @Published var panMode: Bool = false       // 손바닥(이동) 모드: 드래그로 화면 이동, 그리기 잠금
    @Published var partnerActive: Bool = false
    @Published var currentPage: String = ""
    @Published var pages: [String] = []
    @Published var passageUrl: String? = nil   // 공유 지문 (웹에서 설정, RTDB)
    @Published var likedBy: [String] = []      // 이 페이지에 하트 누른 사람
    @Published var comments: [CanvasCommentItem] = []
    // 확대/이동 — 손가락 제스처(.direct)가 여기 갱신, CanvasScreen이 scaleEffect/offset에 반영.
    @Published var zoom: CGFloat = 1
    @Published var panOffset: CGSize = .zero
    var boardSize: CGSize = .zero
    weak var canvas: StrokeCanvasView?
    weak var sync: SyncClient?

    // 확대 배율에 맞춰 이동 범위 제한 (빈 여백으로 못 나가게)
    func clampPan(_ o: CGSize) -> CGSize {
        let mx = max(0, (zoom - 1) * boardSize.width / 2)
        let my = max(0, (zoom - 1) * boardSize.height / 2)
        return CGSize(width: min(mx, max(-mx, o.width)), height: min(my, max(-my, o.height)))
    }
    func nudgePan(_ delta: CGSize, base: CGSize) {
        panOffset = clampPan(CGSize(width: base.width + delta.width, height: base.height + delta.height))
    }
    func setZoom(_ z: CGFloat) { zoom = min(4, max(1, z)); panOffset = clampPan(panOffset) }
    func resetView() { zoom = 1; panOffset = .zero; panMode = false }

    // 웹과 동일 4색: 꼼이 로즈 / 우댕 블루 / 먹 / 형광
    static let palette: [UIColor] = [
        UIColor(hex: "#f43f5e"),   // 로즈(꼼이)
        UIColor(hex: "#3b82f6"),   // 블루(우댕)
        UIColor(hex: "#334155"),   // 먹
        UIColor(hex: "#facc15"),   // 노랑
        UIColor(hex: "#fb923c"),   // 주황
        UIColor(hex: "#22c55e"),   // 초록
        UIColor(hex: "#14b8a6"),   // 민트
        UIColor(hex: "#a855f7"),   // 보라
        UIColor(hex: "#ec4899"),   // 핑크
        UIColor(hex: "#a16207"),   // 갈색
    ]
    var color: UIColor { Self.palette[colorIndex] }

    var pageIndex: Int { pages.firstIndex(of: currentPage) ?? 0 }
    func undo() { canvas?.undo() }
    func clear() { canvas?.clear() }
    func newPage() { sync?.createPage() }
    func goPrev() { let i = pageIndex; if i > 0 { sync?.setCurrentPage(pages[i - 1]) } }
    func goNext() { let i = pageIndex; if i >= 0 && i < pages.count - 1 { sync?.setCurrentPage(pages[i + 1]) } }
    var canDeletePage: Bool { pages.count > 1 }
    func deleteCurrentPage() {
        guard canDeletePage, let sync = sync else { return }
        let id = currentPage
        let remaining = pages.filter { $0 != id }
        let newIdx = min(max(0, pageIndex - 1), remaining.count - 1)
        sync.setCurrentPage(remaining[newIdx])  // 먼저 다른 페이지로 이동
        sync.deletePage(id)
    }
    func toggleLike(_ on: Bool) { sync?.toggleLike(on) }
    func addComment(_ text: String) { sync?.addComment(text) }
    func deleteComment(_ id: String) { sync?.deleteComment(id) }
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
        sync.onReact = { [weak controller] likedBy, comments in
            controller?.likedBy = likedBy
            controller?.comments = comments.map { CanvasCommentItem(id: $0.0, by: $0.1, text: $0.2) }
        }
        sync.start()
        return v
    }
    func updateUIView(_ uiView: StrokeCanvasView, context: Context) {
        uiView.controller = controller
        // 아이패드+펜슬모드에서만 한 손가락 이동 제스처 활성 (폰/손그림 모드는 손가락이 그림이라 끔)
        uiView.setFingerPanEnabled(UIDevice.current.userInterfaceIdiom == .pad && controller.pencilOnly)
    }
    // 낙서장이 화면에서 사라질 때(닫기) 호출 — SSE 스트림 정리해서 연결·메모리 누수 방지.
    static func dismantleUIView(_ uiView: StrokeCanvasView, coordinator: Void) {
        uiView.sync?.stop()
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
    private var panBase: CGSize = .zero
    private weak var fingerPan: UIPanGestureRecognizer?
    private var lastLiveSent: CFTimeInterval = 0
    private var remoteLive: NetStroke?
    private var liveGen = 0   // 상대 생중계 표시 자동 소멸용 세대 카운터

    private var baked: UIImage?
    private var bakedSize: CGSize = .zero

    // ── 현재 획 증분 렌더 (뚝뚝 끊김 해결) ──
    // 예전엔 draw()가 touchesMoved마다 current 점 '전부'를 Catmull-Rom 재스무딩 + 외곽선 재생성 →
    // 획당 O(n²), 120Hz 아이패드에서 프레임 드랍 → 라이브 잉크 끊김.
    // Catmull-Rom은 로컬(구간=4점)이라, 확정된 앞부분은 liveBaked 이미지에 한 번만 굽고(겹침 append),
    // 매 프레임엔 꼬리(마지막 몇 점)만 다시 그린다 → O(1)/프레임.
    private var liveBaked: UIImage?          // 현재 획의 '확정된 앞부분' 캐시
    private var liveBakedUpto: Int = 0       // liveBaked 에 담긴 current 인덱스(그 앞은 다시 안 그림)
    private var predictedTail: [RawPt] = []  // predictedTouches — 지연 감추는 임시 꼬리(커밋 안 함)
    private let liveTailKeep = 12             // 실시간으로 다시 그리는 꼬리 점 수
    private let liveOverlap = 4               // 재굽기 시 겹침(이음새 매끄럽게)

    override init(frame: CGRect) {
        super.init(frame: frame)
        isMultipleTouchEnabled = true
        backgroundColor = .clear
        isOpaque = false
        // DuoBoard식 — 손가락(.direct) 제스처로 이동/확대. 펜슬(.pencil)은 안 걸려서 그대로 그려짐.
        let fingerOnly = [NSNumber(value: UITouch.TouchType.direct.rawValue)]
        let pan = UIPanGestureRecognizer(target: self, action: #selector(onFingerPan(_:)))
        pan.allowedTouchTypes = fingerOnly; pan.maximumNumberOfTouches = 1; pan.delegate = self
        addGestureRecognizer(pan); fingerPan = pan
        let pinch = UIPinchGestureRecognizer(target: self, action: #selector(onFingerPinch(_:)))
        pinch.allowedTouchTypes = fingerOnly; pinch.delegate = self
        addGestureRecognizer(pinch)
    }

    // 폰/펜슬모드off엔 손가락이 '그림'이라 이동 제스처 끔. 아이패드+펜슬모드에서만 켬. (updateUIView가 갱신)
    func setFingerPanEnabled(_ on: Bool) { fingerPan?.isEnabled = on }

    @objc private func onFingerPan(_ g: UIPanGestureRecognizer) {
        guard let c = controller, isPad, c.pencilOnly else { return }
        let t = g.translation(in: nil)
        if g.state == .began { panBase = c.panOffset }
        else if g.state == .changed { c.nudgePan(CGSize(width: t.x, height: t.y), base: panBase) }
    }
    @objc private func onFingerPinch(_ g: UIPinchGestureRecognizer) {
        guard let c = controller else { return }
        if g.state == .changed { c.setZoom(c.zoom * g.scale); g.scale = 1 }
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }

    // 획 시작 — 도구 세팅 + 첫 점 (touchesBegan에서 분리)
    private func startStroke(with t: UITouch) {
        activeTouch = t
        if controller?.eraser == true { eraseAt(t.location(in: self)); return }
        currentColor = controller?.color ?? .black
        currentSize = controller?.lineWidth ?? 7
        currentId = UUID().uuidString
        current = [RawPt(loc: t.location(in: self), p: pressure(t))]
        liveBaked = nil; liveBakedUpto = 0; predictedTail = []
        setNeedsDisplay()
    }
    // 진행 중이던 획을 커밋 없이 폐기 (팜으로 시작했다가 펜슬이 끼어들 때 — 팜 자국 제거)
    private func discardCurrent() {
        current = []; activeTouch = nil
        liveBaked = nil; liveBakedUpto = 0; predictedTail = []
        sync?.publishLive(nil, id: currentId)
        setNeedsDisplay()
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
        // ① 펜슬 우선 — 펜슬이 닿으면 팜/손가락으로 시작한 획을 폐기하고 펜슬로 교체
        if let pen = touches.first(where: { $0.type == .pencil }) {
            if let a = activeTouch, a.type != .pencil { discardCurrent() }
            if activeTouch == nil { startStroke(with: pen) }
            return
        }
        // ② 손가락/팜. 이미 그리는 중이면 무시.
        guard activeTouch == nil else { return }
        // 아이패드 + 펜슬모드 → 손가락/팜 전부 그리기 배제 (touch.type만으로 팜 완전 차단, DuoBoard 방식).
        //   폰(.phone)은 항상 손가락으로 그려지고, 펜슬모드를 끄면 아이패드도 손가락 허용.
        if isPad && (controller?.pencilOnly ?? true) { return }
        guard let t = touches.first(where: { $0.type == .direct }) else { return }
        startStroke(with: t)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = activeTouch, touches.contains(t) else { return }
        let samples = event?.coalescedTouches(for: t) ?? [t]
        if controller?.eraser == true { for s in samples { eraseAt(s.location(in: self)) }; return }
        for s in samples { current.append(RawPt(loc: s.location(in: self), p: pressure(s))) }
        // 예측 터치 — 다음 실제 업데이트에서 버리는 임시 꼬리(체감 지연 제거). 커밋·전송엔 안 넣음.
        predictedTail = (event?.predictedTouches(for: t) ?? []).map { RawPt(loc: $0.location(in: self), p: pressure($0)) }
        bakeSettledPrefixIfNeeded()
        let now = CACurrentMediaTime()
        if now - lastLiveSent > 0.05 {
            lastLiveSent = now
            sync?.publishLive(netStroke(current), id: currentId)
        }
        setNeedsDisplay()
    }

    // 확정된 앞부분(꼬리·겹침 남기고)을 liveBaked 이미지에 '새 구간만' 덧그려 캐시.
    // Catmull-Rom이 로컬이라 확정분은 다시 안 바뀜 → 매번 전체 재스무딩할 필요가 없다.
    private func bakeSettledPrefixIfNeeded() {
        guard bounds.width > 0, bounds.height > 0 else { return }
        let settleTo = current.count - liveTailKeep          // 이 앞은 이제 안 변함
        guard settleTo - liveBakedUpto > liveTailKeep else { return }  // 충분히 쌓였을 때만 굽는다
        let from = max(0, liveBakedUpto - liveOverlap)       // 겹쳐 그려 이음새 제거(같은 색이라 무방)
        let seg = Array(current[from ..< settleTo]).map {
            InkPoint(location: $0.loc, width: widthPx(currentSize, $0.p, bounds.width))
        }
        let prev = liveBaked
        let r = UIGraphicsImageRenderer(size: bounds.size)
        liveBaked = r.image { ctx in
            prev?.draw(at: .zero)                             // 기존 캐시 위에
            drawStroke(seg, color: currentColor, in: ctx.cgContext)  // 새 구간만 덧그림 → O(꼬리)
        }
        liveBakedUpto = settleTo
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
        liveBaked = nil; liveBakedUpto = 0; predictedTail = []
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
    // 상대 생중계 획. RTDB REST엔 onDisconnect가 없어 stale 노드가 남을 수 있음 →
    // 새 업데이트 없으면 2.5초 뒤 '끄적이는 중' 표시·유령 획을 자동 제거.
    func applyRemoteLive(_ s: NetStroke?) {
        if let s = s, !s.points.isEmpty {
            remoteLive = s
            controller?.partnerActive = true
            liveGen &+= 1
            let g = liveGen
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { [weak self] in
                guard let self = self, self.liveGen == g else { return }
                self.remoteLive = nil
                self.controller?.partnerActive = false
                self.setNeedsDisplay()
            }
        } else {
            remoteLive = nil
            controller?.partnerActive = false
            liveGen &+= 1
        }
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
        controller?.boardSize = bounds.size   // 이동 클램프용
        if bakedSize != bounds.size { rebuildBaked() }
    }

    override func draw(_ rect: CGRect) {
        guard let ctx = UIGraphicsGetCurrentContext() else { return }
        baked?.draw(at: .zero)
        // 현재 획 = 확정 앞부분(liveBaked, 한 번 구움) + 실시간 꼬리(마지막 몇 점 + 예측).
        // 매 프레임 꼬리만 스무딩 → O(1)/프레임 → 120Hz에서도 안 끊김. 예측 꼬리로 지연도 감춤.
        liveBaked?.draw(at: .zero)
        if !current.isEmpty {
            let tailStart = max(0, liveBakedUpto - liveOverlap)
            var tail = Array(current[tailStart...])
            tail.append(contentsOf: predictedTail)
            let ink = tail.map { InkPoint(location: $0.loc, width: widthPx(currentSize, $0.p, bounds.width)) }
            if ink.count > 1 { drawStroke(ink, color: currentColor, in: ctx) }
            else if ink.count == 1 { drawStroke([ink[0], ink[0]], color: currentColor, in: ctx) }
        }
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

extension StrokeCanvasView: UIGestureRecognizerDelegate {
    // 손가락 이동+핀치 동시 인식 (이동 중 두 손가락으로 확대 자연스럽게)
    func gestureRecognizer(_ g: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }
}
