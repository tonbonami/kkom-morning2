// 이모티콘 추천 가드 (사이담 ③ 아이디어). ChatPanel.tsx 를 정적 파싱해서:
//   · 깨진 참조: 규칙이 존재하지 않는 word 를 가리키면(→ 빈 추천) 실패(exit 1)
//   · 고아: 서랍엔 있는데 어떤 규칙도 안 가리키는 그림 경고(추천에 한 번도 안 뜸)
// ⚠️ .mjs 로 둔다 — tsx 의존성을 만들지 않기 위함(genkit 전이의존이라 '배포에서만 죽는' 함정, 사이담 경고).
//    ChatPanel 의 SUGGEST_RULES 는 React 컴포넌트 안이라 import 대신 소스 텍스트를 regex 로 읽는다.
import { readFileSync } from 'fs';

const src = readFileSync('src/components/ChatPanel.tsx', 'utf8');

function words(name) {
  const i = src.indexOf('const ' + name);
  if (i < 0) return [];
  const end = src.indexOf('];', i);
  return [...src.slice(i, end).matchAll(/word:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
}
function textKeys() {
  const i = src.indexOf('const TEXT_STICKERS');
  const end = src.indexOf('};', i);
  return [...src.slice(i, end).matchAll(/['"]([^'"]+)['"]\s*:/g)].map((m) => m[1]);
}

const sets = {
  ANIM: words('ANIM_RAW'), SAI: words('SAI_STICKERS'), SAIDAMI: words('SAIDAMI_STICKERS'),
  DANG: words('DANG_STICKERS'), KKOM: words('KKOM_STICKERS'), TEXT: textKeys(),
};
const fnToSet = { sugAnim: 'ANIM', sugSai: 'SAI', sugMini: 'SAIDAMI', sugDang: 'DANG', sugKkom: 'KKOM', sugCouple: 'TEXT' };

const rulesSrc = src.slice(src.indexOf('const SUGGEST_RULES'), src.indexOf('function computeSuggestions'));
const refs = [...rulesSrc.matchAll(/sug(Anim|Sai|Mini|Dang|Kkom|Couple)\(['"]([^'"]+)['"]\)/g)]
  .map((m) => ({ fn: 'sug' + m[1], word: m[2] }));

const referenced = {}; for (const k of Object.keys(sets)) referenced[k] = new Set();
const broken = [];
for (const r of refs) {
  const set = fnToSet[r.fn];
  if (sets[set].includes(r.word)) referenced[set].add(r.word);
  else broken.push(`${r.fn}('${r.word}') — ${set} 세트에 그 word 없음(→ 빈 추천)`);
}

const orphans = [];
for (const k of Object.keys(sets)) for (const w of sets[k]) if (!referenced[k].has(w)) orphans.push(`${k}:${w}`);

// ④ 죽은 낱말 — 각 규칙의 대안(alternation)을 하나씩 떼어 '자기 정규식'에 먹여본다.
//   ⚠️ 한글 뒤 \b 는 JS에서 안 먹어(짱\b·좋다\b 등이 자기 단어에도 안 걸림). 이게 그걸 잡는다.
const dead = [];
const rulePatterns = [...rulesSrc.matchAll(/re:\s*\/(.+?)\/,\s*get:/g)].map((m) => m[1]);
for (const pat of rulePatterns) {
  let re;
  try { re = new RegExp(pat); } catch { continue; }
  for (const alt of pat.split('|')) {
    // 대안을 '평문 표본'으로: 전방탐색 제거, \s?/\s → 공백
    const sample = alt.replace(/\(\?![^)]*\)/g, '').replace(/\\s\??/g, ' ').trim();
    if (!sample || /[\\()[\]?*+{}^$]/.test(sample)) continue; // 특수문자 남으면 판정 스킵
    if (!re.test(sample)) dead.push(`${sample}  (규칙 /${pat.slice(0, 24)}…/)`);
  }
}

const hardFail = [];
if (broken.length) { console.error('❌ 깨진 참조:'); broken.forEach((b) => console.error('   · ' + b)); hardFail.push('broken'); }
if (dead.length) { console.error('❌ 스스로도 안 걸리는 낱말(한글 \\b 등):'); dead.forEach((d) => console.error('   · ' + d)); hardFail.push('dead'); }
if (hardFail.length) process.exit(1);

console.log(`OK — 참조 ${refs.length}개 실재 · 죽은 낱말 없음.`);
if (orphans.length) console.log(`   ℹ️ 고아 ${orphans.length}개(추천에 안 뜸): ${orphans.join(', ')}`);
else console.log('   고아 없음 ✅');
