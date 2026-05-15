import { z } from 'zod';

export const createWarehouseItemSchema = z.object({
  warehouseName: z.string().trim().min(2).max(120),
  itemName: z.string().trim().min(2).max(150),
  category: z.enum(['seeds', 'fertilizers', 'szr', 'parts', 'fuel', 'other']),
  unit: z.string().trim().min(1).max(20),
  batchNumber: z.string().trim().max(50).optional().nullable(),
  quantity: z.number().min(0).max(1000000),
  expiryDate: z.string().date().optional().nullable(),
  supplierName: z.string().trim().max(150).optional().nullable(),
});

export const updateWarehouseItemSchema = createWarehouseItemSchema;
