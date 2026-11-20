#!/usr/bin/env bash
# 꼼모닝 자동 배포 — 빌드번호 +1 → 아카이브 → TestFlight 업로드 (한 방)
# 사용법: scripts/deploy.sh
# 준비물(한 번만): scripts/.deploy-env (ASC_KEY_ID, ASC_ISSUER_ID)
#                 ~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="scripts/.deploy-env"
[[ -f "$ENV_FILE" ]] || { echo "❌ $ENV_FILE 없음 — scripts/.deploy-env.example 복사해 값 채우기"; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"
: "${ASC_KEY_ID:?ASC_KEY_ID 미설정}"
: "${ASC_ISSUER_ID:?ASC_ISSUER_ID 미설정}"

P8="$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8"
[[ -f "$P8" ]] || { echo "❌ API 키 없음: $P8"; echo "   다운받은 .p8 를 그 경로에 (이름 AuthKey_${ASC_KEY_ID}.p8)"; exit 1; }

WORKSPACE="ios/App/App.xcworkspace"
SCHEME="App"
PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"
ARCHIVE="ios/App/build/App.xcarchive"
EXPORT="ios/App/build/export"

# ── 빌드번호 +1 (전 타깃 동기화) ──
CUR="$(grep -m1 -o 'CURRENT_PROJECT_VERSION = [0-9]*' "$PBXPROJ" | grep -o '[0-9]*')"
NEXT=$((CUR + 1))
echo "▶ 빌드번호 ${CUR} → ${NEXT}"
sed -i '' "s/CURRENT_PROJECT_VERSION = ${CUR};/CURRENT_PROJECT_VERSION = ${NEXT};/g" "$PBXPROJ"

# ── 아카이브 ──
echo "▶ 아카이브 (몇 분 걸림)"
rm -rf "$ARCHIVE"
xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$P8" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  clean archive

# ── 익스포트(IPA) → API 키로 TestFlight 업로드 ──
# ⚠️ 11/21 빌드 69: exportArchive 의 destination=upload 가 「Account credentials have expired」(Xcode 계정 로그인 만료)로 실패.
#    API 키를 줘도 Xcode 계정을 쓰려 해서다 → IPA 로 내보낸 뒤 altool 이 API 키로 올린다(로그인 필요 없음).
echo "▶ IPA 내보내기"
rm -rf "$EXPORT"
LOCAL_OPTS="$(mktemp -t ExportLocal).plist"
sed 's|<string>upload</string>|<string>export</string>|' ios/ExportOptions.plist > "$LOCAL_OPTS"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT" \
  -exportOptionsPlist "$LOCAL_OPTS" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$P8" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"
rm -f "$LOCAL_OPTS"

echo "▶ TestFlight 업로드"
xcrun altool --upload-app --type ios -f "$EXPORT/App.ipa" --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

echo ""
echo "✅ build ${NEXT} 업로드 완료 → App Store Connect 처리(몇 분) 후 TestFlight에 뜸"
echo "   (빌드번호 커밋 잊지 말기: git commit)"
