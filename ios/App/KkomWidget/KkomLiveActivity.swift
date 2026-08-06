import SwiftUI
import ActivityKit
import WidgetKit

// 꼼모닝 Live Activity — 디자인: Gemini(대기질·기온 헤드라인). 데이터는 파이프라인에서 미리 계산해 넣음.

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

// MARK: - Lock Screen Banner View
@available(iOS 16.2, *)
struct LockLiveView: View {
    let state: KkomActivityAttributes.ContentState

    var body: some View {
        HStack(alignment: .top) {
            // 1. 좌측: 메인 정보 (기온, 날씨, 미세먼지)
            VStack(alignment: .leading, spacing: 6) {
                // 기온 & 날씨 헤드라인
                HStack(spacing: 4) {
                    Text(state.skyEmoji).font(.title2)
                    Text("\(state.temp ?? 0)°")
                        .font(.system(size: 34, weight: .black, design: .rounded))
                        .foregroundColor(.cInk)
                        .tracking(-1)

                    if let rain = state.rainEmoji {
                        Text(rain).font(.title3)
                    }
                }

                // 미세먼지 등급 (색상 강조)
                HStack(spacing: 6) {
                    Text(state.airGrade ?? "정보 없음")
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundColor(.airColor(grade: state.airGrade))

                    Text("미세 \(state.pm10 ?? 0) · 초미세 \(state.pm25 ?? 0)")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.cInkSoft)
                }

                // 보조 정보: 위치 및 D-day 배지
                HStack(spacing: 8) {
                    Text(state.airLoc ?? "")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.cInkSoft)

                    Text(state.dday)
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.cRose.opacity(0.15))
                        .foregroundColor(.cRose)
                        .clipShape(Capsule())
                }
            }

            Spacer()

            // 2. 우측: 상대방 상태 (접속, 기분, 텍스트)
            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 4) {
                    // 온라인 상태 점 (에메랄드)
                    if state.online {
                        Circle()
                            .fill(Color.airColor(grade: "좋음"))
                            .frame(width: 8, height: 8)
                            .shadow(color: Color.airColor(grade: "좋음").opacity(0.5), radius: 2)
                    }

                    Text(state.partnerName)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.cInk)

                    if let mood = state.partnerMood {
                        Text(mood).font(.system(size: 14))
                    }
                }

                Text(state.agoText)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.cInkSoft)
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
            // 1. 잠금화면 (Lock Screen) 뷰
            LockLiveView(state: context.state)
        } dynamicIsland: { context in
            // 2. 다이나믹 아일랜드 (Dynamic Island)
            DynamicIsland {
                // 펼침(Expanded) 상태 - 4개 영역 조합
                DynamicIslandExpandedRegion(.leading) {
                    HStack(alignment: .center, spacing: 4) {
                        Text(context.state.skyEmoji).font(.title3)
                        Text("\(context.state.temp ?? 0)°")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(context.state.online ? Color.airColor(grade: "좋음") : .gray)
                            .frame(width: 8, height: 8)

                        if let mood = context.state.partnerMood {
                            Text(mood).font(.body)
                        }
                    }
                    .padding(.top, 4)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 0) {
                        Text(context.state.airGrade ?? "")
                            .font(.system(size: 26, weight: .heavy))
                            .foregroundColor(.airColor(grade: context.state.airGrade))
                        Text(context.state.airLoc ?? "")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.gray)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.state.dday)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.cRose)
                        Spacer()
                        Text(context.state.agoText)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal, 8)
                }
            } compactLeading: {
                // 아주 좁은 좌측 (하트/접속)
                Image(systemName: context.state.online ? "heart.fill" : "heart")
                    .foregroundColor(context.state.online ? .airColor(grade: "좋음") : .cRose)
            } compactTrailing: {
                // 아주 좁은 우측 (미세먼지 등급 글자색으로 표현)
                Text(context.state.airGrade ?? "")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundColor(.airColor(grade: context.state.airGrade))
            } minimal: {
                // 원형 (최소 상태)
                Image(systemName: context.state.online ? "heart.fill" : "heart")
                    .foregroundColor(.cRose)
            }
        }
    }
}
