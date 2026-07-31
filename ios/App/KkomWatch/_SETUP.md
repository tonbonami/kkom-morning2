# 꼼모닝 Apple Watch — W1 상태

## ✅ 완료 (스크립트로 자동 생성 — Xcode 마법사 불필요)
- **KkomWatch** (watchOS 앱 타깃) + **KkomWatchWidget** (컴플리케이션) 생성됨
- 번들ID: `com.tonbonami.kkommorning.watchkitapp` / `.watchkitapp.KkomWatchWidget`
- 팀 JDDK6B2EKF, 자동서명, App Group `group.com.tonbonami.kkommorning`(양쪽 entitlements)
- 위젯 → 워치앱 임베드(컴플리케이션 내장)
- 코드 4+1파일 타깃에 연결됨, watchOS SDK 타입체크 통과
- ⚠️ **App(iOS) 타깃과는 분리** — App/TestFlight 파이프라인 안 건드림(안전)

## ✅ 빌드 검증 완료
- watchOS 26.5 플랫폼 설치됨 + **워치앱+컴플리케이션 실제 빌드 성공**(generic watchOS device)
- Info.plist는 둘 다 완전형 + GENERATE_INFOPLIST_FILE=NO (앱 APPL / 위젯 XPC!)

## ⏳ 남은 것 (네가 해야) — 워치에서 Run
- Xcode 스킴 **KkomWatch** 선택(열면 자동 생성됨) → 기기 **Woosoo의 Apple Watch** → Run
- 첫 실행 "나는 누구?" → 우댕/꼼이 → 접속상태 + D-day + 하트 버튼
- 컴플리케이션: 문자판 길게 눌러 Edit → 슬롯에 **꼼모닝**

## 🔜 W1 검증 후 (꼬미 배포용)
지금은 **우댕 본인 워치에서 Run 테스트** 단계. 꼼이도 받으려면 워치앱을
iOS App에 **companion 임베드**해야 함(Embed Watch Content). W1 동작 확인되면 그때 붙임
— App 아카이브에 영향 주는 단계라 검증 후 진행.

## 동작 요약 (W1)
- Firestore REST 직접(인증X, apiKey 공개값), presence·하트 4초 폴링
- 시계보정: Firestore 응답 Date 헤더 → serverNow
- 하트: 버튼 탭 → liveHearts/{상대} 덮어씀(웹과 동일), 수신 시 nonce 변화 → .notification 햅틱
- 컴플리케이션: 워치앱이 앱그룹 kkomWatchState 저장 → 위젯 렌더(30초 스로틀)
