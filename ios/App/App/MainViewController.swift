import UIKit
import Capacitor
import WidgetKit

// Capacitor 브릿지 로드 시 커스텀 플러그인을 명시적으로 등록.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CanvasPlugin())
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}

// 웹 → 앱그룹 스냅샷 저장 + 위젯 새로고침. 위젯 확장이 이 스냅샷을 읽어 렌더.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
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
        if let v = call.getString("partnerMood") { d["partnerMood"] = v }

        if let data = try? JSONSerialization.data(withJSONObject: d) {
            UserDefaults(suiteName: "group.com.tonbonami.kkommorning")?.set(data, forKey: "kkomState")
            if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
        }
        call.resolve()
    }
}
