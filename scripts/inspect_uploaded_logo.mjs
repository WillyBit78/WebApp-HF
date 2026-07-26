import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const logoPath = 'z:/Willy/Proyectos/App Club/Nueva APP/public/logo.png';
const buffer = fs.readFileSync(logoPath);
const png = PNG.sync.read(buffer);

console.log('Public logo.png info:');
console.log(`Dimensions: ${png.width}x${png.height}`);
console.log(`Alpha channel present: ${png.data.length === png.width * png.height * 4}`);

let hasTransparentPixels = false;
for (let i = 3; i < png.data.length; i += 4) {
  if (png.data[i] < 255) {
    hasTransparentPixels = true;
    break;
  }
}
console.log(`Has transparent pixels: ${hasTransparentPixels}`);
