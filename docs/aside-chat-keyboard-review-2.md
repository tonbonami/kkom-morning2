# Aside 의뢰서 2부 — 키보드가 입력칸을 가리는 버그: 내 진단 반박하기

> Teo에게: **1부 보고를 받은 다음에** 이걸 보낸다. 1부와 같은 대화(같은 Aside 작업)에 이어서 넣으면 1부에서 본 화면을 기억한 채로 답한다.
> 이번엔 화면 조작이 거의 없다. 읽고 웹에서 사례를 찾아 반박하는 일이다. 1부의 금지 규칙은 그대로 유효.

---

## 너의 역할

이번엔 **아이폰 웹뷰(WebKit)·Capacitor 키보드 문제를 겪어 본 개발자**다. 아래 진단과 수정안을 **반박하는 쪽**에 서라. 동의할 거면 근거를 대고, 아니면 더 나은 답을 내라.

## 규칙

- 근거 없는 의견 금지. 의견은 `[의견]`으로 표시하고 **근거 주소**(애플·WebKit 버그 트래커·Capacitor 이슈·블로그)를 붙여라.
- 1부에서 네가 직접 본 것과 연결되면 "1부 A-2에서 본 것과 같다"처럼 짚어라.
- 실행 환경을 나눠서 말해라: **① 아이폰 앱(Capacitor, WKWebView) ② 아이폰 사파리 ③ 홈 화면에 추가한 웹앱.** 셋은 키보드·`visualViewport` 동작이 다르다.
- 모르면 "모름".

## 증상

- 아이폰 앱(iOS 26)에서 채팅 입력칸을 누르면 **키보드가 입력칸 아래쪽 절반 이상을 덮는다.** 입력칸 윗부분만 키보드 위로 빼꼼 보인다.
- **빌드 53까지는 괜찮았다.** 그땐 키보드 위에 `^ ∨ ✓`(이전 칸·다음 칸·완료) 막대가 있었고, 입력칸은 그 막대 바로 위에 온전히 보였다.

## 빌드 54에서 바꾼 것

그 막대가 거슬린다고 해서 앱 네이티브 코드에서 없앴다. 웹 입력칸에 포커스가 가면 WebKit이 `WKContentView.inputAccessoryView`로 막대를 붙이는데, 그 값을 nil로 바꿨다:

    // ios/App/App/MainViewController.swift — capacitorDidLoad()에서 한 번 호출
    enum FormAccessoryBar {
        private static var applied = false
        static func hide() {
            guard !applied, let cls = NSClassFromString("WKContentView") else { return }
            let sel = #selector(getter: UIResponder.inputAccessoryView)
            guard let method = class_getInstanceMethod(cls, sel) else { return }
            let none: @convention(block) (AnyObject) -> UIView? = { _ in nil }
            class_replaceMethod(cls, sel, imp_implementationWithBlock(none), method_getTypeEncoding(method))
            applied = true
        }
    }

공식 `@capacitor/keyboard` 플러그인도 같은 방식으로 막대를 숨기지만, 그 플러그인은 **키보드가 뜰 때 웹뷰 크기를 줄이는 동작(resize)** 까지 같이 바꾼다. 채팅 입력창 위치가 흔들릴까 봐 플러그인은 안 쓰고 막대 끄는 부분만 가져왔다.

## 채팅 화면 구조 (키보드 대응 코드 없음)

    // src/components/ChatPanel.tsx — 채팅 전체
    <motion.div className="fixed inset-0 z-[60] flex flex-col" drag="x" ...>   // 화면 전체 고정, 좌우 스와이프로 닫기
      <header .../>
      <div className="flex-1 overflow-y-auto">…메시지…</div>
      <div className="px-3 pt-2 border-t"
           style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.25rem)' }}>  // 아래 안전영역 여백(약 34pt)
        <div className="flex items-end gap-1 rounded-[26px] p-1.5 …">            // 둥근 입력줄
          <button>＋</button><textarea rows={1} …/><button>☺</button>
        </div>
      </div>
    </motion.div>

- 키보드가 뜰 때 화면 높이를 맞추는 코드가 **하나도 없다.** WebKit이 "포커스된 입력칸이 보이게" 알아서 밀어 올려 주는 것에만 기댄다.
- Capacitor 6, `ios.contentInset: 'always'`. 웹은 Vercel 배포본을 그대로 띄운다.

## 내 진단 (가설 — 아이폰 실기기·시뮬레이터 확인 전)

1. 막대가 있을 때 WebKit은 "키보드 + 막대" 높이만큼 밀어 올렸고, 입력칸이 그 위에 딱 맞았다.
2. 막대를 없애자 **입력칸이 막대 높이(약 60pt)만큼 덜 올라온다.** 사용자 스크린샷 두 장에서 가려진 양이 막대 높이와 거의 같다.
3. 근본 원인은 화면을 키보드에 맞추는 일을 WebKit 자동 스크롤에만 맡긴 것. 막대 제거가 그 약점을 드러냈다.
4. 덤: 키보드가 떠 있어도 아래 안전영역 여백(약 34pt)이 그대로 남아 입력칸과 키보드 사이가 뜬다. 카톡엔 이 틈이 없다.
5. 다른 후보(아직 안 봄): 키보드가 올라오며 보이는 높이가 바뀔 때 메시지 목록을 바닥에 다시 붙이지 않아 생기는 밀림.

## 수정안 (내 추천 순)

1. **웹에서 해결 (추천).** 채팅이 열린 동안 `visualViewport`의 `resize`·`scroll`을 듣고 채팅 전체(`fixed`)를 `height = visualViewport.height`, `top = visualViewport.offsetTop`으로 맞춘다. 키보드가 떠 있으면 안전영역 여백을 줄인다. 웹 배포만으로 반영되고 사파리도 좋아진다.
2. **네이티브에서 해결.** `keyboardWillShow`에서 웹뷰 높이를 키보드만큼 줄인다(플러그인의 resize와 같은 방식). 앱 새 빌드 필요, 모든 화면에 영향.
3. **되돌리기.** 막대 제거 취소 → 입력칸은 보이지만 `^ ∨ ✓` 막대가 돌아온다.

## 답할 것

1. 진단 1~5 각각: 맞다 / 틀리다 / 모름 + 근거.
2. 수정안 1의 위험: WebKit이 따로 또 밀어 올려 **두 번 올라가는 것**, 키보드 애니메이션 중 **덜컥거림**, 좌우 스와이프(닫기)와 충돌, 키보드 종류가 바뀔 때(한글↔이모지·받아쓰기·서드파티) 높이 재계산 — 각각 실제 사례가 있나.
3. 내가 놓친 더 나은 방법이 있나.
4. 실행 환경 ①②③ 중 수정안 1이 **안 통하는** 곳이 있나.
