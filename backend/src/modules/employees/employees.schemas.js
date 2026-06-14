import { z } from 'zod';

const employeePhotoSchema = z
  .string()
  .trim()
  .max(900000, 'Изображение слишком большое')
  .startsWith('data:image/', 'Поддерживаются только изображения')
  .optional()
  .nullable();

export const createEmployeeSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(3).max(150),
  role: z.enum(['admin', 'agronomist', 'mechanic', 'storekeeper', 'accountant', 'driver']),
  email: z.string().trim().email('Некорректный e-mail').max(255).optional().nullable(),
  position: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  hiredAt: z.string().date().optional().nullable(),
  photoUrl: employeePhotoSchema,
});

export const updateEmployeeSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(8).max(128).optional().nullable(),
  fullName: z.string().trim().min(3).max(150),
  role: z.enum(['admin', 'agronomist', 'mechanic', 'storekeeper', 'accountant', 'driver']),
  email: z.string().trim().email('Некорректный e-mail').max(255).optional().nullable(),
  position: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  hiredAt: z.string().date().optional().nullable(),
  photoUrl: employeePhotoSchema,
  isActive: z.boolean(),
});
