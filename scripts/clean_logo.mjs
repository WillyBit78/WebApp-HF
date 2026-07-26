import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, '../public/logo.png');
const inputBuffer = fs.readFileSync(logoPath);
const png = PNG.sync.read(inputBuffer);

const width = png.width;
const height = png.height;
const data = png.data;

console.log(`Original Dimensions: ${width}x${height}`);

function getIdx(x, y) {
  return (y * width + x) * 4;
}

// Check if pixel is background (white, light grey, or shadow glow near edges)
function isBackgroundPixel(r, g, b, a) {
  if (a < 10) return true;
  // White/near-white
  if (r > 190 && g > 190 && b > 190) return true;
  // Neutral grey shadow artifacts near border
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20 && r > 130) return true;
  return false;
}

// Flood fill background from 4 corners
const visited = new Uint8Array(width * height);
const queue = [];

function checkAndEnqueue(x, y) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const pos = y * width + x;
  if (visited[pos]) return;

  const idx = getIdx(x, y);
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];

  if (isBackgroundPixel(r, g, b, a)) {
    visited[pos] = 1;
    queue.push([x, y]);
  }
}

// Start flood fill from outer borders
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

  // Set to fully transparent
  data[idx + 3] = 0;

  // Neighbors
  checkAndEnqueue(x + 1, y);
  checkAndEnqueue(x - 1, y);
  checkAndEnqueue(x, y + 1);
  checkAndEnqueue(x, y - 1);
}

// Remove remaining outer white pixels and smooth edges
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = getIdx(x, y);
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // If high brightness (white corner remnants), clear alpha
    if (r > 200 && g > 200 && b > 200) {
      data[idx + 3] = 0;
    }
  }
}

// Find bounding box of non-transparent shield
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = getIdx(x, y);
    if (data[idx + 3] > 20) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(`Shield Bounding Box: minX=${minX}, minY=${minY}, maxX=${maxX}, maxY=${maxY}`);

// Crop with small 15px padding
const pad = 15;
const cropMinX = Math.max(0, minX - pad);
const cropMinY = Math.max(0, minY - pad);
const cropMaxX = Math.min(width - 1, maxX + pad);
const cropMaxY = Math.min(height - 1, maxY + pad);

const cropW = cropMaxX - cropMinX + 1;
const cropH = cropMaxY - cropMinY + 1;

const croppedPng = new PNG({ width: cropW, height: cropH });

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropMinX + x;
    const srcY = cropMinY + y;
    const srcIdx = getIdx(srcX, srcY);
    const destIdx = (y * cropW + x) * 4;

    croppedPng.data[destIdx] = data[srcIdx];
    croppedPng.data[destIdx + 1] = data[srcIdx + 1];
    croppedPng.data[destIdx + 2] = data[srcIdx + 2];
    croppedPng.data[destIdx + 3] = data[srcIdx + 3];
  }
}

const outputBuffer = PNG.sync.write(croppedPng);
fs.writeFileSync(logoPath, outputBuffer);

console.log(`Cleaned PNG saved successfully! New size: ${cropW}x${cropH}, bytes: ${outputBuffer.length}`);
