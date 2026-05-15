import express from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createMachinerySchema, updateMachinerySchema } from './machinery.schemas.js';
import { createMachinery, listMachinery, updateMachinery } from './machinery.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('machinery'), async (req, res, next) => {
  try {
    const items = await listMachinery();
    return res.json({ data: items });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireModuleAccess('machinery'),
  requireRole('admin', 'mechanic'),
  requireCsrf,
  validateBody(createMachinerySchema),
  async (req, res, next) => {
    try {
      const item = await createMachinery(req.validatedBody);
      return res.status(201).json({
        message: 'Техника добавлена',
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
  requireModuleAccess('machinery'),
  requireRole('admin', 'mechanic'),
  requireCsrf,
  validateBody(updateMachinerySchema),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор техники' });
    }

    try {
      const item = await updateMachinery(id, req.validatedBody);
      return res.json({
        message: 'Техника обновлена',
        data: item,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
