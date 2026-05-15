import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

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
