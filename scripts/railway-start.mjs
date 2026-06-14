/**
 * Старт на Railway: миграция (отдельный процесс) → HTTP-сервер в этом же процессе.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = path.join(root, 'backend');

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(`[railway-start] ${msg}`);
}

process.env.NODE_ENV = 'production';
if (!process.env.DB_DRIVER?.trim()) {
  process.env.DB_DRIVER = 'sqlite';
}

log(`PORT=${process.env.PORT ?? '(Railway задаёт)'} DB_DRIVER=${process.env.DB_DRIVER}`);

log('миграции SQLite…');
const migrate = spawnSync('node', ['src/scripts/migrate.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    AGRO_ERP_MIGRATE_SCRIPT: '1',
  },
});

if (migrate.status !== 0) {
  // eslint-disable-next-line no-console
  console.error(`[railway-start] migrate exit ${migrate.status ?? 1}`);
  process.exit(migrate.status ?? 1);
}

log('первичные пользователи и демо-данные (если БД пустая)…');
const bootstrap = spawnSync('node', ['src/scripts/ensure-railway-data.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env,
});

if (bootstrap.status !== 0) {
  // eslint-disable-next-line no-console
  console.error(`[railway-start] ensure-railway-data exit ${bootstrap.status ?? 1}`);
  process.exit(bootstrap.status ?? 1);
}

log('запуск server.js…');
process.chdir(backendDir);
await import(path.join(backendDir, 'src/server.js'));
