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

console.log(`Original Input Dimensions: ${width}x${height}`);

function getIdx(x, y) {
  return (y * width + x) * 4;
}

// Check if pixel is part of outer black background
function isOuterBlack(r, g, b, a) {
  if (a < 10) return true;
  // Black / near black background around outer perimeter
  if (r < 40 && g < 40 && b < 40) return true;
  return false;
}

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

  if (isOuterBlack(r, g, b, a)) {
    visited[pos] = 1;
    queue.push([x, y]);
  }
}

// Start flood fill ONLY from outer image edges
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

  data[idx + 3] = 0; // Set outer background to fully transparent

  checkAndEnqueue(x + 1, y);
  checkAndEnqueue(x - 1, y);
  checkAndEnqueue(x, y + 1);
  checkAndEnqueue(x, y - 1);
}

// Smooth edge transition around outer contour (antialiasing)
for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    const pos = y * width + x;
    if (visited[pos]) continue; // Already background

    // Check if neighbor is background
    let transparentNeighbors = 0;
    if (visited[y * width + (x + 1)]) transparentNeighbors++;
    if (visited[y * width + (x - 1)]) transparentNeighbors++;
    if (visited[(y + 1) * width + x]) transparentNeighbors++;
    if (visited[(y - 1) * width + x]) transparentNeighbors++;

    const idx = getIdx(x, y);
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // If edge pixel is very dark black shadow artifact attached to boundary, soften alpha
    if (transparentNeighbors > 0 && r < 45 && g < 45 && b < 45) {
      data[idx + 3] = Math.floor(255 * (1 - transparentNeighbors * 0.25));
    }
  }
}

// Crop tight bounding box
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

console.log(`Perfect Shield Bounding Box: minX=${minX}, minY=${minY}, maxX=${maxX}, maxY=${maxY}`);

const pad = 8;
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
fs.writeFileSync(path.join(__dirname, '../public/logo.jpg'), outputBuffer);

console.log(`Perfect shield saved! Size: ${cropW}x${cropH}, bytes: ${outputBuffer.length}`);
