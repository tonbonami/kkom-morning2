import ActivityKit
import Foundation

// Live Activity 데이터 정의 — ⚠️ 앱 타깃 + 위젯확장 타깃 둘 다에 멤버여야 함(안 그러면 렌더 안 됨).
// ContentState = 라이브로 바뀌는 값. 시계오차는 serverMs/deviceMs로 보정(위젯 스냅샷과 동일 방식).
struct KkomActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var partnerName: String
        var partnerActive: Bool
        var partnerLastSeenMs: Double
        var serverMs: Double
        var deviceMs: Double
        var ddayDate: String        // "YYYY-MM-DD"
        var airGrade: String?
        var airLoc: String?
        var partnerMood: String?    // 이모지
    }

    var title: String = "꼼모닝"
}
