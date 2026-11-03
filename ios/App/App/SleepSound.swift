import Foundation
import UIKit
import AVFoundation
import MediaPlayer
import Capacitor

// 잠 소리(백색소음) — 꼼이가 유튜브 빗소리를 틀고 자는데 화면이 꺼지면 멈추고 광고가 떠서(우댕 2026-11-01) 앱이 직접 낸다.
//   소리는 이 파일(AVAudioEngine)만 낸다. 웹 화면은 고르고·켜고·끄기만(SleepSoundPlugin). GPT 상의: docs/gpt-sleep-sound-answer.md
//   - 빗소리 = 실제 녹음 2개 — 텐트(rain-tent.m4a 20분, 우댕이 준 9시간 파일에서 10~30분 구간, 2026-11-03 「이걸로 바꿔줘」)·창가(rain-window.m4a 10분, Pixabay). 처음 실제 녹음 기와지붕(rain-roof)은 텐트로 바꿈. art/sleep/prep_real_rain.py 방식으로
//     끝·처음 교차 페이드) — 메모리에 다 올리지 않고 디스크에서 흘려 읽으며 같은 파일을 늘 2개씩 줄 세워 이어 튼다(이음새 없음).
//     (처음엔 코드로 합성한 빗소리였는데 우댕 「너무 인공적」 2026-11-02 → 실제 녹음)
//   - 분홍·갈색 소음 = 코드로 만든다(파일 없음, 이음새 없음).
//   - Info.plist UIBackgroundModes=audio + AVAudioSession(.playback) → 화면 잠가도 계속.
//   - 끝 시각(아침 7:00 등)은 네이티브가 잰다(JS 타이머는 백그라운드에서 멈춘다). 끝나기 60초 전부터 서서히 줄이고 정지.
//   - 전화·Siri·알람으로 끊기면 끝난 뒤 shouldResume 일 때만, 끝 시각 전이면 다시 켠다. 이어폰이 빠지면 바로 멈춘다(스피커로 갑자기 크게 안 나게).
//   - 상태는 앱 그룹에도 적어 둔다(위젯·나중 기능용).
final class SleepSoundManager {
    static let shared = SleepSoundManager()
    static let sounds: [String: String] = ["rain": "텐트 빗소리", "window": "창가 빗소리", "pink": "분홍 소음", "brown": "갈색 소음"]
    private static let files: [String: String] = ["rain": "rain-tent", "window": "rain-window"]   // id → 번들 m4a 이름(rain 은 옛 설정과 맞추려고 id 유지)
    private var isFile: Bool { Self.files[soundId] != nil }
    private let appGroup = "group.com.tonbonami.kkommorning"

    private(set) var playing = false
    private(set) var soundId = "rain"
    private(set) var volume: Float = 0.6
    private(set) var endAt: Date?
    var onChange: (([String: Any]) -> Void)?

    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private var noiseNode: AVAudioSourceNode?
    private var loopGen = 0                         // 파일 반복 세대 — 소리를 바꾸거나 멈추면 +1, 옛 세대의 「다음 줄 세우기」는 무시
    // 렌더 스레드가 쓰는 상태는 Swift 배열·프로퍼티 대신 고정 메모리에(실시간 스레드에서 배타 접근 검사·복사 방지)
    //   [0..6] 분홍 필터 · [7] 갈색 마지막 값 · [8] 소음 종류(0 분홍, 1 갈색)
    private let st: UnsafeMutablePointer<Float> = {
        let p = UnsafeMutablePointer<Float>.allocate(capacity: 9); p.initialize(repeating: 0, count: 9); return p
    }()
    private var wired = false
    private var fadeTimer: DispatchSourceTimer?
    private var endTimer: DispatchSourceTimer?
    private var gain: Float = 0                     // 페이드용 현재 배율(0~1) — 실제 출력 = gain × volume
    private var interrupted = false

    private init() {
        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(onInterruption(_:)), name: AVAudioSession.interruptionNotification, object: nil)
        nc.addObserver(self, selector: #selector(onRouteChange(_:)), name: AVAudioSession.routeChangeNotification, object: nil)
        nc.addObserver(self, selector: #selector(onMediaReset(_:)), name: AVAudioSession.mediaServicesWereResetNotification, object: nil)
        nc.addObserver(self, selector: #selector(onEngineConfig(_:)), name: .AVAudioEngineConfigurationChange, object: engine)
        setupRemoteCommands()
        if let d = UserDefaults(suiteName: appGroup) {
            if let s = d.string(forKey: "sleepSound.sound"), Self.sounds[s] != nil { soundId = s }
            if d.object(forKey: "sleepSound.volume") != nil { volume = max(0, min(1, d.float(forKey: "sleepSound.volume"))) }
        }
    }

    // MARK: - 바깥에서 부르는 것

    func play(sound: String?, volume v: Float?, endAt e: Date?) {
        if let s = sound, Self.sounds[s] != nil { soundId = s }
        if let v = v { volume = max(0, min(1, v)) }
        endAt = e.flatMap { $0 > Date() ? $0 : nil }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [])
            try session.setActive(true)
            try wireIfNeeded()
            startSource()
            if !engine.isRunning { try engine.start() }
            if isFile { player.play() }
        } catch {
            NSLog("[SleepSound] play 실패: \(error)")
            stop(fade: false); return
        }
        playing = true; interrupted = false
        gain = 0; applyVolume()
        fade(to: 1, seconds: 5)                     // 처음 5초 서서히
        scheduleEnd()
        save(); updateNowPlaying(); emit()
    }

    func stop(fade withFade: Bool = true) {
        endTimer?.cancel(); endTimer = nil
        guard playing || engine.isRunning else { finishStop(); return }
        if withFade && playing {
            fade(to: 0, seconds: 1.5) { [weak self] in self?.finishStop() }
        } else {
            finishStop()
        }
    }

    func setVolume(_ v: Float) {
        volume = max(0, min(1, v)); applyVolume(); save(); emit()
    }

    func status() -> [String: Any] {
        var d: [String: Any] = ["playing": playing, "sound": soundId, "volume": volume,
                                "soundName": Self.sounds[soundId] ?? ""]
        if let e = endAt { d["endAt"] = e.timeIntervalSince1970 * 1000 } else { d["endAt"] = NSNull() }
        return d
    }

    // MARK: - 엔진

    private func wireIfNeeded() throws {
        if wired { return }
        engine.attach(player)
        // 빗소리 파일은 둘 다 44.1kHz 스테레오로 만들어 넣었다(prep_real_rain.py) → 연결 형식 하나로 둘 다 튼다
        engine.connect(player, to: engine.mainMixerNode, format: AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 2))
        let fmt = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!
        let st = self.st
        let node = AVAudioSourceNode(format: fmt) { _, _, frameCount, abl -> OSStatus in
            let buffers = UnsafeMutableAudioBufferListPointer(abl)
            let n = Int(frameCount)
            guard let out = buffers.first?.mData?.assumingMemoryBound(to: Float.self) else { return noErr }
            if st[8] < 0.5 {
                // 분홍 소음 — Paul Kellet 필터(흰 소음 → -3dB/옥타브)
                for i in 0..<n {
                    let w = Float.random(in: -1...1)
                    st[0] = 0.99886 * st[0] + w * 0.0555179
                    st[1] = 0.99332 * st[1] + w * 0.0750759
                    st[2] = 0.96900 * st[2] + w * 0.1538520
                    st[3] = 0.86650 * st[3] + w * 0.3104856
                    st[4] = 0.55000 * st[4] + w * 0.5329522
                    st[5] = -0.7616 * st[5] - w * 0.0168980
                    let p = st[0] + st[1] + st[2] + st[3] + st[4] + st[5] + st[6] + w * 0.5362
                    st[6] = w * 0.115926
                    out[i] = p * 0.11
                }
            } else {
                // 갈색 소음 — 흰 소음을 쌓되 조금씩 새게 해(0으로 끌어당김) 낮고 둥근 소리
                for i in 0..<n {
                    let w = Float.random(in: -1...1)
                    st[7] = (st[7] + 0.02 * w) / 1.02
                    out[i] = st[7] * 3.2
                }
            }
            for b in buffers.dropFirst() { if let d = b.mData { memcpy(d, out, n * MemoryLayout<Float>.size) } }
            return noErr
        }
        engine.attach(node)
        engine.connect(node, to: engine.mainMixerNode, format: fmt)
        noiseNode = node
        engine.prepare()
        wired = true
    }

    // 고른 소리만 들리게 — 빗소리는 플레이어, 소음은 소스 노드(나머지는 볼륨 0)
    private func startSource() {
        loopGen += 1                                // 먼저 세대를 올리고 멈춘다 — stop()이 부르는 옛 완료 콜백이 다시 줄 세우지 않게
        player.stop()
        if let name = Self.files[soundId], let url = Bundle.main.url(forResource: name, withExtension: "m4a") {
            let gen = loopGen
            enqueue(url, gen); enqueue(url, gen)    // 늘 2개를 줄 세워 둔다 → 하나가 끝나는 순간 다음 것이 바로 이어짐
        } else if isFile {
            NSLog("[SleepSound] \(soundId) 파일 없음")
        }
        st[8] = soundId == "brown" ? 1 : 0
    }

    // 파일 하나를 줄 세우고, 그게 다 읽히면(dataConsumed) 같은 세대일 때만 하나 더 — 9시간 내내 2개 대기
    private func enqueue(_ url: URL, _ gen: Int) {
        guard let f = try? AVAudioFile(forReading: url) else { NSLog("[SleepSound] 파일 열기 실패 \(url.lastPathComponent)"); return }
        player.scheduleFile(f, at: nil, completionCallbackType: .dataConsumed) { [weak self] _ in
            DispatchQueue.main.async {
                guard let self, gen == self.loopGen, self.playing else { return }
                self.enqueue(url, gen)
            }
        }
    }

    private func applyVolume() {
        let out = gain * volume
        player.volume = isFile ? out : 0
        noiseNode?.volume = isFile ? 0 : out
    }

    private func fade(to target: Float, seconds: Double, done: (() -> Void)? = nil) {
        fadeTimer?.cancel()
        let steps = max(1, Int(seconds * 30)); let start = gain; var i = 0
        let t = DispatchSource.makeTimerSource(queue: .main)
        t.schedule(deadline: .now(), repeating: seconds / Double(steps))
        t.setEventHandler { [weak self] in
            guard let self else { return }
            i += 1
            self.gain = start + (target - start) * Float(i) / Float(steps)
            self.applyVolume()
            if i >= steps { self.fadeTimer?.cancel(); self.fadeTimer = nil; done?() }
        }
        fadeTimer = t; t.resume()
    }

    // 끝 시각 60초 전부터 서서히 줄이고 끝에서 정지
    private func scheduleEnd() {
        endTimer?.cancel(); endTimer = nil
        guard let e = endAt else { return }
        let lead = max(0, e.timeIntervalSinceNow - 60)
        let t = DispatchSource.makeTimerSource(queue: .main)
        t.schedule(deadline: .now() + lead)
        t.setEventHandler { [weak self] in
            guard let self, self.playing else { return }
            let left = max(1, e.timeIntervalSinceNow)
            self.fade(to: 0, seconds: left) { [weak self] in self?.finishStop() }
        }
        endTimer = t; t.resume()
    }

    private func finishStop() {
        fadeTimer?.cancel(); fadeTimer = nil
        endTimer?.cancel(); endTimer = nil
        loopGen += 1
        player.stop()
        if engine.isRunning { engine.stop() }
        playing = false; interrupted = false; endAt = nil; gain = 0
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        save(); updateNowPlaying(); emit()
    }

    // MARK: - 끊김 처리

    @objc private func onInterruption(_ n: Notification) {
        guard let info = n.userInfo, let raw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
        if type == .began {
            if playing { interrupted = true; fadeTimer?.cancel(); fadeTimer = nil }
        } else if type == .ended {
            guard interrupted else { return }
            let opts = AVAudioSession.InterruptionOptions(rawValue: (info[AVAudioSessionInterruptionOptionKey] as? UInt) ?? 0)
            let beforeEnd = endAt.map { $0.timeIntervalSinceNow > 60 } ?? true
            if opts.contains(.shouldResume) && beforeEnd {
                play(sound: soundId, volume: volume, endAt: endAt)     // 다시 5초 서서히
            } else {
                finishStop()
            }
        }
    }

    @objc private func onRouteChange(_ n: Notification) {
        guard let raw = n.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: raw) else { return }
        if reason == .oldDeviceUnavailable && playing {
            DispatchQueue.main.async { self.finishStop() }        // 이어폰·블루투스 빠짐 → 스피커로 크게 안 나게 멈춤
        }
    }

    @objc private func onEngineConfig(_ n: Notification) {
        // 출력 장치가 바뀌면 엔진이 멈춘다 → 재생 중이었으면 다시 연결해 켠다(끊김 처리 중이면 그쪽에 맡김)
        guard playing, !interrupted else { return }
        DispatchQueue.main.async {
            do { self.startSource(); try self.engine.start(); if self.isFile { self.player.play() }; self.applyVolume() }
            catch { NSLog("[SleepSound] 엔진 재시작 실패: \(error)"); self.finishStop() }
        }
    }

    @objc private func onMediaReset(_ n: Notification) {
        let was = playing
        DispatchQueue.main.async {
            self.engine.stop(); self.engine.reset()
            self.playing = false; self.interrupted = false
            if was { self.play(sound: self.soundId, volume: self.volume, endAt: self.endAt) }
        }
    }

    // MARK: - 잠금화면 「지금 재생 중」

    private func setupRemoteCommands() {
        let c = MPRemoteCommandCenter.shared()
        c.playCommand.addTarget { [weak self] _ in
            guard let self else { return .commandFailed }
            if !self.playing { self.play(sound: self.soundId, volume: self.volume, endAt: self.endAt) }
            return .success
        }
        c.pauseCommand.addTarget { [weak self] _ in self?.stop(); return .success }
        c.stopCommand.addTarget { [weak self] _ in self?.stop(); return .success }
        c.togglePlayPauseCommand.addTarget { [weak self] _ in
            guard let self else { return .commandFailed }
            if self.playing { self.stop() } else { self.play(sound: self.soundId, volume: self.volume, endAt: self.endAt) }
            return .success
        }
        [c.nextTrackCommand, c.previousTrackCommand, c.skipForwardCommand, c.skipBackwardCommand, c.seekForwardCommand, c.seekBackwardCommand]
            .forEach { $0.isEnabled = false }
    }

    private func updateNowPlaying() {
        let center = MPNowPlayingInfoCenter.default()
        guard playing else { center.nowPlayingInfo = nil; return }
        var info: [String: Any] = [MPMediaItemPropertyTitle: Self.sounds[soundId] ?? "잠 소리",
                                   MPMediaItemPropertyArtist: "꼼모닝 잠 소리",
                                   MPNowPlayingInfoPropertyIsLiveStream: true,
                                   MPNowPlayingInfoPropertyPlaybackRate: 1.0]
        if let img = UIImage(named: "AppIcon") ?? UIImage(named: "SleepArtwork") {
            info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: img.size) { _ in img }
        }
        center.nowPlayingInfo = info
    }

    // MARK: - 저장·알림

    private func save() {
        guard let d = UserDefaults(suiteName: appGroup) else { return }
        d.set(playing, forKey: "sleepSound.playing")
        d.set(soundId, forKey: "sleepSound.sound")
        d.set(volume, forKey: "sleepSound.volume")
        if let e = endAt { d.set(e.timeIntervalSince1970, forKey: "sleepSound.endAt") } else { d.removeObject(forKey: "sleepSound.endAt") }
    }

    private func emit() { onChange?(status()) }
}

@objc(SleepSoundPlugin)
public class SleepSoundPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SleepSoundPlugin"
    public let jsName = "SleepSound"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setVolume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
    ]

    public override func load() {
        // 명령은 바로 돌려주고, 상태 변화(끝 시각·전화·이어폰·잠금화면 조작)는 'state' 이벤트로 웹에 알린다.
        SleepSoundManager.shared.onChange = { [weak self] s in self?.notifyListeners("state", data: s) }
    }

    @objc func play(_ call: CAPPluginCall) {
        let sound = call.getString("sound")
        let volume = call.getDouble("volume").map { Float($0) }
        let endMs = call.getDouble("endAt")
        DispatchQueue.main.async {
            SleepSoundManager.shared.play(sound: sound, volume: volume, endAt: endMs.map { Date(timeIntervalSince1970: $0 / 1000) })
            call.resolve(SleepSoundManager.shared.status())
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async { SleepSoundManager.shared.stop(); call.resolve() }
    }

    @objc func setVolume(_ call: CAPPluginCall) {
        let v = Float(call.getDouble("volume") ?? 0.6)
        DispatchQueue.main.async { SleepSoundManager.shared.setVolume(v); call.resolve(SleepSoundManager.shared.status()) }
    }

    @objc func status(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(SleepSoundManager.shared.status()) }
    }
}
