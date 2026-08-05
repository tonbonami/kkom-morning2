import UserNotifications
import Intents

// 원격 푸시를 가로채 '커뮤니케이션 알림'(상대 아바타 원형 + 이름 강조, 아이메시지 모양)으로 변환.
// payload에 mutable-content:1 이 있을 때만 실행됨(하트/범프). sender(우댕/꼼이)로 아바타 선택.
class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttempt: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest,
                             withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        guard let content = request.content.mutableCopy() as? UNMutableNotificationContent else {
            contentHandler(request.content); return
        }
        self.bestAttempt = content

        let sender = (request.content.userInfo["sender"] as? String) ?? ""
        let avatarName = (sender == "우댕") ? "woodang_avatar" : "kkomi_avatar"

        // NSE 번들에 넣어둔 아바타 PNG → INImage
        var image: INImage? = nil
        if let url = Bundle.main.url(forResource: avatarName, withExtension: "png"),
           let data = try? Data(contentsOf: url) {
            image = INImage(imageData: data)
        }

        let handle = INPersonHandle(value: sender, type: .unknown)
        let person = INPerson(personHandle: handle, nameComponents: nil,
                              displayName: sender.isEmpty ? nil : sender,
                              image: image, contactIdentifier: nil, customIdentifier: nil)

        let intent = INSendMessageIntent(recipients: nil,
                                         outgoingMessageType: .outgoingMessageText,
                                         content: content.body,
                                         speakableGroupName: nil,
                                         conversationIdentifier: "kkom",
                                         serviceName: nil,
                                         sender: person,
                                         attachments: nil)
        intent.setImage(image, forParameterNamed: \.sender)

        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming
        interaction.donate(completion: nil)

        do {
            let updated = try content.updating(from: intent)
            contentHandler(updated)
        } catch {
            contentHandler(content)   // 실패해도 원래 알림은 뜸
        }
    }

    override func serviceExtensionTimeWillExpire() {
        if let handler = contentHandler, let content = bestAttempt { handler(content) }
    }
}
