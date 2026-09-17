import UIKit

// 꼼모닝 공유 확장 — 유튜브/사파리 등에서 '공유 → 꼼모닝' 하면 URL을 받아
//   '이거봐봐'(웹 /api/save-link → Firestore links)에 저장하고 짧게 확인 후 닫힌다.
//   무거운 일(메타 긁기·저장)은 서버가 하므로 여기선 URL 추출 + POST만. 앱은 안 열린다.
class ShareViewController: UIViewController {
    private let APP_GROUP = "group.com.tonbonami.kkommorning"
    private let SAVE_URL = "https://kkommorning-v2.vercel.app/api/save-link"

    private let toast = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.black.withAlphaComponent(0.18)
        setupToast()
        extractURL { [weak self] url in
            guard let self = self else { return }
            guard let url = url else { self.finish(ok: false); return }
            self.save(url: url)
        }
    }

    // MARK: - URL 추출 (public.url 우선, 없으면 텍스트 안의 첫 http 링크)
    private func extractURL(_ done: @escaping (String?) -> Void) {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else { done(nil); return }
        let providers = items.flatMap { $0.attachments ?? [] }

        if let p = providers.first(where: { $0.hasItemConformingToTypeIdentifier("public.url") }) {
            p.loadItem(forTypeIdentifier: "public.url", options: nil) { data, _ in
                DispatchQueue.main.async {
                    if let u = data as? URL { done(u.absoluteString) }
                    else if let s = data as? String { done(s) }
                    else { done(nil) }
                }
            }
            return
        }
        if let p = providers.first(where: { $0.hasItemConformingToTypeIdentifier("public.plain-text") }) {
            p.loadItem(forTypeIdentifier: "public.plain-text", options: nil) { data, _ in
                DispatchQueue.main.async { done((data as? String).flatMap { self.firstURL(in: $0) }) }
            }
            return
        }
        done(nil)
    }

    private func firstURL(in text: String) -> String? {
        guard let re = try? NSRegularExpression(pattern: "https?://[^\\s<]+", options: [.caseInsensitive]) else { return nil }
        let r = NSRange(text.startIndex..., in: text)
        guard let m = re.firstMatch(in: text, options: [], range: r), let rr = Range(m.range, in: text) else { return nil }
        return String(text[rr])
    }

    // MARK: - 저장 (앱그룹에서 로그인 사용자 읽어 from 채움)
    private func save(url: String) {
        let pushUser = UserDefaults(suiteName: APP_GROUP)?.string(forKey: "pushUser") ?? ""
        let from = pushUser == "udaeng" ? "우댕" : (pushUser == "kkomi" ? "꼼이" : "")

        guard let endpoint = URL(string: SAVE_URL) else { finish(ok: false); return }
        var req = URLRequest(url: endpoint)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["url": url, "from": from])
        req.timeoutInterval = 12

        URLSession.shared.dataTask(with: req) { [weak self] _, resp, _ in
            let ok = (resp as? HTTPURLResponse).map { (200..<300).contains($0.statusCode) } ?? false
            DispatchQueue.main.async { self?.finish(ok: ok) }
        }.resume()
    }

    // MARK: - 짧은 확인 토스트 후 닫기
    private func setupToast() {
        toast.translatesAutoresizingMaskIntoConstraints = false
        toast.text = "이거봐봐에 저장 중…"
        toast.textColor = .white
        toast.font = .systemFont(ofSize: 15, weight: .bold)
        toast.textAlignment = .center
        toast.backgroundColor = UIColor(red: 0.98, green: 0.48, blue: 0.66, alpha: 0.97) // #FB7BA8
        toast.layer.cornerRadius = 18
        toast.layer.masksToBounds = true
        toast.alpha = 0
        view.addSubview(toast)
        NSLayoutConstraint.activate([
            toast.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            toast.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            toast.widthAnchor.constraint(greaterThanOrEqualToConstant: 220),
            toast.heightAnchor.constraint(equalToConstant: 52),
        ])
        UIView.animate(withDuration: 0.2) { self.toast.alpha = 1 }
    }

    private func finish(ok: Bool) {
        toast.text = ok ? "이거봐봐에 저장했어 🔖" : "저장 실패 — 다시 시도해줘"
        UIView.animate(withDuration: 0.15) { self.toast.alpha = 1 }
        DispatchQueue.main.asyncAfter(deadline: .now() + (ok ? 0.7 : 1.1)) {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
}
