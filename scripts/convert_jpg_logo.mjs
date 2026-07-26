import fs from 'fs';
import path from 'path';

const uploadedDir = 'C:/Users/Willy/.gemini/antigravity/brain/085609c8-04a3-412e-ab7c-68be0ca5c467/.user_uploaded/';
const srcJpg = path.join(uploadedDir, 'media__1785044938675.jpg');
const destLogo = 'z:/Willy/Proyectos/App Club/Nueva APP/public/logo.png';
const destJpg = 'z:/Willy/Proyectos/App Club/Nueva APP/public/logo.jpg';

fs.copyFileSync(srcJpg, destLogo);
fs.copyFileSync(srcJpg, destJpg);

console.log('Successfully replaced public/logo.png and public/logo.jpg with the user-provided high resolution shield!');
