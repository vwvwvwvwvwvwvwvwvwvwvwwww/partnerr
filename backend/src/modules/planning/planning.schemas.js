import { z } from 'zod';

export const createTechnologyCardSchema = z.object({
  title: z.string().trim().min(3).max(150),
  workName: z.string().trim().min(3).max(200),
  unit: z.string().trim().min(1).max(20),
  workVolume: z.number().nonnegative().max(1000000),
  conversionCoefficient: z.number().nonnegative().max(100000),
  equivalentAreaHa: z.number().nonnegative().max(1000000),
  aggregateComposition: z.string().trim().min(3).max(1000),
  cropId: z.number().int().positive(),
  seasonYear: z.number().int().min(2000).max(2100),
  areaHa: z.number().positive().max(100000),
  plannedStartDate: z.string().date(),
  plannedEndDate: z.string().date(),
  aggregatesCount: z.number().int().nonnegative().max(1000),
  mechanizatorsCount: z.number().int().nonnegative().max(1000),
  workersCount: z.number().int().nonnegative().max(1000),
  outputNorm: z.number().nonnegative().max(1000000),
  normShiftsCount: z.number().nonnegative().max(1000000),
  laborCosts: z.number().nonnegative().max(1000000),
  tariffRate: z.number().nonnegative().max(1000000),
  tariffFund: z.number().nonnegative().max(100000000),
  extraPay: z.number().nonnegative().max(100000000),
  fuelRate: z.number().nonnegative().max(1000000),
  fuelTotalLiters: z.number().nonnegative().max(100000000),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateTechnologyCardSchema = createTechnologyCardSchema;
