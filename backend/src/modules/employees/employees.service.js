import argon2 from 'argon2';
import { query } from '../../db/pool.js';

export async function listEmployees() {
  const result = await query(`
    SELECT
      id,
      username,
      full_name AS "fullName",
      role,
      position,
      phone,
      hired_at AS "hiredAt",
      photo_url AS "photoUrl",
      is_active AS "isActive",
      created_at AS "createdAt"
    FROM app_users
    ORDER BY created_at DESC
  `);

  return result.rows;
}

export async function createEmployee(data) {
  const passwordHash = await argon2.hash(data.password, {
    type: argon2.argon2id,
  });

  const result = await query({
    name: 'employees-create-user',
    text: `
      INSERT INTO app_users (
        username,
        password_hash,
        full_name,
        role,
        position,
        phone,
        hired_at,
        photo_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        username,
        full_name AS "fullName",
        role,
        position,
        phone,
        hired_at AS "hiredAt",
        photo_url AS "photoUrl",
        is_active AS "isActive",
        created_at AS "createdAt"
    `,
    values: [
      data.username,
      passwordHash,
      data.fullName,
      data.role,
      data.position ?? null,
      data.phone ?? null,
      data.hiredAt ?? null,
      data.photoUrl ?? null,
    ],
  });

  return result.rows[0];
}

export async function updateEmployee(id, data) {
  let passwordHash = null;

  if (data.password) {
    passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
    });
  }

  const result = await query({
    name: 'employees-update-user',
    text: `
      UPDATE app_users
      SET
        username = $2,
        password_hash = COALESCE($3, password_hash),
        full_name = $4,
        role = $5,
        position = $6,
        phone = $7,
        hired_at = $8,
        photo_url = $9,
        is_active = $10
      WHERE id = $1
      RETURNING
        id,
        username,
        full_name AS "fullName",
        role,
        position,
        phone,
        hired_at AS "hiredAt",
        photo_url AS "photoUrl",
        is_active AS "isActive",
        created_at AS "createdAt"
    `,
    values: [
      id,
      data.username,
      passwordHash,
      data.fullName,
      data.role,
      data.position ?? null,
      data.phone ?? null,
      data.hiredAt ?? null,
      data.photoUrl ?? null,
      data.isActive,
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Сотрудник не найден');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
