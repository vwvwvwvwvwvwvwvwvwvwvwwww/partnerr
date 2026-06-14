import { z } from 'zod';

const referenceModules = [
  'fields',
  'planning',
  'machinery',
  'warehouse',
  'harvest',
  'finance',
  'hr',
  'other',
];

export const createFinanceEntrySchema = z.object({
  entryType: z.enum(['income', 'expense']),
  category: z.string().trim().min(2).max(100),
  amount: z.number().positive().max(1_000_000_000),
  operationDate: z.string().date(),
  referenceModule: z.enum(referenceModules),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateFinanceEntrySchema = createFinanceEntrySchema;
