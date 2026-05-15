# Agro ERP

Локальная ERP-система сельскохозяйственного предприятия на `React + Vite`, `Node.js + Express`, `PostgreSQL + PostGIS` без ORM.

## Что уже реализовано

- безопасная cookie-auth с `HttpOnly` JWT и CSRF double-submit token;
- backend API с валидацией через `zod`;
- только параметризованные SQL-запросы через `pg`;
- модуль `Поля и ГИС` с картой `Leaflet`;
- модуль `Техника`;
- модуль `Культуры`;
- страницы под остальные ERP-модули;
- SQL-миграции и скрипт создания администратора;
- `docker-compose` для быстрого запуска `PostgreSQL + PostGIS`;
- **роли и ограничение разделов** по должностям (см. `backend/src/config/module-access.js`);
- **отчёты в Word** (`/reports`, API `GET /api/reports/summary.docx`).

## Самый простой запуск (из корня папки проекта)

Нужны **Node.js 20+** и **Docker Desktop** (PostgreSQL с PostGIS поднимется сам). **Без Docker** — см. раздел **«Без Docker (PostgreSQL на Mac через Homebrew)»** ниже на этой странице.

В терминале перейди в корень репозитория (где лежит `package.json` и `docker-compose.yml`):

```bash
cd /путь/к/диплом
npm run bootstrap
npm run dev
```

Что делает **`npm run bootstrap`** (достаточно один раз, потом при необходимости повторить):

- создаёт `backend/.env` и `frontend/.env` из примеров, если их ещё нет;
- ставит зависимости в корне, в `backend` и `frontend`;
- выполняет `docker compose up` и ждёт готовности базы;
- применяет миграции;
- создаёт администратора **`admin`** с паролем **`Admin12345Secure!`**;
- создаёт учётки сотрудников (агрономы, механики, кладовщики, бухгалтеры) с тем же паролем — список в `backend/src/scripts/seed-staff-accounts.js` (ФИО можно заменить на свои).

Команда **`npm run dev`** запускает backend и frontend **без Docker** (браузер откроется сам, см. Vite). Чтобы перед этим поднять Postgres в Docker: **`npm run dev:docker`**.

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

## Без Docker (PostgreSQL на Mac через Homebrew)

Docker **не нужен** для ежедневного **`npm run dev`**. Для **`npm run bootstrap`** без контейнера задайте **`SKIP_DOCKER=1`** (или используйте **`npm run bootstrap:nodocker`**).

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

### 3. Один раз настрой проект без Docker

```bash
cd /путь/к/диплом
npm run bootstrap:nodocker
```

(или вручную: `SKIP_DOCKER=1 npm run bootstrap`)

### 4. Каждый день запуск сайта без Docker

```bash
npm run dev
```

Сайт: **http://127.0.0.1:8848** (в адресе **не** используй `www.`; в терминале Vite смотри точный порт, если 8848 занят).

---

Если PostgreSQL уже был установлен раньше и `backend/.env` настроен вручную: достаточно **`SKIP_DOCKER=1 npm run bootstrap`** (один раз) и дальше **`npm run dev`**.

## Подробная инструкция по шагам

Ниже — тот же процесс вручную, если не используете `bootstrap` / `npm run dev` из корня.

### 1. Подготовка

Нужны установленные:

- `Node.js` 20+;
- `npm`;
- `Docker` и `Docker Compose` (или свой PostgreSQL **16+** с **PostGIS**; на Mac с Homebrew удобнее **17+**, см. шаг 1 выше).

### 2. Создай env-файлы

Скопируй примеры:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Если работаешь по инструкции ниже через `docker-compose`, можно оставить значения по умолчанию из `backend/.env.example`.

### 3. Подними PostgreSQL + PostGIS

Из корня проекта выполни:

```bash
docker compose up -d
```

Проверить, что база запустилась:

```bash
docker compose ps
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

Остановить базу:

```bash
docker compose down
```

Если нужно остановить базу и удалить данные:

```bash
docker compose down -v
```

## Если сайт не запускается

### Mac с чипом Apple Silicon (M1 / M2 / M3)

Образ **`postgis/postgis:16-3.4`** в Docker Hub сейчас **без нативного arm64** для этого тега: на Mac с Apple Silicon Docker поднимает контейнер как **linux/amd64** (эмуляция). В логах может быть предупреждение про несовпадение платформы — **это нормально**. Первый запуск и `docker compose up` могут занять **1–3 минуты**; в `docker-compose.yml` для healthcheck задан больший `start_period`, чтобы реже «залипать» на `Waiting`.

Явно указывать `platform: linux/arm64` для этого образа **нельзя** — Docker выдаст ошибку, что у образа нет такой платформы.

### Ошибка подключения к БД

Проверь:

- запущен ли `docker compose`;
- совпадают ли `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` в `backend/.env`;
- выполнены ли миграции.

### Не удается войти

После `npm run bootstrap` используйте **`admin`** / **`Admin12345Secure!`**. Иначе проверь, что администратор создан командой `npm run create-admin`.

### Docker не нужен / не запускается

Настройте `backend/.env` на свой PostgreSQL с PostGIS, затем:

```bash
SKIP_DOCKER=1 npm run bootstrap
npm run dev
```

### Пустые страницы или ошибки API

Проверь:

- запущен ли backend на порту из `PORT` в `backend/.env` (по умолчанию `4010`);
- запущен ли frontend: в терминале Vite пишет точный `Local` URL (по умолчанию порт **8848**);
- совпадают ли `VITE_API_URL` во `frontend/.env` и `PORT` в `backend/.env`.

### На localhost открывается не этот сайт

Порт, который вы вводите в адресной строке, должен совпадать с тем, что вывел `npm run dev` у **frontend**. Если открыть занятый другим приложением порт (часто `5173` или `4000`), браузер покажет то другое приложение. В этом проекте по умолчанию заданы порты **8848** (сайт) и **4010** (API); их можно сменить в `frontend/.env` (`VITE_DEV_PORT`, `VITE_API_URL`) и `backend/.env` (`PORT`, `APP_ORIGIN`). Для входа и cookies **хост фронта и `VITE_API_URL` должны совпадать** (лучше везде `127.0.0.1`, не смешивать с `localhost`).

## Публикация на хостинге (VPS)

Краткая инструкция: **`DEPLOY.md`** (VPS). Деплой на **Render**: **`DEPLOY-RENDER.md`** и **`render.yaml`**.

## Важно

- проект рассчитан на локальную сеть предприятия;
- ORM не используется;
- для всех записей в БД применяются prepared statements;
- текущая версия является безопасным MVP, который можно расширять модулями склада, логистики и финансов.
