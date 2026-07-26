import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const uploadedDir = 'C:/Users/Willy/.gemini/antigravity/brain/085609c8-04a3-412e-ab7c-68be0ca5c467/.user_uploaded/';
const files = fs.readdirSync(uploadedDir);

console.log('All uploaded files:');
files.forEach(f => {
  const size = fs.statSync(path.join(uploadedDir, f)).size;
  console.log(`${f} - ${size} bytes`);
});
