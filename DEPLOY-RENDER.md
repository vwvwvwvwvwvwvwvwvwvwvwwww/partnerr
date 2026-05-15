# Деплой на [Render](https://render.com)

Проект уже поддерживает **`DATABASE_URL`** (подставляется из Render Postgres) и собирает фронт с **`frontend/.env.production`** (`VITE_API_URL=/api`).

## 0. Репозиторий

Закоммитьте изменения и залейте код в **GitHub** или **GitLab** (Render подключается к git).

## 1. PostgreSQL на Render

1. [Dashboard](https://dashboard.render.com) → **New +** → **PostgreSQL**.
2. Имя, регион, план (можно **Free**).
3. Создай базу. Открой **Connect** / **Shell** / **Query** и выполни **до** первого успешного `migrate`:

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

   Если `postgis` недоступен на вашем плане/регионе — напиши в поддержку Render или используй платный инстанс / внешнюю БД с PostGIS.

## 2. Web Service (один сервис = API + SPA)

1. **New +** → **Web Service** → подключи репозиторий.
2. Настройки:
   - **Root Directory** — корень репозитория (`.`).
   - **Build Command** (без символа `$` в начале строки):

     ```bash
     npm install && npm run install:all && npm run build
     ```

     На Render часто задано `NODE_ENV=production`; тогда `npm install` **без флага** не ставит **devDependencies**, и **`vite` не находится** при сборке. Скрипт **`install:all`** в репозитории использует для frontend **`npm install --include=dev`**, чтобы Vite ставился и на production-сборке.

     Если Render подставил шаблон вида `$ npm install` — **удали `$`**, иначе shell может вернуть **ошибку 127** («команда не найдена»).
   - **Start Command:** `NODE_ENV=production node backend/src/server.js` (из корня репозитория; тот же вариант, что в `render.yaml`).
   - **Health Check Path** (вкладка сервиса → **Settings** → блок про health / availability): **`/api/health`** или **`/health`** (ответ **200**, без редиректа на логин).
3. **Environment** (переменные):
   - `NODE_ENV` = `production`
   - **`DATABASE_URL`** — **Internal Database URL** из созданной Postgres (копируется из вкладки подключения к БД; либо привяжи БД через **Link Database** в UI — Render сам добавит `DATABASE_URL`).
   - **`APP_ORIGIN`** — публичный URL вида `https://….onrender.com` (**без** `/` в конце). Render добавляет **`RENDER_EXTERNAL_URL`**; в коде **`APP_ORIGIN` подставится сам**, если переменную не задали. При смене домена лучше задать явно и сделать **Manual Deploy**.
   - **`JWT_SECRET`** — случайная строка **≥ 32 символов**.
   - **`VITE_API_URL`** = `/api` (нужна для сборки; можно добавить в группе «Build» / общие env — на Render обычно доступны и при build, и при runtime).

4. **Миграции БД** после первого успешного деплоя: **Shell** у Web Service → `npm run migrate --prefix backend` (или из корня тот же скрипт). Расширения PostGIS в БД — см. п. 1.

5. **Create Web Service** и дождись сборки.

## 3. Через Blueprint (`render.yaml`)

1. В корне репозитория уже есть **`render.yaml`**.
2. Dashboard → **Blueprints** → **New Blueprint Instance** → выбери репозиторий.
3. При применении укажи **`JWT_SECRET`** (если спросит). **`APP_ORIGIN`** можно не задавать — подставится из **`RENDER_EXTERNAL_URL`** на Render.
4. Не забудь шаг с **PostGIS** в новой БД (см. п. 1).

После деплоя при необходимости сверь **`APP_ORIGIN`** с публичным URL (или оставь авто из `RENDER_EXTERNAL_URL`) — иначе CORS и cookies могут мешать.

## 4. Администратор и сотрудники

В **Shell** Web Service (или локально с `DATABASE_URL`):

```bash
NODE_ENV=production npm run create-admin --prefix backend
NODE_ENV=production npm run seed-staff --prefix backend
```

Передай пароли через переменные окружения (`ADMIN_PASSWORD`, `SEED_STAFF_PASSWORD`), как в корневом `README` / `УЧЕТНЫЕ_ДАННЫЕ_ВХОДА.md`.

## 5. Ограничения Free

- Сервис «засыпает» без трафика — первый заход может быть с задержкой.
- Бесплатная БД имеет срок и лимиты — для диплома обычно достаточно; для продакшена смотри [Pricing](https://render.com/pricing).

## 6. Полезные ссылки

- [Render Docs](https://render.com/docs)
- [Blueprint spec](https://render.com/docs/blueprint-spec)
- [Deploy Node](https://render.com/docs/deploy-node-express-app)
