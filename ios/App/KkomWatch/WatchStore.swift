import Foundation
import SwiftUI
import WidgetKit
#if os(watchOS)
import WatchKit
#endif

let APP_GROUP = "group.com.tonbonami.kkommorning"
let DDAY = "2023-09-28"

struct AirInfo { var label: String; var grade: String; var pm10: Int?; var pm25: Int? }

// 오프라인일 때 실패한 전송을 담아뒀다가 다음 연결 때 재시도(사용자 요청 A).
// 앱그룹 UserDefaults에 JSON으로 영속 → 손목 내려 앱이 잠들어도 대기분이 살아남는다.
struct PendingSend: Codable, Identifiable {
    enum Kind: String, Codable { case bump, chat, fling, mood }
    var id = UUID().uuidString
    var kind: Kind
    var payload: String   // bump=kind / chat=text / fling=emoji / mood=emoji
    var atMs: Double       // 채팅 순서 보정용(그 외 0)
    var createdAt: Double
}

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
    @Published var recvBumpFlash = 0         // 상대가 보낸 범프 수신 → 애니메이션 트리거
    @Published var recvBumpKind: String? = nil  // 방금 받은 범프 종류(보고싶어 등)
    @Published var recentMessages: [WatchMsg] = []   // 꼼톡 최근 몇 줄
    @Published var connected = true          // 마지막 서버 통신 성공 여부(B: 오프라인 배지)
    @Published var inFlight = 0              // 전송 진행 중 개수(보내는 중 표시)
    @Published var pendingCount = 0          // 재시도 대기 개수
    @Published var sendFailedFlash = 0       // 전송 실패 토스트 트리거
    @Published var lastFailLabel = ""        // 실패 토스트 문구용

    private var queue: [PendingSend] = []    // 재시도 큐(UserDefaults에 영속)
    private var flushing = false
    private var serverOffsetMs: Double = 0   // serverNow = deviceNow + offset
    private var lastHeartNonce: String? = nil
    private var baselineSet = false          // 첫 조회는 baseline(햅틱 X)
    private var lastBumpNonce: String? = nil
    private var bumpBaselineSet = false       // 받은 범프도 첫 조회는 baseline(옛 범프 재발화 방지)
    private var loop: Task<Void, Never>? = nil
    private var lastWidgetReload: Double = 0
    private var lastAirFetch: Double = 0
    private var lastMsgFetch: Double = 0

    var partner: String { role == "우댕" ? "꼼이" : "우댕" }

    init() { loadQueue() }

    // ── 재시도 큐(A) ──
    private func loadQueue() {
        guard let d = UserDefaults(suiteName: APP_GROUP)?.data(forKey: "watchSendQueue"),
              let q = try? JSONDecoder().decode([PendingSend].self, from: d) else { return }
        queue = q; pendingCount = q.count
    }
    private func saveQueue() {
        pendingCount = queue.count
        if let d = try? JSONEncoder().encode(queue) {
            UserDefaults(suiteName: APP_GROUP)?.set(d, forKey: "watchSendQueue")
        }
    }
    private func enqueue(_ p: PendingSend, failLabel: String) {
        queue.append(p); saveQueue()
        lastFailLabel = failLabel; sendFailedFlash += 1
        #if os(watchOS)
        WKInterfaceDevice.current().play(.failure)
        #endif
    }
    // 연결되면 대기분을 순서대로 재전송. 하나라도 실패하면(아직 오프라인) 중단하고 다음 tick에 다시.
    func flushQueue() {
        guard !flushing, !queue.isEmpty, let me = role else { return }
        flushing = true
        let items = queue
        Task { [weak self] in
            guard let self else { return }
            let to = self.partner
            var done: Set<String> = []
            for p in items {
                let ok: Bool
                switch p.kind {
                case .bump:  ok = await Fire.sendBump(from: me, to: to, kind: p.payload)
                case .chat:  ok = await Fire.sendChat(from: me, to: to, text: p.payload, atMs: p.atMs)
                case .fling:
                    ok = await Fire.fling(from: me, to: to, emoji: p.payload)
                    if ok { await Fire.notifyHeart(from: me, to: to) }
                case .mood:  ok = await Fire.setMood(name: me, emoji: p.payload, day: self.todayKst())
                }
                if ok { done.insert(p.id) } else { break }
            }
            if !done.isEmpty {
                self.queue.removeAll { done.contains($0.id) }
                self.saveQueue()
            }
            self.flushing = false
        }
    }

    func setRole(_ r: String) {
        role = r
        UserDefaults(suiteName: APP_GROUP)?.set(r, forKey: "watchRole")
        lastHeartNonce = nil; baselineSet = false
        lastBumpNonce = nil; bumpBaselineSet = false
        WatchPush.shared.syncToken()   // 역할 확정 → 이미 받아둔 APNs 토큰을 올바른 사용자에 기록
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
            connected = true
            serverOffsetMs = p.serverNowMs - Date().timeIntervalSince1970 * 1000
            lastSeenMs = p.lastSeenMs
            online = (p.lastSeenMs != nil) && p.active && (serverNow() - (p.lastSeenMs ?? 0) < 90_000)
            writeSnapshot()
            // 연결 확인됐고 밀린 전송이 있으면 지금 재시도(A).
            if !queue.isEmpty { flushQueue() }
        } else {
            connected = false   // presence 조회 자체가 실패 = 네트워크 없음(B: 오프라인 배지)
            online = false
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
        // 받은 범프 — liveBumps 폴링. 새 nonce면 '보고싶어' 등 라벨을 앱에 크게 띄운다(하트와 동일 방식).
        if let b = await Fire.fetchBumpNonce(for: me) {
            if !bumpBaselineSet {
                lastBumpNonce = b.nonce; bumpBaselineSet = true
            } else if b.nonce != lastBumpNonce {
                lastBumpNonce = b.nonce
                recvBumpKind = b.kind
                recvBumpFlash += 1
                playHeartHaptic()
            }
        } else {
            bumpBaselineSet = true   // 아직 범프 doc 없음 → baseline 확정
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
    // 기록 실패하면 큐에 넣고 다음 연결 때 재전송(A).
    func sendChat(_ text: String) {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let me = role, !t.isEmpty else { return }
        playTapHaptic()
        let to = partner
        let atMs = serverNow()
        recentMessages.append(WatchMsg(text: t, mine: true, atMs: atMs))
        if recentMessages.count > 8 { recentMessages.removeFirst(recentMessages.count - 8) }
        inFlight += 1
        Task {
            let ok = await Fire.sendChat(from: me, to: to, text: t, atMs: atMs)
            self.inFlight = max(0, self.inFlight - 1)
            if ok { self.connected = true }
            else { self.connected = false
                   self.enqueue(PendingSend(kind: .chat, payload: t, atMs: atMs, createdAt: atMs), failLabel: "메시지") }
        }
    }

    // 하트/스티커 날리기 — 성공해야 보냄. 실패 시 큐.
    func fling(_ emoji: String) {
        guard let me = role else { return }
        sending = true
        playTapHaptic()
        let to = partner
        Task {
            let ok = await Fire.fling(from: me, to: to, emoji: emoji)
            if ok { await Fire.notifyHeart(from: me, to: to) }   // 상대 잠금 기기에도 알림(서버 쿨다운 20초)
            self.sending = false
            if ok { self.connected = true }
            else { self.connected = false
                   self.enqueue(PendingSend(kind: .fling, payload: emoji, atMs: 0, createdAt: self.serverNow()), failLabel: "하트") }
        }
    }

    // 범프 — 폰 QuickReplyBar 재현. ⚠️ '보냈어!' 확인 애니는 실제 전송 성공 후에만(거짓말 금지, A).
    //   탭 즉시 햅틱으로 '눌림'은 알리고, 왕복 동안 inFlight로 '보내는 중', 결과에 따라 확인/실패.
    func sendBump(_ kind: String) {
        guard let me = role else { return }
        playTapHaptic()
        let to = partner
        inFlight += 1
        Task {
            let ok = await Fire.sendBump(from: me, to: to, kind: kind)
            self.inFlight = max(0, self.inFlight - 1)
            if ok {
                self.connected = true
                self.bumpKind = kind; self.bumpFlash += 1
            } else {
                self.connected = false
                self.enqueue(PendingSend(kind: .bump, payload: kind, atMs: 0, createdAt: self.serverNow()),
                             failLabel: bumpLabel(kind))
            }
        }
    }

    // 오늘 내 기분 보내기 — 낙관적 표시 후, 실패 시 큐(멱등이라 재전송 안전).
    func sendMood(_ emoji: String) {
        guard let me = role else { return }
        playTapHaptic()
        moodSent = emoji
        let day = todayKst()
        inFlight += 1
        Task {
            let ok = await Fire.setMood(name: me, emoji: emoji, day: day)
            self.inFlight = max(0, self.inFlight - 1)
            if ok { self.connected = true }
            else { self.connected = false
                   self.enqueue(PendingSend(kind: .mood, payload: emoji, atMs: 0, createdAt: self.serverNow()), failLabel: "기분") }
        }
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
