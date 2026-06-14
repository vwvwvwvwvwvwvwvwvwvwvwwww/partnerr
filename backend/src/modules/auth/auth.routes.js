import express from 'express';
import { validateBody } from '../../middleware/validate.js';
import { loginSchema } from './auth.schemas.js';
import { authenticateUser, clearAuthCookies, setAuthCookies } from './auth.service.js';
import { requireAuth } from '../../middleware/auth.js';
import { issueCsrfToken, requireCsrf } from '../../middleware/csrf.js';

const router = express.Router();

router.get('/csrf', (req, res) => {
  const csrfToken = issueCsrfToken(res);
  return res.json({ csrfToken });
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const user = await authenticateUser(req.validatedBody);

    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    setAuthCookies(res, user);

    return res.json({
      message: 'Вход выполнен успешно',
      data: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', requireAuth, requireCsrf, (req, res) => {
  clearAuthCookies(res);
  return res.json({ message: 'Выход выполнен' });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ data: req.user });
});

export default router;

