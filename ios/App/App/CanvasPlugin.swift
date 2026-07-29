import Foundation
import Capacitor
import SwiftUI

// MainViewController.capacitorDidLoad()에서 registerPluginInstance로 명시적 등록.
@objc(CanvasPlugin)
public class CanvasPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CanvasPlugin"
    public let jsName = "Canvas"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

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
