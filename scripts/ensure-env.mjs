import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Копирует .env из примеров, если файлов ещё нет (удобно для первого запуска).
 */
export function ensureEnvFiles() {
  const pairs = [
    ['backend/.env.example', 'backend/.env'],
    ['frontend/.env.example', 'frontend/.env'],
  ];

  for (const [example, target] of pairs) {
    const from = path.join(root, example);
    const to = path.join(root, target);

    if (!fs.existsSync(to)) {
      fs.copyFileSync(from, to);
      console.log(`Создан ${target} из ${example}`);
    }
  }
}
