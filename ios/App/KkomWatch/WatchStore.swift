import Foundation
import SwiftUI
import WidgetKit
#if os(watchOS)
import WatchKit
#endif

let APP_GROUP = "group.com.tonbonami.kkommorning"
let DDAY = "2023-09-28"

struct AirInfo { var label: String; var grade: String; var pm10: Int?; var pm25: Int? }

// 워치 앱 상태 — 상대 접속 폴링, 하트 송수신, 시계오차 보정, 컴플리케이션용 스냅샷 저장.
@MainActor
final class WatchStore: ObservableObject {
    @Published var role: String? = UserDefaults(suiteName: APP_GROUP)?.string(forKey: "watchRole")
    @Published var online = false
    @Published var lastSeenMs: Double? = nil
    @Published var sending = false
    @Published var heartFlash = 0            // 상대 하트/스티커 수신 시 ++ → 애니메이션 트리거
    @Published var lastReceivedEmoji = "❤️"  // 방금 날아온 이모지
    @Published var moodSent: String? = nil   // 오늘 보낸 기분(피드백)
    @Published var airHome: AirInfo? = nil   // 호평동(우댕)
    @Published var airWork: AirInfo? = nil   // 서울 중구(꼼이)
    @Published var bumpFlash = 0             // 범프 보낸 확인 애니메이션 트리거
    @Published var bumpKind: String? = nil
    @Published var recentMessages: [WatchMsg] = []   // 꼼톡 최근 몇 줄

    private var serverOffsetMs: Double = 0   // serverNow = deviceNow + offset
    private var lastHeartNonce: String? = nil
    private var baselineSet = false          // 첫 조회는 baseline(햅틱 X)
    private var loop: Task<Void, Never>? = nil
    private var lastWidgetReload: Double = 0
    private var lastAirFetch: Double = 0
    private var lastMsgFetch: Double = 0

    var partner: String { role == "우댕" ? "꼼이" : "우댕" }

    func setRole(_ r: String) {
        role = r
        UserDefaults(suiteName: APP_GROUP)?.set(r, forKey: "watchRole")
        lastHeartNonce = nil; baselineSet = false
        restart()
    }

    func serverNow() -> Double { Date().timeIntervalSince1970 * 1000 + serverOffsetMs }

    func start() { if loop == nil { restart() } }
    func stop() { loop?.cancel(); loop = nil }

    private func restart() {
        loop?.cancel()
        guard role != nil else { return }
        lastMsgFetch = 0   // resume/역할변경 직후 첫 tick이 채팅을 즉시 갱신(손목 들어올리면 바로 최신)
        loop = Task { [weak self] in
            while !Task.isCancelled {
                await self?.tick()
                try? await Task.sleep(nanoseconds: 4_000_000_000)   // 4초 폴링(포그라운드)
            }
        }
    }

    private func tick() async {
        guard let me = role else { return }
        if let p = await Fire.fetchPresence(of: partner) {
            serverOffsetMs = p.serverNowMs - Date().timeIntervalSince1970 * 1000
            lastSeenMs = p.lastSeenMs
            online = (p.lastSeenMs != nil) && p.active && (serverNow() - (p.lastSeenMs ?? 0) < 90_000)
            writeSnapshot()
        }
        if let h = await Fire.fetchHeartNonce(for: me) {
            if !baselineSet {
                lastHeartNonce = h.nonce; baselineSet = true
            } else if h.nonce != lastHeartNonce {
                lastHeartNonce = h.nonce
                lastReceivedEmoji = h.emoji
                heartFlash += 1
                playHeartHaptic()
            }
        } else {
            baselineSet = true   // 아직 하트 doc 없음 → baseline 확정
        }
        // 미세먼지 — data.go.kr가 간헐적으로 빈 응답을 줌 → 실데이터만 반영(빈값으로 덮지 않음).
        // 데이터 있으면 10분마다, 아직 없으면 1분마다 재시도.
        let now = Date().timeIntervalSince1970
        let airInterval: Double = (airHome != nil && airWork != nil) ? 600 : 60
        if now - lastAirFetch > airInterval {
            lastAirFetch = now
            if let a = await Fire.fetchAir(station: "금곡동", region: "경기북부"), a.grade != "정보 없음" {
                airHome = AirInfo(label: "호평동", grade: a.grade, pm10: a.pm10, pm25: a.pm25)
            }
            if let a = await Fire.fetchAir(station: "중구", region: "서울"), a.grade != "정보 없음" {
                airWork = AirInfo(label: "서울 중구", grade: a.grade, pm10: a.pm10, pm25: a.pm25)
            }
        }
        // 꼼톡 최근 대화 — 6초 스로틀(4초 폴링마다 runQuery는 과함)
        if now - lastMsgFetch > 6 {
            lastMsgFetch = now
            if let msgs = await Fire.fetchRecentMessages(me: me) { recentMessages = msgs }
        }
    }

    // 워치에서 답장 — 낙관적으로 내 말풍선 먼저, 서버엔 messages doc 생성 + 상대 푸시.
    func sendChat(_ text: String) {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let me = role, !t.isEmpty else { return }
        playTapHaptic()
        let to = partner
        let atMs = serverNow()
        recentMessages.append(WatchMsg(text: t, mine: true, atMs: atMs))
        if recentMessages.count > 8 { recentMessages.removeFirst(recentMessages.count - 8) }
        Task { await Fire.sendChat(from: me, to: to, text: t, atMs: atMs) }
    }

    // 하트/스티커 날리기
    func fling(_ emoji: String) {
        guard let me = role else { return }
        sending = true
        playTapHaptic()
        let to = partner
        Task {
            await Fire.fling(from: me, to: to, emoji: emoji)
            await Fire.notifyHeart(from: me, to: to)   // 상대 잠금 기기에도 알림(서버 쿨다운 20초)
            self.sending = false
        }
    }

    // 범프 — 폰 QuickReplyBar 그대로 재현: /api/bump 푸시 + 로컬 확인 애니메이션
    func sendBump(_ kind: String) {
        guard let me = role else { return }
        playTapHaptic()
        bumpKind = kind
        bumpFlash += 1
        let to = partner
        Task { await Fire.sendBump(from: me, to: to, kind: kind) }
    }

    // 오늘 내 기분 보내기
    func sendMood(_ emoji: String) {
        guard let me = role else { return }
        playTapHaptic()
        moodSent = emoji
        let day = todayKst()
        Task { await Fire.setMood(name: me, emoji: emoji, day: day) }
    }

    // KST 오늘 날짜 (웹 todayKst와 동일 규칙, 시계보정 적용)
    func todayKst() -> String {
        let d = Date(timeIntervalSince1970: (serverNow() + 9 * 3600 * 1000) / 1000)
        let f = DateFormatter()
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: d)
    }

    // ── 표시용 텍스트 ──
    func agoText() -> String {
        guard let ls = lastSeenMs else { return "아직 한 번도" }
        if online { return "지금 함께" }
        let m = max(1, Int(max(0, serverNow() - ls) / 60_000))
        if m < 60 { return "\(m)분 전" }
        let h = m / 60; if h < 24 { return "\(h)시간 전" }
        let d = h / 24; if d == 1 { return "어제" }; if d < 7 { return "\(d)일 전" }
        return "\(d / 7)주 전"
    }

    func ddayText() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.timeZone = TimeZone(identifier: "Asia/Seoul")
        var cal = Calendar(identifier: .gregorian); cal.timeZone = TimeZone(identifier: "Asia/Seoul")!
        guard let target = f.date(from: DDAY) else { return "D-day" }
        let now = Date(timeIntervalSince1970: serverNow() / 1000)
        let n = cal.dateComponents([.day], from: cal.startOfDay(for: target), to: cal.startOfDay(for: now)).day ?? 0
        return "D+\(n + 1)"   // 사귄 당일 D+1 관례
    }

    // 컴플리케이션이 읽을 스냅샷 (앱 그룹). 위젯 리로드는 30초 스로틀.
    private func writeSnapshot() {
        guard let d = UserDefaults(suiteName: APP_GROUP) else { return }
        let snap: [String: Any] = [
            "partnerName": partner,
            "partnerLastSeenMs": lastSeenMs ?? 0,
            "partnerActive": online,
            "serverMs": serverNow(),
            "deviceMs": Date().timeIntervalSince1970 * 1000,
            "ddayDate": DDAY,
        ]
        if let data = try? JSONSerialization.data(withJSONObject: snap) {
            d.set(data, forKey: "kkomWatchState")
        }
        let now = Date().timeIntervalSince1970
        if now - lastWidgetReload > 30 {
            lastWidgetReload = now
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    private func playHeartHaptic() {
        #if os(watchOS)
        WKInterfaceDevice.current().play(.notification)
        #endif
    }
    private func playTapHaptic() {
        #if os(watchOS)
        WKInterfaceDevice.current().play(.click)
        #endif
    }
}
