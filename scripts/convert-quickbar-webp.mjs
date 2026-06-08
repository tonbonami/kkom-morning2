import sharp from 'sharp';
import { statSync } from 'fs';
import { join } from 'path';

const SRC_DIR = '/Users/mydang/Claude_Code/Kkom-Morning/public/pochacco_button';
const DST_DIR = '/Users/mydang/Claude_Code/Kkom-Morning/public/quickbar';

// 파일명 매핑: 자산명 → kind명
const MAP = {
  missyou: 'miss',
  loveyou: 'love',
  hugme: 'hug',
  popo: 'kiss',
  whitening: 'whitening',
};

import { mkdirSync } from 'fs';
mkdirSync(DST_DIR, { recursive: true });

for (const [srcName, kind] of Object.entries(MAP)) {
  const src = join(SRC_DIR, `${srcName}.png`);
  const dst = join(DST_DIR, `${kind}.webp`);
  // 128px 정사각형, 캐릭터 중앙 보존 (inside fit)
  await sharp(src)
    .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 92, effort: 6 })
    .toFile(dst);
  const before = statSync(src).size;
  const after = statSync(dst).size;
  console.log(`${srcName}.png → ${kind}.webp: ${(before/1024).toFixed(1)}KB → ${(after/1024).toFixed(1)}KB`);
}
console.log('완료');
