# 꼼모닝 실시간 데이터베이스(RTDB) 1차 잠금 규칙 검수 의뢰

**이 글 전체가 지시입니다. 파일을 열지 말고 아래 내용만으로 판단해 주세요.** 브라우저로 사이트에 들어가거나 무엇을 누르거나 보내지 마세요. 읽고 답만 해 주세요.

## 배경
- 꼼모닝은 두 사람(우댕·꼼이)만 쓰는 커플 앱입니다. Firebase RTDB 규칙이 지금 `.read: true, .write: true`(완전 개방)라 Google이 경고 메일을 보냈습니다.
- 앱은 Firebase 로그인(auth)을 쓰지 않습니다. 웹은 Firebase JS SDK, iOS 앱·워치·서버(Vercel)는 RTDB REST를 **인증 없이** 부릅니다. 그래서 이번 1차 잠금은 auth 없이 할 수 있는 만큼만 합니다:
  - 루트·상위 노드 통째 읽기/쓰기/삭제 금지
  - 앱이 실제로 쓰는 경로만 열고, 사용자 칸은 `udaeng`/`kkomi`만, 값 모양 검사
- 목표: **두 사람이 쓰는 기능은 하나도 안 깨질 것.** 데이터는 건드리지 않음(규칙만 바꿈).
- 한계(알고 있음): 경로를 아는 사람은 여전히 낙서를 읽거나 한 장씩 지울 수 있음. 2단계에서 로그인으로 막을 예정.

## 검수해 줄 것 (중요한 순서)
1. **안 깨지나**: 아래 「코드가 하는 RTDB 요청 전부」 각각이 새 규칙에서 허용되는지. 막히는 게 하나라도 있으면 그 요청과 이유를 정확히.
   - RTDB 규칙 특성 주의: `.write`는 위에서 한 번 허용되면 아래서 못 뺌, `.validate`는 쓰는 노드마다, `null`(삭제)은 `.validate` 안 탐, 빈 객체 `{}`는 삭제와 같음, multi-path update는 경로마다 따로 검사, `$wildcard`는 이름 있는 형제가 있으면 그쪽이 우선.
   - 서버 시각 `{".sv":"timestamp"}`는 검사 전에 숫자로 바뀜.
2. **놓친 경로**: 아래 목록 말고 앱이 쓸 법한 RTDB 경로가 보이면(예: onDisconnect, 예전 빌드가 쓰는 모양) 알려 주세요.
3. **구멍**: 1차 목표(통째 읽기·쓰기·삭제, 엉뚱한 경로, 모르는 사용자 이름, 엉뚱한 값) 기준으로 아직 뚫린 곳.
4. 수정안은 바로 붙여 쓸 수 있는 JSON 조각으로.

결과 형식: 총평 → 1~4 항목별(판정 / 근거 / 수정안) → 확신 못 하는 부분.

## 새 규칙 (database.rules.json)
```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "canvas": {
      "book": {
        ".read": true,
        "currentPage": {
          ".write": true,
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 64"
        },
        "pages": {
          "$pid": {
            ".write": "$pid.length <= 64",
            ".validate": "newData.hasChildren(['t'])",
            "t": { ".validate": "newData.isNumber()" },
            "$other": { ".validate": false }
          }
        },
        "$other": { ".validate": false }
      },

      "$page": {
        ".write": "!newData.exists() && $page.length <= 64",

        "strokes": {
          ".read": true,
          ".write": "!newData.exists()",
          "$user": {
            ".write": "!newData.exists() && ($user === 'udaeng' || $user === 'kkomi')",
            "$id": {
              ".write": "($user === 'udaeng' || $user === 'kkomi') && $id.length <= 64",
              ".validate": "newData.hasChildren(['color', 'size', 'points'])",
              "color": { ".validate": "newData.isString() && newData.val().length <= 32" },
              "size": { ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() <= 200" },
              "points": {
                "$i": {
                  ".validate": "newData.hasChildren(['x', 'y'])",
                  "x": { ".validate": "newData.isNumber()" },
                  "y": { ".validate": "newData.isNumber()" },
                  "p": { ".validate": "newData.isNumber()" },
                  "$other": { ".validate": false }
                }
              },
              "by": { ".validate": "newData.isString() && newData.val().length <= 16" },
              "t": { ".validate": "newData.isNumber()" },
              "tool": { ".validate": "newData.isString() && newData.val().length <= 16" },
              "$other": { ".validate": false }
            }
          }
        },

        "live": {
          "$user": {
            ".read": true,
            ".write": "$user === 'udaeng' || $user === 'kkomi'",
            ".validate": "newData.hasChildren(['color', 'size', 'points'])",
            "id": { ".validate": "newData.isString() && newData.val().length <= 64" },
            "color": { ".validate": "newData.isString() && newData.val().length <= 32" },
            "size": { ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() <= 200" },
            "points": {
              "$i": {
                ".validate": "newData.hasChildren(['x', 'y'])",
                "x": { ".validate": "newData.isNumber()" },
                "y": { ".validate": "newData.isNumber()" },
                "p": { ".validate": "newData.isNumber()" },
                "$other": { ".validate": false }
              }
            },
            "tool": { ".validate": "newData.isString() && newData.val().length <= 16" },
            "$other": { ".validate": false }
          }
        },

        "meta": {
          ".read": true,
          "passageUrl": {
            ".write": true,
            ".validate": "newData.isString() && newData.val().length <= 2048"
          },
          "$other": { ".validate": false }
        },

        "react": {
          ".read": true,
          "likes": {
            "$user": {
              ".write": "$user === 'udaeng' || $user === 'kkomi'",
              ".validate": "newData.isBoolean()"
            }
          },
          "comments": {
            "$cid": {
              ".write": "$cid.length <= 64",
              ".validate": "newData.hasChildren(['by', 'text', 't'])",
              "by": { ".validate": "newData.isString() && newData.val().length <= 16" },
              "text": { ".validate": "newData.isString() && newData.val().length <= 4000" },
              "t": { ".validate": "newData.isNumber()" },
              "$other": { ".validate": false }
            }
          },
          "$other": { ".validate": false }
        },

        "$other": { ".validate": false }
      }
    },

    "chatTyping": {
      "$user": {
        ".read": true,
        ".write": "$user === 'udaeng' || $user === 'kkomi'",
        ".validate": "newData.isBoolean()"
      }
    },

    "pushTokens": {
      "$user": {
        ".read": true,
        ".write": "$user === 'udaeng' || $user === 'kkomi'",
        ".validate": "newData.hasChildren(['token'])",
        "token": { ".validate": "newData.isString() && newData.val().length <= 512" },
        "platform": { ".validate": "newData.isString() && newData.val().length <= 16" },
        "t": { ".validate": "newData.isNumber()" },
        "$other": { ".validate": false }
      }
    },

    "watchTokens": {
      "$user": {
        ".read": true,
        ".write": "$user === 'udaeng' || $user === 'kkomi'",
        ".validate": "newData.hasChildren(['token'])",
        "token": { ".validate": "newData.isString() && newData.val().length <= 512" },
        "platform": { ".validate": "newData.isString() && newData.val().length <= 16" },
        "t": { ".validate": "newData.isNumber()" },
        "$other": { ".validate": false }
      }
    },

    "liveActivityTokens": {
      "$user": {
        ".read": true,
        ".write": "$user === 'udaeng' || $user === 'kkomi'",
        ".validate": "newData.hasChildren(['token'])",
        "token": { ".validate": "newData.isString() && newData.val().length <= 512" },
        "t": { ".validate": "newData.isNumber()" },
        "$other": { ".validate": false }
      }
    },

    "pushMeta": {
      "$user": {
        ".read": true,
        "lastHeart": {
          ".write": "$user === 'udaeng' || $user === 'kkomi'",
          ".validate": "newData.isNumber()"
        },
        "lastLA": {
          ".write": "$user === 'udaeng' || $user === 'kkomi'",
          ".validate": "newData.isNumber()"
        }
      }
    },

    "liveActivityState": {
      "$user": {
        ".read": true,
        ".write": "$user === 'udaeng' || $user === 'kkomi'",
        ".validate": "newData.hasChildren()"
      }
    }
  }
}
```

## 코드가 하는 RTDB 요청 전부 (grep 결과 그대로 — 파일:줄: 코드)
```
src/lib/chat.ts:8:import { ref as dbRef, set as dbSet, onValue, onDisconnect } from 'firebase/database';
src/lib/chat.ts:128:// 입력 중 — RTDB(휘발성). onDisconnect로 앱 죽어도 자동 해제.
src/lib/chat.ts:131:  const r = dbRef(rtdb, `chatTyping/${userKey}`);
src/lib/chat.ts:132:  if (typing) { onDisconnect(r).set(false); dbSet(r, true).catch(() => {}); }
src/lib/chat.ts:133:  else { dbSet(r, false).catch(() => {}); }
src/lib/chat.ts:136:  const r = dbRef(rtdb, `chatTyping/${partnerKey}`);
src/lib/chat.ts:137:  return onValue(r, (snap) => cb(snap.val() === true), () => cb(false));
src/lib/canvasBoard.ts:15:  ref as dbRef, set as dbSet, push as dbPush, remove as dbRemove,
src/lib/canvasBoard.ts:16:  update as dbUpdate, get as dbGet, onValue, onDisconnect, serverTimestamp,
src/lib/canvasBoard.ts:42:function strokesRef(boardId: string) { return dbRef(rtdb, `canvas/${boardId}/strokes`); }
src/lib/canvasBoard.ts:46:  return onValue(
src/lib/canvasBoard.ts:82:  const r = dbPush(dbRef(rtdb, `canvas/${boardId}/strokes/${user}`));
src/lib/canvasBoard.ts:84:  await dbSet(r, { color: stroke.color, size: stroke.size, points: stroke.points, by, t: serverTimestamp() });
src/lib/canvasBoard.ts:92:  await dbUpdate(dbRef(rtdb), updates);
src/lib/canvasBoard.ts:96:  await dbRemove(strokesRef(boardId));
src/lib/canvasBoard.ts:100:function metaRef(boardId: string) { return dbRef(rtdb, `canvas/${boardId}/meta`); }
src/lib/canvasBoard.ts:103:  return onValue(
src/lib/canvasBoard.ts:120:  await dbUpdate(metaRef(boardId), { passageUrl });
src/lib/canvasBoard.ts:124:  await dbRemove(dbRef(rtdb, `canvas/${boardId}/meta/passageUrl`));
src/lib/canvasBoard.ts:130:  const snap = await dbGet(dbRef(rtdb, 'canvas/book/currentPage'));
src/lib/canvasBoard.ts:132:  await dbUpdate(dbRef(rtdb, 'canvas/book'), { currentPage: 'main', 'pages/main': { t: 0 } });
src/lib/canvasBoard.ts:136:  return onValue(
src/lib/canvasBoard.ts:137:    dbRef(rtdb, 'canvas/book/currentPage'),
src/lib/canvasBoard.ts:144:  return onValue(
src/lib/canvasBoard.ts:145:    dbRef(rtdb, 'canvas/book/pages'),
src/lib/canvasBoard.ts:160:  await dbUpdate(dbRef(rtdb, 'canvas/book'), { [`pages/${id}`]: { t: Date.now() }, currentPage: id });
src/lib/canvasBoard.ts:166:  await dbSet(dbRef(rtdb, 'canvas/book/currentPage'), pageId);
src/lib/canvasBoard.ts:171:  await dbUpdate(dbRef(rtdb), {
src/lib/canvasBoard.ts:183:  return onValue(
src/lib/canvasBoard.ts:184:    dbRef(rtdb, `canvas/${boardId}/react`),
src/lib/canvasBoard.ts:199:  await dbSet(dbRef(rtdb, `canvas/${boardId}/react/likes/${liveKey(by)}`), on ? true : null);
src/lib/canvasBoard.ts:204:  const r = dbPush(dbRef(rtdb, `canvas/${boardId}/react/comments`));
src/lib/canvasBoard.ts:205:  await dbSet(r, { by, text: t.slice(0, 500), t: Date.now() });
src/lib/canvasBoard.ts:208:  await dbRemove(dbRef(rtdb, `canvas/${boardId}/react/comments/${id}`));
src/lib/canvasBoard.ts:215:  return dbRef(rtdb, `canvas/${boardId}/live/${userKey}`);
src/lib/canvasBoard.ts:219:  dbSet(liveRef(boardId, userKey), stroke ?? null).catch(() => {});
src/lib/canvasBoard.ts:223:  onDisconnect(liveRef(boardId, userKey)).remove().catch(() => {});
src/lib/canvasBoard.ts:229:  return onValue(liveRef(boardId, userKey), (snap) => cb(snap.val() as LiveStroke | null));
src/app/api/heart/route.ts:22:  const metaUrl = `${RTDB}/pushMeta/${toKey}/lastHeart.json`;
src/app/api/live-activity/sync/route.ts:22:    await fetch(`${RTDB}/liveActivityState/${userKey}.json`, { method: 'PUT', body: JSON.stringify(state) });
src/app/api/live-activity/ping/route.ts:29:    const r = await fetch(`${RTDB}/liveActivityState/${partnerKey}.json`, { cache: 'no-store' });
src/app/api/live-activity/ping/route.ts:37:  const metaUrl = `${RTDB}/pushMeta/${partnerKey}/lastLA.json`;
src/lib/apns.ts:84:    const r = await fetch(`${RTDB}/pushTokens/${userKey}.json`);
src/lib/apns.ts:115:    try { await fetch(`${RTDB}/pushTokens/${userKey}.json`, { method: 'DELETE' }); } catch {}
src/lib/apns.ts:128:    const r = await fetch(`${RTDB}/watchTokens/${userKey}.json`, { cache: 'no-store' });
src/lib/apns.ts:149:    try { await fetch(`${RTDB}/watchTokens/${userKey}.json`, { method: 'DELETE' }); } catch {}
src/lib/apns.ts:165:    const r = await fetch(`${RTDB}/liveActivityTokens/${userKey}.json`, { cache: 'no-store' });
src/lib/apns.ts:192:    try { await fetch(`${RTDB}/liveActivityTokens/${userKey}.json`, { method: 'DELETE' }); } catch {}
ios/App/KkomWatch/WatchPush.swift:47:              let url = URL(string: "\(RTDB)/watchTokens/\(keyForName(r)).json") else { return }
ios/App/App/Sync.swift:74:            self.openStream("\(RTDB_URL)/canvas/book.json", kind: .book)
ios/App/App/Sync.swift:92:        openStream("\(RTDB_URL)/canvas/\(page)/strokes.json", kind: .strokes)
ios/App/App/Sync.swift:93:        openStream("\(RTDB_URL)/canvas/\(page)/live/\(partner).json", kind: .live)
ios/App/App/Sync.swift:94:        openStream("\(RTDB_URL)/canvas/\(page)/meta/passageUrl.json", kind: .meta)
ios/App/App/Sync.swift:95:        openStream("\(RTDB_URL)/canvas/\(page)/react.json", kind: .react)
ios/App/App/Sync.swift:136:            self.write("PUT", "\(RTDB_URL)/canvas/\(self.page)/strokes/\(self.me)/\(id).json", body: self.jsonData(dict))
ios/App/App/Sync.swift:145:            self.write("DELETE", "\(RTDB_URL)/canvas/\(self.page)/strokes/\(self.me)/\(id).json", body: nil)
ios/App/App/Sync.swift:152:            self.write("DELETE", "\(RTDB_URL)/canvas/\(self.page)/strokes/\(self.me).json", body: nil)
ios/App/App/Sync.swift:153:            self.write("PUT", "\(RTDB_URL)/canvas/\(self.page)/live/\(self.me).json", body: "null".data(using: .utf8))
ios/App/App/Sync.swift:161:                self.write("PUT", "\(RTDB_URL)/canvas/\(self.page)/live/\(self.me).json", body: "null".data(using: .utf8)); return
ios/App/App/Sync.swift:165:            self.write("PUT", "\(RTDB_URL)/canvas/\(self.page)/live/\(self.me).json", body: self.jsonData(dict))
ios/App/App/Sync.swift:172:        write("PUT", "\(RTDB_URL)/canvas/book/pages/\(id).json",
ios/App/App/Sync.swift:174:        write("PUT", "\(RTDB_URL)/canvas/book/currentPage.json", body: "\"\(id)\"".data(using: .utf8))
ios/App/App/Sync.swift:177:        write("PUT", "\(RTDB_URL)/canvas/book/currentPage.json", body: "\"\(id)\"".data(using: .utf8))
ios/App/App/Sync.swift:181:        write("DELETE", "\(RTDB_URL)/canvas/book/pages/\(id).json", body: nil)
ios/App/App/Sync.swift:182:        write("DELETE", "\(RTDB_URL)/canvas/\(id).json", body: nil)  // 획·지문·라이브·리액션 통째로
ios/App/App/Sync.swift:188:                self.write("PUT", "\(RTDB_URL)/canvas/\(self.page)/meta/passageUrl.json", body: "\"\(url)\"".data(using: .utf8))
ios/App/App/Sync.swift:190:                self.write("DELETE", "\(RTDB_URL)/canvas/\(self.page)/meta/passageUrl.json", body: nil)
ios/App/App/Sync.swift:199:            if on { self.write("PUT", "\(RTDB_URL)/canvas/\(self.page)/react/likes/\(self.me).json", body: "true".data(using: .utf8)) }
ios/App/App/Sync.swift:200:            else { self.write("DELETE", "\(RTDB_URL)/canvas/\(self.page)/react/likes/\(self.me).json", body: nil) }
ios/App/App/Sync.swift:210:            self.write("PUT", "\(RTDB_URL)/canvas/\(self.page)/react/comments/\(id).json",
ios/App/App/Sync.swift:217:            self.write("DELETE", "\(RTDB_URL)/canvas/\(self.page)/react/comments/\(id).json", body: nil)
ios/App/App/Sync.swift:384:            case .book:    self.openStream("\(RTDB_URL)/canvas/book.json", kind: .book)
ios/App/App/Sync.swift:385:            case .strokes: self.openStream("\(RTDB_URL)/canvas/\(self.page)/strokes.json", kind: .strokes)
ios/App/App/Sync.swift:386:            case .live:    self.openStream("\(RTDB_URL)/canvas/\(self.page)/live/\(self.partner).json", kind: .live)
ios/App/App/Sync.swift:387:            case .meta:    self.openStream("\(RTDB_URL)/canvas/\(self.page)/meta/passageUrl.json", kind: .meta)
ios/App/App/Sync.swift:388:            case .react:   self.openStream("\(RTDB_URL)/canvas/\(self.page)/react.json", kind: .react)
ios/App/App/PushBridge.swift:120:        guard let u = user, !u.isEmpty, let url = URL(string: "\(RTDB_URL)/pushTokens/\(u).json") else { return }
ios/App/App/LiveActivityBridge.swift:122:        guard !userKey.isEmpty, let url = URL(string: "\(RTDB_URL)/liveActivityTokens/\(userKey).json") else { return }
src/app/api/heart/route.ts:32:    await fetch(metaUrl, { method: 'PUT', body: JSON.stringify(now) });
src/app/api/live-activity/ping/route.ts:43:    await fetch(metaUrl, { method: 'PUT', body: JSON.stringify(now) });
```

## 요청 본문 모양(코드에서 확인)
- 획(앱 PUT `canvas/{page}/strokes/{me}/{id}`): `{color, size, points:[{x,y,p}], by:"우댕"|"꼼이", t:{".sv":"timestamp"}}` (예전 앱 빌드는 `t`가 숫자)
- 획(웹 push `canvas/{page}/strokes/{udaeng|kkomi}`): `{color, size, points:[{x,y,p}], by, t: serverTimestamp()}`
- 생중계(앱·웹 PUT `canvas/{page}/live/{me}`): `{id, color, size, points:[{x,y,p}]}` 또는 null. 웹은 onDisconnect(...).remove()
- 새 페이지(앱): PUT `canvas/book/pages/p_123` `{t: 숫자}` + PUT `canvas/book/currentPage` `"p_123"`. 웹: update(`canvas/book`, {`pages/p_123`:{t}, currentPage})
- 페이지 삭제(웹): update(root, {`canvas/book/pages/X`: null, `canvas/book/currentPage`: Y, `canvas/X`: null}). 앱: DELETE `canvas/book/pages/X`, DELETE `canvas/X`
- 지문: 웹 update(`canvas/{page}/meta`, {passageUrl}), 앱 PUT/DELETE `canvas/{page}/meta/passageUrl`
- 하트: PUT `canvas/{page}/react/likes/{me}` true / DELETE. 댓글: 앱 PUT `react/comments/c_123` `{by,text,t}`, 웹 push `{by,text,t}`, DELETE
- 웹 전체 지우기: remove(`canvas/{page}/strokes`). 앱 내 획 전부 지우기: DELETE `canvas/{page}/strokes/{me}`
- 입력 중: set(`chatTyping/{me}`, true/false) + onDisconnect(...).set(false)
- 폰 알림주소(앱): PUT `pushTokens/{me}` `{token, platform:"ios", t}`. 워치: PUT `watchTokens/{me}` `{token, platform:"watchos", t}`. 잠금화면: PUT `liveActivityTokens/{me}` `{token, t}`. 서버가 GET, 죽은 토큰은 DELETE
- 서버: GET/PUT `pushMeta/{user}/lastHeart`·`lastLA` (숫자), PUT/GET `liveActivityState/{user}` (문자·숫자·불 섞인 객체)
- {me}·{user}는 코드상 항상 "udaeng" 또는 "kkomi"

## 이미 한 시험 (Firebase 에뮬레이터 + 실데이터 백업)
허용돼야 할 48개(위 요청 전부, 예전 빌드 숫자 t 포함) 전부 허용, 막혀야 할 16개(루트 읽기·덮어쓰기·삭제, canvas·pushTokens 통째 읽기/삭제, 엉뚱한 경로, hacker 사용자, 모양 틀린 획, 페이지·획 묶음 통째 덮어쓰기, currentPage 숫자) 전부 401. 원래 그림 데이터 그대로.
