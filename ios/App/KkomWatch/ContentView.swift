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

// 폰 QuickReplyBar와 동일한 범프 5종 (포차코 그림은 워치 애셋에 PNG로 내장 — webp가 watchOS AsyncImage에서 안 그려짐)
let BUMP_ITEMS: [(kind: String, label: String)] = [
    ("miss", "보고싶어"), ("love", "사랑해"), ("hug", "안아줘"), ("kiss", "뽀뽀"), ("whitening", "화이트닝"),
]
func bumpLabel(_ kind: String?) -> String { BUMP_ITEMS.first { $0.kind == kind }?.label ?? "" }

struct ContentView: View {
    @EnvironmentObject var store: WatchStore
    @Environment(\.scenePhase) private var phase
    var body: some View {
        Group {
            if store.role == nil {
                RolePicker()
            } else {
                ZStack {
                    TabView {
                        PresenceView()    // 접속 + D-day + 하트
                        BumpPalette()     // 범프 (폰 그대로 재현)
                        MoodPicker()      // 기분
                        AirView()         // 미세먼지
                    }
                    .tabViewStyle(.page)
                    // 상대가 날린 이모지 — 어느 페이지에서도 위로 크게 떴다 사라짐
                    if store.heartFlash > 0 {
                        ReceivedHeart(trigger: store.heartFlash, emoji: store.lastReceivedEmoji)
                    }
                    // 내가 범프 보낸 확인 (폰 QuickReplyBar 재현: 큰 포차코 떠오름)
                    if store.bumpFlash > 0, let k = store.bumpKind {
                        BumpConfirm(trigger: store.bumpFlash, kind: k)
                    }
                }
            }
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

                Button { store.fling("❤️") } label: {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(cRose)
                        .scaleEffect(store.sending ? 0.82 : 1)
                        .animation(.spring(response: 0.25, dampingFraction: 0.5), value: store.sending)
                }
                .buttonStyle(.plain)
                .padding(.top, 2)

                Text("톡  ·  ← 밀어 스티커").font(.system(size: 10)).foregroundStyle(.white.opacity(0.45))
            }
            .padding(.horizontal, 8)
        }
    }
}

// 상대가 날린 이모지 — 커졌다 사라지는 오버레이
struct ReceivedHeart: View {
    let trigger: Int
    let emoji: String
    @State private var show = false
    var body: some View {
        Text(emoji)
            .font(.system(size: 88))
            .opacity(show ? 0 : 1)
            .scaleEffect(show ? 1.7 : 0.5)
            .allowsHitTesting(false)
            .onChange(of: trigger) { _, _ in
                show = false
                withAnimation(.easeOut(duration: 0.9)) { show = true }
            }
            .onAppear { withAnimation(.easeOut(duration: 0.9)) { show = true } }
    }
}

// ── 범프 — 폰 QuickReplyBar 그대로: 포차코 그림 탭하면 /api/bump 푸시 ──
struct BumpPalette: View {
    @EnvironmentObject var store: WatchStore
    private let cols = [GridItem(.adaptive(minimum: 58), spacing: 8)]
    var body: some View {
        ScrollView {
            Text("범프 💌").font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(0.55)).padding(.top, 4).padding(.bottom, 2)
            LazyVGrid(columns: cols, spacing: 10) {
                ForEach(BUMP_ITEMS, id: \.kind) { b in
                    Button { store.sendBump(b.kind) } label: {
                        VStack(spacing: 3) {
                            Image(b.kind).resizable().scaledToFit().frame(width: 52, height: 52)
                            Text(b.label).font(.system(size: 10, weight: .semibold)).foregroundStyle(.white.opacity(0.6))
                        }
                        .padding(.vertical, 2)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 4)
        }
        .background(cBg.ignoresSafeArea())
    }
}

// 범프 보낸 확인 — 폰처럼 큰 포차코가 떠오르며 "라벨 보냈어!"
struct BumpConfirm: View {
    let trigger: Int
    let kind: String
    @State private var show = false
    var body: some View {
        VStack(spacing: 6) {
            Image(kind).resizable().scaledToFit().frame(width: 96, height: 96)
            Text("\(bumpLabel(kind)) 보냈어!")
                .font(.system(size: 13, weight: .bold)).foregroundStyle(.white)
                .padding(.horizontal, 12).padding(.vertical, 5)
                .background(.ultraThinMaterial).clipShape(Capsule())
        }
        .opacity(show ? 0 : 1)
        .scaleEffect(show ? 1.15 : 0.5)
        .offset(y: show ? -28 : 18)
        .allowsHitTesting(false)
        .onChange(of: trigger) { _, _ in
            show = false
            withAnimation(.easeOut(duration: 1.0)) { show = true }
        }
        .onAppear { withAnimation(.easeOut(duration: 1.0)) { show = true } }
    }
}

// ── 기분 보내기 — 오늘 내 기분 (웹 MOOD_OPTIONS와 동일 이모지) ──
struct MoodPicker: View {
    @EnvironmentObject var store: WatchStore
    private let moods = ["😊", "🥰", "😄", "😌", "😴", "😢", "😠", "🥺", "🤒", "🙏", "🙇", "😤"]
    private let cols = [GridItem(.adaptive(minimum: 44), spacing: 8)]
    var body: some View {
        ScrollView {
            Text(store.moodSent.map { "오늘 \($0) 보냄" } ?? "오늘 내 기분")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white.opacity(0.55)).padding(.top, 4).padding(.bottom, 2)
            LazyVGrid(columns: cols, spacing: 8) {
                ForEach(moods, id: \.self) { e in
                    Button { store.sendMood(e) } label: {
                        Text(e).font(.system(size: 26))
                            .frame(width: 46, height: 46)
                            .background(store.moodSent == e ? cMint.opacity(0.3) : Color.white.opacity(0.08))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 4)
        }
        .background(cBg.ignoresSafeArea())
    }
}

// ── 미세먼지 — Gemini 디자인 (미세미세 스타일: 등급 카피 + 표정 + 수치 캡슐) ──
struct AirView: View {
    @EnvironmentObject var store: WatchStore

    // 다크 배경색 지정
    let bgColor = Color(hexW: "#17110F")

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // 우댕 (호평동) 카드
                airCard(store.airHome)

                // 꼼이 (서울 중구) 카드
                airCard(store.airWork)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 12)
        }
        .background(bgColor.ignoresSafeArea())
    }

    // MARK: - Air Card
    @ViewBuilder
    func airCard(_ a: AirInfo?) -> some View {
        if let info = a {
            // 데이터가 있을 때
            let attr = gradeAttributes(for: info.grade)

            VStack(alignment: .leading, spacing: 8) {
                // 상단: 지역 이름 & 날씨 아이콘
                HStack {
                    Text(info.label)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white.opacity(0.9))

                    Spacer()

                    Image(systemName: attr.icon)
                        .font(.system(size: 24, weight: .medium))
                        .foregroundColor(attr.color)
                }

                // 중단: 등급 & 친근한 카피
                VStack(alignment: .leading, spacing: 2) {
                    Text(info.grade)
                        .font(.system(size: 28, weight: .black))
                        .foregroundColor(attr.color)

                    Text(attr.copy)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.vertical, 4)

                // 하단: 구체적 수치 (PM10, PM2.5)
                HStack(spacing: 6) {
                    pmCapsule(title: "미세", value: info.pm10)
                    pmCapsule(title: "초미세", value: info.pm25)
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(attr.color.opacity(0.15)) // 은은한 카드 배경
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(attr.color.opacity(0.3), lineWidth: 1) // 은은한 테두리
            )

        } else {
            // 로딩 중일 때 (Skeleton UI)
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 50, height: 16)
                    Spacer()
                    Circle()
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 24, height: 24)
                }

                VStack(alignment: .leading, spacing: 6) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 80, height: 28)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 110, height: 14)
                }
                .padding(.vertical, 4)

                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 130, height: 24)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.white.opacity(0.05))
            )
        }
    }

    // MARK: - 미세먼지 수치 캡슐
    @ViewBuilder
    private func pmCapsule(title: String, value: Int?) -> some View {
        HStack(spacing: 4) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.white.opacity(0.6))
            Text(value != nil ? "\(value!)" : "-")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.white.opacity(0.9))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Capsule().fill(Color.white.opacity(0.1)))
    }

    // MARK: - 등급별 속성 매핑 로직
    private func gradeAttributes(for grade: String) -> (color: Color, icon: String, copy: String) {
        switch grade {
        case "좋음":
            return (Color(hexW: "#34D399"), "face.smiling", "숨쉬기 좋아요")
        case "보통":
            return (Color(hexW: "#60A5FA"), "sun.max", "공기 괜찮아요")
        case "나쁨":
            return (Color(hexW: "#FB923C"), "cloud.fog", "마스크 챙겨요")
        case "매우 나쁨":
            return (Color(hexW: "#F87171"), "exclamationmark.triangle", "밖은 위험해요")
        default: // "정보 없음" 또는 예기치 못한 값
            return (Color.gray, "aqi.medium", "정보가 없어요")
        }
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
