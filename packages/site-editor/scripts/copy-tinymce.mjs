import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../node_modules/tinymce');
const dest = path.join(__dirname, '../public/tinymce');

function copyRecursive(from, to) {
  if (!fs.existsSync(from)) {
    console.warn('TinyMCE package not found — run npm install first.');
    return;
  }
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);
    if (entry.isDirectory()) copyRecursive(sourcePath, targetPath);
    else fs.copyFileSync(sourcePath, targetPath);
  }
}

copyRecursive(src, dest);
console.log('Copied TinyMCE → public/tinymce');
