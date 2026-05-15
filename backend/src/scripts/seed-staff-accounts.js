import argon2 from 'argon2';
import { z } from 'zod';
import { pool } from '../db/pool.js';

/**
 * Учётные записи сотрудников. Роли «водитель» в схеме нет.
 * Данные заполнены для демонстрации (ФИО, телефоны, даты приёма, должности).
 */

const envSchema = z.object({
  SEED_STAFF_PASSWORD: z.string().min(10).max(128),
});

const staff = [
  {
    username: 'agronom',
    fullName: 'Петров Алексей Сергеевич',
    role: 'agronomist',
    position: 'Главный агроном',
    phone: '+7 (3532) 44-11-01',
    hiredAt: '2018-03-12',
  },
  {
    username: 'agronom2',
    fullName: 'Зайцев Дмитрий Игоревич',
    role: 'agronomist',
    position: 'Ведущий агроном (заместитель главного)',
    phone: '+7 (3532) 44-11-02',
    hiredAt: '2019-06-01',
  },
  {
    username: 'agronom3',
    fullName: 'Морозова Елена Викторовна',
    role: 'agronomist',
    position: 'Агроном-защитник растений',
    phone: '+7 (3532) 44-11-03',
    hiredAt: '2021-02-15',
  },
  {
    username: 'mechanic',
    fullName: 'Сидоров Николай Викторович',
    role: 'mechanic',
    position: 'Старший механик',
    phone: '+7 (3532) 44-22-01',
    hiredAt: '2015-08-20',
  },
  {
    username: 'mechanic2',
    fullName: 'Волков Андрей Павлович',
    role: 'mechanic',
    position: 'Механик цеха ремонта',
    phone: '+7 (3532) 44-22-02',
    hiredAt: '2020-11-09',
  },
  {
    username: 'kladovshik',
    fullName: 'Козлова Мария Ивановна',
    role: 'storekeeper',
    position: 'Кладовщик центрального склада',
    phone: '+7 (3532) 44-33-01',
    hiredAt: '2017-04-03',
  },
  {
    username: 'kladovshik2',
    fullName: 'Новиков Сергей Олегович',
    role: 'storekeeper',
    position: 'Кладовщик (ГСМ и запчасти)',
    phone: '+7 (3532) 44-33-02',
    hiredAt: '2022-01-17',
  },
  {
    username: 'buhgalter',
    fullName: 'Смирнова Ольга Петровна',
    role: 'accountant',
    position: 'Главный бухгалтер',
    phone: '+7 (3532) 44-44-01',
    hiredAt: '2016-01-11',
  },
  {
    username: 'buhgalter2',
    fullName: 'Фёдорова Анна Сергеевна',
    role: 'accountant',
    position: 'Бухгалтер (материальный учёт)',
    phone: '+7 (3532) 44-44-02',
    hiredAt: '2019-09-23',
  },
];

async function seedStaff() {
  const { SEED_STAFF_PASSWORD } = envSchema.parse(process.env);
  const passwordHash = await argon2.hash(SEED_STAFF_PASSWORD, {
    type: argon2.argon2id,
  });

  const text = `
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
    VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
    ON CONFLICT (username)
    DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      position = EXCLUDED.position,
      phone = EXCLUDED.phone,
      hired_at = EXCLUDED.hired_at,
      is_active = TRUE
    RETURNING id, username, full_name, role
  `;

  console.log('Создание учёток сотрудников…');

  for (const row of staff) {
    const result = await pool.query({
      name: `staff-upsert-${row.username}`,
      text,
      values: [
        row.username,
        passwordHash,
        row.fullName,
        row.role,
        row.position,
        row.phone,
        row.hiredAt,
      ],
    });
    console.log('Готово:', result.rows[0]);
  }

  console.log('\nЛогины:', staff.map((s) => s.username).join(', '));
  console.log('Пароль задан переменной SEED_STAFF_PASSWORD.');
  await pool.end();
}

seedStaff().catch(async (error) => {
  console.error('Ошибка:', error.message ?? error);
  await pool.end();
  process.exit(1);
});
