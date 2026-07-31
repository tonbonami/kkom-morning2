import Foundation

// 꼼모닝 워치 — Firestore REST 클라이언트 (Firebase SDK 없이 URLSession).
// presence·liveHearts는 Firestore에 있음(낙서장만 RTDB). 인증 없음 → apiKey만으로 접근.
// apiKey·projectId는 공개값(웹 번들에도 그대로 노출됨).
//   presence/{이름}      = { lastSeenAt: timestamp, active: bool }
//   liveHearts/{받는이}  = { from, nonce, at }   (nonce 바뀌면 하트 도착)
enum Fire {
    static let projectId = "kkom-morning"
    static let apiKey = "AIzaSyBaIIIwJ5x19svwkmUvVtuQSio0VPcRkQg"
    static var base: String {
        "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents"
    }

    static func enc(_ s: String) -> String {
        s.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? s
    }

    struct PresenceResult { var lastSeenMs: Double?; var active: Bool; var serverNowMs: Double }

    // 상대 접속 상태 읽기. 응답 Date 헤더로 서버 현재시각도 함께 얻어 시계오차 보정.
    static func fetchPresence(of name: String) async -> PresenceResult? {
        guard let url = URL(string: "\(base)/presence/\(enc(name))?key=\(apiKey)") else { return nil }
        do {
            let (data, resp) = try await URLSession.shared.data(from: url)
            let serverNow = serverDateMs(resp) ?? Date().timeIntervalSince1970 * 1000
            guard let http = resp as? HTTPURLResponse, http.statusCode == 200,
                  let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let fields = obj["fields"] as? [String: Any] else {
                // 404 등 → 아직 기록 없음(하지만 서버시각은 확보)
                return PresenceResult(lastSeenMs: nil, active: false, serverNowMs: serverNow)
            }
            let active = ((fields["active"] as? [String: Any])?["booleanValue"] as? Bool) ?? false
            var lastSeen: Double? = nil
            if let ts = (fields["lastSeenAt"] as? [String: Any])?["timestampValue"] as? String {
                lastSeen = parseTS(ts)
            }
            return PresenceResult(lastSeenMs: lastSeen, active: active, serverNowMs: serverNow)
        } catch { return nil }
    }

    // 하트 던지기 — 상대 liveHearts doc을 덮어씀(nonce 매번 새로). 웹 throwHeart와 동일 스키마.
    static func sendHeart(from: String, to: String) async {
        guard let url = URL(string: "\(base)/liveHearts/\(enc(to))?key=\(apiKey)") else { return }
        // ⚠️ 애플워치(arm64_32)는 Int가 32비트 → 밀리초(≈1.75조)를 Int로 넣으면 오버플로 크래시. Int64 필수.
        let nonce = "\(Int64(Date().timeIntervalSince1970 * 1000))_w\(Int.random(in: 100000...999999))"
        let body: [String: Any] = ["fields": [
            "from":  ["stringValue": from],
            "nonce": ["stringValue": nonce],
            "at":    ["timestampValue": formatTS(Date())],
        ]]
        var req = URLRequest(url: url)
        req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: req)
    }

    // 내가 받는 하트의 nonce 조회 (변화 감지는 호출처에서).
    static func fetchHeartNonce(for me: String) async -> (from: String, nonce: String)? {
        guard let url = URL(string: "\(base)/liveHearts/\(enc(me))?key=\(apiKey)") else { return nil }
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let fields = obj["fields"] as? [String: Any],
              let nonce = (fields["nonce"] as? [String: Any])?["stringValue"] as? String else { return nil }
        let from = (fields["from"] as? [String: Any])?["stringValue"] as? String ?? ""
        return (from, nonce)
    }

    // ── 시각 헬퍼 ──
    static func serverDateMs(_ resp: URLResponse) -> Double? {
        guard let http = resp as? HTTPURLResponse, let ds = http.value(forHTTPHeaderField: "Date") else { return nil }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "GMT")
        f.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
        return f.date(from: ds).map { $0.timeIntervalSince1970 * 1000 }
    }
    // Firestore 타임스탬프(가변 소수부) → ms. 소수부는 버리고 초 단위로 파싱(‘N분 전’엔 충분).
    static func parseTS(_ s: String) -> Double? {
        var str = s
        if let dot = str.firstIndex(of: "."), let z = str.firstIndex(of: "Z") {
            str.removeSubrange(dot..<z)
        }
        let iso = ISO8601DateFormatter(); iso.formatOptions = [.withInternetDateTime]
        return iso.date(from: str).map { $0.timeIntervalSince1970 * 1000 }
    }
    static func formatTS(_ d: Date) -> String {
        let iso = ISO8601DateFormatter(); iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return iso.string(from: d)
    }
}
