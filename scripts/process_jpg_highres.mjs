import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const uploadedDir = 'C:/Users/Willy/.gemini/antigravity/brain/085609c8-04a3-412e-ab7c-68be0ca5c467/.user_uploaded/';
const srcJpgPath = path.join(uploadedDir, 'media__1785103459939.jpg');

console.log(`JPG Size: ${fs.statSync(srcJpgPath).size} bytes`);
