/**
 * Первый запуск на Railway/хостинге: если нет пользователей — admin + демо-данные.
 * Пароли как после `npm run bootstrap` (можно переопределить через Variables).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.AGRO_ERP_MIGRATE_SCRIPT = '1';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '../..');

const DEFAULT_ADMIN_PASSWORD = 'Admin12345Secure!';

function bootEnv() {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
  return {
    ...process.env,
    AGRO_ERP_MIGRATE_SCRIPT: '1',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME?.trim() || 'admin',
    ADMIN_PASSWORD: adminPassword,
    ADMIN_FULL_NAME: process.env.ADMIN_FULL_NAME?.trim() || 'Кузнецов Сергей Михайлович',
    SEED_STAFF_PASSWORD: process.env.SEED_STAFF_PASSWORD?.trim() || adminPassword,
  };
}

function runScript(relativePath, env) {
  const result = spawnSync('node', [relativePath], {
    cwd: backendDir,
    stdio: 'inherit',
    env,
  });
  if (result.status !== 0) {
    throw new Error(`${relativePath} завершился с кодом ${result.status ?? 1}`);
  }
}

async function ensureRailwayData() {
  const { pool } = await import('../db/pool.js');
  const { rows } = await pool.query('SELECT COUNT(*) AS c FROM app_users');
  const count = Number(rows[0]?.c ?? 0);

  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[ensure-railway-data] пользователей в БД: ${count} — bootstrap не нужен`);
    await pool.end();
    return;
  }

  const env = bootEnv();
  // eslint-disable-next-line no-console
  console.log('[ensure-railway-data] пустая БД — создаём admin, сотрудников и демо-данные…');

  await pool.end();

  runScript('src/scripts/create-admin.js', env);
  runScript('src/scripts/seed-staff-accounts.js', env);
  runScript('src/scripts/seed-sqlite-demo.js', env);
  runScript('src/scripts/seed-finance.js', env);

  // eslint-disable-next-line no-console
  console.log(
    [
      '[ensure-railway-data] готово.',
      `Вход: ${env.ADMIN_USERNAME} / (пароль из ADMIN_PASSWORD или ${DEFAULT_ADMIN_PASSWORD})`,
    ].join(' '),
  );
}

ensureRailwayData().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[ensure-railway-data]', error);
  process.exit(1);
});
