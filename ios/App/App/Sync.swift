import Foundation
import UIKit

// STEP 2 — 실시간 생중계. Firebase iOS SDK 없이 RTDB REST(PUT/POST/DELETE) + SSE(text/event-stream)로 직접.
// 테스트 모드 규칙(open)이라 토큰 불필요. 좌표는 정규화 0~1로 주고받아 기기 크기 달라도 맞음.
// 구조: canvas/main/live/{user}=그리는 중 획, canvas/main/strokes/{user}/{id}=확정 획.
// 각 기기는 "내 것"에 쓰고 "상대 것"을 구독 → 중복 렌더 없음.

let RTDB_URL = "https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app"
let BOARD_ID = "main"

// 네트워크로 오가는 획 — color(hex) + 정규화 점 [x, y, wN]
struct NetStroke: Codable {
    var color: String
    var pts: [[Double]]
}

final class SyncClient: NSObject, URLSessionDataDelegate {
    let me: String       // "udaeng" | "kkomi"
    let partner: String

    var onRemoteLive: ((NetStroke?) -> Void)?
    var onRemoteCommit: ((String, NetStroke?) -> Void)?     // id, stroke(nil=삭제)
    var onRemoteReset: (([(String, NetStroke)]) -> Void)?   // 전체 리셋(초기·삭제)

    private lazy var streamSession: URLSession = {
        let c = URLSessionConfiguration.default
        c.timeoutIntervalForRequest = 300
        c.timeoutIntervalForResource = 86400
        c.httpMaximumConnectionsPerHost = 6
        return URLSession(configuration: c, delegate: self, delegateQueue: nil)
    }()

    private enum Kind { case live, strokes }
    private var kindOf: [Int: Kind] = [:]
    private var urlOf: [Int: String] = [:]
    private var buffer: [Int: String] = [:]
    private var evName: [Int: String] = [:]
    private var evData: [Int: String] = [:]

    init(me: String) {
        self.me = me
        self.partner = (me == "udaeng") ? "kkomi" : "udaeng"
        super.init()
    }

    func start() {
        openStream("\(RTDB_URL)/canvas/\(BOARD_ID)/live/\(partner).json", kind: .live)
        openStream("\(RTDB_URL)/canvas/\(BOARD_ID)/strokes/\(partner).json", kind: .strokes)
    }

    private func openStream(_ urlStr: String, kind: Kind) {
        guard let url = URL(string: urlStr) else { return }
        var req = URLRequest(url: url)
        req.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        let task = streamSession.dataTask(with: req)
        kindOf[task.taskIdentifier] = kind
        urlOf[task.taskIdentifier] = urlStr
        buffer[task.taskIdentifier] = ""
        task.resume()
    }

    // ── 쓰기 (fire-and-forget, 일반 세션) ──
    func publishLive(_ s: NetStroke?) {
        write("PUT", "\(RTDB_URL)/canvas/\(BOARD_ID)/live/\(me).json", body: encode(s))
    }
    // 클라이언트가 만든 id로 PUT → 지우개/되돌리기에서 특정 획 정확히 삭제 가능
    func commit(id: String, _ s: NetStroke) {
        write("PUT", "\(RTDB_URL)/canvas/\(BOARD_ID)/strokes/\(me)/\(id).json", body: encode(s))
    }
    func deleteMine(id: String) {
        write("DELETE", "\(RTDB_URL)/canvas/\(BOARD_ID)/strokes/\(me)/\(id).json", body: nil)
    }
    func clearMine() {
        write("DELETE", "\(RTDB_URL)/canvas/\(BOARD_ID)/strokes/\(me).json", body: nil)
        write("PUT", "\(RTDB_URL)/canvas/\(BOARD_ID)/live/\(me).json", body: "null".data(using: .utf8))
    }

    private func encode(_ s: NetStroke?) -> Data? {
        guard let s = s else { return "null".data(using: .utf8) }
        return try? JSONEncoder().encode(s)
    }
    private func write(_ method: String, _ urlStr: String, body: Data?) {
        guard let url = URL(string: urlStr) else { return }
        var req = URLRequest(url: url); req.httpMethod = method; req.httpBody = body
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
        guard event == "put" || event == "patch" else { return }  // keep-alive 등 무시
        guard let d = dataJSON.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: d) as? [String: Any] else { return }
        let path = obj["path"] as? String ?? "/"
        let payload = obj["data"]
        switch kindOf[id] {
        case .live:
            let s = Self.decodeStroke(payload)
            DispatchQueue.main.async { self.onRemoteLive?(s) }
        case .strokes:
            if path == "/" {
                var list: [(String, NetStroke)] = []
                if let m = payload as? [String: Any] {
                    for (k, v) in m { if let s = Self.decodeStroke(v) { list.append((k, s)) } }
                }
                DispatchQueue.main.async { self.onRemoteReset?(list) }
            } else {
                let sid = String(path.dropFirst())
                let s = Self.decodeStroke(payload)
                DispatchQueue.main.async { self.onRemoteCommit?(sid, s) }
            }
        case .none:
            break
        }
    }

    static func decodeStroke(_ any: Any?) -> NetStroke? {
        guard let dict = any as? [String: Any],
              let color = dict["color"] as? String,
              let ptsAny = dict["pts"] as? [[Any]] else { return nil }
        let pts = ptsAny.map { arr in arr.compactMap { ($0 as? NSNumber)?.doubleValue } }
        return NetStroke(color: color, pts: pts)
    }

    // 연결 끊기면 재접속
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        let id = task.taskIdentifier
        guard let kind = kindOf[id], let urlStr = urlOf[id] else { return }
        kindOf[id] = nil; urlOf[id] = nil; buffer[id] = nil; evName[id] = nil; evData[id] = nil
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
            self?.openStream(urlStr, kind: kind)
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
