import fs from 'fs';
import path from 'path';

const uploadedDir = 'C:/Users/Willy/.gemini/antigravity/brain/085609c8-04a3-412e-ab7c-68be0ca5c467/.user_uploaded/';
const f1 = path.join(uploadedDir, 'media__1785044935470.jpg');
const f2 = path.join(uploadedDir, 'media__1785044938675.jpg');

console.log('f1 size:', fs.statSync(f1).size);
console.log('f2 size:', fs.statSync(f2).size);
