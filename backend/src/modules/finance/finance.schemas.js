import { z } from 'zod';

export const createFinanceEntrySchema = z.object({
  entryType: z.enum(['income', 'expense']),
  category: z.string().trim().min(2).max(100),
  amount: z.number().positive().max(1000000000),
  operationDate: z.string().date(),
  referenceModule: z.enum(['fields', 'planning', 'machinery', 'warehouse', 'harvest', 'finance', 'hr', 'other']),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateFinanceEntrySchema = createFinanceEntrySchema;
