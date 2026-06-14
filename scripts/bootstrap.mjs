import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureEnvFiles } from './ensure-env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  console.log('=== Партнер: первичная настройка ===\n');

  ensureEnvFiles();

  console.log('\n→ Установка npm-пакетов (корень, backend, frontend)…');
  execSync('npm install', { cwd: root, stdio: 'inherit' });
  execSync('npm run install:all', { cwd: root, stdio: 'inherit' });

  console.log(
    '\n→ База SQLite (файл ./backend/data/agro_erp.sqlite). Отдельный Postgres не нужен.\n',
  );

  console.log('\n→ Миграции базы данных…');
  execSync('npm run migrate --prefix backend', { cwd: root, stdio: 'inherit' });

  console.log('\n→ Учётная запись администратора (можно выполнять повторно)…');
  execSync('npm run create-admin --prefix backend', {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'Admin12345Secure!',
      ADMIN_FULL_NAME: 'Кузнецов Сергей Михайлович',
    },
  });

  console.log('\n→ Учётные записи сотрудников (агрономы, механики, склад, бухгалтерия)…');
  execSync('npm run seed-staff --prefix backend', {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      SEED_STAFF_PASSWORD: 'Admin12345Secure!',
    },
  });

  console.log('\n→ Демо-данные (поля, склад, культуры)…');
  execSync('npm run seed-sqlite-demo --prefix backend', { cwd: root, stdio: 'inherit' });

  console.log('\n=== Готово ===');
  console.log('Сайт:   http://127.0.0.1:8848  (порт см. VITE_DEV_PORT; при занятом порте — смотри терминал Vite)');
  console.log('API:    http://127.0.0.1:4010');
  console.log('Вход администратора: admin / Admin12345Secure!');
  console.log('Сотрудники (логины agronom, agronom2, mechanic, …): тот же пароль, см. seed-staff-accounts.js');
  console.log('\nКаждый день для разработки достаточно: npm run dev\n');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
