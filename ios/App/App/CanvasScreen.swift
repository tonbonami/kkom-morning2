import SwiftUI
import PhotosUI

// 네이티브 낙서장 화면. me는 꼼모닝 로그인에서 전달. 데이터·페이지·지문 전부 웹과 공유(RTDB).
private let cream = Color(red: 1.0, green: 0.988, blue: 0.961)
private let rose = Color(red: 0.98, green: 0.48, blue: 0.66)
private let blue = Color(red: 0.49, green: 0.83, blue: 0.99)
private let inkColor = Color(red: 0.20, green: 0.25, blue: 0.33)
private let warmShadow = Color(red: 0.47, green: 0.39, blue: 0.31)

struct CanvasScreen: View {
    let me: String
    let onClose: () -> Void
    @StateObject private var controller = CanvasController()
    @Environment(\.horizontalSizeClass) private var hSize

    @State private var passageImage: UIImage?
    @State private var opacity: Double = 0.5
    @State private var showClearConfirm = false
    @State private var showDeletePageConfirm = false
    @State private var showComments = false
    @State private var showRemovePassageConfirm = false
    @State private var panDragBase: CGSize? = nil
    @State private var pinchBaseZoom: CGFloat? = nil
    // 대고 그리기 — 내 폰에만 까는 밑그림 사진. 상대에겐 안 보이고 어디에도 저장 안 됨.
    // 위치는 보드 좌표라 확대·이동해도 획과 같이 움직인다(잠그면 사진만 따로 안 움직임).
    @State private var tracePhoto: UIImage?
    @State private var traceOpacity: Double = 0.45
    @State private var traceLocked = false
    @State private var traceOffset: CGSize = .zero
    @State private var traceScale: CGFloat = 1
    @State private var showTracePicker = false
    @State private var tracePickItem: PhotosPickerItem?
    @State private var traceDragBase: CGSize? = nil
    @State private var tracePinchBase: CGFloat? = nil
    private var traceAdjusting: Bool { tracePhoto != nil && !traceLocked }
    private var myName: String { me == "udaeng" ? "우댕" : "꼼이" }
    private var iLiked: Bool { controller.likedBy.contains(myName) }

    private var isPad: Bool { hSize == .regular }
    private var partnerName: String { me == "udaeng" ? "꼼이" : "우댕" }
    private var partnerColor: Color { me == "udaeng" ? rose : blue }
    private var myColor: Color { me == "udaeng" ? blue : rose }

    var body: some View {
        GeometryReader { geo in
            let pad: CGFloat = isPad ? 40 : 12
            let aspect: CGFloat = 3.0 / 4.0
            let bw = min(geo.size.width - pad * 2, (geo.size.height - pad * 2) * aspect)
            let bh = bw / aspect

            ZStack {
                cream.ignoresSafeArea()
                board(width: bw, height: bh)
                    .frame(width: bw, height: bh)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                // 손바닥(이동) 모드에서만 뜨는 투명 캐처 — 드래그=이동, 핀치=확대, 그리기 차단
                if controller.panMode { panCatcher(width: bw, height: bh) }
                // 대고 그리기 위치 맞추는 중 — 밀기=사진 이동, 핀치=사진 크기, 그리기 차단
                if traceAdjusting { traceAdjustCatcher }

                VStack {
                    // 상단: 닫기 + 페이지 넘기기 + presence + 나 배지
                    HStack(alignment: .center, spacing: 8) {
                        Button(action: onClose) {
                            Image(systemName: "xmark").font(.system(size: 15, weight: .bold))
                                .foregroundStyle(inkColor).frame(width: 34, height: 34)
                                .background(.ultraThinMaterial).clipShape(Circle())
                        }
                        pageNav
                        if controller.partnerActive { presenceTag }
                        Spacer()
                        meBadge
                    }
                    .padding(.horizontal, 16).padding(.top, 6)
                    Spacer()
                }
                toolbarLayer
            }
        }
        .onChange(of: controller.passageUrl) { url in loadPassage(url) }
        .onAppear { loadPassage(controller.passageUrl) }
        .photosPicker(isPresented: $showTracePicker, selection: $tracePickItem, matching: .images)
        .onChange(of: tracePickItem) { item in loadTracePhoto(item) }
        .alert("이 페이지를 전부 지울까?", isPresented: $showClearConfirm) {
            Button("취소", role: .cancel) {}
            Button("지우기", role: .destructive) { controller.clear() }
        } message: { Text("이 페이지의 낙서가 둘 다에게서 사라져요.") }
        .alert("이 페이지를 삭제할까?", isPresented: $showDeletePageConfirm) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) { controller.deleteCurrentPage() }
        } message: { Text("페이지와 그 안의 낙서가 영구히 사라져요. 되돌릴 수 없어요.") }
        .alert("배경 사진을 뺄까?", isPresented: $showRemovePassageConfirm) {
            Button("취소", role: .cancel) {}
            Button("빼기", role: .destructive) { controller.clearPassage() }
        } message: { Text("\(partnerName) 화면에서도 빠져요. 그린 선은 그대로 남아요.") }
        .sheet(isPresented: $showComments) { CommentSheet(controller: controller, myName: myName) }
        // 낙서장은 흰 종이·크림 배경의 라이트 디자인이라 다크모드를 강제로 끈다.
        // (안 그러면 다크모드에서 시스템 시트·머티리얼이 어두워져 잉크색 글씨가 안 보임 = 댓글 투명글씨 버그)
        .preferredColorScheme(.light)
    }

    // 하트 + 댓글 버튼 (좌하단 알약)
    private var reactionBar: some View {
        HStack(spacing: 14) {
            Button { controller.toggleLike(!iLiked) } label: {
                HStack(spacing: 4) {
                    Image(systemName: iLiked ? "heart.fill" : "heart").foregroundStyle(iLiked ? rose : Color.secondary)
                    if !controller.likedBy.isEmpty { Text("\(controller.likedBy.count)").font(.system(size: 13, weight: .bold)).foregroundStyle(inkColor) }
                }
            }
            Button { showComments = true } label: {
                HStack(spacing: 4) {
                    Image(systemName: "bubble.left").foregroundStyle(Color.secondary)
                    if !controller.comments.isEmpty { Text("\(controller.comments.count)").font(.system(size: 13, weight: .bold)).foregroundStyle(inkColor) }
                }
            }
        }
        .font(.system(size: 20, weight: .medium))
        .padding(.horizontal, 14).padding(.vertical, 8)
        .background(.ultraThinMaterial).clipShape(Capsule())
        .shadow(color: warmShadow.opacity(0.14), radius: 10, y: 6)
    }

    // 페이지 넘기기 ‹ n/N › + 새 페이지 (공유 — 상대도 같이 이동)
    private var pageNav: some View {
        let idx = controller.pageIndex
        let total = max(controller.pages.count, 1)
        return HStack(spacing: 2) {
            Button { controller.goPrev() } label: {
                Image(systemName: "chevron.left").font(.system(size: 13, weight: .bold))
                    .foregroundStyle(idx <= 0 ? Color.secondary.opacity(0.35) : inkColor)
                    .frame(width: 26, height: 30)
            }.disabled(idx <= 0)
            Text("\(idx + 1)/\(total)")
                .font(.system(size: 13, weight: .heavy)).monospacedDigit()
                .foregroundStyle(inkColor).frame(minWidth: 34)
            Button { controller.goNext() } label: {
                Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold))
                    .foregroundStyle(idx >= total - 1 ? Color.secondary.opacity(0.35) : inkColor)
                    .frame(width: 26, height: 30)
            }.disabled(idx >= total - 1)
            Button { controller.newPage() } label: {
                HStack(spacing: 4) {
                    Image(systemName: "doc.badge.plus").font(.system(size: 12, weight: .bold))
                    Text("새 페이지").font(.system(size: 12, weight: .bold))
                }
                .foregroundStyle(.white).padding(.horizontal, 10).frame(height: 30)
                .background(inkColor).clipShape(Capsule())
            }
            if controller.canDeletePage {
                Button { showDeletePageConfirm = true } label: {
                    Image(systemName: "trash").font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(red: 0.87, green: 0.35, blue: 0.47))
                        .frame(width: 30, height: 30)
                }
            }
        }
        .padding(.horizontal, 6).frame(height: 34)
        .background(.ultraThinMaterial).clipShape(Capsule())
    }

    private func board(width: CGFloat, height: CGFloat) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16).fill(Color.white)
            CanvasDotGrid()
            if let img = passageImage {
                Image(uiImage: img).resizable().scaledToFit().opacity(opacity).allowsHitTesting(false)
            }
            if let tp = tracePhoto {
                Image(uiImage: tp).resizable().scaledToFit()
                    .scaleEffect(traceScale).offset(traceOffset)
                    .opacity(traceOpacity).allowsHitTesting(false)
            }
            InkCanvasRepresentable(controller: controller, me: me)
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: warmShadow.opacity(0.12), radius: 16, y: 8)
        .scaleEffect(controller.zoom)
        .offset(controller.panOffset)
        .onTapGesture(count: 2) { withAnimation(.easeOut(duration: 0.2)) { controller.resetView() } }
    }

    // 손바닥(이동) 모드 캐처 (손버튼) — 폰용/보조. 드래그=이동, 핀치=확대. iPad는 손가락 제스처가 알아서 처리.
    private func panCatcher(width w: CGFloat, height h: CGFloat) -> some View {
        Color.clear
            .frame(width: w, height: h)
            .contentShape(Rectangle())
            .gesture(
                DragGesture()
                    .onChanged { v in
                        if panDragBase == nil { panDragBase = controller.panOffset }
                        controller.nudgePan(CGSize(width: v.translation.width, height: v.translation.height), base: panDragBase ?? .zero)
                    }
                    .onEnded { _ in panDragBase = nil }
            )
            .simultaneousGesture(
                MagnificationGesture()
                    .onChanged { v in
                        if pinchBaseZoom == nil { pinchBaseZoom = controller.zoom }
                        controller.setZoom((pinchBaseZoom ?? 1) * v)
                    }
                    .onEnded { _ in pinchBaseZoom = nil }
            )
            .onTapGesture(count: 2) { withAnimation(.easeOut(duration: 0.2)) { controller.resetView() } }
    }

    private var presenceTag: some View {
        HStack(spacing: 5) {
            Circle().fill(partnerColor).frame(width: 8, height: 8)
            Text("\(partnerName)가 끄적이는 중 ✍️").font(.system(size: 12, weight: .bold))
        }
        .foregroundStyle(inkColor).padding(.horizontal, 12).padding(.vertical, 6)
        .background(.ultraThinMaterial).clipShape(Capsule()).rotationEffect(.degrees(-2))
    }

    private var meBadge: some View {
        Text(me == "udaeng" ? "나: 우댕" : "나: 꼼이")
            .font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(myColor).clipShape(Capsule())
    }

    @ViewBuilder private var toolbarLayer: some View {
        if isPad {
            HStack {
                VStack { Spacer(); reactionBar; traceButton; panButton }.padding(.leading, 16).padding(.bottom, 26)
                Spacer()
                VStack(spacing: 12) {
                    Spacer()
                    if tracePhoto != nil { if traceLocked { traceBar } else { traceAdjustPanel } }
                    if passageImage != nil { passageBar }
                    CanvasToolbar(controller: controller, axis: .vertical, onClear: { showClearConfirm = true })
                    Spacer()
                }.padding(.trailing, 16)
            }
        } else {
            VStack(spacing: 10) {
                Spacer()
                // 하트·댓글(좌) + 손바닥 이동(우) — 툴바 '위'라 색상 안 가림
                if traceAdjusting { traceAdjustPanel }
                HStack { reactionBar; Spacer(); traceButton; panButton }.padding(.horizontal, 8)
                if passageImage != nil { passageBar }
                if tracePhoto != nil && traceLocked { traceBar }
                CanvasToolbar(controller: controller, axis: .horizontal, onClear: { showClearConfirm = true }).padding(.bottom, 18)
            }
        }
    }

    // 손바닥(이동) 모드 토글 — 켜면 밀어서 이동/핀치 확대, 그리기 잠금
    private var panButton: some View {
        Button { controller.panMode.toggle() } label: {
            Image(systemName: controller.panMode ? "hand.raised.fill" : "hand.raised")
                .font(.system(size: 17, weight: .medium))
                .foregroundStyle(controller.panMode ? .white : inkColor)
                .frame(width: 42, height: 42)
                .background {
                    if controller.panMode { Circle().fill(inkColor) }
                    else { Circle().fill(.ultraThinMaterial) }
                }
                .shadow(color: warmShadow.opacity(0.14), radius: 8, y: 4)
        }
    }

    // ── 대고 그리기 ──
    // 사진 버튼: 없으면 앨범 열기, 있으면 메뉴(위치 다시 맞추기·다른 사진·빼기)
    @ViewBuilder private var traceButton: some View {
        if tracePhoto == nil {
            Button { showTracePicker = true } label: { TraceButtonLabel(active: false) }
        } else {
            Menu {
                Button { traceLocked = false; controller.panMode = false } label: {
                    Label("위치 다시 맞추기", systemImage: "arrow.up.and.down.and.arrow.left.and.right")
                }
                Button { showTracePicker = true } label: { Label("다른 사진으로", systemImage: "photo.on.rectangle") }
                Button(role: .destructive) { removeTrace() } label: { Label("사진 빼기", systemImage: "xmark.circle") }
            } label: { TraceButtonLabel(active: true) }
        }
    }

    // 위치 맞추는 중에만 깔리는 전체 화면 캐처 (툴바·상단바는 위에 있어 그대로 눌림)
    private var traceAdjustCatcher: some View {
        Color.clear
            .contentShape(Rectangle())
            .ignoresSafeArea()
            .gesture(
                DragGesture()
                    .onChanged { v in
                        if traceDragBase == nil { traceDragBase = traceOffset }
                        let z = max(controller.zoom, 0.01), b = traceDragBase ?? .zero
                        traceOffset = CGSize(width: b.width + v.translation.width / z, height: b.height + v.translation.height / z)
                    }
                    .onEnded { _ in traceDragBase = nil }
            )
            .simultaneousGesture(
                MagnificationGesture()
                    .onChanged { v in
                        if tracePinchBase == nil { tracePinchBase = traceScale }
                        traceScale = min(6, max(0.2, (tracePinchBase ?? 1) * v))
                    }
                    .onEnded { _ in tracePinchBase = nil }
            )
    }

    // 위치 맞추기 패널 / 잠근 뒤 막대 — 겉모습은 CanvasUI.swift(제미나이 시안)
    private var traceAdjustPanel: some View {
        TraceAdjustPanel(opacity: $traceOpacity, onCancel: removeTrace, onLock: { traceLocked = true })
    }
    // 잠근 뒤엔 「사진 빼기」를 막대 옆에 바로 보이게 (사진 버튼 메뉴 안에만 있으면 못 찾음 — 우댕)
    private var traceBar: some View {
        HStack(spacing: 8) {
            TraceBar(opacity: $traceOpacity, onUnlock: { traceLocked = false; controller.panMode = false })
            removePhotoChip { removeTrace() }
        }
    }

    // 「✕ 사진 빼기」 알약 — 대고 그리기 사진·공유 지문 둘 다 같은 모양
    private func removePhotoChip(_ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: "xmark")
                Text("사진 빼기")
            }
            .font(.system(size: 14, weight: .bold))
            .foregroundColor(.themeInk)
            .padding(.horizontal, 14)
            .frame(height: 44)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .shadow(color: .themeShadow, radius: 10, x: 0, y: 6)
        }
    }

    // 웹 「지문」(둘이 같이 보는 배경 사진) — 진하기 + 빼기 (앱엔 빼기가 없었음, 우댕)
    private var passageBar: some View {
        HStack(spacing: 8) {
            opacitySlider
            removePhotoChip { showRemovePassageConfirm = true }
        }
    }

    private func loadTracePhoto(_ item: PhotosPickerItem?) {
        guard let item = item else { return }
        item.loadTransferable(type: Data.self) { result in
            guard case .success(let data?) = result, let img = UIImage(data: data) else { return }
            let small = traceDownscaled(img)
            DispatchQueue.main.async {
                tracePhoto = small; traceOffset = .zero; traceScale = 1
                traceLocked = false; controller.panMode = false
                tracePickItem = nil
            }
        }
    }

    private func removeTrace() {
        tracePhoto = nil; traceLocked = false; traceOffset = .zero; traceScale = 1
    }

    private var opacitySlider: some View {
        HStack(spacing: 8) {
            Image(systemName: "sun.max").font(.system(size: 13)).foregroundStyle(.secondary)
            Slider(value: $opacity, in: 0 ... 1).frame(width: 150)
            Image(systemName: "sun.max.fill").font(.system(size: 13)).foregroundStyle(.secondary)
        }
        .padding(.horizontal, 14).padding(.vertical, 8)
        .background(.ultraThinMaterial).clipShape(Capsule())
        .overlay(Capsule().stroke(Color.black.opacity(0.05), lineWidth: 1))
    }

    private func loadPassage(_ url: String?) {
        guard let url = url, let u = URL(string: url) else { passageImage = nil; return }
        URLSession.shared.dataTask(with: u) { data, _, _ in
            guard let data = data, let img = UIImage(data: data) else { return }
            DispatchQueue.main.async { self.passageImage = img }
        }.resume()
    }
}

// 큰 사진은 긴 변 2048px로 줄여서 메모리 아낌 (방향 정보는 draw가 반영)
private func traceDownscaled(_ img: UIImage, maxSide: CGFloat = 2048) -> UIImage {
    let side = max(img.size.width, img.size.height)
    guard side > maxSide else { return img }
    let r = maxSide / side
    let size = CGSize(width: img.size.width * r, height: img.size.height * r)
    let fmt = UIGraphicsImageRendererFormat.default(); fmt.scale = 1
    return UIGraphicsImageRenderer(size: size, format: fmt).image { _ in img.draw(in: CGRect(origin: .zero, size: size)) }
}

struct CanvasDotGrid: View {
    var body: some View {
        Canvas { ctx, size in
            let gap: CGFloat = 24, dot: CGFloat = 1.6
            let color = Color(red: 0.886, green: 0.91, blue: 0.941).opacity(0.6)
            var y: CGFloat = gap
            while y < size.height {
                var x: CGFloat = gap
                while x < size.width {
                    ctx.fill(Path(ellipseIn: CGRect(x: x, y: y, width: dot, height: dot)), with: .color(color))
                    x += gap
                }
                y += gap
            }
        }
    }
}

struct CanvasToolbar: View {
    @ObservedObject var controller: CanvasController
    let axis: Axis
    var onClear: () -> Void = {}

    // 색상 팝오버 상태
    @State private var showColors = false

    // 디자인 토큰 컬러
    let cInk = Color(UIColor(red: 51/255, green: 65/255, blue: 85/255, alpha: 1))  // #334155
    let cRose = Color(UIColor(red: 251/255, green: 123/255, blue: 168/255, alpha: 1)) // #FB7BA8
    let cCream = Color(UIColor(red: 251/255, green: 248/255, blue: 242/255, alpha: 1)) // #FBF8F2

    var body: some View {
        Group {
            if axis == .horizontal {
                HStack(spacing: 16) { toolbarContent }
            } else {
                VStack(spacing: 16) { toolbarContent }
            }
        }
        .padding(.horizontal, axis == .horizontal ? 20 : 12)
        .padding(.vertical, axis == .vertical ? 20 : 12)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .shadow(color: Color.black.opacity(0.08), radius: 10, x: 0, y: 4)
        )
    }

    @ViewBuilder
    private var toolbarContent: some View {
        // 1. 현재 색상 스와치 (탭 시 팔레트 팝오버)
        Button(action: {
            controller.eraser = false
            showColors.toggle()
        }) {
            Circle()
                .fill(Color(CanvasController.palette[controller.colorIndex]))
                .frame(width: 28, height: 28)
                .overlay(Circle().stroke(Color.white.opacity(0.8), lineWidth: 2))
                .shadow(color: Color.black.opacity(0.1), radius: 2)
        }
        .popover(isPresented: $showColors) {
            if #available(iOS 16.4, *) {
                colorPaletteView.presentationCompactAdaptation(.popover)
            } else {
                colorPaletteView
            }
        }

        // 2. 펜 / 지우개 토글
        Button(action: { controller.eraser.toggle() }) {
            Image(systemName: controller.eraser ? "eraser.fill" : "paintbrush.pointed.fill")
                .font(.system(size: 20))
                .foregroundColor(controller.eraser ? cRose : cInk)
                .frame(width: 32, height: 32)
        }

        // 3. 선 굵기 사이클 버튼 (미니 프리뷰)
        Button(action: cycleWidth) {
            ZStack {
                Circle().stroke(cInk.opacity(0.15), lineWidth: 1).frame(width: 32, height: 32)
                Circle().fill(cInk).frame(width: controller.lineWidth * 1.5, height: controller.lineWidth * 1.5)
            }
        }

        // 4. 되돌리기 (Undo)
        Button(action: { controller.undo() }) {
            Image(systemName: "arrow.uturn.backward")
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(cInk)
                .frame(width: 32, height: 32)
        }

        // 5. 오버플로우 메뉴 (펜슬 전용 토글, 전체 지우기)
        Menu {
            Toggle(isOn: $controller.pencilOnly) {
                Label("애플펜슬만 사용", systemImage: controller.pencilOnly ? "pencil.and.outline" : "hand.draw")
            }
            Button(role: .destructive, action: onClear) {
                Label("전체 지우기", systemImage: "trash")
            }
        } label: {
            Image(systemName: "ellipsis.circle")
                .font(.system(size: 20))
                .foregroundColor(cInk.opacity(0.5))
                .frame(width: 32, height: 32)
        }
    }

    private func cycleWidth() {
        if controller.lineWidth == 4 { controller.lineWidth = 7 }
        else if controller.lineWidth == 7 { controller.lineWidth = 13 }
        else { controller.lineWidth = 4 }
    }

    private var colorPaletteView: some View {
        let columns = Array(repeating: GridItem(.fixed(36), spacing: 14), count: 5)
        return LazyVGrid(columns: columns, spacing: 14) {
            ForEach(0..<10, id: \.self) { i in
                Button(action: {
                    controller.colorIndex = i
                    controller.eraser = false
                    showColors = false
                }) {
                    Circle()
                        .fill(Color(CanvasController.palette[i]))
                        .frame(width: 36, height: 36)
                        .overlay(Circle().stroke(Color.white, lineWidth: controller.colorIndex == i && !controller.eraser ? 3 : 0))
                        .shadow(color: Color.black.opacity(0.1), radius: 2)
                }
            }
        }
        .padding(20)
        .background(cCream.ignoresSafeArea())
    }
}

// 댓글 시트 — 겉모습은 CanvasUI.swift의 CanvasCommentSheet(제미나이 시안), 여기선 데이터만 연결
struct CommentSheet: View {
    @ObservedObject var controller: CanvasController
    let myName: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        CanvasCommentSheet(
            comments: controller.comments,
            myName: myName,
            onSend: { controller.addComment($0) },
            onDelete: { controller.deleteComment($0) },
            onClose: { dismiss() }
        )
        .presentationDetents([.medium, .large])
        // 시트는 프레젠터의 컬러스킴을 항상 물려받진 않으므로 여기서도 라이트로 못박는다.
        .preferredColorScheme(.light)
    }
}
