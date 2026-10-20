// 아티팩트(임시 기록) → skin/kkomi/** 이관. 기본은 미리보기(쓰지 않음), --write 때만 저장.
//   npx tsx scripts/skin-import.ts <export 폴더> [--write]
// export 폴더 구조: journal/logs/*.json, journal/history/{onset,supplements}.json, intake/survey/intake.json
// 쓰기는 Firestore REST + `gcloud auth print-access-token`(프로젝트 소유자 권한 = 보안 규칙 우회).
import { execSync } from 'child_process';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fromLegacyLog, SKIN_OWNER } from '../src/lib/skinTypes';

const [dir, flag] = process.argv.slice(2);
if (!dir) { console.error('사용법: npx tsx scripts/skin-import.ts <export 폴더> [--write]'); process.exit(1); }
const WRITE = flag === '--write';
const PROJECT = 'kkom-morning';
const now = new Date().toISOString();
const read = (p: string) => {
  const j = JSON.parse(readFileSync(p, 'utf8'));
  return j && typeof j === 'object' && 'data' in j && 'id' in j ? j.data : j; // {id,data,version} 감싼 형태도 받음
};

const docs: { path: string; data: Record<string, unknown> }[] = [];
const logDir = join(dir, 'journal/logs');
for (const f of existsSync(logDir) ? readdirSync(logDir).filter((x) => x.endsWith('.json')).sort() : []) {
  const log = fromLegacyLog(read(join(logDir, f)));
  docs.push({ path: `skin/${SKIN_OWNER}/logs/${log.date}`, data: log as unknown as Record<string, unknown> });
}
for (const id of ['onset', 'supplements']) {
  const p = join(dir, `journal/history/${id}.json`);
  if (existsSync(p)) docs.push({ path: `skin/${SKIN_OWNER}/history/${id}`, data: { ...read(p), importedAt: now } });
}
const intake = join(dir, 'intake/survey/intake.json');
if (existsSync(intake)) docs.push({ path: `skin/${SKIN_OWNER}/survey/intake`, data: { ...read(intake), importedAt: now } });

// ── Firestore REST 값 변환 ──
type V = Record<string, unknown>;
function toValue(v: unknown): V {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, toValue(x)])) } };
}

async function main() {
  for (const d of docs) {
    const x = d.data as any;
    const brief = d.path.includes('/logs/')
      ? `팽진 ${x.wheals ?? '-'} 가려움 ${x.itch ?? '-'} UAS ${x.uas ?? '-'} · 약 ${x.meds.map((m: any) => m.status).join(',') || '기록없음'} · 발작 ${x.episodes.length} · 유발 ${x.triggers.join('/') || '-'} · 수면 ${x.sleepH ?? '-'}h`
      : Object.keys(x).join(', ');
    console.log(`${WRITE ? '쓰기' : '미리보기'}  ${d.path}  —  ${brief}`);
  }
  if (!WRITE) { console.log(`\n총 ${docs.length}건. 실제로 쓰려면 --write`); return; }
  const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  for (const d of docs) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${d.path}`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-goog-user-project': PROJECT },
      body: JSON.stringify({ fields: (toValue(d.data) as any).mapValue.fields }),
    });
    console.log(r.ok ? `  ✓ ${d.path}` : `  ✗ ${d.path} ${r.status} ${(await r.text()).slice(0, 200)}`);
  }
}
main();
