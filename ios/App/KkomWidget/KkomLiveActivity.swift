import ActivityKit
import WidgetKit
import SwiftUI

// 꼼모닝 Live Activity — 잠금화면 + 다이나믹 아일랜드. 상대 접속·D-day·미세먼지 라이브.
// 색·시계보정은 KkomWidget과 동일 톤. ContentState 값으로 렌더(갱신 시 재렌더).

private func laDyn(_ light: String, _ dark: String) -> Color {
    Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: dark) : UIColor(hexW: light) })
}
private let laCream = laDyn("#FBF8F2", "#272522")
private let laInk = laDyn("#334155", "#E8E2D8")
private let laInkSoft = laDyn("#64748B", "#B4AA9A")
private let laRose = laDyn("#FB7BA8", "#D94C7A")
private let laEmerald = laDyn("#10B981", "#34D399")
private let laSlate = laDyn("#94A3B8", "#64748B")

private func laServerNow(_ s: KkomActivityAttributes.ContentState) -> Double {
    s.serverMs + (Date().timeIntervalSince1970 * 1000 - s.deviceMs)
}
private func laOnline(_ s: KkomActivityAttributes.ContentState) -> Bool {
    s.partnerActive && (laServerNow(s) - s.partnerLastSeenMs < 90_000)
}
private func laAgo(_ s: KkomActivityAttributes.ContentState) -> String {
    if s.partnerLastSeenMs <= 0 { return "대기 중" }
    let m = max(1, Int(max(0, laServerNow(s) - s.partnerLastSeenMs) / 60_000))
    if m < 60 { return "\(m)분 전" }
    let h = m / 60; if h < 24 { return "\(h)시간 전" }
    let d = h / 24; if d == 1 { return "어제" }; if d < 7 { return "\(d)일 전" }
    return "\(d / 7)주 전"
}
private func laDday(_ s: KkomActivityAttributes.ContentState) -> String {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = TimeZone(identifier: "Asia/Seoul")
    guard let target = f.date(from: s.ddayDate) else { return "D-day" }
    var cal = Calendar(identifier: .gregorian); cal.timeZone = TimeZone(identifier: "Asia/Seoul")!
    let now = Date(timeIntervalSince1970: laServerNow(s) / 1000)
    let n = cal.dateComponents([.day], from: cal.startOfDay(for: now), to: cal.startOfDay(for: target)).day ?? 0
    return "D+\(1 - n)"
}
private func laStatus(_ s: KkomActivityAttributes.ContentState) -> String {
    laOnline(s) ? "\(s.partnerName) 지금 함께 💚" : "\(s.partnerName) · \(laAgo(s))"
}

// ── 잠금화면(배너) ──
@available(iOS 16.2, *)
struct LockLiveView: View {
    let s: KkomActivityAttributes.ContentState
    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(laDday(s)).font(.system(size: 30, weight: .heavy, design: .rounded)).foregroundStyle(laInk)
                if let g = s.airGrade {
                    HStack(spacing: 4) {
                        Image(systemName: "wind").font(.system(size: 10)).foregroundStyle(laRose)
                        Text("\(s.airLoc ?? "") 미세 \(g)").font(.system(size: 12, weight: .medium))
                            .foregroundStyle(laInkSoft).lineLimit(1)
                    }
                }
            }
            Spacer(minLength: 0)
            VStack(alignment: .trailing, spacing: 6) {
                HStack(spacing: 5) {
                    Image(systemName: laOnline(s) ? "heart.fill" : "heart")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(laOnline(s) ? laEmerald : laSlate)
                    Text(laStatus(s)).font(.system(size: 13, weight: .bold))
                        .foregroundStyle(laOnline(s) ? laEmerald : laSlate).lineLimit(1)
                }
                if let mood = s.partnerMood {
                    Text("오늘 \(s.partnerName) \(mood)").font(.system(size: 12, weight: .semibold)).foregroundStyle(laInkSoft)
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }
}

@available(iOS 16.2, *)
struct KkomLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: KkomActivityAttributes.self) { context in
            LockLiveView(s: context.state)
                .activityBackgroundTint(laCream)
                .activitySystemActionForegroundColor(laRose)
        } dynamicIsland: { context in
            let s = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Image(systemName: laOnline(s) ? "heart.fill" : "heart")
                            .foregroundStyle(laOnline(s) ? laEmerald : laSlate)
                        Text(laDday(s)).font(.system(size: 17, weight: .heavy, design: .rounded))
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if let g = s.airGrade {
                        VStack(alignment: .trailing, spacing: 1) {
                            Text(s.airLoc ?? "미세").font(.system(size: 10, weight: .medium)).foregroundStyle(.secondary)
                            Text(g).font(.system(size: 14, weight: .bold))
                        }
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(laStatus(s)).font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(laOnline(s) ? laEmerald : laInkSoft)
                }
            } compactLeading: {
                Image(systemName: laOnline(s) ? "heart.fill" : "heart")
                    .foregroundStyle(laOnline(s) ? laEmerald : laSlate)
            } compactTrailing: {
                Text(laDday(s)).font(.system(size: 13, weight: .bold))
            } minimal: {
                Image(systemName: laOnline(s) ? "heart.fill" : "heart")
                    .foregroundStyle(laOnline(s) ? laEmerald : laSlate)
            }
            .widgetURL(URL(string: "kkommorning://home"))
        }
    }
}
