우댕, 추천 결론은 **소리는 네이티브 Swift가 재생하고, 웹은 선택·설정·상태 표시만 담당**하는 구조예요.

## 1. 재생 방식

- WKWebView의 `<audio>`도 조건에 따라 백그라운드 재생은 가능하지만, 웹뷰 재로드·웹 프로세스 종료·Vercel 통신 문제·JS 타이머 정지 영향을 받아요. 9시간 수면용 핵심 기능으로는 불안합니다.
- Web Audio API는 백그라운드에서 더 쉽게 정지되므로 피하는 게 좋아요.
- 네이티브는 `AVAudioSession(.playback)`과 Background Modes의 Audio를 사용하면 화면 잠금 후에도 계속 재생하도록 iOS가 정식 지원합니다. [Apple 재생 설정 문서](https://developer.apple.com/documentation/avfoundation/configuring-your-app-for-media-playback)

추천 구조:

- `SleepSoundPlugin` 또는 공용 `SleepAudioManager`가 실제 재생을 전담
- 녹음 파일: `AVAudioPlayer` 또는 `AVAudioEngine`
- 코드 생성 소음: `AVAudioEngine`
- 웹: `play(sound, timer, volume)`, `pause()`, `status()`만 호출
- 위젯·Siri·제어 센터도 같은 `SleepAudioManager`를 호출
- 현재 소리·종료 시각·재생 상태는 앱 그룹에 저장

파일 반복만 한다면 처음에는 `AVAudioPlayer`가 가장 단순합니다.

```swift
try session.setCategory(.playback, mode: .default)
try session.setActive(true)
player.numberOfLoops = -1
player.play()
```

## 2. 어디서 켤 것인가

### 앱 안 화면

- 가장 확실합니다.
- 큰 버튼 하나로 “어젯밤 설정 그대로 재생”하게 만드는 게 1순위예요.
- 최초 음량·소리·종료 시각 설정도 여기서 합니다.

### 홈 화면·잠금화면 위젯

- 가능합니다.
- 재생 Intent를 `AudioPlaybackIntent`로 만들면 위젯 확장이 아니라 **앱 프로세스에서 실행**되어 앱 화면을 띄우지 않고 재생을 시작할 수 있습니다. [Apple 위젯 상호작용 문서](https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities)
- 기존 일반 `AppIntent` 버튼을 그대로 쓰면 안 되고, 오디오 재생용 Intent를 별도로 두는 게 안전해요.
- 잠긴 상태의 위젯 버튼은 인증·잠금 해제가 요구될 수 있습니다. 완전히 손대지 않고 즉시 재생되는지는 실제 기기 확인이 필요해요.

솔직한 답은 **위젯이 메인보다 낫지는 않습니다.** 설치 위치에 따라 안 보이거나 상태 갱신이 늦을 수 있어요. 다만 매일 밤 쓰는 보조 버튼으로는 아주 좋습니다.

### iOS 18 제어 센터 컨트롤

- `ControlWidgetButton`과 App Intent로 만들 수 있습니다. [Apple Control Widget 문서](https://developer.apple.com/documentation/WidgetKit/Creating-controls-to-perform-actions-across-the-system)
- 화면을 열지 않고 시작·정지하도록 구성할 수 있어요.
- 잠금화면에서도 접근성이 좋아, 장기적으로는 홈 위젯보다 더 편할 가능성이 큽니다.
- 최소 지원 버전이 iOS 16이므로 `if #available(iOS 18, *)` 분리가 필요합니다.
- `AudioPlaybackIntent`와의 실제 실행 조건은 iOS 18/26 실기기 확인 필요예요.

### Siri·단축어

- App Intent 하나를 공개하면 Siri와 단축어에서 “꼼모닝 빗소리 켜줘”가 가능합니다. [Apple App Intents 문서](https://developer.apple.com/documentation/appintents)
- 앱 화면 없이 시작 가능하게 설계할 수 있어요.
- 침대에서 가장 편할 수 있지만, Siri 인식 실패와 음성 응답이 방해될 수 있어 보조 수단으로 추천합니다.

### 애플워치

- 워치 앱에서 아이폰으로 명령을 보내는 것은 가능하지만, 아이폰 앱이 종료·정지된 상황에서 WatchConnectivity만으로 즉시 깨워 재생한다는 보장은 없습니다.
- 워치 자체에서 재생하면 소리가 워치에서 나옵니다.
- 따라서 1차 기능으로는 제외하고, 나중에 “현재 재생 정지” 정도부터 실기기 검증하는 게 좋아요.

추천 순서는 **앱 안 큰 버튼 → 제어 센터 → 홈 위젯 → Siri → 워치**입니다.

## 3. 소리 자체

첫 버전은 세 가지면 충분해요.

1. 포근한 빗소리
2. 분홍 소음
3. 갈색 소음

백색 소음은 고음이 강해 잘 때 거슬릴 수 있어서 기본값은 빗소리나 갈색 소음을 추천합니다.

### 빗소리 파일

- 직접 녹음하거나 상업적 이용·재배포가 허용된 CC0 음원을 사용
- 라이선스 화면과 다운로드 날짜를 별도로 보관
- YouTube 영상에서 추출하면 안 됩니다.
- 10~20분 정도의 로컬 파일이면 반복감이 적습니다.
- 64kbps AAC 기준 10분 약 5MB, 20분 약 10MB입니다.
- 시작과 끝의 파형·분위기를 맞추고 3~10초 교차 페이드하여 이음새를 제거합니다.
- 완전 무음이나 갑작스러운 큰 빗방울이 반복 경계에 오지 않게 해야 합니다.

압축 파일의 반복 틈까지 확실히 없애려면 `AVAudioEngine`에 디코딩한 버퍼를 순환 예약하는 편이 안전합니다.

### 코드 생성 소음

- 분홍·갈색 소음은 파일 없이 생성 가능하고 반복 이음새도 없습니다.
- 용량이 거의 들지 않고 음색 조정도 쉬워요.
- 다만 구현·장시간 안정성 검증은 파일보다 조금 더 필요합니다.

따라서 첫 빌드는 **빗소리 파일 1개 + 코드 생성 분홍·갈색 소음**을 추천합니다.

## 4. 밤새 안정성

- 전화·FaceTime·Siri·알람: 오디오 세션이 중단됩니다. 중단 종료 시 `shouldResume`일 때만 재개합니다. Siri가 “정지”를 명령했다면 자동 재개하면 안 됩니다. [Apple 인터럽션 처리](https://developer.apple.com/documentation/AVFAudio/handling-audio-interruptions)
- 다른 앱: 기본 `.playback`은 다른 오디오와 경쟁합니다. 처음에는 `mixWithOthers`를 넣지 않는 것이 예측하기 쉽습니다.
- 이어폰·블루투스 해제: 갑자기 스피커로 큰 소리가 나오지 않도록 즉시 일시정지해야 합니다. Apple도 출력 장치 해제 시 정지를 권장합니다. [Apple 경로 변경 처리](https://developer.apple.com/documentation/avfaudio/responding-to-audio-route-changes)
- 네트워크: 음원은 전부 앱 번들에 넣어 네트워크 영향을 없앱니다.
- 메모리: 긴 파일 전체를 대형 PCM으로 올리지 말고 압축 파일 또는 짧은 순환 버퍼를 사용합니다.
- 강제 종료·재부팅·배터리 방전 이후 자동 재생은 기대하면 안 됩니다.

배터리는 화면이 꺼진 최신 아이폰에서 대략 **밤새 3~10% 범위로 예상**하지만, 볼륨·스피커·코덱·기종 차이가 커서 확인 필요예요. TestFlight 빌드로 9시간 실측해야 합니다.

### 아침 알람

- Apple 시계 앱 알람은 우선순위가 높아 빗소리를 중단시키고 울립니다.
- 백색소음은 미디어 음량, 알람은 ‘벨소리 및 알림’ 음량 영향을 받으므로 둘 다 실제 기기에서 확인해야 해요.
- 알람이 끝났다고 무조건 빗소리를 다시 켜면 이미 깬 뒤 다시 소리가 날 수 있습니다.
- 권장: 설정한 아침 종료 시각이 지났으면 재개하지 않고, 그 전의 짧은 전화·Siri 중단만 재개.
- 타사 알람 앱의 동작은 보장할 수 없습니다.

잠금화면에는 `MPNowPlayingInfoCenter`와 `MPRemoteCommandCenter`로 제목, 재생·일시정지·정지를 표시합니다. [Apple 잠금화면 재생 제어](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/MediaPlaybackGuide/Contents/Resources/en.lproj/RefiningTheUserExperience/RefiningTheUserExperience.html)

앱 내부 음량은 별도 슬라이더로 조절하되, 실제 최대치는 아이폰 미디어 음량입니다.

## 5. 타이머·마무리

첫 버전에 필요한 것은 세 가지예요.

- `아침까지`: 기본값. 예: 오전 7시
- `계속 재생`: 직접 끌 때까지
- 시작 시 5초 페이드인

그다음 추가:

- 1·2·4·8시간
- 종료 10분 전부터 페이드아웃
- 평일·주말 종료 시각 기억

JS `setTimeout`에 맡기지 말고 네이티브에서 종료 시각을 관리해야 합니다. 앱을 다시 열었을 때도 앱 그룹의 절대 종료 시각으로 남은 시간을 계산하면 됩니다.

## 6. 커플 앱다운 작은 기능

두 개 중 하나만 추천합니다.

- 꼼이가 재생하면 우댕 화면에 작은 달 아이콘과 “꼼이 잘 준비 중” 표시. 푸시는 보내지 않음.
- 다음 날 앱을 열었을 때만 “어젯밤 8시간 함께했어요”처럼 재생 기록 표시.

실시간 푸시나 정확한 취침·기상 시각 공유는 감시처럼 느껴질 수 있으니 기본 비공개, 명시적 선택으로 두는 게 좋아요.

## 7. 함정

- `UIBackgroundModes = audio`만 추가하고 `AVAudioSession(.playback)`을 빼먹으면 잠금 시 멈출 수 있습니다.
- 반대로 실제 재생 없이 무음 오디오로 앱을 계속 살려 두면 심사 문제가 됩니다. 백그라운드 모드는 실제 오디오 재생에만 사용해야 합니다. [App Review 2.5.4](https://developer.apple.com/app-store/review/guidelines/)
- 웹과 네이티브가 각각 플레이어를 만들면 이중 재생·상태 불일치가 생깁니다. 플레이어는 반드시 하나만 둡니다.
- Vercel에서 음원을 스트리밍하지 않습니다.
- 웹뷰 화면이 재생 상태의 원본이 되면 안 됩니다. 네이티브 상태를 다시 조회해야 합니다.
- 위젯 Intent 파일의 타깃 멤버십과 앱 그룹 권한을 잘못 지정하기 쉽습니다.
- Capacitor 브리지 콜백을 9시간 유지하지 말고, 명령 즉시 반환 후 이벤트로 상태를 전달합니다.
- 앱 프로세스 재생과 위젯 확장 재생을 혼동하면 안 됩니다.
- 외부 TestFlight 테스터라면 첫 빌드는 Beta App Review 대상입니다. 내부 테스터는 별도 조건입니다. [Apple TestFlight 안내](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/)

## 8. 구현 순서

### 첫 빌드

- 네이티브 `SleepAudioManager`
- Background Audio와 `.playback`
- 로컬 빗소리 1개
- 무한 반복
- 앱 안 큰 시작·정지 버튼
- 마지막 음량 기억
- 아침 종료 시각 / 계속 재생
- 5초 페이드인
- 전화·Siri·알람 인터럽션 처리
- 이어폰 해제 시 정지
- 잠금화면 Now Playing 재생·정지
- 9시간 실기기 테스트

### 두 번째

- 분홍·갈색 소음
- iOS 18 제어 센터 컨트롤
- 홈·잠금화면 위젯 `AudioPlaybackIntent`
- Siri·단축어
- 종료 페이드아웃
- 평일·주말 설정

### 세 번째

- 애플워치 원격 제어
- 커플 상태 표시
- 추가 자연음

한 줄 추천은 **첫 빌드에서는 앱 안 버튼을 확실하게 만들고, 검증된 같은 네이티브 재생 엔진을 다음 빌드에서 제어 센터와 위젯에 연결**하는 것입니다.

참고로 Gemini 교차 검토는 명령이 응답 없이 멈춰 이번 답에는 반영하지 않았습니다. 확인하지 못한 의견을 섞지 않았어요.