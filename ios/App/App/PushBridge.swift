import Foundation
import UIKit
import Capacitor
import UserNotifications

// 커스텀 푸시 등록 — @capacitor/push-notifications 대신 (cap sync/Podfile 변경 회피).
// 흐름: JS가 PushBridge.register({user}) 호출 → APNs 권한+등록 →
//       토큰을 RTDB pushTokens/{user}에 저장 → 서버(Vercel)가 읽어 APNs 발송.
// user = 'udaeng' | 'kkomi'. RTDB_URL은 Sync.swift의 전역 상수 재사용.
final class PushManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = PushManager()
    private let APP_GROUP = "group.com.tonbonami.kkommorning"

    // 마지막 사용자 기억 — 앱 재실행 시 iOS가 자동 재등록해도 토큰을 올바른 사용자에 저장.
    private var user: String? {
        get { UserDefaults(suiteName: APP_GROUP)?.string(forKey: "pushUser") }
        set { UserDefaults(suiteName: APP_GROUP)?.set(newValue, forKey: "pushUser") }
    }

    private let WEB_BASE = "https://kkommorning-v2.vercel.app"

    func register(user: String) {
        if !user.isEmpty { self.user = user }
        // ⚠️ delegate를 여기(웹뷰/Capacitor 로드 후 JS가 호출)서 잡아야 안 덮임 → 포그라운드 배너 뜸.
        UNUserNotificationCenter.current().delegate = self
        registerReplyCategory()
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() }
        }
    }

    // 알림 꾹 누르면 뜨는 답장들. payload category="KKOM_MSG"와 매칭.
    // REPLY_TEXT = 잠금화면에서 바로 타이핑 답장(카톡급) → 채팅 메시지로 저장+발송.
    private func registerReplyCategory() {
        let reply = UNTextInputNotificationAction(identifier: "REPLY_TEXT", title: "답장", options: [],
                                                  textInputButtonTitle: "보내기", textInputPlaceholder: "메시지…")
        let love  = UNNotificationAction(identifier: "REPLY_LOVE",  title: "사랑해 ❤️", options: [])
        let hug   = UNNotificationAction(identifier: "REPLY_HUG",   title: "안아줘 🤗", options: [])
        let heart = UNNotificationAction(identifier: "REPLY_HEART", title: "하트 💚",  options: [])
        let cat = UNNotificationCategory(identifier: "KKOM_MSG", actions: [reply, love, hug, heart],
                                         intentIdentifiers: [], options: [])
        UNUserNotificationCenter.current().setNotificationCategories([cat])
    }

    // 답장 액션 탭 → 앱 안 열고 상대에게 바로 발사(me→partner). 2인이라 상대는 항상 원발신자.
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                               withCompletionHandler completionHandler: @escaping () -> Void) {
        guard let meKey = user, !meKey.isEmpty else { completionHandler(); return }
        let meName = meKey == "udaeng" ? "우댕" : "꼼이"
        let toName = meKey == "udaeng" ? "꼼이" : "우댕"

        // 카톡급 텍스트 답장 — 채팅 메시지로 저장(Firestore) + 상대 푸시
        if let textResp = response as? UNTextInputNotificationResponse {
            let text = textResp.userText.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty else { completionHandler(); return }
            sendChatReply(from: meName, to: toName, text: String(text.prefix(2000)), done: completionHandler)
            return
        }

        var path: String? = nil
        var bodyDict: [String: Any] = ["from": meName, "to": toName]
        switch response.actionIdentifier {
        case "REPLY_LOVE":  path = "/api/bump"; bodyDict["kind"] = "love"
        case "REPLY_HUG":   path = "/api/bump"; bodyDict["kind"] = "hug"
        case "REPLY_HEART": path = "/api/heart"
        default: completionHandler(); return   // 본문 탭(기본) → 앱 열림, 답장 없음
        }
        guard let p = path else { completionHandler(); return }
        postJSON("\(WEB_BASE)\(p)", bodyDict, done: completionHandler)
    }

    private func postJSON(_ urlStr: String, _ body: [String: Any], done: @escaping () -> Void) {
        guard let url = URL(string: urlStr) else { done(); return }
        var req = URLRequest(url: url); req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: req) { _, _, _ in done() }.resume()
    }

    // 텍스트 답장 = 채팅 메시지: Firestore 'messages'에 저장(REST, 웹 채팅과 동일 스키마) + /api/message 푸시.
    private func sendChatReply(from: String, to: String, text: String, done: @escaping () -> Void) {
        let projectId = "kkom-morning"
        let apiKey = "AIzaSyBaIIIwJ5x19svwkmUvVtuQSio0VPcRkQg"   // 공개값(웹 번들에도 노출)
        let group = DispatchGroup()

        // 1) Firestore messages 저장 → 기록에 남고 상대 앱에 실시간 표시
        if let url = URL(string: "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents/messages?key=\(apiKey)") {
            let iso = ISO8601DateFormatter(); iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            let fields: [String: Any] = ["fields": [
                "from": ["stringValue": from],
                "text": ["stringValue": text],
                "createdAt": ["timestampValue": iso.string(from: Date())],
            ]]
            var req = URLRequest(url: url); req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try? JSONSerialization.data(withJSONObject: fields)
            group.enter()
            URLSession.shared.dataTask(with: req) { _, _, _ in group.leave() }.resume()
        }
        // 2) 상대에게 푸시(잠긴 폰/백그라운드)
        if let url = URL(string: "\(WEB_BASE)/api/message") {
            var req = URLRequest(url: url); req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try? JSONSerialization.data(withJSONObject: ["from": from, "to": to, "text": text])
            group.enter()
            URLSession.shared.dataTask(with: req) { _, _, _ in group.leave() }.resume()
        }
        group.notify(queue: .main) { done() }
    }

    // 앱을 켜고 있을 때(포그라운드)도 상단 배너 + 소리로 알림 표시.
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .list, .sound])
    }

    func saveToken(_ deviceToken: Data) {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        guard let u = user, !u.isEmpty, let url = URL(string: "\(RTDB_URL)/pushTokens/\(u).json") else { return }
        let body: [String: Any] = ["token": hex, "platform": "ios", "t": Int(Date().timeIntervalSince1970 * 1000)]
        var req = URLRequest(url: url); req.httpMethod = "PUT"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: req).resume()
    }
}

@objc(PushBridgePlugin)
public class PushBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PushBridgePlugin"
    public let jsName = "PushBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "register", returnType: CAPPluginReturnPromise)
    ]
    @objc func register(_ call: CAPPluginCall) {
        PushManager.shared.register(user: call.getString("user") ?? "")
        call.resolve()
    }
}
