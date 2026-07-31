# 꼼모닝 Apple Watch — W1 세팅 (Xcode 타깃 생성)

코드는 전부 완성·타입체크 통과됨. **타깃 2개만 Xcode 마법사로 만들고 이 파일들을 붙이면** 끝.
(pbxproj 수동 편집은 지금 잘 도는 프로젝트가 깨질 위험이라 안 함 — KkomWidget 만든 방식 그대로.)

## A. 워치 앱 타깃
1. Xcode에서 `App.xcworkspace` 열기
2. **File ▸ New ▸ Target…** → **watchOS** 탭 → **App** → Next
3. Product Name: **`KkomWatch`** / Team: **Woosoo Kim(JDDK6B2EKF, 괄호 없는 유료)** /
   Interface **SwiftUI** / Language **Swift** / "Include Notification Scene" 등 체크박스 **전부 해제**
   - Bundle ID는 자동 생성값(`com.tonbonami.kkommorning.watchkitapp` 형태) **그대로** — iOS 앱 밑에 nested 돼야 컴패니언으로 자동 연결됨
4. Finish (Activate scheme 물으면 Activate)
5. Xcode가 만든 기본 파일 `KkomWatchApp.swift`, `ContentView.swift` → **Move to Trash**
6. **File ▸ Add Files to "App"…** → 이 폴더(`KkomWatch/`)의
   `FireREST.swift` · `WatchStore.swift` · `KkomWatchApp.swift` · `ContentView.swift` 선택
   → "Copy items" **해제**, **Target: KkomWatch 체크** → Add

## B. 컴플리케이션(워치 위젯) 타깃
1. **File ▸ New ▸ Target…** → **watchOS** 탭 → **Widget Extension** → Next
2. Product Name: **`KkomWatchWidget`** / "Include Live Activity" **해제** / "Configuration App Intent" **해제**
   / Embed in: **KkomWatch**
3. Finish
4. 기본 생성 파일 삭제 → `KkomWatchWidget/KkomWatchWidget.swift`를 **Target: KkomWatchWidget**에 추가

## C. App Group (두 워치 타깃 모두)
각 타깃 ▸ **Signing & Capabilities** ▸ **+ Capability** ▸ **App Groups**
→ `group.com.tonbonami.kkommorning` 체크

## D. 배포 타깃
두 타깃 watchOS Deployment Target **10.0 이상** (onChange 2-파라미터·accessory 위젯 요건)

## E. 실행·확인
- 스킴 **KkomWatch** → Apple Watch 시뮬레이터/실기기 → Run
- 첫 실행 "나는 누구?" → 우댕/꼼이 선택
- 접속 상태 + D-day + 하트 버튼 표시. 상대가 웹/폰에서 하트 던지면 **손목 진동**(앱 열려있을 때)
- 문자판: 길게 눌러 Edit → 컴플리케이션 슬롯에 **꼼모닝** 추가

## 동작 요약 (W1)
- **통신**: Firestore REST 직접(인증 없음, apiKey 공개값). presence 4초 폴링 + 하트 4초 폴링.
- **시계보정**: Firestore 응답 `Date` 헤더로 서버 현재시각 → `serverNow`.
- **하트**: 버튼 탭 → `liveHearts/{상대}` 덮어씀(웹과 동일). 수신 시 nonce 변화 감지 → `.notification` 햅틱.
- **컴플리케이션**: 워치 앱이 앱그룹 `kkomWatchState`에 스냅샷 저장 → 위젯이 읽어 렌더(30초 스로틀 리로드).
- **범위 밖(W2 이후)**: 백그라운드 실시간(APNs 필요) · 워치가 자기 presence 쓰기 · 미세먼지 · 낙서 썸네일.
