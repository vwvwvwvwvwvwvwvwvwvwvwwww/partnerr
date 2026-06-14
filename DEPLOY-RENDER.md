# Деплой на [Render](https://render.com)

**SQLite** по умолчанию — отдельная PostgreSQL **не нужна**.

Пошагово: [docs/GITHUB-AND-HOST.md](docs/GITHUB-AND-HOST.md).

## 1. Blueprint (рекомендуется)

1. Залейте код в GitHub.
2. [Dashboard](https://dashboard.render.com) → **Blueprints** → **New Blueprint Instance** → репозиторий.
3. Задайте **`JWT_SECRET`** (≥ 32 символов).
4. Дождитесь деплоя.

В корне уже есть **`render.yaml`** с `DB_DRIVER=sqlite`.

## 2. Переменные окружения

| Переменная | Значение |
|------------|----------|
| `NODE_ENV` | `production` |
| `DB_DRIVER` | `sqlite` |
| `SQLITE_PATH` | `./backend/data/agro_erp.sqlite` |
| `VITE_API_URL` | `/api` |
| `JWT_SECRET` | ≥ 32 символов |
| `APP_ORIGIN` | опционально (авто из `RENDER_EXTERNAL_URL`) |

**Health Check Path:** `/api/health`

**Start Command:** `npm run start:railway`

## 3. Первый запуск (Shell)

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD='ВашПароль' ADMIN_FULL_NAME='Администратор' npm run create-admin --prefix backend
SEED_STAFF_PASSWORD='ВашПароль' npm run seed-staff --prefix backend
npm run seed-sqlite-demo --prefix backend
```

## 4. Ограничения Free

- Сервис «засыпает» без трафика.
- Файл SQLite может сброситься при пересборке — повторите seed в Shell.

## 5. Ссылки

- [Render Docs](https://render.com/docs)
- [Blueprint spec](https://render.com/docs/blueprint-spec)
