import crypto from 'crypto';
import { env, isProduction } from '../config/env.js';

export function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');

  res.cookie(env.CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: isProduction,
    path: '/',
  });

  return token;
}

export function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.[env.CSRF_COOKIE_NAME];
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Некорректный CSRF-токен' });
  }

  return next();
}
