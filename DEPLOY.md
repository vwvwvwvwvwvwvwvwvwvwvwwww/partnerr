# Деплой на хостинг (VPS)

Стек: **PostgreSQL + PostGIS**, **Node.js 20+**, собранный **Vite**-фронт. В продакшене один процесс Node отдаёт API (`/api/...`) и SPA из `frontend/dist`.

## 1. Сервер

- PostgreSQL с PostGIS, БД и пользователь (см. корневой `README.md`).
- Node.js **20+**.

## 2. Установка зависимостей

Из **корня** репозитория:

```bash
npm run install:all
```

## 3. `backend/.env`

Скопируйте с `backend/.env.example`. Для продакшена обязательно:

| Переменная | Пример |
|------------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `4010` |
| `APP_ORIGIN` | `https://ваш-домен.ru` — URL из адресной строки (HTTPS) |
| `JWT_SECRET` | не короче **32** символов |
| `DB_*` | параметры PostgreSQL |

`FRONTEND_DIST` можно не указывать: при `NODE_ENV=production` ищется `frontend/dist` относительно текущего каталога запуска (`backend/..` или корень репозитория).

## 4. Сборка фронта

Создайте `frontend/.env.production` (образец: `frontend/.env.production.example`):

```env
VITE_API_URL=/api
```

Сборка из **корня**:

```bash
npm run build
```

## 5. Миграции и пользователи

```bash
NODE_ENV=production npm run migrate --prefix backend
NODE_ENV=production npm run create-admin --prefix backend
NODE_ENV=production npm run seed-staff --prefix backend
```

## 6. Запуск

Из **корня**:

```bash
npm run start:prod
```

Или из папки `backend`:

```bash
cd backend && NODE_ENV=production npm run start
```

Сайт: `APP_ORIGIN` (тот же хост, что у пользователя). За **nginx** проксируйте `https://домен` → `http://127.0.0.1:4010`, сертификат Let’s Encrypt.

## 7. Раздача только nginx (без статики из Node)

Соберите фронт с `VITE_API_URL=https://домен/api`, укажите в nginx `root` на `dist`, прокси `/api` на Node. В `backend/.env` оставьте `APP_ORIGIN` и при необходимости пустой `FRONTEND_DIST` и удалите/не создавайте `frontend/dist` на сервере — тогда Node не будет монтировать SPA (или задайте несуществующий путь и положите только API).
