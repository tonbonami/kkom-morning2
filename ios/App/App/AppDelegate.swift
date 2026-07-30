import UIKit
import Capacitor
import LocalAuthentication

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        AppLock.shared.showCover()   // 콘텐츠 보이기 전 커버
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        AppLock.shared.showCover()   // 앱 스위처 프라이버시 커버
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        AppLock.shared.markBackground()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {
        AppLock.shared.authenticateIfNeeded()
    }

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// ── FaceID 잠금 (우리만의 앱) ──
// 콜드 런치 + 백그라운드 30초 이상 후 복귀 시 FaceID(없으면 패스코드). 실패 시 커버 유지.
final class AppLock {
    static let shared = AppLock()
    private var cover: UIView?
    private var isUnlocked = false
    private var isAuthenticating = false
    private var backgroundedAt: Date?
    private let graceSeconds: TimeInterval = 30

    private func keyWindow() -> UIWindow? {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        return scenes.flatMap { $0.windows }.first { $0.isKeyWindow } ?? scenes.flatMap { $0.windows }.first
    }

    func showCover() {
        guard let win = keyWindow() else { return }
        if cover == nil || cover?.superview == nil {
            let v = UIVisualEffectView(effect: UIBlurEffect(style: .systemThickMaterial))
            v.frame = win.bounds
            v.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            let label = UILabel()
            label.text = "💚"
            label.font = .systemFont(ofSize: 64)
            label.textAlignment = .center
            label.frame = win.bounds
            label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            v.contentView.addSubview(label)
            win.addSubview(v)
            cover = v
        }
        cover?.isHidden = false
        if let c = cover { win.bringSubviewToFront(c) }
    }

    private func hideCover() { cover?.isHidden = true }

    func markBackground() { backgroundedAt = Date(); showCover() }

    func authenticateIfNeeded() {
        // 유예: 잠깐 나갔다 온 거면 통과
        if isUnlocked, let bg = backgroundedAt, Date().timeIntervalSince(bg) < graceSeconds {
            hideCover(); return
        }
        if isUnlocked, backgroundedAt == nil { hideCover(); return }
        guard !isAuthenticating else { return }
        isUnlocked = false
        showCover()

        let ctx = LAContext()
        var err: NSError?
        guard ctx.canEvaluatePolicy(.deviceOwnerAuthentication, error: &err) else {
            // 생체·패스코드 설정 없으면 잠금 무의미 → 통과
            isUnlocked = true; hideCover(); return
        }
        isAuthenticating = true
        ctx.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "꼼모닝 잠금 해제") { ok, _ in
            DispatchQueue.main.async {
                self.isAuthenticating = false
                if ok {
                    self.isUnlocked = true
                    self.backgroundedAt = nil
                    self.hideCover()
                }
                // 실패 시 커버 유지 — 다음 활성화 때 재시도
            }
        }
    }
}
