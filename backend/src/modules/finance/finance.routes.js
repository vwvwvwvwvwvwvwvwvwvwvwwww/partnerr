import express from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createFinanceEntrySchema, updateFinanceEntrySchema } from './finance.schemas.js';
import { createFinanceEntry, getFinanceSummary, listFinanceEntries, updateFinanceEntry } from './finance.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('finance'), async (req, res, next) => {
  try {
    const entries = await listFinanceEntries();
    return res.json({ data: entries });
  } catch (error) {
    return next(error);
  }
});

router.get('/summary', requireAuth, requireModuleAccess('finance'), async (req, res, next) => {
  try {
    const summary = await getFinanceSummary();
    return res.json({ data: summary });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireModuleAccess('finance'),
  requireRole('admin', 'accountant'),
  requireCsrf,
  validateBody(createFinanceEntrySchema),
  async (req, res, next) => {
    try {
      const entry = await createFinanceEntry(req.validatedBody);
      return res.status(201).json({
        message: 'Финансовая операция сохранена',
        data: entry,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  '/:id',
  requireAuth,
  requireModuleAccess('finance'),
  requireRole('admin', 'accountant'),
  requireCsrf,
  validateBody(updateFinanceEntrySchema),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор операции' });
    }

    try {
      const entry = await updateFinanceEntry(id, req.validatedBody);
      return res.json({
        message: 'Финансовая операция обновлена',
        data: entry,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
