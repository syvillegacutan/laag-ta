/**
 * Asset generator for Laag Ta!
 * Uses sharp (prebuilt binaries — no C++ compiler needed).
 *
 * Usage (run once from project root):
 *   cd scripts && npm install && cd ..
 *   node scripts/generate-assets.js
 */

const path = require('path');
const fs = require('fs');

let sharp;
try {
  sharp = require(path.join(__dirname, 'node_modules', 'sharp'));
} catch {
  console.error('sharp not found. Run:  cd scripts && npm install && cd ..');
  process.exit(1);
}

const ASSETS = path.join(__dirname, '..', 'assets');
const ORANGE = '#ff6b2b';

const ICON_SVG = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${ORANGE}" rx="180"/>
  <g transform="translate(512,512) rotate(-45) scale(21.3) translate(-12,-12)">
    <path fill="#ffffff"
      d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </g>
</svg>`;

const ADAPTIVE_ICON_SVG = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${ORANGE}"/>
  <g transform="translate(512,512) rotate(-45) scale(18) translate(-12,-12)">
    <path fill="#ffffff"
      d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </g>
</svg>`;

const SPLASH_SVG = `<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="${ORANGE}"/>
  <g transform="translate(642,1230) rotate(-45) scale(6.67) translate(-12,-12)">
    <path fill="#ffffff"
      d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </g>
  <text x="642" y="1440" text-anchor="middle"
    font-family="Arial Black, Helvetica, sans-serif"
    font-weight="900" font-size="130" fill="#ffffff">Laag Ta!</text>
  <text x="642" y="1520" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-style="italic" font-size="48" fill="rgba(255,255,255,0.85)">Dali, adventure awaits!</text>
</svg>`;

const FAVICON_SVG = `<svg width="196" height="196" viewBox="0 0 196 196" xmlns="http://www.w3.org/2000/svg">
  <rect width="196" height="196" fill="${ORANGE}" rx="30"/>
  <g transform="translate(98,98) rotate(-45) scale(4.1) translate(-12,-12)">
    <path fill="#ffffff"
      d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </g>
</svg>`;

async function svgToPng(svgString, outputPath, width, height) {
  const buf = Buffer.from(svgString);
  await sharp(buf, { density: 300 })
    .resize(width, height)
    .png()
    .toFile(outputPath);
  console.log(`✓ ${path.basename(outputPath)}  (${width}×${height})`);
}

async function main() {
  if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

  await svgToPng(ICON_SVG,          path.join(ASSETS, 'icon.png'),          1024, 1024);
  await svgToPng(ADAPTIVE_ICON_SVG, path.join(ASSETS, 'adaptive-icon.png'), 1024, 1024);
  await svgToPng(SPLASH_SVG,        path.join(ASSETS, 'splash.png'),        1284, 2778);
  await svgToPng(FAVICON_SVG,       path.join(ASSETS, 'favicon.png'),        196,  196);

  console.log('\nAll assets ready! Run: npx expo start');
}

main().catch(err => { console.error(err); process.exit(1); });
