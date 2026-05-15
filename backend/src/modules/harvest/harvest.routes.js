import express from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createWaybillSchema, updateWaybillSchema } from './harvest.schemas.js';
import { createWaybill, listWaybills, updateWaybill } from './harvest.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('harvest'), async (req, res, next) => {
  try {
    const items = await listWaybills();
    return res.json({ data: items });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireModuleAccess('harvest'),
  requireRole('admin', 'agronomist', 'storekeeper'),
  requireCsrf,
  validateBody(createWaybillSchema),
  async (req, res, next) => {
    try {
      const item = await createWaybill(req.validatedBody);
      return res.status(201).json({
        message: 'Путевой лист добавлен',
        data: item,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  '/:id',
  requireAuth,
  requireModuleAccess('harvest'),
  requireRole('admin', 'agronomist', 'storekeeper'),
  requireCsrf,
  validateBody(updateWaybillSchema),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор путевого листа' });
    }

    try {
      const item = await updateWaybill(id, req.validatedBody);
      return res.json({
        message: 'Путевой лист обновлен',
        data: item,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
