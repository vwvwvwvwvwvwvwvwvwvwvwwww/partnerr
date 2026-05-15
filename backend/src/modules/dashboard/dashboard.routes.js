import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { getDashboardSummary } from './dashboard.service.js';

const router = express.Router();

router.get('/summary', requireAuth, requireModuleAccess('dashboard'), async (req, res, next) => {
  try {
    const summary = await getDashboardSummary();
    return res.json({ data: summary });
  } catch (error) {
    return next(error);
  }
});

export default router;
