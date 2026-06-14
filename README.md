# Партнер

Локальная ERP-система сельскохозяйственного предприятия на `React + Vite`, `Node.js + Express`, `PostgreSQL + PostGIS` без ORM.

## Что уже реализовано

- безопасная cookie-auth с `HttpOnly` JWT и CSRF double-submit token;
- backend API с валидацией через `zod`;
- только параметризованные SQL-запросы через `pg`;
- модуль `Поля и ГИС` с картой **OpenStreetMap** (Leaflet, без API-ключа);
- модуль `Техника`;
- модуль `Культуры`;
- страницы под остальные ERP-модули;
- SQL-миграции и скрипт создания администратора;
- локальная база **SQLite** (по умолчанию, файл `backend/data/agro_erp.sqlite`) — **без Postgres на хостинге**;
- опционально PostgreSQL + PostGIS для локальной разработки (`DB_DRIVER=postgres`);
- **роли и ограничение разделов** по должностям (см. `backend/src/config/module-access.js`);
- **отчёты в Word** (`/reports`, API `GET /api/reports/summary.docx`).

## ⚠️ Папка «диплом» (кириллица в пути) — сайт не стартует

На macOS Node/Vite часто падают с **`ECANCELED`** или **`ETIMEDOUT`** при чтении файлов.

**Решение (любое одно):**

```bash
cd ~/Desktop
mv диплом diploma
cd diploma
npm run dev
```

или из текущей папки:

```bash
npm run dev:latin
```

(копия в `~/Desktop/agro-erp-partner`, первый раз — установка зависимостей).

В терминал **не вставляйте** строки с `#` — это комментарий, zsh напишет `command not found: #`.

---

## Самый простой запуск (из корня папки проекта)

Нужны **Node.js 20+**. **PostgreSQL не обязателен** — по умолчанию используется SQLite.

В терминале перейди в корень репозитория (где лежит `package.json`):

```bash
cd /путь/к/диплом
```

**Один раз** выполни:

```bash
npm run bootstrap
npm run dev
```

Что делает **`npm run bootstrap`** (достаточно один раз, потом при необходимости повторить):

- создаёт `backend/.env` и `frontend/.env` из примеров, если их ещё нет;
- ставит зависимости в корне, в `backend` и `frontend`;
- применяет миграции;
- создаёт администратора **`admin`** с паролем **`Admin12345Secure!`**;
- создаёт учётки сотрудников (агрономы, механики, кладовщики, бухгалтеры) с тем же паролем — список в `backend/src/scripts/seed-staff-accounts.js` (ФИО можно заменить на свои).

Команда **`npm run dev`** запускает backend и frontend (браузер откроется сам, см. Vite).

Открой в браузере: **http://127.0.0.1:8848** (если порт 8848 занят — смотри в терминале строку `Local:` у Vite) — вход **`admin`** / **`Admin12345Secure!`**. Учётные записи сотрудников: логины `agronom`, `agronom2`, `mechanic`, `kladovshik`, `buhgalter` и др. (см. скрипт выше), **тот же пароль**.

## Роли на сайте и отчёты

| Роль | Разделы |
|------|---------|
| **admin** | всё, включая «Сотрудники» |
| **agronomist** | сводка, поля, техкарты, культуры (редакт.), техника (только просмотр), урожай (редакт.), отчёты |
| **mechanic** | сводка, техника (редакт.), отчёты нет |
| **storekeeper** | сводка, культуры (просмотр), склад, урожай (редакт.), отчёты нет |
| **accountant** | сводка, финансы, урожай (просмотр), отчёты |

Сводный отчёт: меню **«Отчёты»** → кнопка скачивания файла **`.docx`**. Логика доступа на backend дублируется (без прав вернётся 403).

Если список сотрудников в дипломе другой — отредактируйте массив `staff` в `backend/src/scripts/seed-staff-accounts.js` и выполните `npm run seed-staff` из корня или повторно `npm run bootstrap`.

## Локальная база PostgreSQL + PostGIS (Mac / Homebrew)

Если база уже настроена вручную в `backend/.env`, достаточно **`npm run bootstrap`** (один раз) и дальше **`npm run dev`**.

### 1. Установи PostgreSQL и PostGIS (Homebrew на Mac)

Свежий **`postgis`** из Homebrew часто поставляет файлы расширения только для **PostgreSQL 17 или 18**, а не для 16. Скрипт `scripts/init-local-db.sh` сам выберет первую подходящую пару (например **postgresql@17** + postgis). Если у тебя уже крутится только **postgresql@16** на порту 5432 и миграции ругаются на PostGIS — поставь 17 и при необходимости останови 16:

```bash
brew install postgresql@17 postgis
brew services stop postgresql@16   # только если мешает порт или не нужен
brew services start postgresql@17
```

Вариант с явной версией: `POSTGRES_BREW_PKG=postgresql@18 ./scripts/init-local-db.sh` (если установлен **postgresql@18** и для него есть `postgis.control` в пакете postgis).

Подожди несколько секунд, пока сервис поднимется.

### 2. Создай пользователя, базу и расширения

Из **корня** репозитория `диплом`:

```bash
chmod +x scripts/init-local-db.sh
./scripts/init-local-db.sh
```

Скрипт **сам создаёт симлинки** из пакета `postgis` в каталог `share/postgresql@<версия>/extension` твоего PostgreSQL (иначе типичная ошибка: `extension "postgis" is not available`). Если что-то не сходится — **`brew reinstall postgresql@17 postgis`** и снова **`./scripts/init-local-db.sh`**.

Альтернатива без симлинков: [**Postgres.app**](https://postgresapp.com/) (в сборке уже есть PostGIS) — добавь в `PATH` каталог `…/Postgres.app/Contents/Versions/<версия>/bin`, создай БД через его `psql` и те же `CREATE EXTENSION`.

```bash
DB_PASSWORD='МойПароль123' ./scripts/init-local-db.sh
```

Тогда в **`backend/.env`** укажи тот же **`DB_PASSWORD`**.

### 3. Один раз настрой проект

```bash
cd /путь/к/диплом
npm run bootstrap
```

(алиас **`npm run bootstrap:nodocker`** то же самое, оставлен для привычки.)

### 4. Каждый день запуск сайта

```bash
npm run dev
```

Сайт: **http://127.0.0.1:8848** (в адресе **не** используй `www.`; в терминале Vite смотри точный порт, если 8848 занят).

---

## Подробная инструкция по шагам

Ниже — тот же процесс вручную, если не используете `bootstrap` / `npm run dev` из корня.

### 1. Подготовка

Нужны установленные:

- `Node.js` 20+;
- `npm`;
- свой PostgreSQL **16+** с **PostGIS** (на Mac с Homebrew удобнее **17+**, см. шаг 1 выше).

### 2. Создай env-файлы

Скопируй примеры:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Скопируй примеры и при необходимости поправь `backend/.env` под свой Postgres (значения по умолчанию — в `backend/.env.example`).

### 3. Убедись, что PostgreSQL + PostGIS запущены

Используй **`./scripts/init-local-db.sh`** (см. выше) или свой уже настроенный инстанс. Проверка подключения:

```bash
psql "postgresql://USER:PASS@127.0.0.1:5432/ИМЯ_БД" -c "SELECT 1"
```

### 4. Установи зависимости

Если они уже установлены, шаг можно пропустить.

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 5. Выполни миграции

```bash
cd backend
npm run migrate
```

### 6. Создай администратора

Пример:

```bash
cd backend
ADMIN_USERNAME=admin ADMIN_PASSWORD='Admin12345Secure!' ADMIN_FULL_NAME='Главный администратор' npm run create-admin
```

### 7. Запусти backend

В первом терминале:

```bash
cd backend
npm run dev
```

Backend будет доступен на:

```text
http://localhost:4010
```

### 8. Запусти frontend

Во втором терминале:

```bash
cd frontend
npm run dev
```

Frontend будет доступен на:

```text
http://127.0.0.1:8848
```

### 9. Войди в систему

Открой в браузере:

```text
http://127.0.0.1:8848
```

Не открывайте старые закладки `http://localhost:5173` или `:4000` — на этих портах у вас может висеть другой проект, поэтому в браузере и показывается «чужой» сайт.

Используй логин и пароль администратора, которые создал на шаге 6 (или из `npm run bootstrap`: `admin` / `Admin12345Secure!`).

## Остановка

Остановить frontend/backend можно через `Ctrl+C` в терминалах.

Остановить локальный PostgreSQL из Homebrew (если ставили через `brew services`):

```bash
brew services stop postgresql@17
```

(версию подставь свою.)

## Если сайт не запускается

### Mac с чипом Apple Silicon (M1 / M2 / M3)

Если PostGIS ругается на отсутствие файлов расширения — следуй разделу выше: **`brew install postgresql@17 postgis`** и **`./scripts/init-local-db.sh`** (скрипт создаёт нужные симлинки).

### Ошибка подключения к БД

Проверь:

- запущен ли PostgreSQL (`brew services list` или свой способ);
- совпадают ли `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` в `backend/.env`;
- выполнены ли миграции.

### Не удается войти

После `npm run bootstrap` используйте **`admin`** / **`Admin12345Secure!`**. Иначе проверь, что администратор создан командой `npm run create-admin`.

### Нет подключения к БД

В репозитории **нет** Docker Compose: подними **Postgres + PostGIS** отдельно (Homebrew + **`scripts/init-local-db.sh`**, Postgres.app или VPS), пропиши доступ в **`backend/.env`**, затем:

```bash
npm run bootstrap
npm run dev
```

### Пустые страницы или ошибки API

Проверь:

- запущен ли backend на порту из `PORT` в `backend/.env` (по умолчанию `4010`);
- запущен ли frontend: в терминале Vite пишет точный `Local` URL (по умолчанию порт **8848**);
- совпадают ли `VITE_API_URL` во `frontend/.env` и `PORT` в `backend/.env`.

### На localhost открывается не этот сайт

Порт, который вы вводите в адресной строке, должен совпадать с тем, что вывел `npm run dev` у **frontend**. Если открыть занятый другим приложением порт (часто `5173` или `4000`), браузер покажет то другое приложение. В этом проекте по умолчанию заданы порты **8848** (сайт) и **4010** (API); их можно сменить в `frontend/.env` (`VITE_DEV_PORT`, `VITE_API_URL`) и `backend/.env` (`PORT`, `APP_ORIGIN`). Для входа и cookies **хост фронта и `VITE_API_URL` должны совпадать** (лучше везде `127.0.0.1`, не смешивать с `localhost`).

## Публикация на хостинге

**Пошагово:** [docs/GITHUB-AND-HOST.md](docs/GITHUB-AND-HOST.md) — новый GitHub-репозиторий и деплoy.

Кратко: **`DEPLOY-RAILWAY.md`** (Railway, SQLite), **`DEPLOY-RENDER.md`**, **`render.yaml`**.

На хостинге достаточно одного Web-сервиса: `DB_DRIVER=sqlite`, `JWT_SECRET`, `NODE_ENV=production`, `VITE_API_URL=/api`.

## Важно

- проект рассчитан на локальную сеть предприятия;
- ORM не используется;
- для всех записей в БД применяются prepared statements;
- текущая версия является безопасным MVP, который можно расширять модулями склада, логистики и финансов.
