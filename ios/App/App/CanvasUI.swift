import SwiftUI

// 제미나이 시안 (2026-10-20, 우댕 전달) — 낙서장 댓글창 + 대고 그리기 조작부. 값 그대로.

// MARK: - 공통 디자인 요소 (Theme)
extension Color {
    static let themeCream = Color(red: 1.0, green: 0.988, blue: 0.961)
    static let themeInk = Color(red: 0.20, green: 0.25, blue: 0.33)
    static let kkomi = Color(red: 0.98, green: 0.48, blue: 0.66)
    static let udaeng = Color(red: 0.49, green: 0.83, blue: 0.99)
    static let themeShadow = Color(red: 0.47, green: 0.39, blue: 0.31).opacity(0.14)

    static func userColor(for name: String) -> Color {
        if name.contains("꼼이") { return .kkomi }
        if name.contains("우댕") { return .udaeng }
        return .gray
    }
}

// MARK: - 1. CanvasCommentSheet (그림 댓글창)
struct CanvasCommentItem: Identifiable, Equatable {
    let id: String
    let by: String
    let text: String
    let at: Date?
}

struct CanvasCommentSheet: View {
    let comments: [CanvasCommentItem]
    let myName: String
    let onSend: (String) -> Void
    let onDelete: (String) -> Void
    let onClose: () -> Void

    @State private var inputText: String = ""

    var body: some View {
        VStack(spacing: 0) {
            // 헤더 영역
            HStack {
                HStack(spacing: 6) {
                    Text("댓글")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.themeInk)

                    Text("\(comments.count)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.themeInk.opacity(0.6))
                        .clipShape(Capsule())
                }

                Spacer()

                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(Color.themeInk.opacity(0.3))
                }
            }
            .padding(20)
            .background(Color.themeCream)

            // 댓글 목록 영역
            ScrollViewReader { proxy in
                ScrollView {
                    if comments.isEmpty {
                        VStack(spacing: 12) {
                            Spacer().frame(height: 60)
                            Image(systemName: "bubble.left.and.bubble.right.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.themeInk.opacity(0.2))
                            Text("아직 댓글이 없어요")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.themeInk)
                            Text("그림에 다정한 한마디 남겨 볼까?")
                                .font(.system(size: 16))
                                .foregroundColor(.themeInk.opacity(0.6))
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        LazyVStack(spacing: 16) {
                            ForEach(comments) { comment in
                                CommentRow(comment: comment, isMe: comment.by == myName, onDelete: onDelete)
                                    .id(comment.id)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 10)
                        .padding(.bottom, 20)
                    }
                }
                .background(Color.themeCream)
                .onChange(of: comments.count) { _ in // iOS 16 호환
                    scrollToBottom(proxy: proxy)
                }
                .onAppear {
                    scrollToBottom(proxy: proxy)
                }
            }

            // 입력창 영역
            VStack {
                HStack(alignment: .bottom, spacing: 12) {
                    TextField("댓글 달기...", text: $inputText, axis: .vertical)
                        .font(.system(size: 16))
                        .foregroundColor(.themeInk)
                        .lineLimit(1...4)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.themeInk.opacity(0.1), lineWidth: 1)
                        )

                    Button(action: {
                        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !trimmed.isEmpty {
                            onSend(trimmed)
                            inputText = ""
                        }
                    }) {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(
                                inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?
                                Color.themeInk.opacity(0.2) : Color.userColor(for: myName)
                            )
                            .clipShape(Circle())
                    }
                    .disabled(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .background(Color.themeCream.ignoresSafeArea(.all, edges: .bottom))
            .shadow(color: .themeShadow, radius: 8, x: 0, y: -4)
        }
        .background(Color.themeCream.ignoresSafeArea())
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        if let lastId = comments.last?.id {
            withAnimation {
                proxy.scrollTo(lastId, anchor: .bottom)
            }
        }
    }
}

// 댓글 한 줄 UI
struct CommentRow: View {
    let comment: CanvasCommentItem
    let isMe: Bool
    let onDelete: (String) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if !isMe { avatarView }

            VStack(alignment: isMe ? .trailing : .leading, spacing: 4) {
                HStack(alignment: .bottom, spacing: 6) {
                    if isMe {
                        timeView
                        nameView
                    } else {
                        nameView
                        timeView
                    }
                }

                Text(comment.text)
                    .font(.system(size: 16))
                    .foregroundColor(.themeInk)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(isMe ? Color.userColor(for: comment.by).opacity(0.15) : Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.themeInk.opacity(0.05), lineWidth: 1)
                    )
            }

            if isMe { avatarView }
        }
        .frame(maxWidth: .infinity, alignment: isMe ? .trailing : .leading)
        .contextMenu {
            if isMe {
                Button(role: .destructive) {
                    onDelete(comment.id)
                } label: {
                    Label("삭제", systemImage: "trash")
                }
            }
        }
    }

    private var avatarView: some View {
        Text(String(comment.by.prefix(1)))
            .font(.system(size: 14, weight: .bold))
            .foregroundColor(.white)
            .frame(width: 32, height: 32)
            .background(Color.userColor(for: comment.by))
            .clipShape(Circle())
    }

    private var nameView: some View {
        Text(comment.by)
            .font(.system(size: 14, weight: .bold))
            .foregroundColor(.themeInk.opacity(0.8))
    }

    @ViewBuilder
    private var timeView: some View {
        if let date = comment.at {
            Text(relativeTime(date))
                .font(.system(size: 12))
                .foregroundColor(.themeInk.opacity(0.5))
        }
    }

    // 시간 표시 로직 (iOS 16 지원)
    private func relativeTime(_ date: Date) -> String {
        let calendar = Calendar.current
        let now = Date()

        if calendar.isDateInToday(date) {
            let components = calendar.dateComponents([.minute, .hour], from: date, to: now)
            if let hour = components.hour, hour > 0 {
                let formatter = DateFormatter()
                formatter.dateFormat = "a h:mm"
                formatter.locale = Locale(identifier: "ko_KR")
                return formatter.string(from: date)
            } else if let minute = components.minute, minute > 0 {
                return "\(minute)분 전"
            } else {
                return "방금"
            }
        } else if calendar.isDateInYesterday(date) {
            return "어제"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "M월 d일"
            return formatter.string(from: date)
        }
    }
}


// MARK: - 2. 대고 그리기 조작부 (Tracing Controls)

// (a) 사진 버튼 라벨
struct TraceButtonLabel: View {
    let active: Bool

    var body: some View {
        Image(systemName: active ? "photo.badge.checkmark.fill" : "photo")
            .font(.system(size: 18, weight: .medium))
            .foregroundColor(active ? .white : .themeInk)
            .frame(width: 42, height: 42)
            .background(active ? Color.udaeng : Color.white)
            .clipShape(Circle())
            .shadow(color: .themeShadow, radius: 10, x: 0, y: 4)
    }
}

// (b) 위치 맞추는 중에 뜨는 패널
struct TraceAdjustPanel: View {
    @Binding var opacity: Double
    let onCancel: () -> Void
    let onLock: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            Text("사진을 밀어서 옮기고,\n두 손가락으로 크기를 맞춰요")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.themeInk)
                .multilineTextAlignment(.center)
                .lineSpacing(4)

            HStack(spacing: 12) {
                Image(systemName: "circle.dotted")
                    .foregroundColor(.themeInk.opacity(0.5))
                    .font(.system(size: 18))

                Slider(value: $opacity, in: 0.1...0.9)
                    .accentColor(.themeInk)

                Image(systemName: "circle.fill")
                    .foregroundColor(.themeInk.opacity(0.8))
                    .font(.system(size: 18))
            }
            .padding(.horizontal, 8)

            HStack(spacing: 12) {
                Button(action: onCancel) {
                    Text("취소")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.themeInk)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white.opacity(0.8))
                        .clipShape(Capsule())
                }

                Button(action: onLock) {
                    HStack(spacing: 6) {
                        Image(systemName: "lock.fill")
                        Text("잠그고 그리기")
                    }
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.themeInk)
                    .clipShape(Capsule())
                }
            }
        }
        .padding(20)
        .frame(maxWidth: 340)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .themeShadow, radius: 10, x: 0, y: 6)
    }
}

// (c) 잠근 뒤 작게 남는 막대
struct TraceBar: View {
    @Binding var opacity: Double
    let onUnlock: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            Button(action: onUnlock) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(Color.themeInk)
                    .clipShape(Circle())
            }

            HStack(spacing: 12) {
                Image(systemName: "circle.dotted")
                    .foregroundColor(.themeInk.opacity(0.5))
                    .font(.system(size: 16))

                Slider(value: $opacity, in: 0.1...0.9)
                    .accentColor(.themeInk)

                Image(systemName: "circle.fill")
                    .foregroundColor(.themeInk.opacity(0.8))
                    .font(.system(size: 16))
            }
        }
        .padding(.leading, 6)
        .padding(.trailing, 20)
        .padding(.vertical, 6)
        .frame(maxWidth: 340)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .shadow(color: .themeShadow, radius: 10, x: 0, y: 6)
    }
}
