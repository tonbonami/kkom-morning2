import Foundation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

// Live Activity 수명 관리 — 없으면 시작, 있으면 갱신. 푸시토큰은 RTDB liveActivityTokens/{userKey}에 저장
// (지금은 앱이 포그라운드일 때 WidgetBridge.update가 호출해 갱신. 나중에 서버 푸시로 백그라운드 갱신 붙일 자리).
final class LiveActivityManager {
    static let shared = LiveActivityManager()
    private let APP_GROUP = "group.com.tonbonami.kkommorning"

    #if canImport(ActivityKit)
    @available(iOS 16.2, *)
    private var current: Activity<KkomActivityAttributes>? {
        get { _current as? Activity<KkomActivityAttributes> }
        set { _current = newValue }
    }
    private var _current: Any?
    private var tokenTask: Task<Void, Never>?

    // WidgetBridge 스냅샷 dict → ContentState 만들어 upsert
    func upsert(from d: [String: Any]) {
        guard #available(iOS 16.2, *) else { return }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let state = KkomActivityAttributes.ContentState(
            partnerName: d["partnerName"] as? String ?? "",
            partnerActive: d["partnerActive"] as? Bool ?? false,
            partnerLastSeenMs: (d["partnerLastSeenMs"] as? Double) ?? 0,
            serverMs: (d["snapshotServerMs"] as? Double) ?? 0,
            deviceMs: (d["snapshotDeviceMs"] as? Double) ?? 0,
            ddayDate: d["ddayDate"] as? String ?? "2023-09-28",
            airGrade: d["airGrade"] as? String,
            airLoc: d["airLoc"] as? String,
            partnerMood: d["partnerMood"] as? String
        )
        let content = ActivityContent(state: state, staleDate: nil)

        // 프로세스 재시작하면 current가 nil → 이미 떠있는 activity를 채택(중복 생성 방지 + 여분 정리).
        if current == nil {
            let existing = Activity<KkomActivityAttributes>.activities
            if let first = existing.first {
                current = first
                observeToken(first)
                for extra in existing.dropFirst() { Task { await extra.end(nil, dismissalPolicy: .immediate) } }
            }
        }

        if let act = current {
            Task { await act.update(content) }
        } else {
            do {
                let act = try Activity.request(attributes: KkomActivityAttributes(),
                                               content: content, pushType: .token)
                current = act
                observeToken(act)
            } catch {
                NSLog("LiveActivity 시작 실패: \(error.localizedDescription)")
            }
        }
    }

    func end() {
        guard #available(iOS 16.2, *) else { return }
        let content = current?.content
        Task {
            for act in Activity<KkomActivityAttributes>.activities {
                if let c = content { await act.end(c, dismissalPolicy: .immediate) }
                else { await act.end(nil, dismissalPolicy: .immediate) }
            }
        }
        current = nil
    }

    @available(iOS 16.2, *)
    private func observeToken(_ act: Activity<KkomActivityAttributes>) {
        tokenTask?.cancel()
        tokenTask = Task {
            for await data in act.pushTokenUpdates {
                let hex = data.map { String(format: "%02x", $0) }.joined()
                saveToken(hex)
            }
        }
    }

    private func saveToken(_ hex: String) {
        // userKey: PushManager가 앱그룹에 저장한 pushUser(udaeng|kkomi)
        let userKey = UserDefaults(suiteName: APP_GROUP)?.string(forKey: "pushUser") ?? ""
        guard !userKey.isEmpty, let url = URL(string: "\(RTDB_URL)/liveActivityTokens/\(userKey).json") else { return }
        let body: [String: Any] = ["token": hex, "t": Int(Date().timeIntervalSince1970 * 1000)]
        var req = URLRequest(url: url); req.httpMethod = "PUT"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: req).resume()
    }
    #else
    func upsert(from d: [String: Any]) {}
    func end() {}
    #endif
}

// JS에서 명시적으로 종료하고 싶을 때용(선택). 시작/갱신은 WidgetBridge.update가 알아서 함.
@objc(LiveActivityBridgePlugin)
public class LiveActivityBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityBridgePlugin"
    public let jsName = "LiveActivityBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]
    @objc func end(_ call: CAPPluginCall) {
        LiveActivityManager.shared.end()
        call.resolve()
    }
}
