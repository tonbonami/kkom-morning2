import SwiftUI

@main
struct KkomWatchApp: App {
    // APNs 등록/토큰 콜백 훅 — 워치 독립 푸시(사용자 요청 C).
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
