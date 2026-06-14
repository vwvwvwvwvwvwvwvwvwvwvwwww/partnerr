import argon2 from 'argon2';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const adminSchema = z.object({
  ADMIN_USERNAME: z.string().trim().min(3).max(50),
  ADMIN_PASSWORD: z.string().min(10).max(128),
  ADMIN_FULL_NAME: z.string().trim().min(3).max(150).default('Системный администратор'),
});


async function createAdmin() {
  const env = adminSchema.parse(process.env);
  const passwordHash = await argon2.hash(env.ADMIN_PASSWORD, {
    type: argon2.argon2id,
  });

  const text = `
    INSERT INTO app_users (username, password_hash, full_name, role)
    VALUES ($1, $2, $3, 'admin')
    ON CONFLICT (username)
    DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = 'admin',
      is_active = TRUE
    RETURNING id, username, full_name, role
  `;

  const result = await pool.query({
    name: 'admin-upsert-user',
    text,
    values: [env.ADMIN_USERNAME, passwordHash, env.ADMIN_FULL_NAME],
  });

  console.log('Администратор готов:', result.rows[0]);
  await pool.end();
}

createAdmin().catch(async (error) => {
  console.error('Не удалось создать администратора:', error);
  await pool.end();
  process.exit(1);
});
