# RTDB 규칙 시험 (에뮬레이터)

`database.rules.json`을 바꾸면 배포 전에 돌린다. 실서버는 안 건드림.

```bash
# 1) 실데이터 백업(읽기 전용, 규칙상 루트 읽기는 막혀 있으니 관리자 토큰으로)
TOKEN=$(gcloud auth print-access-token)
curl -s "https://kkom-morning-default-rtdb.asia-southeast1.firebasedatabase.app/.json?access_token=$TOKEN" -o /tmp/rtdb-backup.json
# 2) 에뮬레이터에서 시험 (자바 = brew openjdk). 이 폴더에 firebase.json·규칙 사본을 두고 실행
export JAVA_HOME=/opt/homebrew/opt/openjdk PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
firebase emulators:exec --only database --project demo-kkom "node rest.mjs /tmp/rtdb-backup.json && node sdk.mjs"
```
- 에뮬레이터 이름공간은 `demo-kkom-default-rtdb`(그냥 `demo-kkom`이면 규칙이 안 걸려 다 통과해 버림).
- 배포: `curl -X PUT ".../.settings/rules.json?access_token=$TOKEN" --data-binary @database.rules.json`
- 앱·웹·서버·워치가 새 RTDB 경로를 쓰기 시작하면 규칙과 rest.mjs에 같이 추가할 것(안 그러면 그 기능만 조용히 막힘).
