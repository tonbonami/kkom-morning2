import ActivityKit
import Foundation

// Live Activity 데이터 정의 — ⚠️ 앱 타깃 + 위젯확장 타깃 둘 다에 멤버여야 함(안 그러면 렌더 안 됨).
// 제미나이 시안(대기질·기온 헤드라인) 형태. online/agoText/dday/skyEmoji는 파이프라인에서 미리 계산해 넣음.
struct KkomActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var partnerName: String
        var online: Bool
        var agoText: String
        var dday: String            // "D+1044"
        var airGrade: String?
        var airLoc: String?
        var pm10: Int?
        var pm25: Int?
        var temp: Int?
        var skyEmoji: String
        var rainEmoji: String?
        var partnerMood: String?
    }
}
