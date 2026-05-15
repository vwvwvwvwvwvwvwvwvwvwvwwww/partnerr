import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createTechnologyCardSchema, updateTechnologyCardSchema } from './planning.schemas.js';
import { createTechnologyCard, listTechnologyCards, updateTechnologyCard } from './planning.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('planning'), async (req, res, next) => {
  try {
    const cards = await listTechnologyCards();
    return res.json({ data: cards });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireModuleAccess('planning'),
  requireCsrf,
  validateBody(createTechnologyCardSchema),
  async (req, res, next) => {
    try {
      const card = await createTechnologyCard(req.validatedBody, req.user.id);
      return res.status(201).json({
        message: 'Технологическая карта создана',
        data: card,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  '/:id',
  requireAuth,
  requireModuleAccess('planning'),
  requireCsrf,
  validateBody(updateTechnologyCardSchema),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор техкарты' });
    }

    try {
      const card = await updateTechnologyCard(id, req.validatedBody);
      return res.json({
        message: 'Технологическая карта обновлена',
        data: card,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
