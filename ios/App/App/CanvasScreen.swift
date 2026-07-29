import SwiftUI
import PhotosUI

// 네이티브 낙서장 화면 (Capacitor 플러그인이 present). me는 꼼모닝 로그인에서 전달받음.
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

    @State private var passageItem: PhotosPickerItem?
    @State private var passageImage: UIImage?
    @State private var opacity: Double = 0.5

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

                // 상단: 닫기 + presence + 나 배지
                VStack {
                    HStack(alignment: .top) {
                        Button(action: onClose) {
                            Image(systemName: "xmark")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(inkColor)
                                .frame(width: 34, height: 34)
                                .background(.ultraThinMaterial).clipShape(Circle())
                        }
                        if controller.partnerActive { presenceTag }
                        Spacer()
                        meBadge
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 6)
                    Spacer()
                }

                toolbarLayer
            }
        }
        .onChange(of: passageItem) { item in
            Task {
                if let data = try? await item?.loadTransferable(type: Data.self),
                   let img = UIImage(data: data) {
                    await MainActor.run { passageImage = img; opacity = 0.5 }
                }
            }
        }
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
    }

    private var presenceTag: some View {
        HStack(spacing: 5) {
            Circle().fill(partnerColor).frame(width: 8, height: 8)
            Text("\(partnerName)가 끄적이는 중 ✍️").font(.system(size: 12, weight: .bold))
        }
        .foregroundStyle(inkColor)
        .padding(.horizontal, 12).padding(.vertical, 6)
        .background(.ultraThinMaterial).clipShape(Capsule())
        .rotationEffect(.degrees(-2))
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
                Spacer()
                VStack(spacing: 12) {
                    Spacer()
                    if passageImage != nil { opacitySlider }
                    CanvasToolbar(controller: controller, axis: .vertical, passageItem: $passageItem)
                    Spacer()
                }.padding(.trailing, 16)
            }
        } else {
            VStack(spacing: 10) {
                Spacer()
                if passageImage != nil { opacitySlider }
                CanvasToolbar(controller: controller, axis: .horizontal, passageItem: $passageItem)
                    .padding(.bottom, 18)
            }
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
    @Binding var passageItem: PhotosPickerItem?
    private let sizes: [CGFloat] = [4, 7, 13]

    var body: some View {
        let vertical = axis == .vertical
        Group {
            if vertical { VStack(spacing: 12) { items } }
            else { HStack(spacing: 7) { items } }
        }
        .foregroundStyle(Color(red: 0.39, green: 0.45, blue: 0.55))
        .padding(.horizontal, vertical ? 12 : 13)
        .padding(.vertical, vertical ? 18 : 12)
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
                Circle().fill(inkColor).frame(width: w + 3, height: w + 3)
                    .frame(width: 30, height: 30)
                    .background(Circle().fill(Color.gray.opacity(controller.lineWidth == w && !controller.eraser ? 0.18 : 0)))
            }
        }
        divider
        Button { controller.eraser.toggle() } label: {
            Image(systemName: "eraser").font(.system(size: 16, weight: .medium))
                .foregroundStyle(controller.eraser ? .white : Color(red: 0.39, green: 0.45, blue: 0.55))
                .frame(width: 30, height: 30)
                .background(Circle().fill(controller.eraser ? inkColor : Color.clear))
        }
        PhotosPicker(selection: $passageItem, matching: .images) {
            Image(systemName: "photo").font(.system(size: 16, weight: .medium))
        }
        Button { controller.undo() } label: { Image(systemName: "arrow.uturn.backward").font(.system(size: 17, weight: .medium)) }
        Button { controller.clear() } label: { Image(systemName: "trash").font(.system(size: 16, weight: .medium)) }
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
