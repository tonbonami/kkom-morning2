import SwiftUI
import UIKit

// 통일 캔버스. .pencil만 받기(팜리젝션), coalescedTouches, 진짜 touch.force(필압), 정규화 0~1.
// 확정 획은 전부 RTDB(canvas/{page}/strokes)에서 렌더 → 페이지 넘겼다 와도 "내 획"까지 복원됨.
// 획 포맷은 웹과 동일: { color, size, points:[{x,y,p}] }. 렌더 폭 = size*(W/1000)*(0.6+0.9p).

struct InkPoint { var location: CGPoint; var width: CGFloat }
struct RawPt { var loc: CGPoint; var p: Double }
// CanvasCommentItem(id, by, text, at)은 CanvasUI.swift(제미나이 시안)에 있음

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
    func redo() { canvas?.redo() }   // 다이어리 필기만(낙서장은 다시 하기 없음)
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
    func clearPassage() { sync?.setPassage(nil) }   // 공유 지문 빼기 (둘 다에게서, 획은 그대로)
}

// ── 다이어리 필기 도구 상태 (11/21 우댕 「검은색도 없고·지우개 다 지워지고·뒤로가기·크레파스·연필」 → GPT 토의 + 제미나이 시안) ──
// 낙서장은 CanvasController 그대로, 다이어리 필기만 이걸 쓴다(StrokeCanvasView.diaryTools).
enum DiaryBrush: String, CaseIterable, Identifiable {
    case pen, pencil, crayon, highlighter
    var id: String { rawValue }
    var label: String { switch self { case .pen: return "펜"; case .pencil: return "연필"; case .crayon: return "크레파스"; case .highlighter: return "형광펜" } }
}
enum DiaryEraserMode { case partial, whole }   // 부분 지우기 / 획 전체 지우기

final class DiaryInkTools: ObservableObject {
    static let colorHexes = ["#23272E", "#8A8F98", "#7A5844", "#D64545", "#E8789A", "#F08C3C", "#F2C230", "#3F9B62", "#3D74C7", "#8466C4"]
    static let colorNames = ["검정", "회색", "갈색", "빨강", "분홍", "주황", "노랑", "초록", "파랑", "보라"]
    @Published var brush: DiaryBrush = .pen
    @Published var colorIndex: Int = 0
    @Published var sizeIndex: [DiaryBrush: Int] = [.pen: 1, .pencil: 1, .crayon: 1, .highlighter: 1]   // 0 얇게 · 1 보통 · 2 굵게
    @Published var erasing: Bool = false
    @Published var eraserMode: DiaryEraserMode = .partial
    @Published var eraserSizeIndex: Int = 1                    // 0 작게 · 1 보통 · 2 크게
    @Published var canUndo: Bool = false
    @Published var canRedo: Bool = false
    @Published var pencilOnly: Bool = true                     // 아이패드만
    var currentSizeIndex: Int { sizeIndex[brush] ?? 1 }

    /// 도구별 굵기(보드 폭 1000 기준, GPT 토의값) · 지우개 지름
    static let brushSizes: [DiaryBrush: [CGFloat]] = [.pen: [4, 7, 11], .pencil: [5, 8, 12], .crayon: [14, 22, 34], .highlighter: [20, 32, 48]]
    static let eraserSizes: [CGFloat] = [30, 60, 100]
    var color: UIColor { UIColor(hex: Self.colorHexes[min(max(colorIndex, 0), Self.colorHexes.count - 1)]) }
    var brushSize: CGFloat { let s = Self.brushSizes[brush] ?? [4, 7, 11]; return s[min(max(currentSizeIndex, 0), s.count - 1)] }
    var eraserSize: CGFloat { Self.eraserSizes[min(max(eraserSizeIndex, 0), Self.eraserSizes.count - 1)] }
}

/// 획의 붓(NetStroke.b). nil = 펜 — 낙서장 획·옛 다이어리 획.
enum InkKind: String {
    case pen, pencil, crayon, hl, erase
    init(code: String?) { self = code.flatMap { InkKind(rawValue: $0) } ?? .pen }
    init(brush: DiaryBrush) { switch brush { case .pen: self = .pen; case .pencil: self = .pencil; case .crayon: self = .crayon; case .highlighter: self = .hl } }
    var alpha: CGFloat { switch self { case .pencil: return 0.9; case .hl: return 0.34; default: return 1 } }
    var textured: Bool { self == .pencil || self == .crayon }
    var layered: Bool { self == .pencil || self == .crayon || self == .hl }
}

/// 연필·크레파스 종이결 — 알파 = 덜어 낼 양(destinationOut). 고정 난수라 다시 굽거나 다른 기기에서 열어도 같다.
enum InkGrain {
    static let N = 256
    static let pencil: CGImage = make { x, y in
        let tooth = tileNoise(x, y, cell: 4, salt: 11), fine = hash(x, y, 7)
        return smooth(0.40, 0.84, 0.6 * tooth + 0.4 * fine)
    }
    static let crayon: CGImage = make { x, y in
        let tooth = tileNoise(x, y, cell: 4, salt: 23), blot = tileNoise(x, y, cell: 16, salt: 5), fine = hash(x, y, 3)
        return smooth(0.50, 0.64, 0.5 * tooth + 0.35 * blot + 0.15 * fine)
    }
    static func hash(_ x: Int, _ y: Int, _ s: Int) -> CGFloat {
        var h = UInt32(truncatingIfNeeded: x &* 374_761_393 &+ y &* 668_265_263 &+ s &* 1_274_126_177)
        h = (h ^ (h >> 13)) &* 1_274_126_177
        h ^= h >> 16
        return CGFloat(h & 0xFFFF) / 65535
    }
    /// 이음매 없는 값 잡음(N 을 cell 로 나눈 격자가 한 바퀴 돈다)
    static func tileNoise(_ x: Int, _ y: Int, cell: Int, salt: Int) -> CGFloat {
        let P = N / cell
        let gx = x / cell, gy = y / cell
        let fx = CGFloat(x % cell) / CGFloat(cell), fy = CGFloat(y % cell) / CGFloat(cell)
        let ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
        let a = hash(gx % P, gy % P, salt), b = hash((gx + 1) % P, gy % P, salt)
        let c = hash(gx % P, (gy + 1) % P, salt), d = hash((gx + 1) % P, (gy + 1) % P, salt)
        return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy
    }
    /// 자리로 정해지는 잡음(이음매 없음 아님) — 크레파스 가장자리 들쭉날쭉
    static func posNoise(_ x: CGFloat, _ y: CGFloat, _ s: Int) -> CGFloat {
        let gx = Int(floor(x)), gy = Int(floor(y))
        let fx = x - floor(x), fy = y - floor(y)
        let ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
        let a = hash(gx, gy, s), b = hash(gx + 1, gy, s), c = hash(gx, gy + 1, s), d = hash(gx + 1, gy + 1, s)
        return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy
    }
    static func smooth(_ e0: CGFloat, _ e1: CGFloat, _ v: CGFloat) -> CGFloat {
        let t = min(1, max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
    }
    static func make(_ f: (Int, Int) -> CGFloat) -> CGImage {
        var buf = [UInt8](repeating: 0, count: N * N * 4)
        for y in 0 ..< N { for x in 0 ..< N { buf[(y * N + x) * 4 + 3] = UInt8(max(0, min(255, f(x, y) * 255))) } }
        let provider = CGDataProvider(data: Data(buf) as CFData)!
        return CGImage(width: N, height: N, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: N * 4,
                       space: CGColorSpace(name: CGColorSpace.sRGB)!,
                       bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                       provider: provider, decode: nil, shouldInterpolate: true, intent: .defaultIntent)!
    }
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
            controller?.comments = comments.map { CanvasCommentItem(id: $0.0, by: $0.1, text: $0.2, at: $0.3 > 0 ? Date(timeIntervalSince1970: $0.3 / 1000) : nil) }
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
    // 다이어리 필기(우댕 2026-11-18 「아이패드 필기 1단계 진행해」) — 서버 없이 이 기기에서만 그린다. 값이 있으면 sync 대신 이걸 「나」로 쓴다.
    var localMe: String?
    private var meId: String? { localMe ?? sync?.me }
    /// 다이어리 필기 도구(11/21) — 있으면 붓·색·굵기·지우개를 여기서 읽고, 되돌리기·다시 하기를 명령 목록으로 한다. 낙서장은 nil.
    weak var diaryTools: DiaryInkTools?

    private var committed: [(String, NetStroke)] = []   // key "user/id" — 순서 = 그리는 순서(지우개 획도 이 순서로 합성)
    private var myStack: [String] = []                  // 내가 이번 세션에 커밋한 id (되돌리기용 — 낙서장)
    private var current: [RawPt] = []
    private var currentColor: UIColor = .black
    private var currentSize: CGFloat = 7
    private var currentId: String = ""
    private var currentKind: InkKind = .pen
    private var currentSeed: Int = 0
    // 다이어리 되돌리기·다시 하기 — 펜 한 번·지우개 한 번 = 명령 하나
    private enum LocalCmd { case add(String, NetStroke); case replace([(String, NetStroke)], [(String, NetStroke)]) }
    private var undoCmds: [LocalCmd] = []
    private var redoCmds: [LocalCmd] = []
    private var wholeErasing = false                     // 획 전체 지우기 드래그 중
    private var wholeBefore: [(String, NetStroke)] = []
    private var eraserCursor: CGPoint?                   // 지우개 동그라미(어디가 지워지는지)
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
        if let dt = diaryTools {
            if dt.erasing && dt.eraserMode == .whole {
                wholeErasing = true; wholeBefore = committed
                eraserCursor = t.location(in: self)
                eraseWholeAt(t.location(in: self)); setNeedsDisplay()
                return
            }
            currentKind = dt.erasing ? .erase : InkKind(brush: dt.brush)
            currentColor = dt.erasing ? .black : dt.color
            currentSize = dt.erasing ? dt.eraserSize : dt.brushSize
            currentSeed = Int.random(in: 1 ... 999_983)
            eraserCursor = dt.erasing ? t.location(in: self) : nil
        } else {
            if controller?.eraser == true { eraseAt(t.location(in: self)); return }
            currentKind = .pen
            currentColor = controller?.color ?? .black
            currentSize = controller?.lineWidth ?? 7
        }
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

    // 웹과 맞춘 렌더 폭(펜). 다이어리 붓은 필압을 덜 쓰거나(크레파스) 안 쓴다(형광펜·지우개).
    private func widthPx(_ size: CGFloat, _ p: Double, _ W: CGFloat, _ k: InkKind = .pen) -> CGFloat {
        let base = size * (W / 1000)
        switch k {
        case .pen: return base * CGFloat(0.6 + 0.9 * p)
        case .pencil: return base * CGFloat(0.55 + 0.9 * p)
        case .crayon: return base * CGFloat(0.85 + 0.3 * p)
        case .hl, .erase: return base
        }
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
        if wholeErasing {
            for s in samples { eraseWholeAt(s.location(in: self)) }
            eraserCursor = t.location(in: self); setNeedsDisplay(); return
        }
        if diaryTools == nil, controller?.eraser == true { for s in samples { eraseAt(s.location(in: self)) }; return }
        if currentKind == .erase { eraserCursor = t.location(in: self) }
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
            InkPoint(location: $0.loc, width: widthPx(currentSize, $0.p, bounds.width, currentKind))
        }
        let prev = liveBaked
        let r = UIGraphicsImageRenderer(size: bounds.size)
        // 캐시는 늘 「불투명 단색 덮개」 — 겹쳐 그려도 같은 결과라 이음새가 안 생긴다. 반투명·종이결·지우기는 draw() 가 한 번에 입힌다.
        let col: UIColor = currentKind == .erase ? .black : currentColor
        let rough: Int? = currentKind == .crayon ? currentSeed : nil
        liveBaked = r.image { ctx in
            prev?.draw(at: .zero)                             // 기존 캐시 위에
            drawStroke(seg, color: col, in: ctx.cgContext, rough: rough)  // 새 구간만 덧그림 → O(꼬리)
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
        eraserCursor = nil
        if wholeErasing {
            wholeErasing = false
            if committed.map(\.0) != wholeBefore.map(\.0) { pushCmd(.replace(wholeBefore, committed)) }
            wholeBefore = []; activeTouch = nil
            setNeedsDisplay(); return
        }
        // 다이어리는 콕 찍은 점(점 하나)도 남긴다 — 눈·점 그리기
        if current.count >= (diaryTools != nil ? 1 : 2), let me = meId {
            let net = netStroke(current)
            let key = "\(me)/\(currentId)"
            committed.append((key, net)); myStack.append(currentId)
            sync?.commit(id: currentId, net)
            if diaryTools != nil { pushCmd(.add(key, net)) }
            rebuildBaked()
        }
        current = []; activeTouch = nil
        liveBaked = nil; liveBakedUpto = 0; predictedTail = []
        sync?.publishLive(nil, id: currentId)
        setNeedsDisplay()
    }

    // ── 다이어리 되돌리기·다시 하기 ──
    private func pushCmd(_ c: LocalCmd) { undoCmds.append(c); redoCmds.removeAll(); publishHistory() }
    private func publishHistory() {
        diaryTools?.canUndo = !undoCmds.isEmpty
        diaryTools?.canRedo = !redoCmds.isEmpty
    }
    private func applyCmd(_ c: LocalCmd, forward: Bool) {
        switch c {
        case .add(let key, let s):
            if forward { committed.append((key, s)) } else { committed.removeAll { $0.0 == key } }
        case .replace(let before, let after):
            committed = forward ? after : before
        }
    }
    func redo() {
        guard diaryTools != nil, activeTouch == nil, let c = redoCmds.popLast() else { return }
        applyCmd(c, forward: true); undoCmds.append(c); publishHistory()
        rebuildBaked(); setNeedsDisplay()
    }

    func undo() {
        if diaryTools != nil {
            guard activeTouch == nil, let c = undoCmds.popLast() else { return }
            applyCmd(c, forward: false); redoCmds.append(c); publishHistory()
            rebuildBaked(); setNeedsDisplay()
            return
        }
        guard let me = meId, let id = myStack.popLast() else { return }
        let key = "\(me)/\(id)"
        committed.removeAll { $0.0 == key }
        sync?.deleteMine(id: id)
        rebuildBaked(); setNeedsDisplay()
    }

    /// 다이어리 「획 전체 지우기」 — 지우개 동그라미에 닿은 그림 획을 통째로(지우개 획은 건드리지 않음). 드래그 한 번이 명령 하나.
    private func eraseWholeAt(_ point: CGPoint) {
        guard let dt = diaryTools else { return }
        let r = dt.eraserSize * (bounds.width / 1000) / 2
        let before = committed.count
        committed.removeAll { (_, ns) in
            InkKind(code: ns.b) != .erase &&
            inkPoints(ns).contains { hypot($0.location.x - point.x, $0.location.y - point.y) < r + $0.width / 2 }
        }
        if committed.count != before { rebuildBaked(); setNeedsDisplay() }
    }
    func clear() {
        guard let me = meId else { return }
        committed.removeAll { $0.0.hasPrefix("\(me)/") }
        myStack.removeAll()
        sync?.clearMine()
        rebuildBaked(); setNeedsDisplay()   // 상대 획은 남음
    }

    private func eraseAt(_ point: CGPoint) {
        guard let me = meId else { return }
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
        var s = NetStroke(color: currentKind == .erase ? "#000000" : currentColor.toHex(), size: Double(currentSize), points: np)
        if diaryTools != nil {
            if currentKind != .pen { s.b = currentKind.rawValue }
            if currentKind.textured { s.sd = currentSeed }
        }
        return s
    }
    private func inkPoints(_ s: NetStroke) -> [InkPoint] {
        let W = bounds.width, H = bounds.height
        let k = InkKind(code: s.b)
        return s.points.map { InkPoint(location: CGPoint(x: CGFloat($0.x) * W, y: CGFloat($0.y) * H),
                                       width: widthPx(CGFloat(s.size), $0.p, W, k)) }
    }

    // ── 베이크 ──
    private func rebuildBaked() {
        guard bounds.width > 0, bounds.height > 0 else { baked = nil; return }
        let r = UIGraphicsImageRenderer(size: bounds.size)
        baked = r.image { ctx in renderAll(ctx.cgContext) }
        bakedSize = bounds.size
    }
    /// 확정 획 전부를 순서대로 — 화면 캐시·내보내기·테두리 재기가 모두 이것(같은 모양 보장).
    private func renderAll(_ ctx: CGContext) {
        for (_, ns) in committed {
            paint(inkPoints(ns), kind: InkKind(code: ns.b), color: UIColor(hex: ns.color), seed: ns.sd ?? 1, in: ctx)
        }
    }

    // ── 붓별 칠하기 ──
    /// 펜 = 매끈한 외곽선 · 연필 = 옅게 + 고운 종이결 · 크레파스 = 들쭉날쭉 가장자리 + 굵은 종이결 · 형광펜 = 한 획을 한 번에 34%(획 안에서 겹쳐도 안 진해짐) · 지우개 = 그 자리를 투명하게
    private func paint(_ pts: [InkPoint], kind: InkKind, color: UIColor, seed: Int, in ctx: CGContext) {
        guard !pts.isEmpty else { return }
        let p = pts.count == 1 ? [pts[0], pts[0]] : pts
        switch kind {
        case .pen:
            drawStroke(p, color: color, in: ctx)
        case .erase:
            ctx.saveGState(); ctx.setBlendMode(.destinationOut)
            drawStroke(p, color: .black, in: ctx)
            ctx.restoreGState()
        case .pencil, .crayon, .hl:
            ctx.saveGState()
            ctx.clip(to: strokeBox(p, rough: kind == .crayon))   // 층을 획 둘레로만(빠르게)
            ctx.setAlpha(kind.alpha)
            ctx.beginTransparencyLayer(auxiliaryInfo: nil)
            drawStroke(p, color: color, in: ctx, rough: kind == .crayon ? seed : nil)
            if kind.textured { knockGrain(kind, seed: seed, in: ctx) }
            ctx.endTransparencyLayer()
            ctx.restoreGState()
        }
    }
    /// 그리는 중인 획 — 앞부분 캐시(불투명 단색) + 꼬리를 한 층에 모아 반투명·종이결을 한 번만 입힌다.
    private func paintLive(_ tail: [InkPoint], in ctx: CGContext) {
        let rough: Int? = currentKind == .crayon ? currentSeed : nil
        switch currentKind {
        case .pen:
            liveBaked?.draw(at: .zero)
            if !tail.isEmpty { drawStroke(tail, color: currentColor, in: ctx) }
        case .erase:
            liveBaked?.draw(at: .zero, blendMode: .destinationOut, alpha: 1)
            if !tail.isEmpty {
                ctx.saveGState(); ctx.setBlendMode(.destinationOut)
                drawStroke(tail, color: .black, in: ctx)
                ctx.restoreGState()
            }
        case .pencil, .crayon, .hl:
            let all = current.map { InkPoint(location: $0.loc, width: widthPx(currentSize, $0.p, bounds.width, currentKind)) } + tail
            ctx.saveGState()
            ctx.clip(to: strokeBox(all, rough: currentKind == .crayon))
            ctx.setAlpha(currentKind.alpha)
            ctx.beginTransparencyLayer(auxiliaryInfo: nil)
            liveBaked?.draw(at: .zero)
            if !tail.isEmpty { drawStroke(tail, color: currentColor, in: ctx, rough: rough) }
            if currentKind.textured { knockGrain(currentKind, seed: currentSeed, in: ctx) }
            ctx.endTransparencyLayer()
            ctx.restoreGState()
        }
    }
    private func strokeBox(_ pts: [InkPoint], rough: Bool) -> CGRect {
        var minX = CGFloat.greatestFiniteMagnitude, minY = CGFloat.greatestFiniteMagnitude
        var maxX = -CGFloat.greatestFiniteMagnitude, maxY = -CGFloat.greatestFiniteMagnitude
        for p in pts {
            let r = p.width / 2 * (rough ? 1.35 : 1) + 2
            minX = min(minX, p.location.x - r); minY = min(minY, p.location.y - r)
            maxX = max(maxX, p.location.x + r); maxY = max(maxY, p.location.y + r)
        }
        guard minX <= maxX else { return .null }
        return CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
    }
    /// 종이결 덜어 내기 — 보드에 붙은 무늬(보드 폭에 비례)라 폰·아이패드·내보낸 그림이 같은 결. 시드만큼 무늬를 밀어 획마다 결이 다르게.
    private func knockGrain(_ kind: InkKind, seed: Int, in ctx: CGContext) {
        let W = max(bounds.width, 1)
        let T = W * (kind == .crayon ? 0.30 : 0.16)
        let ox = CGFloat(seed % 89) / 89 * T, oy = CGFloat((seed / 89) % 89) / 89 * T
        ctx.saveGState(); ctx.setBlendMode(.destinationOut)
        ctx.draw(kind == .crayon ? InkGrain.crayon : InkGrain.pencil, in: CGRect(x: -ox, y: -oy, width: T, height: T), byTiling: true)
        ctx.restoreGState()
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
        if !current.isEmpty {
            let tailStart = max(0, liveBakedUpto - liveOverlap)
            var tail = Array(current[tailStart...])
            tail.append(contentsOf: predictedTail)
            let ink = tail.map { InkPoint(location: $0.loc, width: widthPx(currentSize, $0.p, bounds.width, currentKind)) }
            paintLive(ink.count == 1 ? [ink[0], ink[0]] : ink, in: ctx)
        } else {
            liveBaked?.draw(at: .zero)
        }
        // 지우개 동그라미 — 어디까지 지워지는지 보이게
        if let c = eraserCursor, let dt = diaryTools {
            let d = dt.eraserSize * (bounds.width / 1000)
            ctx.setStrokeColor(UIColor(red: 0.2, green: 0.25, blue: 0.33, alpha: 0.55).cgColor)
            ctx.setLineWidth(1.2)
            ctx.strokeEllipse(in: CGRect(x: c.x - d / 2, y: c.y - d / 2, width: d, height: d))
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

    // ── 다이어리 필기 내보내기 ──
    var hasStrokes: Bool { committed.contains { InkKind(code: $0.1.b) != .erase } }
    /// 다시 그리기(필기 2단계) — 저장해 둔 획(보드 0~1)을 불러와 이어서 고친다. 불러온 획도 「내 것」이라 지우개로 지울 수 있다.
    func loadLocalStrokes(_ list: [NetStroke]) {
        guard let me = meId else { return }
        committed = list.map { ("\(me)/\(UUID().uuidString)", $0) }
        rebuildBaked(); setNeedsDisplay()
    }
    /// 지금 획 전부(보드 0~1) — JSON 문자열. 다시 그리기용으로 그림과 함께 저장한다.
    func exportStrokesJSON() -> String? {
        let list = committed.map { $0.1 }
        guard let data = try? JSONEncoder().encode(list) else { return nil }
        return String(data: data, encoding: .utf8)
    }
    /// 그린 부분만 잘라 투명 PNG + 그 자리(보드에 대한 0~1). 다이어리 종이도 같은 3:4라 그대로 같은 자리에 붙는다.
    /// 긴 변이 maxSide px 안쪽이 되게(최대 3배 해상도) 굽는다 — 종이에서 키워도 선이 덜 뭉개지게.
    func exportInk(maxSide: CGFloat = 1400) -> (png: Data, rect: CGRect)? {
        guard bounds.width > 0, bounds.height > 0, hasStrokes else { return nil }
        // 실제로 남은 잉크(알파)의 테두리 — 지우개로 깎은 가장자리·크레파스 들쭉날쭉까지 그대로 잰다
        guard let ink = alphaBox() else { return nil }
        let pad: CGFloat = 6
        let box = ink.insetBy(dx: -pad, dy: -pad).intersection(bounds)
        guard !box.isNull, box.width > 2, box.height > 2 else { return nil }
        let fmt = UIGraphicsImageRendererFormat()
        fmt.opaque = false
        fmt.scale = min(3, max(1, maxSide / max(box.width, box.height)))
        let img = UIGraphicsImageRenderer(size: box.size, format: fmt).image { ctx in
            ctx.cgContext.translateBy(x: -box.minX, y: -box.minY)
            renderAll(ctx.cgContext)
        }
        guard let data = img.pngData() else { return nil }
        let norm = CGRect(x: box.minX / bounds.width, y: box.minY / bounds.height,
                          width: box.width / bounds.width, height: box.height / bounds.height)
        return (data, norm)
    }

    /// 1배로 한 번 그려 보고 알파가 남은 칸의 테두리(보드 pt). 다 지웠으면 nil.
    private func alphaBox() -> CGRect? {
        let w = Int(ceil(bounds.width)), h = Int(ceil(bounds.height))
        guard w > 0, h > 0, let cs = CGColorSpace(name: CGColorSpace.sRGB),
              let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs,
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        ctx.translateBy(x: 0, y: CGFloat(h)); ctx.scaleBy(x: 1, y: -1)   // UIKit 좌표(위가 0) — 메모리 줄 번호 = y
        renderAll(ctx)
        guard let data = ctx.data else { return nil }
        let px = data.bindMemory(to: UInt8.self, capacity: w * h * 4)
        var minX = w, minY = h, maxX = -1, maxY = -1
        for y in 0 ..< h {
            let row = y * w * 4
            for x in 0 ..< w where px[row + x * 4 + 3] > 6 {
                if x < minX { minX = x }; if x > maxX { maxX = x }
                if y < minY { minY = y }; if y > maxY { maxY = y }
            }
        }
        guard maxX >= minX, maxY >= minY else { return nil }
        return CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
    }

    // ── 가변폭 획 — Catmull-Rom 스무딩 후 단일 외곽선 채움 ──
    // rough(크레파스 시드)가 있으면 굵기를 자리 잡음으로 흔들어 가장자리를 들쭉날쭉하게(자리로 정해져 다시 그려도 같다).
    private func drawStroke(_ raw: [InkPoint], color: UIColor, in ctx: CGContext, rough: Int? = nil) {
        var pts = smooth(raw)
        if let sd = rough {
            let f = max(bounds.width, 1) / 260
            pts = pts.map { InkPoint(location: $0.location, width: $0.width * (0.74 + 0.52 * InkGrain.posNoise($0.location.x / f, $0.location.y / f, sd))) }
        }
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
        ctx.fillPath()
        // 끝 동그라미는 따로 채운다 — 한 경로에 같이 넣으면 감기는 방향이 반대인 곳이 구멍(형광펜 끝 흰 반달)이 된다
        for cap in [first, pts[pts.count - 1]] {
            let r = cap.width / 2
            ctx.fillEllipse(in: CGRect(x: cap.location.x - r, y: cap.location.y - r, width: cap.width, height: cap.width))
        }
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

// 연결 보완(제미나이 시안 3차가 쓰는 이름표)
extension DiaryEraserMode: CaseIterable {
    static var allCases: [DiaryEraserMode] { [.partial, .whole] }
    var label: String { self == .partial ? "부분" : "획 전체" }
}

// 연결 보완(제미나이 시안 5차가 쓰는 이름 — 지우개도 도구 단추 하나로 보여 준다)
extension DiaryInkTools {
    enum BrushType: Equatable {
        case pen, pencil, crayon, highlighter, eraser
        var displayName: String {
            switch self { case .pen: return "펜"; case .pencil: return "연필"; case .crayon: return "크레파스"; case .highlighter: return "형광펜"; case .eraser: return "지우개" }
        }
    }
    /// 지우개를 켜면 .eraser, 아니면 지금 붓. 붓을 고르면 지우개는 꺼진다.
    var selectedBrush: BrushType {
        get {
            if erasing { return .eraser }
            switch brush { case .pen: return .pen; case .pencil: return .pencil; case .crayon: return .crayon; case .highlighter: return .highlighter }
        }
        set {
            switch newValue {
            case .eraser: erasing = true
            case .pen: brush = .pen; erasing = false
            case .pencil: brush = .pencil; erasing = false
            case .crayon: brush = .crayon; erasing = false
            case .highlighter: brush = .highlighter; erasing = false
            }
        }
    }
    var selectedColorIndex: Int { get { colorIndex } set { colorIndex = newValue } }
    var selectedThicknessIndex: Int { get { currentSizeIndex } set { sizeIndex[brush] = newValue } }
}
