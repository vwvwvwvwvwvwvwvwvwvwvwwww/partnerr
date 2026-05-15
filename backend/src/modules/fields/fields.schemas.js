import { z } from 'zod';

const positionSchema = z.tuple([z.number().finite(), z.number().finite()]);

const polygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(positionSchema).min(4)).min(1),
});

const multipolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(positionSchema).min(4)).min(1)).min(1),
});

export const createFieldSchema = z.object({
  name: z.string().trim().min(3).max(150),
  cadastralNumber: z.string().trim().max(50).optional().nullable(),
  areaHa: z.number().positive().max(100000),
  soilType: z.string().trim().max(100).optional().nullable(),
  status: z.enum(['prepared', 'sown', 'growing', 'harvest', 'fallow']),
  currentCropId: z.number().int().positive().optional().nullable(),
  geometry: z.union([polygonSchema, multipolygonSchema]),
});

export const updateFieldSchema = createFieldSchema;
