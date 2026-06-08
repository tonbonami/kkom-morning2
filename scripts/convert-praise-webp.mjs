import sharp from 'sharp';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = [
  '/Users/mydang/Claude_Code/Kkom-Morning/public/praise/classic',
  '/Users/mydang/Claude_Code/Kkom-Morning/public/praise/pochacco',
];

for (const root of ROOTS) {
  const pngs = readdirSync(root).filter((f) => f.endsWith('.png'));
  for (const png of pngs) {
    const src = join(root, png);
    const dst = src.replace(/\.png$/, '.webp');
    // 256x256 max, lossless WebP for stickers (작은 사이즈 + 투명 보존)
    await sharp(src)
      .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 90, effort: 6 })
      .toFile(dst);
    const before = statSync(src).size;
    const after = statSync(dst).size;
    console.log(`${png}: ${(before/1024).toFixed(1)}KB → ${(after/1024).toFixed(1)}KB`);
  }
}
console.log('변환 완료');
