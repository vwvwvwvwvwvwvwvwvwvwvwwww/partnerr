import { env } from '../config/env.js';

export const isSqlite = env.DB_DRIVER === 'sqlite';
