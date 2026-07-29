import Foundation
import Capacitor
import SwiftUI

// 웹의 '우리 낙서장' 카드 → Canvas.open({me}) → 네이티브 캔버스 전체화면 present.
// 등록은 CanvasPlugin.m의 CAP_PLUGIN 매크로(클래식·확실).
@objc(CanvasPlugin)
public class CanvasPlugin: CAPPlugin {
    @objc func open(_ call: CAPPluginCall) {
        let me = call.getString("me") ?? "udaeng"
        DispatchQueue.main.async { [weak self] in
            guard let presenter = self?.bridge?.viewController else {
                call.reject("no presenter")
                return
            }
            let screen = CanvasScreen(me: me, onClose: { presenter.dismiss(animated: true) })
            let host = UIHostingController(rootView: screen)
            host.modalPresentationStyle = .fullScreen
            presenter.present(host, animated: true)
            call.resolve()
        }
    }
}
