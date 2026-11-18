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
    @objc func capabilities(_ call: CAPPluginCall) {
        call.resolve(["reedit": true])
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
    let me: String
    var initial: [NetStroke] = []
    func makeUIView(context: Context) -> StrokeCanvasView {
        let v = StrokeCanvasView()
        v.controller = controller
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

struct DiaryInkScreen: View {
    let me: String
    let paperHex: String
    var initial: [NetStroke] = []
    let onDone: (Data, CGRect, String?) -> Void
    let onCancel: () -> Void
    @StateObject private var c = CanvasController()
    @State private var emptyNote = false
    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }
    // 다이어리에 어울리는 색 여섯(먹·갈색·로즈·블루·초록·노랑) — CanvasController.palette 의 칸 번호
    private let colors: [Int] = [2, 9, 0, 1, 5, 3]
    private let sizes: [CGFloat] = [4, 7, 12]
    private let ink = Color(red: 0.2, green: 0.25, blue: 0.33)

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button("취소") { onCancel() }.font(.system(size: 16)).foregroundColor(.secondary).frame(minWidth: 60, minHeight: 44, alignment: .leading)
                Spacer()
                Text("필기").font(.system(size: 17, weight: .semibold)).foregroundColor(ink)
                Spacer()
                Button("완료") {
                    if let cv = c.canvas, let r = cv.exportInk() { onDone(r.png, r.rect, cv.exportStrokesJSON()) } else { emptyNote = true }
                }.font(.system(size: 16, weight: .bold)).foregroundColor(Color(UIColor(hex: "#D9635B"))).frame(minWidth: 60, minHeight: 44, alignment: .trailing)
            }
            .padding(.horizontal, 16).padding(.top, 6)

            GeometryReader { geo in
                let w = min(geo.size.width - 24, (geo.size.height - 16) * 3 / 4)
                ZStack {
                    RoundedRectangle(cornerRadius: 16).fill(Color(UIColor(hex: paperHex)))
                    DiaryInkRepresentable(controller: c, me: me, initial: initial)
                }
                .frame(width: w, height: w * 4 / 3)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.06), lineWidth: 1))
                .shadow(color: .black.opacity(0.08), radius: 10, y: 3)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            if emptyNote {
                Text(initial.isEmpty ? "아직 그린 게 없어요 — 그리지 않으려면 「취소」" : "다 지웠어요 — 그림째 없애려면 「취소」 뒤 종이에서 「지우기」").font(.system(size: 13)).foregroundColor(.secondary).padding(.bottom, 4)
            }

            // 도구 줄 — 색 여섯 · 굵기 셋 · 지우개 · 되돌리기 · (아이패드) 펜슬만
            HStack(spacing: 10) {
                ForEach(colors, id: \.self) { i in
                    Button { c.colorIndex = i; c.eraser = false } label: {
                        Circle().fill(Color(CanvasController.palette[i])).frame(width: 26, height: 26)
                            .overlay(Circle().stroke(Color.white, lineWidth: 2))
                            .overlay(Circle().stroke(ink.opacity(c.colorIndex == i && !c.eraser ? 0.9 : 0), lineWidth: 2).padding(-3))
                    }.frame(width: 34, height: 44)
                }
                Divider().frame(height: 26)
                ForEach(sizes, id: \.self) { s in
                    Button { c.lineWidth = s; c.eraser = false } label: {
                        ZStack {
                            Circle().stroke(ink.opacity(c.lineWidth == s ? 0.5 : 0.12), lineWidth: 1).frame(width: 30, height: 30)
                            Circle().fill(ink).frame(width: s * 1.4, height: s * 1.4)
                        }
                    }.frame(width: 34, height: 44)
                }
                Divider().frame(height: 26)
                Button { c.eraser.toggle() } label: {
                    Image(systemName: "eraser").font(.system(size: 18)).foregroundColor(c.eraser ? Color(UIColor(hex: "#D9635B")) : ink)
                }.frame(width: 40, height: 44)
                Button { c.undo() } label: {
                    Image(systemName: "arrow.uturn.backward").font(.system(size: 18)).foregroundColor(ink)
                }.frame(width: 40, height: 44)
                if isPad {
                    Button { c.pencilOnly.toggle() } label: {
                        Image(systemName: c.pencilOnly ? "applepencil" : "hand.draw").font(.system(size: 18)).foregroundColor(ink)
                    }.frame(width: 40, height: 44)
                }
            }
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(RoundedRectangle(cornerRadius: 22).fill(Color(UIColor.secondarySystemGroupedBackground)))
            .padding(.horizontal, 12).padding(.bottom, 10)
        }
        .background(Color(UIColor(hex: "#F4F0EC")).ignoresSafeArea())
        .onAppear { c.colorIndex = 2; c.lineWidth = 7 }
    }
}
