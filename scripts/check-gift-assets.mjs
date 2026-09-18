// 선물 소품 id ↔ /emo/gifts/{id}.png 1:1 대조. 없는 id·고아 이미지 잡는다.
//   실행: node scripts/check-gift-assets.mjs   (문제 있으면 exit 1)
import fs from 'node:fs';
const src = fs.readFileSync('src/lib/gifts.ts', 'utf8');
// GIFT_ITEMS 배열의 id 만 추출 (STORAGES 등은 제외 — GIFT_ITEMS 블록만)
const block = src.slice(src.indexOf('GIFT_ITEMS'), src.indexOf('GIFT_STORAGES'));
const ids = [...block.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
const files = fs.readdirSync('public/emo/gifts').filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''));
const missing = ids.filter((id) => !files.includes(id));          // 정의는 있는데 이미지 없음 → 깨진 이미지
const orphan  = files.filter((f) => !ids.includes(f));            // 이미지는 있는데 정의 없음 → 안 쓰는 파일
console.log(`선물 정의 ${ids.length}개 / 이미지 ${files.length}개`);
if (missing.length) console.log('❌ 이미지 없는 id(깨짐):', missing.join(', '));
if (orphan.length)  console.log('⚠️  안 쓰는 이미지(고아):', orphan.join(', '));
if (missing.length) { console.log('→ FAIL: 없는 id는 에러 없이 카드만 안 그려진다'); process.exit(1); }
console.log('✅ id↔이미지 1:1 OK' + (orphan.length ? ' (고아 이미지만 있음, 무해)' : ''));
