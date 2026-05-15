import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { buildSummaryDocx } from './reports.service.js';

const router = express.Router();

router.get(
  '/summary.docx',
  requireAuth,
  requireModuleAccess('reports'),
  async (req, res, next) => {
    try {
      const buffer = await buildSummaryDocx(req.user);
      const filename = `agro-erp-svodka-${new Date().toISOString().slice(0, 10)}.docx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
