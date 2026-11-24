import UIKit
import Capacitor
import WidgetKit
import WebKit
import UserNotifications
import ObjectiveC
import SwiftUI
import Photos

// Capacitor 브릿지 로드 시 커스텀 플러그인을 명시적으로 등록.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        FormAccessoryBar.hide()
        bridge?.registerPluginInstance(CanvasPlugin())
        bridge?.registerPluginInstance(WidgetBridgePlugin())
        bridge?.registerPluginInstance(PushBridgePlugin())
        bridge?.registerPluginInstance(LiveActivityBridgePlugin())
        bridge?.registerPluginInstance(HapticBridgePlugin())
        bridge?.registerPluginInstance(SleepSoundPlugin())   // 잠 소리(백색소음) — 화면 잠가도 계속
        bridge?.registerPluginInstance(DiaryInkPlugin())     // 다이어리 필기 — 그린 부분을 투명 그림으로 돌려준다(11/18)
        bridge?.registerPluginInstance(MediaSavePlugin())    // 사진·동영상 사진첩에 바로 저장(11/25, 카톡처럼)
    }

    // ⚠️ capacitorDidLoad 는 loadView 안(첫 화면 loadWebView 보다 먼저)이라 거기서 주소를 열면 첫 화면이 덮어쓴다.
    //    viewDidLoad(super 가 loadWebView 를 부른 뒤)에서 연다. 같은 줄에서 알림 delegate 도 다시 잡는다 —
    //    브릿지가 만들어질 때 Capacitor 알림 라우터가 delegate 를 가져가서, 콜드 스타트 본문 탭이 PushManager 로 안 올 수 있다.
    override func viewDidLoad() {
        super.viewDidLoad()
        UNUserNotificationCenter.current().delegate = PushManager.shared
        if let webView = bridge?.webView { DeepLink.attach(webView) }
    }

    #if DEBUG
    // 시뮬레이터 확인용 — `simctl launch … -diaryInkDemo` 면 필기 화면을 견본 획(펜·연필·크레파스·형광펜·지우개)과 함께 바로 띄운다. 출시 빌드엔 없음.
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // 사진첩 바로 저장 시험(-mediaSaveDemo) — 웹(자바스크립트)에서 MediaSave 플러그인을 부르는 실제 길로 두 장(PNG·WebP)을 넣고 결과를 창으로.
        //   웹 쪽 함정(플러그인 객체를 async 에서 return → then 대기)과 별개로, 다리(bridge)·getArray·권한·저장이 끝까지 도는지 본다.
        if ProcessInfo.processInfo.arguments.contains("-mediaSaveDemo"), presentedViewController == nil {
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) { [weak self] in
                guard let self = self, let web = self.bridge?.webView else { return }
                let js = """
                const items = [{url:'https://kkommorning-v2.vercel.app/emo/gifts/cake.png',kind:'image'},{url:'https://kkommorning-v2.vercel.app/emo/sai/towork.webp',kind:'image'}];
                const p = window.Capacitor.Plugins.MediaSave.save({ items });
                const t = new Promise((_, rej) => setTimeout(() => rej(new Error('30초 안에 안 끝남')), 30000));
                try { return JSON.stringify(await Promise.race([p, t])); } catch (e) { return '오류: ' + e.message; }
                """
                web.callAsyncJavaScript(js, arguments: [:], in: nil, in: .page) { result in
                    let text: String
                    switch result { case .success(let v): text = "\(v)"; case .failure(let e): text = "JS 실패: \(e.localizedDescription)" }
                    let a = UIAlertController(title: "저장 시험(웹 → 앱)", message: text, preferredStyle: .alert)
                    a.addAction(UIAlertAction(title: "확인", style: .default))
                    self.present(a, animated: true)
                }
            }
            return
        }
        guard ProcessInfo.processInfo.arguments.contains("-diaryInkDemo"), presentedViewController == nil else { return }
        func line(_ y: Double, _ b: String?, _ c: String, _ size: Double, sd: Int? = nil) -> NetStroke {
            let pts = (0 ... 40).map { i -> NetPoint in let x = 0.12 + Double(i) * 0.019; return NetPoint(x: x, y: y + sin(Double(i) / 4) * 0.025, p: 0.5) }
            return NetStroke(color: c, size: size, points: pts, b: b, sd: sd)
        }
        var demo = [line(0.16, nil, "#23272E", 7), line(0.30, "pencil", "#23272E", 8, sd: 4242), line(0.46, "crayon", "#D64545", 22, sd: 777),
                    line(0.62, "hl", "#F2C230", 32), line(0.76, "crayon", "#3D74C7", 34, sd: 31337)]
        demo.append(NetStroke(color: "#000000", size: 60, points: [NetPoint(x: 0.5, y: 0.1, p: 0.5), NetPoint(x: 0.5, y: 0.9, p: 0.5)], b: "erase"))
        let screen = DiaryInkScreen(me: "udaeng", paperHex: "#FAF6EE", initial: demo,
                                    onDone: { [weak self] png, rect, _ in
                                        // 견본: 내보낸 그림을 앱 Documents 에 남겨 확인(잘린 자리·지운 자리)
                                        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("diaryInkDemo.png")
                                        try? png.write(to: url)
                                        print("diaryInkDemo", url.path, rect)
                                        self?.dismiss(animated: true)
                                    },
                                    onCancel: { [weak self] in self?.dismiss(animated: true) })
        let host = UIHostingController(rootView: screen)
        host.modalPresentationStyle = .fullScreen
        present(host, animated: false)
    }
    #endif
}

// 알림 본문을 누르면 라이브 웹의 아는 화면만 연다(빌드 68부터 — 옛 앱은 url 을 몰라 앱만 열린다).
// 콜드 스타트에서는 알림 응답이 웹뷰보다 먼저 올 수 있어 경로를 보관했다가 viewDidLoad 뒤에 연다.
// "/" 는 넣지 않는다 — 꼼톡·범프 알림마다 웹뷰를 홈으로 새로 띄우면 보던 화면(꼼톡 등)이 날아간다.
enum DeepLink {
    private static let webBase = URL(string: "https://kkommorning-v2.vercel.app")!
    private static let allowed: Set<String> = ["/calendar", "/diary", "/letters"]
    private static weak var webView: WKWebView?
    private static var pendingPath: String?

    static func attach(_ readyWebView: WKWebView) {
        webView = readyWebView
        guard let path = pendingPath else { return }
        pendingPath = nil
        go(path)
    }

    static func open(_ raw: String?) {
        guard let path = path(from: raw) else { return }
        DispatchQueue.main.async {
            guard webView != nil else { pendingPath = path; return }
            go(path)
        }
    }

    // 상대 경로 또는 WEB_BASE와 같은 출처만. 쿼리는 아는 이름과 모양으로 다시 만든다.
    static func path(from raw: String?) -> String? {
        guard let raw = raw, !raw.isEmpty, let parts = URLComponents(string: raw) else { return nil }
        if parts.scheme != nil {
            guard parts.scheme == webBase.scheme,
                  parts.host == webBase.host,
                  parts.port == webBase.port,
                  parts.user == nil,
                  parts.password == nil else { return nil }
        } else {
            guard raw.hasPrefix("/"), !raw.hasPrefix("//"), parts.host == nil else { return nil }
        }
        guard parts.fragment == nil || parts.fragment?.isEmpty == true else { return nil }
        let page = parts.path.isEmpty ? "/" : parts.path
        guard allowed.contains(page) else { return nil }

        var date: String?
        var event: String?
        var who: String?
        for item in parts.queryItems ?? [] {
            switch item.name {
            case "date":
                guard date == nil, let value = item.value,
                      value.count == 10,
                      value.range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression) != nil else { return nil }
                date = value
            case "event":
                guard event == nil, let value = item.value,
                      !value.isEmpty, value.count <= 64,
                      value.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "_" || $0 == "-") }) else { return nil }
                event = value
            case "who":   // 꼼이어리 ♥·한마디 — 누구 장인지(상대 장에 단 답글 알림이면 상대 장을 열어야 한다)
                guard who == nil, let value = item.value, value == "udaeng" || value == "kkomi" else { return nil }
                who = value
            default:
                continue
            }
        }
        var safe: [String] = []
        if let date = date { safe.append("date=\(date)") }
        if let event = event { safe.append("event=\(event)") }
        if let who = who { safe.append("who=\(who)") }
        return safe.isEmpty ? page : "\(page)?\(safe.joined(separator: "&"))"
    }

    private static func go(_ path: String) {
        guard let webView = webView, let url = URL(string: path, relativeTo: webBase)?.absoluteURL else { return }
        webView.load(URLRequest(url: url))
    }
}

// 키보드 위 '^ ∨ ✓'(이전칸·다음칸·완료) 폼 도구막대 끄기 — 카톡처럼.
//   웹 input/textarea에 포커스가 가면 WebKit이 WKContentView.inputAccessoryView로 이 막대를 붙인다(카톡은 네이티브 입력창이라 없음).
//   공식 @capacitor/keyboard도 같은 방식으로 '기본 숨김'인데, 그 플러그인은 키보드 리사이즈 동작까지 바꿔
//   채팅 입력창 위치가 흔들릴 수 있어 막대 끄는 부분만 직접 둔다.
//   UIKit은 키보드가 뜨는 순간 이 값을 읽으므로 앱 시작 때 한 번 걸어두면 타이밍 문제 없음.
//   class_replaceMethod라 WKContentView에만 적용(다른 UIResponder·네이티브 캔버스는 영향 없음).
enum FormAccessoryBar {
    private static var applied = false
    static func hide() {
        guard !applied, let cls = NSClassFromString("WKContentView") else { return }
        let sel = #selector(getter: UIResponder.inputAccessoryView)
        guard let method = class_getInstanceMethod(cls, sel) else { return }
        let none: @convention(block) (AnyObject) -> UIView? = { _ in nil }
        class_replaceMethod(cls, sel, imp_implementationWithBlock(none), method_getTypeEncoding(method))
        applied = true
    }
}

// 웹 → 앱그룹 스냅샷 저장 + 위젯 새로고침. 위젯 확장이 이 스냅샷을 읽어 렌더.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]

    @objc func update(_ call: CAPPluginCall) {
        var d: [String: Any] = [
            "partnerName": call.getString("partnerName") ?? "",
            "partnerLastSeenMs": call.getDouble("partnerLastSeenMs") ?? 0,
            "partnerActive": call.getBool("partnerActive") ?? false,
            "snapshotServerMs": call.getDouble("snapshotServerMs") ?? 0,
            "snapshotDeviceMs": call.getDouble("snapshotDeviceMs") ?? 0,
            "ddayDate": call.getString("ddayDate") ?? "",
        ]
        if let v = call.getString("nextEventTitle") { d["nextEventTitle"] = v }
        if let v = call.getString("nextEventDate") { d["nextEventDate"] = v }
        if let v = call.getString("airGrade") { d["airGrade"] = v }
        if let v = call.getInt("airPm10") { d["airPm10"] = v }
        if let v = call.getInt("airPm25") { d["airPm25"] = v }
        if let v = call.getString("airLoc") { d["airLoc"] = v }
        if let v = call.getInt("weatherTemp") { d["weatherTemp"] = v }
        if let v = call.getString("weatherSky") { d["weatherSky"] = v }
        if let v = call.getString("rainEmoji") { d["rainEmoji"] = v }
        if let v = call.getString("partnerMood") { d["partnerMood"] = v }

        if let data = try? JSONSerialization.data(withJSONObject: d) {
            UserDefaults(suiteName: "group.com.tonbonami.kkommorning")?.set(data, forKey: "kkomState")
            if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
        }
        // Live Activity 비활성화(우댕 요청): 시작·갱신 안 함. 남아있던 잠금화면 액티비티도 종료.
        LiveActivityManager.shared.end()
        call.resolve()
    }

    // 로그아웃/계정 교체 시 — 위젯이 '옛 상대'를 계속 보여주지 않게 앱그룹 스냅샷을 지운다.
    // (kkomState 는 로그인된 신원 기준으로 쓰이는데, 웹 로그아웃은 localStorage 만 지워서
    //  이 키가 남으면 위젯이 지난 상대를 계속 띄운다. 지운 뒤 위젯·액티비티도 새로고침.)
    @objc func clear(_ call: CAPPluginCall) {
        UserDefaults(suiteName: "group.com.tonbonami.kkommorning")?.removeObject(forKey: "kkomState")
        if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
        LiveActivityManager.shared.end()
        call.resolve()
    }
}
