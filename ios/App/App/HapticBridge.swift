import Foundation
import Capacitor
import CoreHaptics
import UIKit

// 하트 받으면 폰이 심장박동처럼 두근두근 — Core Haptics로 '두-근 … 두-근'(lub-dub 2회) 재생.
// 지원 안 하는 기기는 임팩트 피드백 2연타로 폴백.
final class HeartHaptics {
    static let shared = HeartHaptics()
    private var engine: CHHapticEngine?

    func heartbeat() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { fallback(); return }
        do {
            if engine == nil {
                engine = try CHHapticEngine()
                engine?.resetHandler = { [weak self] in try? self?.engine?.start() }
                engine?.stoppedHandler = { _ in }
            }
            try engine?.start()
            let player = try engine?.makePlayer(with: heartbeatPattern())
            try player?.start(atTime: 0)
        } catch {
            fallback()
        }
    }

    private func thump(_ t: Double, _ intensity: Float, _ sharpness: Float) -> CHHapticEvent {
        CHHapticEvent(eventType: .hapticTransient, parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness),
        ], relativeTime: t)
    }

    private func heartbeatPattern() throws -> CHHapticPattern {
        // 두(강)-근(약) … 두-근
        let events = [
            thump(0.00, 1.0, 0.4), thump(0.16, 0.6, 0.3),
            thump(0.85, 1.0, 0.4), thump(1.01, 0.6, 0.3),
        ]
        return try CHHapticPattern(events: events, parameters: [])
    }

    private func fallback() {
        DispatchQueue.main.async {
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.16) {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
        }
    }
}

@objc(HapticBridgePlugin)
public class HapticBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HapticBridgePlugin"
    public let jsName = "HapticBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "heartbeat", returnType: CAPPluginReturnPromise)
    ]
    @objc func heartbeat(_ call: CAPPluginCall) {
        HeartHaptics.shared.heartbeat()
        call.resolve()
    }
}
