import SwiftUI

@main
struct KkomWatchApp: App {
    // ⚠️ 워치 독립 푸시(C) 보류 — aps-environment 프로비저닝 미비로 TestFlight 빌드가 켜자마자 크래시했음.
    //    복구하려면 워치 App ID에 Push capability 등록 후 아래 한 줄 + entitlements aps-environment 되살리기:
    //    @WKApplicationDelegateAdaptor(WatchAppDelegate.self) private var appDelegate
    @StateObject private var store = WatchStore()
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .onAppear { store.start() }
        }
    }
}
