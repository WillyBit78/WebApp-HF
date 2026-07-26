import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const uploadedDir = 'C:/Users/Willy/.gemini/antigravity/brain/085609c8-04a3-412e-ab7c-68be0ca5c467/.user_uploaded/';
const files = fs.readdirSync(uploadedDir);

files.forEach(file => {
  const filePath = path.join(uploadedDir, file);
  const size = fs.statSync(filePath).size;
  if (file.endsWith('.png')) {
    try {
      const png = PNG.sync.read(fs.readFileSync(filePath));
      console.log(`PNG: ${file} | ${png.width}x${png.height} | ${size} bytes`);
    } catch (e) {
      console.log(`PNG error: ${file}`);
    }
  } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    console.log(`JPG: ${file} | ${size} bytes`);
  }
});
