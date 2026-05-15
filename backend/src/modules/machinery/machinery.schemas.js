import { z } from 'zod';

export const createMachinerySchema = z.object({
  inventoryNumber: z.string().trim().min(2).max(50),
  type: z.enum(['tractor', 'combine', 'sprayer', 'seeder', 'truck', 'other']),
  brand: z.string().trim().min(2).max(100),
  model: z.string().trim().min(1).max(100),
  registrationNumber: z.string().trim().max(30).optional().nullable(),
  yearOfManufacture: z.number().int().min(1950).max(2100).optional().nullable(),
  engineHours: z.number().min(0).max(999999).default(0),
  status: z.enum(['active', 'maintenance', 'repair', 'retired']).default('active'),
});

export const updateMachinerySchema = createMachinerySchema;
