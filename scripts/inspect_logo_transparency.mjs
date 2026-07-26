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

console.log(`Logo dimensions: ${width}x${height}`);

let darkCount = 0;
let transparentCount = 0;
let opaqueCount = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a === 0) {
      transparentCount++;
    } else {
      opaqueCount++;
      if (r < 50 && g < 50 && b < 50) {
        darkCount++;
      }
    }
  }
}

console.log(`Transparent pixels (a=0): ${transparentCount}`);
console.log(`Opaque pixels (a>0): ${opaqueCount}`);
console.log(`Dark opaque pixels inside logo (RGB < 50): ${darkCount}`);
