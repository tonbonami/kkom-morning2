import WidgetKit
import SwiftUI
import AppIntents

// 꼼모닝 위젯 — 앱 그룹 스냅샷(웹이 씀)을 읽어 렌더. 디자인: Gemini 명세.
// 스냅샷은 UserDefaults(group)의 "kkomState"(JSON). 시계 오차는 스냅샷의 server/device 시각으로 보정.

private let APP_GROUP = "group.com.tonbonami.kkommorning"

// ── 스냅샷 모델 (웹 WidgetBridge가 쓰는 JSON과 동일) ──
struct KkomState: Codable {
    var partnerName: String
    var partnerLastSeenMs: Double
    var partnerActive: Bool
    var snapshotServerMs: Double
    var snapshotDeviceMs: Double
    var ddayDate: String            // "YYYY-MM-DD"
    var nextEventTitle: String?
    var nextEventDate: String?      // "YYYY-MM-DD"
    var airGrade: String?
    var airPm10: Int?
    var airPm25: Int?
    var airLoc: String?
    var weatherTemp: Int?
    var weatherSky: String?
    var partnerMood: String?        // 이모지
}

func loadKkomState() -> KkomState? {
    guard let d = UserDefaults(suiteName: APP_GROUP)?.data(forKey: "kkomState") else { return nil }
    return try? JSONDecoder().decode(KkomState.self, from: d)
}

// ── 색 토큰 (라이트/다크) ──
private func dyn(_ light: String, _ dark: String) -> Color {
    Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: dark) : UIColor(hexW: light) })
}
extension UIColor {
    convenience init(hexW: String) {
        var s = hexW; if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0; Scanner(string: s).scanHexInt64(&v)
        self.init(red: CGFloat((v & 0xFF0000) >> 16) / 255, green: CGFloat((v & 0x00FF00) >> 8) / 255,
                  blue: CGFloat(v & 0x0000FF) / 255, alpha: 1)
    }
}
private let cCream = dyn("#FBF8F2", "#272522")
private let cInk = dyn("#334155", "#E8E2D8")
private let cInkSoft = dyn("#64748B", "#B4AA9A")
private let cMint = dyn("#99E6D9", "#2A5A53")
private let cRose = dyn("#FB7BA8", "#D94C7A")
private let cEmerald = dyn("#10B981", "#059669")
private let cSlate = dyn("#94A3B8", "#64748B")
private let cCard = dyn("#FFFFFF", "#332F2A")

// ── 계산 (시계 오차 보정) ──
private func serverNow(_ s: KkomState, at date: Date) -> Double {
    let elapsed = date.timeIntervalSince1970 * 1000 - s.snapshotDeviceMs
    return s.snapshotServerMs + elapsed
}
private func isOnline(_ s: KkomState, at date: Date) -> Bool {
    guard s.partnerActive else { return false }
    return serverNow(s, at: date) - s.partnerLastSeenMs < 90_000
}
private func agoText(_ s: KkomState, at date: Date) -> String {
    if s.partnerLastSeenMs <= 0 { return "대기 중" }   // 아직 상대 기록 없음 → 쓰레기값(2876주 전) 방지
    let diff = max(0, serverNow(s, at: date) - s.partnerLastSeenMs)
    let m = max(1, Int(diff / 60_000))
    if m < 60 { return "\(m)분 전" }
    let h = m / 60; if h < 24 { return "\(h)시간 전" }
    let d = h / 24; if d == 1 { return "어제" }; if d < 7 { return "\(d)일 전" }
    return "\(d / 7)주 전"
}
private func daysBetween(_ ymd: String, serverMs: Double) -> Int? {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = TimeZone(identifier: "Asia/Seoul")
    guard let target = f.date(from: ymd) else { return nil }
    var cal = Calendar(identifier: .gregorian); cal.timeZone = TimeZone(identifier: "Asia/Seoul")!
    let now = Date(timeIntervalSince1970: serverMs / 1000)
    let a = cal.startOfDay(for: now), b = cal.startOfDay(for: target)
    return cal.dateComponents([.day], from: a, to: b).day
}
private func ddayText(_ s: KkomState, at date: Date) -> String {
    guard let n = daysBetween(s.ddayDate, serverMs: serverNow(s, at: date)) else { return "D-day" }
    return "D+\(1 - n)"   // 사귄 당일 D+1 관례
}
private func eventDText(_ s: KkomState, at date: Date) -> String? {
    guard let ed = s.nextEventDate, let n = daysBetween(ed, serverMs: serverNow(s, at: date)) else { return nil }
    if n == 0 { return "D-day" }
    return n > 0 ? "D-\(n)" : "D+\(-n)"
}

// ── Timeline ──
struct KkomEntry: TimelineEntry { let date: Date; let state: KkomState? }

struct Provider: TimelineProvider {
    func placeholder(in c: Context) -> KkomEntry { KkomEntry(date: Date(), state: nil) }
    func getSnapshot(in c: Context, completion: @escaping (KkomEntry) -> Void) {
        completion(KkomEntry(date: Date(), state: loadKkomState()))
    }
    func getTimeline(in c: Context, completion: @escaping (Timeline<KkomEntry>) -> Void) {
        let st = loadKkomState()
        let now = Date()
        var entries: [KkomEntry] = []
        for m in stride(from: 0, through: 30, by: 5) {
            entries.append(KkomEntry(date: now.addingTimeInterval(Double(m) * 60), state: st))
        }
        completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(15 * 60))))
    }
}

// ── 상태 배지 ──
struct StatusBadge: View {
    let s: KkomState; let date: Date; var compact = false
    var body: some View {
        let online = isOnline(s, at: date)
        HStack(spacing: 5) {
            Image(systemName: online ? "heart.fill" : "heart")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(online ? cEmerald : cSlate)
            Text(online ? "\(s.partnerName) 함께" : (compact ? agoText(s, at: date) : "\(s.partnerName) · \(agoText(s, at: date))"))
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(online ? cEmerald : cSlate)
                .lineLimit(1)
        }
        .padding(.horizontal, 8).padding(.vertical, 4)
        .background(online ? cMint.opacity(0.35) : cSlate.opacity(0.12))
        .clipShape(Capsule())
    }
}

// ── 하트 보내기 버튼 (iOS17+ 인터랙티브 — 앱 안 열고 상대에게 하트) · 디자인: Gemini(다꾸 스티커) ──
@available(iOS 17.0, *)
struct HeartSendButton: View {
    // 4가지 시안 중 원하는 스타일을 선택해서 사용하세요.
    enum ButtonStyleOption {
        case solidRose, stickerGradient, sparkleCard, dashedStamp
    }

    var size: CGFloat = 36 // 15는 터치 영역으로 다소 작을 수 있어 36을 기본값으로 제안합니다.
    var style: ButtonStyleOption = .stickerGradient

    // MARK: - Design Tokens
    private var cCream: Color { Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#272522") : UIColor(hexW: "#FBF8F2") }) }
    private var cInk: Color { Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#E8E2D8") : UIColor(hexW: "#334155") }) }
    private var cInkSoft: Color { Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#B4AA9A") : UIColor(hexW: "#64748B") }) }
    private var cRose: Color { Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#D94C7A") : UIColor(hexW: "#FB7BA8") }) }
    private var cMint: Color { Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#2A5A53") : UIColor(hexW: "#99E6D9") }) }
    private var cEmerald: Color { Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#059669") : UIColor(hexW: "#10B981") }) }
    private var cCard: Color { Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#332F2A") : UIColor(hexW: "#FFFFFF") }) }

    var body: some View {
        // AppIntent를 통한 인터랙티브 버튼 (위젯용)
        Button(intent: SendHeartIntent()) {
            label(for: style)
        }
        .buttonStyle(.plain)
    }

    // MARK: - 시안별 라벨 디자인
    @ViewBuilder
    private func label(for style: ButtonStyleOption) -> some View {
        switch style {
        case .solidRose:
            // 1. Solid Rose
            Image(systemName: "heart.fill")
                .font(.system(size: size * 0.5, weight: .semibold))
                .foregroundColor(.white)
                .frame(width: size, height: size)
                .background(Circle().fill(cRose))
                .shadow(color: cRose.opacity(0.3), radius: size * 0.1, x: 0, y: size * 0.1)

        case .stickerGradient:
            // 2. Sticker Gradient
            Image(systemName: "heart.fill")
                .font(.system(size: size * 0.5))
                .foregroundStyle(
                    LinearGradient(
                        colors: [cRose, cRose.opacity(0.7)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: size, height: size)
                .background(Circle().fill(cCard))
                .overlay(Circle().stroke(cMint, lineWidth: 1.5))
                .rotationEffect(.degrees(-6)) // 삐뚤게 붙인 스티커 느낌
                .shadow(color: Color.black.opacity(0.08), radius: 3, x: 1, y: 2)

        case .sparkleCard:
            // 3. Sparkle Card
            ZStack {
                Circle()
                    .fill(cCard)
                    .frame(width: size, height: size)
                    .shadow(color: Color.black.opacity(0.06), radius: 4, y: 2)

                Image(systemName: "heart.fill")
                    .font(.system(size: size * 0.45))
                    .foregroundColor(cRose)

                Image(systemName: "sparkles")
                    .font(.system(size: size * 0.25))
                    .foregroundColor(cMint)
                    .offset(x: size * 0.25, y: -size * 0.25)
            }

        case .dashedStamp:
            // 4. Dashed Stamp
            Image(systemName: "heart.fill")
                .font(.system(size: size * 0.45))
                .foregroundColor(cRose)
                .frame(width: size, height: size)
                .background(
                    RoundedRectangle(cornerRadius: size * 0.3, style: .continuous)
                        .fill(cCream)
                        .overlay(
                            RoundedRectangle(cornerRadius: size * 0.3)
                                .stroke(cRose.opacity(0.6), style: StrokeStyle(lineWidth: 1.5, dash: [3, 3]))
                        )
                )
        }
    }
}

// ── 홈: 중형(메인) ──
struct MediumView: View {
    let e: KkomEntry
    var body: some View {
        if let s = e.state {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Link(destination: URL(string: "kkommorning://home")!) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(ddayText(s, at: e.date))
                                .font(.system(size: 34, weight: .heavy, design: .rounded)).foregroundStyle(cInk)
                            if let g = s.airGrade {
                                HStack(spacing: 4) {
                                    Image(systemName: "sun.max.fill").font(.system(size: 11)).foregroundStyle(cRose)
                                    Text("\(s.airLoc ?? "") 미세 \(g)\(s.weatherTemp != nil ? ", \(s.weatherTemp!)°" : "")")
                                        .font(.system(size: 12, weight: .medium)).foregroundStyle(cInkSoft).lineLimit(1)
                                }
                            }
                        }
                    }
                    Spacer(minLength: 0)
                    if let mood = s.partnerMood {
                        Text("오늘 \(s.partnerName) \(mood)").font(.system(size: 12, weight: .semibold)).foregroundStyle(cInkSoft)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .trailing, spacing: 8) {
                    StatusBadge(s: s, date: e.date, compact: true)
                    if #available(iOS 17.0, *) { HeartSendButton() }
                    Spacer(minLength: 0)
                    if let t = s.nextEventTitle, let d = eventDText(s, at: e.date) {
                        Link(destination: URL(string: "kkommorning://calendar")!) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(t).font(.system(size: 12, weight: .bold)).foregroundStyle(cInk).lineLimit(1)
                                Text(d).font(.system(size: 15, weight: .heavy, design: .rounded)).foregroundStyle(cRose)
                            }
                            .padding(8).background(cCard).clipShape(RoundedRectangle(cornerRadius: 12))
                            .rotationEffect(.degrees(2))
                        }
                    }
                }
            }
        } else { SetupView() }
    }
}

// ── 홈: 소형 ──
struct SmallView: View {
    let e: KkomEntry
    var body: some View {
        if let s = e.state {
            VStack(spacing: 6) {
                StatusBadge(s: s, date: e.date, compact: true)
                Spacer(minLength: 0)
                Text(ddayText(s, at: e.date)).font(.system(size: 40, weight: .heavy, design: .rounded)).foregroundStyle(cInk)
                Spacer(minLength: 0)
                if let t = s.nextEventTitle, let d = eventDText(s, at: e.date) {
                    Text("\(t) \(d)").font(.system(size: 11, weight: .semibold)).foregroundStyle(cInkSoft).lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .overlay(alignment: .bottomTrailing) {
                if #available(iOS 17.0, *) { HeartSendButton(size: 28).padding(4) }
            }
        } else { SetupView() }
    }
}

// ── 홈: 대형 ──
struct LargeView: View {
    let e: KkomEntry
    var body: some View {
        if e.state != nil {
            VStack(spacing: 10) {
                MediumView(e: e)
                Rectangle().fill(cSlate.opacity(0.15)).frame(height: 1)
                Link(destination: URL(string: "kkommorning://canvas")!) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 18).fill(cCream)
                        RoundedRectangle(cornerRadius: 18).stroke(cSlate.opacity(0.15), lineWidth: 1)
                        VStack(spacing: 6) {
                            Image(systemName: "pencil.and.scribble").font(.system(size: 26)).foregroundStyle(cRose)
                            Text("우리 낙서장 열기").font(.system(size: 13, weight: .bold)).foregroundStyle(cInkSoft)
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        } else { SetupView() }
    }
}

// ── 잠금화면 ──
struct AccessoryCircularView: View {
    let e: KkomEntry
    var body: some View {
        if let s = e.state {
            ZStack {
                AccessoryWidgetBackground()
                VStack(spacing: 0) {
                    Image(systemName: isOnline(s, at: e.date) ? "heart.fill" : "heart").font(.system(size: 13))
                    Text(ddayText(s, at: e.date).replacingOccurrences(of: "D", with: ""))
                        .font(.system(size: 13, weight: .bold)).minimumScaleFactor(0.6)
                }
            }
        } else { Image(systemName: "heart") }
    }
}
struct AccessoryRectView: View {
    let e: KkomEntry
    var body: some View {
        if let s = e.state {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Image(systemName: isOnline(s, at: e.date) ? "heart.fill" : "heart").font(.system(size: 12))
                    Text(isOnline(s, at: e.date) ? "\(s.partnerName) 지금 함께" : "\(s.partnerName) · \(agoText(s, at: e.date))")
                        .font(.system(size: 14, weight: .semibold)).lineLimit(1)
                }
                if let t = s.nextEventTitle, let d = eventDText(s, at: e.date) {
                    Text("\(t) \(d)").font(.system(size: 13, weight: .bold)).lineLimit(1)
                } else {
                    Text(ddayText(s, at: e.date)).font(.system(size: 13, weight: .bold))
                }
            }
        } else { Text("꼼모닝") }
    }
}
struct AccessoryInlineView: View {
    let e: KkomEntry
    var body: some View {
        if let s = e.state {
            Label(isOnline(s, at: e.date) ? "\(s.partnerName) 함께 · \(ddayText(s, at: e.date))"
                                          : "\(s.partnerName) \(agoText(s, at: e.date)) · \(ddayText(s, at: e.date))",
                  systemImage: isOnline(s, at: e.date) ? "heart.fill" : "heart")
        } else { Text("꼼모닝 💚") }
    }
}

struct SetupView: View {
    var body: some View {
        VStack(spacing: 4) {
            Text("💚").font(.system(size: 26))
            Text("앱을 한 번 열어주세요").font(.system(size: 12, weight: .semibold))
                .foregroundStyle(cInkSoft).multilineTextAlignment(.center)
        }
    }
}

// ── 진입 뷰 (패밀리 분기) ──
struct KkomWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: KkomEntry
    var body: some View {
        switch family {
        case .systemSmall: SmallView(e: entry)
        case .systemMedium: MediumView(e: entry)
        case .systemLarge: LargeView(e: entry)
        case .accessoryCircular: AccessoryCircularView(e: entry)
        case .accessoryRectangular: AccessoryRectView(e: entry)
        case .accessoryInline: AccessoryInlineView(e: entry)
        default: MediumView(e: entry)
        }
    }
}

struct KkomWidget: Widget {
    let kind = "KkomWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                KkomWidgetEntryView(entry: entry).containerBackground(cCream, for: .widget)
            } else {
                KkomWidgetEntryView(entry: entry).padding().background(cCream)
            }
        }
        .configurationDisplayName("꼼모닝")
        .description("우리 접속·D-day·일정을 한눈에")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge,
                            .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}
