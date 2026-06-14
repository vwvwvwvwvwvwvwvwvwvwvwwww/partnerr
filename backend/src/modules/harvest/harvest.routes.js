import express from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createWaybillSchema, updateWaybillSchema } from './harvest.schemas.js';
import { createWaybill, listWaybills, updateWaybill } from './harvest.service.js';
import {
  getSmtpStatus,
  listDriverContacts,
  sendWaybillEmail,
} from './waybill-email.service.js';

const router = express.Router();

/** Статус SMTP (для подсказки в интерфейсе урожая) */
router.get('/email-status', requireAuth, requireModuleAccess('harvest'), async (req, res, next) => {
  try {
    const status = await getSmtpStatus();
    return res.json({ data: status });
  } catch (error) {
    return next(error);
  }
});

/** Список водителей с e-mail для автозаполнения формы путевого листа */
router.get('/drivers', requireAuth, requireModuleAccess('harvest'), async (req, res, next) => {
  try {
    const drivers = await listDriverContacts();
    return res.json({ data: drivers });
  } catch (error) {
    return next(error);
  }
});

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
      const email = await sendWaybillEmail(item.id);

      return res.status(201).json({
        message: 'Путевой лист добавлен',
        data: item,
        email,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  '/:id/send-email',
  requireAuth,
  requireModuleAccess('harvest'),
  requireRole('admin', 'agronomist', 'storekeeper'),
  requireCsrf,
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор путевого листа' });
    }

    try {
      const email = await sendWaybillEmail(id);

      return res.json({
        message: email.message,
        email,
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
      let email = null;

      if (req.body?.sendEmail === true) {
        email = await sendWaybillEmail(id);
      }

      return res.json({
        message: 'Путевой лист обновлен',
        data: item,
        ...(email ? { email } : {}),
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
