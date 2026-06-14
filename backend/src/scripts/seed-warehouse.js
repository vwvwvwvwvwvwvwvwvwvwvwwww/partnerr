import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from '../db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, '../../migrations/016_seed_demo_warehouse.sql');

async function seedWarehouse() {
  const sql = readFileSync(sqlPath, 'utf8');
  const result = await pool.query(sql);
  const inserted = result.rowCount ?? 0;

  const { rows } = await pool.query(`
    SELECT COUNT(*)::int AS total
    FROM warehouse_items
  `);

  console.log(`Склад: добавлено позиций — ${inserted}, всего в базе — ${rows[0].total}`);
  await pool.end();
}

seedWarehouse().catch(async (error) => {
  console.error('Не удалось заполнить склад:', error);
  await pool.end();
  process.exit(1);
});
