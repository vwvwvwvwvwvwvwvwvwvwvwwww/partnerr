import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** Render и др. PaaS передают строку подключения вместо отдельных DB_* */
function applyFromDatabaseUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return;
  }
  if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
    return;
  }

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

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === 'production';
