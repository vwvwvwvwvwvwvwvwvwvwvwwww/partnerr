import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function loadAppliedSet(client) {
  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
}

async function migrate() {
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('SQL-миграции не найдены');
    return;
  }

  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    console.error('Не удалось подключиться к PostgreSQL (проверьте DATABASE_URL, SSL, доступность БД):', error);
    process.exit(1);
  }

  try {
    await ensureMigrationsTable(client);
    const applied = await loadAppliedSet(client);

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Пропуск (уже применено): ${file}`);
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(fullPath, 'utf8');

      console.log(`Выполняется миграция: ${file}`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (inner) {
        try {
          await client.query('ROLLBACK');
        } catch {
          /* ignore */
        }
        throw inner;
      }
    }

    console.log('Все миграции выполнены успешно');
  } catch (error) {
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

    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Критическая ошибка migrate:', error);
  process.exit(1);
});
