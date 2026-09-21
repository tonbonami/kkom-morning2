import AppIntents
import Foundation
import WidgetKit

// ── 위젯 '보냈어 ✓' 피드백 상태 (앱그룹 공유) ──
// iOS는 위젯 버튼 눌린 상태를 안 그려준다. 그래서 '방금 무엇을 보냈나'를 앱그룹에 적어두고
// 위젯이 4초간 그 칸에 ✓를 그린다.
// ⚠️ 2xx 성공일 때만 mark — 안 간 걸 갔다고 하는 게 제일 나쁘다(사이담 교훈).
// ⚠️ 한 화면에 피드백 있는 버튼/없는 버튼을 섞으면 없는 쪽이 '고장난 버튼'으로 읽힌다 →
//    범프뿐 아니라 '하트'에도 반드시 ✓를 붙인다(kind="heart").
enum WidgetSent {
    static let APP_GROUP = "group.com.tonbonami.kkommorning"
    static func mark(_ kind: String) {
        let d = UserDefaults(suiteName: APP_GROUP)
        d?.set(kind, forKey: "widgetSentKind")
        d?.set(Date().timeIntervalSince1970 * 1000, forKey: "widgetSentAtMs")
        WidgetCenter.shared.reloadAllTimelines()
    }
    static func sentAtMs() -> Double { UserDefaults(suiteName: APP_GROUP)?.double(forKey: "widgetSentAtMs") ?? 0 }
    // 최근 within(ms) 안에 보낸 kind (아니면 nil)
    static func recent(within ms: Double, at date: Date) -> String? {
        let d = UserDefaults(suiteName: APP_GROUP)
        guard let kind = d?.string(forKey: "widgetSentKind") else { return nil }
        let at = sentAtMs(); if at <= 0 { return nil }
        let elapsed = date.timeIntervalSince1970 * 1000 - at
        return (elapsed >= 0 && elapsed < ms) ? kind : nil
    }
}

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
        async let a = fling(from: from, to: to)
        async let b = notifyHeart(from: from, to: to)
        let (okA, okB) = await (a, b)
        if okA || okB { WidgetSent.mark("heart") }   // ✅ 하나라도 2xx면 '보냈어 ✓'
    }

    // Firestore liveHearts/{to} 덮어쓰기(nonce 매번 새로) — 웹 throwHeart/워치 fling과 동일 스키마.
    @discardableResult
    static func fling(from: String, to: String) async -> Bool {
        let enc = to.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? to
        guard let url = URL(string:
            "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents/liveHearts/\(enc)?key=\(apiKey)")
        else { return false }
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
        if let (_, resp) = try? await URLSession.shared.data(for: req),
           let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) { return true }
        return false
    }

    // 상대 잠금 기기 푸시(서버 쿨다운 20초).
    @discardableResult
    static func notifyHeart(from: String, to: String) async -> Bool {
        guard let url = URL(string: "\(webBase)/api/heart") else { return false }
        var req = URLRequest(url: url); req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["from": from, "to": to])
        if let (_, resp) = try? await URLSession.shared.data(for: req),
           let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) { return true }
        return false
    }
}

// ── 위젯 범프 버튼(iOS17+ 인터랙티브) — 앱 안 열고 상대에게 범프(보고싶어·사랑해·안아줘·뽀뽀).
//   하트와 달리 서버(/api/bump)가 푸시+liveBumps를 한 번에 처리하므로 위젯은 POST 하나면 된다.
// ⚠️ kind는 enum이 아니라 String — 새 범프 종류를 늘려도 앱을 새로 올릴 필요 없게(사이담 교훈).
//    서버가 모르는 kind는 miss로 처리하므로 안전하다.
@available(iOS 17.0, *)
struct SendBumpIntent: AppIntent {
    static var title: LocalizedStringResource = "범프 보내기"
    static var description = IntentDescription("상대에게 범프(보고싶어·사랑해 등)를 보냅니다.")
    static var openAppWhenRun = false

    @Parameter(title: "종류") var kind: String

    init() { self.kind = "miss" }
    init(kind: String) { self.kind = kind }

    func perform() async throws -> some IntentResult {
        guard let s = loadKkomState() else { return .result() }
        let to = s.partnerName
        let me = (s.partnerName == "꼼이") ? "우댕" : "꼼이"
        await KkomBump.send(from: me, to: to, kind: kind)
        return .result()
    }
}

enum KkomBump {
    static let webBase = "https://kkommorning-v2.vercel.app"
    // 서버가 나머지(푸시·워치·liveBumps·집계)를 다 함 — 위젯은 '누가·누구에게·무슨 범프'만 넘긴다.
    static func send(from: String, to: String, kind: String) async {
        guard let url = URL(string: "\(webBase)/api/bump") else { return }
        var req = URLRequest(url: url); req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["from": from, "to": to, "kind": kind])
        // ✅ 2xx 성공일 때만 '보냈어 ✓' 기록 — 결과를 버리면(_ = try?) 실패해도 ✓가 떠 거짓말이 된다.
        if let (_, resp) = try? await URLSession.shared.data(for: req),
           let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) {
            WidgetSent.mark(kind)
        }
    }
}
