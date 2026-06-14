import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function copyIfMissing(examplePath, targetPath) {
  if (fs.existsSync(targetPath) || !fs.existsSync(examplePath)) {
    return;
  }

  fs.copyFileSync(examplePath, targetPath);
  console.log(`Создан ${path.relative(root, targetPath)} из ${path.relative(root, examplePath)}`);
}

export function ensureEnvFiles() {
  copyIfMissing(path.join(root, 'backend/.env.example'), path.join(root, 'backend/.env'));
  copyIfMissing(path.join(root, 'frontend/.env.example'), path.join(root, 'frontend/.env'));
}
