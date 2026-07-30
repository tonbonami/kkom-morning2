import Foundation
import UIKit

// 웹·네이티브 통일 동기화. Firebase SDK 없이 RTDB REST(PUT/POST/DELETE) + SSE(text/event-stream).
// 스키마(웹과 공용):
//   canvas/book/currentPage              = 현재 페이지 id (둘이 공유)
//   canvas/book/pages/{id}               = { t }
//   canvas/{page}/strokes/{user}/{id}    = { color, size, points:[{x,y,p}], by, t }  (확정 획)
//   canvas/{page}/live/{user}            = { id, color, size, points:[{x,y,p}] }      (생중계)
//   canvas/{page}/meta/passageUrl        = String
// 좌표·필압 정규화(0~1). 확정 획은 "전체(양쪽)"를 구독해 렌더 → 페이지 넘겨도 내 획 복원됨.

let RTDB_URL = "https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app"

struct NetPoint: Codable { var x: Double; var y: Double; var p: Double }
struct NetStroke: Codable { var color: String; var size: Double; var points: [NetPoint] }

final class SyncClient: NSObject, URLSessionDataDelegate {
    let me: String       // "udaeng" | "kkomi"
    let partner: String

    // 현재 페이지 (book에서 옴). 기본 main.
    private(set) var page: String = "main"

    // 콜백 (모두 메인큐)
    var onCurrentPage: ((String) -> Void)?
    var onPages: (([String]) -> Void)?
    var onCommitted: (([(String, NetStroke)]) -> Void)?   // 현재 페이지 확정 획 전체(양쪽), key="user/id"
    var onRemoteLive: ((NetStroke?) -> Void)?
    var onPassage: ((String?) -> Void)?

    private lazy var streamSession: URLSession = {
        let c = URLSessionConfiguration.default
        c.timeoutIntervalForRequest = 300
        c.timeoutIntervalForResource = 86400
        c.httpMaximumConnectionsPerHost = 8
        return URLSession(configuration: c, delegate: self, delegateQueue: nil)
    }()

    private enum Kind { case book, strokes, live, meta }
    private var tasks: [Int: URLSessionDataTask] = [:]
    private var kindOf: [Int: Kind] = [:]
    private var buffer: [Int: String] = [:]
    private var evName: [Int: String] = [:]
    private var evData: [Int: String] = [:]

    // 로컬 상태
    private var bookObj: [String: Any] = [:]
    private var committed: [String: NetStroke] = [:]   // key "user/id"

    init(me: String) {
        self.me = me
        self.partner = (me == "udaeng") ? "kkomi" : "udaeng"
        super.init()
    }

    func start() {
        openStream("\(RTDB_URL)/canvas/book.json", kind: .book)
        openPageStreams()
    }

    private func openPageStreams() {
        openStream("\(RTDB_URL)/canvas/\(page)/strokes.json", kind: .strokes)
        openStream("\(RTDB_URL)/canvas/\(page)/live/\(partner).json", kind: .live)
        openStream("\(RTDB_URL)/canvas/\(page)/meta/passageUrl.json", kind: .meta)
    }

    private func openStream(_ urlStr: String, kind: Kind) {
        guard let url = URL(string: urlStr) else { return }
        var req = URLRequest(url: url)
        req.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        let task = streamSession.dataTask(with: req)
        let id = task.taskIdentifier
        tasks[id] = task; kindOf[id] = kind; buffer[id] = ""
        task.resume()
    }

    // 페이지 전환: 확정/라이브/지문 스트림만 교체(book 스트림은 유지)
    private func switchPage(to newPage: String) {
        guard newPage != page else { return }
        page = newPage
        committed.removeAll()
        DispatchQueue.main.async {
            self.onCommitted?([])
            self.onRemoteLive?(nil)
            self.onPassage?(nil)
        }
        for (id, k) in kindOf where k == .strokes || k == .live || k == .meta {
            kindOf[id] = nil
            tasks[id]?.cancel(); tasks[id] = nil
            buffer[id] = nil; evName[id] = nil; evData[id] = nil
        }
        openPageStreams()
    }

    // ── 쓰기 ──
    func commit(id: String, _ s: NetStroke) {
        var dict: [String: Any] = ["color": s.color, "size": s.size,
                                   "points": s.points.map { ["x": $0.x, "y": $0.y, "p": $0.p] },
                                   "by": me == "udaeng" ? "우댕" : "꼼이", "t": Int(Date().timeIntervalSince1970 * 1000)]
        write("PUT", "\(RTDB_URL)/canvas/\(page)/strokes/\(me)/\(id).json", body: jsonData(dict))
        committed["\(me)/\(id)"] = s   // 낙관적 로컬 반영(에코 오면 동일 id로 덮임)
        _ = dict
    }
    func deleteMine(id: String) {
        write("DELETE", "\(RTDB_URL)/canvas/\(page)/strokes/\(me)/\(id).json", body: nil)
        committed["\(me)/\(id)"] = nil
    }
    func clearMine() {
        write("DELETE", "\(RTDB_URL)/canvas/\(page)/strokes/\(me).json", body: nil)
        write("PUT", "\(RTDB_URL)/canvas/\(page)/live/\(me).json", body: "null".data(using: .utf8))
        for k in committed.keys where k.hasPrefix("\(me)/") { committed[k] = nil }
    }
    func publishLive(_ s: NetStroke?, id: String) {
        guard let s = s else {
            write("PUT", "\(RTDB_URL)/canvas/\(page)/live/\(me).json", body: "null".data(using: .utf8)); return
        }
        let dict: [String: Any] = ["id": id, "color": s.color, "size": s.size,
                                   "points": s.points.map { ["x": $0.x, "y": $0.y, "p": $0.p] }]
        write("PUT", "\(RTDB_URL)/canvas/\(page)/live/\(me).json", body: jsonData(dict))
    }

    // 페이지 만들기/이동 (book)
    func createPage() {
        let id = "p_\(Int(Date().timeIntervalSince1970 * 1000))"
        write("PUT", "\(RTDB_URL)/canvas/book/pages/\(id).json",
              body: jsonData(["t": Int(Date().timeIntervalSince1970 * 1000)]))
        write("PUT", "\(RTDB_URL)/canvas/book/currentPage.json", body: "\"\(id)\"".data(using: .utf8))
    }
    func setCurrentPage(_ id: String) {
        write("PUT", "\(RTDB_URL)/canvas/book/currentPage.json", body: "\"\(id)\"".data(using: .utf8))
    }
    func setPassage(_ url: String?) {
        if let url = url {
            write("PUT", "\(RTDB_URL)/canvas/\(page)/meta/passageUrl.json", body: "\"\(url)\"".data(using: .utf8))
        } else {
            write("DELETE", "\(RTDB_URL)/canvas/\(page)/meta/passageUrl.json", body: nil)
        }
    }

    private func jsonData(_ obj: Any) -> Data? { try? JSONSerialization.data(withJSONObject: obj) }
    private func write(_ method: String, _ urlStr: String, body: Data?) {
        guard let url = URL(string: urlStr) else { return }
        var req = URLRequest(url: url); req.httpMethod = method; req.httpBody = body
        if body != nil { req.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        URLSession.shared.dataTask(with: req).resume()
    }

    // ── SSE 수신 ──
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        let id = dataTask.taskIdentifier
        buffer[id, default: ""] += String(decoding: data, as: UTF8.self)
        var buf = buffer[id] ?? ""
        while let nl = buf.firstIndex(of: "\n") {
            let line = String(buf[buf.startIndex ..< nl])
            buf = String(buf[buf.index(after: nl)...])
            processLine(id, line)
        }
        buffer[id] = buf
    }

    private func processLine(_ id: Int, _ raw: String) {
        let line = raw.hasSuffix("\r") ? String(raw.dropLast()) : raw
        if line.isEmpty {
            if let ev = evName[id], let d = evData[id] { dispatch(id, ev, d) }
            evName[id] = nil; evData[id] = nil
            return
        }
        if line.hasPrefix("event:") {
            evName[id] = line.dropFirst(6).trimmingCharacters(in: .whitespaces)
        } else if line.hasPrefix("data:") {
            evData[id, default: ""] += line.dropFirst(5).trimmingCharacters(in: .whitespaces)
        }
    }

    private func dispatch(_ id: Int, _ event: String, _ dataJSON: String) {
        guard event == "put" || event == "patch" else { return }
        guard let d = dataJSON.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: d) as? [String: Any] else { return }
        let path = obj["path"] as? String ?? "/"
        let payload = obj["data"]
        switch kindOf[id] {
        case .book:   applyBook(event: event, path: path, value: payload)
        case .strokes: applyStrokes(event: event, path: path, value: payload)
        case .live:
            let s = Self.decodeStroke(payload)
            DispatchQueue.main.async { self.onRemoteLive?(s) }
        case .meta:
            let url = payload as? String
            DispatchQueue.main.async { self.onPassage?(url) }
        case .none: break
        }
    }

    // book: currentPage + pages 파싱
    private func applyBook(event: String, path: String, value: Any?) {
        let comps = path.split(separator: "/").map(String.init)
        if path == "/" {
            bookObj = (value as? [String: Any]) ?? [:]
        } else if event == "patch", comps.isEmpty {
            if let m = value as? [String: Any] { for (k, v) in m { bookObj[k] = v } }
        } else if comps.count == 1 {
            if let v = value { bookObj[comps[0]] = v } else { bookObj.removeValue(forKey: comps[0]) }
        } else if comps.count == 2 {
            var sub = bookObj[comps[0]] as? [String: Any] ?? [:]
            if let v = value { sub[comps[1]] = v } else { sub.removeValue(forKey: comps[1]) }
            bookObj[comps[0]] = sub
        }
        let cp = (bookObj["currentPage"] as? String) ?? "main"
        let pagesMap = bookObj["pages"] as? [String: Any] ?? [:]
        let pageList = pagesMap.sorted { a, b in tOf(a.value) < tOf(b.value) }.map { $0.key }
        DispatchQueue.main.async {
            self.onPages?(pageList.isEmpty ? ["main"] : pageList)
            self.onCurrentPage?(cp)
        }
        if cp != page { switchPage(to: cp) }
    }
    private func tOf(_ v: Any) -> Double { ((v as? [String: Any])?["t"] as? NSNumber)?.doubleValue ?? 0 }

    // strokes: canvas/{page}/strokes 전체(양쪽) → committed 갱신
    private func applyStrokes(event: String, path: String, value: Any?) {
        let comps = path.split(separator: "/").map(String.init)
        if path == "/" {
            committed.removeAll()
            if let byUser = value as? [String: Any] {
                for (user, byId) in byUser {
                    if let m = byId as? [String: Any] {
                        for (sid, s) in m { if let st = Self.decodeStroke(s) { committed["\(user)/\(sid)"] = st } }
                    }
                }
            }
        } else if comps.count == 1 {   // /{user}
            for k in committed.keys where k.hasPrefix("\(comps[0])/") { committed[k] = nil }
            if let m = value as? [String: Any] {
                for (sid, s) in m { if let st = Self.decodeStroke(s) { committed["\(comps[0])/\(sid)"] = st } }
            }
        } else if comps.count == 2 {   // /{user}/{id}
            let key = "\(comps[0])/\(comps[1])"
            if let st = Self.decodeStroke(value) { committed[key] = st } else { committed[key] = nil }
        }
        let list = committed.map { ($0.key, $0.value) }
        DispatchQueue.main.async { self.onCommitted?(list) }
    }

    static func decodeStroke(_ any: Any?) -> NetStroke? {
        guard let dict = any as? [String: Any], let color = dict["color"] as? String else { return nil }
        let size = (dict["size"] as? NSNumber)?.doubleValue ?? 6
        guard let ptsAny = dict["points"] as? [[String: Any]] else { return nil }
        let pts = ptsAny.compactMap { p -> NetPoint? in
            guard let x = (p["x"] as? NSNumber)?.doubleValue, let y = (p["y"] as? NSNumber)?.doubleValue else { return nil }
            let pr = (p["p"] as? NSNumber)?.doubleValue ?? 0.5
            return NetPoint(x: x, y: y, p: pr)
        }
        guard pts.count >= 1 else { return nil }
        return NetStroke(color: color, size: size, points: pts)
    }

    // 재접속 (현재 page 기준으로 다시 열기)
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        let id = task.taskIdentifier
        guard let kind = kindOf[id] else { return }
        kindOf[id] = nil; tasks[id] = nil; buffer[id] = nil; evName[id] = nil; evData[id] = nil
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
            guard let self = self else { return }
            switch kind {
            case .book:    self.openStream("\(RTDB_URL)/canvas/book.json", kind: .book)
            case .strokes: self.openStream("\(RTDB_URL)/canvas/\(self.page)/strokes.json", kind: .strokes)
            case .live:    self.openStream("\(RTDB_URL)/canvas/\(self.page)/live/\(self.partner).json", kind: .live)
            case .meta:    self.openStream("\(RTDB_URL)/canvas/\(self.page)/meta/passageUrl.json", kind: .meta)
            }
        }
    }
}

// ── UIColor ↔ hex ──
extension UIColor {
    func toHex() -> String {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        getRed(&r, green: &g, blue: &b, alpha: &a)
        return String(format: "#%02X%02X%02X", Int(round(r * 255)), Int(round(g * 255)), Int(round(b * 255)))
    }
    convenience init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        self.init(
            red: CGFloat((v & 0xFF0000) >> 16) / 255,
            green: CGFloat((v & 0x00FF00) >> 8) / 255,
            blue: CGFloat(v & 0x0000FF) / 255,
            alpha: 1
        )
    }
}
