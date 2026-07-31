import SwiftUI

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
    @State private var zoom: CGFloat = 1.0
    @State private var lastZoom: CGFloat = 1.0
    @State private var panOffset: CGSize = .zero
    @State private var lastPan: CGSize = .zero
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
        .alert("이 페이지를 전부 지울까?", isPresented: $showClearConfirm) {
            Button("취소", role: .cancel) {}
            Button("지우기", role: .destructive) { controller.clear() }
        } message: { Text("이 페이지의 낙서가 둘 다에게서 사라져요.") }
        .alert("이 페이지를 삭제할까?", isPresented: $showDeletePageConfirm) {
            Button("취소", role: .cancel) {}
            Button("삭제", role: .destructive) { controller.deleteCurrentPage() }
        } message: { Text("페이지와 그 안의 낙서가 영구히 사라져요. 되돌릴 수 없어요.") }
        .sheet(isPresented: $showComments) { CommentSheet(controller: controller, myName: myName) }
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
            InkCanvasRepresentable(controller: controller, me: me)
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: warmShadow.opacity(0.12), radius: 16, y: 8)
        .scaleEffect(zoom)
        .offset(panOffset)
        .gesture(
            MagnificationGesture()  // 두 손가락 핀치 확대 (한 손가락/펜슬 그리기와 충돌 안 함)
                .onChanged { v in zoom = min(4, max(1, lastZoom * v)) }
                .onEnded { _ in
                    lastZoom = zoom
                    panOffset = clampPan(panOffset, width, height); lastPan = panOffset
                }
        )
        .onTapGesture(count: 2) { resetZoom() }
    }

    // 확대·이동 리셋 (더블탭)
    private func resetZoom() {
        withAnimation(.easeOut(duration: 0.2)) {
            zoom = 1; lastZoom = 1; panOffset = .zero; lastPan = .zero; controller.panMode = false
        }
    }

    // 확대 배율에 맞춰 이동 범위 제한 (빈 여백으로 못 나가게)
    private func clampPan(_ o: CGSize, _ w: CGFloat, _ h: CGFloat) -> CGSize {
        let mx = max(0, (zoom - 1) * w / 2)
        let my = max(0, (zoom - 1) * h / 2)
        return CGSize(width: min(mx, max(-mx, o.width)), height: min(my, max(-my, o.height)))
    }

    // 손바닥 모드 투명 캐처 — 드래그로 이동, 핀치로 확대, 더블탭 리셋. 그리기는 아래 InkCanvas가 못 받음.
    private func panCatcher(width w: CGFloat, height h: CGFloat) -> some View {
        Color.clear
            .frame(width: w, height: h)
            .contentShape(Rectangle())
            .gesture(
                DragGesture()
                    .onChanged { v in
                        panOffset = clampPan(CGSize(width: lastPan.width + v.translation.width,
                                                    height: lastPan.height + v.translation.height), w, h)
                    }
                    .onEnded { _ in lastPan = panOffset }
            )
            .simultaneousGesture(
                MagnificationGesture()
                    .onChanged { v in zoom = min(4, max(1, lastZoom * v)) }
                    .onEnded { _ in lastZoom = zoom; panOffset = clampPan(panOffset, w, h); lastPan = panOffset }
            )
            .onTapGesture(count: 2) { resetZoom() }
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
                VStack { Spacer(); reactionBar; panButton }.padding(.leading, 16).padding(.bottom, 26)
                Spacer()
                VStack(spacing: 12) {
                    Spacer()
                    if passageImage != nil { opacitySlider }
                    CanvasToolbar(controller: controller, axis: .vertical, onClear: { showClearConfirm = true })
                    Spacer()
                }.padding(.trailing, 16)
            }
        } else {
            VStack(spacing: 10) {
                Spacer()
                // 하트·댓글(좌) + 손바닥 이동(우) — 툴바 '위'라 색상 안 가림
                HStack { reactionBar; Spacer(); panButton }.padding(.horizontal, 8)
                if passageImage != nil { opacitySlider }
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
    private let sizes: [CGFloat] = [4, 7, 13]

    var body: some View {
        let vertical = axis == .vertical
        Group {
            if vertical { VStack(spacing: 12) { items } }
            else { HStack(spacing: 7) { items } }
        }
        .foregroundStyle(Color(red: 0.39, green: 0.45, blue: 0.55))
        .padding(.horizontal, vertical ? 12 : 13).padding(.vertical, vertical ? 18 : 12)
        .background(.ultraThinMaterial).clipShape(Capsule())
        .overlay(Capsule().stroke(Color.black.opacity(0.05), lineWidth: 1))
        .shadow(color: warmShadow.opacity(0.14), radius: 12, y: 8)
    }

    @ViewBuilder private var items: some View {
        ForEach(0 ..< CanvasController.palette.count, id: \.self) { i in
            Button { controller.colorIndex = i; controller.eraser = false } label: {
                Circle().fill(Color(CanvasController.palette[i])).frame(width: 28, height: 28)
                    .overlay(Circle().stroke(Color.primary.opacity(controller.colorIndex == i && !controller.eraser ? 0.55 : 0), lineWidth: 2).padding(-3))
            }
        }
        divider
        ForEach(sizes, id: \.self) { w in
            Button { controller.lineWidth = w; controller.eraser = false } label: {
                Circle().fill(inkColor).frame(width: w + 3, height: w + 3).frame(width: 30, height: 30)
                    .background(Circle().fill(Color.gray.opacity(controller.lineWidth == w && !controller.eraser ? 0.18 : 0)))
            }
        }
        divider
        Button { controller.eraser.toggle() } label: {
            Image(systemName: "eraser").font(.system(size: 16, weight: .medium))
                .foregroundStyle(controller.eraser ? .white : Color(red: 0.39, green: 0.45, blue: 0.55))
                .frame(width: 30, height: 30).background(Circle().fill(controller.eraser ? inkColor : Color.clear))
        }
        Button { controller.undo() } label: { Image(systemName: "arrow.uturn.backward").font(.system(size: 17, weight: .medium)) }
        Button { onClear() } label: { Image(systemName: "trash").font(.system(size: 16, weight: .medium)) }
        divider
        Button { controller.pencilOnly.toggle() } label: {
            Image(systemName: controller.pencilOnly ? "pencil.tip" : "hand.draw").font(.system(size: 16, weight: .medium))
        }
    }

    private var divider: some View {
        Rectangle().fill(Color.black.opacity(0.06))
            .frame(width: axis == .vertical ? 22 : 1, height: axis == .vertical ? 1 : 22)
    }
}

// 댓글 시트
struct CommentSheet: View {
    @ObservedObject var controller: CanvasController
    let myName: String
    @Environment(\.dismiss) private var dismiss
    @State private var draft = ""

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("댓글 \(controller.comments.count)").font(.system(size: 16, weight: .bold))
                Spacer()
                Button("닫기") { dismiss() }
            }
            .padding(.horizontal, 16).padding(.top, 16).padding(.bottom, 8)

            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if controller.comments.isEmpty {
                        Text("첫 댓글을 남겨봐 💬").font(.system(size: 14)).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity).padding(.top, 30)
                    }
                    ForEach(controller.comments) { c in
                        HStack(alignment: .top, spacing: 6) {
                            Text(c.by).font(.system(size: 12, weight: .heavy)).foregroundStyle(c.by == "꼼이" ? rose : blue)
                            Text(c.text).font(.system(size: 14)).foregroundStyle(inkColor)
                            Spacer(minLength: 0)
                            if c.by == myName {
                                Button { controller.deleteComment(c.id) } label: {
                                    Image(systemName: "xmark").font(.system(size: 11)).foregroundStyle(.tertiary)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
            }

            Divider()
            HStack(spacing: 8) {
                TextField("댓글 달기…", text: $draft, axis: .vertical).textFieldStyle(.roundedBorder).lineLimit(1 ... 3)
                Button {
                    let t = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !t.isEmpty { controller.addComment(t); draft = "" }
                } label: { Image(systemName: "paperplane.fill").font(.system(size: 18)) }
                .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(.horizontal, 16).padding(.vertical, 10)
        }
        .presentationDetents([.medium, .large])
    }
}
