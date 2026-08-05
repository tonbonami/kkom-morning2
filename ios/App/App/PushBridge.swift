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

    // 하트/범프 알림 꾹 누르면 뜨는 답장 버튼들. payload의 category="KKOM_MSG"와 매칭.
    private func registerReplyCategory() {
        let love  = UNNotificationAction(identifier: "REPLY_LOVE",  title: "사랑해 ❤️", options: [])
        let hug   = UNNotificationAction(identifier: "REPLY_HUG",   title: "안아줘 🤗", options: [])
        let heart = UNNotificationAction(identifier: "REPLY_HEART", title: "하트 💚",  options: [])
        let cat = UNNotificationCategory(identifier: "KKOM_MSG", actions: [love, hug, heart],
                                         intentIdentifiers: [], options: [])
        UNUserNotificationCenter.current().setNotificationCategories([cat])
    }

    // 답장 액션 탭 → 앱 안 열고 상대에게 바로 발사(me→partner). 2인이라 상대는 항상 원발신자.
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                               withCompletionHandler completionHandler: @escaping () -> Void) {
        guard let meKey = user, !meKey.isEmpty else { completionHandler(); return }
        let meName = meKey == "udaeng" ? "우댕" : "꼼이"
        let toName = meKey == "udaeng" ? "꼼이" : "우댕"
        var path: String? = nil
        var bodyDict: [String: Any] = ["from": meName, "to": toName]
        switch response.actionIdentifier {
        case "REPLY_LOVE":  path = "/api/bump"; bodyDict["kind"] = "love"
        case "REPLY_HUG":   path = "/api/bump"; bodyDict["kind"] = "hug"
        case "REPLY_HEART": path = "/api/heart"
        default: completionHandler(); return   // 본문 탭(기본) → 앱 열림, 답장 없음
        }
        guard let p = path, let url = URL(string: "\(WEB_BASE)\(p)") else { completionHandler(); return }
        var req = URLRequest(url: url); req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: bodyDict)
        URLSession.shared.dataTask(with: req) { _, _, _ in completionHandler() }.resume()
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
