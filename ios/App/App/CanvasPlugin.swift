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

// ── 다이어리 필기(우댕 2026-11-18 「아이패드 필기 1단계 진행해」) ──────────────────────────────────
// 다이어리 하루 장의 「그리기」 → 이 화면(낙서장과 같은 필기 — 펜슬 필압·손바닥 무시) → 「완료」면 그린 부분만 잘라
// 투명 PNG + 자리(0~1)를 웹으로 돌려준다. 웹이 그 그림을 종이 위 물건 하나로 붙인다(옮기기·크기·돌리기·앞뒤는 다른 물건과 같이).
// ⚠️ 낙서장(CanvasPlugin)과 별개 플러그인 — 이 플러그인이 없는 옛 앱 빌드에선 웹이 「그리기」 단추를 아예 안 보인다(isPluginAvailable).
// ⚠️ 서버에 아무것도 안 쓴다(StrokeCanvasView.localMe). 1단계는 그림만 돌려주고, 다시 고치기(획 저장)는 다음 단계.
@objc(DiaryInkPlugin)
public class DiaryInkPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DiaryInkPlugin"
    public let jsName = "DiaryInk"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "edit", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "capabilities", returnType: CAPPluginReturnPromise),
    ]

    /// 이 빌드가 할 수 있는 것 — 웹이 「다시 그리기」 단추를 보일지 정한다(빌드 66 엔 이 메서드가 없어 웹이 false 로 본다).
    /// inkFormat 2 = 연필·크레파스·형광펜·부분 지우개 획(b·sd)을 읽는다(11/21). 없으면 웹이 1 로 보고 형식 2 필기를 안 연다.
    @objc func capabilities(_ call: CAPPluginCall) {
        call.resolve(["reedit": true, "inkFormat": 2])
    }

    @objc func edit(_ call: CAPPluginCall) {
        let me = call.getString("me") ?? "udaeng"
        let paper = call.getString("paper") ?? "#FAF6EE"
        // 다시 그리기(필기 2단계): 웹이 지금 자리에 맞춰 옮겨 둔 획(보드 0~1) JSON
        var initial: [NetStroke] = []
        if let js = call.getString("strokes"), let d = js.data(using: .utf8), let list = try? JSONDecoder().decode([NetStroke].self, from: d) {
            initial = list
        }
        DispatchQueue.main.async { [weak self] in
            guard let presenter = self?.bridge?.viewController else { call.reject("no presenter"); return }
            let screen = DiaryInkScreen(
                me: me, paperHex: paper, initial: initial,
                onDone: { png, rect, strokesJson in
                    presenter.dismiss(animated: true)
                    call.resolve([
                        "cancelled": false, "pngBase64": png.base64EncodedString(),
                        "x": Double(rect.minX), "y": Double(rect.minY), "w": Double(rect.width), "h": Double(rect.height),
                        "strokes": strokesJson ?? "",
                    ])
                },
                onCancel: {
                    presenter.dismiss(animated: true)
                    call.resolve(["cancelled": true])
                })
            let host = UIHostingController(rootView: screen)
            host.modalPresentationStyle = .fullScreen
            host.isModalInPresentation = true
            presenter.present(host, animated: true)
        }
    }
}

struct DiaryInkRepresentable: UIViewRepresentable {
    @ObservedObject var controller: CanvasController
    let tools: DiaryInkTools
    let me: String
    var initial: [NetStroke] = []
    func makeUIView(context: Context) -> StrokeCanvasView {
        let v = StrokeCanvasView()
        v.controller = controller
        v.diaryTools = tools           // 붓·색·굵기·지우개·되돌리기는 다이어리 도구 상태로(낙서장과 따로)
        v.localMe = me                 // 서버 없이(낙서장 RTDB 와 무관)
        controller.canvas = v
        if !initial.isEmpty { v.loadLocalStrokes(initial) }   // 다시 그리기 — 크기가 정해지면 layoutSubviews 가 다시 굽는다
        return v
    }
    func updateUIView(_ uiView: StrokeCanvasView, context: Context) {
        uiView.controller = controller
        uiView.setFingerPanEnabled(false)   // 이 화면은 확대·이동 없이 종이 그대로
    }
}

// 필기 화면 — 모양은 제미나이 시안(CanvasUI.swift 의 DiaryInkScreenView, 11/21) 그대로, 여기선 연결만.
struct DiaryInkScreen: View {
    let me: String
    let paperHex: String
    var initial: [NetStroke] = []
    let onDone: (Data, CGRect, String?) -> Void
    let onCancel: () -> Void
    @StateObject private var c = CanvasController()
    @StateObject private var tools = DiaryInkTools()
    @State private var emptyNote = false
    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }

    var body: some View {
        DiaryInkScreenView(
            tools: tools,
            paperColor: Color(UIColor(hex: paperHex)),
            note: emptyNote ? (initial.isEmpty ? "아직 그린 게 없어요 — 그리지 않으려면 「취소」" : "다 지웠어요 — 그림째 없애려면 「취소」 뒤 종이에서 「지우기」") : nil,
            isPad: isPad,
            onCancel: onCancel,
            onDone: {
                if let cv = c.canvas, let r = cv.exportInk() { onDone(r.png, r.rect, cv.exportStrokesJSON()) } else { emptyNote = true }
            },
            onUndo: { c.undo(); emptyNote = false },
            onRedo: { c.redo(); emptyNote = false }
        ) {
            DiaryInkRepresentable(controller: c, tools: tools, me: me, initial: initial)
        }
        .onReceive(tools.$pencilOnly) { c.pencilOnly = $0 }
    }
}
