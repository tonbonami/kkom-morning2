# 꼼이 피부 일지 — 보안 1단계 설정

## 지금 상태 (2026-10-21 직접 확인)

- Firestore·Storage·실시간 DB 규칙이 셋 다 `누구나 읽기·쓰기 허용`(`if true`)이다. **기한이 없어서 날짜가 지나도 앱이 멈추지는 않는다.** "테스트 모드 만료 임박" 메모는 옛 정보였다.
- 그래서 프로젝트 ID만 알면(앱 코드에 들어 있다) 누구나 채팅·편지를 읽을 수 있는 구조다. 피부 기록은 이 열린 곳에 넣으면 안 된다.

## 1단계에서 만든 것 (코드, 배포됨, 설정 전엔 꺼진 상태)

| 파일 | 하는 일 |
|---|---|
| `src/lib/firebaseAdmin.ts` | 서버 전용 Firebase Admin. 규칙을 우회해서 `skin/**`를 다룬다 |
| `src/lib/skinAuth.ts` | 꼼이 PIN 확인(5번 틀리면 15분 잠금) → 서버가 서명한 httpOnly 쿠키(180일). `requireOwner()`로 다른 라우트를 막는다 |
| `src/app/api/skin/session` | GET 상태 · POST `{pin}` 로그인 · DELETE 로그아웃. 설정 전엔 503 |
| `firestore.rules` · `storage.rules` | 기존 경로는 그대로 열고 **`skin`만 차단**. 배포 전 시험(Rules API test) 78건 통과 |

## 우댕이 직접 할 것 (비밀 값이라 Claude가 대신 넣지 않는다)

1. **서비스 계정 키 받기**
   Firebase 콘솔 → kkom-morning → 톱니바퀴(프로젝트 설정) → **서비스 계정** 탭 → **새 비공개 키 생성** → JSON 다운로드.
2. **한 줄로 바꿔 복사** (터미널):
   ```bash
   base64 -i ~/Downloads/kkom-morning-firebase-adminsdk-*.json | tr -d '\n' | pbcopy
   ```
3. **Vercel에 넣기** — vercel.com → kkommorning-v2 → Settings → Environment Variables (Production·Preview):
   - `FIREBASE_SERVICE_ACCOUNT_B64` = 2번에서 복사한 값
   - `SKIN_SESSION_SECRET` = 아래 명령으로 만든 값
     ```bash
     openssl rand -base64 48 | pbcopy
     ```
   - `SKIN_PIN_KKOMI` = 꼼이가 정한 PIN (6자리 이상 권장, 꼼모닝 로그인 코드와 다르게)
4. Vercel → Deployments → 최신 배포 **Redeploy** (env는 새 배포부터 적용).
5. 다운로드한 JSON 파일 **삭제** (Vercel에만 있으면 된다).

확인: `https://kkommorning-v2.vercel.app/api/skin/session` 이 `{"configured":true,...}` 이면 끝.

## 규칙 배포 (Claude가 우댕 OK 받고 실행)

```bash
firebase deploy --only firestore:rules,storage
```

- 바뀌는 건 `skin` 경로 차단 하나. 다른 데이터·기능은 그대로다(시험 78건).
- 되돌리기: 두 파일의 `if collection != 'skin'` / `if top != 'skin'` 을 `if true`로 바꿔 다시 배포.
- 실시간 DB(낙서장·푸시 토큰) 규칙은 이번에 건드리지 않는다.

## 다음 단계 (참고)

`/quick/skin` + `/api/skin/log` → 약 알림 크론 → 아티팩트 기록 옮기기 → 2~3주 뒤 분석·병원 보고서.
꼼모닝 전체를 잠그는 일(Firebase Auth 도입)은 서버 알림 라우트까지 Admin으로 옮겨야 해서 따로 크게 할 일이다.
