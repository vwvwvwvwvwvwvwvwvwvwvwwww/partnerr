# Деплой на [Railway](https://railway.com) (из GitHub)

В корне репозитория есть **`railway.json`**: сборка фронта, миграции перед стартом, `healthcheck` на `/api/health`. Подробности по конфигу в коде: [Config as Code](https://docs.railway.com/reference/config-as-code).

## 1. Проект из GitHub

1. Откройте [New project → GitHub](https://railway.com/new/github) и выберите репозиторий с Agro ERP.
2. Railway создаст сервис с деплоем из ветки по умолчанию; при необходимости в настройках сервиса укажите ветку **`main`**.

## 2. База данных с PostGIS

Приложению нужны расширения **PostGIS** и **pgcrypto** (см. миграции `001_init_extensions.sql`).

Обычный шаблон **PostgreSQL** на Railway **не содержит** PostGIS. Удобнее добавить сервис из шаблона с PostGIS, например:

- [Deploy PG 17 + PostGIS](https://railway.com/deploy/postgis-17) или аналог «PostGIS» в каталоге шаблонов Railway.

После создания БД в сервисе **приложения** (Node) в **Variables** добавьте ссылку на строку подключения:

- **Variable** `DATABASE_URL` → **Add Reference** → сервис Postgres/PostGIS → переменная **`DATABASE_URL`** (или `DATABASE_PUBLIC_URL`, если подключаетесь снаружи Railway — для одного сервиса внутри проекта обычно достаточно внутреннего URL).

Документация по переменным и ссылкам между сервисами: [Variables](https://docs.railway.com/guides/variables).

## 3. Переменные окружения (сервис приложения)

| Переменная | Значение |
|------------|----------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Случайная строка **не короче 32 символов** |
| `VITE_API_URL` | `/api` (нужна при **build** фронта) |
| `DATABASE_URL` | Ссылка на БД (см. выше) |
| `APP_ORIGIN` | Публичный URL сервиса после первого деплоя, например `https://ваш-сервис.up.railway.app` (**без** слэша в конце). После смены домена обновите и сделайте redeploy. |

Railway подставляет **`PORT`** сам — backend уже читает его из окружения.

## 4. Сборка и старт

Задаются в **`railway.json`**:

- **Build:** `npm install && npm run install:all && npm run build`
- **Start:** `NODE_ENV=production npm run start --prefix backend`
- **Pre-deploy:** `NODE_ENV=production npm run migrate` (миграции из `backend/migrations`)

Если первый деплой падает на **Pre-deploy** (например, до появления `DATABASE_URL` или из‑за расширений БД), временно уберите `preDeployCommand` из `railway.json` или выполните миграции один раз в [Railway Shell](https://docs.railway.com/guides/cli#shell), затем верните конфиг.

## 5. Проверка

- В логах после старта: `ERP backend запущен на порту …`
- В браузере: `https://…/api/health` → `{"status":"ok"}`
- Затем создайте администратора (см. корневой README / скрипты `create-admin`).

## 6. Полезные ссылки

- [Документация Railway](https://docs.railway.com/)
- [PostgreSQL на Railway](https://docs.railway.com/databases/postgresql)
- [Pre-deploy command](https://docs.railway.com/deployments/pre-deploy-command)
