import { z } from 'zod';

export const createCropSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(50),
  defaultSeedRateKgHa: z.number().min(0).max(10000).optional().nullable(),
  defaultFertilizerRateKgHa: z.number().min(0).max(10000).optional().nullable(),
});

export const updateCropSchema = createCropSchema;
