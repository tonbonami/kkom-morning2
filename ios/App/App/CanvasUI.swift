import SwiftUI

// 제미나이 시안 (2026-10-20, 우댕 전달) — 낙서장 댓글창 + 대고 그리기 조작부. 값 그대로.

// MARK: - 공통 디자인 요소 (Theme)
extension Color {
    static let themeCream = Color(red: 1.0, green: 0.988, blue: 0.961)
    static let themeInk = Color(red: 0.20, green: 0.25, blue: 0.33)
    static let kkomi = Color(red: 0.98, green: 0.48, blue: 0.66)
    static let udaeng = Color(red: 0.49, green: 0.83, blue: 0.99)
    static let themeShadow = Color(red: 0.47, green: 0.39, blue: 0.31).opacity(0.14)

    static func userColor(for name: String) -> Color {
        if name.contains("꼼이") { return .kkomi }
        if name.contains("우댕") { return .udaeng }
        return .gray
    }
}

// MARK: - 1. CanvasCommentSheet (그림 댓글창)
struct CanvasCommentItem: Identifiable, Equatable {
    let id: String
    let by: String
    let text: String
    let at: Date?
}

struct CanvasCommentSheet: View {
    let comments: [CanvasCommentItem]
    let myName: String
    let onSend: (String) -> Void
    let onDelete: (String) -> Void
    let onClose: () -> Void

    @State private var inputText: String = ""

    var body: some View {
        VStack(spacing: 0) {
            // 헤더 영역
            HStack {
                HStack(spacing: 6) {
                    Text("댓글")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.themeInk)

                    Text("\(comments.count)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.themeInk.opacity(0.6))
                        .clipShape(Capsule())
                }

                Spacer()

                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(Color.themeInk.opacity(0.3))
                }
            }
            .padding(20)
            .background(Color.themeCream)

            // 댓글 목록 영역
            ScrollViewReader { proxy in
                ScrollView {
                    if comments.isEmpty {
                        VStack(spacing: 12) {
                            Spacer().frame(height: 60)
                            Image(systemName: "bubble.left.and.bubble.right.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.themeInk.opacity(0.2))
                            Text("아직 댓글이 없어요")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.themeInk)
                            Text("그림에 다정한 한마디 남겨 볼까?")
                                .font(.system(size: 16))
                                .foregroundColor(.themeInk.opacity(0.6))
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        LazyVStack(spacing: 16) {
                            ForEach(comments) { comment in
                                CommentRow(comment: comment, isMe: comment.by == myName, onDelete: onDelete)
                                    .id(comment.id)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 10)
                        .padding(.bottom, 20)
                    }
                }
                .background(Color.themeCream)
                .onChange(of: comments.count) { _ in // iOS 16 호환
                    scrollToBottom(proxy: proxy)
                }
                .onAppear {
                    scrollToBottom(proxy: proxy)
                }
            }

            // 입력창 영역
            VStack {
                HStack(alignment: .bottom, spacing: 12) {
                    TextField("댓글 달기...", text: $inputText, axis: .vertical)
                        .font(.system(size: 16))
                        .foregroundColor(.themeInk)
                        .lineLimit(1...4)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.themeInk.opacity(0.1), lineWidth: 1)
                        )

                    Button(action: {
                        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !trimmed.isEmpty {
                            onSend(trimmed)
                            inputText = ""
                        }
                    }) {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(
                                inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?
                                Color.themeInk.opacity(0.2) : Color.userColor(for: myName)
                            )
                            .clipShape(Circle())
                    }
                    .disabled(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .background(Color.themeCream.ignoresSafeArea(.all, edges: .bottom))
            .shadow(color: .themeShadow, radius: 8, x: 0, y: -4)
        }
        .background(Color.themeCream.ignoresSafeArea())
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        if let lastId = comments.last?.id {
            withAnimation {
                proxy.scrollTo(lastId, anchor: .bottom)
            }
        }
    }
}

// 댓글 한 줄 UI
struct CommentRow: View {
    let comment: CanvasCommentItem
    let isMe: Bool
    let onDelete: (String) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if !isMe { avatarView }

            VStack(alignment: isMe ? .trailing : .leading, spacing: 4) {
                HStack(alignment: .bottom, spacing: 6) {
                    if isMe {
                        timeView
                        nameView
                    } else {
                        nameView
                        timeView
                    }
                }

                Text(comment.text)
                    .font(.system(size: 16))
                    .foregroundColor(.themeInk)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isMe ? Color.userColor(for: comment.by).opacity(0.15) : Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.themeInk.opacity(0.05), lineWidth: 1)
                    )
            }

            if isMe { avatarView }
        }
        .frame(maxWidth: .infinity, alignment: isMe ? .trailing : .leading)
        .contextMenu {
            if isMe {
                Button(role: .destructive) {
                    onDelete(comment.id)
                } label: {
                    Label("삭제", systemImage: "trash")
                }
            }
        }
    }

    private var avatarView: some View {
        Text(String(comment.by.prefix(1)))
            .font(.system(size: 14, weight: .bold))
            .foregroundColor(.white)
            .frame(width: 32, height: 32)
            .background(Color.userColor(for: comment.by))
            .clipShape(Circle())
    }

    private var nameView: some View {
        Text(comment.by)
            .font(.system(size: 14, weight: .bold))
            .foregroundColor(.themeInk.opacity(0.8))
    }

    @ViewBuilder
    private var timeView: some View {
        if let date = comment.at {
            Text(relativeTime(date))
                .font(.system(size: 12))
                .foregroundColor(.themeInk.opacity(0.5))
        }
    }

    // 시간 표시 로직 (iOS 16 지원)
    private func relativeTime(_ date: Date) -> String {
        let calendar = Calendar.current
        let now = Date()

        if calendar.isDateInToday(date) {
            let components = calendar.dateComponents([.minute, .hour], from: date, to: now)
            if let hour = components.hour, hour > 0 {
                let formatter = DateFormatter()
                formatter.dateFormat = "a h:mm"
                formatter.locale = Locale(identifier: "ko_KR")
                return formatter.string(from: date)
            } else if let minute = components.minute, minute > 0 {
                return "\(minute)분 전"
            } else {
                return "방금"
            }
        } else if calendar.isDateInYesterday(date) {
            return "어제"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "M월 d일"
            return formatter.string(from: date)
        }
    }
}


// MARK: - 2. 대고 그리기 조작부 (Tracing Controls)

// (a) 사진 버튼 라벨
struct TraceButtonLabel: View {
    let active: Bool

    var body: some View {
        Image(systemName: active ? "photo.badge.checkmark.fill" : "photo")
            .font(.system(size: 18, weight: .medium))
            .foregroundColor(active ? .white : .themeInk)
            .frame(width: 42, height: 42)
            .background(active ? Color.udaeng : Color.white)
            .clipShape(Circle())
            .shadow(color: .themeShadow, radius: 10, x: 0, y: 4)
    }
}

// (b) 위치 맞추는 중에 뜨는 패널
struct TraceAdjustPanel: View {
    @Binding var opacity: Double
    let onCancel: () -> Void
    let onLock: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            Text("사진을 밀어서 옮기고,\n두 손가락으로 크기를 맞춰요")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.themeInk)
                .multilineTextAlignment(.center)
                .lineSpacing(4)

            HStack(spacing: 12) {
                Image(systemName: "circle.dotted")
                    .foregroundColor(.themeInk.opacity(0.5))
                    .font(.system(size: 18))

                Slider(value: $opacity, in: 0.1...0.9)
                    .accentColor(.themeInk)

                Image(systemName: "circle.fill")
                    .foregroundColor(.themeInk.opacity(0.8))
                    .font(.system(size: 18))
            }
            .padding(.horizontal, 8)

            HStack(spacing: 12) {
                Button(action: onCancel) {
                    Text("취소")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.themeInk)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white.opacity(0.8))
                        .clipShape(Capsule())
                }

                Button(action: onLock) {
                    HStack(spacing: 6) {
                        Image(systemName: "lock.fill")
                        Text("잠그고 그리기")
                    }
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.themeInk)
                    .clipShape(Capsule())
                }
            }
        }
        .padding(20)
        .frame(maxWidth: 340)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .themeShadow, radius: 10, x: 0, y: 6)
    }
}

// (c) 잠근 뒤 작게 남는 막대
struct TraceBar: View {
    @Binding var opacity: Double
    let onUnlock: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            Button(action: onUnlock) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(Color.themeInk)
                    .clipShape(Circle())
            }

            HStack(spacing: 12) {
                Image(systemName: "circle.dotted")
                    .foregroundColor(.themeInk.opacity(0.5))
                    .font(.system(size: 16))

                Slider(value: $opacity, in: 0.1...0.9)
                    .accentColor(.themeInk)

                Image(systemName: "circle.fill")
                    .foregroundColor(.themeInk.opacity(0.8))
                    .font(.system(size: 16))
            }
        }
        .padding(.leading, 6)
        .padding(.trailing, 20)
        .padding(.vertical, 6)
        .frame(maxWidth: 340)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .shadow(color: .themeShadow, radius: 10, x: 0, y: 6)
    }
}

// MARK: - 3. 다이어리 필기 화면 — 제미나이 시안 2차 (2026-11-21, 우댕 「제미시안 받아서 작업하고」 — 1차를 시뮬 화면과 함께 고쳐 달라 함). 상태 타입(DiaryInkTools 등)은 InkCanvas.swift.
// MARK: - Color Extension for Hex Initialization
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Custom Tool Icons — 제미나이 5차(쌓기 방식)
// MARK: - Custom Shapes

struct TriangleShape: Shape {
    let pointDirection: VerticalPointDirection // .top or .bottom

    enum VerticalPointDirection {
        case top
        case bottom
    }

    func path(in rect: CGRect) -> Path {
        var path = Path()
        if pointDirection == .top {
            path.move(to: CGPoint(x: rect.midX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        } else { // .bottom
            path.move(to: CGPoint(x: rect.midX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        }
        path.closeSubpath()
        return path
    }
}

struct TrapezoidShape: Shape {
    let topWidthRatio: CGFloat // 0 to 1, e.g., 0.5 for top half width
    let bottomWidthRatio: CGFloat // 0 to 1

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let topWidth = rect.width * topWidthRatio
        let bottomWidth = rect.width * bottomWidthRatio

        path.move(to: CGPoint(x: rect.midX - topWidth / 2, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.midX + topWidth / 2, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.midX + bottomWidth / 2, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.midX - bottomWidth / 2, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

// MARK: - Icon Views

struct PenIcon: View {
    let color: Color
    let isSelected: Bool
    private let outlineColor = Color(hex: "#334155")
    private let outlineWidth: CGFloat = 1.5

    var body: some View {
        VStack(spacing: 0) {
            RoundedRectangle(cornerRadius: 1)
                .fill(Color.white)
                .frame(width: 7, height: 24)
                .overlay(RoundedRectangle(cornerRadius: 1).stroke(outlineColor, lineWidth: outlineWidth))

            TriangleShape(pointDirection: .top)
                .fill(color)
                .frame(width: 7, height: 9)
                .overlay(TriangleShape(pointDirection: .top).stroke(outlineColor, lineWidth: outlineWidth))
        }
        .frame(width: 36, height: 40, alignment: .bottom)
    }
}

struct PencilIcon: View {
    let color: Color
    let isSelected: Bool
    private let outlineColor = Color(hex: "#334155")
    private let outlineWidth: CGFloat = 1.5
    private let woodColor = Color(hex: "#E9C99A")

    var body: some View {
        VStack(spacing: 0) {
            RoundedRectangle(cornerRadius: 1)
                .fill(woodColor)
                .frame(width: 10, height: 22)
                .overlay(RoundedRectangle(cornerRadius: 1).stroke(outlineColor, lineWidth: outlineWidth))

            ZStack(alignment: .bottom) {
                TriangleShape(pointDirection: .top) // Wood cone
                    .fill(woodColor)
                    .frame(width: 10, height: 9)
                    .overlay(TriangleShape(pointDirection: .top).stroke(outlineColor, lineWidth: outlineWidth))

                TriangleShape(pointDirection: .top) // Graphite tip
                    .fill(color)
                    .frame(width: 4, height: 4)
                    .overlay(TriangleShape(pointDirection: .top).stroke(outlineColor, lineWidth: outlineWidth))
            }
        }
        .frame(width: 36, height: 40, alignment: .bottom)
    }
}

struct CrayonIcon: View {
    let color: Color
    let isSelected: Bool
    private let outlineColor = Color(hex: "#334155")
    private let outlineWidth: CGFloat = 1.5
    private let paperColor = Color.cream // Assuming Color.cream is defined elsewhere

    var body: some View {
        VStack(spacing: 0) {
            TrapezoidShape(topWidthRatio: 1, bottomWidthRatio: 0.7) // Crayon tip
                .fill(color)
                .frame(width: 14, height: 6)
                .overlay(TrapezoidShape(topWidthRatio: 1, bottomWidthRatio: 0.7).stroke(outlineColor, lineWidth: outlineWidth))

            ZStack(alignment: .center) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(color)
                    .frame(width: 14, height: 26)
                    .overlay(RoundedRectangle(cornerRadius: 3).stroke(outlineColor, lineWidth: outlineWidth))

                RoundedRectangle(cornerRadius: 0) // Paper band
                    .fill(paperColor)
                    .frame(width: 14, height: 8)
                    .overlay(RoundedRectangle(cornerRadius: 0).stroke(outlineColor, lineWidth: outlineWidth))
            }
        }
        .frame(width: 36, height: 40, alignment: .bottom)
    }
}

struct HighlighterIcon: View {
    let color: Color
    let isSelected: Bool
    private let outlineColor = Color(hex: "#334155")
    private let outlineWidth: CGFloat = 1.5

    var body: some View {
        VStack(spacing: 0) {
            TrapezoidShape(topWidthRatio: 0.8, bottomWidthRatio: 1) // Slanted tip
                .fill(color.opacity(0.7))
                .frame(width: 14, height: 9)
                .overlay(TrapezoidShape(topWidthRatio: 0.8, bottomWidthRatio: 1).stroke(outlineColor, lineWidth: outlineWidth))

            RoundedRectangle(cornerRadius: 3)
                .fill(Color.white)
                .frame(width: 14, height: 24)
                .overlay(RoundedRectangle(cornerRadius: 3).stroke(outlineColor, lineWidth: outlineWidth))
        }
        .frame(width: 36, height: 40, alignment: .bottom)
    }
}

struct EraserIcon: View {
    let isSelected: Bool
    private let outlineColor = Color(hex: "#334155")
    private let outlineWidth: CGFloat = 1.5
    private let pinkColor = Color(hex: "#F6C9C9")
    private let blueColor = Color(hex: "#9DB7D5")

    var body: some View {
        VStack(spacing: 0) {
            RoundedRectangle(cornerRadius: 4)
                .fill(pinkColor)
                .frame(width: 30, height: 14)
                .overlay(RoundedRectangle(cornerRadius: 4).stroke(outlineColor, lineWidth: outlineWidth))

            RoundedRectangle(cornerRadius: 0)
                .fill(blueColor)
                .frame(width: 30, height: 10)
                .overlay(RoundedRectangle(cornerRadius: 0).stroke(outlineColor, lineWidth: outlineWidth))
        }
        .frame(width: 36, height: 40, alignment: .bottom)
    }
}

// MARK: - Brush Tool Button

struct BrushToolButton: View {
    let brush: DiaryInkTools.BrushType
    let isSelected: Bool
    let currentColor: Color
    let textColor: Color
    let accentColor: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Group {
                    switch brush {
                    case .pen:
                        PenIcon(color: currentColor, isSelected: isSelected)
                    case .pencil:
                        PencilIcon(color: currentColor, isSelected: isSelected)
                    case .crayon:
                        CrayonIcon(color: currentColor, isSelected: isSelected)
                    case .highlighter:
                        HighlighterIcon(color: currentColor, isSelected: isSelected)
                    case .eraser:
                        EraserIcon(isSelected: isSelected)
                    }
                }
                .offset(y: isSelected ? -6 : 0)

                Text(brush.displayName)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(isSelected ? accentColor : textColor)
                    .lineLimit(1)
                    .fixedSize() // Prevent text wrapping

                if isSelected {
                    Circle()
                        .fill(accentColor)
                        .frame(width: 4, height: 4)
                }
            }
        }
        .frame(minWidth: 44, maxWidth: 52)   // 연결 보완: 폭 375 에서도 한 줄(「크레파스」 글자 폭 44)
    }
}

// MARK: - Thickness Cell View

struct ThicknessCell: View {
    let brush: DiaryInkTools.BrushType
    let sizeIndex: Int // 0, 1, 2 for small, medium, large
    let color: Color
    let isSelected: Bool
    let accentColor: Color
    let action: () -> Void

    private var capsuleHeight: CGFloat {
        switch brush {
        case .pen, .pencil:
            return [2, 3.5, 5][sizeIndex]
        case .crayon:
            return [5, 8, 11][sizeIndex]
        case .highlighter:
            return [7, 10, 13][sizeIndex]
        case .eraser:
            return 0 // Eraser doesn't show thickness preview here
        }
    }

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(isSelected ? Color.cream : Color(hex: "#F1EEE9"))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Circle()
                            .stroke(isSelected ? accentColor : Color.clear, lineWidth: 2)
                    )

                Capsule()
                    .fill(brush == .highlighter ? color.opacity(0.5) : color)
                    .frame(width: 24, height: capsuleHeight)
            }
        }
    }
}


extension Color {
    // A cream color for general use (e.g., crayon paper band)
    static let creamColor = Color(red: 255/255, green: 250/255, blue: 240/255)
    static let cream = creamColor   // 연결 보완: 5차 시안이 쓰는 이름
}


// MARK: - Main Screen View
struct DiaryInkScreenView<Canvas: View>: View {
    @ObservedObject var tools: DiaryInkTools
    let paperColor: Color
    let note: String?
    let isPad: Bool
    let onCancel: () -> Void
    let onDone: () -> Void
    let onUndo: () -> Void
    let onRedo: () -> Void
    @ViewBuilder let canvas: () -> Canvas

    // Internal state for popovers - these will be removed as we integrate controls
    @State private var showThicknessPopover: Bool = false
    @State private var showEraserSettingsPopover: Bool = false // This will be removed too

    // Constants for styling
    let backgroundColor = Color(hex: "#F4F0EC")
    let textColor = Color(hex: "#334155")
    let accentColor = Color(hex: "#D9635B")
    let cardColor = Color(hex: "#FFFDF8")
    let buttonHeight: CGFloat = 44
    let toolbarMaxWidth: CGFloat = 560 // Max width for toolbar on iPad

    static func fitCard(_ maxCardWidth: CGFloat, _ maxCardHeight: CGFloat, _ cardAspectRatio: CGFloat) -> CGSize {
        if maxCardWidth / cardAspectRatio <= maxCardHeight { return CGSize(width: maxCardWidth, height: maxCardWidth / cardAspectRatio) }
        return CGSize(width: maxCardHeight * cardAspectRatio, height: maxCardHeight)
    }

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                // MARK: - Top Bar
                HStack {
                    Button(action: onCancel) {
                        Text("취소")
                            .font(.system(size: 17))
                            .foregroundColor(.gray)
                            .padding(10) // Make touch area larger
                    }
                    .frame(minHeight: buttonHeight)

                    Spacer()

                    Text("필기")
                        .font(.headline)
                        .foregroundColor(textColor)
                        .frame(minHeight: buttonHeight)

                    Spacer()

                    Button(action: onDone) {
                        Text("완료")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(accentColor)
                            .padding(10) // Make touch area larger
                    }
                    .frame(minHeight: buttonHeight)
                }
                .padding(.horizontal)
                .background(backgroundColor.ignoresSafeArea(.all, edges: .top))

                // MARK: - Paper Card and Canvas
                // Need to calculate tool area height for accurate card sizing.
                // Estimating tool area height for now. Will refine after tool area is done.
                // Rough estimate for tool area height:
                // Row 1 (tools): ~60pt
                // Row 2 (thickness/eraser settings): ~60pt
                // Row 3 (colors): ~60pt
                // Vertical padding, spacing: ~30pt
                // Total ~ 210pt.
                let estimatedToolAreaHeight: CGFloat = isPad ? 250 : 262 // 연결 보완: 5차 도구 영역 실제 높이(SE 에서 색 줄이 잘려 실측으로 맞춤)
                let topBarHeight: CGFloat = buttonHeight + (geometry.safeAreaInsets.top > 0 ? geometry.safeAreaInsets.top : 20) // Estimate safe area or 20pt padding
                let availableHeight = geometry.size.height - topBarHeight - estimatedToolAreaHeight - (note != nil ? 30 : 0) // Account for note height

                let maxCardWidth = geometry.size.width * 0.9
                let maxCardHeight = availableHeight // Use the calculated available height
                let cardAspectRatio: CGFloat = 3/4 // Width to Height (3:4)

                let cardSize = Self.fitCard(maxCardWidth, maxCardHeight, cardAspectRatio)
                let calculatedCardWidth = cardSize.width
                let calculatedCardHeight = cardSize.height

                Spacer()

                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(paperColor)
                        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 5)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )

                    canvas()
                }
                .frame(width: calculatedCardWidth, height: calculatedCardHeight)

                // MARK: - Note
                if let note = note {
                    Text(note)
                        .font(.system(size: 13))
                        .foregroundColor(.gray)
                        .padding(.top, 10)
                }

                Spacer()

                // MARK: - Tool Area
                VStack(spacing: 15) {
                    // MARK: Row 1 — 제미나이 5차
                    HStack(spacing: 2) { // Adjust spacing as needed to fit 375pt
                        BrushToolButton(brush: .pen, isSelected: tools.selectedBrush == .pen, currentColor: Color(hex: DiaryInkTools.colorHexes[tools.selectedColorIndex]), textColor: textColor, accentColor: accentColor) {
                            tools.selectedBrush = .pen
                            tools.erasing = false
                        }
                        BrushToolButton(brush: .pencil, isSelected: tools.selectedBrush == .pencil, currentColor: Color(hex: DiaryInkTools.colorHexes[tools.selectedColorIndex]), textColor: textColor, accentColor: accentColor) {
                            tools.selectedBrush = .pencil
                            tools.erasing = false
                        }
                        BrushToolButton(brush: .crayon, isSelected: tools.selectedBrush == .crayon, currentColor: Color(hex: DiaryInkTools.colorHexes[tools.selectedColorIndex]), textColor: textColor, accentColor: accentColor) {
                            tools.selectedBrush = .crayon
                            tools.erasing = false
                        }
                        BrushToolButton(brush: .highlighter, isSelected: tools.selectedBrush == .highlighter, currentColor: Color(hex: DiaryInkTools.colorHexes[tools.selectedColorIndex]), textColor: textColor, accentColor: accentColor) {
                            tools.selectedBrush = .highlighter
                            tools.erasing = false
                        }
                        BrushToolButton(brush: .eraser, isSelected: tools.erasing, currentColor: Color.clear, textColor: textColor, accentColor: accentColor) { // currentColor isn't used for eraser, but passed.
                            tools.erasing.toggle()
                        }

                        Spacer(minLength: 0)   // 연결 보완: 폭 375 에서도 한 줄

                        Button(action: onUndo) {
                            Image(systemName: "arrow.uturn.backward.circle.fill")
                                .font(.system(size: 24))
                                .frame(width: 36, height: 40)
                                .foregroundColor(textColor)
                        }
                        .disabled(!tools.canUndo).opacity(tools.canUndo ? 1 : 0.3)   // 연결 보완: 할 수 없을 땐 흐리게(요청서 조건)
                        Button(action: onRedo) {
                            Image(systemName: "arrow.uturn.forward.circle.fill")
                                .font(.system(size: 24))
                                .frame(width: 36, height: 40)
                                .foregroundColor(textColor)
                        }
                        .disabled(!tools.canRedo).opacity(tools.canRedo ? 1 : 0.3)
                    }
                    .padding(.horizontal)

                    // MARK: Row 2: Thickness or Eraser Settings
                    if tools.erasing {
                        // Eraser settings when erasing is active
                        HStack(spacing: 10) {
                            Picker("지우기 방식", selection: $tools.eraserMode) {
                                ForEach(DiaryEraserMode.allCases, id: \.self) { mode in
                                    Text(mode.label).tag(mode)
                                }
                            }
                            .pickerStyle(.segmented)
                            .tint(accentColor)
                            .fixedSize() // Prevent picker from expanding unnecessarily

                            Picker("지우개 크기", selection: $tools.eraserSizeIndex) {
                                Text("작게").tag(0)
                                Text("보통").tag(1)
                                Text("크게").tag(2)
                            }
                            .pickerStyle(.segmented)
                            .tint(accentColor)
                            .fixedSize()
                        }
                        .padding(.horizontal)
                    } else {
                        HStack {
                            Spacer()
                            ForEach(0..<3) { i in
                                ThicknessCell(
                                    brush: tools.selectedBrush,
                                    sizeIndex: i,
                                    color: Color(hex: DiaryInkTools.colorHexes[tools.selectedColorIndex]),
                                    isSelected: tools.selectedThicknessIndex == i,
                                    accentColor: accentColor
                                ) {
                                    tools.selectedThicknessIndex = i
                                }
                            }
                            Spacer()
                        }
                    }
                    // 연결 보완: 5차에서 빠진 아이패드 「펜슬로만」 스위치 — 4차 시안의 것 그대로(없으면 펜슬 없는 아이패드는 손가락으로 못 그린다)
                    if isPad {
                        Toggle(isOn: $tools.pencilOnly) {
                            Label("펜슬로만 그리기", systemImage: "pencil.tip.crop.circle")
                        }
                        .toggleStyle(.switch)
                        .tint(accentColor)
                        .padding(.horizontal)
                    }

                    // MARK: Row 3: Color Palette (5x2 Grid)
                    VStack(spacing: 8) { // Smaller spacing between rows of colors
                        HStack(spacing: 8) { // Spacing between color circles
                            ForEach(0..<5) { index in
                                ColorCircle(
                                    color: Color(hex: DiaryInkTools.colorHexes[index]),
                                    isSelected: tools.colorIndex == index && !tools.erasing,
                                    selectedAccentColor: accentColor
                                ) {
                                    tools.colorIndex = index
                                    tools.erasing = false
                                }
                            }
                        }
                        HStack(spacing: 8) {
                            ForEach(5..<10) { index in
                                ColorCircle(
                                    color: Color(hex: DiaryInkTools.colorHexes[index]),
                                    isSelected: tools.colorIndex == index && !tools.erasing,
                                    selectedAccentColor: accentColor
                                ) {
                                    tools.colorIndex = index
                                    tools.erasing = false
                                }
                            }
                            // Add dummy circles or Spacer to fill if less than 5
                            if DiaryInkTools.colorHexes.count < 10 {
                                ForEach(0..<(5 - (DiaryInkTools.colorHexes.count - 5)), id: \.self) { _ in
                                    Spacer()
                                        .frame(width: 28, height: 28) // Match color circle size
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 15)
                .background(cardColor)
                .cornerRadius(20) // Rounded corners for the tool area
                .padding(.horizontal) // Padding from the screen edges
                .frame(maxWidth: isPad ? toolbarMaxWidth : .infinity) // Max width for iPad
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: -5)
            }
            .background(backgroundColor.ignoresSafeArea(.all))
        }
    }
}

// MARK: - Subviews for Tools

// Color Circle Selector
struct ColorCircle: View {
    let color: Color
    let isSelected: Bool
    let selectedAccentColor: Color // Pass accent color for consistency
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Circle()
                .fill(color)
                .frame(width: 28, height: 28) // Diameter 28pt
                .overlay(
                    Circle()
                        .stroke(isSelected ? selectedAccentColor : Color.clear, lineWidth: 2) // Outer ring with accent color
                )
        }
    }
}

// Thickness Selector View (for popover) - REMOVED, functionality integrated

// Eraser Settings View (for popover) - REMOVED, functionality integrated

// MARK: - Preview Provider
struct DiaryInkScreenView_Previews: PreviewProvider {
    static var previews: some View {
        DiaryInkScreenView(
            tools: DiaryInkTools(),
            paperColor: Color(hex: "#FAF6EE"),
            note: "이 그림은 다이어리 종이에 스티커처럼 붙어요.",
            isPad: false,
            onCancel: {},
            onDone: {},
            onUndo: {},
            onRedo: {}
        ) {
            Color.clear // Placeholder for the actual canvas
        }
        .previewDisplayName("iPhone SE/Mini")

        DiaryInkScreenView(
            tools: DiaryInkTools(),
            paperColor: Color(hex: "#FAF6EE"),
            note: "이 그림은 다이어리 종이에 스티커처럼 붙어요.",
            isPad: true,
            onCancel: {},
            onDone: {},
            onUndo: {},
            onRedo: {}
        ) {
            Color.clear // Placeholder for the actual canvas
        }
        .previewDevice("iPad Pro (11-inch)")
        .previewDisplayName("iPad Pro")
    }
}

// 연결 보완(Claude): presentationCompactAdaptation 은 iOS 16.4+ — 앱 대상이 16.0 이라 감싼다
extension View {
    @ViewBuilder func compactPopover() -> some View {
        if #available(iOS 16.4, *) { self.presentationCompactAdaptation(.popover) } else { self }
    }
}
