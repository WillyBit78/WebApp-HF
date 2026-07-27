import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadedDir = 'C:/Users/Willy/.gemini/antigravity/brain/085609c8-04a3-412e-ab7c-68be0ca5c467/.user_uploaded/';
const srcJpgPath = path.join(uploadedDir, 'media__1785044938675.jpg');

console.log(`Reading pristine high-res 3D shield: ${srcJpgPath}`);
const rawJpg = jpeg.decode(fs.readFileSync(srcJpgPath), { useTArray: true });
const width = rawJpg.width;
const height = rawJpg.height;
const data = rawJpg.data;

function getIdx(x, y) {
  return (y * width + x) * 4;
}

// Flood fill from all 4 corners to remove pure black background around the shield
const visited = new Uint8Array(width * height);
const queue = [];

function isOuterBackground(r, g, b) {
  // Black/dark background in the JPG outside the shield
  return (r < 45 && g < 45 && b < 45);
}

function checkAndEnqueue(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const pos = y * width + x;
  if (visited[pos]) return;

  const idx = getIdx(x, y);
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];

  if (isOuterBackground(r, g, b)) {
    visited[pos] = 1;
    queue.push([x, y]);
  }
}

// Enqueue border
for (let x = 0; x < width; x++) {
  checkAndEnqueue(x, 0);
  checkAndEnqueue(x, height - 1);
}
for (let y = 0; y < height; y++) {
  checkAndEnqueue(0, y);
  checkAndEnqueue(width - 1, y);
}

let head = 0;
while (head < queue.length) {
  const [x, y] = queue[head++];
  checkAndEnqueue(x + 1, y);
  checkAndEnqueue(x - 1, y);
  checkAndEnqueue(x, y + 1);
  checkAndEnqueue(x, y - 1);
}

// Calculate exact shield bounding box
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const pos = y * width + x;
    if (!visited[pos]) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(`Shield bounding box: (${minX}, ${minY}) to (${maxX}, ${maxY}) [${maxX - minX + 1}x${maxY - minY + 1}]`);

const pad = 15;
const cropMinX = Math.max(0, minX - pad);
const cropMinY = Math.max(0, minY - pad);
const cropMaxX = Math.min(width - 1, maxX + pad);
const cropMaxY = Math.min(height - 1, maxY + pad);

const cropW = cropMaxX - cropMinX + 1;
const cropH = cropMaxY - cropMinY + 1;

// Create new cropped canvas with subtle outer shadow built-in
const shadowPad = 20;
const finalW = cropW + shadowPad * 2;
const finalH = cropH + shadowPad * 2;

const finalPng = new PNG({ width: finalW, height: finalH });

// Initialize fully transparent
for (let i = 0; i < finalW * finalH * 4; i += 4) {
  finalPng.data[i + 3] = 0;
}

// 1. Render smooth subtle drop shadow behind the shield
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropMinX + x;
    const srcY = cropMinY + y;
    const pos = srcY * width + srcX;

    if (!visited[pos]) {
      const shadowX = x + shadowPad + 3;
      const shadowY = y + shadowPad + 6;

      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          const px = shadowX + dx;
          const py = shadowY + dy;
          if (px >= 0 && px < finalW && py >= 0 && py < finalH) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= 6) {
              const shadowAlpha = Math.floor((1 - dist / 6) * 50);
              const destIdx = (py * finalW + px) * 4;
              if (finalPng.data[destIdx + 3] < shadowAlpha) {
                finalPng.data[destIdx] = 5;
                finalPng.data[destIdx + 1] = 15;
                finalPng.data[destIdx + 2] = 40;
                finalPng.data[destIdx + 3] = shadowAlpha;
              }
            }
          }
        }
      }
    }
  }
}

// 2. Draw actual crystal-clear shield on top
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropMinX + x;
    const srcY = cropMinY + y;
    const pos = srcY * width + srcX;

    if (!visited[pos]) {
      const destX = x + shadowPad;
      const destY = y + shadowPad;
      const destIdx = (destY * finalW + destX) * 4;
      const srcIdx = getIdx(srcX, srcY);

      finalPng.data[destIdx] = data[srcIdx];
      finalPng.data[destIdx + 1] = data[srcIdx + 1];
      finalPng.data[destIdx + 2] = data[srcIdx + 2];
      finalPng.data[destIdx + 3] = 255;
    }
  }
}

function resampleBilinear(src, dstW, dstH) {
  const dst = new PNG({ width: dstW, height: dstH });
  const w = src.width, h = src.height;
  for (let y = 0; y < dstH; y++) {
    const v = y / (dstH - 1) * (h - 1);
    const y0 = Math.floor(v);
    const y1 = Math.min(h - 1, y0 + 1);
    const wy = v - y0;
    for (let x = 0; x < dstW; x++) {
      const u = x / (dstW - 1) * (w - 1);
      const x0 = Math.floor(u);
      const x1 = Math.min(w - 1, x0 + 1);
      const wx = u - x0;
      for (let c = 0; c < 4; c++) {
        const p00 = src.data[(y0 * w + x0) * 4 + c];
        const p10 = src.data[(y0 * w + x1) * 4 + c];
        const p01 = src.data[(y1 * w + x0) * 4 + c];
        const p11 = src.data[(y1 * w + x1) * 4 + c];
        const top = p00 * (1 - wx) + p10 * wx;
        const bot = p01 * (1 - wx) + p11 * wx;
        dst.data[(y * dstW + x) * 4 + c] = Math.round(top * (1 - wy) + bot * wy);
      }
    }
  }
  return dst;
}

const publicDir = path.join(__dirname, '../public');
const outBuf = PNG.sync.write(finalPng);
fs.writeFileSync(path.join(publicDir, 'logo.png'), outBuf);
console.log(`Saved public/logo.png (${finalW}x${finalH}) - ${outBuf.length} bytes`);

// Generate cleanly resampled PNGs
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'logo-192.png', size: 192 },
  { name: 'logo-512.png', size: 512 },
  { name: 'logo_192.png', size: 192 },
  { name: 'logo_512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.png', size: 64 }
];

for (const item of sizes) {
  const resized = resampleBilinear(finalPng, item.size, item.size);
  const buf = PNG.sync.write(resized);
  fs.writeFileSync(path.join(publicDir, item.name), buf);
  console.log(`Saved public/${item.name} (${item.size}x${item.size}) - ${buf.length} bytes`);
}

// Create JPG version on dark background (#020617)
const jpgData = {
  width: finalW,
  height: finalH,
  data: new Uint8Array(finalW * finalH * 4)
};
for (let i = 0; i < finalW * finalH * 4; i += 4) {
  const alpha = finalPng.data[i + 3] / 255;
  // Blend over #020617 (R:2, G:6, B:23)
  jpgData.data[i] = Math.round(finalPng.data[i] * alpha + 2 * (1 - alpha));
  jpgData.data[i + 1] = Math.round(finalPng.data[i + 1] * alpha + 6 * (1 - alpha));
  jpgData.data[i + 2] = Math.round(finalPng.data[i + 2] * alpha + 23 * (1 - alpha));
  jpgData.data[i + 3] = 255;
}
const jpgBuf = jpeg.encode(jpgData, 92).data;
fs.writeFileSync(path.join(publicDir, 'logo.jpg'), jpgBuf);
console.log(`Saved public/logo.jpg (${finalW}x${finalH}) - ${jpgBuf.length} bytes`);

console.log('All HD logo files generated successfully!');
