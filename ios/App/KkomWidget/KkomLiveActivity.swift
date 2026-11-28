import SwiftUI
import ActivityKit
import WidgetKit

// 꼼모닝 Live Activity — 오래된 값·빈 값을 현재 정보처럼 보이지 않게 구분한다.

// MARK: - Color Tokens (라이트/다크 대응)
extension Color {
    static let cCream = Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#272522") : UIColor(hexW: "#FBF8F2") })
    static let cInk = Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#E8E2D8") : UIColor(hexW: "#334155") })
    static let cInkSoft = Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#B4AA9A") : UIColor(hexW: "#64748B") })
    static let cRose = Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#D94C7A") : UIColor(hexW: "#FB7BA8") })

    static func airColor(grade: String?) -> Color {
        switch grade {
        case "좋음": return Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hexW: "#34D399") : UIColor(hexW: "#10B981") })
        case "보통": return Color(UIColor { _ in UIColor(hexW: "#0EA5E9") })
        case "나쁨": return Color(UIColor { _ in UIColor(hexW: "#FB923C") })
        case "매우 나쁨": return Color(UIColor { _ in UIColor(hexW: "#EF4444") })
        default: return Color(UIColor { _ in UIColor.gray })
        }
    }
}

private extension String {
    var nonEmptyTrimmed: String? {
        let value = trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }
}

// MARK: - Lock Screen Banner View
@available(iOS 16.2, *)
struct LockLiveView: View {
    let state: KkomActivityAttributes.ContentState
    let isStale: Bool

    private var airGrade: String? { state.airGrade?.nonEmptyTrimmed }
    private var airLocation: String? { state.airLoc?.nonEmptyTrimmed }
    private var mood: String? { state.partnerMood?.nonEmptyTrimmed }
    private var partnerName: String { state.partnerName.nonEmptyTrimmed ?? "상대" }
    private var agoText: String? { state.agoText.nonEmptyTrimmed }

    // 왜: stale(마지막 갱신 150초 뒤)은 상대가 더 이상 신호를 안 보낸다는 뜻 → 접속만 꺼진 것으로 본다.
    //   날씨·미세먼지는 아침 크론·앱 열 때 값이라 그대로 보여 준다(우리가 다 지우면 거의 늘 빈 화면).
    private var isOnline: Bool { !isStale && state.online }

    private var particleSummary: String? {
        var parts: [String] = []
        if let pm10 = state.pm10 { parts.append("미세 \(pm10)") }
        if let pm25 = state.pm25 { parts.append("초미세 \(pm25)") }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 6) {
                Group {
                    // 왜: 빈 기온을 0도로 보여 주면 실제 영하·영상 0도와 구분할 수 없다.
                    if let temp = state.temp {
                        HStack(spacing: 4) {
                            Text(state.skyEmoji).font(.title2)
                            Text("\(temp)°")
                                .font(.system(size: 34, weight: .black, design: .rounded))
                                .foregroundColor(.cInk)
                                .tracking(-1)
                            if let rain = state.rainEmoji?.nonEmptyTrimmed {
                                Text(rain).font(.title3)
                            }
                        }
                    } else {
                        Label("날씨 정보 없음", systemImage: "cloud.slash")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundColor(.cInkSoft)
                    }

                    if let grade = airGrade {
                        HStack(spacing: 6) {
                            Text(grade)
                                .font(.system(size: 22, weight: .heavy))
                                .foregroundColor(.airColor(grade: grade))
                            if let summary = particleSummary {
                                Text(summary)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.cInkSoft)
                            }
                        }
                        if let location = airLocation {
                            Text(location)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.cInkSoft)
                        }
                    } else {
                        Text("미세먼지 정보 없음")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.cInkSoft)
                    }
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 4) {
                    Circle()
                        .fill(isOnline ? Color.airColor(grade: "좋음") : Color.gray)
                        .frame(width: 8, height: 8)
                        .shadow(color: isOnline ? Color.airColor(grade: "좋음").opacity(0.5) : Color.clear,
                                radius: 2)
                    Text(partnerName)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.cInk)
                    if let mood = mood {
                        Text(mood).font(.system(size: 14))
                    }
                }

                Text(isOnline ? "지금 함께" : (isStale ? "오프라인" : (agoText ?? "오프라인")))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.cInkSoft)

                if let dday = state.dday.nonEmptyTrimmed {
                    Text(dday)
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.cRose.opacity(0.15))
                        .foregroundColor(.cRose)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(20)
        .background(Color.cCream)
    }
}

// MARK: - Live Activity Widget Configuration
@available(iOS 16.2, *)
struct KkomLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: KkomActivityAttributes.self) { context in
            LockLiveView(state: context.state, isStale: context.isStale)
        } dynamicIsland: { context in
            // 오래됨(150초 동안 신호 없음) = 상대 접속만 꺼진 것. 날씨·미세먼지는 그대로.
            let online = !context.isStale && context.state.online
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(alignment: .center, spacing: 4) {
                        if let temp = context.state.temp {
                            Text(context.state.skyEmoji).font(.title3)
                            Text("\(temp)°")
                                .font(.system(size: 24, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                        } else {
                            Image(systemName: "cloud.slash").foregroundColor(.gray)
                        }
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(online ? Color.airColor(grade: "좋음") : Color.gray)
                            .frame(width: 8, height: 8)
                        if online, let mood = context.state.partnerMood?.nonEmptyTrimmed {
                            Text(mood).font(.body)
                        } else {
                            Text(online ? "함께" : "오프라인")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.gray)
                        }
                    }
                    .padding(.top, 4)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 1) {
                        if let grade = context.state.airGrade?.nonEmptyTrimmed {
                            Text(grade)
                                .font(.system(size: 26, weight: .heavy))
                                .foregroundColor(.airColor(grade: grade))
                            if let location = context.state.airLoc?.nonEmptyTrimmed {
                                Text(location)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(.gray)
                            }
                        } else {
                            Text("미세먼지 정보 없음")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.gray)
                        }
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        if let dday = context.state.dday.nonEmptyTrimmed {
                            Text(dday)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.cRose)
                        }
                        Spacer()
                        Text(online ? "지금 함께" : (context.isStale ? "오프라인" : (context.state.agoText.nonEmptyTrimmed ?? "오프라인")))
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal, 8)
                }
            } compactLeading: {
                // 왜: 작은 화면은 둘의 접속 상태 하나를 가장 먼저 보여 준다.
                Image(systemName: online ? "heart.fill" : "heart")
                    .foregroundColor(online ? Color.airColor(grade: "좋음") : Color.cRose)
            } compactTrailing: {
                Text(online ? "함께" : "오프라인")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundColor(online ? Color.airColor(grade: "좋음") : Color.cRose)
            } minimal: {
                Image(systemName: online ? "heart.fill" : "heart")
                    .foregroundColor(online ? Color.airColor(grade: "좋음") : Color.cRose)
            }
        }
    }
}
