import './migrate-mode.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/pool.js';
import { isSqlite } from '../db/dialect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(
  __dirname,
  isSqlite ? '../../migrations-sqlite' : '../../migrations',
);

async function ensureMigrationsTable(client) {
  if (isSqlite) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    return;
  }

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

function warnIfInternalDatabaseUrl() {
  if (isSqlite) {
    return;
  }

  const u = process.env.DATABASE_URL?.trim() ?? '';
  if (!u.includes('.railway.internal')) {
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(
    [
      '→ В DATABASE_URL указан хост *.railway.internal — с домашнего Mac он не открывается (ENOTFOUND).',
      '  Для SQLite используйте DB_DRIVER=sqlite — отдельный Postgres не нужен.',
    ].join('\n'),
  );
}

async function runMigration(client, sql) {
  if (isSqlite && client.exec) {
    client.exec(sql);
    return;
  }

  await client.query(sql);
}

async function migrate() {
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('SQL-миграции не найдены');
    return;
  }

  warnIfInternalDatabaseUrl();

  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    console.error(
      isSqlite
        ? 'Не удалось открыть SQLite (проверьте SQLITE_PATH):'
        : 'Не удалось подключиться к PostgreSQL (проверьте DATABASE_URL, SSL, доступность БД):',
      error,
    );
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
      await runMigration(client, sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    }

    console.log(`Все миграции выполнены успешно (${isSqlite ? 'SQLite' : 'PostgreSQL'})`);
  } catch (error) {
    console.error('Ошибка выполнения миграции:', error);

    if (!isSqlite) {
      const msg = String(error.message ?? '');
      const isPostgisUnavailable =
        msg.includes('postgis') &&
        (msg.includes('not available') || msg.includes('No such file') || msg.includes('control file'));

      if (isPostgisUnavailable || (error.code === '0A000' && msg.toLowerCase().includes('postgis'))) {
        console.error(`
→ PostGIS не виден серверу PostgreSQL. Для хостинга проще: DB_DRIVER=sqlite в backend/.env (без Postgres).
  Локально: chmod +x scripts/init-local-db.sh && ./scripts/init-local-db.sh
`);
      }
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
