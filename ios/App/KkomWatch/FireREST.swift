import Foundation

// 꼼모닝 워치 — Firestore REST 클라이언트 (Firebase SDK 없이 URLSession).
// presence·liveHearts는 Firestore에 있음(낙서장만 RTDB). 인증 없음 → apiKey만으로 접근.
// apiKey·projectId는 공개값(웹 번들에도 그대로 노출됨).
//   presence/{이름}      = { lastSeenAt: timestamp, active: bool }
//   liveHearts/{받는이}  = { from, nonce, at }   (nonce 바뀌면 하트 도착)
// 워치가 훑는 대화 한 줄. 짧게 보기용(스크롤로 과거 안 뒤짐).
struct WatchMsg: Equatable { var text: String; var mine: Bool; var atMs: Double }

enum Fire {
    static let projectId = "kkom-morning"
    static let apiKey = "AIzaSyBaIIIwJ5x19svwkmUvVtuQSio0VPcRkQg"
    static let webBase = "https://kkommorning-v2.vercel.app"   // 미세먼지 /api/air 호출용
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

    // 미세먼지 — 웹 /api/air 공개 라우트 호출 (data.go.kr 키는 서버가 처리)
    struct AirResult { var grade: String; var pm10: Int?; var pm25: Int? }
    static func fetchAir(station: String, region: String) async -> AirResult? {
        let s = station.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? station
        let r = region.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? region
        guard let url = URL(string: "\(webBase)/api/air?station=\(s)&region=\(r)"),
              let (data, _) = try? await URLSession.shared.data(from: url),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        let grade = obj["grade"] as? String ?? "정보 없음"
        let pm10 = (obj["pm10"] as? NSNumber)?.intValue
        let pm25 = (obj["pm25"] as? NSNumber)?.intValue
        return AirResult(grade: grade, pm10: pm10, pm25: pm25)
    }

    // 하트 푸시 — 상대 잠금 기기에도 알림(연타 쿨다운은 서버). 라이브 하트와 별개.
    static func notifyHeart(from: String, to: String) async {
        guard let url = URL(string: "\(webBase)/api/heart") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["from": from, "to": to])
        _ = try? await URLSession.shared.data(for: req)
    }

    // 범프 — 폰 QuickReplyBar와 동일: /api/bump로 상대에게 푸시. from/to는 한글 이름(우댕/꼼이).
    static func sendBump(from: String, to: String, kind: String) async {
        guard let url = URL(string: "\(webBase)/api/bump") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["from": from, "to": to, "kind": kind])
        _ = try? await URLSession.shared.data(for: req)
    }

    // 하트/스티커 던지기 — 상대 liveHearts doc을 덮어씀(nonce 매번 새로). 웹 throwHeart와 동일 스키마 + emoji.
    static func fling(from: String, to: String, emoji: String) async {
        guard let url = URL(string: "\(base)/liveHearts/\(enc(to))?key=\(apiKey)") else { return }
        // ⚠️ 애플워치(arm64_32)는 Int가 32비트 → 밀리초(≈1.75조)를 Int로 넣으면 오버플로 크래시. Int64 필수.
        let nonce = "\(Int64(Date().timeIntervalSince1970 * 1000))_w\(Int.random(in: 100000...999999))"
        let body: [String: Any] = ["fields": [
            "from":  ["stringValue": from],
            "nonce": ["stringValue": nonce],
            "at":    ["timestampValue": formatTS(Date())],
            "emoji": ["stringValue": emoji],
        ]]
        await patch(url, body)
    }

    // 오늘 내 기분 저장 — moods/{name}_{day}. 웹 setMyMood와 동일 스키마.
    static func setMood(name: String, emoji: String, day: String) async {
        guard let url = URL(string: "\(base)/moods/\(enc("\(name)_\(day)"))?key=\(apiKey)") else { return }
        let body: [String: Any] = ["fields": [
            "name":      ["stringValue": name],
            "day":       ["stringValue": day],
            "emoji":     ["stringValue": emoji],
            "note":      ["stringValue": ""],
            "updatedAt": ["timestampValue": formatTS(Date())],
        ]]
        await patch(url, body)
    }

    private static func patch(_ url: URL, _ body: [String: Any]) async {
        var req = URLRequest(url: url)
        req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        _ = try? await URLSession.shared.data(for: req)
    }

    // 내가 받는 하트의 nonce+emoji 조회 (변화 감지는 호출처에서).
    static func fetchHeartNonce(for me: String) async -> (from: String, nonce: String, emoji: String)? {
        guard let url = URL(string: "\(base)/liveHearts/\(enc(me))?key=\(apiKey)") else { return nil }
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let fields = obj["fields"] as? [String: Any],
              let nonce = (fields["nonce"] as? [String: Any])?["stringValue"] as? String else { return nil }
        let from = (fields["from"] as? [String: Any])?["stringValue"] as? String ?? ""
        let emoji = (fields["emoji"] as? [String: Any])?["stringValue"] as? String ?? "❤️"
        return (from, nonce, emoji)
    }

    // 받은 범프 — liveBumps/{me} 폴링(/api/bump가 기록). kind로 워치에서 '보고싶어' 라벨을 그린다.
    // 하트(liveHearts)와 같은 nonce 방식. 범프는 messages에 안 남아 이게 없으면 워치에 안 뜬다.
    static func fetchBumpNonce(for me: String) async -> (from: String, nonce: String, kind: String)? {
        guard let url = URL(string: "\(base)/liveBumps/\(enc(me))?key=\(apiKey)") else { return nil }
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let fields = obj["fields"] as? [String: Any],
              let nonce = (fields["nonce"] as? [String: Any])?["stringValue"] as? String else { return nil }
        let from = (fields["from"] as? [String: Any])?["stringValue"] as? String ?? ""
        let kind = (fields["kind"] as? [String: Any])?["stringValue"] as? String ?? ""
        return (from, nonce, kind)
    }

    // ── 채팅 (꼼톡) ── messages 컬렉션 직접. 폰 채팅과 같은 스키마({from,text,createdAt}).
    // 워치는 최근 몇 줄만 훑고, 답장은 받아쓰기/프리셋/꼼이미니 토큰. (단어) 토큰은 폰이 그림으로 렌더.
    static func fetchRecentMessages(me: String, limit: Int = 3) async -> [WatchMsg]? {
        guard let url = URL(string: "\(base):runQuery?key=\(apiKey)") else { return nil }
        let q: [String: Any] = ["structuredQuery": [
            "from": [["collectionId": "messages"]],
            "orderBy": [["field": ["fieldPath": "createdAt"], "direction": "DESCENDING"]],
            "limit": limit,
        ]]
        var req = URLRequest(url: url); req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: q)
        guard let (data, _) = try? await URLSession.shared.data(for: req),
              let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { return nil }
        var out: [WatchMsg] = []
        for item in arr {
            guard let doc = item["document"] as? [String: Any],
                  let fields = doc["fields"] as? [String: Any] else { continue }
            if (fields["deleted"] as? [String: Any])?["booleanValue"] as? Bool == true { continue }
            let from = (fields["from"] as? [String: Any])?["stringValue"] as? String ?? ""
            let text = (fields["text"] as? [String: Any])?["stringValue"] as? String ?? ""
            let hasSticker = fields["sticker"] != nil
            let hasImg = fields["imageUrl"] != nil
            let hasVid = fields["videoUrl"] != nil
            let hasAud = fields["audioUrl"] != nil
            let display = !text.isEmpty ? text
                : hasSticker ? "🐶 이모티콘"
                : hasImg ? "📷 사진"
                : hasVid ? "🎬 동영상"
                : hasAud ? "🎤 음성" : ""
            if display.isEmpty { continue }
            var atMs: Double = 0
            if let ts = (fields["createdAt"] as? [String: Any])?["timestampValue"] as? String { atMs = parseTS(ts) ?? 0 }
            out.append(WatchMsg(text: display, mine: from == me, atMs: atMs))
        }
        return out.reversed()   // 오래된 → 최신 순
    }

    // 답장 보내기 — messages doc 생성(폰 addDoc과 동일) + /api/message로 상대 푸시.
    // ⚠️ createdAt은 워치 로컬시각이 아니라 **서버 보정시각(atMs)**을 쓴다 — open rules라 request.time
    //    강제가 없어서, 시계 오차가 크면 폰이 보낸 것과 순서가 뒤집힌다. WatchStore가 serverNow()를 넘긴다.
    static func sendChat(from: String, to: String, text: String, atMs: Double) async {
        if let url = URL(string: "\(base)/messages?key=\(apiKey)") {
            let ts = formatTS(Date(timeIntervalSince1970: (atMs > 0 ? atMs : Date().timeIntervalSince1970 * 1000) / 1000))
            let body: [String: Any] = ["fields": [
                "from":      ["stringValue": from],
                "text":      ["stringValue": text],
                "createdAt": ["timestampValue": ts],
            ]]
            var req = URLRequest(url: url); req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try? JSONSerialization.data(withJSONObject: body)
            _ = try? await URLSession.shared.data(for: req)
        }
        if let url = URL(string: "\(webBase)/api/message") {
            var req = URLRequest(url: url); req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try? JSONSerialization.data(withJSONObject: ["from": from, "to": to, "text": text])
            _ = try? await URLSession.shared.data(for: req)
        }
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
