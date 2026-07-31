import SwiftUI

// ── SwiftUI Color(hex) ──
extension Color {
    init(hexW: String) {
        var s = hexW; if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0; Scanner(string: s).scanHexInt64(&v)
        self.init(.sRGB,
                  red:   Double((v & 0xFF0000) >> 16) / 255,
                  green: Double((v & 0x00FF00) >> 8) / 255,
                  blue:  Double(v & 0x0000FF) / 255,
                  opacity: 1)
    }
}

private let cBgTop = Color(hexW: "#2A1520")
private let cBg    = Color(hexW: "#17110F")
private let cRose  = Color(hexW: "#FB7BA8")
private let cMint  = Color(hexW: "#34D399")

struct ContentView: View {
    @EnvironmentObject var store: WatchStore
    @Environment(\.scenePhase) private var phase
    var body: some View {
        Group {
            if store.role == nil { RolePicker() }
            else { PresenceView() }
        }
        .onChange(of: phase) { _, newPhase in
            if newPhase == .active { store.start() } else { store.stop() }
        }
    }
}

// ── 접속 + D-day + 하트 ──
struct PresenceView: View {
    @EnvironmentObject var store: WatchStore
    var body: some View {
        ZStack {
            LinearGradient(colors: [cBgTop, cBg], startPoint: .top, endPoint: .bottom).ignoresSafeArea()

            VStack(spacing: 7) {
                HStack(spacing: 5) {
                    Circle().fill(store.online ? cMint : Color.gray.opacity(0.6)).frame(width: 8, height: 8)
                    Text(store.online ? "\(store.partner) 지금 함께" : "\(store.partner) · \(store.agoText())")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white).lineLimit(1).minimumScaleFactor(0.7)
                }

                Text(store.ddayText())
                    .font(.system(size: 30, weight: .heavy, design: .rounded))
                    .foregroundStyle(store.online ? cMint : .white.opacity(0.9))

                Button { store.sendHeart() } label: {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(cRose)
                        .scaleEffect(store.sending ? 0.82 : 1)
                        .animation(.spring(response: 0.25, dampingFraction: 0.5), value: store.sending)
                }
                .buttonStyle(.plain)
                .padding(.top, 2)

                Text("톡, 보내기").font(.system(size: 11)).foregroundStyle(.white.opacity(0.5))
            }
            .padding(.horizontal, 8)

            if store.heartFlash > 0 { ReceivedHeart(trigger: store.heartFlash) }
        }
    }
}

// 상대가 보낸 하트 — 커졌다 사라지는 오버레이
struct ReceivedHeart: View {
    let trigger: Int
    @State private var show = false
    var body: some View {
        Image(systemName: "heart.fill")
            .font(.system(size: 95))
            .foregroundStyle(cRose)
            .opacity(show ? 0 : 0.9)
            .scaleEffect(show ? 1.7 : 0.5)
            .allowsHitTesting(false)
            .onChange(of: trigger) { _, _ in
                show = false
                withAnimation(.easeOut(duration: 0.9)) { show = true }
            }
            .onAppear { withAnimation(.easeOut(duration: 0.9)) { show = true } }
    }
}

// ── 첫 실행: 나는 우댕/꼼이? ──
struct RolePicker: View {
    @EnvironmentObject var store: WatchStore
    var body: some View {
        VStack(spacing: 10) {
            Text("💚").font(.system(size: 28))
            Text("나는 누구?").font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
            HStack(spacing: 10) {
                roleButton("우댕"); roleButton("꼼이")
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(cBg.ignoresSafeArea())
    }
    private func roleButton(_ n: String) -> some View {
        Button { store.setRole(n) } label: {
            Text(n).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                .frame(maxWidth: .infinity).padding(.vertical, 10)
                .background(cRose.opacity(0.3)).clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}
