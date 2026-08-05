import AppIntents
import Foundation

// 위젯 하트 버튼(iOS17+ 인터랙티브) — 앱 안 열고 상대에게 하트.
// 워치 fling+notifyHeart와 동일: Firestore liveHearts(둘 다 접속 시 실시간 폭탄) + /api/heart(잠금기기 푸시).
@available(iOS 17.0, *)
struct SendHeartIntent: AppIntent {
    static var title: LocalizedStringResource = "하트 보내기"
    static var description = IntentDescription("상대에게 하트를 보냅니다.")
    static var openAppWhenRun = false   // 위젯 탭해도 앱 안 열림

    func perform() async throws -> some IntentResult {
        guard let s = loadKkomState() else { return .result() }
        let to = s.partnerName
        let me = (s.partnerName == "꼼이") ? "우댕" : "꼼이"
        await KkomHeart.send(from: me, to: to)
        return .result()
    }
}

// 하트 전송 — Firestore(실시간) + 웹 /api/heart(푸시) 동시.
enum KkomHeart {
    static let projectId = "kkom-morning"
    static let apiKey = "AIzaSyBaIIIwJ5x19svwkmUvVtuQSio0VPcRkQg"   // 공개값(웹 번들에도 노출)
    static let webBase = "https://kkommorning-v2.vercel.app"

    static func send(from: String, to: String) async {
        async let a: Void = fling(from: from, to: to)
        async let b: Void = notifyHeart(from: from, to: to)
        _ = await (a, b)
    }

    // Firestore liveHearts/{to} 덮어쓰기(nonce 매번 새로) — 웹 throwHeart/워치 fling과 동일 스키마.
    static func fling(from: String, to: String) async {
        let enc = to.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? to
        guard let url = URL(string:
            "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents/liveHearts/\(enc)?key=\(apiKey)")
        else { return }
        let nonce = "\(Int64(Date().timeIntervalSince1970 * 1000))_wg\(Int.random(in: 100000...999999))"
        let iso = ISO8601DateFormatter(); iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let body: [String: Any] = ["fields": [
            "from":  ["stringValue": from],
            "nonce": ["stringValue": nonce],
            "at":    ["timestampValue": iso.string(from: Date())],
            "emoji": ["stringValue": "❤️"],
        ]]
        var req = URLRequest(url: url); req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: req)
    }

    // 상대 잠금 기기 푸시(서버 쿨다운 20초).
    static func notifyHeart(from: String, to: String) async {
        guard let url = URL(string: "\(webBase)/api/heart") else { return }
        var req = URLRequest(url: url); req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["from": from, "to": to])
        _ = try? await URLSession.shared.data(for: req)
    }
}
