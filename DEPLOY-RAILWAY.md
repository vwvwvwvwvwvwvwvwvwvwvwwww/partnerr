# Деплой на [Railway](https://railway.com) (из GitHub)

В корне репозитория **`railway.json`**: сборка и старт.

**База данных:** по умолчанию **SQLite** (файл `backend/data/agro_erp.sqlite`). **Отдельный Postgres/PostGIS не нужен** — достаточно одного Web-сервиса.

## 1. Проект из GitHub

1. [New project → GitHub](https://railway.com/new/github) → репозиторий «Партнер».
2. При необходимости в сервисе укажите ветку **`main`**.

## 2. Переменные (сервис приложения)

| Переменная | Обязательно | Значение |
|------------|-------------|----------|
| `DB_DRIVER` | да | `sqlite` |
| `SQLITE_PATH` | нет | `./data/agro_erp.sqlite` (по умолчанию) |
| `JWT_SECRET` | да | ≥ **32** символов |
| `NODE_ENV` | да | `production` |
| `VITE_API_URL` | да | `/api` (для сборки фронта) |
| `APP_ORIGIN` | нет | Если не задать, подставится `https://` + `RAILWAY_PUBLIC_DOMAIN` |

`DATABASE_URL` и Postgres **не нужны**.

`PORT` задаёт Railway — backend его читает.

## 3. Сборка и старт (`railway.json`)

- **Build:** `npm install && npm run install:all && npm run build`
- **Start:** `npm run start:railway` — миграции SQLite + сервер

После первого деплоя в [Shell](https://docs.railway.com/guides/cli#shell):

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD='ВашНадёжныйПароль' ADMIN_FULL_NAME='Администратор' npm run create-admin --prefix backend
SEED_STAFF_PASSWORD='ВашНадёжныйПароль' npm run seed-staff --prefix backend
npm run seed-sqlite-demo --prefix backend
```

## 4. Проверка

1. Деплой **зелёный**
2. `https://…/api/health` → `{"status":"ok"}`
3. Вход: `admin` / ваш пароль

## 5. PostgreSQL (опционально)

Если нужен Postgres локально с PostGIS: `DB_DRIVER=postgres` и `DB_*` в `backend/.env`. Для хостинга это **не обязательно**.

## 6. Ссылки

- [Railway Docs](https://docs.railway.com/)
- [Public networking / домены](https://docs.railway.com/guides/public-networking)
