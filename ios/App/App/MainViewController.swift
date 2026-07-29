import UIKit
import Capacitor

// Capacitor 브릿지 로드 시 커스텀 플러그인을 명시적으로 등록.
// (앱 내장 플러그인이 매크로/CAPBridgedPlugin 자동등록에서 누락될 때의 확실한 방법)
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CanvasPlugin())
    }
}
