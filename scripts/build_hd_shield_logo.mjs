import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadedDir = 'C:/Users/Willy/.gemini/antigravity/brain/085609c8-04a3-412e-ab7c-68be0ca5c467/.user_uploaded/';
const srcPngPath = path.join(uploadedDir, 'media__1785102889676.png');
const logoPath = path.join(__dirname, '../public/logo.png');

const inputBuffer = fs.readFileSync(srcPngPath);
const png = PNG.sync.read(inputBuffer);

const width = png.width;
const height = png.height;
const data = png.data;

function getIdx(x, y) {
  return (y * width + x) * 4;
}

// Flood fill from all 4 corners to remove pure black background around the shield
const visited = new Uint8Array(width * height);
const queue = [];

function isOuterBackground(r, g, b, a) {
  if (a < 10) return true;
  // Black background
  if (r < 40 && g < 40 && b < 40) return true;
  return false;
}

function checkAndEnqueue(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const pos = y * width + x;
  if (visited[pos]) return;

  const idx = getIdx(x, y);
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];

  if (isOuterBackground(r, g, b, a)) {
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
  const idx = getIdx(x, y);
  data[idx + 3] = 0; // Make background transparent

  checkAndEnqueue(x + 1, y);
  checkAndEnqueue(x - 1, y);
  checkAndEnqueue(x, y + 1);
  checkAndEnqueue(x, y - 1);
}

// Calculate exact shield bounding box
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = getIdx(x, y);
    if (data[idx + 3] > 0) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 10;
const cropMinX = Math.max(0, minX - pad);
const cropMinY = Math.max(0, minY - pad);
const cropMaxX = Math.min(width - 1, maxX + pad);
const cropMaxY = Math.min(height - 1, maxY + pad);

const cropW = cropMaxX - cropMinX + 1;
const cropH = cropMaxY - cropMinY + 1;

// Create new cropped canvas with subtle outer shadow built-in
const shadowPad = 15;
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
    const srcIdx = getIdx(srcX, srcY);
    const srcAlpha = data[srcIdx + 3];

    if (srcAlpha > 50) {
      // Cast soft shadow offset (down 4px, right 2px)
      const shadowX = x + shadowPad + 2;
      const shadowY = y + shadowPad + 5;

      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          const px = shadowX + dx;
          const py = shadowY + dy;
          if (px >= 0 && px < finalW && py >= 0 && py < finalH) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= 6) {
              const shadowAlpha = Math.floor((1 - dist / 6) * 40 * (srcAlpha / 255));
              const destIdx = (py * finalW + px) * 4;
              if (finalPng.data[destIdx + 3] < shadowAlpha) {
                finalPng.data[destIdx] = 10;
                finalPng.data[destIdx + 1] = 25;
                finalPng.data[destIdx + 2] = 60;
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
    const srcIdx = getIdx(srcX, srcY);
    const srcAlpha = data[srcIdx + 3];

    if (srcAlpha > 0) {
      const destX = x + shadowPad;
      const destY = y + shadowPad;
      const destIdx = (destY * finalW + destX) * 4;

      // Alpha composite shield over shadow
      const alphaFactor = srcAlpha / 255;
      const bgAlphaFactor = (finalPng.data[destIdx + 3] / 255) * (1 - alphaFactor);
      const outAlpha = alphaFactor + bgAlphaFactor;

      finalPng.data[destIdx] = Math.round((data[srcIdx] * alphaFactor + finalPng.data[destIdx] * bgAlphaFactor) / outAlpha);
      finalPng.data[destIdx + 1] = Math.round((data[srcIdx + 1] * alphaFactor + finalPng.data[destIdx + 1] * bgAlphaFactor) / outAlpha);
      finalPng.data[destIdx + 2] = Math.round((data[srcIdx + 2] * alphaFactor + finalPng.data[destIdx + 2] * bgAlphaFactor) / outAlpha);
      finalPng.data[destIdx + 3] = Math.round(outAlpha * 255);
    }
  }
}

const outBuf = PNG.sync.write(finalPng);
fs.writeFileSync(logoPath, outBuf);
fs.writeFileSync(path.join(__dirname, '../public/logo_192.png'), outBuf);
fs.writeFileSync(path.join(__dirname, '../public/logo_512.png'), outBuf);
fs.writeFileSync(path.join(__dirname, '../public/logo.jpg'), outBuf);

console.log(`Professional HD Shield generated! Final Dimensions: ${finalW}x${finalH}, Size: ${outBuf.length} bytes`);
