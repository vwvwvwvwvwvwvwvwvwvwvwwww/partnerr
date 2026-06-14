import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import {
  buildSummaryDocxFromExport,
  createSummaryReport,
  getReportExportById,
  listReportExports,
} from './reports.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('reports'), async (req, res, next) => {
  try {
    const items = await listReportExports();
    return res.json({ data: items });
  } catch (error) {
    return next(error);
  }
});

router.get(
  '/summary.docx',
  requireAuth,
  requireModuleAccess('reports'),
  async (req, res, next) => {
    try {
      const { buffer, fileName } = await createSummaryReport(req.user);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/:id/docx',
  requireAuth,
  requireModuleAccess('reports'),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор отчёта' });
    }

    try {
      const exportRow = await getReportExportById(id);

      if (!exportRow) {
        return res.status(404).json({ error: 'Отчёт не найден' });
      }

      if (exportRow.reportType !== 'summary') {
        return res.status(400).json({ error: 'Тип отчёта не поддерживается' });
      }

      const { buffer, fileName } = await buildSummaryDocxFromExport(req.user, exportRow);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
