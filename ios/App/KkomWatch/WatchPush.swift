import Foundation
import UserNotifications
#if os(watchOS)
import WatchKit
#endif

// 워치 독립 APNs — 폰과 떨어져 있어(블루투스 끊김) 폰 알림 미러링이 안 될 때도
// 워치가 직접 푸시를 받게 한다(사용자 요청 C). 폰 PushManager와 같은 역할, 워치판.
//   흐름: 권한 요청 → registerForRemoteNotifications → 토큰을 RTDB watchTokens/{udaeng|kkomi}에 저장
//         → 서버(Vercel)가 sendApnsWatch로 워치 번들 토픽에 발송.
// 역할(우댕/꼼이)은 WatchStore와 같은 앱그룹 키(watchRole)에서 읽는다. 역할 바뀌면 재저장.
final class WatchPush: NSObject, UNUserNotificationCenterDelegate {
    static let shared = WatchPush()
    private let RTDB = "https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app"
    private let APP_GROUP = "group.com.tonbonami.kkommorning"

    private var lastTokenHex: String? {
        get { UserDefaults(suiteName: APP_GROUP)?.string(forKey: "watchApnsToken") }
        set { UserDefaults(suiteName: APP_GROUP)?.set(newValue, forKey: "watchApnsToken") }
    }
    private var role: String? { UserDefaults(suiteName: APP_GROUP)?.string(forKey: "watchRole") }
    private func keyForName(_ n: String) -> String { n == "우댕" ? "udaeng" : "kkomi" }

    // 앱 시작 시 1회 — 알림 권한 요청 후 원격 등록. 이후 토큰 콜백이 saveToken을 부른다.
    func registerIfPossible() {
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, _ in
            guard granted else { return }
            DispatchQueue.main.async {
                #if os(watchOS)
                WKApplication.shared().registerForRemoteNotifications()
                #endif
            }
        }
    }

    // 토큰 수신 — hex 저장 후 역할 있으면 RTDB에 기록.
    func saveToken(_ deviceToken: Data) {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        lastTokenHex = hex
        syncToken()
    }

    // 역할이 확정될 때(첫 실행 RolePicker 이후)도 호출 — 이미 받아둔 토큰을 올바른 사용자에 기록.
    func syncToken() {
        guard let hex = lastTokenHex, let r = role,
              let url = URL(string: "\(RTDB)/watchTokens/\(keyForName(r)).json") else { return }
        let body: [String: Any] = ["token": hex, "platform": "watchos", "t": Int(Date().timeIntervalSince1970 * 1000)]
        var req = URLRequest(url: url); req.httpMethod = "PUT"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: req).resume()
    }

    // 워치 앱 켜져 있을 때(포그라운드)도 배너+소리로 표시.
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .list])
    }
}

#if os(watchOS)
// SwiftUI 라이프사이클 워치 앱의 APNs 콜백 훅.
final class WatchAppDelegate: NSObject, WKApplicationDelegate {
    func applicationDidFinishLaunching() {
        // ⚠️ 워치 독립 푸시(C) 보류 — aps-environment 엔타이틀먼트가 워치 App ID에 프로비저닝 안 돼서
        //    TestFlight 빌드가 켜자마자 크래시했음(엔타이틀먼트 불일치). 워치 App ID에 Push capability
        //    등록되면 아래 한 줄 되살리면 됨: WatchPush.shared.registerIfPossible()
    }
    func didRegisterForRemoteNotifications(withDeviceToken deviceToken: Data) {
        WatchPush.shared.saveToken(deviceToken)
    }
    func didFailToRegisterForRemoteNotificationsWithError(_ error: Error) {
        NSLog("워치 APNs 등록 실패: \(error.localizedDescription)")
    }
}
#endif
