import express from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createCropSchema, updateCropSchema } from './crops.schemas.js';
import { createCrop, listCrops, updateCrop } from './crops.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('crops'), async (req, res, next) => {
  try {
    const crops = await listCrops();
    return res.json({ data: crops });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireModuleAccess('crops'),
  requireRole('admin', 'agronomist'),
  requireCsrf,
  validateBody(createCropSchema),
  async (req, res, next) => {
    try {
      const crop = await createCrop(req.validatedBody);
      return res.status(201).json({
        message: 'Культура добавлена',
        data: crop,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  '/:id',
  requireAuth,
  requireModuleAccess('crops'),
  requireRole('admin', 'agronomist'),
  requireCsrf,
  validateBody(updateCropSchema),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор культуры' });
    }

    try {
      const crop = await updateCrop(id, req.validatedBody);
      return res.json({
        message: 'Культура обновлена',
        data: crop,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
