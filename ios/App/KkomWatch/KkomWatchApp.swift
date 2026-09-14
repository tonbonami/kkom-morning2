import SwiftUI

@main
struct KkomWatchApp: App {
    // 워치 독립 푸시(C) — 워치 App ID에 Push capability 등록 후 되살림.
    //   ⚠️ 이 어댑터만으론 크래시 안 남(엔타이틀먼트 없으면 토큰 등록이 실패할 뿐).
    //   진짜 조건: 워치 App ID에 Push 등록 + entitlements aps-environment. 그래야 토큰이 나온다.
    @WKApplicationDelegateAdaptor(WatchAppDelegate.self) private var appDelegate
    @StateObject private var store = WatchStore()
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .onAppear { store.start() }
        }
    }
}
