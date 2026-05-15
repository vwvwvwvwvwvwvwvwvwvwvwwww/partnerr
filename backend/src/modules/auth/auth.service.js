import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { query } from '../../db/pool.js';
import { env, isProduction } from '../../config/env.js';
import { issueCsrfToken } from '../../middleware/csrf.js';

export async function authenticateUser({ username, password }) {
  const text = `
    SELECT id, username, password_hash, full_name, role
    FROM app_users
    WHERE username = $1 AND is_active = TRUE
    LIMIT 1
  `;

  const result = await query({
    name: 'auth-find-user-by-username',
    text,
    values: [username],
  });
  const user = result.rows[0];

  if (!user) {
    return null;
  }

  const isValid = await argon2.verify(user.password_hash, password);

  if (!isValid) {
    return null;
  }

  return user;
}

export function setAuthCookies(res, user) {
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: `${env.JWT_EXPIRES_MINUTES}m`,
    },
  );

  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    path: '/',
    maxAge: env.JWT_EXPIRES_MINUTES * 60 * 1000,
  });

  issueCsrfToken(res);
}

export function clearAuthCookies(res) {
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/' });
  res.clearCookie(env.CSRF_COOKIE_NAME, { path: '/' });
}
