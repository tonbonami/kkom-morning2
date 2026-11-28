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

    func letterMood(_ mood: String) {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
            fallbackLetterMood(mood)
            return
        }
        do {
            if engine == nil {
                engine = try CHHapticEngine()
                engine?.resetHandler = { [weak self] in try? self?.engine?.start() }
                engine?.stoppedHandler = { _ in }
            }
            try engine?.start()
            let player = try engine?.makePlayer(with: letterMoodPattern(mood))
            try player?.start(atTime: 0)
        } catch {
            fallbackLetterMood(mood)
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

    private func letterMoodPattern(_ mood: String) throws -> CHHapticPattern {
        // 모두 0.45초 안쪽. 봉투 애니메이션을 가리지 않게 표정만 짧게 다르게 한다.
        let events: [CHHapticEvent]
        switch mood {
        case "love":
            events = [thump(0.00, 0.65, 0.25), thump(0.14, 0.85, 0.35)]
        case "thanks":
            events = [thump(0.00, 0.55, 0.35), thump(0.18, 0.45, 0.25)]
        case "sorry":
            events = [thump(0.00, 0.35, 0.15)]
        case "cheer":
            events = [thump(0.00, 0.55, 0.55), thump(0.12, 0.85, 0.70)]
        case "missing":
            events = [thump(0.00, 0.40, 0.20), thump(0.24, 0.48, 0.20)]
        case "celebrate":
            events = [thump(0.00, 0.55, 0.80), thump(0.10, 0.72, 0.85), thump(0.22, 0.90, 0.90)]
        default:
            events = [thump(0.00, 0.45, 0.35)]
        }
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

    private func fallbackLetterMood(_ mood: String) {
        DispatchQueue.main.async {
            let style: UIImpactFeedbackGenerator.FeedbackStyle = mood == "celebrate" || mood == "cheer" ? .medium : .light
            UIImpactFeedbackGenerator(style: style).impactOccurred()
        }
    }
}

@objc(HapticBridgePlugin)
public class HapticBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HapticBridgePlugin"
    public let jsName = "HapticBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "heartbeat", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "letterMood", returnType: CAPPluginReturnPromise)
    ]
    @objc func heartbeat(_ call: CAPPluginCall) {
        HeartHaptics.shared.heartbeat()
        call.resolve()
    }
    @objc func letterMood(_ call: CAPPluginCall) {
        HeartHaptics.shared.letterMood(call.getString("mood") ?? "default")
        call.resolve()
    }
}

// ── 사진·동영상을 사진첩에 바로 저장 (우댕 2026-11-25 「사파리창으로 넘어가서 저장돼. 한번에 저장하기도 안돼. 카톡처럼 해줘」) ──
// 웹이 { items: [{ url, kind: 'image' | 'video' }] } 를 넘기면 여기서 직접 받아(URLSession) 사진첩에 넣는다 — 사파리·공유 시트 없이.
// 권한은 「추가만」(addOnly, Info.plist NSPhotoLibraryAddUsageDescription). 거절이면 denied: true 로 돌려 웹이 설정 안내를 띄운다.
// ⚠️ 이 플러그인이 없는 옛 빌드(≤69)는 웹이 isPluginAvailable('MediaSave') 로 보고 예전 공유 시트로 간다.
import Photos

@objc(MediaSavePlugin)
public class MediaSavePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MediaSavePlugin"
    public let jsName = "MediaSave"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "save", returnType: CAPPluginReturnPromise),
    ]

    @objc func save(_ call: CAPPluginCall) {
        let raw = call.getArray("items", JSObject.self) ?? []
        let items: [(URL, Bool)] = raw.compactMap { o in
            guard let s = o["url"] as? String, let u = URL(string: s), u.scheme == "https" || u.scheme == "http" else { return nil }
            return (u, (o["kind"] as? String) == "video")
        }
        guard !items.isEmpty else { call.resolve(["saved": 0, "failed": 0, "denied": false]); return }
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                call.resolve(["saved": 0, "failed": items.count, "denied": true]); return
            }
            Task {
                var saved = 0, failed = 0
                for (url, isVideo) in items {
                    if await Self.saveOne(url, isVideo: isVideo) { saved += 1 } else { failed += 1 }
                }
                call.resolve(["saved": saved, "failed": failed, "denied": false])
            }
        }
    }

    /// 한 장 받아서 넣기. 사진은 받은 그대로(원본) 먼저, 사진첩이 그 형식을 못 받으면 JPEG 로 바꿔 한 번 더.
    static func saveOne(_ url: URL, isVideo: Bool) async -> Bool {
        do {
            var req = URLRequest(url: url)
            req.timeoutInterval = 20   // 한 장 20초 — 네트워크가 멈춰도 끝나게(GPT 검수 권고, 빌드 71~)
            let (data, resp) = try await URLSession.shared.data(for: req)
            if let http = resp as? HTTPURLResponse, !(200..<300).contains(http.statusCode) { return false }
            if isVideo {
                let file = FileManager.default.temporaryDirectory.appendingPathComponent("kkommorning_\(UUID().uuidString).mp4")
                try data.write(to: file)
                defer { try? FileManager.default.removeItem(at: file) }
                try await PHPhotoLibrary.shared().performChanges {
                    PHAssetCreationRequest.forAsset().addResource(with: .video, fileURL: file, options: nil)
                }
                return true
            }
            do {
                try await PHPhotoLibrary.shared().performChanges {
                    PHAssetCreationRequest.forAsset().addResource(with: .photo, data: data, options: nil)
                }
                return true
            } catch {
                guard let jpg = UIImage(data: data)?.jpegData(compressionQuality: 0.95) else { return false }
                try await PHPhotoLibrary.shared().performChanges {
                    PHAssetCreationRequest.forAsset().addResource(with: .photo, data: jpg, options: nil)
                }
                return true
            }
        } catch {
            return false
        }
    }
}
