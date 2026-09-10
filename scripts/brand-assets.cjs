// Reproducible format conversion of the supplied customer logo, without redrawing it.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS conversion script. */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
async function main() {
  const source = process.argv[2];
  if (!source) throw new Error('Pass the original customer JPEG path');
  const out = path.resolve(__dirname, '../public/brand');
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(source, path.join(out, 'hvg-original.jpg'));
  for (const [file, size] of [['hvg-logo.png', 320], ['favicon-32.png', 32], ['favicon-192.png', 192], ['apple-touch-icon.png', 180]]) {
    await sharp(source).extract({ left: 360, top: 70, width: 300, height: 300 }).resize(size, size).png().toFile(path.join(out, file));
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
