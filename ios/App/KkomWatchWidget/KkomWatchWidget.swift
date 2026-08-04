import WidgetKit
import SwiftUI

// 꼼모닝 워치 컴플리케이션 — 워치 앱이 앱그룹에 남긴 스냅샷(kkomWatchState)을 읽어 렌더.
// 문자판에 상시 접속 상태 + D-day. (KkomWidget의 accessory 로직 재사용·축약)
private let APP_GROUP = "group.com.tonbonami.kkommorning"

struct WatchSnap {
    var partnerName: String
    var partnerLastSeenMs: Double
    var partnerActive: Bool
    var serverMs: Double
    var deviceMs: Double
    var ddayDate: String
}

func loadWatchSnap() -> WatchSnap? {
    guard let d = UserDefaults(suiteName: APP_GROUP)?.data(forKey: "kkomWatchState"),
          let o = try? JSONSerialization.jsonObject(with: d) as? [String: Any] else { return nil }
    return WatchSnap(
        partnerName:       o["partnerName"] as? String ?? "",
        partnerLastSeenMs: (o["partnerLastSeenMs"] as? NSNumber)?.doubleValue ?? 0,
        partnerActive:     o["partnerActive"] as? Bool ?? false,
        serverMs:          (o["serverMs"] as? NSNumber)?.doubleValue ?? 0,
        deviceMs:          (o["deviceMs"] as? NSNumber)?.doubleValue ?? 0,
        ddayDate:          o["ddayDate"] as? String ?? "2023-09-28"
    )
}

// ── 계산 (시계오차 보정) ──
private func serverNow(_ s: WatchSnap, at date: Date) -> Double {
    s.serverMs + (date.timeIntervalSince1970 * 1000 - s.deviceMs)
}
private func isOnline(_ s: WatchSnap, at date: Date) -> Bool {
    s.partnerActive && (serverNow(s, at: date) - s.partnerLastSeenMs < 90_000)
}
private func ddayText(_ s: WatchSnap, at date: Date) -> String {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = TimeZone(identifier: "Asia/Seoul")
    var cal = Calendar(identifier: .gregorian); cal.timeZone = TimeZone(identifier: "Asia/Seoul")!
    guard let t = f.date(from: s.ddayDate) else { return "D-day" }
    let now = Date(timeIntervalSince1970: serverNow(s, at: date) / 1000)
    let n = cal.dateComponents([.day], from: cal.startOfDay(for: t), to: cal.startOfDay(for: now)).day ?? 0
    return "D+\(n + 1)"
}
private func agoText(_ s: WatchSnap, at date: Date) -> String {
    if s.partnerLastSeenMs <= 0 { return "대기 중" }   // 상대 기록 없을 때 쓰레기값 방지
    let m = max(1, Int(max(0, serverNow(s, at: date) - s.partnerLastSeenMs) / 60_000))
    if m < 60 { return "\(m)분 전" }
    let h = m / 60; if h < 24 { return "\(h)시간 전" }
    let d = h / 24; if d == 1 { return "어제" }; if d < 7 { return "\(d)일 전" }
    return "\(d / 7)주 전"
}

// ── Timeline ──
struct Entry: TimelineEntry { let date: Date; let snap: WatchSnap? }
struct Provider: TimelineProvider {
    func placeholder(in c: Context) -> Entry { Entry(date: Date(), snap: nil) }
    func getSnapshot(in c: Context, completion: @escaping (Entry) -> Void) {
        completion(Entry(date: Date(), snap: loadWatchSnap()))
    }
    func getTimeline(in c: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let s = loadWatchSnap(); let now = Date()
        var entries: [Entry] = []
        for m in stride(from: 0, through: 30, by: 5) {
            entries.append(Entry(date: now.addingTimeInterval(Double(m) * 60), snap: s))
        }
        completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(15 * 60))))
    }
}

// ── 패밀리별 뷰 ──
struct CircularV: View {
    let e: Entry
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            if let s = e.snap {
                VStack(spacing: 0) {
                    Image(systemName: isOnline(s, at: e.date) ? "heart.fill" : "heart").font(.system(size: 12))
                    Text(ddayText(s, at: e.date).replacingOccurrences(of: "D+", with: ""))
                        .font(.system(size: 13, weight: .bold)).minimumScaleFactor(0.5)
                }
            } else { Image(systemName: "heart") }
        }
    }
}
struct RectV: View {
    let e: Entry
    var body: some View {
        if let s = e.snap {
            HStack(spacing: 6) {
                Image(systemName: isOnline(s, at: e.date) ? "heart.fill" : "heart")
                VStack(alignment: .leading, spacing: 1) {
                    Text(isOnline(s, at: e.date) ? "\(s.partnerName) 지금 함께"
                                                 : "\(s.partnerName) · \(agoText(s, at: e.date))")
                        .font(.system(size: 14, weight: .semibold)).lineLimit(1)
                    Text(ddayText(s, at: e.date)).font(.system(size: 13, weight: .bold))
                }
            }
        } else { Text("꼼모닝 열기") }
    }
}
struct InlineV: View {
    let e: Entry
    var body: some View {
        if let s = e.snap {
            Label(isOnline(s, at: e.date) ? "함께 · \(ddayText(s, at: e.date))"
                                          : "\(agoText(s, at: e.date)) · \(ddayText(s, at: e.date))",
                  systemImage: isOnline(s, at: e.date) ? "heart.fill" : "heart")
        } else { Text("꼼모닝 💚") }
    }
}
struct CornerV: View {
    let e: Entry
    var body: some View {
        if let s = e.snap {
            Text(ddayText(s, at: e.date))
                .font(.system(size: 15, weight: .bold))
                .widgetCurvesContent()
                .widgetLabel(isOnline(s, at: e.date) ? "지금 함께 💚" : "\(s.partnerName) \(agoText(s, at: e.date))")
        } else { Image(systemName: "heart") }
    }
}

struct KkomWatchWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: Entry
    var body: some View {
        switch family {
        case .accessoryCircular:    CircularV(e: entry)
        case .accessoryRectangular: RectV(e: entry)
        case .accessoryInline:      InlineV(e: entry)
        case .accessoryCorner:      CornerV(e: entry)
        default:                    RectV(e: entry)
        }
    }
}

@main
struct KkomWatchWidgetBundle: WidgetBundle {
    var body: some Widget { KkomWatchWidget() }
}

struct KkomWatchWidget: Widget {
    let kind = "KkomWatchWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            KkomWatchWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("꼼모닝")
        .description("접속·D-day를 손목에")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner])
    }
}
