import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireModuleAccess } from '../../middleware/module-access.js';
import { requireCsrf } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.schemas.js';
import { createEmployee, listEmployees, updateEmployee } from './employees.service.js';

const router = express.Router();

router.get('/', requireAuth, requireModuleAccess('employees'), async (req, res, next) => {
  try {
    const employees = await listEmployees();
    return res.json({ data: employees });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireModuleAccess('employees'),
  requireCsrf,
  validateBody(createEmployeeSchema),
  async (req, res, next) => {
    try {
      const employee = await createEmployee(req.validatedBody);
      return res.status(201).json({
        message: 'Сотрудник добавлен',
        data: employee,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  '/:id',
  requireAuth,
  requireModuleAccess('employees'),
  requireCsrf,
  validateBody(updateEmployeeSchema),
  async (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный идентификатор сотрудника' });
    }

    try {
      const employee = await updateEmployee(id, req.validatedBody);
      return res.json({
        message: 'Сотрудник обновлен',
        data: employee,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
