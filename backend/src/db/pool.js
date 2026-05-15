import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

/** Render / Neon и др.: в строке подключения часто sslmode=require */
function poolSslOption() {
  const raw = process.env.DATABASE_URL ?? '';
  if (raw.includes('sslmode=require') || raw.includes('sslmode=prefer')) {
    return { rejectUnauthorized: false };
  }
  if (env.DB_HOST && /render\.com|neon\.tech|supabase\.co|railway\.internal|rlwy\.net|railway\.app/i.test(env.DB_HOST)) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

const ssl = poolSslOption();

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  application_name: 'agro_erp_local',
  ...(ssl ? { ssl } : {}),
});

pool.on('error', (error) => {
  console.error('Неожиданная ошибка PostgreSQL:', error);
});

export async function query(textOrConfig, params = []) {
  if (typeof textOrConfig === 'object') {
    return pool.query(textOrConfig);
  }

  return pool.query(textOrConfig, params);
}
