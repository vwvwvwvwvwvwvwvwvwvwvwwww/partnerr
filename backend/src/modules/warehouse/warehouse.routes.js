import express from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createWarehouseItemSchema, updateWarehouseItemSchema } from './warehouse.schemas.js';
import { createWarehouseItem, listWarehouseItems, updateWarehouseItem } from './warehouse.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('warehouse'), async (req, res, next) => {
  try {
    const items = await listWarehouseItems();
    return res.json({ data: items });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireModuleAccess('warehouse'),
  requireRole('admin', 'storekeeper'),
  requireCsrf,
  validateBody(createWarehouseItemSchema),
  async (req, res, next) => {
    try {
      const item = await createWarehouseItem(req.validatedBody);
      return res.status(201).json({
        message: 'Позиция добавлена на склад',
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
  requireModuleAccess('warehouse'),
  requireRole('admin', 'storekeeper'),
  requireCsrf,
  validateBody(updateWarehouseItemSchema),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор складской позиции' });
    }

    try {
      const item = await updateWarehouseItem(id, req.validatedBody);
      return res.json({
        message: 'Складская позиция обновлена',
        data: item,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
