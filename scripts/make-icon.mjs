import sharp from 'sharp';
const SIZE = 1024;
const SRC = 'public/pochacco/kkom_morning_icon.png';
const OUT = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
const border = Buffer.from(
`<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="${SIZE-40}" height="${SIZE-40}" rx="212" ry="212" fill="none" stroke="#EC6A99" stroke-width="26"/>
  <rect x="52" y="52" width="${SIZE-104}" height="${SIZE-104}" rx="186" ry="186" fill="none" stroke="#FFFFFF" stroke-width="10" opacity="0.85"/>
</svg>`);
await sharp(SRC).resize(SIZE, SIZE, { fit: 'cover' }).flatten({ background: '#C9EFE1' })
  .composite([{ input: border, top: 0, left: 0 }]).png().toFile(OUT);
console.log('✅ 아이콘 생성:', OUT);
