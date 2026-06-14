/**
 * Старт на Railway: проверка env → быстрая миграция (отдельный процесс) → HTTP-сервер.
 * Миграции также выполняются на этапе build (railway.json); здесь — догон новых SQL при redeploy.
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = path.join(root, 'backend');

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(`[railway-start] ${msg}`);
}

function fail(msg, code = 1) {
  // eslint-disable-next-line no-console
  console.error(`[railway-start] ${msg}`);
  process.exit(code);
}

const jwtLen = process.env.JWT_SECRET?.length ?? 0;
if (jwtLen < 32) {
  fail(
    [
      'JWT_SECRET не задан или короче 32 символов.',
      'Railway → сервис → Variables → JWT_SECRET = случайная строка ≥ 32 символов.',
      'Также нужны: DB_DRIVER=sqlite, NODE_ENV=production, VITE_API_URL=/api',
    ].join('\n'),
  );
}

if (!process.env.DB_DRIVER?.trim()) {
  process.env.DB_DRIVER = 'sqlite';
}

process.env.NODE_ENV = 'production';

log('миграции SQLite (если есть новые)…');
const migrate = spawnSync('node', ['src/scripts/migrate.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    AGRO_ERP_MIGRATE_SCRIPT: '1',
  },
});

if (migrate.status !== 0) {
  fail(`migrate завершился с кодом ${migrate.status ?? 1}`, migrate.status ?? 1);
}

log(`запуск backend на PORT=${process.env.PORT ?? '(не задан — Railway должен задать)'}`);

const server = spawn('node', ['src/server.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  env: process.env,
});

server.on('error', (err) => {
  fail(`не удалось запустить server.js: ${err.message}`);
});

server.on('close', (code, signal) => {
  if (signal) {
    fail(`server завершён сигналом ${signal}`, 1);
  }
  process.exit(code ?? 0);
});

process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));
