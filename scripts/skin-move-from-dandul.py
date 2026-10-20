# 피부 일지 데이터 옮기기: dandul-app(사이담 프로젝트) → kkom-morning.
# 2026-10-21 발견: Vercel의 FIREBASE_SERVICE_ACCOUNT_B64가 사이담 키라서 앱에서 저장한 것이 사이담 Firestore에 쌓였다.
# 키를 꼼모닝 것으로 바꾼 뒤 한 번 돌린다(gcloud 로그인 계정 권한으로 REST).
#   python3 -I scripts/skin-move-from-dandul.py          → 무엇을 옮길지 보여 주기만
#   python3 -I scripts/skin-move-from-dandul.py --write  → 실제로 쓰기(사이담 쪽은 지우지 않음)
# 규칙: 꼼모닝에 없는 문서는 그대로 복사. 이미 있으면 chat/main은 메시지를 id로 합치고,
#       chatUsage/{날짜}는 숫자를 더한다(한 번만 — movedFromDandul 표시로 두 번 더하지 않음). 그 밖은 건너뜀.
import json, subprocess, sys, urllib.request, urllib.error

WRITE = '--write' in sys.argv
SRC, DST, ROOT = 'dandul-app', 'kkom-morning', 'skin/kkomi'
TOK = subprocess.check_output(['gcloud', 'auth', 'print-access-token']).decode().strip()

def base(p): return f'https://firestore.googleapis.com/v1/projects/{p}/databases/(default)/documents'

def call(proj, url, body=None, method=None):
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method=method or ('POST' if body is not None else 'GET'),
                               headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json', 'x-goog-user-project': proj})
    try:
        return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e:
        if e.code == 404: return None
        raise

def walk(proj, path):
    for c in (call(proj, f'{base(proj)}/{path}:listCollectionIds', {'pageSize': 100}) or {}).get('collectionIds', []):
        page = None
        while True:
            d = call(proj, f'{base(proj)}/{path}/{c}?pageSize=300' + (f'&pageToken={page}' if page else '')) or {}
            for doc in d.get('documents', []):
                rel = doc['name'].split('/documents/')[1]
                yield rel, doc.get('fields', {})
                yield from walk(proj, rel)
            page = d.get('nextPageToken')
            if not page: break

def put(path, fields):
    if WRITE: call(DST, f'{base(DST)}/{path}', {'fields': fields}, 'PATCH')

def msgs(fields): return fields.get('messages', {}).get('arrayValue', {}).get('values', [])
def mid(v): return v['mapValue']['fields']['id']['stringValue']
def mat(v): return v['mapValue']['fields']['at']['stringValue']

for path, src in walk(SRC, ROOT):
    dst = call(DST, f'{base(DST)}/{path}')
    if dst is None:
        print('복사', path); put(path, src); continue
    have = dst.get('fields', {})
    if path.endswith('/chat/main'):
        merged = {mid(v): v for v in msgs(have)}
        new = [v for v in msgs(src) if mid(v) not in merged]
        merged.update({mid(v): v for v in new})
        allm = sorted(merged.values(), key=mat)[-200:]
        print('합침', path, f'+{len(new)}말'); put(path, {**have, 'messages': {'arrayValue': {'values': allm}}})
    elif '/chatUsage/' in path and 'movedFromDandul' not in have:
        out = dict(have)
        for k, v in src.items():
            if 'integerValue' in v:
                out[k] = {'integerValue': str(int(have.get(k, {}).get('integerValue', '0')) + int(v['integerValue']))}
        out['movedFromDandul'] = {'booleanValue': True}
        print('더함', path); put(path, out)
    else:
        print('건너뜀(이미 있음)', path)
print('끝' + ('' if WRITE else ' — 보기만 했어요. 쓰려면 --write'))
