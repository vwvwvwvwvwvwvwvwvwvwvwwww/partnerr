import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Подставляем DATABASE_URL из типичных имён Railway / Render / Docker, если одна строка не задана.
 */
function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return;
  }

  const prismaRaw = process.env.POSTGRES_PRISMA_URL?.trim();
  if (prismaRaw?.startsWith('prisma+postgres://')) {
    process.env.DATABASE_URL = prismaRaw.replace(/^prisma\+postgres:\/\//, 'postgresql://');
    return;
  }

  const fromAlias = [
    process.env.DATABASE_PRIVATE_URL,
    process.env.DATABASE_PUBLIC_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ];
  for (const cand of fromAlias) {
    let t = cand?.trim();
    if (!t) {
      continue;
    }
    if (t.startsWith('prisma+postgres://')) {
      t = t.replace(/^prisma\+postgres:\/\//, 'postgresql://');
    }
    if (t.startsWith('postgres://') || t.startsWith('postgresql://')) {
      process.env.DATABASE_URL = t;
      return;
    }
  }

  const host =
    process.env.PGHOST?.trim() ||
    process.env.POSTGRES_HOSTNAME?.trim() ||
    process.env.POSTGRES_HOST?.trim();
  const user = process.env.PGUSER?.trim() || process.env.POSTGRES_USER?.trim();
  const password = String(process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD ?? '');
  const database =
    process.env.PGDATABASE?.trim() ||
    process.env.POSTGRES_DB?.trim() ||
    process.env.POSTGRES_DATABASE?.trim();
  const port =
    process.env.PGPORT?.trim() ||
    process.env.POSTGRES_PORT?.trim() ||
    process.env.POSTGRESQL_PORT?.trim() ||
    '5432';

  if (!host || !user || !database) {
    return;
  }

  const enc = (s) => encodeURIComponent(s);
  process.env.DATABASE_URL = `postgresql://${enc(user)}:${enc(password)}@${host}:${port}/${enc(database)}`;
}

function logDatabaseEnvDiagnostics() {
  const set = (k) => Boolean(process.env[k]?.toString().trim());
  const jwtOk = (process.env.JWT_SECRET?.length ?? 0) >= 32;
  // eslint-disable-next-line no-console
  console.error('Проверка переменных (true = задано непустое, без вывода значений):', {
    DATABASE_URL: set('DATABASE_URL'),
    DATABASE_PRIVATE_URL: set('DATABASE_PRIVATE_URL'),
    DATABASE_PUBLIC_URL: set('DATABASE_PUBLIC_URL'),
    POSTGRES_URL: set('POSTGRES_URL'),
    POSTGRES_PRISMA_URL: set('POSTGRES_PRISMA_URL'),
    PGHOST: set('PGHOST'),
    PGUSER: set('PGUSER'),
    PGDATABASE: set('PGDATABASE'),
    PGPASSWORD: set('PGPASSWORD'),
    JWT_SECRET_length_ok: jwtOk,
  });
  // eslint-disable-next-line no-console
  console.error(
    'В Railway у сервиса приложения добавьте: Variable DATABASE_URL → Reference → ваш Postgres → DATABASE_URL (см. https://docs.railway.com/guides/variables ). И JWT_SECRET ≥ 32 символов.',
  );
}

function decodeConnPart(s) {
  if (!s) {
    return '';
  }
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Render и др. PaaS передают строку подключения вместо отдельных DB_* */
function applyFromDatabaseUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return;
  }

  if (!raw.startsWith('postgres://') && !raw.startsWith('postgresql://')) {
    return;
  }

  // Не используем new URL('http://' + …): пароль может содержать ? # @ и т.д. (сломает WHATWG URL).
  const rest = raw.replace(/^postgres(ql)?:\/\//, '');
  const at = rest.lastIndexOf('@');
  if (at < 0) {
    return;
  }

  const authPart = rest.slice(0, at);
  let tail = rest.slice(at + 1);
  const q = tail.indexOf('?');
  const h = tail.indexOf('#');
  let end = tail.length;
  if (q >= 0) {
    end = Math.min(end, q);
  }
  if (h >= 0) {
    end = Math.min(end, h);
  }
  tail = tail.slice(0, end);

  const slash = tail.indexOf('/');
  const hostPortPart = slash >= 0 ? tail.slice(0, slash) : tail;
  const dbPathRaw = slash >= 0 ? tail.slice(slash + 1) : '';
  const dbName = (dbPathRaw.split('/')[0] ?? '').split('?')[0] ?? '';

  const fc = authPart.indexOf(':');
  const userEnc = fc >= 0 ? authPart.slice(0, fc) : authPart;
  const passwordEnc = fc >= 0 ? authPart.slice(fc + 1) : '';

  let host;
  let port;
  if (hostPortPart.startsWith('[')) {
    const endBracket = hostPortPart.indexOf(']');
    host = endBracket > 0 ? hostPortPart.slice(0, endBracket + 1) : hostPortPart;
    if (hostPortPart.charAt(endBracket + 1) === ':') {
      port = hostPortPart.slice(endBracket + 2) || '5432';
    } else {
      port = '5432';
    }
  } else {
    const colonHost = hostPortPart.lastIndexOf(':');
    if (colonHost > 0) {
      host = hostPortPart.slice(0, colonHost);
      port = hostPortPart.slice(colonHost + 1) || '5432';
    } else {
      host = hostPortPart;
      port = '5432';
    }
  }

  process.env.DB_HOST = host;
  process.env.DB_PORT = port;
  process.env.DB_NAME = decodeConnPart(dbName);
  process.env.DB_USER = decodeConnPart(userEnc);
  process.env.DB_PASSWORD = decodeConnPart(passwordEnc);
}

ensureDatabaseUrl();
applyFromDatabaseUrl();

if (!process.env.DB_DRIVER?.trim()) {
  process.env.DB_DRIVER =
    process.env.DATABASE_URL?.trim() || process.env.DB_HOST?.trim() ? 'postgres' : 'sqlite';
}

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

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4010),
    /** Путь к `frontend/dist` после `npm run build` в корне; пусто = авто `../frontend/dist` от каталога backend при NODE_ENV=production */
    FRONTEND_DIST: z.string().default(''),
    APP_ORIGIN: z.string().url().default('http://127.0.0.1:8848'),
    DB_DRIVER: z.enum(['sqlite', 'postgres']).default('sqlite'),
    /** Файл SQLite (без отдельного сервера БД — удобно для хостинга) */
    SQLITE_PATH: z.string().default('./data/agro_erp.sqlite'),
    DB_HOST: z.string().default('127.0.0.1'),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_NAME: z.string().default('agro_erp'),
    DB_USER: z.string().default('agro_erp_user'),
    DB_PASSWORD: z.string().default(''),
    DB_POOL_MAX: z.coerce.number().int().positive().default(10),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть не короче 32 символов'),
    JWT_EXPIRES_MINUTES: z.coerce.number().int().positive().default(15),
    CSRF_COOKIE_NAME: z.string().min(1).default('csrf_token'),
    SESSION_COOKIE_NAME: z.string().min(1).default('session_token'),
    SMTP_HOST: z.string().default(''),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z.preprocess(
      (v) => v === 'true' || v === '1' || v === true,
      z.boolean().default(false),
    ),
    SMTP_USER: z.string().default(''),
    SMTP_PASS: z.string().default(''),
    SMTP_FROM: z.string().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.DB_DRIVER !== 'postgres') {
      return;
    }

    if (!data.DB_HOST?.trim() || !data.DB_NAME?.trim() || !data.DB_USER?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Для DB_DRIVER=postgres нужны DB_HOST, DB_NAME и DB_USER',
      });
    }
  });

let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error(
    'Ошибка конфигурации окружения. Нужны JWT_SECRET ≥ 32 символов и корректные настройки БД (SQLite или Postgres).',
  );
  logDatabaseEnvDiagnostics();
  console.error(error);
  throw error;
}

export { env };

export const isProduction = env.NODE_ENV === 'production';

export function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST?.trim() && env.SMTP_FROM?.trim());
}
