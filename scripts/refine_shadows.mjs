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

function getIdx(x, y) {
  return (y * width + x) * 4;
}

// Any isolated pixels or dark shadow artifacts near transparent areas get cleaned up
for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    const idx = getIdx(x, y);
    const a = data[idx + 3];

    if (a > 0 && a < 255) {
      // Check surrounding alpha count
      let transparentNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = getIdx(x + dx, y + dy);
          if (data[nIdx + 3] === 0) transparentNeighbors++;
        }
      }

      // If surrounded by transparency and pixel is dark shadow artifact, clear it
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (transparentNeighbors >= 4 && (r < 100 && g < 100 && b < 100)) {
        data[idx + 3] = 0;
      }
    }
  }
}

const outputBuffer = PNG.sync.write(png);
fs.writeFileSync(logoPath, outputBuffer);

console.log(`Refined shadow transparency saved! Bytes: ${outputBuffer.length}`);
