import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../migrations');

async function migrate() {
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('SQL-миграции не найдены');
    return;
  }

  const client = await pool.connect();

  try {
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(fullPath, 'utf8');

      console.log(`Выполняется миграция: ${file}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
    }

    console.log('Все миграции выполнены успешно');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка выполнения миграции:', error);

    const msg = String(error.message ?? '');
    const isPostgisUnavailable =
      msg.includes('postgis') &&
      (msg.includes('not available') || msg.includes('No such file') || msg.includes('control file'));

    if (isPostgisUnavailable || (error.code === '0A000' && msg.toLowerCase().includes('postgis'))) {
      console.error(`
→ PostGIS не виден серверу PostgreSQL (часто на Mac с Homebrew).
  Из корня репозитория выполните:
    chmod +x scripts/init-local-db.sh && ./scripts/init-local-db.sh
  Скрипт подберёт версию PostgreSQL, для которой есть файлы postgis (часто postgresql@17).
  Нужно: brew install postgresql@17 postgis && brew services start postgresql@17
  (если postgis.control не находится — см. README, раздел «Без Docker»).
`);
    }

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
