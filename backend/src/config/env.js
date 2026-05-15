import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** Render и др. PaaS передают строку подключения вместо отдельных DB_* */
function applyFromDatabaseUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return;
  }

  // Не выходим раньше времени: если заданы только DB_HOST/DB_NAME/DB_USER без пароля,
  // разбор DATABASE_URL (Render «Link Database») не выполнялся — Zod падал на DB_PASSWORD.

  let normalized = raw;
  if (raw.startsWith('postgres://')) {
    normalized = `http://${raw.slice('postgres://'.length)}`;
  } else if (raw.startsWith('postgresql://')) {
    normalized = `http://${raw.slice('postgresql://'.length)}`;
  } else {
    return;
  }

  const u = new URL(normalized);
  process.env.DB_HOST = u.hostname;
  process.env.DB_PORT = u.port || '5432';
  const dbPath = (u.pathname || '/').replace(/^\//, '').split('/')[0] ?? '';
  process.env.DB_NAME = decodeURIComponent(dbPath);
  process.env.DB_USER = decodeURIComponent(u.username || '');
  process.env.DB_PASSWORD = decodeURIComponent(u.password || '');
}

applyFromDatabaseUrl();

/** Railway задаёт RAILWAY_PUBLIC_DOMAIN; без APP_ORIGIN CORS ломается в браузере. */
function applyAppOriginFromRailway() {
  if (process.env.APP_ORIGIN?.trim()) {
    return;
  }
  const host = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (!host) {
    return;
  }
  process.env.APP_ORIGIN = /^https?:\/\//i.test(host) ? host : `https://${host}`;
}

applyAppOriginFromRailway();

/** Render задаёт RENDER_EXTERNAL_URL (https://…onrender.com). */
function applyAppOriginFromRender() {
  if (process.env.APP_ORIGIN?.trim()) {
    return;
  }
  const raw = process.env.RENDER_EXTERNAL_URL?.trim();
  if (!raw) {
    return;
  }
  process.env.APP_ORIGIN = raw.replace(/\/$/, '');
}

applyAppOriginFromRender();

/** Скрипт миграций не использует JWT; в pre-deploy (Railway и др.) JWT_SECRET часто не задан — не блокируем migrate. */
const MIGRATE_JWT_PLACEHOLDER = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function isMigrateCli() {
  const p = (process.argv[1] ?? '').replace(/\\/g, '/');
  return p.endsWith('src/scripts/migrate.js') || p.endsWith('/scripts/migrate.js');
}

const isMigrateContext =
  process.env.AGRO_ERP_MIGRATE_SCRIPT === '1' || isMigrateCli();

if (isMigrateContext && (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).length < 32)) {
  process.env.JWT_SECRET = MIGRATE_JWT_PLACEHOLDER;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4010),
  /** Путь к `frontend/dist` после `npm run build` в корне; пусто = авто `../frontend/dist` от каталога backend при NODE_ENV=production */
  FRONTEND_DIST: z.string().default(''),
  APP_ORIGIN: z.string().url().default('http://127.0.0.1:8848'),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть не короче 32 символов'),
  JWT_EXPIRES_MINUTES: z.coerce.number().int().positive().default(15),
  CSRF_COOKIE_NAME: z.string().min(1).default('csrf_token'),
  SESSION_COOKIE_NAME: z.string().min(1).default('session_token'),
});

let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error(
    'Ошибка конфигурации окружения: DATABASE_URL; JWT_SECRET ≥ 32 символов. APP_ORIGIN: задайте вручную или подставится из RAILWAY_PUBLIC_DOMAIN / RENDER_EXTERNAL_URL.',
  );
  console.error(error);
  throw error;
}

export { env };

export const isProduction = env.NODE_ENV === 'production';
