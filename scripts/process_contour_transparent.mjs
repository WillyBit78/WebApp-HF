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

console.log(`Input Dimensions: ${width}x${height}`);

function getIdx(x, y) {
  return (y * width + x) * 4;
}

// Background is black or near black around outer edges
function isBlackOrDark(r, g, b, a) {
  if (a < 10) return true;
  // Dark black background
  if (r < 38 && g < 38 && b < 38) return true;
  // Neutral dark grey shadow artifacts
  if (r < 55 && g < 55 && b < 55 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15) return true;
  return false;
}

// Flood fill from outer edges
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

  if (isBlackOrDark(r, g, b, a)) {
    visited[pos] = 1;
    queue.push([x, y]);
  }
}

// Border fill
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

  data[idx + 3] = 0; // Fully transparent

  checkAndEnqueue(x + 1, y);
  checkAndEnqueue(x - 1, y);
  checkAndEnqueue(x, y + 1);
  checkAndEnqueue(x, y - 1);
}

// Clean up any lingering dark border pixels connected to alpha 0
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = getIdx(x, y);
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    if (r < 30 && g < 30 && b < 30) {
      data[idx + 3] = 0;
    }
  }
}

// Find bounding box of shield
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

const pad = 12;
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
fs.writeFileSync(path.join(__dirname, '../public/logo_192.png'), outputBuffer);
fs.writeFileSync(path.join(__dirname, '../public/logo_512.png'), outputBuffer);

console.log(`Transparent shield saved! Dimensions: ${cropW}x${cropH}, bytes: ${outputBuffer.length}`);
