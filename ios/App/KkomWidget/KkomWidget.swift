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
struct KkomEntry: TimelineEntry { let date: Date; let state: KkomState?; var sentKind: String? = nil }

struct Provider: TimelineProvider {
    func placeholder(in c: Context) -> KkomEntry { KkomEntry(date: Date(), state: nil) }
    func getSnapshot(in c: Context, completion: @escaping (KkomEntry) -> Void) {
        completion(KkomEntry(date: Date(), state: loadKkomState()))
    }
    func getTimeline(in c: Context, completion: @escaping (Timeline<KkomEntry>) -> Void) {
        let st = loadKkomState()
        let now = Date()
        var entries: [KkomEntry] = []
        // 방금 위젯에서 보낸 게 있으면 4초간 '보냈어 ✓'를 심고, 그 뒤 원래대로 되돌린다.
        //   ⚠️ iOS17은 perform() 뒤 타임라인을 자동 리드로우하지만 '원래대로' 스스로 안 돌아온다 →
        //      되돌리는 엔트리를 직접 심는다. 그리고 그 마지막 엔트리보다 '이른' 5분 엔트리는 건너뛴다 —
        //      날짜가 역행하면 타임라인이 통째로 무시된다(사이담 교훈).
        var floor = now
        if let kind = WidgetSent.recent(within: 4000, at: now) {
            entries.append(KkomEntry(date: now, state: st, sentKind: kind))
            let revert = max(Date(timeIntervalSince1970: WidgetSent.sentAtMs() / 1000 + 4),
                             now.addingTimeInterval(0.5))
            entries.append(KkomEntry(date: revert, state: st, sentKind: nil))
            floor = revert
        }
        for m in stride(from: 0, through: 30, by: 5) {
            let d = now.addingTimeInterval(Double(m) * 60)
            if d <= floor { continue }
            entries.append(KkomEntry(date: d, state: st, sentKind: nil))
        }
        if entries.isEmpty { entries.append(KkomEntry(date: now, state: st, sentKind: nil)) }
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
    var sentKind: String? = nil   // "heart"면 방금 보낸 것 → ✓ 오버레이

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
                .overlay {
                    if sentKind == "heart" {
                        ZStack {
                            Circle().fill(cEmerald)
                            Image(systemName: "checkmark").font(.system(size: size * 0.42, weight: .bold)).foregroundStyle(.white)
                        }
                    }
                }
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

// ── 위젯 범프 버튼 (iOS17+ 인터랙티브 — 앱 안 열고 상대에게 보고싶어·사랑해·안아줘·뽀뽀) ──
//   ⚠️ 폭을 '고정으로 박지 않는다' — maxWidth:.infinity 로 칸이 신축한다(사이담 교훈: 고정이면 슬롯 늘 때 잘림).
//   ⚠️ 탭 영역 HIG 최소 44pt 이상(minHeight 46). '누르는 게 제일 큰' 요소여야 한다.
@available(iOS 17.0, *)
struct BumpButton: View {
    let kind: String; let emoji: String; let label: String
    var sentKind: String? = nil   // 이 kind를 방금 보냈으면 ✓ 오버레이(라벨은 그대로 두고 위에 얹는다)
    var body: some View {
        Button(intent: SendBumpIntent(kind: kind)) {
            VStack(spacing: 2) {
                Text(emoji).font(.system(size: 21))
                Text(label).font(.system(size: 9, weight: .bold)).foregroundStyle(cInkSoft).lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, minHeight: 46)
            .background(cCard)
            .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 13, style: .continuous).stroke(cMint.opacity(0.55), lineWidth: 1))
            .overlay {
                if sentKind == kind {
                    ZStack {
                        RoundedRectangle(cornerRadius: 13, style: .continuous).fill(cEmerald)
                        VStack(spacing: 1) {
                            Image(systemName: "checkmark").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                            Text("보냈어").font(.system(size: 9, weight: .bold)).foregroundStyle(.white)
                        }
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }
}
@available(iOS 17.0, *)
struct BumpRow: View {
    var sentKind: String? = nil
    var body: some View {
        HStack(spacing: 5) {
            BumpButton(kind: "miss", emoji: "💗", label: "보고싶어", sentKind: sentKind)
            BumpButton(kind: "love", emoji: "❤️", label: "사랑해", sentKind: sentKind)
            BumpButton(kind: "hug",  emoji: "🤗", label: "안아줘", sentKind: sentKind)
            BumpButton(kind: "kiss", emoji: "😘", label: "뽀뽀", sentKind: sentKind)
            BumpButton(kind: "night", emoji: "🌙", label: "잘자", sentKind: sentKind)
        }
    }
}

// ── 홈: 중형(메인) — 상단은 정보(작게), 하단 범프 줄이 '탭 대상'으로 제일 크다 ──
//   하트는 범프 줄 '밖'(우상단)에 둔다 — 하트=고정 액션, 범프=고르는 것, 섞으면 헷갈린다(사이담).
struct MediumView: View {
    let e: KkomEntry
    var body: some View {
        if let s = e.state {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top, spacing: 10) {
                    Link(destination: URL(string: "kkommorning://home")!) {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(ddayText(s, at: e.date))
                                .font(.system(size: 26, weight: .heavy, design: .rounded)).foregroundStyle(cInk)
                            if let g = s.airGrade {
                                HStack(spacing: 4) {
                                    Image(systemName: "sun.max.fill").font(.system(size: 10)).foregroundStyle(cRose)
                                    Text("\(s.airLoc ?? "") 미세 \(g)\(s.weatherTemp != nil ? ", \(s.weatherTemp!)°" : "")")
                                        .font(.system(size: 11, weight: .medium)).foregroundStyle(cInkSoft).lineLimit(1)
                                }
                            }
                        }
                    }
                    Spacer(minLength: 0)
                    VStack(alignment: .trailing, spacing: 6) {
                        StatusBadge(s: s, date: e.date, compact: true)
                        if #available(iOS 17.0, *) { HeartSendButton(size: 32, sentKind: e.sentKind) }
                    }
                }
                Spacer(minLength: 0)
                if #available(iOS 17.0, *) { BumpRow(sentKind: e.sentKind) }
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
                if #available(iOS 17.0, *) { HeartSendButton(size: 28, sentKind: e.sentKind).padding(4) }
            }
        } else { SetupView() }
    }
}

// ── 홈: 대형 — 정보 밀도 유지(중형에서 뺀 기분·일정 카드를 여기 살림) + 범프 줄 + 낙서장 ──
struct LargeView: View {
    let e: KkomEntry
    var body: some View {
        if let s = e.state {
            VStack(alignment: .leading, spacing: 10) {
                // 상단: D+ 크게 + 상태 + 하트(범프 줄 밖)
                HStack(alignment: .top, spacing: 10) {
                    Link(destination: URL(string: "kkommorning://home")!) {
                        VStack(alignment: .leading, spacing: 3) {
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
                    VStack(alignment: .trailing, spacing: 6) {
                        StatusBadge(s: s, date: e.date, compact: true)
                        if #available(iOS 17.0, *) { HeartSendButton(size: 34, sentKind: e.sentKind) }
                    }
                }

                // 기분 + 다음 일정 카드 (중형에서 뺀 것 — 대형엔 자리가 있어 살린다)
                HStack(alignment: .center, spacing: 8) {
                    if let mood = s.partnerMood {
                        Text("오늘 \(s.partnerName) \(mood)").font(.system(size: 12, weight: .semibold)).foregroundStyle(cInkSoft).lineLimit(1)
                    }
                    Spacer(minLength: 0)
                    if let t = s.nextEventTitle, let d = eventDText(s, at: e.date) {
                        Link(destination: URL(string: "kkommorning://calendar")!) {
                            HStack(spacing: 6) {
                                Text(t).font(.system(size: 12, weight: .bold)).foregroundStyle(cInk).lineLimit(1)
                                Text(d).font(.system(size: 14, weight: .heavy, design: .rounded)).foregroundStyle(cRose)
                            }
                            .padding(.horizontal, 10).padding(.vertical, 6).background(cCard).clipShape(Capsule())
                        }
                    }
                }

                Spacer(minLength: 0)
                // 범프 줄 (탭 대상)
                if #available(iOS 17.0, *) { BumpRow(sentKind: e.sentKind) }

                // 낙서장 바로가기
                Link(destination: URL(string: "kkommorning://canvas")!) {
                    HStack(spacing: 6) {
                        Image(systemName: "pencil.and.scribble").font(.system(size: 14)).foregroundStyle(cRose)
                        Text("우리 낙서장 열기").font(.system(size: 12, weight: .bold)).foregroundStyle(cInkSoft)
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 9)
                    .frame(maxWidth: .infinity)
                    .background(RoundedRectangle(cornerRadius: 14).fill(cCream).overlay(RoundedRectangle(cornerRadius: 14).stroke(cSlate.opacity(0.15), lineWidth: 1)))
                }
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
