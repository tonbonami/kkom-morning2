// 한글 입력 맞춤 — 카톡식 이모티콘 추천용(2026-10-15, GPT와 상의해 정함).
//   · 자모 앞부분 일치: 조합 중인 글자도 걸린다 — 「살」→사랑해, 「백」→배고파, 「배곺」→배고파.
//     겹모음(ㅘ→ㅗㅏ)·겹받침(ㄺ→ㄹㄱ)까지 풀어야 「고」가 「과자」에, 「앉」이 「앉아」에 걸린다(NFD만으론 부족).
//   · 초성 앞부분 일치: 「ㅂㄱ」→배고파, 「ㄱㅅ」→고마워. 자음 한 글자는 너무 모호해서 여기서 안 쓰고
//     호출하는 쪽의 '한 글자 단축키' 표로 따로 다룬다.
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
// 겹모음·겹받침 → 낱자. 쌍자음(ㄲ·ㅆ…)은 키보드에서 한 번에 치므로 풀지 않는다.
const SPLIT: Record<string, string> = {
  'ㅘ': 'ㅗㅏ', 'ㅙ': 'ㅗㅐ', 'ㅚ': 'ㅗㅣ', 'ㅝ': 'ㅜㅓ', 'ㅞ': 'ㅜㅔ', 'ㅟ': 'ㅜㅣ', 'ㅢ': 'ㅡㅣ',
  'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ',
  'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ',
};
const CONSONANTS = new Set([...CHO, 'ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ']);
const SB = 0xac00, SE = 0xd7a3;
const sp = (j: string) => SPLIT[j] ?? j;

// 비교용 정규화 — 대소문자·전각, 공백 제거, 끝 문장부호 제거, 같은 글자 3번 이상은 2번으로(「배고파아아아」).
// ⚠️ NFKC 쓰면 안 된다 — 호환 자모 「ㄱ」(U+3131)을 첫가끝 자모(U+1100)로 바꿔 버려 자음 검색이 통째로 죽는다.
//    NFC + 전각 영숫자만 반각으로.
export function normForMatch(s: string): string {
  return s.normalize('NFC').replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[.,!?~…·'"]+$/u, '')
    .replace(/(.)\1{2,}/gu, '$1$1');
}

export function toJamo(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c >= SB && c <= SE) {
      const i = c - SB;
      out += CHO[Math.floor(i / 588)] + sp(JUNG[Math.floor((i % 588) / 28)]) + sp(JONG[i % 28]);
    } else out += sp(ch);
  }
  return out;
}

export function toChosung(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    out += c >= SB && c <= SE ? CHO[Math.floor((c - SB) / 588)] : ch;
  }
  return out;
}

export const isConsonantsOnly = (s: string) => s.length > 0 && [...s].every((ch) => CONSONANTS.has(ch));
export const hasHangul = (s: string) => /[가-힣ㄱ-ㅣ]/.test(s);

// 미리 풀어 둔 별칭(키 입력마다 다시 풀지 않게).
export type PreparedAlias = { norm: string; jamo: string; cho: string };
export const prepareAlias = (a: string): PreparedAlias => {
  const norm = normForMatch(a);
  return { norm, jamo: toJamo(norm), cho: toChosung(norm) };
};

// 토큰 하나가 별칭에 얼마나 맞는지 — 0이면 안 맞음. 등급이 높을수록 확실.
//   100 완전일치 · 76 음절 앞부분 · 74 자모 앞부분(조합 중) · 60 초성 앞부분(자음 2개 이상)
//   음절·자모 앞부분을 거의 같게 둔다 — 「살」은 '살짝'일 수도 있지만 대개 「사랑」을 치는 중이다.
//   어느 쪽이 먼저인지는 호출하는 쪽의 인기 가산점·자주 쓴 것이 가른다.
export function matchTier(token: string, tokenJamo: string, a: PreparedAlias): number {
  if (!token) return 0;
  if (token === a.norm) return 100;
  if (isConsonantsOnly(token)) {
    return [...token].length >= 2 && a.cho.startsWith(token) ? 60 : 0;
  }
  if (hasHangul(token)) {
    if (a.norm.startsWith(token)) return 76;
    if (a.jamo.startsWith(tokenJamo)) return 74;
    return 0;
  }
  // 영문 등 — 두 글자 이상 앞부분만. 숫자 단독은 추천 안 함.
  if (/^\d+$/.test(token)) return 0;
  return token.length >= 2 && a.norm.startsWith(token) ? 75 : 0;
}
