import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const logoPath = 'public/logo.png';
console.log(`Loading ${logoPath}...`);
const srcBuf = fs.readFileSync(logoPath);
const srcPng = PNG.sync.read(srcBuf);

const width = srcPng.width;
const height = srcPng.height;
const data = srcPng.data;

// Find bounding box of non-transparent logo content
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const a = data[idx + 3];
    if (a > 20) { // non-transparent pixel
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const shieldW = maxX - minX + 1;
const shieldH = maxY - minY + 1;
console.log(`Shield content bounds: (${minX}, ${minY}) to (${maxX}, ${maxY}) [${shieldW}x${shieldH}]`);

// Extract shield pixels
const croppedPng = new PNG({ width: shieldW, height: shieldH });
for (let y = 0; y < shieldH; y++) {
  for (let x = 0; x < shieldW; x++) {
    const srcIdx = ((minY + y) * width + (minX + x)) * 4;
    const dstIdx = (y * shieldW + x) * 4;
    croppedPng.data[dstIdx] = data[srcIdx];
    croppedPng.data[dstIdx + 1] = data[srcIdx + 1];
    croppedPng.data[dstIdx + 2] = data[srcIdx + 2];
    croppedPng.data[dstIdx + 3] = data[srcIdx + 3];
  }
}

// Function to render padded icon onto canvas with dark background (#020617)
function createPaddedIcon(size, targetPaddingRatio = 0.20) {
  const icon = new PNG({ width: size, height: size });

  // Fill background with dark theme color #020617 (r: 2, g: 6, b: 23, a: 255)
  for (let i = 0; i < size * size * 4; i += 4) {
    icon.data[i] = 2;
    icon.data[i + 1] = 6;
    icon.data[i + 2] = 23;
    icon.data[i + 3] = 255;
  }

  // Calculate target draw size inside the safe zone
  const maxDrawDim = Math.round(size * (1 - targetPaddingRatio * 2));
  const scale = Math.min(maxDrawDim / shieldW, maxDrawDim / shieldH);

  const drawW = Math.round(shieldW * scale);
  const drawH = Math.round(shieldH * scale);

  const offsetX = Math.round((size - drawW) / 2);
  const offsetY = Math.round((size - drawH) / 2);

  // Nearest-neighbor / bilinear scaling
  for (let dy = 0; dy < drawH; dy++) {
    for (let dx = 0; dx < drawW; dx++) {
      const sy = Math.min(shieldH - 1, Math.floor(dy / scale));
      const sx = Math.min(shieldW - 1, Math.floor(dx / scale));

      const srcIdx = (sy * shieldW + sx) * 4;
      const dstX = offsetX + dx;
      const dstY = offsetY + dy;

      if (dstX >= 0 && dstX < size && dstY >= 0 && dstY < size) {
        const dstIdx = (dstY * size + dstX) * 4;
        const sa = croppedPng.data[srcIdx + 3] / 255;
        const sr = croppedPng.data[srcIdx];
        const sg = croppedPng.data[srcIdx + 1];
        const sb = croppedPng.data[srcIdx + 2];

        // Alpha blend over #020617
        icon.data[dstIdx] = Math.round(sr * sa + 2 * (1 - sa));
        icon.data[dstIdx + 1] = Math.round(sg * sa + 6 * (1 - sa));
        icon.data[dstIdx + 2] = Math.round(sb * sa + 23 * (1 - sa));
        icon.data[dstIdx + 3] = 255;
      }
    }
  }

  return icon;
}

// Generate PWA icons with padding
console.log('Generating 512x512 padded icon...');
const icon512 = createPaddedIcon(512, 0.20);
fs.writeFileSync('public/icon-512.png', PNG.sync.write(icon512));
fs.writeFileSync('public/logo-512.png', PNG.sync.write(icon512));
fs.writeFileSync('public/logo_512.png', PNG.sync.write(icon512));

console.log('Generating 192x192 padded icon...');
const icon192 = createPaddedIcon(192, 0.20);
fs.writeFileSync('public/icon-192.png', PNG.sync.write(icon192));
fs.writeFileSync('public/logo-192.png', PNG.sync.write(icon192));
fs.writeFileSync('public/logo_192.png', PNG.sync.write(icon192));

console.log('Generating 180x180 apple-touch-icon...');
const appleIcon = createPaddedIcon(180, 0.18);
fs.writeFileSync('public/apple-touch-icon.png', PNG.sync.write(appleIcon));

console.log('Generating 64x64 favicon...');
const favicon = createPaddedIcon(64, 0.15);
fs.writeFileSync('public/favicon.png', PNG.sync.write(favicon));

console.log('All PWA icons generated successfully with safe-zone padding!');
