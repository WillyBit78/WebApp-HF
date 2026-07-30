import fs from 'fs';
import path from 'path';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;

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
console.log(`Analizando scope y variables no declaradas en ${files.length} archivos...`);

const globals = new Set([
  'window', 'document', 'navigator', 'console', 'localStorage', 'sessionStorage',
  'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'caches',
  'Request', 'Response', 'File', 'FileReader', 'Image', 'Uint8Array', 'URL', 'URLSearchParams',
  'Notification', 'Math', 'Date', 'String', 'Number', 'Boolean', 'Array', 'Object', 'Promise',
  'Error', 'RegExp', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent', 'decodeURIComponent',
  'alert', 'confirm', 'prompt', 'process', 'globalThis', 'import', 'module', 'exports', 'require',
  'pdfjsLib', 'GoogleGenerativeAI'
]);

for (const file of files) {
  const code = fs.readFileSync(file, 'utf-8');
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    traverse(ast, {
      ReferencedIdentifier(pathNode) {
        const name = pathNode.node.name;
        if (globals.has(name)) return;
        if (!pathNode.scope.hasBinding(name)) {
          // Check if it's a JSX tag or standard property access
          if (pathNode.parent.type === 'JSXOpeningElement' || pathNode.parent.type === 'JSXClosingElement') {
            return;
          }
          console.log(`⚠️ Variable no declarada '${name}' en ${file}:L${pathNode.node.loc?.start.line}`);
        }
      }
    });
  } catch (err) {
    console.error(`Error parseando ${file}:`, err.message);
  }
}
