import UIKit
import Capacitor
import WidgetKit

// Capacitor 브릿지 로드 시 커스텀 플러그인을 명시적으로 등록.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CanvasPlugin())
        bridge?.registerPluginInstance(WidgetBridgePlugin())
        bridge?.registerPluginInstance(PushBridgePlugin())
        bridge?.registerPluginInstance(LiveActivityBridgePlugin())
        bridge?.registerPluginInstance(HapticBridgePlugin())
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
