import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createFieldSchema, updateFieldSchema } from './fields.schemas.js';
import { createField, listFields, updateField } from './fields.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('fields'), async (req, res, next) => {
  try {
    const fields = await listFields();
    return res.json({ data: fields });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireModuleAccess('fields'),
  requireCsrf,
  validateBody(createFieldSchema),
  async (req, res, next) => {
    try {
      const field = await createField(req.validatedBody, req.user.id);
      return res.status(201).json({
        message: 'Поле успешно создано',
        data: field,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  '/:id',
  requireAuth,
  requireModuleAccess('fields'),
  requireCsrf,
  validateBody(updateFieldSchema),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор поля' });
    }

    try {
      const field = await updateField(id, req.validatedBody);
      return res.json({
        message: 'Поле обновлено',
        data: field,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
