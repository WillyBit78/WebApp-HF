import fs from 'fs';
import path from 'path';
import { transformSync } from 'esbuild';

const srcDir = './src';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(srcDir);
console.log(`Analizando ${files.length} archivos en ${srcDir}...`);

let hasErrors = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  try {
    transformSync(content, {
      loader: file.endsWith('.jsx') ? 'jsx' : 'js',
      jsx: 'transform',
    });
  } catch (err) {
    console.error(`❌ Error en ${file}:`, err.message);
    hasErrors = true;
  }
}

if (!hasErrors) {
  console.log('✅ Todos los archivos JSX compilaron correctamente sin errores de sintaxis o AST.');
}
