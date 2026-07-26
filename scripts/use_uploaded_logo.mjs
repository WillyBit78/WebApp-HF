import fs from 'fs';
import path from 'path';

const uploadedDir = 'C:/Users/Willy/.gemini/antigravity/brain/085609c8-04a3-412e-ab7c-68be0ca5c467/.user_uploaded/';
const destPath = 'z:/Willy/Proyectos/App Club/Nueva APP/public/logo.png';

const files = fs.readdirSync(uploadedDir);
console.log('Uploaded files:', files);

// Get the latest PNG uploaded file
const pngFiles = files.filter(f => f.endsWith('.png')).map(f => ({
  name: f,
  time: fs.statSync(path.join(uploadedDir, f)).mtimeMs,
  size: fs.statSync(path.join(uploadedDir, f)).size
})).sort((a, b) => b.time - a.time);

console.log('PNG files sorted by time:', pngFiles);

if (pngFiles.length > 0) {
  const latestFile = pngFiles[0].name;
  console.log('Copying latest image:', latestFile);
  fs.copyFileSync(path.join(uploadedDir, latestFile), destPath);
  console.log('Successfully updated public/logo.png with user uploaded logo!');
}
