import { isProduction } from '../config/env.js';

export function notFoundHandler(req, res) {
  return res.status(404).json({ error: 'Маршрут не найден' });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error:
        'Не удалось подключиться к PostgreSQL. Запустите базу (Docker или brew services) и проверьте DB_HOST, DB_PORT в backend/.env.',
    });
  }

  if (error.code === '42P01') {
    return res.status(503).json({
      error: isProduction
        ? 'Сервис временно недоступен'
        : 'В базе нет таблиц приложения. Из корня проекта выполните: npm run migrate, затем npm run bootstrap (или npm run create-admin и npm run seed-staff).',
    });
  }

  if (error.code === '23505') {
    return res.status(409).json({
      error: 'Запись с такими уникальными данными уже существует',
    });
  }

  if (error.code === '23503') {
    return res.status(400).json({
      error: 'Нарушена ссылочная целостность данных',
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  return res.status(500).json({
    error: 'Внутренняя ошибка сервера',
  });
}
